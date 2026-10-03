-- Interview invite window + secured per-candidate link (email verification)

-- AlterTable: Interview gains a "link becomes active" timestamp
ALTER TABLE "Interview" ADD COLUMN "startsAt" TIMESTAMP(3);

-- AlterTable: InterviewSession tracks invitation email + email ownership proof
ALTER TABLE "InterviewSession" ADD COLUMN "emailSentAt" TIMESTAMP(3);
ALTER TABLE "InterviewSession" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "InterviewSession" ADD COLUMN "verificationCodeHash" TEXT;
ALTER TABLE "InterviewSession" ADD COLUMN "verificationCodeExpiresAt" TIMESTAMP(3);