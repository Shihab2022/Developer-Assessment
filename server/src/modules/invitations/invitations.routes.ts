import express from "express";
import { InvitationController } from "./invitations.controller";
import auth from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import {
  createInvitationSchema,
  invitationListQuerySchema,
  invitationParamsSchema,
  invitationTokenParamsSchema,
} from "./invitations.validation";
import { invitationRateLimiter } from "../../middlewares/rateLimiter";

// Routes under /api/v1/invitations
export const InvitationRouter = express.Router();

// Public exam-link lookup (opened from the invitation email, before sign-in).
InvitationRouter.get(
  "/token/:token",
  validate(invitationTokenParamsSchema),
  InvitationController.getByToken,
);

// Candidate accepts their personal exam link after signing in.
InvitationRouter.post(
  "/token/:token/accept",
  auth("CANDIDATE"),
  validate(invitationTokenParamsSchema),
  InvitationController.acceptByToken,
);

InvitationRouter.post(
  "/:id/resend",
  invitationRateLimiter,
  auth("RECRUITER", "ADMIN"),
  validate(invitationParamsSchema),
  InvitationController.resend,
);

InvitationRouter.post(
  "/:id/accept",
  auth("CANDIDATE"),
  validate(invitationParamsSchema),
  InvitationController.accept,
);

InvitationRouter.post(
  "/:id/reject",
  auth("CANDIDATE"),
  validate(invitationParamsSchema),
  InvitationController.reject,
);

// Routes for /api/v1/candidates/invitations
export const CandidateInvitationRouter = express.Router();

CandidateInvitationRouter.get(
  "/invitations",
  auth("CANDIDATE"),
  InvitationController.listForCandidate,
);

// Assessment-scoped invitation routes mounted inside the assessments module.
export const assessmentInvitationRouter = express.Router({ mergeParams: true });

assessmentInvitationRouter.post(
  "/",
  invitationRateLimiter,
  auth("RECRUITER", "ADMIN"),
  validate(createInvitationSchema),
  InvitationController.createForAssessment,
);

assessmentInvitationRouter.get(
  "/",
  auth("RECRUITER", "ADMIN"),
  validate(invitationListQuerySchema),
  InvitationController.listForAssessment,
);
