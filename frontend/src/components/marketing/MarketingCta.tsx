"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCurrentUser, useAuthStore } from "@/store/auth";
import type { Role } from "@/lib/types";

type MarketingCtaKind = "practice" | "question-bank";

const QUESTION_BANK_ROLES: Role[] = ["RECRUITER", "COMPANY", "ADMIN"];

export function MarketingCta({
  kind,
  label,
  variant = "default",
}: {
  kind: MarketingCtaKind;
  label: string;
  variant?: "default" | "link";
}) {
  const user = useCurrentUser();
  const hydrated = useAuthStore((state) => state.hydrated);

  // Do not briefly expose a workspace-only action while a persisted candidate
  // session is still being restored from localStorage.
  if (kind === "question-bank" && (!hydrated || user?.role === "CANDIDATE")) {
    return null;
  }

  const href =
    kind === "practice"
      ? user
        ? "/practice"
        : "/register/candidate"
      : user && QUESTION_BANK_ROLES.includes(user.role)
        ? "/recruiter/problems"
        : "/register/recruiter";

  if (variant === "link") {
    return (
      <Link
        href={href}
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:underline dark:text-primary-400"
      >
        {label}
        <ArrowRight className="size-3.5" />
      </Link>
    );
  }

  return (
    <Button asChild className="mt-8">
      <Link href={href}>
        {label}
        <ArrowRight />
      </Link>
    </Button>
  );
}

export default MarketingCta;
