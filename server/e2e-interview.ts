/**
 * End-to-end smoke test for the video-interview invite + secure-link flow.
 * Run with:  npx tsx e2e-interview.ts   (MAIL_ENABLED=false, API on PORT)
 */
const BASE = `http://localhost:${process.env.PORT ?? 5000}/api/v1`;

let pass = 0;
let fail = 0;
const results: string[] = [];

const check = (name: string, ok: boolean, extra = "") => {
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? ` — ${extra}` : ""}`);
  ok ? pass++ : fail++;
};

const call = async (
  method: string,
  path: string,
  opts: { token?: string; body?: unknown } = {},
): Promise<{ status: number; data: any }> => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  return { status: res.status, data };
};

(async () => {
  const login = await call("POST", "/auth/login", {
    body: { email: "recruiter@techcorp.dev", password: "Recruit123!" },
  });
  check("recruiter login", login.status === 200, `status=${login.status}`);
  const token = login.data?.data?.accessToken as string | undefined;
  if (!token) {
    console.log(results.join("\n"));
    process.exit(1);
  }

  const missingWindow = await call("POST", "/interviews", {
    token,
    body: { title: "No window", technology: "javascript" },
  });
  check(
    "create rejects a missing active window",
    missingWindow.status === 422,
    `status=${missingWindow.status}`,
  );

  const now = Date.now();
  const created = await call("POST", "/interviews", {
    token,
    body: {
      title: "E2E Secured Interview",
      technology: "javascript",
      seniority: "MID",
      questionCount: 5,
      questionTimeSeconds: 120,
      startsAt: new Date(now - 60_000).toISOString(),
      expiresAt: new Date(now + 3_600_000).toISOString(),
      customQuestions: [],
      useBankQuestions: true,
    },
  });
  check("create interview with window", created.status === 201, `status=${created.status}`);
  const interviewId = created.data?.data?.id as string;
  const bankCount = (created.data?.data?.questions ?? []).length;
  check("random bank questions seeded (req 6)", bankCount > 0, `${bankCount} questions`);

  const bank = await call("GET", "/interviews/bank?technology=javascript", { token });
  check("browse question bank", bank.status === 200 && (bank.data?.data?.questions?.length ?? 0) > 0);
  // Pick a bank question that is NOT already part of the random set.
  const existingKeys = new Set(
    (created.data?.data?.questions ?? [])
      .map((q: { bankKey?: string | null }) => q.bankKey)
      .filter(Boolean),
  );
  const extraKey = (bank.data?.data?.questions ?? []).find(
    (q: { key: string }) => !existingKeys.has(q.key),
  )?.key as string;
  const fromBank = await call("POST", `/interviews/${interviewId}/questions/from-bank`, {
    token,
    body: { keys: [extraKey] },
  });
  check(
    "add questions from bank (req 6)",
    fromBank.status === 201,
    `status=${fromBank.status}`,
  );
  const duplicate = await call("POST", `/interviews/${interviewId}/questions/from-bank`, {
    token,
    body: { keys: [extraKey] },
  });
  check("duplicate bank question blocked", duplicate.status === 409, `status=${duplicate.status}`);

  const candidates = await call("GET", "/interviews/candidates?limit=5", { token });
  check(
    "search existing candidates (req 2)",
    candidates.status === 200 && Array.isArray(candidates.data?.data),
  );

  await call("POST", `/interviews/${interviewId}/publish`, { token });
  const invited = await call("POST", `/interviews/${interviewId}/invitations`, {
    token,
    body: {
      candidates: [{ email: "e2e.candidate@example.com", name: "E2E Candidate", sendEmail: false }],
    },
  });
  check("invite candidate (req 2/3)", invited.status === 201, `status=${invited.status}`);
  const sessionToken = invited.data?.data?.results?.[0]?.token as string;
  check("invite returns a personal link", Boolean(sessionToken));

  const info = await call("GET", `/interview-sessions/${sessionToken}`);
  check(
    "public link requires email verification (req 5)",
    info.status === 200 && info.data?.data?.requiresEmailVerification === true,
    `status=${info.status}`,
  );

  const earlyStart = await call("POST", `/interview-sessions/${sessionToken}/start`, {
    body: {
      consentGiven: true,
      candidateName: "E2E Candidate",
      candidateEmail: "e2e.candidate@example.com",
    },
  });
  check(
    "start blocked before verification (req 5)",
    earlyStart.status === 403,
    `status=${earlyStart.status}`,
  );

  const codeReq = await call("POST", `/interview-sessions/${sessionToken}/verify/request`);
  const devCode = codeReq.data?.data?.devCode as string | undefined;
  check(
    "verification code issued",
    codeReq.status === 200 && Boolean(devCode),
    `code=${devCode ?? "-"}`,
  );

  const wrong = await call("POST", `/interview-sessions/${sessionToken}/verify/confirm`, {
    body: { code: "000000" },
  });
  check("wrong code rejected", wrong.status === 400, `status=${wrong.status}`);

  const confirmed = await call("POST", `/interview-sessions/${sessionToken}/verify/confirm`, {
    body: { code: devCode },
  });
  check("correct code verifies the email", confirmed.status === 200, `status=${confirmed.status}`);

  const started = await call("POST", `/interview-sessions/${sessionToken}/start`, {
    body: {
      consentGiven: true,
      candidateName: "E2E Candidate",
      candidateEmail: "e2e.candidate@example.com",
    },
  });
  check("interview starts after verification", started.status === 201, `status=${started.status}`);
  check("questions served", (started.data?.data?.questions?.length ?? 0) > 0);

  const updated = await call("PATCH", `/interviews/${interviewId}`, {
    token,
    body: { title: "E2E Secured Interview (edited)", questionTimeSeconds: 90, passScore: 70 },
  });
  check(
    "edit title/timer/pass mark (req 8)",
    updated.status === 200 && updated.data?.data?.passScore === 70,
    `status=${updated.status}`,
  );

  const badWindow = await call("PATCH", `/interviews/${interviewId}`, {
    token,
    body: { expiresAt: new Date(now - 120_000).toISOString() },
  });
  check(
    "edit rejects a close-before-open window",
    badWindow.status === 422,
    `status=${badWindow.status}`,
  );

  await call("DELETE", `/interviews/${interviewId}`, { token });

  console.log(results.join("\n"));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((error) => {
  console.error("E2E crashed:", error);
  process.exit(1);
});