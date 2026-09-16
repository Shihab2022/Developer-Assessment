"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { qk } from "@/lib/query/keys";
import { useAuthStore } from "@/store/auth";

/** RECRUITER dashboard (also served to ADMIN). */
export function useRecruiterDashboard() {
  const { user, accessToken, hydrated } = useAuthStore();
  const allowed = user?.role === "RECRUITER" || user?.role === "ADMIN";
  return useQuery({
    queryKey: qk.dashboard.recruiter,
    queryFn: () => dashboardApi.recruiter(),
    enabled: hydrated && Boolean(accessToken) && allowed,
  });
}

export function useCandidateDashboard() {
  const { user, accessToken, hydrated } = useAuthStore();
  return useQuery({
    queryKey: qk.dashboard.candidate,
    queryFn: () => dashboardApi.candidate(),
    enabled: hydrated && Boolean(accessToken) && user?.role === "CANDIDATE",
  });
}