"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage, paymentsApi } from "@/lib/api";
import type { PaymentListParams } from "@/lib/api/payloads";
import { qk } from "@/lib/query/keys";
import type { InitiatePaymentPayload } from "@/lib/types";

/** Public endpoint — safe to call from the marketing site. */
export function usePaymentPackages() {
  return useQuery({
    queryKey: qk.payments.packages,
    queryFn: () => paymentsApi.packages(),
    staleTime: 10 * 60_000,
  });
}

export function usePayments(params?: PaymentListParams) {
  return useQuery({
    queryKey: qk.payments.list(params),
    queryFn: () => paymentsApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function usePayment(id: string | undefined) {
  return useQuery({
    queryKey: qk.payments.detail(id ?? ""),
    queryFn: () => paymentsApi.byId(id!),
    enabled: Boolean(id),
  });
}

/**
 * Starts an SSLCommerz checkout.
 *
 * The API returns either a live `gatewayUrl` or a `mockUrl` when the gateway
 * credentials are not configured (test mode) — both are real, redirectable URLs.
 */
export function useInitiatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InitiatePaymentPayload) => paymentsApi.initiate(payload),
    onSuccess: (result) => {
      const url = result.gatewayUrl ?? result.mockUrl;
      queryClient.invalidateQueries({ queryKey: qk.payments.list() });
      if (url) {
        window.location.href = url;
        return;
      }
      toast.success("Payment initiated — check the payment list for its status.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}