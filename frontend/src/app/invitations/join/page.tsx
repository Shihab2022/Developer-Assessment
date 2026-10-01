"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Lock,
  LogIn,
  Timer,
  UserPlus,
} from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Primitives";
import { attemptsApi, getErrorMessage, invitationsApi } from "@/lib/api";
import { loginPathFor } from "@/lib/constants";
import { useAuthStore, useCurrentUser } from "@/store/auth";

export default function InvitationJoinPage() {
  return (
    <Suspense fallback={null}>
      <InvitationJoinView />
    </Suspense>
  );
}

function InvitationJoinView() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const router = useRouter();
  const user = useCurrentUser();
  const accessToken = useAuthStore((s) => s.accessToken);

  const nextPath = `/invitations/join?token=${encodeURIComponent(token)}`;
  const registerHref = `/register/candidate?next=${encodeURIComponent(nextPath)}`;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["invitation", "token", token],
    queryFn: () => invitationsApi.byToken(token),
    enabled: Boolean(token),
    retry: false,
  });

  const start = useMutation({
    mutationFn: async (assessmentId: string) => {
      // 1. accept the invitation for this email, 2. immediately start the exam.
      await invitationsApi.acceptByToken(token);
      return attemptsApi.start(assessmentId);
    },
    onSuccess: (attempt) => router.replace(`/candidate/attempts/${attempt.id}`),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const signOutAndSwitch = () => {
    useAuthStore.getState().clear();
    router.replace(loginPathFor(nextPath));
  };

  if (!token) {
    return (
      <Shell title="Invalid exam link">
        <p className="text-center text-sm text-muted-foreground">
          This link is missing its token. Please open the invitation email again.
        </p>
        <div className="mt-6 text-center">
          <Button variant="outline" asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  if (isLoading) {
    return (
      <Shell title="Loading your invitation…">
        <div className="flex justify-center py-6">
          <Spinner className="size-6" />
        </div>
      </Shell>
    );
  }

  if (isError || !data) {
    return (
      <Shell title="Link not found">
        <p className="text-center text-sm text-muted-foreground">
          This invitation link is invalid or has been revoked. Contact the recruiter who invited
          you.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  const inv = data;
  const assessment = inv.assessment;
  const signedIn = Boolean(accessToken && user);
  const emailMismatch = signedIn && user!.email.toLowerCase() !== inv.email.toLowerCase();

  return (
    <Shell
      eyebrow={
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-300">
          <Timer className="size-6" />
        </span>
      }
      title={assessment.title}
      subtitle={
        assessment.company?.name
          ? `Invited by ${assessment.company.name}`
          : "You have been invited to an assessment."
      }
    >
      <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
        <Row icon={Clock} label="Duration">
          {assessment.durationMinutes} minutes
        </Row>
        <Row icon={Lock} label="Invited email">
          <span className="font-medium text-foreground">{inv.email}</span>
        </Row>
        {assessment.company && (
          <Row icon={Building2} label="Company">
            {assessment.company.name}
          </Row>
        )}
        {assessment.description && (
          <Row icon={AlertTriangle} label="About">
            <span className="line-clamp-3">{assessment.description}</span>
          </Row>
        )}
      </div>

      {emailMismatch && (
        <Notice tone="warn" icon={AlertTriangle} title="Wrong account">
          <p>
            You are signed in as <b>{user!.email}</b>, but this invitation was sent to{" "}
            <b>{inv.email}</b>. Sign in with the invited address to start.
          </p>
          <Button size="sm" variant="outline" className="mt-3" onClick={signOutAndSwitch}>
            Switch account
          </Button>
        </Notice>
      )}

      {!signedIn && !emailMismatch && (
        <Notice tone="info" icon={LogIn} title="Sign in to start">
          <p>
            Create an account (or sign in) with <b>{inv.email}</b> to open your exam.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <Button asChild>
              <Link href={loginPathFor(nextPath)}>
                <LogIn />
                Sign in
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={registerHref}>
                <UserPlus />
                Register as a candidate
              </Link>
            </Button>
          </div>
        </Notice>
      )}

      {!inv.usable && signedIn && !emailMismatch && (
        <Notice tone="warn" icon={AlertTriangle} title="Not available">
          <p>
            {inv.alreadyAttempted
              ? "You have already started this assessment with this email address and cannot take it again."
              : inv.expired
                ? "This invitation has expired. Ask the recruiter for a new one."
                : "This invitation is no longer active."}
          </p>
        </Notice>
      )}

      {signedIn && !emailMismatch && inv.usable && (
        <Notice tone="success" icon={CheckCircle2} title="Ready to begin">
          <p>
            Starting the exam begins a server-timed session. Once submitted you cannot take it
            again with this email.
          </p>
          <Button
            className="mt-4 w-full"
            size="lg"
            disabled={start.isPending}
            loading={start.isPending}
            onClick={() => start.mutate(assessment.id)}
          >
            Start my exam
          </Button>
        </Notice>
      )}
    </Shell>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="mt-0.5 block text-sm text-foreground">{children}</span>
      </span>
    </div>
  );
}

function Notice({
  tone,
  icon: Icon,
  title,
  children,
}: {
  tone: "info" | "warn" | "success";
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  const tones = {
    info: "border-primary-200 bg-primary-50/60 dark:border-primary-900/60 dark:bg-primary-950/40",
    warn: "border-amber-300/60 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/40",
    success:
      "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/40",
  }[tone];

  return (
    <div className={`mt-4 rounded-xl border p-4 ${tones}`}>
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="size-4" />
        {title}
      </p>
      <div className="mt-2 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

function Shell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <AuthShell
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
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
