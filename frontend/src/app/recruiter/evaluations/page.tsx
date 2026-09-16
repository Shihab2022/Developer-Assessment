"use client";

import { useState } from "react";
import { usePendingEvaluations, useEvaluateWritten } from "@/hooks/useEvaluations";
import { Card, CardBody, PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField, TextareaField } from "@/components/ui/Input";
import { Modal, ModalContent, ModalHeader, ModalFooter } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Primitives";
import { humanizeEnum } from "@/lib/utils";
import type { Evaluation, WrittenEvaluationPayload } from "@/lib/types.platform";

export default function EvaluationsPage() {
  const { data, isLoading } = usePendingEvaluations({ limit: 50 });
  const [scoring, setScoring] = useState<Evaluation | null>(null);
  const pending = data?.data ?? [];

  return (
    <>
      <PageHeader
        title="Evaluations"
        subtitle="Written answers waiting for manual scoring"
      />
      {isLoading ? (
        <Spinner className="mx-auto my-12" />
      ) : pending.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center text-sm text-muted-foreground">
            Nothing waiting for evaluation. Coding submissions are scored automatically.
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((item) => (
            <Card key={item.id}>
              <CardBody className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {item.attempt?.candidate?.name ?? "Candidate"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.problem?.title ?? "Problem"} ·{" "}
                    {item.attempt?.assessment?.title ?? ""} ·{" "}
                    {humanizeEnum(item.type)}
                  </p>
                </div>
                <Button size="sm" onClick={() => setScoring(item)}>
                  Score
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <ScoreModal evaluation={scoring} onClose={() => setScoring(null)} />
    </>
  );
}

function ScoreModal({
  evaluation,
  onClose,
}: {
  evaluation: Evaluation | null;
  onClose: () => void;
}) {
  const evaluate = useEvaluateWritten();
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");

  if (!evaluation) return null;

  const maxScore = evaluation.maxScore ?? evaluation.problem?.points ?? 10;
  const submit = () => {
    const payload: WrittenEvaluationPayload = {
      attemptId: evaluation.attemptId,
      problemId: evaluation.problemId,
      score,
      feedback: feedback || undefined,
    };
    evaluate.mutate(payload, { onSuccess: onClose });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent size="sm">
        <ModalHeader title="Score written answer" />
        <div className="space-y-4 p-4">
          <p className="text-sm text-muted-foreground">
            {evaluation.problem?.title} — max {maxScore} points
          </p>
          <TextField
            label={`Score (0–${maxScore})`}
            type="number"
            min={0}
            max={maxScore}
            required
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
          />
          <TextareaField
            label="Feedback"
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Shared with the candidate in their result"
          />
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={evaluate.isPending || score < 0 || score > maxScore}>
            {evaluate.isPending ? "Saving…" : "Save score"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
