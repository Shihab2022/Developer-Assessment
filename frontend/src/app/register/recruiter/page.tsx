"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Briefcase, KeyRound } from "lucide-react";
import { useRegister } from "@/hooks/useAuth";
import { AuthShell } from "@/components/auth/AuthShell";
import { CheckInbox } from "@/components/auth/CheckInbox";
import { Input, Label, FormError } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";

export default function RecruiterRegisterPage() {
  return (
    <Suspense fallback={null}>
      <RecruiterForm />
    </Suspense>
  );
}

function RecruiterForm() {
  const searchParams = useSearchParams();
  const { mutate: register, isPending, error, data } = useRegister();

  // The recruiter-invitation email links straight here with these prefilled.
  const initialCompanyCode = searchParams.get("companyCode") ?? "";
  const initialEmail = searchParams.get("email") ?? "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [companyCode, setCompanyCode] = useState(initialCompanyCode.toUpperCase());

  const errorMessage = error
    ? (error as { message?: string })?.message ?? "Registration failed"
    : null;

  if (data?.requiresVerification) {
    return (
      <AuthShell
        title="Almost there"
        subtitle="One more step to activate your account."
        footer={
          <p className="text-center text-sm text-muted-foreground">
            Want a different role?{" "}
            <Link href="/register" className="font-medium text-primary-600 hover:underline">
              Choose another account type
            </Link>
          </p>
        }
      >
        <CheckInbox email={email || data.user.email} />
      </AuthShell>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register({
      name,
      email,
      password,
      role: "RECRUITER",
      companyCode: companyCode.trim().toUpperCase() || undefined,
    });
  };

  return (
    <AuthShell
      eyebrow={
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
          <Briefcase className="size-6" />
        </span>
      }
      title="Join your company as a recruiter"
      subtitle="Create your account and start inviting candidates to assessments."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary-600 hover:underline">
            Sign in
          </Link>
          <br />
          <span className="text-xs">
            No company yet?{" "}
            <Link href="/register/company" className="font-medium text-primary-600 hover:underline">
              Register a company
            </Link>
          </span>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError message={errorMessage} />

        <div>
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <Label htmlFor="companyCode">
            Company join code<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <Input
            id="companyCode"
            placeholder="e.g. TECHCOR-4F2A19"
            value={companyCode}
            onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
            required
            autoComplete="off"
            className="font-mono uppercase tracking-widest"
          />
          <p className="field-hint flex items-center gap-1.5">
            <KeyRound className="size-3.5 shrink-0" />
            Ask your company owner for this code — no need to paste a long ID.
          </p>
        </div>

        <PasswordInput
          id="password"
          label="Password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={isPending}
        >
          Create recruiter account
        </Button>
      </form>
    </AuthShell>
  );
}
