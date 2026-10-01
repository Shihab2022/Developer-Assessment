"use client";

import { useParams } from "next/navigation";
import { AttemptRunner } from "@/components/candidate/AttemptRunner";
import { Spinner } from "@/components/ui/Primitives";

/**
 * Candidate attempt runner.
 *
 * Next.js 14 exposes route params as a plain object, read with `useParams()`
 * (React 18's `use()` only accepts a promise or a context — not a params
 * object — so it must not be used here).
 */
export default function AttemptPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  if (!id) return <Spinner className="mx-auto my-16" />;
  return <AttemptRunner attemptId={id} />;
}
