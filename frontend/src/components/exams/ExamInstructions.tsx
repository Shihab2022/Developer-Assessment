"use client";

import {
  AlertTriangle,
  Clock3,
  Flag,
  ListChecks,
  MousePointerClick,
  Send,
  ShieldCheck,
} from "lucide-react";
import { describeDuration } from "@/lib/question-banks/timing";

/**
 * The "read this before you start" briefing shown in the pre-exam modal.
 *
 * Shared markup so the same rules can be surfaced anywhere (setup modal today,
 * maybe a help link tomorrow) without duplicating copy.
 */
export function ExamInstructions({
  label,
  questionCount,
  durationSeconds,
  perQuestionSeconds,
  passPercent = 60,
}: {
  label: string;
  questionCount: number;
  durationSeconds: number;
  perQuestionSeconds: number;
  passPercent?: number;
}) {
  const rules = [
    {
      icon: ListChecks,
      title: `${questionCount} multiple-choice question${questionCount === 1 ? "" : "s"}`,
      text: "Every question has four options and exactly one correct answer.",
    },
    {
      icon: Clock3,
      title: `${describeDuration(durationSeconds, questionCount)}`,
      text: `The clock is the sum of each question's allowance (~${perQuestionSeconds}s per question). It keeps running if you reload the page.`,
    },
    {
      icon: MousePointerClick,
      title: "Navigate freely",
      text: "Use Previous / Next or Skip to move around. You can change an answer any time before you submit.",
    },
    {
      icon: Flag,
      title: "Flag to revisit",
      text: "Flag a tricky question and it stays marked so you can come back before the clock runs out.",
    },
    {
      icon: Send,
      title: `Submit any time — pass mark is ${passPercent}%`,
      text: "There is no negative marking, so answer everything. Unanswered questions score zero.",
    },
    {
      icon: AlertTriangle,
      title: "Auto-submit when time is up",
      text: "When the timer reaches 0:00 the exam submits automatically with whatever you have answered.",
    },
    {
      icon: ShieldCheck,
      title: "Your progress is saved",
      text: `Answers are saved locally as you go, so you can resume this ${label} exam if you leave before submitting.`,
    },
  ];

  return (
    <ul className="space-y-3">
      {rules.map((rule) => (
        <li key={rule.title} className="flex gap-3">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-300">
            <rule.icon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{rule.title}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{rule.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default ExamInstructions;
