"use client";

import { useState } from "react";
import Link from "next/link";
import { useRegister } from "@/hooks/useAuth";
import { Input, Label, FormError } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/Select";
import { APP_NAME, ROLE_LABELS, ROLES } from "@/lib/constants";

export default function RegisterPage() {
  const { mutate: register, isPending, error } = useRegister();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CANDIDATE" | "RECRUITER">("CANDIDATE");
  const [companyId, setCompanyId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register({ name, email, password, role, companyId: companyId || undefined });
  };

  const errorMessage = error ? (error as { message?: string })?.message ?? "Registration failed" : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950/40 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create your account</p>
        </div>
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
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <SelectField
            label="Role"
            value={role}
            onValueChange={(v) => setRole(v as "CANDIDATE" | "RECRUITER")}
            options={ROLES.filter((r) => r !== "ADMIN").map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
            required
          />
          <div>
            <Label htmlFor="companyId">Company ID (optional)</Label>
            <Input
              id="companyId"
              placeholder="uuid of your company"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={isPending}
          >
            Create account
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
