"use client";

import { CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { QuestionContent } from "@/components/exams/QuestionContent";
import type { BankQuestion } from "@/lib/question-banks/types";

/** Renders a single question's review row in the result breakdown. */
export function ReviewRow({
  question,
  chosenId,
  correctId,
}: {
  question: BankQuestion;
  chosenId: string | null;
  correctId: string;
}) {
  const isCorrect = chosenId === correctId;

  return (
    <div className="border-t border-border py-4 first:border-t-0">
      <div className="mb-3 flex items-start gap-3">
        {isCorrect ? (
          <CheckCircle className="mt-0.5 size-5 shrink-0 text-green-500" />
        ) : (
          <XCircle className="mt-0.5 size-5 shrink-0 text-red-500" />
        )}
        <h3 className="flex-1 text-sm font-semibold text-foreground">
          {question.title}
        </h3>
      </div>

      <QuestionContent blocks={question.content} />

      <div className="mt-4 space-y-1.5">
        {question.options.map((option) => {
          const isCorrectOption = option.id === correctId;
          const isChosen = option.id === chosenId;
          return (
            <div
              key={option.id}
              className={
                isCorrectOption
                  ? "rounded-lg border-2 border-green-200 bg-green-50/60 dark:border-green-900/40 dark:bg-green-950/30"
                  : isChosen
                    ? "rounded-lg border-2 border-red-200 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/30"
                    : "rounded-lg border border-border bg-card"
              }
            >
              <div className="flex items-start gap-3 p-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-xs font-bold text-muted-foreground">
                  {option.id}
                </span>
                {option.code ? (
                  <pre className="thin-scrollbar flex-1 overflow-x-auto rounded-md bg-slate-950 px-3 py-2 font-mono text-xs text-emerald-100">
                    {option.code}
                  </pre>
                ) : (
                  <span className="block flex-1 text-sm text-foreground">{option.text}</span>
                )}
                {isCorrectOption && (
                  <Badge tone="green" size="sm">
                    Correct
                  </Badge>
                )}
                {isChosen && !isCorrectOption && (
                  <Badge tone="red" size="sm">
                    Your answer
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {question.explanation && (
        <div className="mt-4 rounded-lg bg-muted p-4 text-sm text-foreground">
          <p className="mb-2 font-semibold">Explanation</p>
          <QuestionContent blocks={[{ type: "text", value: question.explanation }]} />
        </div>
      )}
    </div>
  );
}
