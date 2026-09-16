import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  Code2,
  FileText,
  ListChecks,
  ShieldCheck,
  Timer,
} from "lucide-react";

const features = [
  {
    icon: Code2,
    title: "Multi-format problem bank",
    description:
      "Coding challenges with hidden test cases, MCQs with auto-scoring, and written prompts with manual review.",
  },
  {
    icon: Timer,
    title: "Server-authoritative timer",
    description:
      "The backend owns the clock. Attempts auto-submit at expiry — client timers are never trusted.",
  },
  {
    icon: ShieldCheck,
    title: "Anti-cheating proctoring",
    description:
      "Tab switches, copy/paste, fullscreen exits and multi-session detection are logged with a risk score.",
  },
  {
    icon: BarChart3,
    title: "Reports & analytics",
    description:
      "Candidate rankings, question performance, pass rates, skill breakdowns and CSV exports.",
  },
  {
    icon: ClipboardCheck,
    title: "Full hiring pipeline",
    description:
      "Invitations → attempts → evaluations → shortlists and hiring decisions with recruiter notes.",
  },
  {
    icon: ListChecks,
    title: "Credits & billing",
    description: "Recruiters purchase credit packages (SSLCommerz) before publishing assessments.",
  },
];

const demoAccounts = [
  { role: "Admin", email: "admin@devassess.local", password: "Admin123!", tone: "bg-violet-50 text-violet-700" },
  { role: "Recruiter", email: "recruiter@techcorp.dev", password: "Recruit123!", tone: "bg-sky-50 text-sky-700" },
  { role: "Candidate", email: "candidate@devassess.local", password: "Candid8te!", tone: "bg-emerald-50 text-emerald-700" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 font-black text-white">
              D
            </div>
            <span className="text-lg font-bold text-slate-900">DevAssess</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary-100 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-20 h-80 w-80 rounded-full bg-sky-100 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-4 pb-20 pt-20 text-center sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 ring-1 ring-inset ring-primary-200">
            <ShieldCheck className="h-3.5 w-3.5" /> Proctored · Timed · Multi-role
          </span>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Hire developers with{" "}
            <span className="bg-gradient-to-r from-primary-600 to-sky-500 bg-clip-text text-transparent">
              real assessments
            </span>
            , not gut feeling.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            Build coding, MCQ and written assessments, invite candidates, run server-timed
            proctored attempts, evaluate answers and rank candidates — all in one platform.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/25 hover:bg-primary-700"
            >
              Start hiring <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Sign in to dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-100 bg-slate-50/70 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900">Everything the hiring loop needs</h2>
            <p className="mt-3 text-slate-600">
              From problem authoring to final hiring decisions — backed by a secure, audited REST API.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card transition-shadow hover:shadow-md"
              >
                <div className="mb-4 inline-flex rounded-xl bg-primary-50 p-2.5 text-primary-600">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo accounts */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-900">Try the demo accounts</h2>
            <p className="mt-3 text-slate-600">The API ships with seeded users for every role. Sign in and explore.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {demoAccounts.map((a) => (
              <div key={a.role} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${a.tone}`}>{a.role}</span>
                <p className="mt-3 font-mono text-sm text-slate-800">{a.email}</p>
                <p className="font-mono text-sm text-slate-500">{a.password}</p>
                <Link
                  href="/login"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:underline"
                >
                  Sign in as {a.role.toLowerCase()} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-slate-500 sm:flex-row sm:px-6">
          <p className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> DevAssess — Developer Assessment & Coding Platform
          </p>
          <p>
            API docs at <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">/api/docs</code>
          </p>
        </div>
      </footer>

    </div>
  );
}
