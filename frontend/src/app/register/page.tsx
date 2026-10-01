"use client";

import Link from "next/link";
import { ArrowRight, Briefcase, Building2, GraduationCap } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";

const OPTIONS = [
  {
    href: "/register/candidate",
    icon: GraduationCap,
    title: "Register as a Candidate",
    desc: "Take invited assessments and keep track of your results.",
    tint: "bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-300",
  },
  {
    href: "/register/recruiter",
    icon: Briefcase,
    title: "Register as a Recruiter",
    desc: "Join your company with a join code and start inviting candidates.",
    tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  {
    href: "/register/company",
    icon: Building2,
    title: "Register a Company",
    desc: "Create your company, manage recruiters and publish assessments.",
    tint: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300",
  },
];

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Choose the option that fits how you'll use the platform."
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
        {OPTIONS.map(({ href, icon: Icon, title, desc, tint }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:border-primary-300 hover:bg-primary-50/50 dark:hover:border-primary-800 dark:hover:bg-primary-950/30"
          >
            <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tint}`}>
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">{title}</span>
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

