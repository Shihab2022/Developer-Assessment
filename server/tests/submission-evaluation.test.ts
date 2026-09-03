import { describe, it, expect, beforeAll } from "vitest";
import {
  api,
  registerUser,
  createCompany,
  createProblem,
  createAssessment,
} from "./helpers";

describe("Answers, submission and evaluation", () => {
  let recruiter: Awaited<ReturnType<typeof registerUser>>;
  let candidate: Awaited<ReturnType<typeof registerUser>>;
  let mcqProblemId: string;
  let mcqCorrectOptionId: string;
  let attemptId: string;
  let answerId: string;
  let resultId: string;

  beforeAll(async () => {
    recruiter = await registerUser("RECRUITER");
    await createCompany(recruiter);
    candidate = await registerUser("CANDIDATE");

    const problem = await createProblem(recruiter, {
      type: "MCQ",
      points: 10,
    });
    mcqProblemId = problem.id;
    mcqCorrectOptionId = problem.options!.find((o) => o.isCorrect)!.id;

    const assessment = await createAssessment(recruiter);
    await api
      .post(`/api/v1/assessments/${assessment.id}/problems`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({ problemId: mcqProblemId, points: 10 });

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

  it("saves an answer, then freezes it after submission", async () => {
    const saved = await api
      .post(`/api/v1/attempts/${attemptId}/answers`)
      .set("Authorization", `Bearer ${candidate.accessToken}`)
      .send({
        problemId: mcqProblemId,
        answer: { selectedOptionId: mcqCorrectOptionId },
      });
    expect(saved.status).toBe(201);
    answerId = saved.body.data.id;

    const submit = await api
      .post(`/api/v1/attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${candidate.accessToken}`);
    expect(submit.status).toBe(200);
    expect(submit.body.data.alreadySubmitted).toBe(false);
    resultId = submit.body.data.result?.id;

    const frozen = await api
      .patch(`/api/v1/attempts/${attemptId}/answers/${answerId}`)
      .set("Authorization", `Bearer ${candidate.accessToken}`)
      .send({
        answer: { selectedOptionId: "00000000-0000-4000-8000-000000000000" },
      });
    expect(frozen.status).toBe(409);
  });

  it("rejects a second submission (idempotent)", async () => {
    const second = await api
      .post(`/api/v1/attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${candidate.accessToken}`);
    expect(second.status).toBe(200);
    expect(second.body.data.alreadySubmitted).toBe(true);
  });

  it("auto-evaluates the MCQ and calculates the result", async () => {
    const evaluations = await api
      .get(`/api/v1/attempts/${attemptId}/evaluations`)
      .set("Authorization", `Bearer ${candidate.accessToken}`);
    expect(evaluations.status).toBe(200);
    const mcqEvaluation = evaluations.body.data.find(
      (e: { type: string }) => e.type === "MCQ",
    );
    expect(mcqEvaluation).toBeTruthy();
    expect(mcqEvaluation.score).toBe(10);

    expect(resultId).toBeTruthy();
    const result = await api
      .get(`/api/v1/results/${resultId}`)
      .set("Authorization", `Bearer ${candidate.accessToken}`);
    expect(result.status).toBe(200);
    expect(result.body.data.earnedPoints).toBe(10);
    expect(result.body.data.totalPoints).toBe(10);
    expect(result.body.data.percentage).toBe(100);
    expect(result.body.data.passed).toBe(true);
    expect(result.body.data.items.length).toBe(1);
  });

  it("records anti-cheating events with IP and user agent", async () => {
    const event = await api
      .post(`/api/v1/attempts/${attemptId}/anti-cheating-events`)
      .set("Authorization", `Bearer ${candidate.accessToken}`)
      .set("User-Agent", "vitest-agent/1.0")
      .send({ eventType: "TAB_SWITCH", metadata: { detail: "unit-test" } });
    expect(event.status).toBe(201);
    expect(event.body.data.ipAddress).toBeTruthy();
    expect(event.body.data.userAgent).toContain("vitest-agent");

    const list = await api
      .get(`/api/v1/attempts/${attemptId}/anti-cheating-events`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBeGreaterThan(0);
  });

  it("exposes reports and analytics for the assessment", async () => {
    const created = await api
      .get("/api/v1/candidates/me/attempts")
      .set("Authorization", `Bearer ${candidate.accessToken}`);
    const attempt = created.body.data.find(
      (a: { id: string }) => a.id === attemptId,
    );
    expect(attempt).toBeTruthy();
    const assessmentId = attempt.assessment.id as string;

    const report = await api
      .get(`/api/v1/assessments/${assessmentId}/report`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(report.status).toBe(200);
    expect(report.body.data.summary.completedAttempts).toBeGreaterThan(0);
    expect(report.body.data.summary.averageScore).toBeGreaterThan(0);
    expect(report.body.data.candidateRanking.length).toBeGreaterThan(0);

    const analytics = await api
      .get(`/api/v1/assessments/${assessmentId}/analytics`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(analytics.status).toBe(200);
    expect(analytics.body.data.summary.completedAttempts).toBeGreaterThan(0);
    expect(analytics.body.data.summary.passRate).toBeGreaterThan(0);
  });
});