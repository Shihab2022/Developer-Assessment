import { ExamAuthGate } from "@/components/exams/ExamAuthGate";

/**
 * Requires a signed-in user for every technology exam route
 * (`/exams/[technology]/start`, `/attempt/[attemptId]`, and its result page).
 * The `/exams` index remains a public marketing page.
 */
export default function TechnologyExamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ExamAuthGate>{children}</ExamAuthGate>;
}
