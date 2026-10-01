import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from "@/lib/api";
import { compactParams } from "@/lib/utils";
import type {
  CreateInterviewPayload,
  CreateSessionLinkPayload,
  CustomQuestionPayload,
  Interview,
  InterviewQuestion,
  InterviewReport,
  InterviewSessionReport,
  InterviewSessionResult,
  InterviewSessionSummary,
  InterviewTechnologyOption,
  PublicInterviewInfo,
  ReportViolationPayload,
  ReportViolationResult,
  SessionState,
  StartSessionPayload,
  StartSessionResult,
  SubmitAnswerPayload,
  UpdateInterviewPayload,
} from "@/lib/types";
import { endpoints } from "./endpoints";
import type { InterviewListParams, InterviewSessionListParams } from "./payloads";

/** Recruiter/admin API for proctored AI video interviews. */
export const interviewsApi = {
  technologies: () =>
    apiGet<{
      technologies: InterviewTechnologyOption[];
      defaults: { questionCount: number; questionTimeSeconds: number };
    }>(endpoints.interviews.technologies),

  list: (params?: InterviewListParams) =>
    apiGetPaginated<Interview>(endpoints.interviews.list, {
      params: compactParams({ ...(params ?? {}) }),
    }),

  byId: (id: string) => apiGet<Interview>(endpoints.interviews.byId(id)),

  create: (payload: CreateInterviewPayload) => apiPost<Interview>(endpoints.interviews.create, payload),

  update: (id: string, payload: UpdateInterviewPayload) =>
    apiPatch<Interview>(endpoints.interviews.byId(id), payload),

  remove: (id: string) => apiDelete<{ id: string }>(endpoints.interviews.byId(id)),

  publish: (id: string) => apiPost<Interview>(endpoints.interviews.publish(id)),

  close: (id: string) => apiPost<Interview>(endpoints.interviews.close(id)),

  regenerateQuestions: (id: string, payload?: { questionCount?: number; keepCustomQuestions?: boolean }) =>
    apiPost<InterviewQuestion[]>(
      endpoints.interviews.regenerateQuestions(id),
      payload ?? { keepCustomQuestions: true },
    ),

  addQuestion: (id: string, payload: CustomQuestionPayload) =>
    apiPost<InterviewQuestion>(endpoints.interviews.questions(id), payload),

  updateQuestion: (id: string, questionId: string, payload: Partial<CustomQuestionPayload>) =>
    apiPatch<InterviewQuestion>(endpoints.interviews.question(id, questionId), payload),

  removeQuestion: (id: string, questionId: string) =>
    apiDelete<{ id: string }>(endpoints.interviews.question(id, questionId)),

  createSessionLink: (id: string, payload: CreateSessionLinkPayload) =>
    apiPost<{ session: InterviewSessionSummary; link: string; reused: boolean }>(
      endpoints.interviews.sessions(id),
      payload,
    ),

  sessions: (id: string, params?: InterviewSessionListParams) =>
    apiGetPaginated<InterviewSessionSummary>(endpoints.interviews.sessions(id), {
      params: compactParams({ ...(params ?? {}) }),
    }),

  sessionReport: (id: string, sessionId: string) =>
    apiGet<InterviewSessionReport>(endpoints.interviews.session(id, sessionId)),

  reReview: (id: string, sessionId: string) =>
    apiPost<InterviewSessionResult>(endpoints.interviews.sessionReview(id, sessionId)),

  report: (id: string) => apiGet<InterviewReport>(endpoints.interviews.report(id)),
};

/* ------------------------------------------------- candidate (public link) */

/** Public candidate API — no login required, identified by the link token. */
export const interviewSessionApi = {
  info: (token: string) => apiGet<PublicInterviewInfo>(endpoints.interviewSessions.byToken(token)),

  start: (token: string, payload: StartSessionPayload) =>
    apiPost<StartSessionResult>(endpoints.interviewSessions.start(token), payload),

  state: (token: string) => apiGet<SessionState>(endpoints.interviewSessions.state(token)),

  reportViolation: (token: string, payload: ReportViolationPayload) =>
    apiPost<ReportViolationResult>(endpoints.interviewSessions.violations(token), payload),

  saveAnswer: (token: string, questionId: string, payload: SubmitAnswerPayload) =>
    apiPost<{ questionId: string; status: string; savedAt: string; warnings: string[] }>(
      endpoints.interviewSessions.answer(token, questionId),
      payload,
    ),

  submit: (
    token: string,
    reason: "CANDIDATE_SUBMIT" | "TIME_EXPIRED" | "PROCTORING" = "CANDIDATE_SUBMIT",
  ) => apiPost<InterviewSessionResult>(endpoints.interviewSessions.submit(token), { reason }),

  result: (token: string) =>
    apiGet<InterviewSessionResult>(endpoints.interviewSessions.result(token)),
};

export default interviewsApi;
