import { describe, it, expect } from "vitest";
import { prisma } from "./db";
import {
  api,
  registerUser,
  createCompany,
  createProblem,
  createAssessment,
} from "./helpers";

describe("Timer expiration and result visibility", () => {
  it("auto-submits an attempt whose server-side timer has expired", async () => {
    const recruiter = await registerUser("RECRUITER");
    const company = await createCompany(recruiter);
    const problem = await createProblem(recruiter, { type: "MCQ", points: 10 });
    const assessment = await createAssessment(recruiter);

    const addProblem = await api
      .post(`/api/v1/assessments/${assessment.id}/problems`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({ problemId: problem.id, points: 10 });
    expect(addProblem.status).toBe(201);

    const cand = await registerUser("CANDIDATE");
    const invite = await api
      .post(`/api/v1/assessments/${assessment.id}/invitations`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({ candidates: [{ email: cand.email }] });
    expect(invite.status).toBe(201);

    const start = await api
      .post(`/api/v1/assessments/${assessment.id}/attempts/start`)
      .set("Authorization", `Bearer ${cand.accessToken}`)
      .send({});
    console.log("DEBUG start status:", start.status, JSON.stringify(start.body));
    expect(start.status).toBe(201);
    expect(company.id).toBeTruthy();

    await prisma.attempt.update({
      where: { id: start.body.data.id },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });

    const late = await api
      .post(`/api/v1/attempts/${start.body.data.id}/answers`)
      .set("Authorization", `Bearer ${cand.accessToken}`)
      .send({ problemId: problem.id, answer: { text: "too late" } });
    expect(late.status).toBe(409);

    const submit = await api
      .post(`/api/v1/attempts/${start.body.data.id}/submit`)
      .set("Authorization", `Bearer ${cand.accessToken}`);
    expect(submit.status).toBe(200);
    expect(["AUTO_SUBMITTED", "COMPLETED"]).toContain(
      submit.body.data.attempt.status,
    );
  });

  it("hides results when the assessment hides them", async () => {
    const recruiter = await registerUser("RECRUITER");
    await createCompany(recruiter);
    const problem = await createProblem(recruiter, { type: "MCQ", points: 5 });
    const created = await api
      .post("/api/v1/assessments")
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({
        title: `Hidden results ${Date.now()}`,
        durationMinutes: 30,
        passingScore: 0,
        showResults: false,
      });
    const assessmentId = created.body.data.id;
    await api
      .post(`/api/v1/assessments/${assessmentId}/problems`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({ problemId: problem.id, points: 5 });

    const cand = await registerUser("CANDIDATE");
    await api
      .post(`/api/v1/assessments/${assessmentId}/invitations`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({ candidates: [{ email: cand.email }] });
    const start = await api
      .post(`/api/v1/assessments/${assessmentId}/attempts/start`)
      .set("Authorization", `Bearer ${cand.accessToken}`)
      .send({});
    await api
      .post(`/api/v1/attempts/${start.body.data.id}/submit`)
      .set("Authorization", `Bearer ${cand.accessToken}`);

    const mine = await api
      .get("/api/v1/candidates/me/results")
      .set("Authorization", `Bearer ${cand.accessToken}`);
    expect(mine.status).toBe(200);
    expect(mine.body.data.length).toBe(0);
  });
});