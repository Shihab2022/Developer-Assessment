"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, CircleDashed, SearchX, Timer } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { SelectField } from "@/components/ui/Select";
import { usePracticeHydrated, usePracticeStore, isSolved } from "@/store/practice";
import { DIFFICULTY_LABELS, STATUS_TONES } from "@/lib/constants";
import type { ProblemIndexEntry } from "@/lib/practice/types";
import { cn } from "@/lib/utils";

type DifficultyFilter = "ALL" | "EASY" | "MEDIUM" | "HARD";
type StatusFilter = "ALL" | "SOLVED" | "UNSOLVED";

/** Filterable problem list — LeetCode table style. */
export function ProblemTable({
  problems,
  topics,
}: {
  problems: ProblemIndexEntry[];
  topics: string[];
}) {
  const hydrated = usePracticeHydrated();
  const solved = usePracticeStore((state) => state.solved);

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("ALL");
  const [topic, setTopic] = useState<string>("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return problems.filter((problem) => {
      if (difficulty !== "ALL" && problem.difficulty !== difficulty) return false;
      if (topic !== "ALL" && !problem.topics.includes(topic)) return false;
      if (status !== "ALL") {
        const solvedState = hydrated && isSolved(solved, problem.id);
        if (status === "SOLVED" && !solvedState) return false;
        if (status === "UNSOLVED" && solvedState) return false;
      }
      if (query) {
        const haystack = `${problem.number} ${problem.title} ${problem.topics.join(" ")}`.toLowerCase();
        return haystack.includes(query);
      }
      return true;
    });
  }, [problems, search, difficulty, topic, status, hydrated, solved]);

  return (
    <div>
      {/* Filters */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by title, number or topic…"
          aria-label="Search problems"
        />
        <SelectField
          value={difficulty}
          onValueChange={(value) => setDifficulty(value as DifficultyFilter)}
          options={[
            { value: "ALL", label: "All difficulties" },
            { value: "EASY", label: "Easy" },
            { value: "MEDIUM", label: "Medium" },
            { value: "HARD", label: "Hard" },
          ]}
          aria-label="Difficulty filter"
        />
        <SelectField
          value={topic}
          onValueChange={setTopic}
          options={[
            { value: "ALL", label: "All topics" },
            ...topics.map((value) => ({ value, label: value })),
          ]}
          aria-label="Topic filter"
        />
        <SelectField
          value={status}
          onValueChange={(value) => setStatus(value as StatusFilter)}
          options={[
            { value: "ALL", label: "All statuses" },
            { value: "SOLVED", label: "Solved" },
            { value: "UNSOLVED", label: "Unsolved" },
          ]}
          aria-label="Status filter"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-14 text-center">
          <SearchX className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No problems match these filters.</p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          {filtered.map((problem, index) => {
            const problemSolved = hydrated && isSolved(solved, problem.id);
            return (
              <li key={problem.id} className={cn(index > 0 && "border-t border-border")}>
                <Link
                  href={`/practice/${problem.id}`}
                  className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 sm:gap-4 sm:px-5"
                >
                  {problemSolved ? (
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-500" aria-label="Solved" />
                  ) : (
                    <CircleDashed className="size-5 shrink-0 text-muted-foreground/50" aria-label="Unsolved" />
                  )}

                  <span className="w-9 shrink-0 font-mono text-xs text-muted-foreground">
                    {problem.number}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground group-hover:underline">
                      {problem.title}
                    </span>
                    <span className="mt-0.5 hidden text-[11px] text-muted-foreground sm:block">
                      {problem.topics.slice(0, 3).join(" · ")}
                    </span>
                  </span>

                  <Badge tone={STATUS_TONES[problem.difficulty] ?? "gray"} size="sm">
                    {DIFFICULTY_LABELS[problem.difficulty] ?? problem.difficulty}
                  </Badge>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Timer className="size-3.5" />
        Showing {filtered.length} of {problems.length} problems
      </p>
    </div>
  );
}

export default ProblemTable;