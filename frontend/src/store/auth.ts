import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthPayload, Role, User } from "@/lib/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** True once zustand has rehydrated from localStorage (avoids hydration flashes). */
  hydrated: boolean;
  setAuth: (payload: AuthPayload) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  clear: () => void;
  setHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      hydrated: false,
      setAuth: ({ user, accessToken, refreshToken }) => set({ user, accessToken, refreshToken }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      clear: () => set({ user: null, accessToken: null, refreshToken: null }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "devassess-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

/** Non-reactive helpers for use outside React (route guards, interceptors). */
export const authStore = {
  get: () => useAuthStore.getState(),
  isAuthenticated: () => Boolean(useAuthStore.getState().accessToken),
  hasRole: (role: Role) => useAuthStore.getState().user?.role === role,
};

/** Safe SSR selector — returns null until the client has rehydrated. */
export function useCurrentUser(): User | null {
  return useAuthStore((state) => (state.hydrated ? state.user : null));
}