"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Building2,
  MailCheck,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useLogin, useResendVerification } from "@/hooks/useAuth";
import { getErrorStatus } from "@/lib/api";
import { Label, FormError } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/brand/Logo";
import { APP_NAME, dashboardPathForRole } from "@/lib/constants";
import { useCurrentUser } from "@/store/auth";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

const HIGHLIGHTS = [
  { icon: ShieldCheck, title: "Proctored & secure", text: "Server-timed attempts with anti-cheating signals." },
  { icon: BarChart3, title: "Instant results", text: "Automatic scoring and per-skill analytics." },
  { icon: Users, title: "Invite candidates", text: "Send a personal exam link straight to their inbox." },
];

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const { mutate: login, isPending, error } = useLogin();
  const resend = useResendVerification();
  const user = useCurrentUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const homeHref = user ? dashboardPathForRole(user.role) : "/";
  const status = getErrorStatus(error);
  const errorMessage = error
    ? (error as { message?: string })?.message ?? "Invalid credentials"
    : null;
  const mustVerify = status === 403;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password, redirectTo: next || undefined });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-violet-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-16 size-80 rounded-full bg-violet-400/20 blur-2xl" />

        <div className="relative">
          <Link href={homeHref} aria-label={`${APP_NAME} home`} className="flex items-center gap-2.5">
            <img src="/icon-512.png" alt="" className="size-9 rounded-xl" />
            <span className="text-lg font-semibold tracking-tight text-white">{APP_NAME}</span>
          </Link>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight">
            Hire with confidence, screen with precision.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/80">
            Build coding, MCQ and written assessments, invite candidates and review results — all
            in one place.
          </p>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-xs text-white/70">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </aside>

      <main className="flex items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950/40">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandLogo href={homeHref} />
          </div>

          <div className="mb-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-950/50 dark:text-primary-300">
              <Sparkles className="size-3.5" />
              Welcome back
            </span>
            <h1 className="mt-3 text-3xl font-bold text-foreground">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your details to continue to your dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormError message={errorMessage} />

            {mustVerify && (
              <div className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                <p className="flex items-center gap-2 font-medium">
                  <MailCheck className="size-4" />
                  Email not confirmed yet
                </p>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="mt-1 h-auto p-0"
                  loading={resend.isPending}
                  onClick={() => resend.mutate(email)}
                >
                  Resend the confirmation email
                </Button>
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
                className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25"
              />
            </div>

            <PasswordInput
              id="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={isPending}
            >
              Sign in
              <ArrowRight />
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-center text-sm text-muted-foreground">
            <p>
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-medium text-primary-600 hover:underline">
                Create one
              </Link>
            </p>
            <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
              <Link href="/register/candidate" className="hover:text-foreground">
                Candidate sign up
              </Link>
              <span aria-hidden="true">•</span>
              <Link href="/register/recruiter" className="hover:text-foreground">
                Recruiter sign up
              </Link>
              <span aria-hidden="true">•</span>
              <Link
                href="/register/company"
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <Building2 className="size-3.5" />
                Company sign up
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
