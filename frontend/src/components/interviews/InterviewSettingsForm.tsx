"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { useUpdateInterview } from "@/hooks/useInterviews";
import type { Interview } from "@/lib/types";
import { toDateTimeInputValue } from "@/lib/utils";

interface Props {
  interview: Interview;
}

/**
 * Requirement 8: once created, a recruiter/admin can still change the exam
 * title, the timer per question, the overall exam time and the active window.
 */
export function InterviewSettingsForm({ interview }: Props) {
  const update = useUpdateInterview(interview.id);

  const [title, setTitle] = useState(interview.title);
  const [jobRole, setJobRole] = useState(interview.jobRole ?? "");
  const [questionTimeSeconds, setQuestionTimeSeconds] = useState(interview.questionTimeSeconds);
  const [totalTimeSeconds, setTotalTimeSeconds] = useState(
    interview.totalTimeSeconds ? String(interview.totalTimeSeconds) : "",
  );
  const [startsAt, setStartsAt] = useState(toDateTimeInputValue(interview.startsAt));
  const [expiresAt, setExpiresAt] = useState(toDateTimeInputValue(interview.expiresAt));
  const [passScore, setPassScore] = useState(interview.passScore);
  const [maxViolations, setMaxViolations] = useState(interview.maxViolations);

  /** Legacy interviews may have no window yet — only require it once both ends are set. */
  const windowEmpty = !startsAt && !expiresAt;
  const windowValid =
    windowEmpty ||
    (Boolean(startsAt) &&
      Boolean(expiresAt) &&
      new Date(expiresAt).getTime() > new Date(startsAt).getTime());

  const totalDirty =
    (totalTimeSeconds ? Number(totalTimeSeconds) : null) !== (interview.totalTimeSeconds ?? null);
  const startsAtDirty = toDateTimeInputValue(interview.startsAt) !== startsAt;
  const expiresAtDirty = toDateTimeInputValue(interview.expiresAt) !== expiresAt;
  const dirty =
    title !== interview.title ||
    jobRole !== (interview.jobRole ?? "") ||
    questionTimeSeconds !== interview.questionTimeSeconds ||
    totalDirty ||
    startsAtDirty ||
    expiresAtDirty ||
    passScore !== interview.passScore ||
    maxViolations !== interview.maxViolations;

  const save = () => {
    if (title.trim().length < 3) {
      toast.error("The title must be at least 3 characters");
      return;
    }
    if (!windowEmpty && !windowValid) {
      toast.error("The exam close time must be after the link activation time");
      return;
    }
    update.mutate({
      title: title.trim(),
      jobRole: jobRole.trim() || undefined,
      questionTimeSeconds: Number(questionTimeSeconds),
      totalTimeSeconds: totalTimeSeconds ? Number(totalTimeSeconds) : null,
      startsAt: new Date(startsAt).toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      passScore: Number(passScore),
      maxViolations: Number(maxViolations),
    });
  };

  return (
    <Card>
      <CardHeader
        title="Edit exam settings"
        subtitle="Change the title, timer per question, total exam time and the active window"
      />
      <CardBody className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="edit-title">Exam title *</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={160}
            />
          </div>
          <div>
            <Label htmlFor="edit-job">Job role</Label>
            <Input
              id="edit-job"
              value={jobRole}
              onChange={(event) => setJobRole(event.target.value)}
              placeholder="e.g. Backend Engineer"
              maxLength={120}
            />
          </div>

          <div>
            <Label htmlFor="edit-qtime">Timer per question (seconds) *</Label>
            <Input
              id="edit-qtime"
              type="number"
              min={30}
              max={3600}
              value={questionTimeSeconds}
              onChange={(event) => setQuestionTimeSeconds(Number(event.target.value))}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {Math.round(questionTimeSeconds / 60)} minute(s) each.
            </p>
          </div>
          <div>
            <Label htmlFor="edit-total">Exam time (seconds, blank = unlimited)</Label>
            <Input
              id="edit-total"
              type="number"
              min={60}
              max={36000}
              placeholder="e.g. 3600"
              value={totalTimeSeconds}
              onChange={(event) => setTotalTimeSeconds(event.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Optional hard cap for the whole interview.
            </p>
          </div>

          <div>
            <Label htmlFor="edit-start">Link active from *</Label>
            <Input
              id="edit-start"
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="edit-expire">Exam closes at *</Label>
            <Input
              id="edit-expire"
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="edit-pass">Pass mark (%)</Label>
            <Input
              id="edit-pass"
              type="number"
              min={0}
              max={100}
              value={passScore}
              onChange={(event) => setPassScore(Number(event.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="edit-violations">Violations tolerated</Label>
            <Input
              id="edit-violations"
              type="number"
              min={0}
              max={20}
              value={maxViolations}
              onChange={(event) => setMaxViolations(Number(event.target.value))}
            />
          </div>
        </div>

        {!windowValid && (
          <p className="text-xs font-medium text-destructive">
            The exam close time must be after the link activation time.
          </p>
        )}

        <div className="flex justify-end">
          <Button onClick={save} loading={update.isPending} disabled={!dirty}>
            <Save className="size-4" />
            Save changes
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

