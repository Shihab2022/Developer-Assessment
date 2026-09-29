#!/usr/bin/env node
/*
 * Practice-bank generator.
 *
 *   node scripts/generate-practice-bank.mjs
 *
 * Expands the problem families in `practice-bank-families.mjs` into the full
 * practice arena. Every generated problem carries:
 *
 *   - 4 test cases (2 visible on Run, 2 hidden on Submit),
 *   - expected values computed by *executing* the family's reference solution,
 *     so the bank can never drift out of sync with its own answers,
 *   - starter stubs for JavaScript, TypeScript and Python derived from one
 *     signature,
 *   - a description whose narrative is shared across the family and whose
 *     "this set" paragraph describes the concrete data in that set.
 *
 * Outputs
 *   src/data/practice-problems/generated-problems.ts   (committed, typed)
 *   scripts/generated-reference-solutions.json         (verifier input)
 *
 * The generator is deterministic (seeded PRNG), so re-running it produces a
 * byte-identical bank.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRandom } from "./practice-bank-rng.mjs";
import { FAMILIES } from "./practice-bank-families.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(scriptDir, "..");
const dataDir = path.join(frontendDir, "src", "data", "practice-problems");

/** Cases per problem, and how many of them stay visible on Run. */
const CASES_PER_PROBLEM = 4;
const VISIBLE_CASES = 2;
/** Default number of independent case sets generated per family (4 cases each). */
const DEFAULT_CASES_PER_FAMILY = CASES_PER_PROBLEM * 14;
/** Numbers start after the hand-curated bank (110 problems). */
const FIRST_GENERATED_NUMBER = 111;

/* --------------------------------------------------------------- signatures */

/** `twoSum` -> `two_sum`, mirroring the Python harness convention. */
function pyName(fnName) {
  return fnName
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9_]/g, "_")
    .toLowerCase();
}

/** Parameter list shared by all three stubs (`nums: number[], k: number`). */
function paramParts(params) {
  return params
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [rawName, ...rest] = part.split(":");
      return { name: rawName.trim(), type: (rest.join(":") || "number").trim() };
    });
}

/** Builds the starter stubs from one signature. */
function starterCode({ fn, params, returns, summary }) {
  const parts = paramParts(params);
  const jsParams = parts.map((part) => part.name).join(", ");
  const doc = [`${summary}`, "", ...parts.map((part) => `@param {${part.type}} ${part.name}`), `@return {${returns}}`]
    .filter(Boolean)
    .join("\n");

  return {
    javascript: `/**\n * ${doc.split("\n").join("\n * ")}\n */\nfunction ${fn}(${jsParams}) {\n  // Write your solution here\n}`,
    typescript: `function ${fn}(${params}): ${returns} {\n  // Write your solution here\n}`,
    python: `def ${pyName(fn)}(${parts.map((part) => part.name).join(", ")}):\n    """${summary}\n\n    ${parts
      .map((part) => `${part.name}: ${part.type}`)
      .join("\n    ")}\n    returns: ${returns}\n\n    Write your solution, then press Run.\n    """\n    # Write your solution here`,
  };
}


/* ------------------------------------------------------------- formatting */

/** Renders one argument the way it is shown in the `Input:` example block. */
function formatValue(value) {
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    const isMatrix = value.some((entry) => Array.isArray(entry));
    if (isMatrix) return `[\n  ${value.map((row) => formatValue(row)).join(",\n  ")}\n]`;
    return `[${value.map((entry) => formatValue(entry)).join(", ")}]`;
  }
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** `nums = [2,7], k = 9` — the LeetCode-style input line. */
function formatInput(params, args) {
  return paramParts(params)
    .map((part, index) => `${part.name} = ${formatValue(args[index])}`)
    .join(", ");
}

/** Human description of the concrete data inside one problem's case set. */
function describeSet(params, cases) {
  const notes = [];

  paramParts(params).forEach((part, index) => {
    const values = cases.map((args) => args[index]);

    if (values.every((value) => Array.isArray(value) && value.every((row) => Array.isArray(row)))) {
      const pairs = values.every((value) => value.every((row) => row.length === 2));
      if (pairs) {
        notes.push(`${part.name} holds ` + values.map((value) => `${value.length} pairs`).join(", "));
      } else {
        notes.push(
          `${part.name} is a matrix of size ${values
            .map((value) => `${value.length}x${value[0]?.length ?? 0}`)
            .join(", ")}`,
        );
      }
      return;
    }

    if (values.every((value) => Array.isArray(value))) {
      const lengths = values.map((value) => value.length);
      const flat = values.flat().filter((value) => typeof value === "number");
      const range =
        flat.length > 0 ? `, with values from ${Math.min(...flat)} to ${Math.max(...flat)}` : "";
      notes.push(
        `${part.name} holds arrays of ${Math.min(...lengths)}–${Math.max(...lengths)} items${range}`,
      );
      return;
    }

    if (values.every((value) => typeof value === "string")) {
      const lengths = values.map((value) => value.length);
      notes.push(`${part.name} is a string of ${Math.min(...lengths)}–${Math.max(...lengths)} characters`);
      return;
    }

    const numbers = values.filter((value) => typeof value === "number");
    if (numbers.length === values.length && numbers.length > 0) {
      notes.push(`${part.name} ranges over ${Math.min(...numbers)}–${Math.max(...numbers)}`);
    }
  });

  return `This set runs ${cases.length} cases: ${notes.join("; ")}. The hidden cases are the largest of the set.`;
}

