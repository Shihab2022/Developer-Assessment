"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Users } from "lucide-react";
import { useRegister } from "@/hooks/useAuth";
import { AuthShell } from "@/components/auth/AuthShell";
import { CheckInbox } from "@/components/auth/CheckInbox";
import { Input, Label, FormError } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";

export default function CompanyRegisterPage() {
  const { mutate: register, isPending, error, data } = useRegister();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");

  const errorMessage = error
    ? (error as { message?: string })?.message ?? "Registration failed"
    : null;

  if (data?.requiresVerification) {
    return (
      <AuthShell
        title="Almost there"
        subtitle="Confirm your email to activate your company account."
        footer={
          <p className="text-center text-sm text-muted-foreground">
            Want a different role?{" "}
            <Link href="/register" className="font-medium text-primary-600 hover:underline">
              Choose another account type
            </Link>
          </p>
        }
      >
        <CheckInbox email={email || data.user.email} companyCode={data.companyCode} />
      </AuthShell>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register({
      name,
      email,
      password,
      role: "COMPANY",
      companyName: companyName.trim() || undefined,
    });
  };

  return (
    <AuthShell
      eyebrow={
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
          <Building2 className="size-6" />
        </span>
      }
      title="Register your company"
      subtitle="Found your company, invite recruiters and publish assessments."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary-600 hover:underline">
            Sign in
          </Link>
          <br />
          <span className="text-xs">
            Invited to a team?{" "}
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
          <Label htmlFor="companyName">
            Company name<span className="ml-0.5 text-destructive">*</span>
          </Label>
          <Input
            id="companyName"
            placeholder="TechCorp Solutions"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            autoFocus
          />
          <p className="field-hint">You become the owner — you can invite recruiters later.</p>
        </div>

        <div>
          <Label htmlFor="name">Your full name</Label>
          <Input
            id="name"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
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
          <Users />
          Create company account
        </Button>
      </form>
    </AuthShell>
  );
}
