"use client";

import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, MailCheck } from "lucide-react";
import { useVerifyEmail } from "@/hooks/useAuth";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Primitives";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailView />
    </Suspense>
  );
}

function VerifyEmailView() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const verify = useVerifyEmail();
  const attempted = useRef(false);

  const { mutate, isPending, isSuccess, isError } = verify;

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    mutate(token);
  }, [token, mutate]);

  if (!token) {
    return (
      <Shell title="Invalid confirmation link">
        <div className="text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <XCircle className="size-7" />
          </span>
          <p className="mt-4 text-sm text-muted-foreground">
            This confirmation link is missing its token. Please open the link from your email
            again, or request a new one.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button variant="primary" size="lg" asChild>
              <Link href="/login">Go to sign in</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/register">Register again</Link>
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  if (isPending) {
    return (
      <Shell title="Confirming your email…">
        <div className="flex flex-col items-center py-6">
          <Spinner className="size-6" />
          <p className="mt-4 text-sm text-muted-foreground">
            Please wait while we confirm your address.
          </p>
        </div>
      </Shell>
    );
  }

  if (isError) {
    return (
      <Shell title="Confirmation failed">
        <div className="text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <XCircle className="size-7" />
          </span>
          <p className="mt-4 text-sm text-muted-foreground">
            This confirmation link is invalid, already used, or has expired. Request a fresh one
            after signing in, or register again.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button variant="primary" size="lg" asChild>
              <Link href="/login">Go to sign in</Link>
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  if (isSuccess) {
    return (
      <Shell title="Email confirmed 🎉">
        <div className="text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
            <CheckCircle2 className="size-7" />
          </span>
          <p className="mt-4 text-sm text-muted-foreground">
            Your account is now active. Sign in to continue.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button variant="primary" size="lg" asChild>
              <Link href="/login">Continue to sign in</Link>
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  return null;
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <AuthShell
      eyebrow={
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-300">
          <MailCheck className="size-6" />
        </span>
      }
      title={title}
      footer={
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Back to home
          </Link>
        </p>
      }
    >
      {children}
    </AuthShell>
  );
}
