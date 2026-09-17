import type { Metadata } from "next";
import Link from "next/link";
import { Award, Timer } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { ExamShell } from "@/components/exams/ExamShell";
import { TECHNOLOGIES, TOTAL_QUESTIONS } from "@/lib/question-banks/registry";
import { STATUS_TONES, DIFFICULTY_LABELS } from "@/lib/constants";
import { cn, formatNumber } from "@/lib/utils";
import { iconForTech } from "@/lib/question-banks/icons";

export const metadata: Metadata = {
  title: "Technology exams — DevAssess",
  description:
    "Take a timed, auto-graded MCQ exam in JavaScript, TypeScript, Python, HTML, CSS, or SQL. Questions are randomised for every attempt.",
};

export default function ExamsIndexPage() {
  return (
    <ExamShell>
      <div className="container max-w-5xl py-14">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Technology exams
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground mx-auto">
            Pick a technology and take a timed, auto-graded exam drawn from that
            skill's question pool. Questions and options are randomised for every
            attempt, and the clock is server-authoritative.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            {TECHNOLOGIES.length} technologies · {formatNumber(TOTAL_QUESTIONS)} questions
          </span>
          <Button asChild size="sm" variant="outline">
            <Link href="/login">Sign in to save your results</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TECHNOLOGIES.map((tech) => {
            const Icon = iconForTech(tech.id);
            return (
                            <Card key={tech.id} className="group transition-shadow hover:shadow-lg">
                <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
                  <div
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",
                      tech.accent,
                    )}
                  >
                    <Icon className="size-6" strokeWidth={1.5} />
                  </div>
                  <Award className="size-5 text-muted-foreground/50" />
                </div>
                <div className="px-5 pb-2">
                  <h3 className="text-lg font-semibold text-foreground">{tech.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{tech.description}</p>
                </div>
                <CardBody className="pt-0">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {formatNumber(tech.questionCount)} questions in the bank
                  </p>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {Object.entries(tech.difficultyCounts).map(([level, count]) => (
                      <Badge
                        key={level}
                        tone={STATUS_TONES[level] ?? "gray"}
                        size="sm"
                      >
                                                {DIFFICULTY_LABELS[level] ?? level}: {count}
                      </Badge>
                    ))}
                  </div>
                  <Button asChild className="w-full" size="md">
                    <Link href={`/exams/${tech.id}/start`}>
                      <Timer className="size-4" />
                      Start exam
                    </Link>
                  </Button>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>
    </ExamShell>
  );
}
