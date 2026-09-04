-- EnhancePlatform: advanced question bank, templates, pipeline, notifications, sessions

-- CreateEnum
CREATE TYPE "AssessmentAccessLevel" AS ENUM ('PUBLIC', 'PRIVATE', 'INVITATION_ONLY', 'ACCESS_CODE');

-- CreateEnum
CREATE TYPE "ResultStrategy" AS ENUM ('BEST_SCORE', 'LATEST_SCORE', 'FIRST_SCORE');

-- CreateEnum
CREATE TYPE "RecruitmentStatus" AS ENUM ('INVITED', 'STARTED', 'COMPLETED', 'SHORTLISTED', 'INTERVIEW', 'HIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CreditTransactionCategory" AS ENUM ('CREDIT_PURCHASE', 'INVITATION_USAGE', 'REFUND', 'ADMIN_ADJUSTMENT', 'EXPIRATION');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ASSESSMENT_INVITATION', 'ASSESSMENT_COMPLETED', 'RESULT_AVAILABLE', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'ASSESSMENT_EXPIRING');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ');

-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- AlterTable: Problem advanced question bank fields
ALTER TABLE "Problem" ADD COLUMN "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Problem" ADD COLUMN "allowedLanguages" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Problem" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Problem" ADD COLUMN "examples" JSONB;
ALTER TABLE "Problem" ADD COLUMN "timesUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Problem" ADD COLUMN "timesAttempted" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Problem" ADD COLUMN "timesSolved" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Problem" ADD COLUMN "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Problem" ADD COLUMN "averageScore" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable: Assessment enhancements
ALTER TABLE "Assessment" ADD COLUMN "resultStrategy" "ResultStrategy" NOT NULL DEFAULT 'LATEST_SCORE';
ALTER TABLE "Assessment" ADD COLUMN "accessLevel" "AssessmentAccessLevel" NOT NULL DEFAULT 'INVITATION_ONLY';
ALTER TABLE "Assessment" ADD COLUMN "accessCodeHash" TEXT;
ALTER TABLE "Assessment" ADD COLUMN "shuffleOptions" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Assessment" ADD COLUMN "questionConfig" JSONB;
ALTER TABLE "Assessment" ADD COLUMN "templateId" TEXT;
ALTER TABLE "Assessment" ADD COLUMN "showCandidateRanking" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: Attempt enhancements
ALTER TABLE "Attempt" ADD COLUMN "shuffledQuestionOrder" JSONB;
ALTER TABLE "Attempt" ADD COLUMN "shuffledOptions" JSONB;

-- AlterTable: Result ranking
ALTER TABLE "Result" ADD COLUMN "rank" INTEGER;

-- AlterTable: Invitation recruitment pipeline
ALTER TABLE "Invitation" ADD COLUMN "recruitmentStatus" "RecruitmentStatus" NOT NULL DEFAULT 'INVITED';

-- AlterTable: CreditTransaction category
ALTER TABLE "CreditTransaction" ADD COLUMN "category" "CreditTransactionCategory" NOT NULL DEFAULT 'CREDIT_PURCHASE';

-- CreateTable
CREATE TABLE "AssessmentTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "createdBy" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "durationMinutes" INTEGER NOT NULL,
    "passingScore" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 1,
    "shuffleProblems" BOOLEAN NOT NULL DEFAULT false,
    "shuffleOptions" BOOLEAN NOT NULL DEFAULT false,
    "showResults" BOOLEAN NOT NULL DEFAULT true,
    "antiCheatingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "resultStrategy" "ResultStrategy" NOT NULL DEFAULT 'LATEST_SCORE',
    "accessLevel" "AssessmentAccessLevel" NOT NULL DEFAULT 'INVITATION_ONLY',
    "questionConfig" JSONB,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "difficultyDistribution" JSONB,
    "antiCheatingSettings" JSONB,
    "status" "TemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateNote" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "companyId" TEXT,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptSession" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceInfo" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "isSuspicious" BOOLEAN NOT NULL DEFAULT false,
    "eventCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AttemptSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssessmentTemplate_companyId_idx" ON "AssessmentTemplate"("companyId");
CREATE INDEX "AssessmentTemplate_status_idx" ON "AssessmentTemplate"("status");
CREATE INDEX "CandidateNote_candidateId_idx" ON "CandidateNote"("candidateId");
CREATE INDEX "CandidateNote_assessmentId_idx" ON "CandidateNote"("assessmentId");
CREATE INDEX "CandidateNote_companyId_idx" ON "CandidateNote"("companyId");
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_status_idx" ON "Notification"("status");
CREATE INDEX "Notification_type_idx" ON "Notification"("type");
CREATE UNIQUE INDEX "AttemptSession_attemptId_sessionId_key" ON "AttemptSession"("attemptId", "sessionId");
CREATE INDEX "AttemptSession_attemptId_idx" ON "AttemptSession"("attemptId");
CREATE INDEX "AttemptSession_sessionId_idx" ON "AttemptSession"("sessionId");
CREATE INDEX "AttemptSession_ipAddress_idx" ON "AttemptSession"("ipAddress");

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AssessmentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssessmentTemplate" ADD CONSTRAINT "AssessmentTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssessmentTemplate" ADD CONSTRAINT "AssessmentTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CandidateNote" ADD CONSTRAINT "CandidateNote_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CandidateNote" ADD CONSTRAINT "CandidateNote_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CandidateNote" ADD CONSTRAINT "CandidateNote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CandidateNote" ADD CONSTRAINT "CandidateNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AttemptSession" ADD CONSTRAINT "AttemptSession_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
