"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authApi, getErrorMessage, usersApi } from "@/lib/api";
import type { LoginPayload } from "@/lib/api/auth";
import type { ChangePasswordPayload, UpdateProfilePayload } from "@/lib/api/payloads";
import { dashboardPathForRole } from "@/lib/constants";
import { qk } from "@/lib/query/keys";
import { useAuthStore } from "@/store/auth";
import type { RegisterPayload } from "@/lib/types";

/** Current profile. Disabled until the persisted session has hydrated. */
export function useMe() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const hydrated = useAuthStore((state) => state.hydrated);
  return useQuery({
    queryKey: qk.auth.me,
    queryFn: () => authApi.me(),
    enabled: hydrated && Boolean(accessToken),
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: LoginPayload & { redirectTo?: string }) =>
      authApi.login({ email, password }),
    onSuccess: (data, variables) => {
      setAuth(data);
      queryClient.clear();
      toast.success(`Welcome back, ${data.user.name.split(" ")[0]}!`);
      router.replace(variables.redirectTo || dashboardPathForRole(data.user.role));
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRegister() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: RegisterPayload & { redirectTo?: string }) => {
      const { redirectTo: _redirectTo, ...payload } = variables;
      return authApi.register(payload);
    },
    onSuccess: (data, variables) => {
      // No-SMTP mode returns a live session immediately.
      if (!data.requiresVerification && data.accessToken && data.refreshToken) {
        setAuth({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });
        queryClient.clear();
        toast.success("Account created. Welcome aboard!");
        router.replace(variables.redirectTo || dashboardPathForRole(data.user.role));
        return;
      }
      toast.success("Account created. Check your inbox to confirm your email address.");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/** Confirms an email address using the token from the confirmation link. */
export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => authApi.verifyEmail(token),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/** Re-sends the confirmation email. */
export function useResendVerification() {
  return useMutation({
    mutationFn: (email: string) => authApi.resendVerification(email),
    onSuccess: () =>
      toast.success("If an unconfirmed account exists for that email, a new link has been sent."),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useLogout() {
  const { clear, refreshToken } = useAuthStore.getState();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // A failed logout must never trap the user in the app.
      }
    },
    onSettled: () => {
      clear();
      queryClient.clear();
      router.replace("/login");
    },
  });
}

export function useUpdateProfile() {
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => usersApi.updateProfile(payload),
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(qk.auth.me, user);
      queryClient.invalidateQueries({ queryKey: qk.users.me });
      toast.success("Profile updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => usersApi.changePassword(payload),
    onSuccess: () => toast.success("Password changed successfully"),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}