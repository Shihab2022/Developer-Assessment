"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, PageHeader } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Select";
import { SwitchField } from "@/components/ui/Checkbox";
import { useCreateInterview, useInterviewTechnologies } from "@/hooks/useInterviews";
import {
  DEFAULT_INTERVIEW_SETTINGS,
  INTERVIEW_SENIORITY_LABELS,
  INTERVIEW_SENIORITIES,
} from "@/lib/constants";
import type { CreateInterviewPayload, InterviewSeniority } from "@/lib/types";

export default function NewInterviewPage() {
  const technologies = useInterviewTechnologies();
  const create = useCreateInterview();

  const [title, setTitle] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [description, setDescription] = useState("");
  const [technology, setTechnology] = useState("javascript");
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

  const options = technologies.data?.technologies ?? [];
  const defaults = technologies.data?.defaults;
  const canSubmit = title.trim().length >= 3 && Boolean(technology);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const payload: CreateInterviewPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      jobRole: jobRole.trim() || undefined,
      technology,
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
      expiresAt: null,
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
        subtitle="Questions are drawn at random from the selected technology bank"
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
                <Label htmlFor="technology">Technology</Label>
                <SelectField
                  id="technology"
                  value={technology}
                  onValueChange={setTechnology}
                  options={options.map((option) => ({
                    value: option.id,
                    label: `${option.label} (${option.questionCount} questions)`,
                  }))}
                />
              </div>
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
                onCheckedChange={setShowScore}
                label="Show the score to the candidate"
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

