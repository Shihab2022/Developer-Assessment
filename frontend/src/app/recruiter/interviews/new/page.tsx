"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Select";
import { CheckboxField, SwitchField } from "@/components/ui/Checkbox";
import { useCreateInterview, useInterviewTechnologies } from "@/hooks/useInterviews";
import {
  DEFAULT_INTERVIEW_SETTINGS,
  INTERVIEW_SENIORITY_LABELS,
  INTERVIEW_SENIORITIES,
} from "@/lib/constants";
import type { CreateInterviewPayload, InterviewSeniority } from "@/lib/types";
import { toDateTimeInputValue } from "@/lib/utils";

export default function NewInterviewPage() {
  const technologies = useInterviewTechnologies();
  const create = useCreateInterview();

  const [title, setTitle] = useState("");
  const [step, setStep] = useState(0);
  const [jobRole, setJobRole] = useState("");
  const [description, setDescription] = useState("");
  /** The selected question bank for this interview. */
  const [technologyIds, setTechnologyIds] = useState<string[]>(["javascript"]);
  const [seniority, setSeniority] = useState<string>(DEFAULT_INTERVIEW_SETTINGS.seniority);
  const [questionCount, setQuestionCount] = useState(DEFAULT_INTERVIEW_SETTINGS.questionCount);
  const [questionTimeSeconds, setQuestionTimeSeconds] = useState(
    DEFAULT_INTERVIEW_SETTINGS.questionTimeSeconds,
  );
  const [passScore, setPassScore] = useState(DEFAULT_INTERVIEW_SETTINGS.passScore);
  const [maxViolations, setMaxViolations] = useState(DEFAULT_INTERVIEW_SETTINGS.maxViolations);
  const [shuffleQuestions, setShuffle] = useState(DEFAULT_INTERVIEW_SETTINGS.shuffleQuestions);
  const [hintsEnabled, setHints] = useState(DEFAULT_INTERVIEW_SETTINGS.hintsEnabled);
  const [proctoringEnabled, setProctoring] = useState(DEFAULT_INTERVIEW_SETTINGS.proctoringEnabled);
  const [terminateOnCritical, setTerminate] = useState(
    DEFAULT_INTERVIEW_SETTINGS.terminateOnCritical,
  );
  const [aiReviewEnabled, setAiReview] = useState(DEFAULT_INTERVIEW_SETTINGS.aiReviewEnabled);
  const [showScoreToCandidate, setShowScore] = useState(
    DEFAULT_INTERVIEW_SETTINGS.showScoreToCandidate,
  );
  const [useBankQuestions, setUseBank] = useState(DEFAULT_INTERVIEW_SETTINGS.useBankQuestions);
  /** Requirement 7 — both ends of the active window are mandatory. */
  const [startsAt, setStartsAt] = useState(() => toDateTimeInputValue(new Date()));
  const [expiresAt, setExpiresAt] = useState(() =>
    toDateTimeInputValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  );

  const options = technologies.data?.technologies ?? [];
  const defaults = technologies.data?.defaults;
  const windowValid =
    Boolean(startsAt) &&
    Boolean(expiresAt) &&
    new Date(expiresAt).getTime() > new Date(startsAt).getTime();
  const bankTotal = useMemo(
    () =>
      options
        .filter((option) => technologyIds.includes(option.id))
        .reduce((total, option) => total + (option.questionCount ?? 0), 0),
    [options, technologyIds],
  );
  const canSubmit = title.trim().length >= 3 && technologyIds.length > 0 && windowValid;

  const selectTechnology = (id: string) => setTechnologyIds([id]);

  const setShareResult = (checked: boolean) => {
    setShowScore(checked);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const payload: CreateInterviewPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      jobRole: jobRole.trim() || undefined,
      technology: technologyIds[0] ?? "javascript",
      seniority: seniority as InterviewSeniority,
      questionCount,
      questionTimeSeconds,
      totalTimeSeconds: null,
      shuffleQuestions,
      hintsEnabled,
      proctoringEnabled,
      terminateOnCritical,
      aiReviewEnabled,
      passScore,
      maxViolations,
      startsAt: new Date(startsAt).toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      showScoreToCandidate,
      useBankQuestions,
      customQuestions: [],
    };
    create.mutate(payload);
  };


  return (
    <>
      <PageHeader
        title="New AI video interview"
        subtitle="Create a timed, proctored interview in three guided steps"
        breadcrumbs={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/recruiter/interviews">
              <ArrowLeft className="size-4" />
              Interviews
            </Link>
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-3 gap-2" aria-label="Interview creation steps">
        {[
          ["Setup", "Role and question pool"],
          ["Schedule", "When candidates can join"],
          ["Rules", "Timing and review"],
        ].map(([label, hint], index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(index)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              step === index
                ? "border-primary-600 bg-primary-50 text-primary-800 dark:bg-primary-950/40 dark:text-primary-200"
                : "border-border text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <span className="block text-xs font-semibold uppercase tracking-wide">Step {index + 1}</span>
            <span className="mt-1 block text-sm font-medium">{label}</span>
            <span className="mt-0.5 hidden text-xs sm:block">{hint}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {step === 0 && <Card>
          <CardHeader title="Interview setup" />
          <CardBody className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Senior React developer — video interview"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="seniority">Seniority</Label>
                <SelectField
                  id="seniority"
                  value={seniority}
                  onValueChange={setSeniority}
                  options={INTERVIEW_SENIORITIES.map((level) => ({
                    value: level,
                    label: INTERVIEW_SENIORITY_LABELS[level] ?? level,
                  }))}
                />
              </div>
            </div>

            <div>
              <Label>Technology</Label>
              <p className="-mt-0.5 mb-2 text-xs text-muted-foreground">
                The exam draws {questionCount} random question{questionCount === 1 ? "" : "s"} from this
                technology&apos;s bank ({bankTotal} questions in the pool).
              </p>
              <div className="thin-scrollbar grid max-h-56 gap-1.5 overflow-y-auto rounded-lg border border-border p-3 sm:grid-cols-2">
                {(options.length > 0 ? options : [{ id: "javascript", label: "JavaScript", questionCount: 0 }]).map(
                  (option) => (
                    <CheckboxField
                      key={option.id}
                      id={`technology-${option.id}`}
                      checked={technologyIds.includes(option.id)}
                      onCheckedChange={() => selectTechnology(option.id)}
                      label={`${option.label} (${option.questionCount} questions)`}
                    />
                  ),
                )}
              </div>
              {technologyIds.length === 0 && (
                <p className="mt-1 text-xs font-medium text-destructive">
                  Pick at least one technology — the exam needs a question pool.
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="job-role">Role (optional)</Label>
                <Input
                  id="job-role"
                  value={jobRole}
                  onChange={(event) => setJobRole(event.target.value)}
                  placeholder="Frontend Engineer"
                />
              </div>
              <div>
                <Label htmlFor="pass-score">Pass mark (%)</Label>
                <Input
                  id="pass-score"
                  type="number"
                  min={0}
                  max={100}
                  value={passScore}
                  onChange={(event) => setPassScore(Number(event.target.value))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Instructions for the candidate (optional)</Label>
              <Textarea
                id="description"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Answer each question out loud while the camera and microphone record you."
              />
            </div>
          </CardBody>
        </Card>}

        {step === 1 && <Card>
          <CardHeader
            title="Schedule — when is this link active?"
            subtitle="Both fields are required. Candidates can only open the link inside this window."
          />
          <CardBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="starts-at">Link active from *</Label>
                <Input
                  id="starts-at"
                  type="datetime-local"
                  required
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Before this time the link shows “not active yet”.
                </p>
              </div>
              <div>
                <Label htmlFor="expires-at">Exam closes at *</Label>
                <Input
                  id="expires-at"
                  type="datetime-local"
                  required
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  After this time no candidate can start or continue.
                </p>
              </div>
            </div>
            {!windowValid && (startsAt || expiresAt) && (
              <p className="text-xs font-medium text-destructive">
                The exam close time must be after the link activation time.
              </p>
            )}
          </CardBody>
        </Card>}

        {step === 2 && <Card>
          <CardHeader
            title="Questions, timing & proctoring"
            subtitle={`${questionCount} questions · ${Math.round(questionTimeSeconds / 60)} minutes each`}
          />
          <CardBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="question-count">Questions served</Label>
                <Input
                  id="question-count"
                  type="number"
                  min={1}
                  max={30}
                  value={questionCount}
                  onChange={(event) => setQuestionCount(Number(event.target.value))}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Randomly drawn from the technology bank each time you regenerate.
                </p>
              </div>
              <div>
                <Label htmlFor="question-time">Time per question (seconds)</Label>
                <Input
                  id="question-time"
                  type="number"
                  min={30}
                  max={3600}
                  value={questionTimeSeconds}
                  onChange={(event) => setQuestionTimeSeconds(Number(event.target.value))}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Default {defaults?.questionTimeSeconds ?? 300}s (5 minutes). Change it per
                  interview.
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="max-violations">Violations tolerated before suspension</Label>
              <Input
                id="max-violations"
                type="number"
                min={0}
                max={20}
                value={maxViolations}
                onChange={(event) => setMaxViolations(Number(event.target.value))}
              />
            </div>

            <div className="space-y-4 rounded-lg border border-border p-4">
              <SwitchField
                id="use-bank"
                checked={useBankQuestions}
                onCheckedChange={setUseBank}
                label="Use the built-in question bank"
                description="Add your own questions later from the interview page."
              />
              <SwitchField
                id="shuffle"
                checked={shuffleQuestions}
                onCheckedChange={setShuffle}
                label="Shuffle question order per candidate"
              />
              <SwitchField
                id="hints"
                checked={hintsEnabled}
                onCheckedChange={setHints}
                label="Allow hints"
                description="Candidates can reveal hints; used hints reduce the mark."
              />
            </div>

            <div className="space-y-4 rounded-lg border border-border p-4">
              <SwitchField
                id="proctoring"
                checked={proctoringEnabled}
                onCheckedChange={setProctoring}
                label="Proctoring enabled"
                description="Camera, microphone, full-screen and tab-switch monitoring."
              />
              <SwitchField
                id="terminate"
                checked={terminateOnCritical}
                onCheckedChange={setTerminate}
                label="Suspend on critical violations"
                description="A second device, a second person, loud noise, leaving full screen or switching tabs ends the interview with 0 marks."
              />
              <SwitchField
                id="ai-review"
                checked={aiReviewEnabled}
                onCheckedChange={setAiReview}
                label="AI review of the answers"
                description="Transcript, proctoring telemetry and evidence frames are marked and summarised."
              />
              <SwitchField
                id="show-score"
                checked={showScoreToCandidate}
                onCheckedChange={setShareResult}
                label="Share the result with the candidate"
                description="When enabled, the candidate can see their score after submitting."
              />
            </div>

          </CardBody>
        </Card>}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <Button variant="outline" asChild>
          <Link href="/recruiter/interviews">Cancel</Link>
        </Button>
        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
          )}
          {step < 2 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 0 && (title.trim().length < 3 || technologyIds.length === 0)}
            >
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canSubmit} loading={create.isPending}>
              <Save className="size-4" />
              Create interview
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

