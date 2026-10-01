"use client";

import Link from "next/link";
import { MailCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useResendVerification } from "@/hooks/useAuth";

/**
 * "Check your inbox" confirmation screen shown after registration once the
 * confirmation email has been sent (email confirmation flow, point 6).
 */
export function CheckInbox({
  email,
  companyCode,
  next,
}: {
  email: string;
  companyCode?: string | null;
  /** Deep link to return to after confirming + signing in. */
  next?: string;
}) {
  const resend = useResendVerification();
  const signInHref = next
    ? `/login?next=${encodeURIComponent(next)}`
    : "/login";

  return (
    <div className="text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-300">
        <MailCheck className="size-7" />
      </span>
      <h2 className="mt-4 text-xl font-semibold text-foreground">Confirm your email</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        We sent a confirmation link to{" "}
        <span className="font-medium text-foreground">{email}</span>. Open it to activate your
        account, then sign in.
      </p>

      {companyCode && (
        <div className="mt-5 rounded-xl border border-border bg-muted/40 p-4 text-left">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <KeyRound className="size-4" />
            Your company join code
          </p>
          <p className="mt-2 rounded-lg bg-card px-3 py-2 text-center font-mono text-base tracking-widest text-foreground ring-1 ring-border">
            {companyCode}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Share this code with your recruiters so they can join your company when they register.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          loading={resend.isPending}
          onClick={() => resend.mutate(email)}
        >
          Resend confirmation email
        </Button>
        <Button variant="outline" size="lg" className="w-full" asChild>
          <Link href={signInHref}>I&apos;ve confirmed — sign in</Link>
        </Button>
      </div>
    </div>
  );
}

export default CheckInbox;
