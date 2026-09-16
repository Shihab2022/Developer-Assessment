import { apiGet, apiGetPaginated, apiPatch, apiPost } from "@/lib/api";
import { compactParams } from "@/lib/utils";
import type {
  AntiCheatEvent,
  AntiCheatEventPayload,
  AntiCheatingReport,
  Attempt,
  AttemptAnswer,
  AttemptQuestion,
  AttemptTime,
  Evaluation,
  SaveAnswerPayload,
  Submission,
  SubmitAttemptResult,
} from "@/lib/types";
import { endpoints } from "./endpoints";
import type { AttemptListParams, ListParams } from "./payloads";

export const attemptsApi = {
  /* ---- candidate ---- */

  mine: (params?: AttemptListParams) =>
    apiGetPaginated<Attempt>(endpoints.attempts.mine, { params: compactParams({ ...(params ?? {}) }) }),

  byId: (id: string) => apiGet<Attempt>(endpoints.attempts.byId(id)),

  /** Server-authoritative remaining time. */
  time: (id: string) => apiGet<AttemptTime>(endpoints.attempts.time(id)),

  questions: (id: string) => apiGet<AttemptQuestion[]>(endpoints.attempts.questions(id)),

  saveAnswer: (id: string, payload: SaveAnswerPayload) =>
    apiPost<AttemptAnswer>(endpoints.attempts.answers(id), payload),

  updateAnswer: (id: string, answerId: string, payload: Partial<SaveAnswerPayload>) =>
    apiPatch<AttemptAnswer>(endpoints.attempts.answer(id, answerId), payload),

  submit: (id: string) => apiPost<SubmitAttemptResult>(endpoints.attempts.submit(id)),

  /* ---- shared ---- */

  submissions: (id: string, params?: ListParams) =>
    apiGetPaginated<Submission>(endpoints.attempts.submissions(id), {
      params: compactParams({ ...(params ?? {}) }),
    }),

  evaluations: (id: string, params?: ListParams) =>
    apiGetPaginated<Evaluation>(endpoints.attempts.evaluations(id), {
      params: compactParams({ ...(params ?? {}) }),
    }),

  antiCheatingEvents: (id: string, params?: ListParams) =>
    apiGetPaginated<AntiCheatEvent>(endpoints.attempts.antiCheatingEvents(id), {
      params: compactParams({ ...(params ?? {}) }),
    }),

  antiCheatingReport: (id: string) =>
    apiGet<AntiCheatingReport>(endpoints.attempts.antiCheatingReport(id)),

  reportAntiCheatEvent: (id: string, payload: AntiCheatEventPayload) =>
    apiPost<AntiCheatEvent>(endpoints.attempts.antiCheatingEvents(id), payload),
};

export default attemptsApi;