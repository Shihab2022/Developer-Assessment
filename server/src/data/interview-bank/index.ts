import { javascriptTopic } from "./javascript";
import { reactTopic } from "./react";
import { nodejsTopic } from "./nodejs";
import { pythonTopic } from "./python";
import { javaTopic } from "./java";
import { sqlTopic } from "./sql";
import { typescriptQuestions } from "./typescript";
import { expressQuestions } from "./express";
import { goQuestions } from "./go";
import { dockerQuestions } from "./docker";
import { nestjsQuestions } from "./nestjs";
import { fastapiQuestions } from "./fastapi";
import { fastifyQuestions } from "./fastify";
import {
  javaExtra,
  javascriptExtra,
  nodejsExtra,
  pythonExtra,
  reactExtra,
  sqlExtra,
} from "./extras";
import {
  defineTopic,
  extendTopic,
  shuffle,
  type BankQuestion,
  type InterviewTopic,
} from "./types";

export type { BankQuestion, InterviewTopic, InterviewDifficulty } from "./types";

/**
 * Registered interview topics. Adding a technology is a data change only:
 * create `./<technology>.ts` (or append tuples to `./extras.ts`) and list it here.
 */
export const INTERVIEW_TOPICS: InterviewTopic[] = [
  extendTopic(javascriptTopic, javascriptExtra),
  defineTopic({
    id: "typescript",
    label: "TypeScript",
    description: "Type system, generics, advanced types, tooling and daily safety.",
    questions: typescriptQuestions,
  }),
  extendTopic(nodejsTopic, nodejsExtra),
  defineTopic({
    id: "express",
    label: "Express",
    description: "Routing, middleware, error handling, security and production concerns.",
    questions: expressQuestions,
  }),
  defineTopic({
    id: "go",
    label: "Go",
    description: "Language, concurrency, runtime, data structures and tooling.",
    questions: goQuestions,
  }),
  extendTopic(pythonTopic, pythonExtra),
  defineTopic({
    id: "docker",
    label: "Docker",
    description: "Images, Dockerfiles, networking, storage, orchestration and security.",
    questions: dockerQuestions,
  }),
  defineTopic({
    id: "nestjs",
    label: "NestJS",
    description: "Modules, dependency injection, request lifecycle, microservices and testing.",
    questions: nestjsQuestions,
  }),
  defineTopic({
    id: "fastapi",
    label: "FastAPI",
    description: "Pydantic, dependency injection, async, OpenAPI and production patterns.",
    questions: fastapiQuestions,
  }),
  defineTopic({
    id: "fastify",
    label: "Fastify",
    description: "Plugins, hooks, schema validation, performance and operations.",
    questions: fastifyQuestions,
  }),
  extendTopic(reactTopic, reactExtra),
  extendTopic(javaTopic, javaExtra),
  extendTopic(sqlTopic, sqlExtra),
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

/** Resolves a list of technology identifiers to the canonical topic ids. */
export function resolveTechnologyIds(technologies: readonly string[]): string[] {
  const resolved = technologies
    .map((technology) => getInterviewTopic(technology)?.id)
    .filter((id): id is string => Boolean(id));
  return Array.from(new Set(resolved));
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

/** Every topic in a normalized technology collection (single or many). */
function topicsFor(technology: string | readonly string[]): InterviewTopic[] {
  const list = Array.isArray(technology) ? technology : [technology as string];
  const seen = new Set<string>();
  const topics: InterviewTopic[] = [];
  for (const item of list) {
    const topic = getInterviewTopic(item);
    if (topic && !seen.has(topic.id)) {
      seen.add(topic.id);
      topics.push(topic);
    }
  }
  return topics;
}

/**
 * Randomly samples `count` questions across one or more technology banks.
 *
 * The draw is round-robin so every selected technology is represented before
 * repeating, then shuffled so the order is random per candidate. When the banks
 * hold fewer questions than requested, everything available is returned.
 */
export function pickBankQuestions(
  technology: string | readonly string[],
  count: number,
): BankQuestion[] {
  const topics = topicsFor(technology);
  if (!topics.length) return [];
  const buckets = topics.map((topic) => shuffle(topic.questions));
  const merged: BankQuestion[] = [];
  const longest = buckets.reduce((max, bucket) => Math.max(max, bucket.length), 0);
  for (let index = 0; index < longest; index += 1) {
    for (const bucket of buckets) {
      const question = bucket[index];
      if (question) merged.push(question);
    }
  }
  const size = Math.max(1, Math.min(count, merged.length));
  return shuffle(merged).slice(0, size);
}

/** Total number of bank questions available across every technology. */
export function bankSize(): number {
  return INTERVIEW_TOPICS.reduce((total, topic) => total + topic.questions.length, 0);
}

