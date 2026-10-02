"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  MailCheck,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useLogin, useResendVerification } from "@/hooks/useAuth";
import { getErrorStatus } from "@/lib/api";
import { Input, Label, FormError } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  APP_NAME,
  PROBLEM_TYPES,
  PROGRAMMING_LANGUAGES,
  ROLES,
  dashboardPathForRole,
} from "@/lib/constants";
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

/** Trust strip at the foot of the brand panel (counts derived from real enums). */
const PANEL_STATS = [
  { value: `${PROGRAMMING_LANGUAGES.length}`, label: "Languages" },
  { value: `${PROBLEM_TYPES.length}`, label: "Question formats" },
  { value: `${ROLES.length}`, label: "Workspace roles" },
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
    <div className="relative grid min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/70 lg:grid-cols-2 dark:from-slate-950 dark:via-slate-950 dark:to-primary-950/50">
      <aside className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        {/* Layered mesh gradient: indigo → violet base, with sky + violet glows. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-600 to-violet-700"
        />
        <div aria-hidden="true" className="grid-bg absolute inset-0 opacity-[0.15] mix-blend-overlay" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 size-96 rounded-full bg-sky-400/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-24 size-96 rounded-full bg-violet-400/35 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-white/10 to-transparent"
        />

        <div className="relative">
          <Link href={homeHref} aria-label={`${APP_NAME} home`} className="flex items-center gap-2.5">
            <img src="/icon-512.png" alt="" className="size-9 rounded-xl shadow-glow" />
            <span className="text-lg font-semibold tracking-tight text-white">{APP_NAME}</span>
          </Link>
        </div>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
            <Sparkles className="size-3.5" />
            Developer assessment platform
          </span>
          <h2 className="mt-5 text-4xl font-bold leading-[1.15] tracking-tight text-white">
            Hire with confidence, screen with precision.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/75">
            Build coding, MCQ and written assessments, invite candidates and review results — all
            in one place.
          </p>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/20">
                  <Icon className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{title}</span>
                  <span className="block text-xs text-white/70">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="flex items-center gap-10 border-t border-white/15 pt-6">
            {PANEL_STATS.map((stat) => (
              <div key={stat.label}>
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-white/50">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </aside>

      <main className="relative flex items-center justify-center px-4 py-12 sm:px-8">
        {/* Ambient brand glow behind the card. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-brand-fade"
        />
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>

        <div className="relative w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandLogo href={homeHref} size="lg" />
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/85 p-6 pt-8 shadow-pop backdrop-blur-xl sm:p-8 sm:pt-9">
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-violet-500 to-sky-400"
            />

            <div className="mb-6 text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200/70 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:border-primary-900/60 dark:bg-primary-950/50 dark:text-primary-300">
                <Sparkles className="size-3.5" />
                Welcome back
              </span>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">Sign in</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your details to continue to your dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormError message={errorMessage} />

              {mustVerify && (
                <div className="flex flex-col items-start gap-1 rounded-xl border border-amber-300/60 bg-amber-50 px-3.5 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                  <p className="flex items-center gap-2 font-medium">
                    <MailCheck className="size-4" />
                    Email not confirmed yet
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    loading={resend.isPending}
                    onClick={() => resend.mutate(email)}
                  >
                    Resend the confirmation email
                  </Button>
                </div>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  autoComplete="email"
                  className="h-11"
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
                className="h-11"
              />

              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-primary-600 via-primary-600 to-violet-600 shadow-glow transition-shadow hover:from-primary-700 hover:via-primary-700 hover:to-violet-700 hover:shadow-pop"
                loading={isPending}
              >
                Sign in
                <ArrowRight />
              </Button>

              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground lg:justify-start">
                <CheckCircle2 className="size-3.5 text-success" />
                Session protected by refresh-token rotation.
              </p>
            </form>

            <div className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">
              <p>
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-primary-600 hover:underline dark:text-primary-400"
                >
                  Create one
                </Link>
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
                <SignupPill href="/register/candidate" icon={Users} label="Candidate" />
                <SignupPill href="/register/recruiter" icon={Users} label="Recruiter" />
                <SignupPill href="/register/company" icon={Building2} label="Company" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Compact sign-up shortcut pill rendered under the sign-in form. */
function SignupPill({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-primary-950/40 dark:hover:text-primary-300"
    >
      <Icon className="size-3.5" />
      {label}
    </Link>
  );
}
