import express from "express";
import { AuthRouter } from "../modules/auth/auth.routes";
import { UserRouter } from "../modules/users/users.routes";
import { CompanyRouter } from "../modules/companies/companies.routes";
import { ProblemRouter } from "../modules/problems/problems.routes";
import { AssessmentRouter } from "../modules/assessments/assessments.routes";
import {
  InvitationRouter,
  CandidateInvitationRouter,
} from "../modules/invitations/invitations.routes";
import {
  AttemptRouter,
  CandidateAttemptRouter,
  startAttemptRouter,
} from "../modules/attempts/attempts.routes";
import {
  SubmissionRouter,
  attemptSubmissionsRouter,
  assessmentSubmissionsRouter,
} from "../modules/submissions/submissions.routes";
import {
  EvaluationRouter,
  attemptEvaluationRouter,
  assessmentEvaluationRouter,
} from "../modules/evaluations/evaluations.routes";
import {
  ResultRouter,
  candidateResultRouter,
  assessmentResultRouter,
} from "../modules/results/results.routes";
import {
  assessmentReportRouter,
  companyReportRouter,
} from "../modules/reports/reports.routes";
import { assessmentAnalyticsRouter } from "../modules/analytics/analytics.routes";
import { PaymentRouter } from "../modules/payments/payments.routes";
import { AdminRouter } from "../modules/admin/admin.routes";
import { NoteRouter } from "../modules/notes/notes.routes";
import { NotificationRouter } from "../modules/notifications/notifications.routes";
import { DashboardRouter } from "../modules/dashboard/dashboard.routes";
import { InterviewRouter, InterviewSessionRouter } from "../modules/interviews/interviews.routes";
import swaggerUi from "swagger-ui-express";
import { swaggerDocument } from "../docs/swagger";

const router = express.Router();

// Auth: /api/v1/auth
router.use("/auth", AuthRouter);

// Users: /api/v1/users
router.use("/users", UserRouter);

// Candidates: /api/v1/candidates
router.use("/candidates/me", CandidateAttemptRouter);
router.use("/candidates/me", candidateResultRouter);
router.use("/candidates", CandidateInvitationRouter);

// Companies: /api/v1/companies
router.use("/companies", CompanyRouter);

// Reports on companies: /api/v1/companies/:id/reports
router.use("/companies/:id/reports", companyReportRouter);

// Problems: /api/v1/problems
router.use("/problems", ProblemRouter);

// Assessments: /api/v1/assessments
router.use("/assessments", AssessmentRouter);

// Assessment sub-resources
router.use("/assessments/:id/attempts", startAttemptRouter);
router.use("/assessments/:id/submissions", assessmentSubmissionsRouter);
router.use("/assessments/:id/evaluations", assessmentEvaluationRouter);
router.use("/assessments/:id/results", assessmentResultRouter);
router.use("/assessments/:id/report", assessmentReportRouter);
router.use("/assessments/:id/analytics", assessmentAnalyticsRouter);

// Invitations: /api/v1/invitations
router.use("/invitations", InvitationRouter);

// Attempts: /api/v1/attempts
router.use("/attempts", AttemptRouter);

// Attempts sub-resources
router.use("/attempts/:id/submissions", attemptSubmissionsRouter);
router.use("/attempts/:id/evaluations", attemptEvaluationRouter);

// Submissions: /api/v1/submissions
router.use("/submissions", SubmissionRouter);

// Evaluations: /api/v1/evaluations
router.use("/evaluations", EvaluationRouter);

// Results: /api/v1/results
router.use("/results", ResultRouter);

// Payments: /api/v1/payments
router.use("/payments", PaymentRouter);

// Admin: /api/v1/admin
router.use("/admin", AdminRouter);

// Notes: /api/v1/notes
router.use("/notes", NoteRouter);

// Notifications: /api/v1/notifications
router.use("/notifications", NotificationRouter);

// Dashboard: /api/v1/dashboard
router.use("/dashboard", DashboardRouter);

// Video interviews: /api/v1/interviews (recruiter/admin)
router.use("/interviews", InterviewRouter);

// Video interview sessions: /api/v1/interview-sessions (public candidate link)
router.use("/interview-sessions", InterviewSessionRouter);

// Swagger docs: /api/docs
router.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

export const rootRouter = router;
