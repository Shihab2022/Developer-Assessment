"use client";

import Link from "next/link";
import { ArrowRight, Briefcase, Building2, GraduationCap } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";

const OPTIONS = [
  {
    href: "/register/candidate",
    icon: GraduationCap,
    kind: "B2C",
    title: "I'm here to learn or get hired",
    desc: "Practise free, sit technology exams and keep scorecards you can share with recruiters.",
    tint: "bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-300",
  },
  {
    href: "/register/recruiter",
    icon: Briefcase,
    kind: "B2B",
    title: "I'm hiring at a company or institute",
    desc: "Join your organisation with a join code and start inviting candidates.",
    tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  {
    href: "/register/company",
    icon: Building2,
    kind: "B2B",
    title: "I'm setting up a team workspace",
    desc: "Create your organisation, manage recruiters, publish assessments and run video interviews.",
    tint: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300",
  },
];

const KIND_TINT: Record<string, string> = {
  B2B: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300",
  B2C: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="SkillGauge works two ways: free for individuals, a workspace for teams and institutes."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-primary-600 hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <div className="space-y-3">
        {OPTIONS.map(({ href, icon: Icon, kind, title, desc, tint }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/50 dark:hover:border-primary-800 dark:hover:bg-primary-950/30"
          >
            <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tint}`}>
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="block text-sm font-semibold text-foreground">{title}</span>
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${KIND_TINT[kind] ?? KIND_TINT.B2C}`}
                >
                  {kind}
                </span>
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                {desc}
              </span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary-600" />
          </Link>
        ))}
      </div>
    </AuthShell>
  );
}

