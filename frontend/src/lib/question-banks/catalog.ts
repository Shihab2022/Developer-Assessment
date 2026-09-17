import type { QuestionBank, TechnologyId, TechnologyMeta } from "./types";

/**
 * Client-safe technology catalog.
 *
 * Intentionally does **not** import any `data/question-banks/*.json`, so pages
 * that only need presentation metadata (label, description, accent) do not drag
 * the whole question bank into the client bundle. Question counts and topics are
 * taken from the bank the user actually loads (see `metaFromBank`).
 */

export interface TechnologyCatalogEntry {
  id: TechnologyId;
  label: string;
  description: string;
  /** lucide-react icon name, resolved by `icons.ts`. */
  icon: string;
  /** Tailwind gradient classes used for the card accent. */
  accent: string;
  /** Short list of the topics covered, for the "what's in this exam" blurb. */
  highlights: string[];
}

export const TECHNOLOGY_CATALOG: TechnologyCatalogEntry[] = [
  {
    id: "javascript",
    label: "JavaScript",
    description:
      "Scenario-based MCQ across six levels: fundamentals, ES6+, async and the event loop, engine internals, team standards and architecture.",
    icon: "Braces",
    accent: "from-amber-400 to-yellow-500",
    highlights: ["Variables & types", "Closures & hoisting", "Event loop", "Promises & async"],
  },
  {
    id: "typescript",
    label: "TypeScript",
    description:
      "Type-system MCQ: inference, unions and narrowing, generics, utility types, strict mode and conditional types.",
    icon: "FileCode2",
    accent: "from-blue-500 to-indigo-500",
    highlights: ["Type inference", "Unions & narrowing", "Generics", "Utility types"],
  },
  {
    id: "python",
    label: "Python",
    description:
      "Core Python MCQ: data structures, mutability, scoping, comprehensions, exceptions and iterators for web developers.",
    icon: "Terminal",
    accent: "from-sky-400 to-emerald-500",
    highlights: ["Data structures", "Mutability", "Comprehensions", "Exceptions"],
  },
  {
    id: "css",
    label: "CSS",
    description:
      "Selectors, specificity, the cascade, layout with Flexbox and Grid, responsive units and modern CSS features.",
    icon: "Palette",
    accent: "from-fuchsia-500 to-violet-500",
    highlights: ["Box model", "Specificity", "Flexbox & Grid", "Responsive design"],
  },
  {
    id: "html",
    label: "HTML",
    description:
      "Semantic markup, accessibility, forms, media and browser behaviour questions for web app development.",
    icon: "Code2",
    accent: "from-orange-500 to-rose-500",
    highlights: ["Semantics", "Accessibility", "Forms & validation", "Script loading"],
  },
  {
    id: "sql",
    label: "SQL",
    description:
      "Query-writing MCQ: filtering, joins, aggregation, NULL semantics, indexes and transactions for application developers.",
    icon: "Database",
    accent: "from-teal-500 to-cyan-500",
    highlights: ["Joins", "Aggregation", "Indexes", "Transactions"],
  },
];

export function catalogById(id: string): TechnologyCatalogEntry | undefined {
  return TECHNOLOGY_CATALOG.find((entry) => entry.id === id);
}

/**
 * Expands a loaded bank into the full `TechnologyMeta` shape used by the exam
 * screens — counts and topics come from the bank, presentation from the catalog.
 */
export function metaFromBank(bank: QuestionBank): TechnologyMeta {
  const entry = catalogById(bank.technology);
  return {
    id: bank.technology as TechnologyId,
    label: bank.label,
    description: bank.description,
    icon: entry?.icon ?? "Library",
    accent: entry?.accent ?? "from-primary-500 to-sky-500",
    questionCount: bank.questionCount,
    difficultyCounts: bank.difficultyCounts,
    topics: bank.topics,
    levels: bank.levels,
    source: bank.source,
    sourceKind: bank.source.includes("github.com") ? "curated-repo" : "authored",
  };
}