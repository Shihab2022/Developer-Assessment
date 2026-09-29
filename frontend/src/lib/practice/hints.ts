import type { PracticeProblem } from "./types";
import { GENERIC_PITFALL, GENERIC_STRATEGY, TOPIC_PLAYBOOK } from "./topic-playbook";

/**
 * Guided hints for a problem.
 *
 * Each problem ships its own authored hints (`problem.hints`), but those are
 * one-liners. This module derives a *structured* walkthrough from data the bank
 * already has — topics, constraints, the first example, the comparison mode and
 * the difficulty — so a newcomer always gets somewhere to start, something to
 * watch out for, and an idea of the performance the grader expects.
 *
 * Rendered by `components/practice/HintsPanel`.
 */

export type HintSectionId = "approach" | "plan" | "edge-cases" | "complexity";
export type HintIcon = "compass" | "list" | "shield" | "gauge";

export interface HintSection {
  id: HintSectionId;
  title: string;
  icon: HintIcon;
  summary: string;
  bullets: string[];
}

/** Extract the parameter list from the JavaScript starter stub. */
function parameterNames(problem: PracticeProblem): string[] {
  const match = problem.starterCode.javascript.match(
    new RegExp(`function\\s+${problem.functionName}\\s*\\(([^)]*)\\)`),
  );
  if (!match || !match[1] || !match[1].trim()) return [];
  return match[1]
    .split(",")
    .map((param) => param.trim().replace(/^\.\.\./, ""))
    .filter(Boolean);
}

/** True when at least one case is compared as a multiset. */
function hasUnorderedCase(problem: PracticeProblem): boolean {
  return problem.testCases.some((testCase) => testCase.compareMode === "unordered");
}

/** True when the constraints advertise a large input bound. */
function expectsLargeInput(problem: PracticeProblem): boolean {
  return problem.constraints.some((constraint) =>
    /(10\^|10\*\*|2\^|2\*\*)[1-9]\d*/.test(constraint),
  );
}

/** Extra edge cases worth naming, derived from the constraints themselves. */
function constraintWatchouts(problem: PracticeProblem, bullets: string[]): string[] {
  const text = problem.constraints.join(" ").toLowerCase();
  const watchouts = [...bullets];

  if (/0 <=|length >= 0|empty/.test(text)) {
    watchouts.push('Empty input is allowed — make sure your loop body never runs on `[]` or `""`.');
  }
  if (/duplicate|distinct|unique/.test(text)) {
    watchouts.push("Duplicates appear in the data: decide whether they count once or every time.");
  }
  if (/negative|-10\^|minus/.test(text)) {
    watchouts.push("Negative values are in range — avoid logic that assumes everything is positive.");
  }
  if (/10\^9|10\*\*9|2147483647/.test(text)) {
    watchouts.push("Values are large enough to overflow 32-bit arithmetic — stay in double/BigInt territory.");

/** Target performance note for the difficulty. */
function complexityNotes(problem: PracticeProblem): HintSection {
  const bullets: string[] = [];
  const large = expectsLargeInput(problem);

  if (problem.difficulty === "EASY") {
    bullets.push("A single pass — O(n) — is normally enough; nested loops over the input are a smell here.");
  } else if (problem.difficulty === "MEDIUM") {
    bullets.push("Aim for O(n log n) or O(n): sort or hash once, then walk the input again, not once per element.");
  } else {
    bullets.push("Expect O(n log n) or a DP/graph pass over the input; exponential brute force will time out.");
  }

  if (large) {
    bullets.push(
      "The upper bound in the constraints rules out checking every pair (O(n²)) — reduce it with a map, a sort or a pointer walk.",
    );
  }

  bullets.push(
    "Each run happens in a sandboxed worker with a 5-second budget, so keep allocations inside the loop small.",
  );
  bullets.push("`Run` grades the visible examples; `Submit` adds the hidden cases, so optimise before you submit.");

  return {
    id: "complexity",
    title: "Target performance",
    icon: "gauge",
    summary: "What the grader expects from your solution.",
    bullets,
  };
}

/** Every guided section for a problem, in the order they should be read. */
export function guidedHintSections(problem: PracticeProblem): HintSection[] {
  const playbooks = problem.topics
    .map((topic) => TOPIC_PLAYBOOK[topic])
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .slice(0, 3);

  const strategies = playbooks.length ? playbooks.map((entry) => entry.strategy) : [GENERIC_STRATEGY];
  if (playbooks.length === 0) {
    strategies.push(
      "Name the data structure the answer wants: a counter for frequencies, a stack for nesting, a queue for levels, a pair of pointers for sorted input.",
    );
  }

  const parameters = parameterNames(problem);
  const firstExample = problem.examples[0];
  const plan: string[] = [];

  plan.push(
    parameters.length
      ? `Read the signature: \`${problem.functionName}(${parameters.join(", ")})\` — those are exactly the values the tests pass in.`
      : `Read the stub in the editor: it shows \`${problem.functionName}\` and the arguments the tests pass in.`,
  );
  if (firstExample) {
    plan.push(
      `Work the first example on paper: \`${firstExample.input}\` has to produce \`${firstExample.output}\`.`,
    );
  }
  plan.push("Write the smallest version that passes example 1, even if it is slow, then press Run.");
  plan.push(`Return the value — \`${problem.functionName}\` is expected to return, not print.`);
  plan.push("Then refine: cover the second example, guard the hidden cases, and re-run after each change.");

  const edgeCases = constraintWatchouts(problem, [
    "Single-element input: the loop must still return the right answer.",
  ]);
  if (hasUnorderedCase(problem)) {
    edgeCases.push(
      "Your result is compared as a multiset here, so the order of the returned items does not matter.",
    );
  }
  edgeCases.push(`Constraints to respect: ${problem.constraints.slice(0, 3).join("; ")}.`);

  return [
    {
      id: "approach",
      title: "How to think about it",
      icon: "compass",
      summary: `Techniques that fit ${problem.topics.slice(0, 3).join(", ") || "this problem"}.`,
      bullets: [...strategies, playbooks[0]?.pitfall ?? GENERIC_PITFALL],
    },
    {
      id: "plan",
      title: "A step-by-step plan",
      icon: "list",
      summary: "Follow this order and you will not be stuck staring at an empty editor.",
      bullets: plan,
    },
    {
      id: "edge-cases",
      title: "Do not forget",
      icon: "shield",
      summary: "The cases the hidden tests love to use.",
      bullets: edgeCases,
    },
    complexityNotes(problem),
  ];
}

  }
  return watchouts;
}
