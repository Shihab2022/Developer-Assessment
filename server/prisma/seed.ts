import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the seed. See .env.example.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@devassess.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
  const recruiterEmail = process.env.SEED_RECRUITER_EMAIL ?? "recruiter@techcorp.dev";
  const recruiterPassword = process.env.SEED_RECRUITER_PASSWORD ?? "Recruit123!";
  const candidateEmail = process.env.SEED_CANDIDATE_EMAIL ?? "candidate@devassess.local";
  const candidatePassword = process.env.SEED_CANDIDATE_PASSWORD ?? "Candid8te!";

  console.log("Seeding database...");

  // ---------- Users ----------
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Platform Admin",
      password: await bcrypt.hash(adminPassword, saltRounds),
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  // ---------- Company ----------
  const company = await prisma.company.upsert({
    where: { slug: "techcorp" },
    update: {},
    create: {
      name: "TechCorp Solutions",
      slug: "techcorp",
      description: "A software company hiring top developers.",
      website: "https://techcorp.example.com",
      industry: "Software Development",
      location: "Dhaka, Bangladesh",
      size: "50-100",
      credits: 10,
    },
  });

  const recruiter = await prisma.user.upsert({
    where: { email: recruiterEmail },
    update: {},
    create: {
      email: recruiterEmail,
      name: "Rina Recruiter",
      password: await bcrypt.hash(recruiterPassword, saltRounds),
      role: "RECRUITER",
      status: "ACTIVE",
      jobTitle: "Technical Hiring Manager",
      companyId: company.id,
    },
  });

  await prisma.companyMember.upsert({
    where: { companyId_userId: { companyId: company.id, userId: recruiter.id } },
    update: {},
    create: { companyId: company.id, userId: recruiter.id, role: "OWNER" },
  });

  const candidate = await prisma.user.upsert({
    where: { email: candidateEmail },
    update: {},
    create: {
      email: candidateEmail,
      name: "Cody Candidate",
      password: await bcrypt.hash(candidatePassword, saltRounds),
      role: "CANDIDATE",
      status: "ACTIVE",
      phone: "+8801700000000",
      bio: "Full-stack developer with 3 years of experience.",
      skills: ["javascript", "nodejs", "postgresql"],
      experience: 3,
      jobTitle: "Software Engineer",
    },
  });


  // ---------- Problems ----------
  const mcqProblem = await prisma.problem.upsert({
    where: { id: "00000000-0000-4000-8000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      title: "JavaScript Event Loop Basics",
      description:
        "Which statement best describes how the JavaScript event loop handles a Promise.then callback?",
      type: "MCQ",
      difficulty: "EASY",
      category: "javascript",
      points: 5,
      status: "ACTIVE",
      createdBy: recruiter.id,
      companyId: company.id,
      options: {
        create: [
          { text: "It runs immediately in the current tick", isCorrect: false, order: 0 },
          { text: "It is queued in the microtask queue", isCorrect: true, order: 1 },
          { text: "It is queued in the macrotask queue", isCorrect: false, order: 2 },
          { text: "It runs after the process exits", isCorrect: false, order: 3 },
        ],
      },
    },
  });

  const writtenProblem = await prisma.problem.upsert({
    where: { id: "00000000-0000-4000-8000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000002",
      title: "Explain Database Indexing",
      description:
        "Explain what a database index is, when you would add one, and one trade-off of adding indexes.",
      type: "WRITTEN",
      difficulty: "MEDIUM",
      category: "databases",
      points: 10,
      status: "ACTIVE",
      createdBy: recruiter.id,
      companyId: company.id,
      expectedAnswer: {
        keywords: ["index", "b-tree", "lookup", "write penalty", "storage"],
        guidance:
          "A good answer explains that an index accelerates lookups (B-tree), is chosen for frequently filtered/joined columns, and trades extra storage plus slower writes.",
      },
    },
  });

  const codingProblem = await prisma.problem.upsert({
    where: { id: "00000000-0000-4000-8000-000000000003" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000003",
      title: "Sum of Two Numbers",
      description:
        "Write a function `solve(a, b)` that returns the sum of a and b.\n\nThe sandbox calls your function with values read from the input and prints the result to stdout.",
      type: "CODING",
      difficulty: "EASY",
      category: "algorithms",
      points: 15,
      timeLimit: 15,
      memoryLimit: 256,
      status: "ACTIVE",
      createdBy: recruiter.id,
      companyId: company.id,
      testCases: {
        create: [
          { input: "1\n2", expectedOutput: "3", isHidden: false, order: 0 },
          { input: "10\n20", expectedOutput: "30", isHidden: true, order: 1 },
          { input: "-5\n5", expectedOutput: "0", isHidden: true, order: 2 },
        ],
      },
    },
  });


  // ---------- Assessment ----------
  const assessment = await prisma.assessment.upsert({
    where: { id: "00000000-0000-4000-8000-000000000004" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000004",
      companyId: company.id,
      createdBy: recruiter.id,
      title: "Junior Node.js Developer Assessment",
      description: "Baseline screening assessment for junior backend engineers.",
      instructions:
        "Answer all questions. The timer starts when you start the attempt and the server clock is the source of truth.",
      durationMinutes: 45,
      passingScore: 15,
      status: "PUBLISHED",
      maxAttempts: 1,
      showResults: true,
      antiCheatingEnabled: true,
    },
  });

  const seedLinks = [
    { problemId: mcqProblem.id, order: 0, points: 5 },
    { problemId: codingProblem.id, order: 1, points: 15 },
    { problemId: writtenProblem.id, order: 2, points: 10 },
  ];
  for (const link of seedLinks) {
    await prisma.assessmentProblem.upsert({
      where: {
        assessmentId_problemId: {
          assessmentId: assessment.id,
          problemId: link.problemId,
        },
      },
      update: { order: link.order, points: link.points },
      create: {
        assessmentId: assessment.id,
        problemId: link.problemId,
        order: link.order,
        points: link.points,
      },
    });
  }

  // ---------- Payment package + invitation ----------
  await prisma.paymentPackage.upsert({
    where: { id: "00000000-0000-4000-8000-000000000005" },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000005",
      name: "Starter Pack (10 assessments)",
      credits: 10,
      price: 2000,
      description: "10 assessment publishes for your company.",
    },
  });

  await prisma.invitation.upsert({
    where: { assessmentId_email: { assessmentId: assessment.id, email: candidateEmail } },
    update: {},
    create: {
      assessmentId: assessment.id,
      candidateId: candidate.id,
      email: candidateEmail,
      invitedBy: recruiter.id,
      companyId: company.id,
      status: "PENDING",
    },
  });

  console.log(`  assessment: ${assessment.title}`);
  console.log(`  invitation: ${candidateEmail} -> ${assessment.title}`);
  console.log("Seed complete.");
  console.log("Default credentials (override via SEED_* env vars):");
  console.log(`  ${adminEmail} / ${adminPassword}`);
  console.log(`  ${recruiterEmail} / ${recruiterPassword}`);
  console.log(`  ${candidateEmail} / ${candidatePassword}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });

