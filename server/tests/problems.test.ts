import { describe, it, expect } from "vitest";
import { api, registerUser, createCompany, createProblem } from "./helpers";

describe("Problem bank", () => {
  it("creates an MCQ problem with options", async () => {
    const recruiter = await registerUser("RECRUITER");
    await createCompany(recruiter);
    const problem = await createProblem(recruiter, { type: "MCQ", points: 5 });
    expect(problem.type).toBe("MCQ");
    expect(problem.options?.some((o) => o.isCorrect)).toBe(true);
  });

  it("requires exactly one correct option for MCQ (422 otherwise)", async () => {
    const recruiter = await registerUser("RECRUITER");
    await createCompany(recruiter);
    const res = await api
      .post("/api/v1/problems")
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({
        title: "No correct option",
        description: "This MCQ has no correct option so it must fail.",
        type: "MCQ",
        options: [
          { text: "A", isCorrect: false, order: 0 },
          { text: "B", isCorrect: false, order: 1 },
        ],
      });
    expect(res.status).toBe(422);
  });

  it("requires test cases for CODING problems (422 otherwise)", async () => {
    const recruiter = await registerUser("RECRUITER");
    await createCompany(recruiter);
    const res = await api
      .post("/api/v1/problems")
      .set("Authorization", `Bearer ${recruiter.accessToken}`)
      .send({
        title: "Coding without tests",
        description: "This coding problem has no test cases so it must fail.",
        type: "CODING",
      });
    expect(res.status).toBe(422);
  });

  it("supports pagination, filtering and sorting", async () => {
    const recruiter = await registerUser("RECRUITER");
    await createCompany(recruiter);
    await createProblem(recruiter, { difficulty: "EASY", type: "MCQ" });
    await createProblem(recruiter, {
      difficulty: "HARD",
      type: "WRITTEN",
      expectedAnswer: { keywords: ["index"] },
    });

    const page = await api
      .get("/api/v1/problems?page=1&limit=1&sortBy=createdAt&sortOrder=desc")
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(page.status).toBe(200);
    expect(page.body.meta.limit).toBe(1);
    expect(page.body.data.length).toBeLessThanOrEqual(1);

    const filtered = await api
      .get("/api/v1/problems?difficulty=HARD&type=WRITTEN")
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(filtered.status).toBe(200);
    for (const problem of filtered.body.data) {
      expect(problem.difficulty).toBe("HARD");
      expect(problem.type).toBe("WRITTEN");
    }
  });

  it("searches problems by keyword", async () => {
    const recruiter = await registerUser("RECRUITER");
    await createCompany(recruiter);
    await createProblem(recruiter, { title: "UniqueKarasRegexChallenge" });
    const res = await api
      .get("/api/v1/problems/search?q=KarasRegex")
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(res.status).toBe(200);
    expect(
      res.body.data.some((p: { title: string }) =>
        p.title.includes("KarasRegex"),
      ),
    ).toBe(true);
  });

  it("soft-deletes a problem so it disappears from standard queries", async () => {
    const recruiter = await registerUser("RECRUITER");
    await createCompany(recruiter);
    const problem = await createProblem(recruiter);

    const del = await api
      .delete(`/api/v1/problems/${problem.id}`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(del.status).toBe(200);

    const after = await api
      .get(`/api/v1/problems/${problem.id}`)
      .set("Authorization", `Bearer ${recruiter.accessToken}`);
    expect(after.status).toBe(404);
  });
});