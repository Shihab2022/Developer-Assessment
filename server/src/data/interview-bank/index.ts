import { javascriptTopic } from "./javascript";
import { reactTopic } from "./react";
import { nodejsTopic } from "./nodejs";
import { pythonTopic } from "./python";
import { javaTopic } from "./java";
import { sqlTopic } from "./sql";
import { shuffle, type BankQuestion, type InterviewTopic } from "./types";

export type { BankQuestion, InterviewTopic, InterviewDifficulty } from "./types";

/**
 * Registered interview topics. Adding a technology is a data change only:
 * create `./<technology>.ts` exporting an `InterviewTopic` and list it here.
 */
export const INTERVIEW_TOPICS: InterviewTopic[] = [
  javascriptTopic,
  reactTopic,
  nodejsTopic,
  pythonTopic,
  javaTopic,
  sqlTopic,
];

/** Default time budget per question (5 minutes) — overridable per interview. */
export const DEFAULT_QUESTION_TIME_SECONDS = 300;
export const MIN_QUESTION_TIME_SECONDS = 30;
export const MAX_QUESTION_TIME_SECONDS = 3600;
/** Default number of questions served to a candidate. */
export const DEFAULT_QUESTION_COUNT = 10;

/** Case/space-insensitive lookup so "Node.js", "nodejs" and "node" all resolve. */
function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function getInterviewTopic(technology: string): InterviewTopic | undefined {
  const target = normalize(technology);
  return INTERVIEW_TOPICS.find(
    (topic) => normalize(topic.id) === target || normalize(topic.label) === target,
  );
}

export function isSupportedTechnology(technology: string): boolean {
  return Boolean(getInterviewTopic(technology));
}

/** Metadata for the recruiter UI (no question text). */
export function listInterviewTopics() {
  return INTERVIEW_TOPICS.map((topic) => ({
    id: topic.id,
    label: topic.label,
    description: topic.description,
    questionCount: topic.questions.length,
  }));
}

/**
 * Randomly samples `count` questions from a technology bank.
 * When the bank holds fewer questions than requested, the whole bank is returned.
 */
export function pickBankQuestions(technology: string, count: number): BankQuestion[] {
  const topic = getInterviewTopic(technology);
  if (!topic) return [];
  const shuffled = shuffle(topic.questions);
  const size = Math.max(1, Math.min(count, shuffled.length));
  return shuffled.slice(0, size);
}

/** Total number of bank questions available across every technology. */
export function bankSize(): number {
  return INTERVIEW_TOPICS.reduce((total, topic) => total + topic.questions.length, 0);
}
