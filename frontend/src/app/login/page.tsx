"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { dashboardPathForRole } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

const demoUsers = [
  { label: "Admin", email: "admin@devassess.local", password: "Admin123!" },
  { label: "Recruiter", email: "recruiter@techcorp.dev", password: "Recruit123!" },
  { label: "Candidate", email: "candidate@devassess.local", password: "Candid8te!" },
];

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const payload = res.data?.data;
      setAuth(payload);
      toast.success(`Welcome back, ${payload.user.name}!`);
      router.replace(dashboardPathForRole(payload.user.role));
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left brand pane */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-primary-600/30 blur-3xl" />
        <Link href="/" className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 font-black">
            D
          </div>
          <span className="text-lg font-bold">DevAssess</span>
        </Link>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-snug">
            Server-timed attempts. Proctored. Auto-evaluated.
          </h2>
          <p className="mt-4 text-slate-400">
            Sign in to manage assessments, review candidates or take your next coding challenge.
          </p>
        </div>
        <p className="relative text-xs text-slate-500">
          By continuing you agree to the platform terms of use.
        </p>
      </div>

      {/* Form pane */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 font-black text-white">
                D
              </div>
              <span className="text-lg font-bold text-slate-900">DevAssess</span>
            </Link>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
            <h1 className="text-xl font-bold text-slate-900">Sign in</h1>
            <p className="mt-1 text-sm text-slate-500">Welcome back! Enter your credentials.</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <Field label="Email" required>
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label="Password" required>
                <Input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>

              {error && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
                  {error}
                </p>
              )}

              <Button type="submit" loading={loading} className="w-full">
                Sign in
              </Button>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
                Quick demo login
              </p>
              <div className="grid grid-cols-3 gap-2">
                {demoUsers.map((d) => (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => {
                      setEmail(d.email);
                      setPassword(d.password);
                    }}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-600 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-6 text-center text-sm text-slate-500">
            No account?{" "}
            <Link href="/register" className="font-semibold text-primary-600 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
