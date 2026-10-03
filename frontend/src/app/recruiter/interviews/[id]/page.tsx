"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ClipboardCopy,
  LibraryBig,
  Mail,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge, DifficultyBadge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, DescriptionList, PageHeader } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Select";
import { SwitchField } from "@/components/ui/Checkbox";
import { Skeleton } from "@/components/ui/Primitives";
import { InterviewBankPicker } from "@/components/interviews/InterviewBankPicker";
import { InterviewInviteCard } from "@/components/interviews/InterviewInviteCard";
import { InterviewSettingsForm } from "@/components/interviews/InterviewSettingsForm";
import {
  useAddQuestion,
  useDeleteInterview,
  useInterview,
  useInterviewLifecycle,
  useInterviewSessions,
  useRegenerateQuestions,
  useRemoveQuestion,
  useResendInterviewInvite,
  useUpdateInterview,
} from "@/hooks/useInterviews";
import {
  INTERVIEW_DECISION_LABELS,
  INTERVIEW_SESSION_STATUS_LABELS,
} from "@/lib/constants";
import { copyToClipboard, formatDateTime, parseCommaList } from "@/lib/utils";

export default function InterviewDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const interview = useInterview(id);
  const sessions = useInterviewSessions(id, { page: 1, limit: 50 });
  const update = useUpdateInterview(id);
  const lifecycle = useInterviewLifecycle(id);
  const remove = useDeleteInterview();
  const regenerate = useRegenerateQuestions(id);
  const addQuestion = useAddQuestion(id);
  const removeQuestion = useRemoveQuestion(id);
  const resend = useResendInterviewInvite(id);

  const [bankOpen, setBankOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [hintsInput, setHintsInput] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [maxScore, setMaxScore] = useState(10);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [difficulty, setDifficulty] = useState("MEDIUM");

  if (interview.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (interview.isError || !interview.data) {
    return (
      <Card>
        <CardBody className="py-10 text-center text-sm text-muted-foreground">
          This interview could not be loaded.
        </CardBody>
      </Card>
    );
  }

  const data = interview.data;
  const questions = data.questions ?? [];
  const sessionRows = sessions.data?.data ?? [];

  const addCustomQuestion = () => {
    if (prompt.trim().length < 10) {
      toast.error("The question must be at least 10 characters");
      return;
    }
    addQuestion.mutate(
      {
        prompt: prompt.trim(),
        hints: parseCommaList(hintsInput),
        expectedKeywords: parseCommaList(keywordsInput),
        maxScore,
        timeSeconds: timeSeconds > 0 ? timeSeconds : null,
        difficulty: difficulty as "EASY" | "MEDIUM" | "HARD",
      },
      {
        onSuccess: () => {
          setPrompt("");
          setHintsInput("");
          setKeywordsInput("");
          setTimeSeconds(0);
        },
      },
    );
  };

  return (
    <>
      <PageHeader
        title={data.title}
        subtitle={
          <>
            {data.technology.toUpperCase()} · {data.seniority} · {data.questionTimeSeconds}s per
            question · pass mark {data.passScore}%
          </>
        }
        breadcrumbs={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/recruiter/interviews">
              <ArrowLeft className="size-4" />
              Interviews
            </Link>
          </Button>
        }
        actions={
          <>
            <StatusBadge status={data.status} />
            {data.status === "DRAFT" && (
              <Button
                size="sm"
                onClick={() => lifecycle.mutate("publish")}
                loading={lifecycle.isPending}
              >
                Publish & get link
              </Button>
            )}
            {data.status === "ACTIVE" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => lifecycle.mutate("close")}
                loading={lifecycle.isPending}
              >
                Close to new candidates
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (confirm("Archive this interview? Candidates can no longer open the link.")) {
                  remove.mutate(id);
                }
              }}
              disabled={remove.isPending}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Share the interview" />
          <CardBody className="space-y-4">
            <div>
              <Label htmlFor="candidate-link">Public candidate link</Label>
              <div className="flex gap-2">
                <Input id="candidate-link" readOnly value={data.candidateLink ?? ""} />
                <Button
                  variant="outline"
                  onClick={() => {
                    void copyToClipboard(data.candidateLink ?? "").then((ok) =>
                      toast[ok ? "success" : "error"](
                        ok ? "Link copied" : "Could not copy the link",
                      ),
                    );
                  }}
                >
                  <ClipboardCopy className="size-4" />
                  Copy
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Opening this link asks for camera + microphone access and starts the proctored
                interview.
              </p>
            </div>

            <div className="rounded-lg border border-border p-4">
              <p className="mb-2 text-sm font-medium text-foreground">Link schedule</p>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Active from</p>
                  <p className="font-medium text-foreground">
                    {data.startsAt ? formatDateTime(data.startsAt) : "Immediately on publish"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Closes at</p>
                  <p className="font-medium text-foreground">
                    {data.expiresAt ? formatDateTime(data.expiresAt) : "No expiry set"}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Candidates can only open the link inside this window. Invite them below — each one
                gets a personal link emailed to their inbox.
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Overview" />
          <CardBody>
            <DescriptionList
              columns={1}
              items={[
                { label: "Questions", value: data.questions?.length ?? 0 },
                { label: "Sessions", value: data.stats?.sessionTotal ?? 0 },
                { label: "Reviewed", value: data.stats?.reviewedTotal ?? 0 },
                { label: "Suspended", value: data.stats?.terminatedTotal ?? 0 },
                { label: "AI review", value: data.aiReviewEnabled ? "On" : "Off" },
                { label: "Proctoring", value: data.proctoringEnabled ? "On" : "Off" },
                { label: "Answers get", value: `${data.maxViolations} tolerated violations` },
              ]}
            />
          </CardBody>
        </Card>
      </div>

      <div className="mt-4">
        <InterviewInviteCard interviewId={id} />
      </div>

      <div className="mt-4">
        <InterviewSettingsForm interview={data} />
      </div>

      <Card className="mt-4">
        <CardHeader
          title={`Questions (${questions.length})`}
          subtitle="Bank questions are random per interview — regenerate for a new set"
          action={
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setBankOpen(true)}>
                <LibraryBig className="size-4" />
                Add from bank
              </Button>
              <Button
                size="sm"
                variant="outline"
                loading={regenerate.isPending}
                onClick={() => regenerate.mutate({ keepCustomQuestions: true })}
              >
                <RefreshCw className="size-4" />
                Reshuffle random set
              </Button>
            </div>
          }
        />
        <CardBody className="space-y-4">
          <div className="thin-scrollbar max-h-[420px] space-y-2 overflow-y-auto">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">Q{index + 1}</span>
                    <Badge tone={question.source === "CUSTOM" ? "violet" : "blue"} size="sm">
                      {question.source === "CUSTOM" ? "Your question" : "Bank"}
                    </Badge>
                    <DifficultyBadge difficulty={question.difficulty} />
                    <span className="text-xs text-muted-foreground">
                      {question.hints.length} hints · {question.maxScore} marks
                      {question.timeSeconds ? ` · ${question.timeSeconds}s` : ""}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{question.prompt}</p>
                  {question.expectedKeywords.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Expected: {question.expectedKeywords.join(", ")}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="iconSm"
                  aria-label="Remove question"
                  disabled={removeQuestion.isPending}
                  onClick={() => removeQuestion.mutate(question.id)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
            {questions.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No questions yet — regenerate from the bank or add your own below.
              </p>
            )}
          </div>
        </CardBody>
      </Card>


      <Card className="mt-4">
        <CardHeader
          title="Add your own question"
          subtitle="Custom questions are kept when you regenerate from the bank (requirement: org-authored questions)"
        />
        <CardBody className="space-y-3">
          <div>
            <Label htmlFor="custom-prompt">Question</Label>
            <Textarea
              id="custom-prompt"
              rows={2}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Walk me through how you would design a rate limiter for our public API."
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="custom-hints">Hints (comma separated)</Label>
              <Input
                id="custom-hints"
                value={hintsInput}
                onChange={(event) => setHintsInput(event.target.value)}
                placeholder="Token bucket, per-IP limits"
              />
            </div>
            <div>
              <Label htmlFor="custom-keywords">Expected keywords</Label>
              <Input
                id="custom-keywords"
                value={keywordsInput}
                onChange={(event) => setKeywordsInput(event.target.value)}
                placeholder="redis, sliding window"
              />
            </div>
            <div>
              <Label htmlFor="custom-difficulty">Difficulty</Label>
              <SelectField
                id="custom-difficulty"
                value={difficulty}
                onValueChange={setDifficulty}
                options={[
                  { value: "EASY", label: "Easy" },
                  { value: "MEDIUM", label: "Medium" },
                  { value: "HARD", label: "Hard" },
                ]}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="custom-score">Marks</Label>
              <Input
                id="custom-score"
                type="number"
                min={1}
                max={100}
                value={maxScore}
                onChange={(event) => setMaxScore(Number(event.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="custom-time">Time override (seconds)</Label>
              <Input
                id="custom-time"
                type="number"
                min={0}
                max={3600}
                value={timeSeconds}
                onChange={(event) => setTimeSeconds(Number(event.target.value))}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addCustomQuestion} loading={addQuestion.isPending} className="w-full">
                Add question
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>


      <Card className="mt-4">
        <CardHeader
          icon={<Users className="size-4" />}
          title={`Candidate sessions (${sessionRows.length})`}
          subtitle="Marks, integrity and the AI recommendation for each candidate"
        />
        <CardBody>
          <div className="thin-scrollbar max-h-[460px] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 text-left font-medium text-muted-foreground">Candidate</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Status</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Marks</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Integrity</th>
                  <th className="py-2 text-left font-medium text-muted-foreground">Decision</th>
                  <th className="py-2 text-right font-medium text-muted-foreground">Report</th>
                </tr>
              </thead>
              <tbody>
                {sessions.isPending &&
                  [0, 1, 2, 3].map((row) => (
                    <tr key={`sk-${row}`} className="border-b border-border last:border-0">
                      <td colSpan={6} className="py-3">
                        <Skeleton className="h-9 w-full" />
                      </td>
                    </tr>
                  ))}
                {!sessions.isPending &&
                sessionRows.map((session) => (
                  <tr key={session.id} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <p className="font-medium text-foreground">{session.candidateName}</p>
                      <p className="text-xs text-muted-foreground">{session.candidateEmail}</p>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={session.status} />
                      {session.status === "TERMINATED" && (
                        <p className="mt-1 max-w-xs text-xs text-rose-600">
                          {session.terminationReason ?? "Suspended by proctoring"}
                        </p>
                      )}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {session.status === "NOT_STARTED"
                        ? "—"
                        : `${session.totalScore}/${session.maxScore} (${session.percentage}%)`}
                    </td>
                    <td className="py-3">
                      <Badge
                        tone={
                          session.integrityScore <= 40
                            ? "red"
                            : session.integrityScore <= 75
                              ? "amber"
                              : "green"
                        }
                      >
                        {session.integrityScore}/100
                      </Badge>
                      {session.violationCount > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {session.violationCount} proctoring signals
                        </p>
                      )}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {session.decision ? INTERVIEW_DECISION_LABELS[session.decision] : "—"}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resend.mutate(session.id)}
                          disabled={resend.isPending}
                          title={
                            session.emailSentAt
                              ? "Invite email sent — send it again"
                              : "Send the invite email"
                          }
                        >
                          <Mail className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/recruiter/interviews/${id}/sessions/${session.id}`}>
                            View report
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!sessions.isPending && sessionRows.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No candidates yet. Share the link above — every session appears here with its AI
              report.
            </p>
          )}
        </CardBody>
      </Card>


      <Card className="mt-4">
        <CardHeader
          icon={<Users className="size-4" />}
          title="Round behaviour"
          subtitle="Applies to new sessions — toggles update immediately"
        />
        <CardBody className="grid gap-3 sm:grid-cols-2">
          <SwitchField
            id="setting-hints"
            checked={data.hintsEnabled}
            onCheckedChange={(checked) => update.mutate({ hintsEnabled: checked })}
            label="Allow hints"
          />
          <SwitchField
            id="setting-proctoring"
            checked={data.proctoringEnabled}
            onCheckedChange={(checked) => update.mutate({ proctoringEnabled: checked })}
            label="Proctoring enabled"
          />
          <SwitchField
            id="setting-terminate"
            checked={data.terminateOnCritical}
            onCheckedChange={(checked) => update.mutate({ terminateOnCritical: checked })}
            label="Suspend on critical violations (score 0)"
          />
          <SwitchField
            id="setting-ai"
            checked={data.aiReviewEnabled}
            onCheckedChange={(checked) => update.mutate({ aiReviewEnabled: checked })}
            label="AI review of answers"
          />
          <SwitchField
            id="setting-show-score"
            checked={
              (data.settings as { showScoreToCandidate?: boolean } | null)
                ?.showScoreToCandidate !== false
            }
            onCheckedChange={(checked) => update.mutate({ showScoreToCandidate: checked })}
            label="Show the score to the candidate"
          />
          <p className="text-xs text-muted-foreground sm:col-span-2">
            A session marked{" "}
            <strong>{INTERVIEW_SESSION_STATUS_LABELS.TERMINATED?.toLowerCase()}</strong> was ended
            by proctoring and always scores 0. Last updated {formatDateTime(data.updatedAt)}.
          </p>
        </CardBody>
      </Card>

      <InterviewBankPicker
        interviewId={id}
        technology={data.technology}
        existingKeys={(data.questions ?? [])
          .filter((question) => question.source === "BANK" && question.bankKey)
          .map((question) => question.bankKey as string)}
        open={bankOpen}
        onOpenChange={setBankOpen}
      />
    </>
  );
}

