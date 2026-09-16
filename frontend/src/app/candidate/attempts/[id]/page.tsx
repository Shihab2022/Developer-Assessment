"use client";

import { use } from "react";
import { AttemptRunner } from "@/components/candidate/AttemptRunner";
import { Spinner } from "@/components/ui/Primitives";

export default function AttemptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  if (!id) return <Spinner className="mx-auto my-16" />;
  return <AttemptRunner attemptId={id} />;
}
