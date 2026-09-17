import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BarChart3,
  Bell,
  Check,
  ClipboardList,
  Code2,
  Coins,
  FilePlus2,
  LayoutTemplate,
  Library,
  ListOrdered,
  MailPlus,
  Play,
  ShieldCheck,
  Sparkles,
  Terminal,
  Timer,
  Trophy,
  Users,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AudienceTabs } from "@/components/marketing/AudienceTabs";
import { CodePreviewPanel } from "@/components/marketing/CodePreviewPanel";
import { FaqSection } from "@/components/marketing/FaqSection";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import {
  ANTI_CHEAT_LABELS,
  APP_DESCRIPTION,
  APP_NAME,
  APP_TAGLINE,
  PROGRAMMING_LANGUAGES,
} from "@/lib/constants";
import {
  LANDING_CAPABILITIES,
  LANDING_PILLARS,
  LANDING_STATS,
  LANDING_STEPS,
  LANDING_TRACKS,
  pillarById,
} from "@/lib/marketing";

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: APP_DESCRIPTION,
  openGraph: {
    title: `${APP_NAME} — ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
    type: "website",
  },
};

const PILLAR_ICONS: Record<string, React.ElementType> = {
  ClipboardList,
  Code2,
  Terminal,
  Trophy,
  Library,
  ShieldCheck,
};

const STEP_ICONS: Record<string, React.ElementType> = {
  UserPlus,
  FilePlus2,
  MailPlus,
  Timer,
  BarChart3,
};

const CAPABILITY_ICONS: Record<string, React.ElementType> = {
  Award,
  ListOrdered,
  LayoutTemplate,
  Users,
  Coins,
  Bell,
};

/** Check-mark bullet reused across the landing sections. */
function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300">
        <Check className="size-3" strokeWidth={3} />
      </span>
      <span className="leading-relaxed text-muted-foreground">{children}</span>
    </li>
  );
}

export default function HomePage() {
  const exams = pillarById("exams");
  const practice = pillarById("practice");
  const playground = pillarById("playground");
  const competitions = pillarById("competitions");
  const questionBank = pillarById("question-bank");
  const insights = pillarById("insights");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main id="top" className="flex-1">
        {/* ------------------------------------------------------------ hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 grid-bg bg-grid opacity-40 mask-fade-x"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary-500/20 blur-3xl dark:bg-primary-500/25"
          />

          <div className="container relative grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
            <div className="animate-fade-up">
              <span className="section-eyebrow">
                <Sparkles className="size-3.5" />
                Exams · practice · contests
              </span>

              <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.35rem]">
                Practise like it is a judge.
                <span className="gradient-text"> Get graded like it counts.</span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                {APP_NAME} is one workspace for technical exams, practice-arena problems and your own
                online compiler — plus everything a company, university or coding club needs to host a
                competition end to end.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/register">
                    Create a free account
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="#playground">
                    <Play />
                    Run your first snippet
                  </Link>
                </Button>
              </div>

              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                {[
                  "Free practice and compiler",
                  "No credit card required",
                  "Candidates, companies and institutes",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <Check className="size-3.5 text-success" strokeWidth={3} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative animate-fade-up animation-delay-200">
              <CodePreviewPanel compact />

              <div className="absolute -left-5 top-24 hidden animate-float rounded-xl border border-border bg-card px-3 py-2 shadow-pop xl:block">
                <p className="text-[11px] font-medium text-muted-foreground">Verdict</p>
                <p className="text-sm font-semibold text-success">8 / 8 cases passed</p>
              </div>
              <div className="absolute -right-5 bottom-16 hidden animate-float rounded-xl border border-border bg-card px-3 py-2 shadow-pop animation-delay-300 xl:block">
                <p className="text-[11px] font-medium text-muted-foreground">Contest rank</p>
                <p className="text-sm font-semibold text-foreground">#2 of 214</p>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------ stats strip */}
          <div className="relative border-t border-border bg-card/70">
            <div className="container grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-5">
              {LANDING_STATS.map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{stat.label}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{stat.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ pillar overview */}
        <section className="border-b border-border py-16 lg:py-24">
          <div className="container">
            <SectionHeading
              eyebrow="The whole platform"
              title="Six things you can do here today"
              description="Everything below runs on one assessment engine: a single question bank, one authoritative timer, one evaluation pipeline and one audit trail."
            />

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {LANDING_PILLARS.map((pillar) => {
                const Icon = PILLAR_ICONS[pillar.icon] ?? Sparkles;
                return (
                  <article
                    key={pillar.id}
                    className="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-pop dark:hover:border-primary-800"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/15 to-sky-500/15 text-primary-600 dark:text-primary-300">
                        <Icon className="size-5" />
                      </span>
                      <Badge tone={pillar.tone}>{pillar.eyebrow}</Badge>
                    </div>

                    <h3 className="mt-5 text-base font-semibold text-foreground">{pillar.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.blurb}</p>

                    <ul className="mt-5 space-y-2.5">
                      {pillar.bullets.map((bullet) => (
                        <FeatureItem key={bullet}>{bullet}</FeatureItem>
                      ))}
                    </ul>

                    <Link
                      href={`#${pillar.id}`}
                      className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:underline dark:text-primary-400"
                    >
                      {pillar.cta.label}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------- technology exams */}
        <section id="exams" className="scroll-mt-20 border-b border-border bg-muted/40 py-16 lg:py-24">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-start">
              <div>
                <SectionHeading
                  align="left"
                  eyebrow={exams.eyebrow}
                  title={exams.title}
                  description={exams.blurb}
                />

                <ul className="mt-6 space-y-3">
                  {exams.bullets.map((bullet) => (
                    <FeatureItem key={bullet}>{bullet}</FeatureItem>
                  ))}
                </ul>

                <Button asChild className="mt-8">
                  <Link href={exams.cta.href}>
                    {exams.cta.label}
                    <ArrowRight />
                  </Link>
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {LANDING_TRACKS.map((group) => (
                  <div key={group.category} className="panel p-5">
                    <h3 className="text-sm font-semibold text-foreground">{group.category}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {group.description}
                    </p>
                    <ul className="mt-4 flex flex-wrap gap-1.5">
                      {group.items.map((item) => (
                        <li key={item}>
                          <Badge tone="gray" size="sm">
                            {item}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------- practice arena */}
        <section id="practice" className="scroll-mt-20 border-b border-border py-16 lg:py-24">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-center">
              <div className="order-2 lg:order-1">
                <div className="panel overflow-hidden">
                  <div className="panel-header">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tone="green" size="sm">
                          Easy
                        </Badge>
                        <Badge tone="indigo" size="sm">
                          Coding
                        </Badge>
                        <Badge tone="gray" size="sm">
                          javascript
                        </Badge>
                      </div>
                      <h3 className="mt-3 text-base font-semibold text-foreground">
                        Two Sum — return the pair that hits the target
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Visible examples are for debugging. Hidden cases decide the verdict.
                      </p>
                    </div>
                    <Badge tone="green" size="sm">
                      15 pts
                    </Badge>
                  </div>

                  <div className="space-y-5 p-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Example
                      </p>
                      <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 px-4 py-3 font-mono text-[12px] leading-relaxed text-emerald-100">
                        {`Input:  nums = [2, 7, 11, 15], target = 9\nOutput: [0, 1]\nReason: nums[0] + nums[1] == 9`}
                      </pre>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Test cases
                      </p>
                      <ul className="mt-2 space-y-2">
                        {[
                          { label: "Case 1 · visible", result: "passed", tone: "green" as const },
                          { label: "Case 2 · hidden", result: "passed", tone: "green" as const },
                          { label: "Case 3 · hidden", result: "running…", tone: "blue" as const },
                        ].map((row) => (
                          <li
                            key={row.label}
                            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2"
                          >
                            <span className="font-mono text-xs text-muted-foreground">{row.label}</span>
                            <Badge tone={row.tone} size="sm">
                              {row.result}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <SectionHeading
                  align="left"
                  eyebrow={practice.eyebrow}
                  title={practice.title}
                  description={practice.blurb}
                />

                <ul className="mt-6 space-y-3">
                  {practice.bullets.map((bullet) => (
                    <FeatureItem key={bullet}>{bullet}</FeatureItem>
                  ))}
                </ul>

                <Button asChild className="mt-8">
                  <Link href={practice.cta.href}>
                    {practice.cta.label}
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- online compiler */}
        <section
          id="playground"
          className="scroll-mt-20 border-b border-border bg-muted/40 py-16 lg:py-24"
        >
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-start">
              <div>
                <SectionHeading
                  align="left"
                  eyebrow={playground.eyebrow}
                  title={playground.title}
                  description={playground.blurb}
                />

                <ul className="mt-6 space-y-3">
                  {playground.bullets.map((bullet) => (
                    <FeatureItem key={bullet}>{bullet}</FeatureItem>
                  ))}
                </ul>

                <div className="mt-7">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Runtimes and syntax modes
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {PROGRAMMING_LANGUAGES.map((language) => (
                      <li key={language.value}>
                        <Badge tone="blue" size="sm">
                          {language.label}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button asChild className="mt-8">
                  <Link href={playground.cta.href}>
                    {playground.cta.label}
                    <ArrowRight />
                  </Link>
                </Button>
              </div>

              <CodePreviewPanel defaultLanguage="python" />
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- competitions */}
        <section id="competitions" className="scroll-mt-20 border-b border-border py-16 lg:py-24">
          <div className="container">
            <SectionHeading
              eyebrow={competitions.eyebrow}
              title={competitions.title}
              description={competitions.blurb}
            />

            <div
              id="how-it-works"
              className="mt-12 grid scroll-mt-24 gap-4 sm:grid-cols-2 lg:grid-cols-5"
            >
              {LANDING_STEPS.map((step) => {
                const Icon = STEP_ICONS[step.icon] ?? Sparkles;
                return (
                  <div key={step.step} className="panel flex flex-col p-5">
                    <div className="flex items-center justify-between">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300">
                        <Icon className="size-4" />
                      </span>
                      <span className="font-mono text-xs font-semibold text-muted-foreground">
                        {step.step}
                      </span>
                    </div>
                    <h3 className="mt-4 text-sm font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-start">
              <div className="panel overflow-hidden">
                <div className="panel-header">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Inter-university coding cup · live standings
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Ranked on score, then earliest submission.
                    </p>
                  </div>
                  <Badge tone="green" size="sm">
                    Running
                  </Badge>
                </div>
                <div className="divide-y divide-border">
                  {[
                    { rank: 1, name: "Ayesha R.", score: 92, solved: 7 },
                    { rank: 2, name: "Tanvir H.", score: 88, solved: 6 },
                    { rank: 3, name: "Nadia K.", score: 84, solved: 6 },
                    { rank: 4, name: "Rezaul I.", score: 79, solved: 5 },
                  ].map((row) => (
                    <div
                      key={row.rank}
                      className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs font-semibold text-foreground">
                          {row.rank}
                        </span>
                        <span className="truncate font-medium text-foreground">{row.name}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-4 text-xs text-muted-foreground">
                        <span>{row.solved} solved</span>
                        <span className="font-mono text-sm font-semibold text-foreground">
                          {row.score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <ul className="space-y-3">
                  {competitions.bullets.map((bullet) => (
                    <FeatureItem key={bullet}>{bullet}</FeatureItem>
                  ))}
                </ul>

                <div className="mt-7">
                  <AudienceTabs />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ question bank */}
        <section id="question-bank" className="scroll-mt-20 border-b border-border py-16 lg:py-24">
          <div className="container">
            <SectionHeading
              eyebrow={questionBank.eyebrow}
              title={questionBank.title}
              description={questionBank.blurb}
            />

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <div className="panel p-6">
                <Badge tone="indigo" size="sm">
                  Shared bank
                </Badge>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  Pick from the curated library
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Start a competition this afternoon without writing a single question. Search by
                  keyword, technology, difficulty or tag and drop the questions into a paper.
                </p>
                <ul className="mt-5 space-y-3">
                  <FeatureItem>Coding, multiple-choice and written questions in one bank</FeatureItem>
                  <FeatureItem>Full-text search plus difficulty and category filters</FeatureItem>
                  <FeatureItem>Sample cases and points already configured per question</FeatureItem>
                  <FeatureItem>Difficulty analytics that show which questions separate the field</FeatureItem>
                </ul>
              </div>

              <div className="panel p-6">
                <Badge tone="violet" size="sm">
                  Your own questions
                </Badge>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  Author questions private to your workspace
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Write the questions your team actually asks, keep them private, and reuse them for
                  every round instead of rebuilding the paper from scratch.
                </p>
                <ul className="mt-5 space-y-3">
                  <FeatureItem>Attach visible and hidden test cases with expected output</FeatureItem>
                  <FeatureItem>Set allowed languages, points, time and memory limits</FeatureItem>
                  <FeatureItem>Save a full paper as a template and duplicate it per round</FeatureItem>
                  <FeatureItem>Keep everything in draft until the paper is ready to publish</FeatureItem>
                </ul>
              </div>
            </div>

            <div className="mt-10 flex justify-center">
              <Button asChild>
                <Link href={questionBank.cta.href}>
                  {questionBank.cta.label}
                  <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* --------------------------------------------- included capabilities */}
        <section className="border-b border-border bg-muted/40 py-16 lg:py-20">
          <div className="container">
            <SectionHeading
              eyebrow="Included with every account"
              title="Small features that decide whether a platform gets used"
              description="These are the details that make a contest feel finished — and they ship with the platform rather than needing another tool."
            />

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {LANDING_CAPABILITIES.map((capability) => {
                const Icon = CAPABILITY_ICONS[capability.icon] ?? Sparkles;
                return (
                  <div
                    key={capability.title}
                    className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-card"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300">
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{capability.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {capability.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- trust */}
        <section id="insights" className="scroll-mt-20 border-b border-border py-16 lg:py-24">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
              <div>
                <SectionHeading
                  align="left"
                  eyebrow={insights.eyebrow}
                  title={insights.title}
                  description={insights.blurb}
                />

                <ul className="mt-6 space-y-3">
                  {insights.bullets.map((bullet) => (
                    <FeatureItem key={bullet}>{bullet}</FeatureItem>
                  ))}
                </ul>

                <Button asChild className="mt-8">
                  <Link href={insights.cta.href}>
                    {insights.cta.label}
                    <ArrowRight />
                  </Link>
                </Button>
              </div>

              <div className="panel overflow-hidden">
                <div className="panel-header">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Attempt review</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Every signal is timestamped and attached to the attempt.
                    </p>
                  </div>
                  <Badge tone="amber" size="sm">
                    Medium risk
                  </Badge>
                </div>

                <div className="p-5">
                  <div className="grid gap-4">
                    {[
                      { label: "Score integrity", value: 98, bar: "bg-success" },
                      { label: "Focus time", value: 81, bar: "bg-warning" },
                      { label: "Suspicious signals", value: 12, bar: "bg-destructive" },
                    ].map((meter) => (
                      <div key={meter.label}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-foreground">{meter.label}</span>
                          <span className="font-mono text-muted-foreground">{meter.value}%</span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${meter.bar}`}
                            style={{ width: `${meter.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Signals recorded
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {Object.values(ANTI_CHEAT_LABELS).map((label) => (
                        <li key={label}>
                          <Badge tone="gray" size="sm">
                            {label}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------- faq */}
        <section id="faq" className="scroll-mt-20 border-b border-border bg-muted/40 py-16 lg:py-24">
          <div className="container">
            <SectionHeading
              eyebrow="FAQ"
              title="The questions everyone asks first"
              description="If something is still unclear, the answer is usually thirty seconds away from a free account."
            />
            <div className="mt-12">
              <FaqSection />
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- final cta */}
        <section className="py-16 lg:py-24">
          <div className="container">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary-600 via-primary-500 to-sky-500 px-6 py-14 text-center shadow-glow sm:px-12">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 grid-bg bg-grid opacity-20"
              />
              <div className="relative">
                <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Your next exam, session or contest starts with one account
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/85">
                  Practise on your own, sit a technology exam, or bring your whole team and host a
                  competition. Everything runs on the same engine — one timer, one evaluation
                  pipeline, one audit trail.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Button asChild size="lg" variant="secondary">
                    <Link href="/register">
                      Create a free account
                      <ArrowRight />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  >
                    <Link href="/login">Sign in to your workspace</Link>
                  </Button>
                </div>
                <p className="mt-5 text-xs text-white/70">
                  Candidates, recruiters and administrators each get their own workspace.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
