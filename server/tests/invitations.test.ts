import { describe, it, expect, beforeAll } from "vitest";
import {
  api,
  registerUser,
  createCompany,
  createProblem,
  createAssessment,
} from "./helpers";

describe("Invitations", () => {
  let recruiter: Awaited<ReturnType<typeof registerUser>>;
  let candidate: Awaited<ReturnType<typeof registerUser>>;
  let assessmentId: string;
  let invitationId: string;

  beforeAll(async () => {
    recruiter = await registerUser("RECRUITER");
    await createCompany(recruiter);
    candidate = await registerUser("CANDIDATE");

    const problem = await createProblem(recruiter, { type: "MCQ", points: 10 });
    const assessment = await createAssessment(recruiter);
    assessmentId = assessment.id;
    await api
      .post(`/api/v1/assessments/${assessmentId}/problems`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({ problemId: problem.id, points: 10 });

    // Invite the registered candidate so they can accept it later.
    const invite = await api
      .post(`/api/v1/assessments/${assessmentId}/invitations`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({ candidates: [{ email: candidate.email }] });
    expect(invite.status).toBe(201);
    invitationId = invite.body.data[0].id;
  });

  it("prevents duplicate invitations for the same email", async () => {
    const duplicate = await api
      .post(`/api/v1/assessments/${assessmentId}/invitations`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({ candidates: [{ email: candidate.email }] });
    expect(duplicate.status).toBe(409);
  });

  it("shows the invitation in the candidate's list and allows accepting", async () => {
    const list = await api
      .get("/api/v1/candidates/invitations")
      .set("Authorization", `Bearer ${candidate.accessToken}`);
    expect(list.status).toBe(200);
    const invitation = list.body.data.find(
      (i: { id: string }) => i.id === invitationId,
    );
    expect(invitation).toBeTruthy();

    const accept = await api
      .post(`/api/v1/invitations/${invitationId}/accept`)
      .set("Authorization", `Bearer ${candidate.accessToken}`);
    expect(accept.status).toBe(200);
    expect(accept.body.data.status).toBe("ACCEPTED");
  });

  it("prevents candidates from touching invitations that are not theirs", async () => {
    const other = await registerUser("CANDIDATE");
    const res = await api
      .post(`/api/v1/invitations/${invitationId}/reject`)
      .set("Authorization", `Bearer ${other.accessToken}`);
    expect(res.status).toBe(403);
  });

  it("lists invitations for the assessment with pagination metadata", async () => {
    const res = await api
      .get(`/api/v1/assessments/${assessmentId}/invitations?page=1&limit=5`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.limit).toBe(5);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("resends an invitation (status back to PENDING)", async () => {
    const res = await api
      .post(`/api/v1/invitations/${invitationId}/resend`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("PENDING");
  });
});