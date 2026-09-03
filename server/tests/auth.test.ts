import { describe, it, expect } from "vitest";
import { api, registerUser, uniqueEmail } from "./helpers";

describe("Authentication", () => {
  it("registers a candidate with a 201 and never returns the password hash", async () => {
    const email = uniqueEmail("auth-cand");
    const res = await api.post("/api/v1/auth/register").send({
      name: "Auth Candidate",
      email,
      password: "Passw0rd123",
      role: "CANDIDATE",
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(email);
    expect(res.body.data.password).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain("$2");
  });

  it("rejects duplicate emails with 409", async () => {
    const email = uniqueEmail("auth-dup");
    await api
      .post("/api/v1/auth/register")
      .send({ name: "Dup One", email, password: "Passw0rd123" });
    const res = await api
      .post("/api/v1/auth/register")
      .send({ name: "Dup Two", email, password: "Passw0rd123" });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("validates registration input (422 for weak password / bad email)", async () => {
    const res = await api.post("/api/v1/auth/register").send({
      name: "Bad Input",
      email: "not-an-email",
      password: "short",
    });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it("logs in with valid credentials and issues both tokens", async () => {
    const user = await registerUser("CANDIDATE");
    expect(user.accessToken).toBeTruthy();
    expect(user.refreshToken).toBeTruthy();
  });

  it("rejects wrong password with 401", async () => {
    const user = await registerUser("CANDIDATE");
    const res = await api
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: "WrongPass123" });
    expect(res.status).toBe(401);
  });

  it("protects /auth/me with a bearer token and rejects without one", async () => {
    const user = await registerUser("CANDIDATE");
    const ok = await api
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${user.accessToken}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.email).toBe(user.email);

    const noToken = await api.get("/api/v1/auth/me");
    expect(noToken.status).toBe(401);

    const badToken = await api
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer invalid.token.here");
    expect(badToken.status).toBe(401);
  });

  it("rotates refresh tokens and revokes the old one", async () => {
    const user = await registerUser("CANDIDATE");
    const first = await api
      .post("/api/v1/auth/refresh-token")
      .send({ refreshToken: user.refreshToken });
    expect(first.status).toBe(200);
    expect(first.body.data.refreshToken).toBeTruthy();

    // Replaying the old refresh token must fail (rotation)
    const replay = await api
      .post("/api/v1/auth/refresh-token")
      .send({ refreshToken: user.refreshToken });
    expect(replay.status).toBe(401);
  });

  it("logs out and invalidates the refresh token", async () => {
    const user = await registerUser("CANDIDATE");
    const logout = await api
      .post("/api/v1/auth/logout")
      .send({ refreshToken: user.refreshToken });
    expect(logout.status).toBe(200);

    const replay = await api
      .post("/api/v1/auth/refresh-token")
      .send({ refreshToken: user.refreshToken });
    expect(replay.status).toBe(401);
  });
});

describe("User profile", () => {
  it("updates the profile", async () => {
    const user = await registerUser("CANDIDATE");
    const updated = await api
      .patch("/api/v1/users/me")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({ bio: "Updated bio", skills: ["typescript"], jobTitle: "Engineer" });
    expect(updated.status).toBe(200);
    expect(updated.body.data.bio).toBe("Updated bio");
  });

  it("changes the password and allows re-login with the new one", async () => {
    const user = await registerUser("CANDIDATE");
    const changed = await api
      .patch("/api/v1/users/me/password")
      .set("Authorization", `Bearer ${user.accessToken}`)
      .send({ currentPassword: "Passw0rd123", newPassword: "NewPassw0rd123" });
    expect(changed.status).toBe(200);

    const relogin = await api
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: "NewPassw0rd123" });
    expect(relogin.status).toBe(200);
  });
});