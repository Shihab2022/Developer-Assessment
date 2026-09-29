/**
 * Technique playbook per topic tag.
 *
 * Each entry answers the two questions a hint should answer: *how do people
 * attack this class of problem* (`strategy`) and *what breaks first*
 * (`pitfall`). `lib/practice/hints.ts` turns these into guided hint sections, so
 * adding a topic here automatically improves every problem tagged with it.
 */

export interface TopicPlaybookEntry {
  strategy: string;
  pitfall: string;
}

export const TOPIC_PLAYBOOK: Record<string, TopicPlaybookEntry> = {
  Arrays: {
    strategy:
      "Walk the array once, keeping the state you need (index, running total, previous value) in local variables instead of re-scanning.",
    pitfall: "Off-by-one at the last index: loop while `i < nums.length`, not `i <= nums.length`.",
  },
  Strings: {
    strategy:
      'Treat the string as an array of characters: `s[i]`, `s.length`, `s.split("")`, plus a `Map` for counts.',
    pitfall: "Unicode and surrogates: iterate characters instead of assuming one code unit per letter.",
  },
  "Hash Table": {
    strategy:
      "Trade memory for speed — store what you have already seen in a `Map`/`Set` and look it up in O(1).",
    pitfall: "A missing key is `undefined`, so prefer `map.get(k) ?? fallback` over truthiness checks.",
  },
  Math: {
    strategy:
      "Look for the arithmetic shortcut before simulating: divisibility, modular arithmetic or a closed-form sum.",
    pitfall: "Division truncates — use `Math.floor`, and guard every division against a zero denominator.",
  },
  "Dynamic Programming": {
    strategy:
      "Define the sub-problem first (`dp[i]` = best answer using the first `i` items), then write the recurrence down.",
    pitfall: "Most DP bugs live in the base cases, so write `dp[0]` and `dp[1]` explicitly.",
  },
  "Two Pointers": {
    strategy:
      "Move two indices towards each other (or in the same direction at different speeds) and justify every move.",
    pitfall: "On ties, decide whether one pointer advances or both — advancing both silently skips valid pairs.",
  },
  Sorting: {
    strategy:
      "Sort first when the answer only depends on relative order, then finish with a single linear pass.",
    pitfall: "JavaScript sorts numbers as strings, so always pass `(a, b) => a - b`.",
  },
  "Bit Manipulation": {
    strategy:
      "Use `&`, `|`, `^`, `<<` and `>>` for constant-time set operations; `n & (n - 1)` clears the lowest set bit.",
    pitfall: "Bitwise operators coerce to 32-bit signed integers — use `BigInt` beyond that range.",
  },
  Stack: {
    strategy:
      "Push on the way in and pop when the closing counterpart appears; the stack top is your last unresolved item.",
    pitfall: "Empty-stack pops: check `stack.length > 0` before calling `pop()`.",
  },
  "Monotonic Stack": {
    strategy:
      "Keep the stack ordered by value and pop while a new element breaks that order to find each next greater/smaller value.",
    pitfall: "Store indices, not values, when the answer is a distance or a span.",
  },
  Matrix: {
    strategy:
      "Nested loops over rows and columns, reading the bounds once (`rows = grid.length`, `cols = grid[0].length`).",
    pitfall: "Empty or ragged grids: validate the shape before indexing `grid[0]`.",
  },
  Simulation: {
    strategy:
      "Model the process literally with small helpers, then step through it exactly as the statement describes.",
    pitfall: "Boundary wrapping: normalise indices after every move.",
  },
  Recursion: {
    strategy: "Write the base case first, then assume the recursive call is correct and build on it.",
    pitfall: "Deep recursion can overflow the call stack — memoise or convert to a loop.",
  },
  Backtracking: {
    strategy: "Choose, explore, un-choose: mutate one shared state, recurse, then restore it exactly.",
    pitfall: "Copy the current path when storing a result, otherwise every stored answer aliases one array.",
  },
  Greedy: {
    strategy: "Find the locally best choice you can justify, then argue that never looking back is safe.",
    pitfall: "Greedy loses when a local optimum blocks a better global one — re-check the second example.",
  },
  "Sliding Window": {
    strategy: "Grow the right edge, shrink the left edge while the window breaks the rule, keeping the best window seen.",
    pitfall: "Shrink with a `while` loop when several elements can violate the constraint at once.",
  },
  "Binary Search": {
    strategy: "Binary-search the sorted array or the answer space, using a predicate that is monotonic.",
    pitfall: "Infinite loops come from `low = mid`: always move at least one bound past `mid`.",
  },
  "Prefix Sum": {
    strategy: "Precompute running totals so every range sum becomes `prefix[right] - prefix[left]`.",
    pitfall: "Allocate `length + 1` slots so the empty prefix is representable.",
  },
  "Breadth-First Search": {
    strategy: "Expand level by level from a queue to get shortest paths in an unweighted graph.",
    pitfall: "Mark nodes visited when they are enqueued, not when they are dequeued.",
  },
  "Depth-First Search": {
    strategy: "Recurse (or keep an explicit stack) to finish one branch before backtracking.",
    pitfall: "Guard against revisiting nodes, and handle disconnected components.",
  },
  "Union Find": {
    strategy: "Keep a parent array with path compression so union and find stay near constant time.",
    pitfall: "Compare roots (`find(a) === find(b)`), never raw parents.",
  },
  Heap: {
    strategy: "A heap keeps only the k best items, which is exactly what 'kth largest' questions need.",
    pitfall: "Cap the heap at `k`; pushing everything loses the O(n log k) benefit.",
  },
  "Divide and Conquer": {
    strategy: "Split the input, solve both halves recursively, then merge those two answers.",
    pitfall: "The merge step is where the complexity lives — never re-scan the halves naively.",
  },
  Trie: {
    strategy: "Store strings character by character in nested maps so a shared prefix costs one node.",
    pitfall: "Mark word terminators — a shared prefix is not a word on its own.",
  },
  "String Matching": {
    strategy: "Compare windows of the text against the pattern and skip ahead using the pattern's own structure.",
    pitfall: "An empty pattern, or a pattern longer than the text, are both valid inputs — handle them.",
  },
  Quickselect: {
    strategy: "Partition like quicksort but recurse only into the half that contains the k-th element.",
    pitfall: "Randomise the pivot, otherwise sorted input degrades to O(n²).",
  },
  "Number Theory": {
    strategy: "Reach for gcd/factorisation helpers such as `gcd(a, b) = gcd(b, a % b)` instead of brute-force loops.",
    pitfall: "Search divisors only up to `Math.sqrt(n)`.",
  },
  "Monotonic Queue": {
    strategy: "Hold indices in a deque with decreasing values, and evict from the front once they leave the window.",
    pitfall: "Evict indices that fall outside the window as well as smaller values.",
  },
  Logic: {
    strategy: "Write each rule as a small boolean condition and evaluate them in the order the statement lists them.",
    pitfall: "Overlapping rules (divisible by both 3 and 5) must be tested first.",
  },
  Intervals: {
    strategy: "Sort by start, then merge or compare the running end against the next start.",
    pitfall: "Touching intervals (`end === start`) may or may not merge — check the examples.",
  },
  Deque: {
    strategy: "A deque pushes and pops at both ends in O(1), which suits windows and level-order traversals.",
    pitfall: "Shifting the front of a plain array is O(n) — keep an index pointer or use a real deque.",
  },
  Counting: {
    strategy: "Count occurrences in a `Map` and decide from those counts instead of comparing items pairwise.",
    pitfall: "Seed counters for unseen keys before incrementing them.",
  },
  Combinatorics: {
    strategy: "Break the count into independent choices (multiply) or disjoint cases (add).",
    pitfall: "Count each configuration once — subtract whatever the cases over-count.",
  },
};

/** Strategy used when a problem's topics have no playbook entry. */
export const GENERIC_STRATEGY =
  "Restate the task in one sentence, name the input→output mapping, then solve the smallest example by hand before coding.";

/** Pitfall used when a problem's topics have no playbook entry. */
export const GENERIC_PITFALL =
  "Re-read the constraints: the declared input sizes usually rule out the brute-force approach.";
