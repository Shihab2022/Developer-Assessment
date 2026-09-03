import { describe, it, expect } from "vitest";
import {
  api,
  registerUser,
  createCompany,
  createProblem,
  createAssessment,
} from "./helpers";

describe("Assessment lifecycle", () => {
  it("creates, publishes (consuming a credit) and closes an assessment", async () => {
    const recruiter = await registerUser("RECRUITER");
    const company = await createCompany(recruiter);

    const created = await api
      .post("/api/v1/assessments")
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({
        title: `Lifecycle ${Date.now()}`,
        durationMinutes: 30,
        passingScore: 5,
      });
    expect(created.status).toBe(201);

    const before = await api
      .get(`/api/v1/companies/${company.id}`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    const creditsBefore = before.body.data.credits as number;

    const publish = await api
      .post(`/api/v1/assessments/${created.body.data.id}/publish`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(publish.status).toBe(200);

    const after = await api
      .get(`/api/v1/companies/${company.id}`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(after.body.data.credits).toBe(creditsBefore - 1);

    const close = await api
      .post(`/api/v1/assessments/${created.body.data.id}/close`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(close.status).toBe(200);
    expect(close.body.data.status).toBe("CLOSED");

    // CLOSED -> PUBLISHED is an invalid transition
    const republish = await api
      .post(`/api/v1/assessments/${created.body.data.id}/publish`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(republish.status).toBe(409);
  });

  it("prevents recruiters from touching another company's assessment", async () => {
    const recruiterA = await registerUser("RECRUITER");
    await createCompany(recruiterA);
    const assessmentA = await createAssessment(recruiterA);

    const recruiterB = await registerUser("RECRUITER");
    await createCompany(recruiterB);

    const res = await api
      .patch(`/api/v1/assessments/${assessmentA.id}`)
      .set("Authorization", `Bearer ${recruiterB.accessToken}`)
      .send({ title: "Hijacked" });
    expect(res.status).toBe(403);
  });

  it("manages assessment problems (add/update/remove) with duplicates blocked", async () => {
    const recruiter = await registerUser("RECRUITER");
    await createCompany(recruiter);
    const assessment = await createAssessment(recruiter);
    const problem = await createProblem(recruiter);

    const add = await api
      .post(`/api/v1/assessments/${assessment.id}/problems`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({ problemId: problem.id, points: 7, order: 1 });
    expect(add.status).toBe(201);

    const duplicate = await api
      .post(`/api/v1/assessments/${assessment.id}/problems`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({ problemId: problem.id });
    expect(duplicate.status).toBe(409);

    const update = await api
      .patch(`/api/v1/assessments/${assessment.id}/problems/${problem.id}`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({ points: 9, section: "Core" });
    expect(update.status).toBe(200);
    expect(update.body.data.points).toBe(9);

    const list = await api
      .get(`/api/v1/assessments/${assessment.id}/problems`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBe(1);

    const remove = await api
      .delete(`/api/v1/assessments/${assessment.id}/problems/${problem.id}`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(remove.status).toBe(200);
  });

  it("soft-deletes an assessment", async () => {
    const recruiter = await registerUser("RECRUITER");
    await createCompany(recruiter);
    const assessment = await createAssessment(recruiter);

    const del = await api
      .delete(`/api/v1/assessments/${assessment.id}`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(del.status).toBe(200);

    const after = await api
      .get(`/api/v1/assessments/${assessment.id}`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(after.status).toBe(404);
  });
});