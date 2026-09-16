"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import type { Attempt, AttemptTime, AttemptAnswer, Problem } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea, Select, Input } from "@/components/ui/Input";
import { EmptyState, LoadingBlock } from "@/components/ui/Misc";
import { formatDuration } from "@/lib/utils";

export default function MyAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId: string = params?.id as string;
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [timeInfo, setTimeInfo] = useState<AttemptTime | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [answers, setAnswers] = useState<Record<string, AttemptAnswer>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const load = useCallback(async () => {
    try {
      const [aRes, tRes, qRes] = await Promise.all([
        api.get(`/attempts/${attemptId}`),
        api.get(`/attempts/${attemptId}/time`),
        api.get(`/attempts/${attemptId}/questions`),
      ]);
      setAttempt(aRes.data?.data);
      setTimeInfo(tRes.data?.data);
                  const qs = qRes.data?.data;
      const list: Problem[] = Array.isArray(qs)
        ? qs
        : (qs as { problems?: Problem[]; data?: Problem[] } | undefined)?.problems ?? (qs as { data?: Problem[] } | undefined)?.data ?? [];
      setProblems(list);
      aRes.data?.data?.answers?.forEach((ans: AttemptAnswer) => {
        setAnswers((prev) => ({ ...prev, [ans.problemId]: ans }));
      });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!timeInfo) return;
    const tick = () => {
      setTimeInfo((t) => {
        if (!t) return t;
        const remaining = Math.max(0, t.remainingTimeSeconds - 1);
        if (remaining === 0 && t.status === "IN_PROGRESS") {
          void handleAutoSubmit();
        }
        return { ...t, remainingTimeSeconds: remaining };
      });
    };
        timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeInfo]);

  const save = async (problemId: string, payload: Record<string, unknown>) => {
    const res = await api.post(`/attempts/${attemptId}/answers`, { problemId, ...payload });
    setAnswers((prev) => ({ ...prev, [problemId]: res.data?.data ?? { problemId, ...payload } }));
  };

  const handleAutoSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post(`/attempts/${attemptId}/submit`);
      toast.success("Time's up — attempt auto-submitted");
      router.push("/candidate/attempts");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async () => {
    if (!window.confirm("Submit this attempt? You cannot make changes afterward.")) return;
    await handleAutoSubmit();
  };

  if (loading) return <LoadingBlock />;
  if (!attempt) return <EmptyState title="Attempt not found" />;

  const terminal = ["SUBMITTED", "AUTO_SUBMITTED", "COMPLETED", "EXPIRED"].includes(attempt.status);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-slate-900">{attempt.assessment?.title ?? "Assessment"}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Attempt #{attempt.attemptNumber}</span>
                    {timeInfo && timeInfo.remainingTimeSeconds > 0 && (
            <span className="flex items-center gap-1 font-mono">⏱ {formatDuration(timeInfo.remainingTimeSeconds)}</span>
          )}
          <span>Status: {attempt.status}</span>
        </div>
      </header>

      <div className="space-y-5">
        {problems.map((p) => (
          <ProblemCard
            key={p.id}
            problem={p}
            saved={answers[p.id]}
            terminal={terminal}
            onSave={save}
          />
        ))}
      </div>

      {!terminal && (
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/candidate/attempts")}>Back</Button>
          <Button variant="danger" size="sm" loading={submitting} onClick={submit}>Submit attempt</Button>
        </div>
      )}
        </main>
  );
}

function ProblemCard({
  problem, saved, terminal, onSave,
}: {
  problem: Problem;
  saved?: AttemptAnswer;
  terminal: boolean;
  onSave: (problemId: string, payload: Record<string, unknown>) => void | Promise<void>;
}) {
  const [code, setCode] = useState(saved?.code ?? "");
  const [lang, setLang] = useState(saved?.programmingLanguage ?? "javascript");
  const [text, setText] = useState((saved?.answer as { text?: string } | undefined)?.text ?? "");
  const [mcq, setMcq] = useState("");

  const handleSave = () => {
    if (problem.type === "CODING") {
      onSave(problem.id, { code, programmingLanguage: lang });
    } else if (problem.type === "WRITTEN") {
      onSave(problem.id, { answer: { text } });
    } else {
      onSave(problem.id, { answer: { selectedOption: mcq } });
    }
    toast.success("Saved");
  };

  const savedMcq = saved?.answer as { selectedOption?: string } | undefined;

  return (
    <Card>
      <CardHeader title={`#${problem.title}`} subtitle={`Type: ${problem.type} · ${problem.category ?? "Uncategorized"}`} />
      <CardBody className="space-y-3">
        {problem.type === "WRITTEN" && (
          <Textarea
            rows={8}
            placeholder="Write your answer..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={terminal}
          />
        )}
        {problem.type === "MCQ" && (
          <div className="space-y-2">
            {savedMcq?.selectedOption ? (
              <p className="text-sm text-slate-600">Your answer: {savedMcq.selectedOption}</p>
            ) : (
              <p className="text-sm text-slate-500">Enter your selected option below.</p>
            )}
            <Input placeholder="e.g. A, B, C..." value={mcq} onChange={(e) => setMcq(e.target.value)} disabled={terminal} />
          </div>
        )}
        {problem.type === "CODING" && (
          <>
            <Select value={lang} onChange={(e) => setLang(e.target.value)} disabled={terminal}>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
            </Select>
            <Textarea
              rows={10}
              placeholder="Write your code here..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={terminal}
            />
          </>
        )}
        {!terminal && (
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>Save</Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
