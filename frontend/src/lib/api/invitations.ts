import { apiGet, apiGetPaginated, apiPost } from "@/lib/api";
import { compactParams } from "@/lib/utils";
import type { AssessmentStatus, Invitation, InvitationStatus } from "@/lib/types";
import { endpoints } from "./endpoints";
import type { InvitationListParams } from "./payloads";

/** Public view of an invitation resolved from a personal exam link. */
export interface InvitationByToken {
  id: string;
  email: string;
  status: InvitationStatus;
  expiresAt?: string | null;
  expired: boolean;
  closed: boolean;
  alreadyAttempted: boolean;
  accountExists: boolean;
  usable: boolean;
  candidate?: { id: string; name: string; email: string } | null;
  assessment: {
    id: string;
    title: string;
    description?: string | null;
    instructions?: string | null;
    durationMinutes: number;
    status?: AssessmentStatus;
    startDate?: string | null;
    endDate?: string | null;
    showResults?: boolean;
    maxAttempts?: number;
    company?: { id: string; name: string; logo?: string | null } | null;
  };
}

export const invitationsApi = {
  /** Invitations addressed to the signed-in candidate. */
  mine: (params?: InvitationListParams) =>
    apiGetPaginated<Invitation>(endpoints.invitations.mine, {
      params: compactParams({ ...(params ?? {}) }),
    }),

  resend: (id: string) => apiPost<unknown>(endpoints.invitations.resend(id)),

  accept: (id: string) => apiPost<Invitation>(endpoints.invitations.accept(id)),

  reject: (id: string) => apiPost<Invitation>(endpoints.invitations.reject(id)),

  /** Resolve a personal exam link (public — used before sign-in). */
  byToken: (token: string) =>
    apiGet<InvitationByToken>(endpoints.invitations.byToken(token)),

  /** Accept the exam link as the signed-in candidate. */
  acceptByToken: (token: string) =>
    apiPost<{ invitation: Invitation; assessmentId: string }>(
      endpoints.invitations.acceptByToken(token),
    ),
};

export default invitationsApi;