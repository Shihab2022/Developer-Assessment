-- VideoInterview: proctored AI video/audio interviews with question bank, sessions and violations

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InterviewSessionStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'PROCESSING', 'REVIEWED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "InterviewQuestionSource" AS ENUM ('BANK', 'CUSTOM');

-- CreateEnum
CREATE TYPE "InterviewViolationType" AS ENUM ('TAB_SWITCH', 'WINDOW_BLUR', 'FULLSCREEN_EXIT', 'MULTIPLE_FACES', 'DEVICE_DETECTED', 'NOISE_DETECTED', 'FACE_NOT_VISIBLE', 'CAMERA_BLOCKED', 'MICROPHONE_BLOCKED', 'LOOKING_AWAY', 'COPY', 'PASTE');

-- CreateEnum
CREATE TYPE "InterviewViolationSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "InterviewViolationDetector" AS ENUM ('CLIENT', 'AI', 'RECRUITER');

-- CreateEnum
CREATE TYPE "InterviewDecision" AS ENUM ('STRONG_HIRE', 'HIRE', 'MAYBE', 'NO_HIRE');

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "createdBy" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "jobRole" TEXT,
    "technology" TEXT NOT NULL,
    "seniority" TEXT NOT NULL DEFAULT 'MID',
    "questionCount" INTEGER NOT NULL DEFAULT 10,
    "questionTimeSeconds" INTEGER NOT NULL DEFAULT 300,
    "totalTimeSeconds" INTEGER,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT true,
    "hintsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "proctoringEnabled" BOOLEAN NOT NULL DEFAULT true,
    "terminateOnCritical" BOOLEAN NOT NULL DEFAULT true,
    "aiReviewEnabled" BOOLEAN NOT NULL DEFAULT true,
    "passScore" INTEGER NOT NULL DEFAULT 60,
    "maxViolations" INTEGER NOT NULL DEFAULT 2,
    "accessToken" TEXT NOT NULL,
    "status" "InterviewStatus" NOT NULL DEFAULT 'DRAFT',
    "expiresAt" TIMESTAMP(3),
    "settings" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewQuestion" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "hints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expectedKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "modelAnswer" TEXT,
    "timeSeconds" INTEGER,
    "maxScore" INTEGER NOT NULL DEFAULT 10,
    "source" "InterviewQuestionSource" NOT NULL DEFAULT 'BANK',
    "bankKey" TEXT,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "topic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewQuestion_pkey" PRIMARY KEY ("id")
);


-- CreateTable
CREATE TABLE "InterviewSession" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "candidateId" TEXT,
    "token" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "candidateEmail" TEXT NOT NULL,
    "status" "InterviewSessionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "terminatedAt" TIMESTAMP(3),
    "terminationReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceInfo" JSONB,
    "consentGivenAt" TIMESTAMP(3),
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "maxScore" INTEGER NOT NULL DEFAULT 0,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "passesInterview" BOOLEAN NOT NULL DEFAULT false,
    "integrityScore" INTEGER NOT NULL DEFAULT 100,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "violationCount" INTEGER NOT NULL DEFAULT 0,
    "decision" "InterviewDecision",
    "aiSummary" TEXT,
    "aiStrengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiImprovements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiReview" JSONB,
    "reviewProvider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewAnswer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "transcript" TEXT,
    "recordingUrl" TEXT,
    "recordingMime" TEXT,
    "recordingSeconds" INTEGER,
    "audioLevelAvg" DOUBLE PRECISION,
    "videoFrames" JSONB,
    "snapshots" JSONB,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "hintsRevealed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "timeSpentSeconds" INTEGER,
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "score" INTEGER,
    "maxScore" INTEGER NOT NULL DEFAULT 10,
    "keywordHits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "missingKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiFeedback" TEXT,
    "aiStrengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiImprovements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aiConfidence" DOUBLE PRECISION,
    "aiReview" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewViolation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT,
    "type" "InterviewViolationType" NOT NULL,
    "severity" "InterviewViolationSeverity" NOT NULL DEFAULT 'MEDIUM',
    "detectedBy" "InterviewViolationDetector" NOT NULL DEFAULT 'CLIENT',
    "description" TEXT,
    "metadata" JSONB,
    "snapshot" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewViolation_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "Interview_accessToken_key" ON "Interview"("accessToken");

-- CreateIndex
CREATE INDEX "Interview_companyId_idx" ON "Interview"("companyId");

-- CreateIndex
CREATE INDEX "Interview_status_idx" ON "Interview"("status");

-- CreateIndex
CREATE INDEX "Interview_technology_idx" ON "Interview"("technology");

-- CreateIndex
CREATE INDEX "Interview_accessToken_idx" ON "Interview"("accessToken");

-- CreateIndex
CREATE INDEX "InterviewQuestion_interviewId_idx" ON "InterviewQuestion"("interviewId");

-- CreateIndex
CREATE INDEX "InterviewQuestion_source_idx" ON "InterviewQuestion"("source");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewSession_token_key" ON "InterviewSession"("token");

-- CreateIndex
CREATE INDEX "InterviewSession_interviewId_idx" ON "InterviewSession"("interviewId");

-- CreateIndex
CREATE INDEX "InterviewSession_candidateId_idx" ON "InterviewSession"("candidateId");

-- CreateIndex
CREATE INDEX "InterviewSession_status_idx" ON "InterviewSession"("status");

-- CreateIndex
CREATE INDEX "InterviewSession_token_idx" ON "InterviewSession"("token");

-- CreateIndex
CREATE UNIQUE INDEX "InterviewAnswer_sessionId_questionId_key" ON "InterviewAnswer"("sessionId", "questionId");

-- CreateIndex
CREATE INDEX "InterviewAnswer_sessionId_idx" ON "InterviewAnswer"("sessionId");

-- CreateIndex
CREATE INDEX "InterviewViolation_sessionId_idx" ON "InterviewViolation"("sessionId");

-- CreateIndex
CREATE INDEX "InterviewViolation_type_idx" ON "InterviewViolation"("type");

-- CreateIndex
CREATE INDEX "InterviewViolation_severity_idx" ON "InterviewViolation"("severity");

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewQuestion" ADD CONSTRAINT "InterviewQuestion_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewAnswer" ADD CONSTRAINT "InterviewAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewAnswer" ADD CONSTRAINT "InterviewAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "InterviewQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewViolation" ADD CONSTRAINT "InterviewViolation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
