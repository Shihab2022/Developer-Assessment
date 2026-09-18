import { notFound } from "next/navigation";
import { ExamShell } from "@/components/exams/ExamShell";
import { ProblemSolver } from "@/components/practice/ProblemSolver";
import { ALL_PROBLEMS, problemById } from "@/lib/practice/index";

export async function generateStaticParams() {
  return ALL_PROBLEMS.map((problem) => ({ problemId: problem.id }));
}

export async function generateMetadata({ params }: { params: { problemId: string } }) {
  const problem = problemById(params.problemId);
  if (!problem) return { title: "Problem not found — DevAssess" };
  return {
    title: `${problem.number}. ${problem.title} — DevAssess practice`,
    description: `Solve ${problem.title} in your browser: ${problem.description.slice(0, 130)}…`,
  };
}

export default function PracticeSolverPage({ params }: { params: { problemId: string } }) {
  const problem = problemById(params.problemId);
  if (!problem) notFound();

  const index = ALL_PROBLEMS.findIndex((entry) => entry.id === problem.id);
  const previousId = index > 0 ? ALL_PROBLEMS[index - 1]!.id : undefined;
  const nextId = index < ALL_PROBLEMS.length - 1 ? ALL_PROBLEMS[index + 1]!.id : undefined;

  return (
    <ExamShell>
      <ProblemSolver problem={problem} previousId={previousId} nextId={nextId} />
    </ExamShell>
  );
}
