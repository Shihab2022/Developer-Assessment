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

-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "accessCodeHash" TEXT,
ADD COLUMN     "accessLevel" "AssessmentAccessLevel" NOT NULL DEFAULT 'INVITATION_ONLY',
ADD COLUMN     "questionConfig" JSONB,
ADD COLUMN     "resultStrategy" "ResultStrategy" NOT NULL DEFAULT 'LATEST_SCORE',
ADD COLUMN     "showCandidateRanking" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "shuffleOptions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "templateId" TEXT;

-- AlterTable
ALTER TABLE "Attempt" ADD COLUMN     "shuffledOptions" JSONB,
ADD COLUMN     "shuffledQuestionOrder" JSONB;

-- AlterTable
ALTER TABLE "CreditTransaction" ADD COLUMN     "category" "CreditTransactionCategory" NOT NULL DEFAULT 'CREDIT_PURCHASE';

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "recruitmentStatus" "RecruitmentStatus" NOT NULL DEFAULT 'INVITED';

-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "allowedLanguages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "averageScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "examples" JSONB,
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "timesAttempted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "timesSolved" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "timesUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "rank" INTEGER;

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

-- CreateIndex
CREATE INDEX "AssessmentTemplate_status_idx" ON "AssessmentTemplate"("status");

-- CreateIndex
CREATE INDEX "CandidateNote_candidateId_idx" ON "CandidateNote"("candidateId");

-- CreateIndex
CREATE INDEX "CandidateNote_assessmentId_idx" ON "CandidateNote"("assessmentId");

-- CreateIndex
CREATE INDEX "CandidateNote_companyId_idx" ON "CandidateNote"("companyId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "AttemptSession_attemptId_idx" ON "AttemptSession"("attemptId");

-- CreateIndex
CREATE INDEX "AttemptSession_sessionId_idx" ON "AttemptSession"("sessionId");

-- CreateIndex
CREATE INDEX "AttemptSession_ipAddress_idx" ON "AttemptSession"("ipAddress");

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AssessmentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentTemplate" ADD CONSTRAINT "AssessmentTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentTemplate" ADD CONSTRAINT "AssessmentTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateNote" ADD CONSTRAINT "CandidateNote_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateNote" ADD CONSTRAINT "CandidateNote_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateNote" ADD CONSTRAINT "CandidateNote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateNote" ADD CONSTRAINT "CandidateNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptSession" ADD CONSTRAINT "AttemptSession_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
