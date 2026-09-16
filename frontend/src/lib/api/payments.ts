import { apiGet, apiGetPaginated, apiPost } from "@/lib/api";
import { compactParams } from "@/lib/utils";
import type { PaymentListParams } from "./payloads";
import type {
  InitiatePaymentPayload,
  InitiatePaymentResult,
  Payment,
  PaymentPackage,
} from "@/lib/types";
import { endpoints } from "./endpoints";

export const paymentsApi = {
  /** Public endpoint — powers the landing-page pricing table. */
  packages: () => apiGet<PaymentPackage[]>(endpoints.payments.packages),

  initiate: (payload: InitiatePaymentPayload) =>
    apiPost<InitiatePaymentResult>(endpoints.payments.initiate, payload),

  byId: (id: string) => apiGet<Payment>(endpoints.payments.byId(id)),

  list: (params?: PaymentListParams) =>
    apiGetPaginated<Payment>(endpoints.payments.list, {
      params: compactParams({ ...(params ?? {}) }),
    }),
};

export default paymentsApi;