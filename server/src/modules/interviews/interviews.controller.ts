import { Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import { AuthRequest } from "../../middlewares/auth";
import { InterviewService } from "./interviews.service";

const getMeta = (req: AuthRequest) => ({
  ip: req.ip ?? req.socket.remoteAddress ?? undefined,
  userAgent: req.headers["user-agent"] ?? undefined,
});

/* ------------------------------------------------------------------ reference */

const technologies = catchAsync(async (_req: AuthRequest, res: Response) => {
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Interview technologies retrieved successfully",
    data: InterviewService.listTechnologies(),
  });
});

/* ------------------------------------------------------ recruiter: interviews */

const create = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.createInterview(req.user!, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Interview created successfully",
    data: result,
  });
});

const list = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.listInterviews(
    req.user!,
    req.query as Record<string, never>,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Interviews retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getOne = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.getInterview(req.user!, String(req.params.id));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Interview retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.updateInterview(
    req.user!,
    String(req.params.id),
    req.body as Record<string, unknown>,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Interview updated successfully",
    data: result,
  });
});

const remove = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.deleteInterview(req.user!, String(req.params.id));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Interview archived successfully",
    data: result,
  });
});

const publish = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.publishInterview(req.user!, String(req.params.id));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Interview published — the candidate link is now live",
    data: result,
  });
});

const close = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.closeInterview(req.user!, String(req.params.id));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Interview closed to new candidates",
    data: result,
  });
});

const reopen = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.reopenInterview(
    req.user!,
    String(req.params.id),
    (req.body ?? {}) as { expiresAt?: string | null },
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Interview re-opened — the candidate link is live again",
    data: result,
  });
});

/* ------------------------------------------------------- recruiter: questions */

const regenerateQuestions = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.regenerateQuestions(
    req.user!,
    String(req.params.id),
    req.body ?? { keepCustomQuestions: true },
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "A new random set of questions was drawn from the technology bank",
    data: result,
  });
});

const addQuestion = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.addCustomQuestion(req.user!, String(req.params.id), req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Custom question added",
    data: result,
  });
});

const updateQuestion = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.updateQuestion(
    req.user!,
    String(req.params.id),
    String(req.params.questionId),
    req.body as Record<string, unknown>,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Question updated",
    data: result,
  });
});

const removeQuestion = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.deleteQuestion(
    req.user!,
    String(req.params.id),
    String(req.params.questionId),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Question removed",
    data: result,
  });
});

/* -------------------------------------------------------- recruiter: sessions */

const createSessionLink = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.createSessionLink(
    req.user!,
    String(req.params.id),
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: result.reused
      ? "An open session already exists for this candidate — reusing the link"
      : "Candidate interview link created",
    data: result,
  });
});

const listSessions = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.listSessions(
    req.user!,
    String(req.params.id),
    req.query as Record<string, never>,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Interview sessions retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSessionReport = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.getSessionReport(
    req.user!,
    String(req.params.id),
    String(req.params.sessionId),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "AI interview report retrieved successfully",
    data: result,
  });
});

const reReviewSession = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.reReviewSession(
    req.user!,
    String(req.params.id),
    String(req.params.sessionId),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "AI review re-run for this session",
    data: result,
  });
});

const report = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.getInterviewReport(req.user!, String(req.params.id));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Interview report retrieved successfully",
    data: result,
  });
});


/* --------------------------------------------------- recruiter: bank questions */

const bank = catchAsync(async (req: AuthRequest, res: Response) => {
  const query = req.query as { technology: string; q?: string };
  const result = InterviewService.listBankQuestions(query.technology, query.q);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Question bank retrieved successfully",
    data: result,
  });
});

const addBankQuestions = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.addBankQuestions(
    req.user!,
    String(req.params.id),
    (req.body as { keys: string[] }).keys,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Questions added from the bank",
    data: result,
  });
});

/* ------------------------------------------------------ recruiter: invitations */

const inviteCandidates = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.inviteCandidates(
    req.user!,
    String(req.params.id),
    req.body as { candidates: { email: string; name?: string; sendEmail?: boolean }[] },
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message:
      result.emailed > 0
        ? `Invited ${result.invited} candidate(s) — ${result.emailed} email(s) sent`
        : `Invited ${result.invited} candidate(s). Email is not configured, so share the links directly.`,
    data: result,
  });
});

const searchCandidates = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.searchInvitableCandidates(
    req.user!,
    req.query as { q?: string; limit?: number },
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Candidates retrieved successfully",
    data: result,
  });
});

const resendInvite = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.resendInvite(
    req.user!,
    String(req.params.id),
    String(req.params.sessionId),
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Invitation email sent again",
    data: result,
  });
});

/* -------------------------------------------------------- candidate (public) */

const publicInterview = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.getPublicInterview(String(req.params.token));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Interview details retrieved successfully",
    data: result,
  });
});

const startSession = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.startSession(
    String(req.params.token),
    req.body,
    getMeta(req),
    req.user,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Interview started",
    data: result,
  });
});

const sessionState = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.getSessionState(String(req.params.token));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Session state retrieved successfully",
    data: result,
  });
});

const reportViolation = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.reportViolation(String(req.params.token), req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: result.terminated
      ? "Proctoring violation recorded — the interview was terminated"
      : "Proctoring violation recorded",
    data: result,
  });
});

const saveAnswer = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.saveAnswer(
    String(req.params.token),
    String(req.params.questionId),
    req.body,
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Answer recorded",
    data: result,
  });
});

const submitSession = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.submitSession(
    String(req.params.token),
    req.body ?? { reason: "CANDIDATE_SUBMIT" },
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Interview submitted — the AI review has been sent to the organisation",
    data: result,
  });
});

const sessionResult = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.getSessionResult(String(req.params.token));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Interview result retrieved successfully",
    data: result,
  });
});

/* ------------------------------------------------ candidate: email verification */

const requestVerifyCode = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.requestVerificationCode(String(req.params.token));
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Verification code sent",
    data: result,
  });
});

const confirmVerifyCode = catchAsync(async (req: AuthRequest, res: Response) => {
  const result = await InterviewService.confirmVerificationCode(
    String(req.params.token),
    (req.body as { code: string }).code,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: "Email verified — you can start the interview",
    data: result,
  });
});

export const InterviewController = {
  technologies,
  create,
  list,
  getOne,
  update,
  remove,
  publish,
  close,
  reopen,
  regenerateQuestions,
  addQuestion,
  updateQuestion,
  removeQuestion,
  bank,
  addBankQuestions,
  inviteCandidates,
  searchCandidates,
  resendInvite,
  createSessionLink,
  listSessions,
  getSessionReport,
  reReviewSession,
  report,
  publicInterview,
  startSession,
  sessionState,
  reportViolation,
  saveAnswer,
  submitSession,
  sessionResult,
  requestVerifyCode,
  confirmVerifyCode,
};

