import { describe, it, expect, beforeAll } from "vitest";
import {
  api,
  registerUser,
  createCompany,
  createProblem,
  createAssessment,
} from "./helpers";

describe("Coding submissions and sandboxed evaluation", () => {
  let recruiter: Awaited<ReturnType<typeof registerUser>>;
  let candidate: Awaited<ReturnType<typeof registerUser>>;
  let codingProblemId: string;
  let attemptId: string;
  let submissionId: string;

  beforeAll(async () => {
    recruiter = await registerUser("RECRUITER");
    await createCompany(recruiter);
    candidate = await registerUser("CANDIDATE");

    const problem = await createProblem(recruiter, {
      type: "CODING",
      points: 10,
      testCases: [
        { input: "1\n2", expectedOutput: "3", isHidden: false, order: 0 },
        { input: "10\n20", expectedOutput: "30", isHidden: true, order: 1 },
      ],
    });
    codingProblemId = problem.id;

    const assessment = await createAssessment(recruiter);
    await api
      .post(`/api/v1/assessments/${assessment.id}/problems`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({ problemId: codingProblemId, points: 10 });

    await api
      .post(`/api/v1/assessments/${assessment.id}/invitations`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({ candidates: [{ email: candidate.email }] });

    const start = await api
      .post(`/api/v1/assessments/${assessment.id}/attempts/start`)
      .set("Authorization", `Bearer ${candidate.accessToken}`)
      .send({});
    attemptId = start.body.data.id;
  });

  it("creates a code submission for a CODING problem", async () => {
    const res = await api
      .post("/api/v1/submissions")
      .set("Authorization", `Bearer ${candidate.accessToken}`)
      .send({
        attemptId,
        problemId: codingProblemId,
        code: "console.log(1 + 2);",
        programmingLanguage: "javascript",
      });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("PENDING");
    submissionId = res.body.data.id;
  });

  it("evaluates the submission in the sandbox (local vm fallback)", async () => {
    const res = await api
      .post(`/api/v1/submissions/${submissionId}/evaluate`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(res.status).toBe(200);
    expect(["PASSED", "FAILED", "PARTIAL", "ERROR"]).toContain(
      res.body.data.status,
    );
    expect(res.body.data.submission.evaluationResult).toBeTruthy();
  });

  it("blocks candidates from triggering evaluation", async () => {
    const res = await api
      .post(`/api/v1/submissions/${submissionId}/evaluate`)
      .set("Authorization", `Bearer ${candidate.accessToken}`);
    expect(res.status).toBe(403);
  });

  it("lists submissions for the attempt", async () => {
    const res = await api
      .get(`/api/v1/attempts/${attemptId}/submissions`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});