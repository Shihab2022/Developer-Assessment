"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { SESSION_EXPIRED_EVENT } from "@/lib/api";
import { getQueryClient } from "@/lib/query/client";
import { useAuthStore } from "@/store/auth";

/**
 * Wires the session-expired broadcast (fired by the axios 401 interceptor) to a
 * hard redirect so expired sessions always land on the login screen.
 */
function SessionSync() {
  const { clear, hydrated } = useAuthStore((s) => ({ clear: s.clear, hydrated: s.hydrated }));
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    const onExpired = () => {
      clear();
      router.replace("/login");
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [clear, hydrated, router]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <SessionSync />
          <Toaster
            richColors
            closeButton
            position="bottom-right"
            toastOptions={{ className: "font-sans" }}
          />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
