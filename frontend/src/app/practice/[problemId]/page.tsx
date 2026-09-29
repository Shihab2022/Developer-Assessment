import { notFound } from "next/navigation";
import { ExamShell } from "@/components/exams/ExamShell";
import { ProblemSolver } from "@/components/practice/ProblemSolver";
import type { ProblemLink } from "@/components/practice/ProblemPager";
import { ALL_PROBLEMS, PRE_RENDERED_PROBLEMS, problemById } from "@/lib/practice/index";

/**
 * Problems pre-rendered at build time.
 *
 * The bank holds 1000+ problems; pre-rendering every one of them would slow
 * `next build` down for no benefit, so the curated set is generated statically
 * and the rest render on first request (`dynamicParams` defaults to `true`).
 */
export async function generateStaticParams() {
  return PRE_RENDERED_PROBLEMS.map((problem) => ({ problemId: problem.id }));
}

export async function generateMetadata({ params }: { params: { problemId: string } }) {
  const problem = problemById(params.problemId);
  if (!problem) return { title: "Problem not found" };
  return {
    title: `${problem.number}. ${problem.title}`,
    description: `Solve ${problem.title} in your browser: ${problem.description.slice(0, 130)}…`,
  };
}

/** Lightweight link payload for the previous/next pager. */
function linkFor(problem: (typeof ALL_PROBLEMS)[number] | undefined): ProblemLink | undefined {
  if (!problem) return undefined;
  return {
    id: problem.id,
    number: problem.number,
    title: problem.title,
    difficulty: problem.difficulty,
  };
}

export default function PracticeSolverPage({ params }: { params: { problemId: string } }) {
  const problem = problemById(params.problemId);
  if (!problem) notFound();

  const index = ALL_PROBLEMS.findIndex((entry) => entry.id === problem.id);
  const previous = linkFor(index > 0 ? ALL_PROBLEMS[index - 1] : undefined);
  const next = linkFor(index < ALL_PROBLEMS.length - 1 ? ALL_PROBLEMS[index + 1] : undefined);

  return (
    <ExamShell>
      <ProblemSolver
        problem={problem}
        previous={previous}
        next={next}
        position={index + 1}
        total={ALL_PROBLEMS.length}
      />
    </ExamShell>
  );
}
