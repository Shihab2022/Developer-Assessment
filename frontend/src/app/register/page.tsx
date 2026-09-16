"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Briefcase, GraduationCap } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { dashboardPathForRole } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [role, setRole] = useState<Role>("CANDIDATE");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", companyId: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body: Record<string, string> = {
        name: form.name,
        email: form.email,
        password: form.password,
        role,
      };
      if (form.phone) body.phone = form.phone;
      if (role === "RECRUITER" && form.companyId) body.companyId = form.companyId;
      const res = await api.post("/auth/register", body);
      const payload = res.data?.data;
      setAuth(payload);
      toast.success("Account created — welcome to DevAssess!");
      router.replace(dashboardPathForRole(payload.user.role));
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const roleCards: {
    value: Role;
    title: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { value: "CANDIDATE", title: "I'm a Candidate", desc: "Take assessments & showcase skills", icon: GraduationCap },
    { value: "RECRUITER", title: "I'm a Recruiter", desc: "Hire with real technical assessments", icon: Briefcase },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left brand pane */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />
        <Link href="/" className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 font-black">
            D
          </div>
          <span className="text-lg font-bold">DevAssess</span>
        </Link>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-snug">Join thousands proving skills the honest way.</h2>
          <ul className="mt-6 space-y-3 text-slate-400">
            <li>• Coding, MCQ & written question types</li>
            <li>• Server-timed, proctored attempts</li>
            <li>• Instant MCQ scoring & skill breakdowns</li>
          </ul>
        </div>
        <p className="relative text-xs text-slate-500">Passwords are hashed and never shared.</p>
      </div>

      {/* Form pane */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
            <h1 className="text-xl font-bold text-slate-900">Create your account</h1>
            <p className="mt-1 text-sm text-slate-500">Choose how you&apos;ll use the platform.</p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {roleCards.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-all",
                    role === r.value
                      ? "border-primary-500 bg-primary-50 ring-2 ring-primary-500/30"
                      : "border-slate-200 hover:border-slate-300",
                  )}
                >
                  <r.icon className={cn("h-5 w-5", role === r.value ? "text-primary-600" : "text-slate-400")} />
                  <p className="mt-2 text-sm font-semibold text-slate-900">{r.title}</p>
                  <p className="text-xs text-slate-500">{r.desc}</p>
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="mt-5 space-y-4">
              <Field label="Full name" required>
                <Input required placeholder="Jane Doe" value={form.name} onChange={set("name")} />
              </Field>
              <Field label="Email" required>
                <Input type="email" required placeholder="you@example.com" value={form.email} onChange={set("email")} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Password" required hint="8+ chars, 1 letter & 1 number">
                  <Input type="password" required minLength={8} placeholder="••••••••" value={form.password} onChange={set("password")} />
                </Field>
                <Field label="Phone">
                  <Input placeholder="+8801…" value={form.phone} onChange={set("phone")} />
                </Field>
              </div>
              {role === "RECRUITER" && (
                <Field label="Company ID (optional)" hint="Join an existing company — leave empty to create one later">
                  <Input placeholder="UUID" value={form.companyId} onChange={set("companyId")} />
                </Field>
              )}

              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
                  {error}
                </p>
              )}

              <Button type="submit" loading={loading} className="w-full">
                Create account as {role === "CANDIDATE" ? "Candidate" : "Recruiter"}
              </Button>
            </form>
          </div>
          <p className="mt-6 text-center text-sm text-slate-500">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-primary-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
        </div>
  );
}

