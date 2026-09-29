/**
 * Problem families for the practice-bank generator.
 *
 * A *family* is one problem type plus a way to build many concrete data sets for
 * it. `scripts/generate-practice-bank.mjs` runs `solve()` to compute every
 * expected value (and derives the reference solution from the same function),
 * then splits the data sets into problems of four cases: two visible on Run and
 * two hidden until Submit.
 *
 * Rules for a family
 *   - `args(random, index)` must grow with `index`, so each set's hidden cases
 *     are the biggest of that set (the generated description promises this).
 *   - `solve(...args)` must be self-contained — no closures over outer values —
 *     because its source is shipped to the verifier verbatim.
 */

export const FAMILIES = [
  {
    slug: "sum-even-numbers", title: "Sum of Even Numbers", difficulty: "EASY",
    topics: ["Arrays", "Math"], fn: "sumEvenNumbers", params: "nums: number[]", returns: "number",
    statement: "Given an array of integers `nums`, return the sum of all its **even** values. `0` counts as even, and an array with no even value scores `0`.",
    constraints: ["2 <= nums.length <= 10^4", "-10^3 <= nums[i] <= 10^3"],
    hints: ["The test is `n % 2 === 0` — also true for negative even numbers.", "Accumulate in one pass instead of filtering and then summing twice."],
    args: (r, i) => [r.arr({ nMin: 2 + i, nMax: 5 + i * 2, min: -30, max: 60 })],
    solve: (nums) => nums.filter((n) => n % 2 === 0).reduce((sum, n) => sum + n, 0),
  },
  {
    slug: "sum-odd-numbers", title: "Sum of Odd Numbers", difficulty: "EASY",
    topics: ["Arrays", "Math"], fn: "sumOddNumbers", params: "nums: number[]", returns: "number",
    statement: "Given an array of integers `nums`, return the sum of all its **odd** values, or `0` when every value is even.",
    constraints: ["2 <= nums.length <= 10^4", "-10^3 <= nums[i] <= 10^3"],
    hints: ["A value is odd when `n % 2 !== 0`; negative odd numbers satisfy it too.", "One loop with a counter is O(n) and allocates nothing."],
    args: (r, i) => [r.arr({ nMin: 2 + i, nMax: 5 + i * 2, min: -40, max: 55 })],
    solve: (nums) => nums.filter((n) => n % 2 !== 0).reduce((sum, n) => sum + n, 0),
  },
  {
    slug: "count-occurrences", title: "Count Occurrences", difficulty: "EASY",
    topics: ["Arrays", "Counting"], fn: "countOccurrences", params: "nums: number[], target: number", returns: "number",
    statement: "Given an array of integers `nums` and a `target`, return how many times `target` appears in the array.",
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i], target <= 10^4"],
    hints: ["`nums.filter((n) => n === target).length` is already correct.", "A counter loop avoids allocating a filtered copy."],
    args: (r, i) => {
      const nums = r.arr({ nMin: 3 + i, nMax: 6 + i * 2, min: 1, max: 5 });
      return [nums, r.pick(nums)];
    },
    solve: function countOccurrences(nums, target) {
      let count = 0;
      for (const value of nums) if (value === target) count += 1;
      return count;
    },
  },
  {
    slug: "max-value-and-index", title: "Maximum Value and Index", difficulty: "EASY",
    topics: ["Arrays"], fn: "maxValueAndIndex", params: "nums: number[]", returns: "number[]",
    statement: "Given a non-empty array of integers `nums`, return `[value, index]` for the largest value. On a tie, return the **first** index.",
    constraints: ["1 <= nums.length <= 10^5", "-10^5 <= nums[i] <= 10^5"],
    hints: ["Track the best value and its index in the same loop, starting from index `0`.", "Use `>` rather than `>=` so the first occurrence survives a tie."],
    args: (r, i) => [r.arr({ nMin: 2 + i, nMax: 6 + i * 2, min: -50, max: 90 })],
    solve: function maxValueAndIndex(nums) {
      let best = 0;
      for (let i = 1; i < nums.length; i += 1) if (nums[i] > nums[best]) best = i;
      return [nums[best], best];
    },
  },
  {
    slug: "min-and-max", title: "Minimum and Maximum", difficulty: "EASY",
    topics: ["Arrays"], fn: "minAndMax", params: "nums: number[]", returns: "number[]",
    statement: "Given a non-empty array of integers `nums`, return `[min, max]` computed in a single pass.",
    constraints: ["1 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
    hints: ["Seeding both values with `nums[0]` avoids the `Infinity` comparison trap.", "`Math.min(...nums)` spreads the whole array and can overflow the stack."],
    args: (r, i) => [r.arr({ nMin: 2 + i, nMax: 6 + i * 2, min: -200, max: 300 })],
    solve: function minAndMax(nums) {
      let min = nums[0];
      let max = nums[0];
      for (const value of nums) {
        if (value < min) min = value;
        if (value > max) max = value;
      }
      return [min, max];
    },
  },
  {
    slug: "double-each-value", title: "Double Each Value", difficulty: "EASY",
    topics: ["Arrays"], fn: "doubleEach", params: "nums: number[]", returns: "number[]",
    statement: "Given an array of integers `nums`, return a new array where every value has been multiplied by `2`.",
    constraints: ["0 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    hints: ["`nums.map((n) => n * 2)` allocates exactly one new array.", "An empty input must return `[]`, not `0`."],
    args: (r, i) => [r.arr({ nMin: 1 + i, nMax: 5 + i * 2, min: -60, max: 70 })],
    solve: (nums) => nums.map((n) => n * 2),
  },
  {
    slug: "reverse-array-values", title: "Reverse an Array", difficulty: "EASY",
    topics: ["Arrays", "Two Pointers"], fn: "reverseArrayValues", params: "nums: number[]", returns: "number[]",
    statement: "Given an array of integers `nums`, return a new array with the same values in **reverse** order.",
    constraints: ["0 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    hints: ["`[...nums].reverse()` copies first, so the caller's array is untouched.", "A swap loop with a left and a right index reverses in place in O(n)."],
    args: (r, i) => [r.arr({ nMin: 1 + i, nMax: 5 + i * 2, min: -40, max: 40 })],
    solve: (nums) => [...nums].reverse(),
  },
  {
    slug: "running-sum", title: "Running Sum of an Array", difficulty: "EASY",
    topics: ["Arrays", "Prefix Sum"], fn: "runningSum", params: "nums: number[]", returns: "number[]",
    statement: "Given an array of integers `nums`, return the running sum: index `i` of the result holds the sum of `nums[0]` through `nums[i]`.",
    constraints: ["1 <= nums.length <= 10^4", "-10^3 <= nums[i] <= 10^3"],
    hints: ["Keep one accumulator and push it after every addition — O(n) total.", "The first element of the result always equals `nums[0]`."],
    args: (r, i) => [r.arr({ nMin: 2 + i, nMax: 6 + i * 2, min: -40, max: 80 })],
    solve: function runningSum(nums) {
      const out = [];
      let total = 0;
      for (const value of nums) {
        total += value;
        out.push(total);
      }
      return out;
    },
  },
  {
    slug: "kth-largest-value", title: "Kth Largest Value", difficulty: "MEDIUM",
    topics: ["Arrays", "Sorting", "Heap"], fn: "kthLargestValue", params: "nums: number[], k: number", returns: "number",
    statement: "Given an array of integers `nums` and a `k` with `1 <= k <= nums.length`, return the `k`-th largest value. Duplicates count separately, so `k = 1` is the maximum.",
    constraints: ["1 <= k <= nums.length <= 10^4", "-10^4 <= nums[i] <= 10^4"],
    hints: ["Sorting descending and taking index `k - 1` is the short answer (O(n log n)).", "A min-heap of size `k` reaches O(n log k) without sorting everything."],
    args: (r, i) => {
      const nums = r.arr({ nMin: 3 + i, nMax: 8 + i * 2, min: -30, max: 60 });
      return [nums, r.int(1, Math.min(nums.length, 3))];
    },
    solve: (nums, k) => [...nums].sort((a, b) => b - a)[k - 1],
  },
  {
    slug: "second-largest-value", title: "Second Largest Value", difficulty: "EASY",
    topics: ["Arrays"], fn: "secondLargestValue", params: "nums: number[]", returns: "number",
    statement: "Given an array of at least two integers `nums`, return the second largest **distinct** value. If every value is equal, return that value.",
    constraints: ["2 <= nums.length <= 10^5", "-10^5 <= nums[i] <= 10^5"],
    hints: ["Track the best and the runner-up in one pass; move the old best down before replacing it.", "Distinctness matters: `[5, 5]` returns `5`, not `undefined`."],
    args: (r, i) => [r.arr({ nMin: 2 + i, nMax: 6 + i * 2, min: -20, max: 25 })],
    solve: function secondLargestValue(nums) {
      let best = -Infinity;
      let second = -Infinity;
      for (const value of nums) {
        if (value > best) {
          second = best;
          best = value;
        } else if (value < best && value > second) {
          second = value;
        }
      }
      return second === -Infinity ? best : second;
    },
  },
  {
    slug: "count-distinct-values", title: "Count Distinct Values", difficulty: "EASY",
    topics: ["Arrays", "Hash Table"], fn: "countDistinctValues", params: "nums: number[]", returns: "number",
    statement: "Given an array of integers `nums`, return how many **distinct** values it contains.",
    constraints: ["0 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    hints: ["`new Set(nums).size` is the whole answer.", "A `Map` of counts works too and hands you the frequencies as a bonus."],
    args: (r, i) => [r.arr({ nMin: 3 + i, nMax: 7 + i * 2, min: 1, max: 8 })],
    solve: (nums) => new Set(nums).size,
  },
  {
    slug: "max-adjacent-difference", title: "Largest Adjacent Difference", difficulty: "EASY",
    topics: ["Arrays"], fn: "maxAdjacentDifference", params: "nums: number[]", returns: "number",
    statement: "Given an array of at least two integers `nums`, return the largest absolute difference between two neighbouring values.",
    constraints: ["2 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    hints: ["Compare `nums[i]` with `nums[i - 1]` inside one loop from index `1`.", "Differences are absolute — a big drop counts as much as a big rise."],
    args: (r, i) => [r.arr({ nMin: 2 + i, nMax: 6 + i * 2, min: -40, max: 50 })],
    solve: function maxAdjacentDifference(nums) {
      let best = 0;
      for (let i = 1; i < nums.length; i += 1) {
        const gap = Math.abs(nums[i] - nums[i - 1]);
        if (gap > best) best = gap;
      }
      return best;
    },
  },
  {
    slug: "product-of-values", title: "Product of All Values", difficulty: "EASY",
    topics: ["Arrays", "Math"], fn: "productOfValues", params: "nums: number[]", returns: "number",
    statement: "Given a non-empty array of small integers `nums`, return the product of every value.",
    constraints: ["1 <= nums.length <= 20", "-9 <= nums[i] <= 9"],
    hints: ["Start the accumulator at `1` — starting at `0` zeroes the answer.", "Zero anywhere in the array makes the whole product `0`."],
    args: (r, i) => [r.arr({ nMin: 1 + i, nMax: 3 + i, min: -6, max: 7 })],
    solve: (nums) => nums.reduce((product, n) => product * n, 1),
  },
  {
    slug: "longest-increasing-streak", title: "Longest Increasing Streak", difficulty: "MEDIUM",
    topics: ["Arrays", "Simulation"], fn: "longestIncreasingStreak", params: "nums: number[]", returns: "number",
    statement: "Given an array of integers `nums`, return the length of the longest run of **strictly increasing** neighbouring values.\n\nAn empty array scores `0`; every element counts as a streak of `1`.",
    constraints: ["0 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    hints: ["Keep a current streak and a best streak; reset the current one to `1` whenever the value does not increase.", "`>=` breaks a streak — equality is not an increase."],
    args: (r, i) => [r.arr({ nMin: i === 0 ? 1 : 2 + i, nMax: 6 + i * 2, min: 1, max: 8 })],
    solve: function longestIncreasingStreak(nums) {
      if (nums.length === 0) return 0;
      let best = 1;
      let current = 1;
      for (let i = 1; i < nums.length; i += 1) {
        current = nums[i] > nums[i - 1] ? current + 1 : 1;
        if (current > best) best = current;
      }
      return best;
    },
  },
  {
    slug: "move-zeros-to-end", title: "Move Zeros to the End", difficulty: "EASY",
    topics: ["Arrays", "Two Pointers"], fn: "moveZerosToEnd", params: "nums: number[]", returns: "number[]",
    statement: "Given an array of integers `nums`, return a new array with every `0` pushed to the end while the relative order of the non-zero values stays the same.",
    constraints: ["0 <= nums.length <= 10^4", "-10^4 <= nums[i] <= 10^4"],
    hints: ["Collect the non-zero values into one array and count the zeros, then fill the tail.", "A write index that only advances for non-zero values moves them in place in O(n)."],
    args: (r, i) => [r.arr({ nMin: 2 + i, nMax: 6 + i * 2, min: 0, max: 5 })],
    solve: (nums) => {
      const kept = nums.filter((n) => n !== 0);
      const zeros = nums.filter((n) => n === 0);
      return [...kept, ...zeros];
    },
  },
  {
    slug: "filter-greater-than", title: "Filter Values Above a Threshold", difficulty: "EASY",
    topics: ["Arrays"], fn: "filterGreaterThan", params: "nums: number[], limit: number", returns: "number[]",
    statement: "Given an array of integers `nums` and a `limit`, return the values that are **strictly greater** than `limit`, in their original order.",
    constraints: ["0 <= nums.length <= 10^5", "-10^4 <= nums[i], limit <= 10^4"],
    hints: ["`nums.filter((n) => n > limit)` is exact — `>=` would include the boundary value.", "An empty result is valid; never return `null`."],
    args: (r, i) => {
      const nums = r.arr({ nMin: 3 + i, nMax: 7 + i * 2, min: -30, max: 60 });
      return [nums, r.int(-20, 40)];
    },
    solve: (nums, limit) => nums.filter((n) => n > limit),
  },
  {
    slug: "is-sorted-ascending", title: "Is the Array Sorted?", difficulty: "EASY",
    topics: ["Arrays"], fn: "isSortedAscending", params: "nums: number[]", returns: "boolean",
    statement: "Given an array of integers `nums`, return `true` when the values are in **non-decreasing** order, and `false` otherwise.",
    constraints: ["0 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    hints: ["One loop comparing `nums[i]` with `nums[i - 1]` is enough.", "Equal neighbours are fine — the order is non-decreasing, not strictly increasing."],
    args: (r, i) => [i % 3 === 2 ? r.arr({ nMin: 3, nMax: 5 + i, min: -20, max: 20 }) : r.arr({ nMin: 3, nMax: 5 + i, min: -20, max: 20, sorted: true })],
    solve: function isSortedAscending(nums) {
      for (let i = 1; i < nums.length; i += 1) if (nums[i] < nums[i - 1]) return false;
      return true;
    },
  },
  {
    slug: "pair-with-target-sum", title: "Indices of a Pair That Sums to Target", difficulty: "EASY", unordered: true,
    topics: ["Arrays", "Hash Table"], fn: "pairWithTargetSum", params: "nums: number[], target: number", returns: "number[]",
    statement: "Given an array of integers `nums` and a `target`, return the indices of **one** pair whose values add up to `target`. Return the two indices as `[i, j]` — the order does not matter.\n\nEvery input has exactly one valid pair.",
    constraints: ["2 <= nums.length <= 10^4", "-10^4 <= nums[i], target <= 10^4", "Exactly one valid pair exists."],
    hints: ["Store `value → index` in a `Map` and check `target - value` before inserting.", "Do not use the same element twice: insert *after* the lookup."],
    args: (r, i) => {
      const values = r.arr({ nMin: 2 + i, nMax: 5 + i * 2, min: 1, max: 40, unique: true });
      const first = r.int(0, values.length - 2);
      const second = r.int(first + 1, values.length - 1);
      return [values, values[first] + values[second]];
    },
    solve: function pairWithTargetSum(nums, target) {
      const seen = new Map();
      for (let i = 0; i < nums.length; i += 1) {
        const need = target - nums[i];
        if (seen.has(need)) return [seen.get(need), i];
        seen.set(nums[i], i);
      }
      return [];
    },
  },
  {
    slug: "contains-duplicate", title: "Contains Duplicate", difficulty: "EASY",
    topics: ["Arrays", "Hash Table"], fn: "containsDuplicate", params: "nums: number[]", returns: "boolean",
    statement: "Given an array of integers `nums`, return `true` when at least two values are equal, and `false` when every value is distinct.",
    constraints: ["0 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    hints: ["`new Set(nums).size !== nums.length` answers it in one line.", "The set approach is O(n); sorting first is O(n log n)."],
    args: (r, i) => [
      i % 4 === 3
        ? r.arr({ nMin: 3 + i, nMax: 6 + i * 2, min: -30, max: 30, unique: true })
        : r.arr({ nMin: 3 + i, nMax: 6 + i * 2, min: 1, max: 6 }),
    ],
    solve: (nums) => new Set(nums).size !== nums.length,
  },
  {
    slug: "sum-of-squares", title: "Sum of Squares", difficulty: "EASY",
    topics: ["Arrays", "Math"], fn: "sumOfSquares", params: "nums: number[]", returns: "number",
    statement: "Given an array of integers `nums`, return the sum of every value squared.",
    constraints: ["0 <= nums.length <= 10^4", "-100 <= nums[i] <= 100"],
    hints: ["`nums.reduce((sum, n) => sum + n * n, 0)`.", "`Math.pow`/`**` work too, and squares are always non-negative."],
    args: (r, i) => [r.arr({ nMin: 2 + i, nMax: 6 + i * 2, min: -25, max: 30 })],
    solve: (nums) => nums.reduce((sum, n) => sum + n * n, 0),
  },
  {
    slug: "rotate-array-right", title: "Rotate an Array Right", difficulty: "MEDIUM",
    topics: ["Arrays", "Two Pointers"], fn: "rotateArrayRight", params: "nums: number[], k: number", returns: "number[]",
    statement: "Given an array of integers `nums` and a whole number `k`, rotate the array to the **right** by `k` positions and return the result.\n\n`k` may be larger than the array; rotating by `nums.length` is a no-op.",
    constraints: ["0 <= nums.length <= 10^4", "0 <= k <= 10^6"],
    hints: ["Reduce the work first: `k = k % nums.length`.", "`[...nums.slice(-k), ...nums.slice(0, -k)]` is the one-liner once `k > 0`."],
    args: (r, i) => {
      const nums = r.arr({ nMin: i === 0 ? 1 : 2 + i, nMax: 6 + i * 2, min: -20, max: 20 });
      return [nums, r.int(0, nums.length + 3)];
    },
    solve: function rotateArrayRight(nums, k) {
      if (nums.length === 0) return [];
      const shift = ((k % nums.length) + nums.length) % nums.length;
      if (shift === 0) return [...nums];
      return [...nums.slice(-shift), ...nums.slice(0, -shift)];
    },
  },
  {
    slug: "most-frequent-value", title: "Most Frequent Value", difficulty: "EASY",
    topics: ["Arrays", "Hash Table", "Counting"], fn: "mostFrequentValue", params: "nums: number[]", returns: "number",
    statement: "Given a non-empty array of integers `nums`, return the value that appears most often. If several values tie, return the **smallest** of them.",
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    hints: ["Count with a `Map`, then pick the best pair while comparing `(count, -value)`.", "Ties are broken by the smaller value, so compare counts first and values second."],
    args: (r, i) => [r.arr({ nMin: 3 + i, nMax: 7 + i * 2, min: 1, max: 5 })],
    solve: function mostFrequentValue(nums) {
      const counts = new Map();
      for (const value of nums) counts.set(value, (counts.get(value) ?? 0) + 1);
      let best = nums[0];
      for (const [value, count] of counts) {
        const bestCount = counts.get(best);
        if (count > bestCount || (count === bestCount && value < best)) best = value;
      }
      return best;
    },
  },
  {
    slug: "count-duplicated-values", title: "Count Repeated Values", difficulty: "EASY",
    topics: ["Arrays", "Counting"], fn: "countDuplicatedValues", params: "nums: number[]", returns: "number",
    statement: "Given an array of integers `nums`, return how many **distinct** values appear more than once.",
    constraints: ["0 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    hints: ["Count every value in a `Map`, then count the entries whose count exceeds `1`.", "Each repeated value is counted once, no matter how many extra copies exist."],
    args: (r, i) => [r.arr({ nMin: 3 + i, nMax: 8 + i * 2, min: 1, max: 6 })],
    solve: function countDuplicatedValues(nums) {
      const counts = new Map();
      for (const value of nums) counts.set(value, (counts.get(value) ?? 0) + 1);
      let repeated = 0;
      for (const count of counts.values()) if (count > 1) repeated += 1;
      return repeated;
    },
  },
  {
    slug: "count-vowels", title: "Count Vowels", difficulty: "EASY",
    topics: ["Strings", "Counting"], fn: "countVowels", params: "text: string", returns: "number",
    statement: "Given a lowercase string `text`, return how many **vowels** (`a`, `e`, `i`, `o`, `u`) it contains.",
    constraints: ["0 <= text.length <= 10^5", "`text` contains lowercase letters only."],
    hints: ["`/^[aeiou]$/.test(ch)` or `'aeiou'.includes(ch)` per character.", "One pass with a counter is O(n); regex `text.match(/[aeiou]/g)?.length ?? 0` is equally fine."],
    args: (r, i) => [r.str({ nMin: 3 + i, nMax: 8 + i * 3 })],
    solve: function countVowels(text) {
      let count = 0;
      for (const char of text) if ("aeiou".includes(char)) count += 1;
      return count;
    },
  },
  {
    slug: "count-consonants", title: "Count Consonants", difficulty: "EASY",
    topics: ["Strings", "Counting"], fn: "countConsonants", params: "text: string", returns: "number",
    statement: "Given a lowercase string `text`, return how many characters are **consonants** — every letter that is not a vowel.",
    constraints: ["0 <= text.length <= 10^5", "`text` contains lowercase letters only."],
    hints: ["Exclude vowels *and* keep the check to letters: `/[a-z]/` but not `[aeiou]`.", "A single loop with two conditions is enough."],
    args: (r, i) => [r.str({ nMin: 3 + i, nMax: 8 + i * 3 })],
    solve: function countConsonants(text) {
      let count = 0;
      for (const char of text) {
        if (char >= "a" && char <= "z" && !"aeiou".includes(char)) count += 1;
      }
      return count;
    },
  },
  {
    slug: "reverse-words", title: "Reverse the Words", difficulty: "EASY",
    topics: ["Strings"], fn: "reverseWords", params: "sentence: string", returns: "string",
    statement: 'Given a sentence whose words are separated by single spaces, return the sentence with the **word order reversed**.\n\nFor example `"hello there world"` becomes `"world there hello"`.',
    constraints: ["0 <= sentence.length <= 10^4", "Words are separated by exactly one space."],
    hints: ["`sentence.split(\" \").reverse().join(\" \")` is the whole solution.", "An empty sentence must return an empty string, not a stray space."],
    args: (r, i) => [
      r.str({ nMin: 1 + i, nMax: 2 + i, alphabet: "abcdefghijklmnop" }) + " " + r.str({ nMin: 2 + i, nMax: 4 + i, alphabet: "rstuvwxyz" }),
    ],
    solve: (sentence) => sentence.split(" ").reverse().join(" "),
  },
  {
    slug: "is-palindrome-text", title: "Is the Text a Palindrome?", difficulty: "EASY",
    topics: ["Strings", "Two Pointers"], fn: "isPalindromeText", params: "text: string", returns: "boolean",
    statement: "Given a lowercase string `text`, return `true` when it reads the same forwards and backwards.",
    constraints: ["0 <= text.length <= 10^5", "`text` contains lowercase letters only."],
    hints: ["Compare `text[i]` with `text[text.length - 1 - i]` while `i` stays below the middle.", "An empty string and a single character are palindromes."],
    args: (r, i) => {
      const base = r.str({ nMin: 1 + (i % 3), nMax: 3 + (i % 4) });
      return [i % 3 === 0 ? base + [...base].reverse().join("") : base + "z"];
    },
    solve: function isPalindromeText(text) {
      let left = 0;
      let right = text.length - 1;
      while (left < right) {
        if (text[left] !== text[right]) return false;
        left += 1;
        right -= 1;
      }
      return true;
    },
  },
  {
    slug: "is-anagram-pair", title: "Are the Two Strings Anagrams?", difficulty: "EASY",
    topics: ["Strings", "Hash Table"], fn: "isAnagramPair", params: "first: string, second: string", returns: "boolean",
    statement: "Given two lowercase strings `first` and `second`, return `true` when one is an anagram of the other — the same letters with the same counts, in any order.",
    constraints: ["0 <= first.length, second.length <= 10^4", "Lowercase letters only."],
    hints: ["Different lengths can never be anagrams — check that first.", "Count letters with a `Map` (or sort both strings) and compare the tallies."],
    args: (r, i) => {
      const base = r.str({ nMin: 3 + (i % 4), nMax: 6 + (i % 4) });
      if (i % 3 === 0) return [base, r.shuffle([...base]).join("")];
      return [base, base + "q"];
    },
    solve: function isAnagramPair(first, second) {
      if (first.length !== second.length) return false;
      const counts = new Map();
      for (const char of first) counts.set(char, (counts.get(char) ?? 0) + 1);
      for (const char of second) {
        const next = (counts.get(char) ?? 0) - 1;
        if (next < 0) return false;
        counts.set(char, next);
      }
      return true;
    },
  },
  {
    slug: "capitalize-words", title: "Capitalise Every Word", difficulty: "EASY",
    topics: ["Strings"], fn: "capitalizeWords", params: "sentence: string", returns: "string",
    statement: "Given a lowercase sentence with words separated by single spaces, return it with the first letter of every word uppercased.",
    constraints: ["0 <= sentence.length <= 10^4", "Lowercase letters and single spaces only."],
    hints: ["`word[0].toUpperCase() + word.slice(1)` per word.", "Guard against empty words when the input is an empty string."],
    args: (r, i) => [
      r.str({ nMin: 2 + i, nMax: 4 + i }) + " " + r.str({ nMin: 2 + i, nMax: 4 + i }),
    ],
    solve: (sentence) =>
      sentence
        .split(" ")
        .map((word) => (word.length === 0 ? word : word[0].toUpperCase() + word.slice(1)))
        .join(" "),
  },
  {
    slug: "count-words", title: "Count the Words", difficulty: "EASY",
    topics: ["Strings", "Counting"], fn: "countWords", params: "sentence: string", returns: "number",
    statement: "Given a sentence with words separated by single spaces, return how many words it contains. An empty sentence has no words.",
    constraints: ["0 <= sentence.length <= 10^4", "Words are separated by exactly one space."],
    hints: ['An empty string must return `0`, so handle it before `split(" ")`.', '`sentence.trim() === "" ? 0 : sentence.split(" ").length`.'],
    args: (r, i) => [r.str({ nMin: 1, nMax: 3 + i }) + " " + r.str({ nMin: 1, nMax: 3 + i })],
    solve: (sentence) => (sentence.length === 0 ? 0 : sentence.split(" ").length),
  },
  {
    slug: "longest-word", title: "Longest Word", difficulty: "EASY",
    topics: ["Strings"], fn: "longestWord", params: "sentence: string", returns: "string",
    statement: "Given a sentence of space-separated words, return the **longest** word. On a tie, return the one that appears first.",
    constraints: ["1 <= sentence.length <= 10^4", "Words are separated by exactly one space."],
    hints: ["Track the current best word and its length in one pass over `split(\" \")`.", "Use `>` (not `>=`) to keep the first of two equally long words."],
    args: (r, i) => [
      r.str({ nMin: 2 + (i % 3), nMax: 4 + (i % 3) }) + " " + r.str({ nMin: 4 + (i % 5), nMax: 6 + (i % 5) }),
    ],
    solve: function longestWord(sentence) {
      let best = "";
      for (const word of sentence.split(" ")) if (word.length > best.length) best = word;
      return best;
    },
  },
  {
    slug: "most-frequent-character", title: "Most Frequent Character", difficulty: "EASY",
    topics: ["Strings", "Hash Table", "Counting"], fn: "mostFrequentCharacter", params: "text: string", returns: "string",
    statement: "Given a non-empty lowercase string `text`, return the character that occurs most often. On a tie, return the alphabetically smallest character.",
    constraints: ["1 <= text.length <= 10^5", "Lowercase letters only."],
    hints: ["Count every character in a `Map`, then compare `(count, -char)`.", "Sorting the entries by count descending and character ascending also works."],
    args: (r, i) => [r.str({ nMin: 3 + i, nMax: 7 + i * 2, alphabet: "abcde" })],
    solve: function mostFrequentCharacter(text) {
      const counts = new Map();
      for (const char of text) counts.set(char, (counts.get(char) ?? 0) + 1);
      let best = text[0];
      for (const [char, count] of counts) {
        const bestCount = counts.get(best);
        if (count > bestCount || (count === bestCount && char < best)) best = char;
      }
      return best;
    },
  },
  {
    slug: "remove-vowels", title: "Remove the Vowels", difficulty: "EASY",
    topics: ["Strings"], fn: "removeVowels", params: "text: string", returns: "string",
    statement: "Given a lowercase string `text`, return it with every vowel (`a`, `e`, `i`, `o`, `u`) removed. The remaining characters keep their order.",
    constraints: ["0 <= text.length <= 10^4", "Lowercase letters only."],
    hints: ['`[...text].filter((ch) => !"aeiou".includes(ch)).join("")`.', "Consonants and any other characters are all kept."],
    args: (r, i) => [r.str({ nMin: 3 + i, nMax: 9 + i * 2 })],
    solve: (text) => [...text].filter((char) => !"aeiou".includes(char)).join(""),
  },
  {
    slug: "is-isogram", title: "Is It an Isogram?", difficulty: "EASY",
    topics: ["Strings", "Hash Table"], fn: "isIsogram", params: "text: string", returns: "boolean",
    statement: "An **isogram** has no repeated letters. Given a lowercase string `text`, return `true` when every letter appears exactly once.",
    constraints: ["0 <= text.length <= 10^4", "Lowercase letters only."],
    hints: ["`new Set(text).size === text.length` is the whole check.", "An empty string and a single letter are isograms."],
    args: (r, i) => {
      const uniqueText = r.arr({ nMin: 2 + (i % 4), nMax: 8, min: 0, max: 25, unique: true }).map((n) => String.fromCharCode(97 + n)).join("");
      return [i % 4 === 0 ? uniqueText + uniqueText[0] : uniqueText];
    },
    solve: (text) => new Set(text).size === text.length,
  },
  {
    slug: "count-substring-occurrences", title: "Count Substring Occurrences", difficulty: "MEDIUM",
    topics: ["Strings", "String Matching"], fn: "countSubstringOccurrences", params: "text: string, pattern: string", returns: "number",
    statement: "Given a string `text` and a non-empty `pattern`, return how many times `pattern` occurs in `text`.\n\nOverlapping occurrences count separately, so `\"aaa\"` contains `\"aa\"` twice.",
    constraints: ["0 <= text.length <= 10^4", "1 <= pattern.length <= text.length + 1"],
    hints: ["Slide a window of `pattern.length` characters across `text`.", "Advance the start index by **one** each time, not by the pattern length, to catch overlaps."],
    args: (r, i) => {
      const alphabet = "abc";
      const text = r.str({ nMin: 4 + i, nMax: 10 + i * 2, alphabet });
      return [text, r.str({ n: r.int(1, 3), alphabet })];
    },
    solve: function countSubstringOccurrences(text, pattern) {
      if (pattern.length === 0 || pattern.length > text.length) return 0;
      let count = 0;
      for (let i = 0; i + pattern.length <= text.length; i += 1) {
        if (text.slice(i, i + pattern.length) === pattern) count += 1;
      }
      return count;
    },
  },
  {
    slug: "compress-string", title: "Compress Runs of Characters", difficulty: "MEDIUM",
    topics: ["Strings", "Simulation"], fn: "compressString", params: "text: string", returns: "string",
    statement: 'Return a run-length encoding of `text`: each run of the same character becomes the character followed by its count, e.g. `"aaabbc"` becomes `"a3b2c1"`.\n\nA count of `1` is still written, so `"abc"` becomes `"a1b1c1"`.',
    constraints: ["0 <= text.length <= 10^4", "Lowercase letters only."],
    hints: ["Walk the string once, counting how far the current run extends.", "Flush the run when the character changes *and* after the loop ends."],
    args: (r, i) => [r.str({ nMin: 4 + i, nMax: 10 + i * 2, alphabet: "aabbc" })],
    solve: function compressString(text) {
      let out = "";
      let index = 0;
      while (index < text.length) {
        const char = text[index];
        let run = 0;
        while (index < text.length && text[index] === char) {
          run += 1;
          index += 1;
        }
        out += char + String(run);
      }
      return out;
    },
  },
  {
    slug: "common-prefix", title: "Longest Common Prefix", difficulty: "MEDIUM",
    topics: ["Strings", "Arrays"], fn: "commonPrefix", params: "words: string[]", returns: "string",
    statement: 'Given an array of lowercase `words`, return the longest prefix shared by **every** word. Return `""` when there is no common prefix.',
    constraints: ["0 <= words.length <= 200", "0 <= words[i].length <= 20"],
    hints: ["Start from the first word and shrink it until every other word starts with it.", "An empty array has no common prefix, so return `\"\"` immediately."],
    args: (r, i) => {
      const stem = r.str({ nMin: 1 + (i % 3), nMax: 3 + (i % 3) });
      const count = 2 + (i % 3);
      return [Array.from({ length: count }, (_, index) => stem + r.str({ nMin: index === 0 ? 0 : 1, nMax: 3 }))];
    },
    solve: function commonPrefix(words) {
      if (words.length === 0) return "";
      let prefix = words[0];
      for (const word of words) {
        while (!word.startsWith(prefix)) {
          prefix = prefix.slice(0, -1);
          if (prefix === "") return "";
        }
      }
      return prefix;
    },
  },
  {
    slug: "sort-words-alphabetically", title: "Sort Words Alphabetically", difficulty: "EASY",
    topics: ["Sorting", "Strings"], fn: "sortWordsAlphabetically", params: "words: string[]", returns: "string[]",
    statement: "Given an array of lowercase `words`, return a new array sorted alphabetically (default string order).",
    constraints: ["0 <= words.length <= 10^4", "0 <= words[i].length <= 20"],
    hints: ["`[...words].sort()` uses lexicographic order, which is what alphabetical order means here.", "Copy before sorting so the caller's array is untouched."],
    args: (r, i) => [Array.from({ length: 2 + (i % 4) }, () => r.str({ nMin: 1, nMax: 4 }))],
    solve: (words) => [...words].sort(),
  },
  {
    slug: "strip-non-alphanumeric", title: "Strip Non-Alphanumeric Characters", difficulty: "EASY",
    topics: ["Strings"], fn: "stripNonAlphanumeric", params: "text: string", returns: "string",
    statement: "Given a string `text`, return it with everything except digits and letters removed, lowercased.",
    constraints: ["0 <= text.length <= 10^4", "Letters, digits, spaces and punctuation only."],
    hints: ["A single `replace(/[^a-z0-9]/gi, \"\")` does the filtering.", "Lowercase *after* stripping, or use the `i` flag and `toLowerCase()`."],
    args: (r, i) => [
      r.str({ nMin: 2 + i, nMax: 5 + i, alphabet: "abcdefg123" }) + " !" + r.str({ nMin: 1, nMax: 3, alphabet: "XYZ0" }),
    ],
    solve: (text) => text.replace(/[^a-z0-9]/gi, "").toLowerCase(),
  },
  {
    slug: "snake-to-camel", title: "Snake Case to Camel Case", difficulty: "MEDIUM",
    topics: ["Strings"], fn: "snakeToCamel", params: "text: string", returns: "string",
    statement: 'Convert a `snake_case` identifier to `camelCase`: `"user_first_name"` becomes `"userFirstName"`. The first segment keeps its case.',
    constraints: ["0 <= text.length <= 10^4", "Segments are lowercase and separated by single underscores."],
    hints: ["Split on `_`, then uppercase the first letter of every segment after the first.", "Join with an empty string — the underscores disappear."],
    args: (r, i) => [Array.from({ length: 2 + (i % 3) }, () => r.str({ nMin: 2, nMax: 5 })).join("_")],
    solve: (text) =>
      text
        .split("_")
        .map((segment, index) => (index === 0 || segment.length === 0 ? segment : segment[0].toUpperCase() + segment.slice(1)))
        .join(""),
  },
  {
    slug: "camel-to-snake", title: "Camel Case to Snake Case", difficulty: "MEDIUM",
    topics: ["Strings"], fn: "camelToSnake", params: "text: string", returns: "string",
    statement: 'Convert a `camelCase` identifier to `snake_case`: `"userFirstName"` becomes `"user_first_name"`.',
    constraints: ["0 <= text.length <= 10^4", "Letters only, with `camelCase` capitalisation."],
    hints: ["Insert an underscore before every capital letter: `text.replace(/[A-Z]/g, (c) => \"_\" + c)`.", "Lowercase the whole result at the end."],
    args: (r, i) => {
      const segments = Array.from({ length: 2 + (i % 3) }, (_, index) => {
        const word = r.str({ nMin: 2, nMax: 5 });
        return index === 0 ? word : word[0].toUpperCase() + word.slice(1);
      });
      return [segments.join("")];
    },
    solve: (text) => text.replace(/[A-Z]/g, (char) => `_${char}`).toLowerCase(),
  },
  {
    slug: "gcd-of-pair", title: "Greatest Common Divisor", difficulty: "MEDIUM",
    topics: ["Math", "Number Theory"], fn: "gcdOfPair", params: "a: number, b: number", returns: "number",
    statement: "Given two positive integers `a` and `b`, return their greatest common divisor.",
    constraints: ["1 <= a, b <= 10^9"],
    hints: ["Euclid's algorithm: `gcd(a, b) = gcd(b, a % b)` until `b` is `0`.", "The answer of `a = 1` or `b = 1` is always `1`."],
    args: (r, i) => {
      const base = r.int(2, 12) + i;
      return [base * r.int(2, 5), base * r.int(2, 6)];
    },
    solve: function gcdOfPair(a, b) {
      let x = a;
      let y = b;
      while (y !== 0) {
        const next = x % y;
        x = y;
        y = next;
      }
      return x;
    },
  },
  {
    slug: "lcm-of-pair", title: "Least Common Multiple", difficulty: "MEDIUM",
    topics: ["Math", "Number Theory"], fn: "lcmOfPair", params: "a: number, b: number", returns: "number",
    statement: "Given two positive integers `a` and `b`, return their least common multiple.",
    constraints: ["1 <= a, b <= 10^6", "The answer fits in a 32-bit integer."],
    hints: ["`lcm(a, b) = a / gcd(a, b) * b` — divide before multiplying to avoid overflow.", "If the numbers are coprime the answer is simply their product."],
    args: (r, i) => {
      const base = r.int(2, 10) + i;
      return [base * r.int(1, 4), base * r.int(1, 5)];
    },
    solve: function lcmOfPair(a, b) {
      let x = a;
      let y = b;
      while (y !== 0) {
        const next = x % y;
        x = y;
        y = next;
      }
      return (a / x) * b;
    },
  },
  {
    slug: "is-prime-number", title: "Is the Number Prime?", difficulty: "EASY",
    topics: ["Math", "Number Theory"], fn: "isPrimeNumber", params: "n: number", returns: "boolean",
    statement: "Given an integer `n`, return `true` when `n` is a prime number (greater than `1` with no divisors other than `1` and itself).",
    constraints: ["0 <= n <= 10^6"],
    hints: ["`0` and `1` are not prime — check them before the loop.", "Test divisors only up to `Math.sqrt(n)`; a divisor above the square root implies one below it."],
    args: (r, i) => [r.int(0, 20 + i * 6)],
    solve: function isPrimeNumber(n) {
      if (n < 2) return false;
      for (let divisor = 2; divisor * divisor <= n; divisor += 1) {
        if (n % divisor === 0) return false;
      }
      return true;
    },
  },
  {
    slug: "count-primes-up-to", title: "Count Primes up to N", difficulty: "MEDIUM",
    topics: ["Math", "Number Theory"], fn: "countPrimesUpTo", params: "n: number", returns: "number",
    statement: "Given an integer `n`, return how many prime numbers are **strictly less than** `n`.",
    constraints: ["0 <= n <= 10^5"],
    hints: ["A sieve of Eratosthenes marks composites in O(n log log n).", "Trial division per number also passes at this size but is slower."],
    args: (r, i) => [r.int(2, 20 + i * 8)],
    solve: function countPrimesUpTo(n) {
      if (n < 3) return 0;
      const composite = new Array(n).fill(false);
      let count = 0;
      for (let value = 2; value < n; value += 1) {
        if (composite[value]) continue;
        count += 1;
        for (let multiple = value * value; multiple < n; multiple += value) composite[multiple] = true;
      }
      return count;
    },
  },
  {
    slug: "sum-of-divisors", title: "Sum of Proper Divisors", difficulty: "MEDIUM",
    topics: ["Math", "Number Theory"], fn: "sumOfDivisors", params: "n: number", returns: "number",
    statement: "Given an integer `n >= 1`, return the sum of its **proper** divisors — every divisor smaller than `n`, including `1`.",
    constraints: ["1 <= n <= 10^6"],
    hints: ["Loop from `2` to `Math.sqrt(n)` and add both `d` and `n / d` when they differ.", "The sum for `n = 1` is `0`."],
    args: (r, i) => [r.int(1, 12) * (1 + i)],
    solve: function sumOfDivisors(n) {
      if (n <= 1) return 0;
      let total = 1;
      for (let divisor = 2; divisor * divisor <= n; divisor += 1) {
        if (n % divisor !== 0) continue;
        total += divisor;
        const pair = n / divisor;
        if (pair !== divisor) total += pair;
      }
      return total;
    },
  },
  {
    slug: "is-perfect-square", title: "Is It a Perfect Square?", difficulty: "EASY",
    topics: ["Math"], fn: "isPerfectSquare", params: "n: number", returns: "boolean",
    statement: "Given a non-negative integer `n`, return `true` when `n` is the square of an integer.",
    constraints: ["0 <= n <= 10^12"],
    hints: ["`Number.isInteger(Math.sqrt(n))` is the short answer.", "Binary-search the root for an integer-only solution without floating point."],
    args: (r, i) => [i % 3 === 0 ? r.int(2, 12 + i) ** 2 : r.int(2, 40 + i * 3)],
    solve: function isPerfectSquare(n) {
      return Number.isInteger(Math.sqrt(n));
    },
  },
  {
    slug: "sum-of-digits", title: "Sum of Digits", difficulty: "EASY",
    topics: ["Math", "Simulation"], fn: "sumOfDigits", params: "n: number", returns: "number",
    statement: "Given a non-negative integer `n`, return the sum of its decimal digits.",
    constraints: ["0 <= n <= 10^12"],
    hints: ["`n % 10` peels off the last digit; `Math.floor(n / 10)` removes it.", "Or convert with `String(n)` and add `Number(digit)` per character."],
    args: (r, i) => [r.int(0, 9) * (10 ** Math.min(i, 6)) + r.int(0, 90 + i)],
    solve: function sumOfDigits(n) {
      let total = 0;
      let value = n;
      while (value > 0) {
        total += value % 10;
        value = Math.floor(value / 10);
      }
      return total;
    },
  },
  {
    slug: "reverse-integer", title: "Reverse an Integer", difficulty: "MEDIUM",
    topics: ["Math", "Simulation"], fn: "reverseInteger", params: "n: number", returns: "number",
    statement: "Given an integer `n`, return it with its digits reversed. Trailing zeros disappear, and a negative number stays negative.",
    constraints: ["-10^9 <= n <= 10^9", "The reversed value fits in a 32-bit integer."],
    hints: ["Work on `Math.abs(n)` and reapply the sign at the end.", "Building the result as `result * 10 + digit` reverses as you go."],
    args: (r, i) => [r.int(-900, 900) * (i % 3 === 0 ? 1 : 10 ** (1 + (i % 3)))],
    solve: function reverseInteger(n) {
      const sign = n < 0 ? -1 : 1;
      let value = Math.abs(n);
      let reversed = 0;
      while (value > 0) {
        reversed = reversed * 10 + (value % 10);
        value = Math.floor(value / 10);
      }
      return reversed * sign;
    },
  },
  {
    slug: "binary-string-of-number", title: "Binary Representation", difficulty: "EASY",
    topics: ["Bit Manipulation", "Math"], fn: "binaryStringOfNumber", params: "n: number", returns: "string",
    statement: 'Given a non-negative integer `n`, return its binary representation without leading zeros — `5` becomes `"101"`, and `0` becomes `"0"`.',
    constraints: ["0 <= n <= 10^9"],
    hints: ["`n.toString(2)` is exact for 32-bit values.", "A manual loop appends `n % 2` digits and needs a special case for `0`."],
    args: (r, i) => [r.int(0, 8) * 2 ** Math.min(i + 2, 12) + r.int(0, 7)],
    solve: (n) => n.toString(2),
  },
  {
    slug: "count-set-bits", title: "Count Set Bits", difficulty: "EASY",
    topics: ["Bit Manipulation"], fn: "countSetBits", params: "n: number", returns: "number",
    statement: "Given a non-negative integer `n`, return how many of its binary digits are `1`.",
    constraints: ["0 <= n <= 10^9"],
    hints: ["`n & 1` reads the lowest bit and `n >>= 1` shifts it away.", "`n &= n - 1` clears the lowest set bit, so the loop runs once per set bit."],
    args: (r, i) => [r.int(0, 40 + i * 30)],
    solve: function countSetBits(n) {
      let count = 0;
      let value = n;
      while (value > 0) {
        count += value & 1;
        value >>= 1;
      }
      return count;
    },
  },
  {
    slug: "is-power-of-two", title: "Is It a Power of Two?", difficulty: "EASY",
    topics: ["Bit Manipulation", "Math"], fn: "isPowerOfTwo", params: "n: number", returns: "boolean",
    statement: "Given an integer `n`, return `true` when `n` is a power of two (`1`, `2`, `4`, `8`, …).",
    constraints: ["-2^31 <= n <= 2^31 - 1"],
    hints: ["`n > 0 && (n & (n - 1)) === 0` is the classic bit trick.", "A loop that divides by two while the remainder is zero is the readable version."],
    args: (r, i) => [i % 3 === 0 ? 2 ** r.int(0, 12) : r.int(1, 50 + i * 5)],
    solve: (n) => n > 0 && (n & (n - 1)) === 0,
  },
  {
    slug: "factorial-of-number", title: "Factorial", difficulty: "MEDIUM",
    topics: ["Math", "Recursion"], fn: "factorialOfNumber", params: "n: number", returns: "number",
    statement: "Given a non-negative integer `n`, return `n!` — the product of every integer from `1` to `n`. By definition `0! = 1`.",
    constraints: ["0 <= n <= 20", "The result fits in a JavaScript number."],
    hints: ["Multiply up from `2` with a `for` loop; `0!` and `1!` both equal `1`.", "Recursion is elegant here but hits the stack limit for large `n`."],
    args: (r, i) => [r.int(0, 8 + (i % 8))],
    solve: function factorialOfNumber(n) {
      let total = 1;
      for (let value = 2; value <= n; value += 1) total *= value;
      return total;
    },
  },
  {
    slug: "fibonacci-value", title: "Nth Fibonacci Number", difficulty: "MEDIUM",
    topics: ["Math", "Dynamic Programming"], fn: "fibonacciValue", params: "n: number", returns: "number",
    statement: "The Fibonacci sequence starts `F(0) = 0`, `F(1) = 1`, and every later term is the sum of the two before it. Given `n`, return `F(n)`.",
    constraints: ["0 <= n <= 60", "The result fits in a JavaScript number."],
    hints: ["Naive recursion recomputes the same terms exponentially often.", "Two rolling variables (`a`, `b`) compute the sequence in O(n) time and O(1) memory."],
    args: (r, i) => [r.int(0, 12 + i * 2)],
    solve: function fibonacciValue(n) {
      let previous = 0;
      let current = 1;
      for (let step = 0; step < n; step += 1) {
        const next = previous + current;
        previous = current;
        current = next;
      }
      return previous;
    },
  },
  {
    slug: "is-leap-year", title: "Is It a Leap Year?", difficulty: "EASY",
    topics: ["Math", "Logic"], fn: "isLeapYear", params: "year: number", returns: "boolean",
    statement: "A year is a leap year when it is divisible by `4`, unless it is a century year — century years are leap years only when divisible by `400`.",
    constraints: ["1 <= year <= 9999"],
    hints: ["`year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)`.", "Check the century rule before the divisibility-by-4 rule, or use the combined condition above."],
    args: (r, i) => [r.pick([1600, 1700, 1900, 2000, 2024, 2100, 1996, 2023]) + i * 4],
    solve: (year) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0),
  },
  {
    slug: "days-in-month", title: "Days in a Month", difficulty: "EASY",
    topics: ["Math", "Logic"], fn: "daysInMonth", params: "month: number, year: number", returns: "number",
    statement: "Given a `month` (1–12) and a `year`, return how many days that month has. February has 29 days in a leap year.",
    constraints: ["1 <= month <= 12", "1 <= year <= 9999"],
    hints: ["Hard-code the table `[31, 28, 31, 30, …]` and special-case February.", "Reuse the leap-year rule for February."],
    args: (r, i) => [r.int(1, 12), r.pick([1900, 1996, 2000, 2023, 2024]) + i],
    solve: function daysInMonth(month, year) {
      const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      if (month === 2 && year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) return 29;
      return days[month - 1];
    },
  },
  {
    slug: "collatz-steps", title: "Collatz Steps", difficulty: "MEDIUM",
    topics: ["Math", "Simulation"], fn: "collatzSteps", params: "n: number", returns: "number",
    statement: "Starting from a positive integer `n`, repeatedly apply `n = n / 2` when `n` is even and `n = 3n + 1` when it is odd. Return how many steps it takes to reach `1`.",
    constraints: ["1 <= n <= 10^6"],
    hints: ["The loop ends exactly when `n` becomes `1` — count steps inside it.", "Use `Math.floor(n / 2)` (or `n >> 1`) for the even case."],
    args: (r, i) => [r.int(1, 6 + i * 3)],
    solve: function collatzSteps(n) {
      let value = n;
      let steps = 0;
      while (value !== 1) {
        value = value % 2 === 0 ? value / 2 : value * 3 + 1;
        steps += 1;
      }
      return steps;
    },
  },
  {
    slug: "is-armstrong-number", title: "Is It an Armstrong Number?", difficulty: "EASY",
    topics: ["Math", "Simulation"], fn: "isArmstrongNumber", params: "n: number", returns: "boolean",
    statement: "An **Armstrong** number equals the sum of its own digits each raised to the power of the digit count — `153 = 1³ + 5³ + 3³`.",
    constraints: ["0 <= n <= 10^7"],
    hints: ["Work digit by digit: `digit ** digits` where `digits = String(n).length`.", "Single-digit numbers are always Armstrong numbers."],
    args: (r, i) => [i % 3 === 0 ? r.pick([153, 370, 371, 407, 1634]) : r.int(10, 100 + i * 20)],
    solve: function isArmstrongNumber(n) {
      const digits = String(n);
      let total = 0;
      for (const digit of digits) total += Number(digit) ** digits.length;
      return total === n;
    },
  },
  {
    slug: "digital-root", title: "Digital Root", difficulty: "EASY",
    topics: ["Math"], fn: "digitalRoot", params: "n: number", returns: "number",
    statement: "The **digital root** is what you get by repeatedly summing the digits of `n` until a single digit remains. Given `n >= 0`, return it.",
    constraints: ["0 <= n <= 10^9"],
    hints: ["Loop: sum the digits, then replace `n` with that sum until `n < 10`.", "There is a closed form using modulo 9, but the loop is easier to read."],
    args: (r, i) => [r.int(0, 90 + i * 40)],
    solve: function digitalRoot(n) {
      let value = n;
      while (value >= 10) {
        let total = 0;
        while (value > 0) {
          total += value % 10;
          value = Math.floor(value / 10);
        }
        value = total;
      }
      return value;
    },
  },
  {
    slug: "matrix-diagonal-sum", title: "Main Diagonal Sum", difficulty: "EASY",
    topics: ["Matrix", "Math"], fn: "matrixDiagonalSum", params: "grid: number[][]", returns: "number",
    statement: "Given a square matrix `grid`, return the sum of the values on its main diagonal — cells where the row index equals the column index.",
    constraints: ["1 <= grid.length <= 200", "`grid` is square, so every row has `grid.length` values."],
    hints: ["The diagonal cells are exactly `grid[i][i]`.", "There is no need for a `j` loop at all."],
    args: (r, i) => [r.matrix({ rows: 3 + (i % 4), cols: 3 + (i % 4), min: -6, max: 9 })],
    solve: function matrixDiagonalSum(grid) {
      let total = 0;
      for (let i = 0; i < grid.length; i += 1) total += grid[i][i];
      return total;
    },
  },
  {
    slug: "matrix-row-sums", title: "Sum of Each Row", difficulty: "EASY",
    topics: ["Matrix"], fn: "matrixRowSums", params: "grid: number[][]", returns: "number[]",
    statement: "Given a matrix `grid`, return an array holding the sum of each row, in row order.",
    constraints: ["1 <= grid.length <= 200", "1 <= grid[i].length <= 200"],
    hints: ["`grid.map((row) => row.reduce((sum, value) => sum + value, 0))`.", "An empty row must contribute `0`, not `undefined`."],
    args: (r, i) => [r.matrix({ rows: 2 + (i % 4), cols: 3 + (i % 3), min: -9, max: 12 })],
    solve: (grid) => grid.map((row) => row.reduce((sum, value) => sum + value, 0)),
  },
  {
    slug: "matrix-column-sums", title: "Sum of Each Column", difficulty: "MEDIUM",
    topics: ["Matrix"], fn: "matrixColumnSums", params: "grid: number[][]", returns: "number[]",
    statement: "Given a matrix `grid`, return an array holding the sum of each column, in column order.",
    constraints: ["1 <= grid.length <= 200", "1 <= grid[i].length <= 200", "Every row has the same length."],
    hints: ["Iterate `col` in the outer loop and `row` in the inner loop.", "Read the column count once from `grid[0].length`."],
    args: (r, i) => [r.matrix({ rows: 2 + (i % 4), cols: 3 + (i % 4), min: -9, max: 12 })],
    solve: function matrixColumnSums(grid) {
      const columns = [];
      const width = grid[0]?.length ?? 0;
      for (let col = 0; col < width; col += 1) {
        let total = 0;
        for (const row of grid) total += row[col];
        columns.push(total);
      }
      return columns;
    },
  },
  {
    slug: "matrix-transpose", title: "Transpose a Matrix", difficulty: "MEDIUM",
    topics: ["Matrix"], fn: "matrixTranspose", params: "grid: number[][]", returns: "number[][]",
    statement: "Given a matrix `grid`, return its transpose: the value at `row i, col j` moves to `row j, col i`.",
    constraints: ["1 <= grid.length <= 200", "1 <= grid[i].length <= 200", "`grid` may be non-square."],
    hints: ["Build `result[j][i] = grid[i][j]`.", "The width of the result is the height of the input."],
    args: (r, i) => [r.matrix({ rows: 2 + (i % 3), cols: 2 + ((i + 1) % 4), min: -5, max: 15 })],
    solve: function matrixTranspose(grid) {
      const height = grid.length;
      const width = grid[0]?.length ?? 0;
      const out = [];
      for (let col = 0; col < width; col += 1) {
        const column = [];
        for (let row = 0; row < height; row += 1) column.push(grid[row][col]);
        out.push(column);
      }
      return out;
    },
  },
  {
    slug: "matrix-count-target", title: "Count a Value in a Matrix", difficulty: "EASY",
    topics: ["Matrix", "Counting"], fn: "matrixCountTarget", params: "grid: number[][], target: number", returns: "number",
    statement: "Given a matrix `grid` and a `target`, return how many cells hold exactly that value.",
    constraints: ["1 <= grid.length <= 200", "1 <= grid[i].length <= 200"],
    hints: ["Flatten with `grid.flat()` and count, or nest two loops.", "`flat()` is fine at this size but doubles the memory."],
    args: (r, i) => {
      const grid = r.matrix({ rows: 3 + (i % 3), cols: 3 + (i % 3), min: -4, max: 8 });
      const flat = grid.flat();
      return [grid, i % 2 === 0 ? r.pick(flat) : r.int(-4, 8)];
    },
    solve: function matrixCountTarget(grid, target) {
      let count = 0;
      for (const row of grid) for (const value of row) if (value === target) count += 1;
      return count;
    },
  },
  {
    slug: "matrix-row-with-max-sum", title: "Row With the Largest Sum", difficulty: "MEDIUM",
    topics: ["Matrix", "Arrays"], fn: "matrixRowWithMaxSum", params: "grid: number[][]", returns: "number",
    statement: "Given a non-empty matrix `grid`, return the **index** of the row whose sum is largest. On a tie, return the lowest index.",
    constraints: ["1 <= grid.length <= 200", "1 <= grid[i].length <= 200"],
    hints: ["Accumulate each row's sum and keep the best index.", "Use `>` (not `>=`) so a tie keeps the earlier row."],
    args: (r, i) => [r.matrix({ rows: 2 + (i % 4), cols: 3 + (i % 4), min: -20, max: 30 })],
    solve: function matrixRowWithMaxSum(grid) {
      let best = 0;
      let bestSum = -Infinity;
      grid.forEach((row, index) => {
        const sum = row.reduce((total, value) => total + value, 0);
        if (sum > bestSum) {
          bestSum = sum;
          best = index;
        }
      });
      return best;
    },
  },
  {
    slug: "climb-stairs-ways", title: "Ways to Climb the Stairs", difficulty: "MEDIUM",
    topics: ["Dynamic Programming", "Math"], fn: "climbStairsWays", params: "n: number", returns: "number",
    statement: "You climb a staircase of `n` steps, taking `1` or `2` steps at a time. Return how many distinct ways you can reach the top.",
    constraints: ["1 <= n <= 60", "The result fits in a JavaScript number."],
    hints: ["It is the Fibonacci recurrence: `ways(n) = ways(n-1) + ways(n-2)`.", "Seed `ways(1) = 1` and `ways(2) = 2`, then roll forward."],
    args: (r, i) => [r.int(1, 10 + i * 2)],
    solve: function climbStairsWays(n) {
      let previous = 1;
      let current = 1;
      for (let step = 1; step < n; step += 1) {
        const next = previous + current;
        previous = current;
        current = next;
      }
      return current;
    },
  },
  {
    slug: "unique-paths-grid", title: "Unique Paths in a Grid", difficulty: "MEDIUM",
    topics: ["Dynamic Programming", "Matrix"], fn: "uniquePathsGrid", params: "rows: number, cols: number", returns: "number",
    statement: "A robot sits at the top-left of a `rows x cols` grid and can only move **right** or **down**. Return how many distinct paths reach the bottom-right corner.",
    constraints: ["1 <= rows, cols <= 30", "The answer fits in a JavaScript number."],
    hints: ["`paths[i][j] = paths[i-1][j] + paths[i][j-1]`, with the first row and column seeded to `1`.", "A single rolling array of length `cols` keeps memory at O(cols)."],
    args: (r, i) => [r.int(1, 4 + (i % 6)), r.int(1, 4 + ((i + 1) % 6))],
    solve: function uniquePathsGrid(rows, cols) {
      const row = new Array(cols).fill(1);
      for (let i = 1; i < rows; i += 1) {
        for (let j = 1; j < cols; j += 1) row[j] += row[j - 1];
      }
      return row[cols - 1];
    },
  },
  {
    slug: "minimum-path-sum", title: "Minimum Path Sum", difficulty: "MEDIUM",
    topics: ["Dynamic Programming", "Matrix"], fn: "minimumPathSum", params: "grid: number[][]", returns: "number",
    statement: "Given a non-empty matrix of non-negative costs `grid`, return the cheapest path from the top-left to the bottom-right, moving only **right** or **down**.",
    constraints: ["1 <= grid.length <= 100", "1 <= grid[i].length <= 100", "0 <= grid[i][j] <= 1000"],
    hints: ["Add the cell cost to the cheaper of the two neighbours you could arrive from.", "The first row and first column can only be reached one way — accumulate them."],
    args: (r, i) => [r.matrix({ rows: 2 + (i % 4), cols: 2 + (i % 4), min: 0, max: 12 })],
    solve: function minimumPathSum(grid) {
      const height = grid.length;
      const width = grid[0].length;
      const cost = grid.map((row) => [...row]);
      for (let j = 1; j < width; j += 1) cost[0][j] += cost[0][j - 1];
      for (let i = 1; i < height; i += 1) cost[i][0] += cost[i - 1][0];
      for (let i = 1; i < height; i += 1) {
        for (let j = 1; j < width; j += 1) {
          cost[i][j] += Math.min(cost[i - 1][j], cost[i][j - 1]);
        }
      }
      return cost[height - 1][width - 1];
    },
  },
  {
    slug: "max-profit-single-trade", title: "Best Time to Buy and Sell", difficulty: "MEDIUM",
    topics: ["Greedy", "Arrays"], fn: "maxProfitSingleTrade", params: "prices: number[]", returns: "number",
    statement: "Given a daily `prices` array where `prices[i]` is the price on day `i`, buy low and sell high **once** and return the best profit.\n\nReturn `0` when no profitable trade exists.",
    constraints: ["2 <= prices.length <= 10^5", "1 <= prices[i] <= 10^4"],
    hints: ["Track the cheapest price seen so far and the best profit at every day.", "You must buy before you sell — the sell day is always scanned after the buy day."],
    args: (r, i) => [r.arr({ nMin: 3 + i, nMax: 8 + i * 2, min: 1, max: 40 })],
    solve: function maxProfitSingleTrade(prices) {
      let lowest = prices[0];
      let best = 0;
      for (const price of prices) {
        if (price < lowest) lowest = price;
        else if (price - lowest > best) best = price - lowest;
      }
      return best;
    },
  },
  {
    slug: "subarray-sum-count", title: "Subarrays With a Given Sum", difficulty: "MEDIUM",
    topics: ["Arrays", "Hash Table", "Prefix Sum"], fn: "subarraySumCount", params: "nums: number[], target: number", returns: "number",
    statement: "Given an array of integers `nums` (possibly negative) and a `target`, return how many **contiguous** subarrays add up to `target`.",
    constraints: ["1 <= nums.length <= 10^4", "-10^3 <= nums[i], target <= 10^3"],
    hints: ["A prefix-sum map turns the question into `prefix[i] - prefix[j] === target`.", "Seeding `prefix 0 → 1` lets a subarray that starts at index `0` be counted."],
    args: (r, i) => [r.arr({ nMin: 3 + i, nMax: 7 + i * 2, min: -3, max: 6 }), r.int(-4, 8)],
    solve: function subarraySumCount(nums, target) {
      const seen = new Map([[0, 1]]);
      let prefix = 0;
      let count = 0;
      for (const value of nums) {
        prefix += value;
        count += seen.get(prefix - target) ?? 0;
        seen.set(prefix, (seen.get(prefix) ?? 0) + 1);
      }
      return count;
    },
  },
  {
    slug: "longest-consecutive-sequence", title: "Longest Consecutive Sequence", difficulty: "MEDIUM",
    topics: ["Arrays", "Hash Table"], fn: "longestConsecutiveSequence", params: "nums: number[]", returns: "number",
    statement: "Given an unsorted array of integers `nums`, return the length of the longest run of consecutive values — each one exactly `1` apart.",
    constraints: ["0 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
    hints: ["Put every value in a `Set`, then only start counting from a value that has no predecessor.", "That trick keeps every element in the inner loop at most once, so the total work is O(n)."],
    args: (r, i) => {
      const base = r.int(1, 9);
      const length = 3 + (i % 5);
      const sequence = Array.from({ length }, (_, index) => base + index);
      return [r.shuffle([...sequence, base + length + 3])];
    },
    solve: function longestConsecutiveSequence(nums) {
      const values = new Set(nums);
      let best = 0;
      for (const value of values) {
        if (values.has(value - 1)) continue;
        let run = 1;
        let current = value;
        while (values.has(current + 1)) {
          run += 1;
          current += 1;
        }
        if (run > best) best = run;
      }
      return best;
    },
  },
  {
    slug: "top-k-frequent-values", title: "Top K Frequent Values", difficulty: "MEDIUM", unordered: true,
    topics: ["Arrays", "Hash Table", "Heap"], fn: "topKFrequentValues", params: "nums: number[], k: number", returns: "number[]",
    statement: "Given an array of integers `nums` and a `k`, return the `k` values that appear most often, **in any order**. Ties may be broken arbitrarily.",
    constraints: ["1 <= k <= number of distinct values in `nums`", "1 <= nums.length <= 10^5"],
    hints: ["Count first with a `Map`, then sort the keys by count descending.", "Sorting the entries is simpler than a heap at this size."],
    args: (r, i) => {
      const nums = r.arr({ nMin: 4 + i, nMax: 9 + i, min: 1, max: 5 });
      const distinct = new Set(nums).size;
      return [nums, r.int(1, Math.min(distinct, 3))];
    },
    solve: function topKFrequentValues(nums, k) {
      const counts = new Map();
      for (const value of nums) counts.set(value, (counts.get(value) ?? 0) + 1);
      return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, k)
        .map((entry) => entry[0]);
    },
  },
  {
    slug: "merge-overlapping-intervals", title: "Merge Overlapping Intervals", difficulty: "MEDIUM",
    topics: ["Intervals", "Sorting"], fn: "mergeOverlappingIntervals", params: "intervals: number[][]", returns: "number[][]",
    statement: "Given a list of `[start, end]` intervals, merge every pair that overlaps and return the merged list sorted by start.\n\nIntervals that only touch (`end === start`) merge too.",
    constraints: ["1 <= intervals.length <= 10^4", "0 <= start <= end <= 10^6"],
    hints: ["Sort by start first, then walk once extending the current interval's end when the next one overlaps.", "`next[0] <= current[1]` is the overlap test — use `<=` so touching intervals merge."],
    args: (r, i) => {
      const count = 2 + (i % 4);
      return [
        Array.from({ length: count }, () => {
          const start = r.int(0, 60 + i);
          return [start, start + r.int(1, 20 + i)];
        }),
      ];
    },
    solve: function mergeOverlappingIntervals(intervals) {
      const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
      const merged = [];
      for (const [start, end] of sorted) {
        const last = merged[merged.length - 1];
        if (last && start <= last[1]) last[1] = Math.max(last[1], end);
        else merged.push([start, end]);
      }
      return merged;
    },
  },
  {
    slug: "balanced-brackets", title: "Balanced Brackets", difficulty: "MEDIUM",
    topics: ["Stack", "Strings"], fn: "balancedBrackets", params: "text: string", returns: "boolean",
    statement: "Given a string of the characters `()[]{}`, return `true` when every bracket is correctly matched and nested.\n\nCharacters other than brackets may appear and should be ignored.",
    constraints: ["0 <= text.length <= 10^4"],
    hints: ["Push opening brackets onto a stack and pop when a closer arrives.", "After the loop the stack must be empty — a leftover opener means the input is unbalanced."],
    args: (r, i) => {
      const pairs = ["()", "[]", "{}", "([])", "{[()]}"];
      const base = r.pick(pairs);
      return [i % 3 === 0 ? base + base : base + "("];
    },
    solve: function balancedBrackets(text) {
      const stack = [];
      const closing = { ")": "(", "]": "[", "}": "{" };
      for (const char of text) {
        if (char === "(" || char === "[" || char === "{") stack.push(char);
        else if (char in closing) {
          if (stack.pop() !== closing[char]) return false;
        }
      }
      return stack.length === 0;
    },
  },
];
