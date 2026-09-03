import request from "supertest";
import app from "../src/app";
import { prisma } from "./db";

export const api = request(app);

let counter = 0;
export const uniqueEmail = (prefix: string) =>
  `${prefix}-${Date.now()}-${counter++}@test.local`;

export interface TestUser {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

export const registerUser = async (
  role: "CANDIDATE" | "RECRUITER" | "ADMIN" = "CANDIDATE",
  companyId?: string,
): Promise<TestUser> => {
  const email = uniqueEmail(role.toLowerCase());
  const res = await api.post("/api/v1/auth/register").send({
    name: `Test ${role}`,
    email,
    password: "Passw0rd123",
    role,
    companyId,
  });
  if (res.status !== 201) {
    throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  const login = await api
    .post("/api/v1/auth/login")
    .send({ email, password: "Passw0rd123" });
  if (login.status !== 200) {
    throw new Error(`login failed: ${login.status} ${JSON.stringify(login.body)}`);
  }
  return {
    id: res.body.data.id,
    email,
    accessToken: login.body.data.accessToken,
    refreshToken: login.body.data.refreshToken,
  };
};

export const createCompany = async (owner: TestUser) => {
  const res = await api
    .post("/api/v1/companies")
    .set("Authorization", `Bearer ${owner.accessToken}`)
    .send({
      name: `Test Company ${Date.now()}`,
      description: "Company used by automated tests",
      industry: "Software",
    });
  if (res.status !== 201) {
    throw new Error(`company create failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  // Grant the company a credit balance directly so publish flows can be tested.
  const company = res.body.data as { id: string; name: string };
  await prisma.company.update({
    where: { id: company.id },
    data: { credits: 10 },
  });
  return { ...company, credits: 10 };
};

export const createProblem = async (
  user: TestUser,
  overrides: Record<string, unknown> = {},
) => {
  const res = await api
    .post("/api/v1/problems")
    .set("Authorization", `Bearer ${user.accessToken}`)
    .send({
      title: `Problem ${Date.now()}`,
      description: "Describe the problem in detail for the candidate.",
      type: "MCQ",
      difficulty: "EASY",
      points: 10,
      status: "ACTIVE",
      options: [
        { text: "Option A", isCorrect: true, order: 0 },
        { text: "Option B", isCorrect: false, order: 1 },
      ],
      ...overrides,
    });
  if (res.status !== 201) {
    throw new Error(`problem create failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data as {
    id: string;
    type: string;
    options?: { id: string; isCorrect: boolean }[];
  };
};

export const createAssessment = async (user: TestUser) => {
  const res = await api
    .post("/api/v1/assessments")
    .set("Authorization", `Bearer ${user.accessToken}`)
    .send({
      title: `Assessment ${Date.now()}`,
      description: "Automated test assessment",
      durationMinutes: 30,
      passingScore: 5,
      maxAttempts: 1,
      showResults: true,
    });
  if (res.status !== 201) {
    throw new Error(
      `assessment create failed: ${res.status} ${JSON.stringify(res.body)}`,
    );
  }
  const assessment = res.body.data as { id: string };
  // Publish the assessment so candidates can start attempts.
  const publish = await api
    .post(`/api/v1/assessments/${assessment.id}/publish`)
    .set("Authorization", `Bearer ${user.accessToken}`);
  if (publish.status !== 200) {
    throw new Error(
      `assessment publish failed: ${publish.status} ${JSON.stringify(publish.body)}`,
    );
  }
  return assessment;
};

export const expectSuccess = (body: { success: boolean }) => {
  if (body.success !== true) {
    throw new Error(`expected success:true, got ${JSON.stringify(body)}`);
  }
};