"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { useRegister } from "@/hooks/useAuth";
import { AuthShell } from "@/components/auth/AuthShell";
import { CheckInbox } from "@/components/auth/CheckInbox";
import { Input, Label, FormError } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";

export default function CandidateRegisterPage() {
  return (
    <Suspense fallback={null}>
      <CandidateForm />
    </Suspense>
  );
}

function CandidateForm() {
  const searchParams = useSearchParams();
  /** Deep link to return to after registering + signing in (e.g. an exam link). */
  const next = searchParams.get("next") ?? "";
  const { mutate: register, isPending, error, data } = useRegister();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
        <CheckInbox email={email || data.user.email} next={next || undefined} />
      </AuthShell>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register({
      name,
      email,
      password,
      role: "CANDIDATE",
      redirectTo: next || undefined,
    });
  };

  return (
    <AuthShell
      eyebrow={
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/50 dark:text-primary-300">
          <GraduationCap className="size-6" />
        </span>
      }
      title="Create your candidate account"
      subtitle="Take assessments invited by recruiters and see your results."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary-600 hover:underline">
            Sign in
          </Link>
          <br />
          <span className="text-xs">
            Hiring for a team?{" "}
            <Link href="/register/recruiter" className="font-medium text-primary-600 hover:underline">
              Recruiter sign up
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
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
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
          Create candidate account
        </Button>
      </form>
    </AuthShell>
  );
}
