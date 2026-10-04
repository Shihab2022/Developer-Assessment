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
  const [jobRole, setJobRole] = useState("");
  const [description, setDescription] = useState("");
  /**
   * Requirement 4 — one or more technologies. The first entry is the primary
   * (displayed on the interview) but the random question set is drawn across
   * every selected technology.
   */
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
  /**
   * Requirement 5 — when ON the candidate sees the score after submitting and
   * also receives it by email; when OFF the candidate sees nothing and gets no
   * email. Kept in step with `showScoreToCandidate` so the two behave as one
   * "share the result" option.
   */
  const [sendResultToCandidate, setSendResult] = useState(true);
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

  const toggleTechnology = (id: string) => {
    setTechnologyIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((item) => item !== id);
        // Keep at least one technology — fall back to the first bank entry.
        return next.length > 0 ? next : prev;
      }
      return [...prev, id];
    });
  };

  const setShareResult = (checked: boolean) => {
    setShowScore(checked);
    setSendResult(checked);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const payload: CreateInterviewPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      jobRole: jobRole.trim() || undefined,
      technology: technologyIds[0] ?? "javascript",
      technologies: technologyIds.length > 1 ? technologyIds : undefined,
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
      sendResultToCandidate,
      useBankQuestions,
      customQuestions: [],
    };
    create.mutate(payload);
  };


  return (
    <>
      <PageHeader
        title="New AI video interview"
        subtitle="Tick one or more technologies — 10 random questions are drawn across the selection"
        breadcrumbs={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/recruiter/interviews">
              <ArrowLeft className="size-4" />
              Interviews
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
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

            {/* Requirement 4 — multiple technologies; the random question set is
                drawn across every ticked bank. */}
            <div>
              <Label>Technologies ({technologyIds.length} selected)</Label>
              <p className="-mt-0.5 mb-2 text-xs text-muted-foreground">
                The exam draws {questionCount} random question{questionCount === 1 ? "" : "s"} across
                the selected technologies ({bankTotal} questions in the pool).
              </p>
              <div className="thin-scrollbar grid max-h-56 gap-1.5 overflow-y-auto rounded-lg border border-border p-3 sm:grid-cols-2">
                {(options.length > 0 ? options : [{ id: "javascript", label: "JavaScript", questionCount: 0 }]).map(
                  (option) => (
                    <CheckboxField
                      key={option.id}
                      id={`technology-${option.id}`}
                      checked={technologyIds.includes(option.id)}
                      onCheckedChange={() => toggleTechnology(option.id)}
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
        </Card>

        <Card>
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
        </Card>

        <Card>
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
                description={
                  sendResultToCandidate
                    ? "The candidate sees the score after submitting and also receives it by email."
                    : "OFF — the candidate sees nothing and no result email is sent."
                }
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/recruiter/interviews">Cancel</Link>
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmit} loading={create.isPending}>
                <Save className="size-4" />
                Create interview
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

