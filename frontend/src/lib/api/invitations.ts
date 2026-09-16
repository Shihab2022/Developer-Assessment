import { apiGetPaginated, apiPost } from "@/lib/api";
import { compactParams } from "@/lib/utils";
import type { Invitation } from "@/lib/types";
import { endpoints } from "./endpoints";
import type { InvitationListParams } from "./payloads";

export const invitationsApi = {
  /** Invitations addressed to the signed-in candidate. */
  mine: (params?: InvitationListParams) =>
    apiGetPaginated<Invitation>(endpoints.invitations.mine, {
      params: compactParams({ ...(params ?? {}) }),
    }),

  resend: (id: string) => apiPost<unknown>(endpoints.invitations.resend(id)),

  accept: (id: string) => apiPost<Invitation>(endpoints.invitations.accept(id)),

  reject: (id: string) => apiPost<Invitation>(endpoints.invitations.reject(id)),
};

export default invitationsApi;