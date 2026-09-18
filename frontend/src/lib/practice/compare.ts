import type { CompareMode } from "./types";

/**
 * Comparison helpers for grading user solutions.
 *
 * Values cross a worker boundary, so they are always plain structured-clone
 * graphs (arrays, objects, primitives) — never class instances.
 */

/** Structural equality with a tolerance for floating-point results. */
export function deepEqual(a: unknown, b: unknown, epsilon = 1e-5): boolean {
  if (a === b) return true;

  if (typeof a === "number" && typeof b === "number") {
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    return Math.abs(a - b) <= epsilon;
  }

  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") {
    return false;
  }

  const aIsArray = Array.isArray(a);
  const bIsArray = Array.isArray(b);
  if (aIsArray !== bIsArray) return false;

  if (aIsArray && bIsArray) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index], epsilon));
  }

  const aRecord = a as Record<string, unknown>;
  const bRecord = b as Record<string, unknown>;
  const aKeys = Object.keys(aRecord).sort();
  const bKeys = Object.keys(bRecord).sort();
  if (aKeys.length !== bKeys.length) return false;
  if (aKeys.some((key, index) => key !== bKeys[index])) return false;
  return aKeys.every((key) => deepEqual(aRecord[key], bRecord[key], epsilon));
}

/** Sorts nested arrays so order-insensitive answers compare equal. */
function normalizeUnordered(value: unknown): unknown {
  if (!Array.isArray(value)) return value;

  const normalizedChildren = value.map(normalizeUnordered);

  // Sort inner arrays numerically/lexically first so `[2,0]` and `[0,2]` match.
  const sortedChildren = normalizedChildren.map((item) =>
    Array.isArray(item) ? [...item].sort(compareForSort) : item,
  );

  return [...sortedChildren].sort(compareForSort);
}

function compareForSort(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return JSON.stringify(a ?? null).localeCompare(JSON.stringify(b ?? null));
}

/** Compares an actual result against the expected value using the case's mode. */
export function matchesExpected(
  actual: unknown,
  expected: unknown,
  mode: CompareMode = "exact",
): boolean {
  if (mode === "unordered") {
    return deepEqual(normalizeUnordered(actual), normalizeUnordered(expected));
  }
  return deepEqual(actual, expected);
}

/** Renders a value compactly for the results panel. */
export function formatValue(value: unknown, maxLength = 120): string {
  if (value === undefined) return "undefined";
  if (typeof value === "string") {
    return value.length > maxLength ? `"${value.slice(0, maxLength)}…"` : `"${value}"`;
  }
  let text: string;
  try {
    text = JSON.stringify(value, (_, item) => (typeof item === "bigint" ? String(item) : item));
  } catch {
    text = String(value);
  }
  if (text === undefined) return String(value);
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}