/** Deep clone so a solution can never mutate the shared case data. */
function clone(value) {
  return structuredClone(value);
}

/* ------------------------------------------------------------------ builder */

/** Runs the family solution once, producing `{ args, expected }`. */
function materialize(family, args) {
  const expected = family.solve(...clone(args));
  if (expected === undefined) {
    throw new Error(`${family.slug}: solve() returned undefined for ${JSON.stringify(args)}`);
  }
  return { args, expected };
}

function buildProblems() {
  const problems = [];
  const solutions = {};
  let number = FIRST_GENERATED_NUMBER;

  for (const family of FAMILIES) {
    const random = createRandom(family.slug);
    const totalCases = family.cases ?? DEFAULT_CASES_PER_FAMILY;
    const cases = [];

    for (let index = 0; index < totalCases; index += 1) {
      cases.push(materialize(family, family.args(random, index)));
    }

    const setCount = Math.floor(cases.length / CASES_PER_PROBLEM);
    if (setCount < 1) {
      throw new Error(`${family.slug}: needs at least ${CASES_PER_PROBLEM} cases`);
    }

    for (let set = 0; set < setCount; set += 1) {
      const slice = cases.slice(set * CASES_PER_PROBLEM, (set + 1) * CASES_PER_PROBLEM);
      const id = `${family.slug}-set-${set + 1}`;
      const title = `${family.title} (Set ${set + 1})`;

      const examples = slice.slice(0, VISIBLE_CASES).map((entry) => ({
        input: formatInput(family.params, entry.args),
        output: formatValue(entry.expected),
        explanation: family.explain
          ? family.explain(entry.args, entry.expected)
          : `\`${family.fn}\` returns \`${formatValue(entry.expected)}\` for this input.`,
      }));

      problems.push({
        id,
        number,
        title,
        difficulty: family.difficulty ?? "EASY",
        topics: family.topics,
        description: `${family.statement}\n\n**${title} — the data.** ${describeSet(
          family.params,
          slice.map((entry) => entry.args),
        )}`,
        examples,
        constraints: [
          ...family.constraints,
          "Every case in this set must pass: the first two are visible on Run, the last two unlock on Submit.",
        ],
        functionName: family.fn,
        starterCode: starterCode({
          fn: family.fn,
          params: family.params,
          returns: family.returns,
          summary: family.summary ?? family.statement.split("\n")[0],
        }),
        testCases: slice.map((entry, index) => ({
          args: entry.args,
          expected: entry.expected,
          isHidden: index >= VISIBLE_CASES,
          compareMode: family.unordered ? "unordered" : "exact",
        })),
        hints: family.hints,
      });

      // The reference solution is derived from the same function that computed
      // the expected values, so the graded bank can never drift from its answers.
      solutions[id] = `const ${family.fn} = ${family.solve.toString()};`;
      number += 1;
    }
  }

  return { problems, solutions };
}

/* ------------------------------------------------------------------- output */

const { problems, solutions } = buildProblems();

const header = `import type { PracticeProblem } from "@/lib/practice/types";

/**
 * GENERATED FILE — do not edit by hand.
 *
 * Produced by \`scripts/generate-practice-bank.mjs\` from the problem families in
 * \`scripts/practice-bank-families.mjs\`. Every expected value in here was
 * computed by executing that family's reference solution, and
 * \`npm run verify:practice\` re-checks the whole bank.
 *
 * ${problems.length} problems, numbered from ${FIRST_GENERATED_NUMBER}.
 */

export const GENERATED_PROBLEMS: PracticeProblem[] = `;

fs.writeFileSync(
  path.join(dataDir, "generated-problems.ts"),
  `${header}${JSON.stringify(problems, null, 2)};\n`,
  "utf8",
);

fs.writeFileSync(
  path.join(scriptDir, "generated-reference-solutions.json"),
  `${JSON.stringify(solutions, null, 2)}\n`,
  "utf8",
);

console.log(`ok    ${problems.length} generated problems from ${FAMILIES.length} families`);
console.log("ok    src/data/practice-problems/generated-problems.ts");
console.log("ok    scripts/generated-reference-solutions.json");
