import { describe, it, expect, beforeAll } from "vitest";
import {
  api,
  registerUser,
  createCompany,
  createProblem,
  createAssessment,
} from "./helpers";

describe("Timed attempts", () => {
  let recruiter: Awaited<ReturnType<typeof registerUser>>;
  let candidate: Awaited<ReturnType<typeof registerUser>>;
  let assessmentId: string;
  let mcqProblemId: string;
  let attemptId: string;

  beforeAll(async () => {
    recruiter = await registerUser("RECRUITER");
    await createCompany(recruiter);
    candidate = await registerUser("CANDIDATE");

    const problem = await createProblem(recruiter, {
      type: "MCQ",
      points: 10,
    });
    mcqProblemId = problem.id;

    const assessment = await createAssessment(recruiter);
    assessmentId = assessment.id;
    await api
      .post(`/api/v1/assessments/${assessmentId}/problems`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({ problemId: mcqProblemId, points: 10 });

    await api
      .post(`/api/v1/assessments/${assessmentId}/invitations`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({ candidates: [{ email: candidate.email }] });

    const start = await api
      .post(`/api/v1/assessments/${assessmentId}/attempts/start`)
      .set("Authorization", `Bearer ${candidate.accessToken}`)
      .send({});
    attemptId = start.body.data.id;
  });

  it("blocks uninvited candidates from starting an attempt", async () => {
    const outsider = await registerUser("CANDIDATE");
    const res = await api
      .post(`/api/v1/assessments/${assessmentId}/attempts/start`)
      .set("Authorization", `Bearer ${outsider.accessToken}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it("starts an attempt with a server-side expiry", async () => {
    expect(attemptId).toBeTruthy();
    const res = await api
      .get(`/api/v1/attempts/${attemptId}`)
      .set("Authorization", `Bearer ${candidate.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("IN_PROGRESS");
    expect(new Date(res.body.data.expiresAt).getTime()).toBeGreaterThan(
      Date.now(),
    );
  });

  it("respects max attempts (second start is rejected)", async () => {
    const res = await api
      .post(`/api/v1/assessments/${assessmentId}/attempts/start`)
      .set("Authorization", `Bearer ${candidate.accessToken}`)
      .send({});
    expect(res.status).toBe(409);
  });

  it("serves sanitized questions (no hidden test cases, no correct answers)", async () => {
    const coding = await createProblem(recruiter, {
      type: "CODING",
      testCases: [
        { input: "1", expectedOutput: "1", isHidden: false, order: 0 },
        { input: "2", expectedOutput: "2", isHidden: true, order: 1 },
      ],
    });
    const assessment = await createAssessment(recruiter);
    await api
      .post(`/api/v1/assessments/${assessment.id}/problems`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({ problemId: coding.id });

    const cand = await registerUser("CANDIDATE");
    await api
      .post(`/api/v1/assessments/${assessment.id}/invitations`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({ candidates: [{ email: cand.email }] });
    const start = await api
      .post(`/api/v1/assessments/${assessment.id}/attempts/start`)
      .set("Authorization", `Bearer ${cand.accessToken}`)
      .send({});
    expect(start.status).toBe(201);

    const questions = await api
      .get(`/api/v1/attempts/${start.body.data.id}/questions`)
      .set("Authorization", `Bearer ${cand.accessToken}`);
    expect(questions.status).toBe(200);
    const payload = JSON.stringify(questions.body);
    expect(payload).not.toContain('"isHidden":true');
    expect(payload).not.toContain('"isCorrect":true');
  });

  it("lists the candidate's own attempts", async () => {
    const res = await api
      .get("/api/v1/candidates/me/attempts")
      .set("Authorization", `Bearer ${candidate.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.meta).toHaveProperty("totalPages");
  });
});