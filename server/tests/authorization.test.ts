import { describe, it, expect } from "vitest";
import { api, registerUser, createCompany } from "./helpers";

describe("Role authorization", () => {
  it("blocks candidates from recruiter-only endpoints", async () => {
    const candidate = await registerUser("CANDIDATE");
    const res = await api
      .post("/api/v1/problems")
      .set("Authorization", `Bearer ${candidate.accessToken}`)
      .send({
        title: "Nope",
        description: "Should not be allowed at all.",
        type: "MCQ",
      });
    expect(res.status).toBe(403);
  });

  it("blocks recruiters from admin endpoints", async () => {
    const recruiter = await registerUser("RECRUITER");
    const res = await api
      .get("/api/v1/admin/users")
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(res.status).toBe(403);
  });

  it("allows admins into admin endpoints", async () => {
    const admin = await registerUser("ADMIN");
    const res = await api
      .get("/api/v1/admin/dashboard-stats")
      .set("Authorization", `Bearer ${admin.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalUsers).toBeGreaterThan(0);
  });

  it("prevents a recruiter from reading another company's details", async () => {
    const recruiterA = await registerUser("RECRUITER");
    const companyA = await createCompany(recruiterA);
    const recruiterB = await registerUser("RECRUITER");
    await createCompany(recruiterB);

    const res = await api
      .get(`/api/v1/companies/${companyA.id}`)
      .set("Authorization", `Bearer ${recruiterB.accessToken}`);
    expect(res.status).toBe(403);
  });
});

describe("Admin management", () => {
  it("suspends and restores users; suspended users lose access", async () => {
    const admin = await registerUser("ADMIN");
    const user = await registerUser("CANDIDATE");

    const suspend = await api
      .patch(`/api/v1/admin/users/${user.id}/status`)
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ status: "SUSPENDED" });
    expect(suspend.status).toBe(200);
    expect(suspend.body.data.status).toBe("SUSPENDED");

    const blocked = await api
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${user.accessToken}`);
    expect(blocked.status).toBe(401);

    const restore = await api
      .patch(`/api/v1/admin/users/${user.id}/status`)
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ status: "ACTIVE" });
    expect(restore.status).toBe(200);

    const ok = await api
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${user.accessToken}`);
    expect(ok.status).toBe(200);
  });

  it("changes a user role", async () => {
    const admin = await registerUser("ADMIN");
    const user = await registerUser("CANDIDATE");
    const res = await api
      .patch(`/api/v1/admin/users/${user.id}/role`)
      .set("Authorization", `Bearer ${admin.accessToken}`)
      .send({ role: "RECRUITER" });
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe("RECRUITER");
  });

  it("lists audit logs", async () => {
    const admin = await registerUser("ADMIN");
    const res = await api
      .get("/api/v1/admin/audit-logs")
      .set("Authorization", `Bearer ${admin.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.meta).toHaveProperty("page");
    expect(res.body.meta).toHaveProperty("totalPages");
    expect(Array.isArray(res.body.data)).toBe(true);
    // Registration of the admin should be recorded
    const actions = res.body.data.map(
      (log: { action: string }) => log.action,
    );
    expect(actions).toContain("user.register");
  });
});