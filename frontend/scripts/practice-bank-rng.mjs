/**
 * Seeded random helpers for the practice-bank generator.
 *
 * The bank is generated, not hand-typed: each family declares *how* to build its
 * arguments and *how* to solve it, and the generator runs the reference solution
 * to derive every expected value. Determinism matters (a rebuild must not churn
 * the committed output), so randomness comes from a seeded mulberry32 PRNG keyed
 * on the family slug.
 */

/**
 * Hard ceiling for generated array and string lengths.
 *
 * Families grow their inputs with the case index so a set's hidden cases are
 * the biggest; without a ceiling the last set of each family would ship
 * hundreds of values and megabytes of committed JSON for no pedagogical gain.
 */
const MAX_LENGTH = 48;

/** Small, fast, deterministic PRNG. */
export function createRandom(seedText) {
  let seed = 0;
  for (let i = 0; i < seedText.length; i += 1) {
    seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
  }

  let state = seed || 1;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min, max) => (max <= min ? min : min + Math.floor(next() * (max - min + 1)));

  const pick = (list) => list[int(0, list.length - 1)];

  const bool = (chance = 0.5) => next() < chance;

  const shuffle = (list) => {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = int(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  /**
   * Array of integers. `n` fixes the length; `nMin`/`nMax` pick one.
   *
   * Lengths are capped: the families grow their inputs with the case index, and
   * without a ceiling the last sets would ship enormous arrays (and megabytes of
   * committed JSON) for no pedagogical gain.
   */
  const arr = ({ n, nMin = 1, nMax = n ?? nMin, min = 0, max = 20, sorted = false, unique = false } = {}) => {
    const low = Math.min(nMin, MAX_LENGTH);
    const high = Math.max(low, Math.min(nMax, MAX_LENGTH));
    const length = n ?? int(low, high);
    const values = [];
    const seen = new Set();
    let guard = 0;

    while (values.length < length && guard < length * 40) {
      guard += 1;
      const value = int(min, max);
      if (unique && seen.has(value)) continue;
      seen.add(value);
      values.push(value);
    }

    const result = values.length === length ? values : values.concat(new Array(length - values.length).fill(min));
    return sorted ? [...result].sort((a, b) => a - b) : result;
  };

  /** Array of floats rounded to one decimal. */
  const floats = ({ n, nMin = 2, nMax = n ?? 6, min = -10, max = 10 } = {}) => {
    const length = n ?? int(nMin, nMax);
    return Array.from({ length }, () => Math.round(next() * (max - min) * 10 + min * 10) / 10);
  };

  /** Lowercase string of the requested length (capped like arrays). */
  const str = ({ n, nMin = 1, nMax = n ?? 12, alphabet = "abcdefghijklmnopqrstuvwxyz" } = {}) => {
    const length = n ?? int(Math.min(nMin, MAX_LENGTH), Math.max(Math.min(nMin, MAX_LENGTH), Math.min(nMax, MAX_LENGTH)));
    let out = "";
    for (let i = 0; i < length; i += 1) out += alphabet[int(0, alphabet.length - 1)];
    return out;
  };

  /** Rows x cols matrix of integers, capped at 8x8. */
  const matrix = ({ rows, cols, min = 0, max = 9 } = {}) =>
    Array.from({ length: Math.min(Math.max(rows, 1), MAX_LENGTH) }, () =>
      arr({ n: Math.min(Math.max(cols, 1), MAX_LENGTH), min, max }),
    );

  return { next, int, pick, bool, shuffle, arr, floats, str, matrix };
}
