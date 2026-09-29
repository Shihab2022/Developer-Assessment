import type { Difficulty, PracticeProblem, PracticeTestCase } from "@/lib/practice/types";

/**
 * Generates starter code for every supported language from a function signature.
 * Keeps each problem definition down to a single `starter(...)` call.
 *
 * Python is derived from the same signature: the camelCase name becomes its
 * PEP 8 equivalent (`twoSum` → `two_sum`) and the parameter names are reused, so
 * the Python stub always matches the name the Pyodide harness calls.
 */

/** `twoSum` → `two_sum`. Mirrors `pythonFunctionName` in `@/lib/practice/python`. */
function pyName(fnName: string): string {
  return fnName
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9_]/g, "_")
    .toLowerCase();
}

/** Python parameter list: the JavaScript names, stripped of rest/type noise. */
function pyParams(params: string): string {
  const names = params
    .split(",")
    .map((param) => param.trim().replace(/^\.\.\./, "").replace(/[^A-Za-z0-9_]/g, ""))
    .filter(Boolean);
  return names.join(", ");
}

/** JSDoc lines as plain Python docstring lines (`@param {T} x` → `x: T`). */
function pyDoc(jsDoc: string): string {
  return jsDoc
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, "").trim())
    .map((line) => {
      const param = line.match(/^@param\s*\{(.+?)\}\s*(.+)$/);
      if (param) return `${param[2]}: ${param[1]}`;
      const returns = line.match(/^@returns?\s*\{(.+?)\}$/);
      if (returns) return `returns: ${returns[1]}`;
      return line;
    })
    .filter(Boolean)
    .join("\n    ");
}

function starter(
  jsDoc: string,
  fnName: string,
  jsParams: string,
  tsParams: string,
  tsReturn: string,
): PracticeProblem["starterCode"] {
  return {
    javascript: `/**\n * ${jsDoc.split("\n").join("\n * ")}\n */\nfunction ${fnName}(${jsParams}) {\n  // Write your solution here\n}`,
    typescript: `function ${fnName}(${tsParams}): ${tsReturn} {\n  // Write your solution here\n}`,
    python: `def ${pyName(fnName)}(${pyParams(jsParams)}):\n    """${pyDoc(jsDoc)}\n\n    Write your solution, then press Run.\n    """\n    # Write your solution here`,
  };
}

/** Shorthand so test-case arrays stay on one line. */
function tc(args: unknown[], expected: unknown, opts?: { hidden?: boolean; unordered?: boolean }): PracticeTestCase {
  return {
    args,
    expected,
    isHidden: opts?.hidden ?? false,
    compareMode: opts?.unordered ? "unordered" : "exact",
  };
}

type D = Difficulty;

export const PRACTICE_PROBLEMS: PracticeProblem[] = [
  /* ================================================================ EASY */
  {
    id: "two-sum", number: 1, title: "Two Sum", difficulty: "EASY" as D,
    topics: ["Arrays", "Hash Table"],
    description:
      "Given an array of integers `nums` and an integer `target`, return **indices** of the two numbers such that they add up to `target`.\n\nYou may assume that each input has exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] == 9" },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" },
    ],
    constraints: ["2 <= nums.length <= 1000", "-10^9 <= nums[i] <= 10^9", "Only one valid answer exists."],
    functionName: "twoSum",
    starterCode: starter(
      "@param {number[]} nums\n * @param {number} target\n * @return {number[]}",
      "twoSum", "nums, target", "nums: number[], target: number", "number[]",
    ),
    testCases: [
      tc([[2, 7, 11, 15], 9], [0, 1], { unordered: true }),
      tc([[3, 2, 4], 6], [1, 2], { unordered: true }),
      tc([[3, 3], 6], [0, 1], { unordered: true, hidden: true }),
      tc([[-1, -2, -3, -4, -5], -8], [2, 4], { unordered: true, hidden: true }),
    ],
    hints: [
      "A brute-force approach checks every pair — O(n²). Can you do better?",
      "Try a hash map: for each number, check whether `target - num` has been seen before.",
    ],
  },
  {
    id: "valid-palindrome", number: 2, title: "Valid Palindrome", difficulty: "EASY" as D,
    topics: ["Strings", "Two Pointers"],
    description:
      "A phrase is a **palindrome** if, after converting all uppercase letters to lowercase and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nGiven a string `s`, return `true` if it is a palindrome, or `false` otherwise.",
    examples: [
      { input: 's = "A man, a plan, a canal: Panama"', output: "true", explanation: '"amanaplanacanalpanama" is a palindrome.' },
      { input: 's = "race a car"', output: "false" },
    ],
    constraints: ["1 <= s.length <= 2 * 10^5", "s consists only of printable ASCII characters."],
    functionName: "isPalindrome",
    starterCode: starter(
      "@param {string} s\n * @return {boolean}",
      "isPalindrome", "s", "s: string", "boolean",
    ),
    testCases: [
      tc(["A man, a plan, a canal: Panama"], true),
      tc(["race a car"], false),
      tc([" "], true, { hidden: true }),
      tc(["0P"], false, { hidden: true }),
    ],
    hints: ["Filter the string first, then compare characters from both ends moving inward."],
  },
  {
    id: "fizz-buzz", number: 3, title: "FizzBuzz", difficulty: "EASY" as D,
    topics: ["Strings", "Logic"],
    description:
      "Given an integer `n`, return a string array `answer` (1-indexed) where:\n\n- `answer[i] == \"FizzBuzz\"` if `i` is divisible by 3 and 5\n- `answer[i] == \"Fizz\"` if `i` is divisible by 3\n- `answer[i] == \"Buzz\"` if `i` is divisible by 5\n- `answer[i] == i` (as a string) otherwise",
    examples: [
      { input: "n = 5", output: '["1","2","Fizz","4","Buzz"]' },
      { input: "n = 3", output: '["1","2","Fizz"]' },
    ],
    constraints: ["1 <= n <= 10^4"],
    functionName: "fizzBuzz",
    starterCode: starter(
      "@param {number} n\n * @return {string[]}",
      "fizzBuzz", "n", "n: number", "string[]",
    ),
    testCases: [
      tc([5], ["1", "2", "Fizz", "4", "Buzz"]),
      tc([3], ["1", "2", "Fizz"]),
      tc([15], ["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"], { hidden: true }),
    ],
    hints: ["Check divisibility by 15 (both 3 and 5) first, then by 3, then by 5."],
  },
  {
    id: "reverse-string", number: 4, title: "Reverse String", difficulty: "EASY" as D,
    topics: ["Strings", "Two Pointers"],
    description: "Write a function that reverses a string and returns the result.",
    examples: [
      { input: 's = "hello"', output: '"olleh"' },
      { input: 's = "A man"', output: '"nam A"' },
    ],
    constraints: ["0 <= s.length <= 10^5"],
    functionName: "reverseString",
    starterCode: starter(
      "@param {string} s\n * @return {string}",
      "reverseString", "s", "s: string", "string",
    ),
    testCases: [
      tc(["hello"], "olleh"),
      tc(["A man"], "nam A"),
      tc([""], "", { hidden: true }),
      tc(["a"], "a", { hidden: true }),
    ],
    hints: ["Two pointers from both ends, swapping and moving inward."],
  },
  {
    id: "contains-duplicate", number: 5, title: "Contains Duplicate", difficulty: "EASY" as D,
    topics: ["Arrays", "Hash Table"],
    description: "Given an integer array `nums`, return `true` if any value appears **at least twice** in the array, and return `false` if every element is distinct.",
    examples: [
      { input: "nums = [1,2,3,1]", output: "true" },
      { input: "nums = [1,2,3,4]", output: "false" },
    ],
    constraints: ["1 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
    functionName: "containsDuplicate",
    starterCode: starter(
      "@param {number[]} nums\n * @return {boolean}",
      "containsDuplicate", "nums", "nums: number[]", "boolean",
    ),
    testCases: [
      tc([[1, 2, 3, 1]], true),
      tc([[1, 2, 3, 4]], false),
      tc([[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], true, { hidden: true }),
      tc([[]], false, { hidden: true }),
    ],
    hints: ["A hash set makes this a single-pass O(n) solution."],
  },
  {
    id: "valid-anagram", number: 6, title: "Valid Anagram", difficulty: "EASY" as D,
    topics: ["Strings", "Hash Table"],
    description: "Given two strings `s` and `t`, return `true` if `t` is an **anagram** of `s`, and `false` otherwise.",
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: "true" },
      { input: 's = "rat", t = "car"', output: "false" },
    ],
    constraints: ["0 <= s.length, t.length <= 5 * 10^4", "s and t consist of lowercase English letters."],
    functionName: "isAnagram",
    starterCode: starter(
      "@param {string} s\n * @param {string} t\n * @return {boolean}",
      "isAnagram", "s, t", "s: string, t: string", "boolean",
    ),
    testCases: [
      tc(["anagram", "nagaram"], true),
      tc(["rat", "car"], false),
      tc(["", ""], true, { hidden: true }),
      tc(["a", "ab"], false, { hidden: true }),
    ],
    hints: ["Count character frequencies in one pass, then compare."],
  },
  {
    id: "best-time-stock", number: 7, title: "Best Time to Buy and Sell Stock", difficulty: "EASY" as D,
    topics: ["Arrays", "Dynamic Programming"],
    description:
      "You are given an array `prices` where `prices[i]` is the price of a stock on day `i`. Maximise your profit by choosing a **single day** to buy and a **different day in the future** to sell.\n\nReturn the maximum profit. If no profit is possible, return `0`.",
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "5", explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6)." },
      { input: "prices = [7,6,4,3,1]", output: "0", explanation: "No transactions — profit is 0." },
    ],
    constraints: ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"],
    functionName: "maxProfit",
    starterCode: starter(
      "@param {number[]} prices\n * @return {number}",
      "maxProfit", "prices", "prices: number[]", "number",
    ),
    testCases: [
      tc([[7, 1, 5, 3, 6, 4]], 5),
      tc([[7, 6, 4, 3, 1]], 0),
      tc([[1, 2]], 1, { hidden: true }),
      tc([[2, 4, 1]], 2, { hidden: true }),
    ],
    hints: ["Track the minimum price seen so far; the best profit is the max of (price - minSoFar)."],
  },
  {
    id: "move-zeroes", number: 8, title: "Move Zeroes", difficulty: "EASY" as D,
    topics: ["Arrays", "Two Pointers"],
    description: "Given an integer array `nums`, move all `0`'s to the end while maintaining the relative order of the non-zero elements. Return the resulting array.",
    examples: [
      { input: "nums = [0,1,0,3,12]", output: "[1,3,12,0,0]" },
      { input: "nums = [0]", output: "[0]" },
    ],
    constraints: ["1 <= nums.length <= 10^4", "-2^31 <= nums[i] <= 2^31 - 1"],
    functionName: "moveZeroes",
    starterCode: starter(
      "@param {number[]} nums\n * @return {number[]}",
      "moveZeroes", "nums", "nums: number[]", "number[]",
    ),
    testCases: [
      tc([[0, 1, 0, 3, 12]], [1, 3, 12, 0, 0]),
      tc([[0]], [0]),
      tc([[0, 0]], [0, 0], { hidden: true }),
      tc([[1, 0]], [1, 0], { hidden: true }),
    ],
    hints: ["Two pointers: one scans, one tracks the position for the next non-zero element."],
  },
  {
    id: "single-number", number: 9, title: "Single Number", difficulty: "EASY" as D,
    topics: ["Arrays", "Bit Manipulation"],
    description: "Given a **non-empty** array of integers `nums`, every element appears twice except for one. Find that single one.\n\nYou must implement a solution with linear runtime complexity and constant extra space.",
    examples: [
      { input: "nums = [2,2,1]", output: "1" },
      { input: "nums = [4,1,2,1,2]", output: "4" },
    ],
    constraints: ["1 <= nums.length <= 3 * 10^4", "-3 * 10^4 <= nums[i] <= 3 * 10^4"],
    functionName: "singleNumber",
    starterCode: starter(
      "@param {number[]} nums\n * @return {number}",
      "singleNumber", "nums", "nums: number[]", "number",
    ),
    testCases: [
      tc([[2, 2, 1]], 1),
      tc([[4, 1, 2, 1, 2]], 4),
      tc([[1]], 1, { hidden: true }),
    ],
    hints: ["XOR has these properties: a ^ a = 0 and a ^ 0 = a. XOR everything together."],
  },
  {
    id: "plus-one", number: 10, title: "Plus One", difficulty: "EASY" as D,
    topics: ["Arrays", "Math"],
    description: "You are given a **large integer** represented as an integer array `digits`, where each `digits[i]` is the `i-th` digit. The digits are ordered from most significant to least significant.\n\nIncrement the large integer by one and return the resulting array of digits.",
    examples: [
      { input: "digits = [1,2,3]", output: "[1,2,4]" },
      { input: "digits = [9,9,9]", output: "[1,0,0,0]" },
    ],
    constraints: ["1 <= digits.length <= 100", "0 <= digits[i] <= 9", "The leading digit is not 0 (except the number 0 itself)."],
    functionName: "plusOne",
    starterCode: starter(
      "@param {number[]} digits\n * @return {number[]}",
      "plusOne", "digits", "digits: number[]", "number[]",
    ),
    testCases: [
      tc([[1, 2, 3]], [1, 2, 4]),
      tc([[9, 9, 9]], [1, 0, 0, 0]),
      tc([[4, 3, 2, 1]], [4, 3, 2, 2], { hidden: true }),
      tc([[9]], [1, 0], { hidden: true }),
    ],
    hints: ["Walk from the least significant digit. A 9 becomes 0 and carries; if you exhaust all digits, prepend a 1."],
  },
  {
    id: "remove-duplicates-sorted", number: 11, title: "Remove Duplicates from Sorted Array", difficulty: "EASY" as D,
    topics: ["Arrays", "Two Pointers"],
    description: "Given an integer array `nums` sorted in **non-decreasing order**, remove the duplicates so each unique element appears only once. Return the array of unique values, maintaining their relative order.",
    examples: [
      { input: "nums = [1,1,2]", output: "[1,2]" },
      { input: "nums = [0,0,1,1,1,2,2,3,3,4]", output: "[0,1,2,3,4]" },
    ],
    constraints: ["1 <= nums.length <= 3 * 10^4", "nums is sorted in non-decreasing order."],
    functionName: "removeDuplicates",
    starterCode: starter(
      "@param {number[]} nums\n * @return {number[]}",
      "removeDuplicates", "nums", "nums: number[]", "number[]",
    ),
    testCases: [
      tc([[1, 1, 2]], [1, 2]),
      tc([[0, 0, 1, 1, 1, 2, 2, 3, 3, 4]], [0, 1, 2, 3, 4]),
      tc([[1]], [1], { hidden: true }),
      tc([[1, 1, 1]], [1], { hidden: true }),
    ],
    hints: ["Two pointers: a slow one tracks the last unique element, a fast one scans ahead."],
  },
  {
    id: "length-last-word", number: 12, title: "Length of Last Word", difficulty: "EASY" as D,
    topics: ["Strings"],
    description: "Given a string `s` consisting of words and spaces, return the length of the **last** word in the string.\n\nA **word** is a maximal substring consisting of non-space characters only.",
    examples: [
      { input: 's = "Hello World"', output: "5", explanation: 'The last word is "World" with length 5.' },
      { input: 's = "   fly me   to   the moon  "', output: "4", explanation: 'The last word is "moon" with length 4.' },
    ],
    constraints: ["1 <= s.length <= 10^4", "s consists of only English letters and spaces.", "There is at least one word in s."],
    functionName: "lengthOfLastWord",
    starterCode: starter(
      "@param {string} s\n * @return {number}",
      "lengthOfLastWord", "s", "s: string", "number",
    ),
    testCases: [
      tc(["Hello World"], 5),
      tc(["   fly me   to   the moon  "], 4),
      tc(["luffy is still joke"], 4, { hidden: true }),
      tc(["a"], 1, { hidden: true }),
    ],
    hints: ["Trim trailing spaces, then find the last space (or the start of the string)."],
  },
  {
    id: "roman-to-integer", number: 13, title: "Roman to Integer", difficulty: "EASY" as D,
    topics: ["Strings", "Hash Table"],
    description: "Given a roman numeral, convert it to an integer.\n\nRoman numerals are usually written largest to smallest from left to right, but six combinations use subtraction:\n\n- `I` before `V` (5) or `X` (10) → 4, 9\n- `X` before `L` (50) or `C` (100) → 40, 90\n- `C` before `D` (500) or `M` (1000) → 400, 900",
    examples: [
      { input: 's = "III"', output: "3" },
      { input: 's = "MCMXCIV"', output: "1994", explanation: "M = 1000, CM = 900, XC = 90 and IV = 4." },
    ],
    constraints: ["1 <= s.length <= 15", "s contains only the characters 'I', 'V', 'X', 'L', 'C', 'D', 'M'."],
    functionName: "romanToInt",
    starterCode: starter(
      "@param {string} s\n * @return {number}",
      "romanToInt", "s", "s: string", "number",
    ),
    testCases: [
      tc(["III"], 3),
      tc(["LVIII"], 58),
      tc(["MCMXCIV"], 1994, { hidden: true }),
      tc(["IX"], 9, { hidden: true }),
    ],
    hints: ["If the current value is less than the next value, subtract it; otherwise add it."],
  },
  {
    id: "longest-common-prefix", number: 14, title: "Longest Common Prefix", difficulty: "EASY" as D,
    topics: ["Strings"],
    description: "Write a function to find the longest common prefix string amongst an array of strings.\n\nIf there is no common prefix, return an empty string `\"\"`.",
    examples: [
      { input: 'strs = ["flower","flow","flight"]', output: '"fl"' },
      { input: 'strs = ["dog","racecar","car"]', output: '""', explanation: "There is no common prefix among the input strings." },
    ],
    constraints: ["1 <= strs.length <= 200", "0 <= strs[i].length <= 200"],
    functionName: "longestCommonPrefix",
    starterCode: starter(
      "@param {string[]} strs\n * @return {string}",
      "longestCommonPrefix", "strs", "strs: string[]", "string",
    ),
    testCases: [
      tc([["flower", "flow", "flight"]], "fl"),
      tc([["dog", "racecar", "car"]], ""),
      tc([["ab", "a"]], "a", { hidden: true }),
      tc([["abc"]], "abc", { hidden: true }),
    ],
    hints: ["Compare characters column by column, or reduce by pairwise common prefix."],
  },
  {
    id: "majority-element", number: 15, title: "Majority Element", difficulty: "EASY" as D,
    topics: ["Arrays", "Hash Table"],
    description: "Given an array `nums` of size `n`, return the **majority element**.\n\nThe majority element is the element that appears more than `n / 2` times. You may assume that the majority element always exists in the array.",
    examples: [
      { input: "nums = [3,2,3]", output: "3" },
      { input: "nums = [2,2,1,1,1,2,2]", output: "2" },
    ],
    constraints: ["1 <= nums.length <= 5 * 10^4", "-10^9 <= nums[i] <= 10^9"],
    functionName: "majorityElement",
    starterCode: starter(
      "@param {number[]} nums\n * @return {number}",
      "majorityElement", "nums", "nums: number[]", "number",
    ),
    testCases: [
      tc([[3, 2, 3]], 3),
      tc([[2, 2, 1, 1, 1, 2, 2]], 2),
      tc([[1]], 1, { hidden: true }),
      tc([[6, 5, 5]], 5, { hidden: true }),
    ],
    hints: [
      "A hash map counting occurrences is straightforward — O(n) time, O(n) space.",
      "Boyer-Moore voting algorithm does it in O(n) time and O(1) space.",
    ],
  },
  {
    id: "merge-sorted-array", number: 16, title: "Merge Sorted Array", difficulty: "EASY" as D,
    topics: ["Arrays", "Two Pointers", "Sorting"],
    description: "You are given two integer arrays `nums1` and `nums2`, sorted in **non-decreasing order**. Merge them into a single array sorted in non-decreasing order and return it.",
    examples: [
      { input: "nums1 = [1,2,3], nums2 = [2,5,6]", output: "[1,2,2,3,5,6]" },
      { input: "nums1 = [], nums2 = [1]", output: "[1]" },
    ],
    constraints: ["0 <= nums1.length, nums2.length <= 200", "Both arrays are sorted in non-decreasing order."],
    functionName: "mergeSorted",
    starterCode: starter(
      "@param {number[]} nums1\n * @param {number[]} nums2\n * @return {number[]}",
      "mergeSorted", "nums1, nums2", "nums1: number[], nums2: number[]", "number[]",
    ),
    testCases: [
      tc([[1, 2, 3], [2, 5, 6]], [1, 2, 2, 3, 5, 6]),
      tc([[], [1]], [1]),
      tc([[1], []], [1], { hidden: true }),
      tc([[-3, -1], [-2, 4]], [-3, -2, -1, 4], { hidden: true }),
    ],
    hints: ["Two pointers, one per array — always take the smaller front element."],
  },
  {
    id: "max-subarray", number: 17, title: "Maximum Subarray", difficulty: "MEDIUM" as D,
    topics: ["Arrays", "Dynamic Programming"],
    description: "Given an integer array `nums`, find the **subarray** with the largest sum, and return its sum.\n\nA subarray is a contiguous non-empty sequence of elements within the array.",
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "The subarray [4,-1,2,1] has the largest sum = 6." },
      { input: "nums = [1]", output: "1" },
    ],
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    functionName: "maxSubArray",
    starterCode: starter(
      "@param {number[]} nums\n * @return {number}",
      "maxSubArray", "nums", "nums: number[]", "number",
    ),
    testCases: [
      tc([[-2, 1, -3, 4, -1, 2, 1, -5, 4]], 6),
      tc([[1]], 1),
      tc([[5, 4, -1, 7, 8]], 23, { hidden: true }),
      tc([[-1]], -1, { hidden: true }),
    ],
    hints: [
      "Kadane's algorithm: track the best sum ending at the current index.",
      "At each step, either extend the previous subarray or start fresh with the current element.",
    ],
  },
  {
    id: "product-except-self", number: 18, title: "Product of Array Except Self", difficulty: "MEDIUM" as D,
    topics: ["Arrays", "Prefix Sum"],
    description: "Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]`.\n\nThe product of any prefix or suffix of `nums` is guaranteed to fit in a 32-bit integer.\n\nYou must write an algorithm that runs in `O(n)` time and **without using the division operation**.",
    examples: [
      { input: "nums = [1,2,3,4]", output: "[24,12,8,6]" },
      { input: "nums = [-1,1,0,-3,3]", output: "[0,0,9,0,0]" },
    ],
    constraints: ["2 <= nums.length <= 10^5", "-30 <= nums[i] <= 30", "The product is guaranteed to fit in a 32-bit integer."],
    functionName: "productExceptSelf",
    starterCode: starter(
      "@param {number[]} nums\n * @return {number[]}",
      "productExceptSelf", "nums", "nums: number[]", "number[]",
    ),
    testCases: [
      tc([[1, 2, 3, 4]], [24, 12, 8, 6]),
      tc([[-1, 1, 0, -3, 3]], [0, 0, 9, 0, 0]),
      tc([[2, 3]], [3, 2], { hidden: true }),
    ],
    hints: [
      "Build a prefix-product array, then walk backwards accumulating a suffix product.",
      "answer[i] = prefix[i] * suffix[i], where suffix is computed on the fly.",
    ],
  },
  {
    id: "three-sum", number: 19, title: "3Sum", difficulty: "MEDIUM" as D,
    topics: ["Arrays", "Two Pointers", "Sorting"],
    description: "Given an integer array `nums`, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] == 0`.\n\nNotice that the solution set must not contain duplicate triplets.\n\nEach triplet may be returned in any internal order, and the list of triplets in any order.",
    examples: [
      { input: "nums = [-1,0,1,2,-1,-4]", output: "[[-1,-1,2],[-1,0,1]]" },
      { input: "nums = [0,1,1]", output: "[]" },
    ],
    constraints: ["3 <= nums.length <= 500", "-10^5 <= nums[i] <= 10^5"],
    functionName: "threeSum",
    starterCode: starter(
      "@param {number[]} nums\n * @return {number[][]}",
      "threeSum", "nums", "nums: number[]", "number[][]",
    ),
    testCases: [
      tc([[-1, 0, 1, 2, -1, -4]], [[-1, -1, 2], [-1, 0, 1]], { unordered: true }),
      tc([[0, 1, 1]], [], { unordered: true }),
      tc([[0, 0, 0]], [[0, 0, 0]], { unordered: true, hidden: true }),
      tc([[1, -1, -1, 0]], [[-1, 0, 1]], { unordered: true, hidden: true }),
    ],
    hints: [
      "Sort the array first.",
      "Fix one element, then use two pointers on the remaining range to find pairs that sum to its negation.",
      "Skip duplicates to avoid repeated triplets.",
    ],
  },
  {
    id: "longest-substring-no-repeat", number: 20, title: "Longest Substring Without Repeating Characters", difficulty: "MEDIUM" as D,
    topics: ["Strings", "Sliding Window", "Hash Table"],
    description: "Given a string `s`, find the length of the **longest substring** without repeating characters.",
    examples: [
      { input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: "1", explanation: 'The answer is "b", with the length of 1.' },
      { input: 's = "pwwkew"', output: "3", explanation: 'The answer is "wke", with the length of 3.' },
    ],
    constraints: ["0 <= s.length <= 5 * 10^4", "s consists of English letters, digits, symbols and spaces."],
    functionName: "lengthOfLongestSubstring",
    starterCode: starter(
      "@param {string} s\n * @return {number}",
      "lengthOfLongestSubstring", "s", "s: string", "number",
    ),
    testCases: [
      tc(["abcabcbb"], 3),
      tc(["bbbbb"], 1),
      tc(["pwwkew"], 3, { hidden: true }),
      tc([""], 0, { hidden: true }),
      tc(["dvdf"], 3, { hidden: true }),
    ],
    hints: [
      "Sliding window: expand the right edge, and when a duplicate appears, move the left edge past the previous occurrence.",
      "A map from character → last index makes the left-edge jump O(1).",
    ],
  },
  {
    id: "valid-parentheses", number: 21, title: "Valid Parentheses", difficulty: "EASY" as D,
    topics: ["Strings", "Stack"],
    description: "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if:\n\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    examples: [
      { input: 's = "()"', output: "true" },
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" },
    ],
    constraints: ["1 <= s.length <= 10^4", "s consists of parentheses only '()[]{}'."],
    functionName: "isValid",
    starterCode: starter(
      "@param {string} s\n * @return {boolean}",
      "isValid", "s", "s: string", "boolean",
    ),
    testCases: [
      tc(["()"], true),
      tc(["()[]{}"], true),
      tc(["(]"], false),
      tc(["([)]"], false, { hidden: true }),
      tc(["{[]}"], true, { hidden: true }),
      tc(["("], false, { hidden: true }),
    ],
    hints: ["Use a stack. Push open brackets; on a close bracket, pop and verify it matches."],
  },
  {
    id: "binary-search", number: 22, title: "Binary Search", difficulty: "EASY" as D,
    topics: ["Arrays", "Binary Search"],
    description: "Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`.\n\nIf `target` exists, return its index. Otherwise, return `-1`.\n\nYou must write an algorithm with `O(log n)` runtime complexity.",
    examples: [
      { input: "nums = [-1,0,3,5,9,12], target = 9", output: "4" },
      { input: "nums = [-1,0,3,5,9,12], target = 2", output: "-1" },
    ],
    constraints: ["1 <= nums.length <= 10^4", "nums is sorted in ascending order.", "All values are unique."],
    functionName: "search",
    starterCode: starter(
      "@param {number[]} nums\n * @param {number} target\n * @return {number}",
      "search", "nums, target", "nums: number[], target: number", "number",
    ),
    testCases: [
      tc([[-1, 0, 3, 5, 9, 12], 9], 4),
      tc([[-1, 0, 3, 5, 9, 12], 2], -1),
      tc([[5], 5], 0, { hidden: true }),
      tc([[1, 2, 3, 4, 5], 1], 0, { hidden: true }),
    ],
    hints: ["Maintain `low` and `high`; compute the midpoint and halve the range each step."],
  },
  {
    id: "climb-stairs", number: 23, title: "Climbing Stairs", difficulty: "EASY" as D,
    topics: ["Dynamic Programming", "Math"],
    description: "You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb `1` or `2` steps. In how many distinct ways can you climb to the top?",
    examples: [
      { input: "n = 2", output: "2", explanation: "1. 1 step + 1 step  2. 2 steps" },
      { input: "n = 3", output: "3", explanation: "1. 1+1+1  2. 1+2  3. 2+1" },
    ],
    constraints: ["1 <= n <= 45"],
    functionName: "climbStairs",
    starterCode: starter(
      "@param {number} n\n * @return {number}",
      "climbStairs", "n", "n: number", "number",
    ),
    testCases: [
      tc([2], 2),
      tc([3], 3),
      tc([1], 1, { hidden: true }),
      tc([10], 89, { hidden: true }),
    ],
    hints: ["This is the Fibonacci sequence: ways(n) = ways(n-1) + ways(n-2).", "You only need the last two values, not the whole array."],
  },
  {
    id: "merge-intervals", number: 24, title: "Merge Intervals", difficulty: "MEDIUM" as D,
    topics: ["Arrays", "Sorting"],
    description: "Given an array of `intervals` where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the input intervals.",
    examples: [
      { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]", explanation: "Since intervals [1,3] and [2,6] overlap, merge them into [1,6]." },
      { input: "intervals = [[1,4],[4,5]]", output: "[[1,5]]", explanation: "Intervals [1,4] and [4,5] are considered overlapping." },
    ],
    constraints: ["1 <= intervals.length <= 10^4", "intervals[i].length == 2", "0 <= start_i <= end_i <= 10^4"],
    functionName: "merge",
    starterCode: starter(
      "@param {number[][]} intervals\n * @return {number[][]}",
      "merge", "intervals", "intervals: number[][]", "number[][]",
    ),
    testCases: [
      tc([[[1, 3], [2, 6], [8, 10], [15, 18]]], [[1, 6], [8, 10], [15, 18]]),
      tc([[[1, 4], [4, 5]]], [[1, 5]]),
      tc([[[1, 4]]], [[1, 4]], { hidden: true }),
      tc([[[1, 4], [0, 4]]], [[0, 4]], { hidden: true }),
    ],
    hints: ["Sort intervals by start time.", "Walk through and merge whenever the next start is <= the current end."],
  },
  {
    id: "group-anagrams", number: 25, title: "Group Anagrams", difficulty: "MEDIUM" as D,
    topics: ["Strings", "Hash Table", "Sorting"],
    description: "Given an array of strings `strs`, group the anagrams together. You can return the answer in **any order**.\n\nAn anagram is a word formed by rearranging the letters of another word, using all the original letters exactly once.",
    examples: [
      { input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]' },
      { input: 'strs = [""]', output: '[[""]]' },
    ],
    constraints: ["1 <= strs.length <= 10^4", "0 <= strs[i].length <= 100", "strs[i] consists of lowercase English letters."],
    functionName: "groupAnagrams",
    starterCode: starter(
      "@param {string[]} strs\n * @return {string[][]}",
      "groupAnagrams", "strs", "strs: string[]", "string[][]",
    ),
    testCases: [
      tc([["eat", "tea", "tan", "ate", "nat", "bat"]], [["bat"], ["nat", "tan"], ["ate", "eat", "tea"]], { unordered: true }),
      tc([[""]], [[""]], { unordered: true }),
      tc([["a"]], [["a"]], { unordered: true, hidden: true }),
    ],
    hints: [
      "Two anagrams share the same sorted character sequence — use that as a map key.",
      "Alternatively, a 26-slot frequency count works as a key without sorting.",
    ],
  },
  {
    id: "coin-change", number: 26, title: "Coin Change", difficulty: "MEDIUM" as D,
    topics: ["Dynamic Programming", "Breadth-First Search"],
    description: "You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\nReturn the **fewest number of coins** needed to make up that amount. If that amount cannot be made up by any combination of the coins, return `-1`.\n\nYou may assume that you have an infinite number of each kind of coin.",
    examples: [
      { input: "coins = [1,2,5], amount = 11", output: "3", explanation: "11 = 5 + 5 + 1" },
      { input: "coins = [2], amount = 3", output: "-1" },
    ],
    constraints: ["1 <= coins.length <= 12", "1 <= coins[i] <= 2^31 - 1", "0 <= amount <= 10^4"],
    functionName: "coinChange",
    starterCode: starter(
      "@param {number[]} coins\n * @param {number} amount\n * @return {number}",
      "coinChange", "coins, amount", "coins: number[], amount: number", "number",
    ),
    testCases: [
      tc([[1, 2, 5], 11], 3),
      tc([[2], 3], -1),
      tc([[1], 0], 0, { hidden: true }),
      tc([[2, 5, 10, 1], 27], 4, { hidden: true }),
    ],
    hints: [
      "Bottom-up DP: dp[i] = fewest coins to make amount i, starting from dp[0] = 0.",
      "For each amount, try every coin: dp[i] = min(dp[i], dp[i - coin] + 1).",
    ],
  },
  {
    id: "longest-palindromic-substring", number: 27, title: "Longest Palindromic Substring", difficulty: "MEDIUM" as D,
    topics: ["Strings", "Dynamic Programming"],
    description: "Given a string `s`, return the **longest palindromic substring** in `s`.\n\nIf there are multiple, returning any one of them is accepted — but the tests here expect the leftmost longest one, which the expand-around-centre approach produces.",
    examples: [
      { input: 's = "babad"', output: '"bab"', explanation: '"aba" is also a valid answer.' },
      { input: 's = "cbbd"', output: '"bb"' },
    ],
    constraints: ["1 <= s.length <= 1000", "s consists of digits and English letters."],
    functionName: "longestPalindrome",
    starterCode: starter(
      "@param {string} s\n * @return {string}",
      "longestPalindrome", "s", "s: string", "string",
    ),
    testCases: [
      tc(["bb"], "bb"),
      tc(["cbbd"], "bb"),
      tc(["a"], "a", { hidden: true }),
      tc(["ac"], "a", { hidden: true }),
    ],
    hints: [
      "Expand around each possible centre (a character, or between two characters) and keep the longest.",
      "There are 2n-1 centres and each expansion is O(n), giving O(n²) overall.",
    ],
  },
  {
    id: "trap-rain-water", number: 28, title: "Trapping Rain Water", difficulty: "HARD" as D,
    topics: ["Arrays", "Two Pointers", "Stack"],
    description: "Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.",
    examples: [
      { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6", explanation: "The elevation map traps 6 units of rain water." },
      { input: "height = [4,2,0,3,2,5]", output: "9" },
    ],
    constraints: ["n == height.length", "1 <= n <= 2 * 10^4", "0 <= height[i] <= 10^5"],
    functionName: "trap",
    starterCode: starter(
      "@param {number[]} height\n * @return {number}",
      "trap", "height", "height: number[]", "number",
    ),
    testCases: [
      tc([[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], 6),
      tc([[4, 2, 0, 3, 2, 5]], 9),
      tc([[4, 2, 3]], 1, { hidden: true }),
      tc([[1, 2, 3]], 0, { hidden: true }),
    ],
    hints: [
      "Water above each bar = min(maxLeft, maxRight) - height[i].",
      "Two pointers let you compute maxLeft/maxRight on the fly in O(1) space.",
    ],
  },
  {
    id: "spiral-matrix", number: 29, title: "Spiral Matrix", difficulty: "MEDIUM" as D,
    topics: ["Arrays", "Matrix", "Simulation"],
    description: "Given an `m x n` matrix, return all elements of the matrix in **spiral order** — starting at the top-left, going right along the top row, down the right column, left along the bottom row, and up the left column, spiralling inward.",
    examples: [
      { input: "matrix = [[1,2,3],[4,5,6],[7,8,9]]", output: "[1,2,3,6,9,8,7,4,5]" },
      { input: "matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]", output: "[1,2,3,4,8,12,11,10,9,5,6,7]" },
    ],
    constraints: ["m == matrix.length", "n == matrix[i].length", "1 <= m, n <= 10", "-100 <= matrix[i][j] <= 100"],
    functionName: "spiralOrder",
    starterCode: starter(
      "@param {number[][]} matrix\n * @return {number[]}",
      "spiralOrder", "matrix", "matrix: number[][]", "number[]",
    ),
    testCases: [
      tc([[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], [1, 2, 3, 6, 9, 8, 7, 4, 5]),
      tc([[[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]], [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]),
      tc([[[1]]], [1], { hidden: true }),
      tc([[[1, 2], [3, 4]]], [1, 2, 4, 3], { hidden: true }),
    ],
    hints: [
      "Track four boundaries: top, bottom, left, right.",
      "After traversing a side, shrink that boundary and stop when they cross.",
    ],
  },
  {
    id: "median-two-sorted-arrays", number: 30, title: "Median of Two Sorted Arrays", difficulty: "HARD" as D,
    topics: ["Arrays", "Binary Search", "Divide and Conquer"],
    description: "Given two sorted arrays `nums1` and `nums2` of size `m` and `n` respectively, return the **median** of the two sorted arrays.\n\nThe overall run time complexity should be `O(log (m+n))`.\n\nThe tests accept a result within `1e-5` of the expected value.",
    examples: [
      { input: "nums1 = [1,3], nums2 = [2]", output: "2.00000", explanation: "Merged array = [1,2,3], median = 2." },
      { input: "nums1 = [1,2], nums2 = [3,4]", output: "2.50000", explanation: "Merged array = [1,2,3,4], median = (2 + 3) / 2." },
    ],
    constraints: ["nums1.length == m, nums2.length == n", "0 <= m, n <= 1000", "1 <= m + n <= 2000"],
    functionName: "findMedianSortedArrays",
    starterCode: starter(
      "@param {number[]} nums1\n * @param {number[]} nums2\n * @return {number}",
      "findMedianSortedArrays", "nums1, nums2", "nums1: number[], nums2: number[]", "number",
    ),
    testCases: [
      tc([[1, 3], [2]], 2),
      tc([[1, 2], [3, 4]], 2.5),
      tc([[], [1]], 1, { hidden: true }),
      tc([[1, 2, 3, 4], [5, 6, 7, 8]], 4.5, { hidden: true }),
    ],
    hints: [
      "The expected complexity suggests a binary search, not a merge.",
      "Binary-search the partition point in the smaller array so the left half of the combined data is always the same length.",
    ],
  },

  /* =========================================================== 31 – 35 */
  {
    id: "sqrt-x", number: 31, title: "Sqrt(x)", difficulty: "EASY" as D,
    topics: ["Math", "Binary Search"],
    description:
      "Given a non-negative integer `x`, return the **square root** of `x` rounded down to the nearest integer.\n\nYou may not use any built-in exponent or square-root function.",
    examples: [
      { input: "x = 4", output: "2" },
      { input: "x = 8", output: "2", explanation: "sqrt(8) = 2.828…, truncated to 2." },
    ],
    constraints: ["0 <= x <= 2^31 - 1"],
    functionName: "mySqrt",
    starterCode: starter(
      "@param {number} x\n * @return {number}",
      "mySqrt", "x", "x: number", "number",
    ),
    testCases: [
      tc([4], 2),
      tc([8], 2),
      tc([0], 0, { hidden: true }),
      tc([1], 1, { hidden: true }),
      tc([10000], 100, { hidden: true }),
    ],
    hints: [
      "Binary-search the answer between `0` and `x` instead of testing every integer.",
      "Keep `lo` on the last square below `x` so the loop ends on the floor.",
    ],
  },
  {
    id: "excel-sheet-column-number", number: 32, title: "Excel Sheet Column Number", difficulty: "EASY" as D,
    topics: ["Math", "Strings"],
    description:
      "Excel column titles are a base-26 system: `A` = 1, `B` = 2, … `Z` = 26, `AA` = 27.\n\nGiven a column title `s`, return its column number.",
    examples: [
      { input: 's = "A"', output: "1" },
      { input: 's = "AB"', output: "28", explanation: "1 * 26 + 2" },
    ],
    constraints: ["1 <= s.length <= 7", "`s` consists of uppercase English letters only."],
    functionName: "titleToNumber",
    starterCode: starter(
      "@param {string} s\n * @return {number}",
      "titleToNumber", "s", "s: string", "number",
    ),
    testCases: [
      tc(["A"], 1),
      tc(["AB"], 28),
      tc(["ZY"], 701, { hidden: true }),
      tc(["AAA"], 703, { hidden: true }),
    ],
    hints: [
      "Walk the title left to right, multiplying the running total by 26 at each step.",
      "`charCodeAt(i) - 64` turns a letter into its 1-based position.",
    ],
  },
  {
    id: "isomorphic-strings", number: 33, title: "Isomorphic Strings", difficulty: "EASY" as D,
    topics: ["Strings", "Hash Table"],
    description:
      "Two strings are **isomorphic** when the characters of `s` can be replaced one-to-one to get `t`.\n\nNo two characters may map to the same character, and a character may map to itself.",
    examples: [
      { input: 's = "egg", t = "add"', output: "true", explanation: "e → a and g → d." },
      { input: 's = "foo", t = "bar"', output: "false" },
    ],
    constraints: ["1 <= s.length <= 5 * 10^4", "s.length === t.length"],
    functionName: "isIsomorphic",
    starterCode: starter(
      "@param {string} s\n * @param {string} t\n * @return {boolean}",
      "isIsomorphic", "s, t", "s: string, t: string", "boolean",
    ),
    testCases: [
      tc(["egg", "add"], true),
      tc(["foo", "bar"], false),
      tc(["paper", "title"], true, { hidden: true }),
      tc(["badc", "baba"], false, { hidden: true }),
    ],
    hints: [
      "Keep two maps — `s → t` and `t → s` — and check both on every character.",
      "One direction alone is not enough: that is why `badc` / `baba` fails.",
    ],
  },
  {
    id: "ransom-note", number: 34, title: "Ransom Note", difficulty: "EASY" as D,
    topics: ["Strings", "Hash Table"],
    description:
      "Return `true` if `ransomNote` can be built from the letters of `magazine`.\n\nEach letter in `magazine` may be used at most once.",
    examples: [
      { input: 'ransomNote = "a", magazine = "b"', output: "false" },
      { input: 'ransomNote = "aa", magazine = "ab"', output: "false", explanation: "Only one `a` is available." },
    ],
    constraints: ["1 <= ransomNote.length, magazine.length <= 10^5", "Both strings are lowercase English letters."],
    functionName: "canConstruct",
    starterCode: starter(
      "@param {string} ransomNote\n * @param {string} magazine\n * @return {boolean}",
      "canConstruct", "ransomNote, magazine", "ransomNote: string, magazine: string", "boolean",
    ),
    testCases: [
      tc(["a", "b"], false),
      tc(["aa", "ab"], false),
      tc(["aa", "aab"], true, { hidden: true }),
      tc(["aab", "baa"], true, { hidden: true }),
    ],
    hints: [
      "Count the letters of `magazine` once, then spend them on `ransomNote`.",
      "A letter budget that goes negative means the answer is `false`.",
    ],
  },
  {
    id: "word-pattern", number: 35, title: "Word Pattern", difficulty: "EASY" as D,
    topics: ["Strings", "Hash Table"],
    description:
      "Given a `pattern` and a string `s`, return `true` when `s` follows the same pattern.\n\nThere must be a **bijection** between a letter in `pattern` and a non-empty word in `s`.",
    examples: [
      { input: 'pattern = "abba", s = "dog cat cat dog"', output: "true" },
      { input: 'pattern = "abba", s = "dog cat cat fish"', output: "false" },
    ],
    constraints: ["1 <= pattern.length <= 300", "1 <= s.length <= 3000", "Words in `s` are separated by single spaces."],
    functionName: "wordPattern",
    starterCode: starter(
      "@param {string} pattern\n * @param {string} s\n * @return {boolean}",
      "wordPattern", "pattern, s", "pattern: string, s: string", "boolean",
    ),
    testCases: [
      tc(["abba", "dog cat cat dog"], true),
      tc(["abba", "dog cat cat fish"], false),
      tc(["aaaa", "dog cat cat dog"], false, { hidden: true }),
      tc(["abc", "b c a"], true, { hidden: true }),
    ],
    hints: [
      "Split `s` on spaces and compare the lengths before anything else.",
      "Two maps (letter → word and word → letter) catch both duplicate letters and duplicate words.",
    ],
  },

  /* =========================================================== 36 – 40 */
  {
    id: "first-unique-character-in-a-string", number: 36, title: "First Unique Character in a String", difficulty: "EASY" as D,
    topics: ["Strings", "Hash Table"],
    description:
      "Find the **first non-repeating character** in `s` and return its index.\n\nIf every character repeats, return `-1`.",
    examples: [
      { input: 's = "leetcode"', output: "0", explanation: "`l` is the first character that appears once." },
      { input: 's = "loveleetcode"', output: "2" },
    ],
    constraints: ["1 <= s.length <= 10^5", "`s` consists of lowercase English letters."],
    functionName: "firstUniqChar",
    starterCode: starter(
      "@param {string} s\n * @return {number}",
      "firstUniqChar", "s", "s: string", "number",
    ),
    testCases: [
      tc(["leetcode"], 0),
      tc(["loveleetcode"], 2),
      tc(["aabb"], -1, { hidden: true }),
      tc(["z"], 0, { hidden: true }),
    ],
    hints: [
      "Count every character first, then scan again for the first count of one.",
      "Two passes keep the answer at O(n) instead of O(n²).",
    ],
  },
  {
    id: "intersection-of-two-arrays", number: 37, title: "Intersection of Two Arrays", difficulty: "EASY" as D,
    topics: ["Arrays", "Hash Table"],
    description:
      "Given two integer arrays, return their **intersection**.\n\nEvery element in the result must be unique; the order does not matter.",
    examples: [
      { input: "nums1 = [1,2,2,1], nums2 = [2,2]", output: "[2]" },
      { input: "nums1 = [4,9,5], nums2 = [9,4,9,8,4]", output: "[4,9]" },
    ],
    constraints: ["1 <= nums1.length, nums2.length <= 1000", "0 <= nums1[i], nums2[i] <= 1000"],
    functionName: "intersection",
    starterCode: starter(
      "@param {number[]} nums1\n * @param {number[]} nums2\n * @return {number[]}",
      "intersection", "nums1, nums2", "nums1: number[], nums2: number[]", "number[]",
    ),
    testCases: [
      tc([[1, 2, 2, 1], [2, 2]], [2]),
      tc([[4, 9, 5], [9, 4, 9, 8, 4]], [4, 9], { unordered: true }),
      tc([[1, 2], [1, 2]], [1, 2], { hidden: true, unordered: true }),
      tc([[3, 3], [3]], [3], { hidden: true }),
    ],
    hints: [
      "Put one array into a `Set` and filter the other against it.",
      "The `Set` also gives you the deduplication for free.",
    ],
  },
  {
    id: "missing-number", number: 38, title: "Missing Number", difficulty: "EASY" as D,
    topics: ["Arrays", "Math"],
    description:
      "`nums` contains `n` **distinct** numbers taken from the range `[0, n]`. Return the only number in that range that is missing.",
    examples: [
      { input: "nums = [3,0,1]", output: "2", explanation: "The range is 0…3 and 2 is missing." },
      { input: "nums = [0,1]", output: "2" },
    ],
    constraints: ["n == nums.length", "1 <= n <= 10^4", "All numbers are unique."],
    functionName: "missingNumber",
    starterCode: starter(
      "@param {number[]} nums\n * @return {number}",
      "missingNumber", "nums", "nums: number[]", "number",
    ),
    testCases: [
      tc([[3, 0, 1]], 2),
      tc([[0, 1]], 2),
      tc([[9, 6, 4, 2, 3, 5, 7, 0, 1]], 8, { hidden: true }),
      tc([[0]], 1, { hidden: true }),
    ],
    hints: [
      "The expected sum of `0…n` is `n * (n + 1) / 2`; subtract what you actually see.",
      "XOR-ing the indices with the values gives the same answer without any arithmetic.",
    ],
  },
  {
    id: "add-binary", number: 39, title: "Add Binary", difficulty: "EASY" as D,
    topics: ["Math", "Strings", "Bit Manipulation"],
    description: "Given two binary strings `a` and `b`, return their sum as a binary string.",
    examples: [
      { input: 'a = "11", b = "1"', output: '"100"' },
      { input: 'a = "1010", b = "1011"', output: '"10101"' },
    ],
    constraints: ["1 <= a.length, b.length <= 10^4", "`a` and `b` only contain `0` and `1` characters."],
    functionName: "addBinary",
    starterCode: starter(
      "@param {string} a\n * @param {string} b\n * @return {string}",
      "addBinary", "a, b", "a: string, b: string", "string",
    ),
    testCases: [
      tc(["11", "1"], "100"),
      tc(["1010", "1011"], "10101"),
      tc(["0", "0"], "0", { hidden: true }),
      tc(["1", "111"], "1000", { hidden: true }),
    ],
    hints: [
      "Add from the right-hand end and carry a `1` whenever a column totals two or more.",
      "Collect digits in an array and reverse at the end — concatenating strings in a loop is O(n²).",
    ],
  },
  {
    id: "happy-number", number: 40, title: "Happy Number", difficulty: "EASY" as D,
    topics: ["Math", "Hash Table"],
    description:
      "A number is **happy** when repeatedly replacing it with the sum of the squares of its digits eventually reaches `1`.\n\nA number that loops forever is not happy.",
    examples: [
      { input: "n = 19", output: "true", explanation: "1² + 9² = 82 → 68 → 100 → 1" },
      { input: "n = 2", output: "false" },
    ],
    constraints: ["1 <= n <= 2^31 - 1"],
    functionName: "isHappy",
    starterCode: starter(
      "@param {number} n\n * @return {boolean}",
      "isHappy", "n", "n: number", "boolean",
    ),
    testCases: [
      tc([19], true),
      tc([2], false),
      tc([1], true, { hidden: true }),
      tc([7], true, { hidden: true }),
    ],
    hints: [
      "Remember the numbers you have already seen in a `Set` to detect the cycle.",
      "Every unhappy number eventually lands in the cycle that contains `4`.",
    ],
  },

  /* =========================================================== 41 – 45 */
  {
    id: "power-of-two", number: 41, title: "Power of Two", difficulty: "EASY" as D,
    topics: ["Math", "Bit Manipulation"],
    description: "Given an integer `n`, return `true` if it is a power of two. Otherwise return `false`.",
    examples: [
      { input: "n = 1", output: "true", explanation: "2⁰ = 1" },
      { input: "n = 3", output: "false" },
    ],
    constraints: ["-2^31 <= n <= 2^31 - 1"],
    functionName: "isPowerOfTwo",
    starterCode: starter(
      "@param {number} n\n * @return {boolean}",
      "isPowerOfTwo", "n", "n: number", "boolean",
    ),
    testCases: [
      tc([1], true),
      tc([16], true),
      tc([3], false, { hidden: true }),
      tc([0], false, { hidden: true }),
    ],
    hints: [
      "Keep dividing by two and bail out as soon as the remainder is non-zero.",
      "In binary, a power of two has exactly one `1` bit.",
    ],
  },
  {
    id: "find-the-index-of-the-first-occurrence", number: 42, title: "Find the Index of the First Occurrence", difficulty: "EASY" as D,
    topics: ["Strings", "Two Pointers"],
    description:
      "Given two strings `haystack` and `needle`, return the index of the first occurrence of `needle` in `haystack`, or `-1` when it is not part of it.",
    examples: [
      { input: 'haystack = "sadbutsad", needle = "sad"', output: "0" },
      { input: 'haystack = "leetcode", needle = "leeto"', output: "-1" },
    ],
    constraints: ["1 <= haystack.length, needle.length <= 10^4"],
    functionName: "strStr",
    starterCode: starter(
      "@param {string} haystack\n * @param {string} needle\n * @return {number}",
      "strStr", "haystack, needle", "haystack: string, needle: string", "number",
    ),
    testCases: [
      tc(["sadbutsad", "sad"], 0),
      tc(["leetcode", "leeto"], -1),
      tc(["hello", "ll"], 2, { hidden: true }),
      tc(["a", "a"], 0, { hidden: true }),
    ],
    hints: [
      "Only start a comparison where there is still room left for the whole needle.",
      "Compare manually first, then look at how KMP avoids re-reading characters.",
    ],
  },
  {
    id: "fibonacci-number", number: 43, title: "Fibonacci Number", difficulty: "EASY" as D,
    topics: ["Math", "Dynamic Programming", "Recursion"],
    description:
      "The Fibonacci sequence is defined by `F(0) = 0`, `F(1) = 1` and `F(n) = F(n - 1) + F(n - 2)` for `n > 1`.\n\nGiven `n`, return `F(n)`.",
    examples: [
      { input: "n = 2", output: "1" },
      { input: "n = 4", output: "3", explanation: "0, 1, 1, 2, 3" },
    ],
    constraints: ["0 <= n <= 30"],
    functionName: "fib",
    starterCode: starter(
      "@param {number} n\n * @return {number}",
      "fib", "n", "n: number", "number",
    ),
    testCases: [
      tc([0], 0),
      tc([4], 3),
      tc([10], 55, { hidden: true }),
      tc([20], 6765, { hidden: true }),
    ],
    hints: [
      "The plain recursive definition recomputes the same values exponentially often.",
      "Two variables that roll forward give an O(n) time, O(1) space solution.",
    ],
  },
  {
    id: "count-primes", number: 44, title: "Count Primes", difficulty: "EASY" as D,
    topics: ["Math", "Arrays"],
    description: "Given an integer `n`, return the number of prime numbers **strictly less than** `n`.",
    examples: [
      { input: "n = 10", output: "4", explanation: "2, 3, 5 and 7" },
      { input: "n = 0", output: "0" },
    ],
    constraints: ["0 <= n <= 5 * 10^6"],
    functionName: "countPrimes",
    starterCode: starter(
      "@param {number} n\n * @return {number}",
      "countPrimes", "n", "n: number", "number",
    ),
    testCases: [
      tc([10], 4),
      tc([0], 0),
      tc([1], 0, { hidden: true }),
      tc([100], 25, { hidden: true }),
    ],
    hints: [
      "Sieve of Eratosthenes: mark multiples of each prime you find.",
      "Only sieve up to `Math.sqrt(n)` — larger multiples are already marked.",
    ],
  },
  {
    id: "number-of-1-bits", number: 45, title: "Number of 1 Bits", difficulty: "EASY" as D,
    topics: ["Bit Manipulation"],
    description:
      "Given a non-negative integer `n`, return the number of `1` bits in its binary representation (also known as the Hamming weight).",
    examples: [
      { input: "n = 11", output: "3", explanation: "1011 has three set bits." },
      { input: "n = 128", output: "1" },
    ],
    constraints: ["0 <= n <= 2^31 - 1"],
    functionName: "hammingWeight",
    starterCode: starter(
      "@param {number} n\n * @return {number}",
      "hammingWeight", "n", "n: number", "number",
    ),
    testCases: [
      tc([11], 3),
      tc([128], 1),
      tc([0], 0, { hidden: true }),
      tc([255], 8, { hidden: true }),
    ],
    hints: [
      "Shift the number right one bit at a time and count the odd values.",
      "`n & (n - 1)` clears the lowest set bit — one loop iteration per `1`.",
    ],
  },

  /* =========================================================== 46 – 50 */
  {
    id: "reverse-bits", number: 46, title: "Reverse Bits", difficulty: "EASY" as D,
    topics: ["Bit Manipulation", "Divide and Conquer"],
    description:
      "Reverse the bits of a given 32-bit unsigned integer `n` and return the result.\n\nUse the unsigned 32-bit value in your answer: `reverseBits(1)` is `2147483648`, not `-2147483648`.",
    examples: [
      { input: "n = 43261596", output: "964176192", explanation: "00000010100101000001111010011100 → 00111001011110000010100101000000" },
    ],
    constraints: ["0 <= n <= 2^32 - 1"],
    functionName: "reverseBits",
    starterCode: starter(
      "@param {number} n\n * @return {number}",
      "reverseBits", "n", "n: number", "number",
    ),
    testCases: [
      tc([43261596], 964176192),
      tc([0], 0, { hidden: true }),
      tc([1], 2147483648, { hidden: true }),
      tc([3], 3221225472, { hidden: true }),
    ],
    hints: [
      "Take the lowest bit of the input and push it onto the result, 32 times.",
      "Use `>>> 0` in JavaScript so the result stays an unsigned 32-bit value.",
    ],
  },
  {
    id: "remove-element", number: 47, title: "Remove Element", difficulty: "EASY" as D,
    topics: ["Arrays", "Two Pointers"],
    description:
      "Given an array `nums` and a value `val`, return a new array with every occurrence of `val` removed.\n\nThe relative order of the remaining elements must be kept.",
    examples: [
      { input: "nums = [3,2,2,3], val = 3", output: "[2,2]" },
      { input: "nums = [0,1,2,2,3,0,4,2], val = 2", output: "[0,1,3,0,4]" },
    ],
    constraints: ["0 <= nums.length <= 100", "0 <= nums[i], val <= 50"],
    functionName: "removeElement",
    starterCode: starter(
      "@param {number[]} nums\n * @param {number} val\n * @return {number[]}",
      "removeElement", "nums, val", "nums: number[], val: number", "number[]",
    ),
    testCases: [
      tc([[3, 2, 2, 3], 3], [2, 2]),
      tc([[0, 1, 2, 2, 3, 0, 4, 2], 2], [0, 1, 3, 0, 4]),
      tc([[1], 1], [], { hidden: true }),
      tc([[2, 2, 2], 2], [], { hidden: true }),
    ],
    hints: [
      "`filter` keeps the order for free; the interesting version writes back into the same array.",
      "A slow write pointer plus a fast read pointer does it in one pass.",
    ],
  },
  {
    id: "kids-with-the-greatest-number-of-candies", number: 48, title: "Kids With the Greatest Number of Candies", difficulty: "EASY" as D,
    topics: ["Arrays"],
    description:
      "`candies[i]` is how many candies child `i` has. After giving `extraCandies` to one child, return a boolean array where `result[i]` says whether that child then has the **most** candies.",
    examples: [
      { input: "candies = [2,3,5,1,3], extraCandies = 3", output: "[true,true,true,false,true]" },
      { input: "candies = [4,2,1,1,2], extraCandies = 1", output: "[true,false,false,false,false]" },
    ],
    constraints: ["1 <= candies.length <= 100", "1 <= candies[i] <= 100", "1 <= extraCandies <= 50"],
    functionName: "kidsWithCandies",
    starterCode: starter(
      "@param {number[]} candies\n * @param {number} extraCandies\n * @return {boolean[]}",
      "kidsWithCandies", "candies, extraCandies", "candies: number[], extraCandies: number", "boolean[]",
    ),
    testCases: [
      tc([[2, 3, 5, 1, 3], 3], [true, true, true, false, true]),
      tc([[4, 2, 1, 1, 2], 1], [true, false, false, false, false]),
      tc([[12, 1, 12], 10], [true, false, true], { hidden: true }),
      tc([[1, 1, 1], 1], [true, true, true], { hidden: true }),
    ],
    hints: [
      "Find the current maximum once, outside the loop.",
      "“The most” means at least the maximum, so ties count.",
    ],
  },
  {
    id: "shuffle-the-array", number: 49, title: "Shuffle the Array", difficulty: "EASY" as D,
    topics: ["Arrays"],
    description:
      "`nums` holds `2n` elements in the form `[x1…xn, y1…yn]`. Return them interleaved as `[x1, y1, x2, y2, …]`.",
    examples: [
      { input: "nums = [2,5,1,3,4,7], n = 3", output: "[2,3,5,4,1,7]", explanation: "x = [2,5,1], y = [3,4,7]" },
      { input: "nums = [1,2,3,4,4,3,2,1], n = 4", output: "[1,4,2,3,3,2,4,1]" },
    ],
    constraints: ["1 <= n <= 500", "nums.length === 2n"],
    functionName: "shuffle",
    starterCode: starter(
      "@param {number[]} nums\n * @param {number} n\n * @return {number[]}",
      "shuffle", "nums, n", "nums: number[], n: number", "number[]",
    ),
    testCases: [
      tc([[2, 5, 1, 3, 4, 7], 3], [2, 3, 5, 4, 1, 7]),
      tc([[1, 2, 3, 4, 4, 3, 2, 1], 4], [1, 4, 2, 3, 3, 2, 4, 1]),
      tc([[1, 1, 2, 2], 2], [1, 2, 1, 2], { hidden: true }),
      tc([[7, 8, 9, 1, 2, 3], 3], [7, 1, 8, 2, 9, 3], { hidden: true }),
    ],
    hints: [
      "Pair `nums[i]` with `nums[i + n]` for every `i` below `n`.",
      "Push into a result array instead of trying to rearrange in place.",
    ],
  },
  {
    id: "number-of-steps-to-reduce-a-number-to-zero", number: 50, title: "Number of Steps to Reduce a Number to Zero", difficulty: "EASY" as D,
    topics: ["Math", "Bit Manipulation"],
    description:
      "Given `num`, repeat these rules until it reaches `0` and return the number of steps used:\n\n- if the number is even, divide it by 2\n- if it is odd, subtract 1",
    examples: [
      { input: "num = 14", output: "6", explanation: "14 → 7 → 6 → 3 → 2 → 1 → 0" },
      { input: "num = 8", output: "4" },
    ],
    constraints: ["0 <= num <= 10^6"],
    functionName: "numberOfSteps",
    starterCode: starter(
      "@param {number} num\n * @return {number}",
      "numberOfSteps", "num", "num: number", "number",
    ),
    testCases: [
      tc([14], 6),
      tc([8], 4),
      tc([0], 0, { hidden: true }),
      tc([15], 7, { hidden: true }),
    ],
    hints: [
      "A `while` loop plus a step counter is all that is needed.",
      "Even numbers lose a binary digit, odd numbers clear a bit.",
    ],
  },

  /* =========================================================== 51 – 55 */
  {
    id: "running-sum-of-1d-array", number: 51, title: "Running Sum of 1d Array", difficulty: "EASY" as D,
    topics: ["Arrays", "Prefix Sum"],
    description:
      "Return the running sum of `nums`: `runningSum[i] = nums[0] + nums[1] + … + nums[i]`.",
    examples: [
      { input: "nums = [1,2,3,4]", output: "[1,3,6,10]" },
      { input: "nums = [1,1,1,1,1]", output: "[1,2,3,4,5]" },
    ],
    constraints: ["1 <= nums.length <= 1000", "-10^6 <= nums[i] <= 10^6"],
    functionName: "runningSum",
    starterCode: starter(
      "@param {number[]} nums\n * @return {number[]}",
      "runningSum", "nums", "nums: number[]", "number[]",
    ),
    testCases: [
      tc([[1, 2, 3, 4]], [1, 3, 6, 10]),
      tc([[1, 1, 1, 1, 1]], [1, 2, 3, 4, 5]),
      tc([[3, 1, 2, 10, 1]], [3, 4, 6, 16, 17], { hidden: true }),
      tc([[1]], [1], { hidden: true }),
    ],
    hints: [
      "Keep a `total` variable and push it after every addition.",
      "Writing into a copy of the input avoids a second array of running totals.",
    ],
  },
  {
    id: "final-value-of-variable", number: 52, title: "Final Value of Variable After Operations", difficulty: "EASY" as D,
    topics: ["Strings", "Simulation"],
    description:
      "Starting from `X = 0`, apply every operation in `operations` and return the final value of `X`.\n\n`++X` and `X++` both add 1; `--X` and `X--` both subtract 1.",
    examples: [
      { input: 'operations = ["--X","X++","X++"]', output: "1" },
      { input: 'operations = ["++X","++X","X++"]', output: "3" },
    ],
    constraints: ["1 <= operations.length <= 100", "Every operation is one of `++X`, `X++`, `--X`, `X--`."],
    functionName: "finalValue",
    starterCode: starter(
      "@param {string[]} operations\n * @return {number}",
      "finalValue", "operations", "operations: string[]", "number",
    ),
    testCases: [
      tc([["--X", "X++", "X++"]], 1),
      tc([["++X", "++X", "X++"]], 3),
      tc([["X++", "++X", "--X", "X--"]], 0, { hidden: true }),
      tc([["--X", "--X", "X++"]], -1, { hidden: true }),
    ],
    hints: [
      "Only the operation's second character decides the direction: `+` or `-`.",
      "`operation.includes('+')` is enough — no need to compare four strings.",
    ],
  },
  {
    id: "richest-customer-wealth", number: 53, title: "Richest Customer Wealth", difficulty: "EASY" as D,
    topics: ["Arrays", "Matrix"],
    description:
      "`accounts[i][j]` is the amount of money customer `i` has in bank `j`. Return the wealth of the richest customer, where wealth is the sum of their row.",
    examples: [
      { input: "accounts = [[1,2,3],[3,2,1]]", output: "6", explanation: "Both customers have 6." },
      { input: "accounts = [[1,5],[7,3],[3,5]]", output: "10" },
    ],
    constraints: ["1 <= accounts.length, accounts[i].length <= 50", "1 <= accounts[i][j] <= 100"],
    functionName: "maximumWealth",
    starterCode: starter(
      "@param {number[][]} accounts\n * @return {number}",
      "maximumWealth", "accounts", "accounts: number[][]", "number",
    ),
    testCases: [
      tc([[[1, 2, 3], [3, 2, 1]]], 6),
      tc([[[1, 5], [7, 3], [3, 5]]], 10),
      tc([[[2, 8, 7], [7, 1, 3], [1, 9, 5]]], 17, { hidden: true }),
      tc([[[5], [7], [3]]], 7, { hidden: true }),
    ],
    hints: [
      "Row sums are independent — the maximum does not need sorting.",
      "`reduce` over each row, then take the largest value.",
    ],
  },
  {
    id: "defanging-an-ip-address", number: 54, title: "Defanging an IP Address", difficulty: "EASY" as D,
    topics: ["Strings"],
    description:
      'A **defanged** version of an IP address replaces every `.` with `[.]`.\n\nReturn the defanged version of `address`.',
    examples: [
      { input: 'address = "1.1.1.1"', output: '"1[.]1[.]1[.]1"' },
      { input: 'address = "255.100.50.0"', output: '"255[.]100[.]50[.]0"' },
    ],
    constraints: ["`address` is a valid IPv4 address."],
    functionName: "defangIPaddr",
    starterCode: starter(
      "@param {string} address\n * @return {string}",
      "defangIPaddr", "address", "address: string", "string",
    ),
    testCases: [
      tc(["1.1.1.1"], "1[.]1[.]1[.]1"),
      tc(["255.100.50.0"], "255[.]100[.]50[.]0"),
      tc(["0.0.0.0"], "0[.]0[.]0[.]0", { hidden: true }),
      tc(["192.168.1.1"], "192[.]168[.]1[.]1", { hidden: true }),
    ],
    hints: [
      "`split('.')` and `join('[.]')` is the whole solution.",
      "A regular expression with the global flag works too: `/\\./g`.",
    ],
  },
  {
    id: "goal-parser-interpretation", number: 55, title: "Goal Parser Interpretation", difficulty: "EASY" as D,
    topics: ["Strings"],
    description:
      "Parse a command string where `G` stays `G`, `()` becomes `o` and `(al)` becomes `al`. Return the interpreted string.",
    examples: [
      { input: 'command = "G()(al)"', output: '"Goal"' },
      { input: 'command = "G()()()()(al)"', output: '"Gooooal"' },
    ],
    constraints: ["1 <= command.length <= 100", "`command` only contains `G`, `()` and `(al)`."],
    functionName: "interpret",
    starterCode: starter(
      "@param {string} command\n * @return {string}",
      "interpret", "command", "command: string", "string",
    ),
    testCases: [
      tc(["G()(al)"], "Goal"),
      tc(["G()()()()(al)"], "Gooooal"),
      tc(["(al)G(al)()()G"], "alGalooG", { hidden: true }),
      tc(["G"], "G", { hidden: true }),
    ],
    hints: [
      "Scan left to right: `G` is literal, `()` adds `o`, `(al)` adds `al`.",
      "`command.replace(/\\\\(\\\\)/g, 'o').replace(/\\\\(al\\\\)/g, 'al')` is a one-liner.",
    ],
  },

  /* =========================================================== 56 – 60 */
  {
    id: "find-numbers-with-even-number-of-digits", number: 56, title: "Find Numbers with Even Number of Digits", difficulty: "EASY" as D,
    topics: ["Arrays", "Math"],
    description: "Given an array `nums` of integers, return how many of them contain an **even number of digits**.",
    examples: [
      { input: "nums = [12,345,2,6,7896]", output: "2", explanation: "12 and 7896 have 2 and 4 digits." },
      { input: "nums = [555,901,482,1771]", output: "1" },
    ],
    constraints: ["1 <= nums.length <= 500", "1 <= nums[i] <= 10^5"],
    functionName: "findNumbers",
    starterCode: starter(
      "@param {number[]} nums\n * @return {number}",
      "findNumbers", "nums", "nums: number[]", "number",
    ),
    testCases: [
      tc([[12, 345, 2, 6, 7896]], 2),
      tc([[555, 901, 482, 1771]], 1),
      tc([[1]], 0, { hidden: true }),
      tc([[100000]], 1, { hidden: true }),
    ],
    hints: [
      "`String(value).length % 2 === 0` is the quick check.",
      "Logarithms work too: `Math.floor(Math.log10(value)) + 1` gives the digit count.",
    ],
  },
  {
    id: "count-of-matches-in-tournament", number: 57, title: "Count of Matches in Tournament", difficulty: "EASY" as D,
    topics: ["Math", "Simulation"],
    description:
      "`n` teams play a knockout tournament. In each round, teams are paired up; the winner of each match advances and — when the count is odd — one team gets a bye.\n\nReturn the total number of matches played until a winner is decided.",
    examples: [
      { input: "n = 7", output: "6", explanation: "3 + 2 + 1 = 6 matches." },
      { input: "n = 14", output: "13" },
    ],
    constraints: ["1 <= n <= 200"],
    functionName: "numberOfMatches",
    starterCode: starter(
      "@param {number} n\n * @return {number}",
      "numberOfMatches", "n", "n: number", "number",
    ),
    testCases: [
      tc([7], 6),
      tc([14], 13),
      tc([1], 0, { hidden: true }),
      tc([100], 99, { hidden: true }),
    ],
    hints: [
      "Every match eliminates exactly one team, so `n - 1` teams have to go.",
      "Simulating the halving rounds is the literal version of the same answer.",
    ],
  },
  {
    id: "to-lower-case", number: 58, title: "To Lower Case", difficulty: "EASY" as D,
    topics: ["Strings"],
    description: "Given a string `s`, return it converted to lowercase letters.",
    examples: [
      { input: 's = "Hello"', output: '"hello"' },
      { input: 's = "here"', output: '"here"' },
    ],
    constraints: ["1 <= s.length <= 100", "`s` contains printable ASCII characters."],
    functionName: "toLowerCase",
    starterCode: starter(
      "@param {string} s\n * @return {string}",
      "toLowerCase", "s", "s: string", "string",
    ),
    testCases: [
      tc(["Hello"], "hello"),
      tc(["here"], "here"),
      tc(["LOVELY"], "lovely", { hidden: true }),
      tc(["Mixed123"], "mixed123", { hidden: true }),
    ],
    hints: [
      "`s.toLowerCase()` is the practical answer.",
      "For practice, map each code point and add 32 for the `A`–`Z` range.",
    ],
  },
  {
    id: "number-of-good-pairs", number: 59, title: "Number of Good Pairs", difficulty: "EASY" as D,
    topics: ["Arrays", "Hash Table", "Math", "Counting"],
    description:
      "A pair `(i, j)` is **good** when `nums[i] === nums[j]` and `i < j`.\n\nReturn the number of good pairs in `nums`.",
    examples: [
      { input: "nums = [1,2,3,1,1,3]", output: "4", explanation: "(0,3), (0,4), (3,4) and (2,5)" },
      { input: "nums = [1,1,1,1]", output: "6" },
    ],
    constraints: ["1 <= nums.length <= 100", "1 <= nums[i] <= 100"],
    functionName: "numIdenticalPairs",
    starterCode: starter(
      "@param {number[]} nums\n * @return {number}",
      "numIdenticalPairs", "nums", "nums: number[]", "number",
    ),
    testCases: [
      tc([[1, 2, 3, 1, 1, 3]], 4),
      tc([[1, 1, 1, 1]], 6),
      tc([[1, 2, 3]], 0, { hidden: true }),
      tc([[1, 1, 1]], 3, { hidden: true }),
    ],
    hints: [
      "Count how often each value appears, then add `count` for every new occurrence.",
      "A value seen `k` times contributes `k * (k - 1) / 2` pairs in total.",
    ],
  },
  {
    id: "how-many-numbers-are-smaller-than-the-current-number", number: 60, title: "How Many Numbers Are Smaller Than the Current Number", difficulty: "EASY" as D,
    topics: ["Arrays", "Sorting", "Hash Table"],
    description:
      "For each element of `nums`, count how many other elements are **strictly smaller** than it and return those counts in the original order.",
    examples: [
      { input: "nums = [8,1,2,2,3]", output: "[4,0,1,1,3]" },
      { input: "nums = [6,5,4,8]", output: "[2,1,0,3]" },
    ],
    constraints: ["2 <= nums.length <= 500", "0 <= nums[i] <= 100"],
    functionName: "smallerNumbersThanCurrent",
    starterCode: starter(
      "@param {number[]} nums\n * @return {number[]}",
      "smallerNumbersThanCurrent", "nums", "nums: number[]", "number[]",
    ),
    testCases: [
      tc([[8, 1, 2, 2, 3]], [4, 0, 1, 1, 3]),
      tc([[6, 5, 4, 8]], [2, 1, 0, 3]),
      tc([[7, 7, 7, 7]], [0, 0, 0, 0], { hidden: true }),
      tc([[1, 2, 3, 4]], [0, 1, 2, 3], { hidden: true }),
    ],
    hints: [
      "Sort a copy of the array; the first index of a value is its count of smaller values.",
      "The O(n²) double loop naively gives the same answer for small inputs.",
    ],
  },

  /* =========================================================== 61 – 63 */
  {
    id: "count-items-matching-a-rule", number: 61, title: "Count Items Matching a Rule", difficulty: "EASY" as D,
    topics: ["Arrays", "Strings"],
    description:
      "`items[i] = [type, color, name]` describes item `i`. Given a `ruleKey` (`type`, `color` or `name`) and a `ruleValue`, return how many items match.",
    examples: [
      { input: 'items = [["phone","blue","pixel"],["computer","silver","lenovo"],["phone","gold","iphone"]], ruleKey = "color", ruleValue = "silver"', output: "1" },
      { input: 'items = [["phone","blue","pixel"],["computer","silver","lenovo"],["phone","gold","iphone"]], ruleKey = "type", ruleValue = "phone"', output: "2" },
    ],
    constraints: ["1 <= items.length <= 10^4", "`ruleKey` is one of `type`, `color`, `name`."],
    functionName: "countMatches",
    starterCode: starter(
      "@param {string[][]} items\n * @param {string} ruleKey\n * @param {string} ruleValue\n * @return {number}",
      "countMatches", "items, ruleKey, ruleValue", "items: string[][], ruleKey: string, ruleValue: string", "number",
    ),
    testCases: [
      tc([[["phone", "blue", "pixel"], ["computer", "silver", "lenovo"], ["phone", "gold", "iphone"]], "color", "silver"], 1),
      tc([[["phone", "blue", "pixel"], ["computer", "silver", "lenovo"], ["phone", "gold", "iphone"]], "type", "phone"], 2),
      tc([[["phone", "blue", "pixel"], ["computer", "silver", "lenovo"], ["phone", "gold", "iphone"]], "name", "iphone"], 1, { hidden: true }),
      tc([[["a", "b", "c"]], "type", "a"], 1, { hidden: true }),
    ],
    hints: [
      "Map the rule key to a column index once: `type` → 0, `color` → 1, `name` → 2.",
      "A lookup object beats a chain of `if` statements.",
    ],
  },
  {
    id: "sort-array-by-parity", number: 62, title: "Sort Array By Parity", difficulty: "EASY" as D,
    topics: ["Arrays", "Two Pointers", "Sorting"],
    description:
      "Return an array with all the **even** integers of `nums` first, followed by all the odd integers.\n\nThe relative order within each half must be preserved.",
    examples: [
      { input: "nums = [3,1,2,4]", output: "[2,4,3,1]", explanation: "Evens `[2,4]` then odds `[3,1]`." },
      { input: "nums = [0]", output: "[0]" },
    ],
    constraints: ["1 <= nums.length <= 5000", "0 <= nums[i] <= 5000"],
    functionName: "sortArrayByParity",
    starterCode: starter(
      "@param {number[]} nums\n * @return {number[]}",
      "sortArrayByParity", "nums", "nums: number[]", "number[]",
    ),
    testCases: [
      tc([[3, 1, 2, 4]], [2, 4, 3, 1]),
      tc([[0]], [0]),
      tc([[1, 2]], [2, 1], { hidden: true }),
      tc([[2, 1]], [2, 1], { hidden: true }),
    ],
    hints: [
      "Two buckets — one for evens, one for odds — then concatenate.",
      "`nums[i] % 2 === 0` identifies the even values.",
    ],
  },
  {
    id: "height-checker", number: 63, title: "Height Checker", difficulty: "EASY" as D,
    topics: ["Arrays", "Sorting"],
    description:
      "The students in `heights` must stand in **non-decreasing** order. Return how many positions differ from the sorted order.",
    examples: [
      { input: "heights = [1,1,4,2,1,3]", output: "3", explanation: "Sorted: [1,1,1,2,3,4] — indices 2, 4 and 5 differ." },
      { input: "heights = [5,1,2,3,4]", output: "5" },
    ],
    constraints: ["1 <= heights.length <= 100", "1 <= heights[i] <= 100"],
    functionName: "heightChecker",
    starterCode: starter(
      "@param {number[]} heights\n * @return {number}",
      "heightChecker", "heights", "heights: number[]", "number",
    ),
    testCases: [
      tc([[1, 1, 4, 2, 1, 3]], 3),
      tc([[5, 1, 2, 3, 4]], 5),
      tc([[1, 2, 3, 4, 5]], 0, { hidden: true }),
      tc([[3, 1, 6]], 2, { hidden: true }),
    ],
    hints: [
      "Sort a copy and compare index by index — do not sort the original in place.",
      "`[...heights].sort((a, b) => a - b)` avoids the in-place mutation.",
    ],
  },

  /* =========================================================== 64 – 67 */
  {
    id: "maximum-product-of-two-elements-in-an-array", number: 64, title: "Maximum Product of Two Elements", difficulty: "EASY" as D,
    topics: ["Arrays", "Sorting"],
    description:
      "Choose two **different** indices `i` and `j` that maximise `(nums[i] - 1) * (nums[j] - 1)` and return that maximum.",
    examples: [
      { input: "nums = [3,4,5,2]", output: "12", explanation: "(5 - 1) * (4 - 1) = 12" },
      { input: "nums = [1,5,4,5]", output: "16" },
    ],
    constraints: ["2 <= nums.length <= 500", "1 <= nums[i] <= 10^3"],
    functionName: "maxProduct",
    starterCode: starter(
      "@param {number[]} nums\n * @return {number}",
      "maxProduct", "nums", "nums: number[]", "number",
    ),
    testCases: [
      tc([[3, 4, 5, 2]], 12),
      tc([[1, 5, 4, 5]], 16),
      tc([[3, 7]], 12, { hidden: true }),
      tc([[1, 2]], 0, { hidden: true }),
    ],
    hints: [
      "Only the two largest values matter, so one pass with two trackers is enough.",
      "Sorting descending and taking the first two elements is the shortest version.",
    ],
  },
  {
    id: "unique-number-of-occurrences", number: 65, title: "Unique Number of Occurrences", difficulty: "EASY" as D,
    topics: ["Arrays", "Hash Table"],
    description: "Return `true` when every distinct value in `arr` occurs a **different** number of times.",
    examples: [
      { input: "arr = [1,2,2,1,1,3]", output: "true", explanation: "1 → three times, 2 → twice, 3 → once." },
      { input: "arr = [1,2]", output: "false", explanation: "Both values occur once." },
    ],
    constraints: ["1 <= arr.length <= 1000", "-1000 <= arr[i] <= 1000"],
    functionName: "uniqueOccurrences",
    starterCode: starter(
      "@param {number[]} arr\n * @return {boolean}",
      "uniqueOccurrences", "arr", "arr: number[]", "boolean",
    ),
    testCases: [
      tc([[1, 2, 2, 1, 1, 3]], true),
      tc([[1, 2]], false),
      tc([[-3, 0, 1, -3, 1, 1, 1, -3, 10, 0]], true, { hidden: true }),
      tc([[1, 1, 2, 2]], false, { hidden: true }),
    ],
    hints: [
      "Build a frequency map, then collect the counts into a `Set`.",
      "The answer is `true` exactly when the `Set` is as large as the map.",
    ],
  },
  {
    id: "can-place-flowers", number: 66, title: "Can Place Flowers", difficulty: "EASY" as D,
    topics: ["Arrays", "Greedy"],
    description:
      "`flowerbed` contains `0`s (empty) and `1`s (planted). Flowers cannot be planted in adjacent plots.\n\nReturn `true` if `n` new flowers can be planted without breaking that rule.",
    examples: [
      { input: "flowerbed = [1,0,0,0,1], n = 1", output: "true" },
      { input: "flowerbed = [1,0,0,0,1], n = 2", output: "false" },
    ],
    constraints: ["1 <= flowerbed.length <= 2 * 10^4", "0 <= n <= flowerbed.length", "`flowerbed[i]` is `0` or `1`."],
    functionName: "canPlaceFlowers",
    starterCode: starter(
      "@param {number[]} flowerbed\n * @param {number} n\n * @return {boolean}",
      "canPlaceFlowers", "flowerbed, n", "flowerbed: number[], n: number", "boolean",
    ),
    testCases: [
      tc([[1, 0, 0, 0, 1], 1], true),
      tc([[1, 0, 0, 0, 1], 2], false),
      tc([[0, 0, 1, 0, 0], 1], true, { hidden: true }),
      tc([[1, 0, 0, 0, 0, 1], 2], false, { hidden: true }),
    ],
    hints: [
      "Walk left to right and plant greedily whenever the current plot and both neighbours are empty.",
      "Treat the positions outside the array as empty, then count how many flowers fit.",
    ],
  },
  {
    id: "number-complement", number: 67, title: "Number Complement", difficulty: "EASY" as D,
    topics: ["Bit Manipulation"],
    description:
      "The **complement** of an integer flips every bit of its binary representation (ignoring leading zeros).\n\nGiven `num`, return its complement.",
    examples: [
      { input: "num = 5", output: "2", explanation: "101 → 010" },
      { input: "num = 1", output: "0" },
    ],
    constraints: ["1 <= num < 2^31"],
    functionName: "findComplement",
    starterCode: starter(
      "@param {number} num\n * @return {number}",
      "findComplement", "num", "num: number", "number",
    ),
    testCases: [
      tc([5], 2),
      tc([1], 0),
      tc([2], 1, { hidden: true }),
      tc([10], 5, { hidden: true }),
    ],
    hints: [
      "You need a mask of ones that is exactly as wide as the number.",
      "Shift a mask left while it is still smaller than `num`, then XOR.",
    ],
  },

  /* =========================================================== 68 – 70 */
  {
    id: "repeated-substring-pattern", number: 68, title: "Repeated Substring Pattern", difficulty: "EASY" as D,
    topics: ["Strings", "String Matching"],
    description:
      "Given a string `s`, return `true` if it can be built by repeating one of its substrings several times.",
    examples: [
      { input: 's = "abab"', output: "true", explanation: 'It is "ab" twice.' },
      { input: 's = "aba"', output: "false" },
    ],
    constraints: ["1 <= s.length <= 10^4", "`s` consists of lowercase English letters."],
    functionName: "repeatedSubstringPattern",
    starterCode: starter(
      "@param {string} s\n * @return {boolean}",
      "repeatedSubstringPattern", "s", "s: string", "boolean",
    ),
    testCases: [
      tc(["abab"], true),
      tc(["aba"], false),
      tc(["abcabcabcabc"], true, { hidden: true }),
      tc(["a"], false, { hidden: true }),
    ],
    hints: [
      "Trying every divisor of the length is the honest brute force.",
      "The clever trick: `s` must appear in `s + s` after dropping the first and last characters.",
    ],
  },
  {
    id: "add-digits", number: 69, title: "Add Digits", difficulty: "EASY" as D,
    topics: ["Math", "Simulation", "Number Theory"],
    description:
      "Repeatedly add all the digits of `num` until a single digit remains, and return it.",
    examples: [
      { input: "num = 38", output: "2", explanation: "3 + 8 = 11 → 1 + 1 = 2" },
      { input: "num = 0", output: "0" },
    ],
    constraints: ["0 <= num <= 2^31 - 1"],
    functionName: "addDigits",
    starterCode: starter(
      "@param {number} num\n * @return {number}",
      "addDigits", "num", "num: number", "number",
    ),
    testCases: [
      tc([38], 2),
      tc([0], 0),
      tc([10], 1, { hidden: true }),
      tc([9], 9, { hidden: true }),
    ],
    hints: [
      "`while (num >= 10)` with `% 10` and `Math.floor(n / 10)` is the direct simulation.",
      "The result is the well-known digital root: `1 + (num - 1) % 9`, with `0` as a special case.",
    ],
  },
  {
    id: "find-the-difference", number: 70, title: "Find the Difference", difficulty: "EASY" as D,
    topics: ["Strings", "Hash Table", "Bit Manipulation"],
    description:
      "String `t` is produced by shuffling `s` and adding one extra letter.\n\nReturn that extra letter.",
    examples: [
      { input: 's = "abcd", t = "abcde"', output: '"e"' },
      { input: 's = "", t = "y"', output: '"y"' },
    ],
    constraints: ["0 <= s.length <= 1000", "t.length === s.length + 1", "Both strings are lowercase English letters."],
    functionName: "findTheDifference",
    starterCode: starter(
      "@param {string} s\n * @param {string} t\n * @return {string}",
      "findTheDifference", "s, t", "s: string, t: string", "string",
    ),
    testCases: [
      tc(["abcd", "abcde"], "e"),
      tc(["", "y"], "y"),
      tc(["a", "aa"], "a", { hidden: true }),
      tc(["ae", "aea"], "a", { hidden: true }),
    ],
    hints: [
      "XOR every character of both strings — the pairs cancel out.",
      "Summing code points and subtracting the totals works just as well.",
    ],
  },

  /* =========================================================== 71 – 74 */
  {
    id: "best-time-to-buy-and-sell-stock-ii", number: 71, title: "Best Time to Buy and Sell Stock II", difficulty: "MEDIUM" as D,
    topics: ["Arrays", "Greedy", "Dynamic Programming"],
    description:
      "`prices[i]` is the price of a stock on day `i`. You may buy and sell as many times as you like, but you may hold at most one share at a time.\n\nReturn the maximum profit you can make.",
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "7", explanation: "Buy at 1, sell at 5, buy at 3, sell at 6." },
      { input: "prices = [1,2,3,4,5]", output: "4" },
    ],
    constraints: ["1 <= prices.length <= 3 * 10^4", "0 <= prices[i] <= 10^4"],
    functionName: "maxProfitII",
    starterCode: starter(
      "@param {number[]} prices\n * @return {number}",
      "maxProfitII", "prices", "prices: number[]", "number",
    ),
    testCases: [
      tc([[7, 1, 5, 3, 6, 4]], 7),
      tc([[1, 2, 3, 4, 5]], 4),
      tc([[7, 6, 4, 3, 1]], 0, { hidden: true }),
      tc([[1]], 0, { hidden: true }),
    ],
    hints: [
      "Every upward step can be captured, so simply add `prices[i] - prices[i - 1]` when it is positive.",
      "Proof sketch: a longer hold is worth exactly the sum of the daily rises it spans.",
    ],
  },
  {
    id: "longest-consecutive-sequence", number: 72, title: "Longest Consecutive Sequence", difficulty: "MEDIUM" as D,
    topics: ["Arrays", "Hash Table", "Union Find"],
    description:
      "Given an unsorted array `nums`, return the length of the longest run of consecutive integers.\n\nYour algorithm must run in O(n) time.",
    examples: [
      { input: "nums = [100,4,200,1,3,2]", output: "4", explanation: "The run is 1, 2, 3, 4." },
      { input: "nums = [0,3,7,2,5,8,4,6,0,1]", output: "9" },
    ],
    constraints: ["0 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
    functionName: "longestConsecutive",
    starterCode: starter(
      "@param {number[]} nums\n * @return {number}",
      "longestConsecutive", "nums", "nums: number[]", "number",
    ),
    testCases: [
      tc([[100, 4, 200, 1, 3, 2]], 4),
      tc([[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]], 9),
      tc([[]], 0, { hidden: true }),
      tc([[1, 1, 1]], 1, { hidden: true }),
    ],
    hints: [
      "Put everything in a `Set` so membership tests are O(1).",
      "Only start counting from a value whose predecessor is missing — that is what keeps it linear.",
    ],
  },
  {
    id: "top-k-frequent-elements", number: 73, title: "Top K Frequent Elements", difficulty: "MEDIUM" as D,
    topics: ["Arrays", "Hash Table", "Heap", "Sorting"],
    description:
      "Return the `k` most frequent elements of `nums` in any order.\n\nThe answer is guaranteed to be unique.",
    examples: [
      { input: "nums = [1,1,1,2,2,3], k = 2", output: "[1,2]" },
      { input: "nums = [1], k = 1", output: "[1]" },
    ],
    constraints: ["1 <= nums.length <= 10^5", "k is in the range [1, number of distinct elements]"],
    functionName: "topKFrequent",
    starterCode: starter(
      "@param {number[]} nums\n * @param {number} k\n * @return {number[]}",
      "topKFrequent", "nums, k", "nums: number[], k: number", "number[]",
    ),
    testCases: [
      tc([[1, 1, 1, 2, 2, 3], 2], [1, 2], { unordered: true }),
      tc([[1], 1], [1]),
      tc([[1, 2, 1, 2, 1, 2, 3, 1, 3, 2], 2], [1, 2], { hidden: true, unordered: true }),
      tc([[4, 4, 4, 5, 5, 6], 2], [4, 5], { hidden: true, unordered: true }),
    ],
    hints: [
      "Count first, then sort the distinct values by their counts.",
      "Bucketing by frequency gives O(n) instead of O(n log n).",
    ],
  },
  {
    id: "set-matrix-zeroes", number: 74, title: "Set Matrix Zeroes", difficulty: "MEDIUM" as D,
    topics: ["Arrays", "Matrix", "Hash Table"],
    description:
      "Given an `m × n` integer matrix, return a matrix where every row and column containing a `0` is set to `0`.",
    examples: [
      { input: "matrix = [[1,1,1],[1,0,1],[1,1,1]]", output: "[[1,0,1],[0,0,0],[1,0,1]]" },
      { input: "matrix = [[0,1,2,0],[3,4,5,2],[1,3,1,5]]", output: "[[0,0,0,0],[0,4,5,0],[0,3,1,0]]" },
    ],
    constraints: ["1 <= m, n <= 200", "-2^31 <= matrix[i][j] <= 2^31 - 1"],
    functionName: "setZeroes",
    starterCode: starter(
      "@param {number[][]} matrix\n * @return {number[][]}",
      "setZeroes", "matrix", "matrix: number[][]", "number[][]",
    ),
    testCases: [
      tc([[[1, 1, 1], [1, 0, 1], [1, 1, 1]]], [[1, 0, 1], [0, 0, 0], [1, 0, 1]]),
      tc([[[0, 1, 2, 0], [3, 4, 5, 2], [1, 3, 1, 5]]], [[0, 0, 0, 0], [0, 4, 5, 0], [0, 3, 1, 0]]),
      tc([[[1]]], [[1]], { hidden: true }),
      tc([[[0]]], [[0]], { hidden: true }),
    ],
    hints: [
      "Record the zero rows and columns first, then apply them — mutating while scanning loses information.",
      "Building a fresh matrix avoids the order-of-operations trap entirely.",
    ],
  },

  /* =========================================================== 75 – 78 */
  {
    id: "rotate-image", number: 75, title: "Rotate Image", difficulty: "MEDIUM" as D,
    topics: ["Arrays", "Matrix"],
    description:
      "Given an `n × n` matrix, return it rotated **90 degrees clockwise**.",
    examples: [
      { input: "matrix = [[1,2,3],[4,5,6],[7,8,9]]", output: "[[7,4,1],[8,5,2],[9,6,3]]" },
      { input: "matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]", output: "[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]" },
    ],
    constraints: ["n == matrix.length == matrix[i].length", "1 <= n <= 20"],
    functionName: "rotate",
    starterCode: starter(
      "@param {number[][]} matrix\n * @return {number[][]}",
      "rotate", "matrix", "matrix: number[][]", "number[][]",
    ),
    testCases: [
      tc([[[1, 2, 3], [4, 5, 6], [7, 8, 9]]], [[7, 4, 1], [8, 5, 2], [9, 6, 3]]),
      tc([[[5, 1, 9, 11], [2, 4, 8, 10], [13, 3, 6, 7], [15, 14, 12, 16]]], [[15, 13, 2, 5], [14, 3, 4, 1], [12, 6, 8, 9], [16, 7, 10, 11]]),
      tc([[[1]]], [[1]], { hidden: true }),
      tc([[[1, 2], [3, 4]]], [[3, 1], [4, 2]], { hidden: true }),
    ],
    hints: [
      "The cell at row `i`, column `j` moves to row `j`, column `n - 1 - i`.",
      "Transpose the matrix and then reverse every row.",
    ],
  },
  {
    id: "container-with-most-water", number: 76, title: "Container With Most Water", difficulty: "MEDIUM" as D,
    topics: ["Arrays", "Two Pointers", "Greedy"],
    description:
      "`height[i]` is the height of a vertical line at x-coordinate `i`. Two lines together with the x-axis form a container.\n\nReturn the maximum amount of water such a container can hold.",
    examples: [
      { input: "height = [1,8,6,2,5,4,8,3,7]", output: "49" },
      { input: "height = [1,1]", output: "1" },
    ],
    constraints: ["n == height.length", "2 <= n <= 10^5", "0 <= height[i] <= 10^4"],
    functionName: "maxArea",
    starterCode: starter(
      "@param {number[]} height\n * @return {number}",
      "maxArea", "height", "height: number[]", "number",
    ),
    testCases: [
      tc([[1, 8, 6, 2, 5, 4, 8, 3, 7]], 49),
      tc([[1, 1]], 1),
      tc([[4, 3, 2, 1, 4]], 16, { hidden: true }),
      tc([[1, 2, 1]], 2, { hidden: true }),
    ],
    hints: [
      "Width shrinks as the pointers close in, so only height can improve the area.",
      "Always move the pointer on the shorter line; moving the taller one can never help.",
    ],
  },
  {
    id: "sort-colors", number: 77, title: "Sort Colors", difficulty: "MEDIUM" as D,
    topics: ["Arrays", "Two Pointers", "Sorting"],
    description:
      "`nums` contains `0`s, `1`s and `2`s representing red, white and blue. Return the array sorted so equal colours are adjacent, in the order red, white, blue.",
    examples: [
      { input: "nums = [2,0,2,1,1,0]", output: "[0,0,1,1,2,2]" },
      { input: "nums = [2,0,1]", output: "[0,1,2]" },
    ],
    constraints: ["1 <= nums.length <= 300", "`nums[i]` is `0`, `1` or `2`."],
    functionName: "sortColors",
    starterCode: starter(
      "@param {number[]} nums\n * @return {number[]}",
      "sortColors", "nums", "nums: number[]", "number[]",
    ),
    testCases: [
      tc([[2, 0, 2, 1, 1, 0]], [0, 0, 1, 1, 2, 2]),
      tc([[2, 0, 1]], [0, 1, 2]),
      tc([[0]], [0], { hidden: true }),
      tc([[1, 0]], [0, 1], { hidden: true }),
    ],
    hints: [
      "Counting the three values and rewriting the array is O(n) time and O(1) extra space.",
      "The Dutch national flag algorithm sorts in a single pass with three pointers.",
    ],
  },
  {
    id: "permutations", number: 78, title: "Permutations", difficulty: "MEDIUM" as D,
    topics: ["Backtracking", "Recursion", "Arrays"],
    description:
      "Given an array `nums` of **distinct** integers, return all of its permutations in any order.",
    examples: [
      { input: "nums = [0,1]", output: "[[0,1],[1,0]]" },
      { input: "nums = [1]", output: "[[1]]" },
    ],
    constraints: ["1 <= nums.length <= 6", "All integers in `nums` are unique."],
    functionName: "permute",
    starterCode: starter(
      "@param {number[]} nums\n * @return {number[][]}",
      "permute", "nums", "nums: number[]", "number[][]",
    ),
    testCases: [
      tc([[1, 2, 3]], [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]], { unordered: true }),
      tc([[0, 1]], [[0, 1], [1, 0]], { unordered: true }),
      tc([[1]], [[1]], { hidden: true }),
      tc([[1, 2]], [[1, 2], [2, 1]], { hidden: true, unordered: true }),
    ],
    hints: [
      "Backtrack: pick a value, recurse with the rest, then undo the choice.",
      "Swapping in place is a neat way to avoid copying the remaining values.",
    ],
  },

  /* =========================================================== 79 – 82 */
  {
    id: "subsets", number: 79, title: "Subsets", difficulty: "MEDIUM" as D,
    topics: ["Backtracking", "Bit Manipulation", "Arrays"],
    description:
      "Given an array `nums` of **distinct** integers, return every possible subset (the power set) in any order.",
    examples: [
      { input: "nums = [1,2,3]", output: "[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]" },
      { input: "nums = [0]", output: "[[],[0]]" },
    ],
    constraints: ["1 <= nums.length <= 10", "All integers in `nums` are unique."],
    functionName: "subsets",
    starterCode: starter(
      "@param {number[]} nums\n * @return {number[][]}",
      "subsets", "nums", "nums: number[]", "number[][]",
    ),
    testCases: [
      tc([[1, 2, 3]], [[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]], { unordered: true }),
      tc([[0]], [[], [0]], { unordered: true }),
      tc([[1, 2]], [[], [1], [2], [1, 2]], { hidden: true, unordered: true }),
      tc([[5]], [[], [5]], { hidden: true, unordered: true }),
    ],
    hints: [
      "For every value you either include it or you do not — that is 2ⁿ subsets.",
      "Iterate `0 … 2ⁿ - 1` and read the bits of the counter to build each subset.",
    ],
  },
  {
    id: "combination-sum", number: 80, title: "Combination Sum", difficulty: "MEDIUM" as D,
    topics: ["Backtracking", "Arrays", "Recursion"],
    description:
      "Given distinct `candidates` and a `target`, return every unique combination that sums to `target`.\n\nThe same candidate may be chosen an unlimited number of times, and the answer may be in any order.",
    examples: [
      { input: "candidates = [2,3,6,7], target = 7", output: "[[2,2,3],[7]]" },
      { input: "candidates = [2,3,5], target = 8", output: "[[2,2,2,2],[2,3,3],[3,5]]" },
    ],
    constraints: ["1 <= candidates.length <= 30", "2 <= candidates[i] <= 40", "1 <= target <= 40"],
    functionName: "combinationSum",
    starterCode: starter(
      "@param {number[]} candidates\n * @param {number} target\n * @return {number[][]}",
      "combinationSum", "candidates, target", "candidates: number[], target: number", "number[][]",
    ),
    testCases: [
      tc([[2, 3, 6, 7], 7], [[2, 2, 3], [7]], { unordered: true }),
      tc([[2, 3, 5], 8], [[2, 2, 2, 2], [2, 3, 3], [3, 5]], { unordered: true }),
      tc([[2], 1], [], { hidden: true }),
      tc([[1], 1], [[1]], { hidden: true, unordered: true }),
    ],
    hints: [
      "Backtrack with a running total; stop as soon as the total exceeds the target.",
      "To avoid duplicates, only consider candidates from the current index onward.",
    ],
  },
  {
    id: "jump-game", number: 81, title: "Jump Game", difficulty: "MEDIUM" as D,
    topics: ["Arrays", "Greedy", "Dynamic Programming"],
    description:
      "`nums[i]` is the maximum jump length from index `i`. Starting at index `0`, return `true` if the last index can be reached.",
    examples: [
      { input: "nums = [2,3,1,1,4]", output: "true", explanation: "Jump 1 step to index 1, then 3 steps to the end." },
      { input: "nums = [3,2,1,0,4]", output: "false" },
    ],
    constraints: ["1 <= nums.length <= 10^4", "0 <= nums[i] <= 10^5"],
    functionName: "canJump",
    starterCode: starter(
      "@param {number[]} nums\n * @return {boolean}",
      "canJump", "nums", "nums: number[]", "boolean",
    ),
    testCases: [
      tc([[2, 3, 1, 1, 4]], true),
      tc([[3, 2, 1, 0, 4]], false),
      tc([[0]], true, { hidden: true }),
      tc([[1, 0, 1]], false, { hidden: true }),
    ],
    hints: [
      "Track the furthest index reachable so far and return `false` if you walk past it.",
      "Working backwards — the last index is always reachable — is just as short.",
    ],
  },
  {
    id: "unique-paths", number: 82, title: "Unique Paths", difficulty: "MEDIUM" as D,
    topics: ["Dynamic Programming", "Math", "Combinatorics"],
    description:
      "A robot starts in the top-left corner of an `m × n` grid and may only move right or down. Return the number of unique paths to the bottom-right corner.",
    examples: [
      { input: "m = 3, n = 7", output: "28" },
      { input: "m = 3, n = 2", output: "3" },
    ],
    constraints: ["1 <= m, n <= 100"],
    functionName: "uniquePaths",
    starterCode: starter(
      "@param {number} m\n * @param {number} n\n * @return {number}",
      "uniquePaths", "m, n", "m: number, n: number", "number",
    ),
    testCases: [
      tc([3, 7], 28),
      tc([3, 2], 3),
      tc([3, 3], 6, { hidden: true }),
      tc([1, 1], 1, { hidden: true }),
    ],
    hints: [
      "Every cell's path count is the sum of the cell above and the cell to the left.",
      "Only one row of the DP table is needed at a time — update it left to right.",
    ],
  },

  /* =========================================================== 83 – 86 */
  {
    id: "daily-temperatures", number: 83, title: "Daily Temperatures", difficulty: "MEDIUM" as D,
    topics: ["Arrays", "Stack", "Monotonic Stack"],
    description:
      "For every day in `temperatures`, return how many days you have to wait for a **warmer** temperature. If no warmer day comes, the value is `0`.",
    examples: [
      { input: "temperatures = [73,74,75,71,69,72,76,73]", output: "[1,1,4,2,1,1,0,0]" },
      { input: "temperatures = [30,40,50,60]", output: "[1,1,1,0]" },
    ],
    constraints: ["1 <= temperatures.length <= 10^5", "30 <= temperatures[i] <= 100"],
    functionName: "dailyTemperatures",
    starterCode: starter(
      "@param {number[]} temperatures\n * @return {number[]}",
      "dailyTemperatures", "temperatures", "temperatures: number[]", "number[]",
    ),
    testCases: [
      tc([[73, 74, 75, 71, 69, 72, 76, 73]], [1, 1, 4, 2, 1, 1, 0, 0]),
      tc([[30, 40, 50, 60]], [1, 1, 1, 0]),
      tc([[30, 60, 90]], [1, 1, 0], { hidden: true }),
      tc([[90, 80, 70]], [0, 0, 0], { hidden: true }),
    ],
    hints: [
      "A stack of indices whose warmer day has not been found yet.",
      "When a warmer temperature arrives, it answers every colder day still on the stack.",
    ],
  },
  {
    id: "evaluate-reverse-polish-notation", number: 84, title: "Evaluate Reverse Polish Notation", difficulty: "MEDIUM" as D,
    topics: ["Stack", "Math", "Arrays"],
    description:
      "Evaluate an arithmetic expression in **reverse Polish notation** and return the integer result.\n\nValid operators are `+`, `-`, `*` and `/`, and division truncates toward zero.",
    examples: [
      { input: 'tokens = ["2","1","+","3","*"]', output: "9", explanation: "((2 + 1) * 3)" },
      { input: 'tokens = ["4","13","5","/","+"]', output: "6", explanation: "(4 + (13 / 5)) with truncated division." },
    ],
    constraints: ["1 <= tokens.length <= 10^4", "Every division is by a non-zero integer."],
    functionName: "evalRPN",
    starterCode: starter(
      "@param {string[]} tokens\n * @return {number}",
      "evalRPN", "tokens", "tokens: string[]", "number",
    ),
    testCases: [
      tc([["2", "1", "+", "3", "*"]], 9),
      tc([["4", "13", "5", "/", "+"]], 6),
      tc([["10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"]], 22, { hidden: true }),
      tc([["3", "4", "+"]], 7, { hidden: true }),
    ],
    hints: [
      "One stack: push numbers, and pop two values whenever you meet an operator.",
      "Remember the operand order — the first pop is the right-hand side.",
    ],
  },
  {
    id: "longest-repeating-character-replacement", number: 85, title: "Longest Repeating Character Replacement", difficulty: "MEDIUM" as D,
    topics: ["Strings", "Sliding Window", "Hash Table"],
    description:
      "You may change at most `k` characters of `s` to any uppercase letter. Return the length of the longest substring of a **single repeated letter** you can produce.",
    examples: [
      { input: 's = "ABAB", k = 2', output: "4" },
      { input: 's = "AABABBA", k = 1', output: "4" },
    ],
    constraints: ["1 <= s.length <= 10^5", "0 <= k <= s.length", "`s` consists of uppercase English letters."],
    functionName: "characterReplacement",
    starterCode: starter(
      "@param {string} s\n * @param {number} k\n * @return {number}",
      "characterReplacement", "s, k", "s: string, k: number", "number",
    ),
    testCases: [
      tc(["ABAB", 2], 4),
      tc(["AABABBA", 1], 4),
      tc(["A", 0], 1, { hidden: true }),
      tc(["AAAA", 2], 4, { hidden: true }),
    ],
    hints: [
      "Slide a window and keep the count of each letter inside it.",
      "The window is valid while `windowLength - maxLetterCount <= k`.",
    ],
  },
  {
    id: "find-all-anagrams-in-a-string", number: 86, title: "Find All Anagrams in a String", difficulty: "MEDIUM" as D,
    topics: ["Strings", "Sliding Window", "Hash Table"],
    description:
      "Given `s` and `p`, return the **start indices** of every substring of `s` that is an anagram of `p`.\n\nThe result must be in ascending order.",
    examples: [
      { input: 's = "cbaebabacd", p = "abc"', output: "[0,6]" },
      { input: 's = "abab", p = "ab"', output: "[0,1,2]" },
    ],
    constraints: ["1 <= s.length, p.length <= 3 * 10^4", "Both strings are lowercase English letters."],
    functionName: "findAnagrams",
    starterCode: starter(
      "@param {string} s\n * @param {string} p\n * @return {number[]}",
      "findAnagrams", "s, p", "s: string, p: string", "number[]",
    ),
    testCases: [
      tc(["cbaebabacd", "abc"], [0, 6]),
      tc(["abab", "ab"], [0, 1, 2]),
      tc(["a", "a"], [0], { hidden: true }),
      tc(["aa", "bb"], [], { hidden: true }),
    ],
    hints: [
      "Build the letter counts of `p` once, then slide a window of the same length over `s`.",
      "Instead of rebuilding counts per window, add the new letter and remove the old one.",
    ],
  },

  /* =========================================================== 87 – 90 */
  {
    id: "subarray-sum-equals-k", number: 87, title: "Subarray Sum Equals K", difficulty: "MEDIUM" as D,
    topics: ["Arrays", "Hash Table", "Prefix Sum"],
    description: "Given `nums` and `k`, return the total number of contiguous subarrays whose sum equals `k`.",
    examples: [
      { input: "nums = [1,1,1], k = 2", output: "2" },
      { input: "nums = [1,2,3], k = 3", output: "2", explanation: "[1,2] and [3]" },
    ],
    constraints: ["1 <= nums.length <= 2 * 10^4", "-1000 <= nums[i] <= 1000", "-10^7 <= k <= 10^7"],
    functionName: "subarraySum",
    starterCode: starter(
      "@param {number[]} nums\n * @param {number} k\n * @return {number}",
      "subarraySum", "nums, k", "nums: number[], k: number", "number",
    ),
    testCases: [
      tc([[1, 1, 1], 2], 2),
      tc([[1, 2, 3], 3], 2),
      tc([[1], 0], 0, { hidden: true }),
      tc([[-1, -1, 1], 0], 1, { hidden: true }),
    ],
    hints: [
      "A subarray sums to `k` when two prefix sums differ by exactly `k`.",
      "Store how many times each prefix sum has appeared, starting with `{ 0: 1 }`.",
    ],
  },
  {
    id: "insert-interval", number: 88, title: "Insert Interval", difficulty: "MEDIUM" as D,
    topics: ["Arrays", "Intervals"],
    description:
      "`intervals` is sorted by start and has no overlaps. Insert `newInterval`, merging where needed, and return the still-sorted result.",
    examples: [
      { input: "intervals = [[1,3],[6,9]], newInterval = [2,5]", output: "[[1,5],[6,9]]" },
      { input: "intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval = [4,8]", output: "[[1,2],[3,10],[12,16]]" },
    ],
    constraints: ["0 <= intervals.length <= 10^4", "intervals[i].length == 2", "0 <= start <= end <= 10^5"],
    functionName: "insertInterval",
    starterCode: starter(
      "@param {number[][]} intervals\n * @param {number[]} newInterval\n * @return {number[][]}",
      "insertInterval", "intervals, newInterval", "intervals: number[][], newInterval: number[]", "number[][]",
    ),
    testCases: [
      tc([[[1, 3], [6, 9]], [2, 5]], [[1, 5], [6, 9]]),
      tc([[[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8]], [[1, 2], [3, 10], [12, 16]]),
      tc([[], [5, 7]], [[5, 7]], { hidden: true }),
      tc([[[1, 5]], [2, 3]], [[1, 5]], { hidden: true }),
    ],
    hints: [
      "Copy the intervals that end before the new one starts, then merge the overlapping run.",
      "An interval overlaps when `interval[0] <= newInterval[1] && newInterval[0] <= interval[1]`.",
    ],
  },
  {
    id: "house-robber", number: 89, title: "House Robber", difficulty: "MEDIUM" as D,
    topics: ["Dynamic Programming", "Arrays"],
    description:
      "`nums[i]` is the money in house `i`. Adjacent houses share an alarm, so you cannot rob two in a row.\n\nReturn the maximum amount you can rob.",
    examples: [
      { input: "nums = [1,2,3,1]", output: "4", explanation: "Rob house 0 and house 2." },
      { input: "nums = [2,7,9,3,1]", output: "12" },
    ],
    constraints: ["1 <= nums.length <= 100", "0 <= nums[i] <= 400"],
    functionName: "rob",
    starterCode: starter(
      "@param {number[]} nums\n * @return {number}",
      "rob", "nums", "nums: number[]", "number",
    ),
    testCases: [
      tc([[1, 2, 3, 1]], 4),
      tc([[2, 7, 9, 3, 1]], 12),
      tc([[5]], 5, { hidden: true }),
      tc([[2, 1, 1, 2]], 4, { hidden: true }),
    ],
    hints: [
      "At every house you either skip it, or take it plus the best result two houses back.",
      "Two rolling variables are enough — no array required.",
    ],
  },
  {
    id: "longest-increasing-subsequence", number: 90, title: "Longest Increasing Subsequence", difficulty: "MEDIUM" as D,
    topics: ["Dynamic Programming", "Binary Search", "Arrays"],
    description:
      "Return the length of the longest **strictly increasing** subsequence of `nums` (elements keep their relative order but need not be adjacent).",
    examples: [
      { input: "nums = [10,9,2,5,3,7,101,18]", output: "4", explanation: "[2,3,7,101]" },
      { input: "nums = [0,1,0,3,2,3]", output: "4" },
    ],
    constraints: ["1 <= nums.length <= 2500", "-10^4 <= nums[i] <= 10^4"],
    functionName: "lengthOfLIS",
    starterCode: starter(
      "@param {number[]} nums\n * @return {number}",
      "lengthOfLIS", "nums", "nums: number[]", "number",
    ),
    testCases: [
      tc([[10, 9, 2, 5, 3, 7, 101, 18]], 4),
      tc([[0, 1, 0, 3, 2, 3]], 4),
      tc([[7, 7, 7, 7]], 1, { hidden: true }),
      tc([[1, 2, 3, 4, 5]], 5, { hidden: true }),
    ],
    hints: [
      "The O(n²) DP: `best[i] = 1 + max(best[j])` over every `j < i` with `nums[j] < nums[i]`.",
      "Keeping a tail array and binary-searching where each value fits gives O(n log n).",
    ],
  },

  /* =========================================================== 91 – 94 */
  {
    id: "word-break", number: 91, title: "Word Break", difficulty: "MEDIUM" as D,
    topics: ["Dynamic Programming", "Strings", "Trie"],
    description:
      "Given a string `s` and a dictionary `wordDict`, return `true` if `s` can be segmented into a space-separated sequence of dictionary words.\n\nWords may be reused any number of times.",
    examples: [
      { input: 's = "leetcode", wordDict = ["leet","code"]', output: "true" },
      { input: 's = "applepenapple", wordDict = ["apple","pen"]', output: "true" },
    ],
    constraints: ["1 <= s.length <= 300", "1 <= wordDict.length <= 1000", "Words are lowercase and unique."],
    functionName: "wordBreak",
    starterCode: starter(
      "@param {string} s\n * @param {string[]} wordDict\n * @return {boolean}",
      "wordBreak", "s, wordDict", "s: string, wordDict: string[]", "boolean",
    ),
    testCases: [
      tc(["leetcode", ["leet", "code"]], true),
      tc(["applepenapple", ["apple", "pen"]], true),
      tc(["catsandog", ["cats", "dog", "sand", "and", "cat"]], false, { hidden: true }),
      tc(["a", ["b"]], false, { hidden: true }),
    ],
    hints: [
      "`reachable[i]` is true when the first `i` characters can be segmented.",
      "For every reachable prefix, mark `reachable[i + word.length]` for each dictionary word that matches.",
    ],
  },
  {
    id: "decode-ways", number: 92, title: "Decode Ways", difficulty: "MEDIUM" as D,
    topics: ["Dynamic Programming", "Strings"],
    description:
      "A message of digits maps to letters with `A` = `1` … `Z` = `26`. Given the digit string `s`, return the number of ways it can be decoded.",
    examples: [
      { input: 's = "12"', output: "2", explanation: '"AB" (1 2) or "L" (12)' },
      { input: 's = "226"', output: "3" },
    ],
    constraints: ["1 <= s.length <= 100", "`s` contains digits only and may contain leading zeros."],
    functionName: "numDecodings",
    starterCode: starter(
      "@param {string} s\n * @return {number}",
      "numDecodings", "s", "s: string", "number",
    ),
    testCases: [
      tc(["12"], 2),
      tc(["226"], 3),
      tc(["10"], 1, { hidden: true }),
      tc(["27"], 1, { hidden: true }),
    ],
    hints: [
      "`dp[i]` counts the ways to decode the first `i` characters.",
      "A single digit must be `1`–`9`; a pair must be `10`–`26`.",
    ],
  },
  {
    id: "maximum-product-subarray", number: 93, title: "Maximum Product Subarray", difficulty: "MEDIUM" as D,
    topics: ["Arrays", "Dynamic Programming"],
    description:
      "Given an integer array `nums`, return the largest product of any contiguous subarray.",
    examples: [
      { input: "nums = [2,3,-2,4]", output: "6", explanation: "[2,3]" },
      { input: "nums = [-2,0,-1]", output: "0" },
    ],
    constraints: ["1 <= nums.length <= 2 * 10^4", "-10 <= nums[i] <= 10", "The answer fits in a 32-bit integer."],
    functionName: "maxProduct",
    starterCode: starter(
      "@param {number[]} nums\n * @return {number}",
      "maxProduct", "nums", "nums: number[]", "number",
    ),
    testCases: [
      tc([[2, 3, -2, 4]], 6),
      tc([[-2, 0, -1]], 0),
      tc([[2, -5, -2, -4, 3]], 24, { hidden: true }),
      tc([[-5]], -5, { hidden: true }),
    ],
    hints: [
      "Track both the maximum and the minimum product ending at the current index.",
      "A very negative product can become the maximum after one more negative number.",
    ],
  },
  {
    id: "kth-largest-element-in-an-array", number: 94, title: "Kth Largest Element in an Array", difficulty: "MEDIUM" as D,
    topics: ["Arrays", "Sorting", "Heap", "Quickselect"],
    description:
      "Return the `k`-th largest element of `nums`.\n\nThis is the `k`-th largest in **sorted order**, not the `k`-th distinct value.",
    examples: [
      { input: "nums = [3,2,1,5,6,4], k = 2", output: "5" },
      { input: "nums = [3,2,3,1,2,4,5,5,6], k = 4", output: "4" },
    ],
    constraints: ["1 <= k <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
    functionName: "findKthLargest",
    starterCode: starter(
      "@param {number[]} nums\n * @param {number} k\n * @return {number}",
      "findKthLargest", "nums, k", "nums: number[], k: number", "number",
    ),
    testCases: [
      tc([[3, 2, 1, 5, 6, 4], 2], 5),
      tc([[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], 4),
      tc([[1], 1], 1, { hidden: true }),
      tc([[7, 6, 5, 4], 4], 4, { hidden: true }),
    ],
    hints: [
      "Sorting descending and indexing `k - 1` is O(n log n) and perfectly acceptable.",
      "Quickselect narrows the array around a pivot in average O(n) time.",
    ],
  },

  /* =========================================================== 95 – 98 */
  {
    id: "integer-break", number: 95, title: "Integer Break", difficulty: "MEDIUM" as D,
    topics: ["Math", "Dynamic Programming"],
    description:
      "Break `n` into the sum of at least **two** positive integers and return the maximum product of those parts.",
    examples: [
      { input: "n = 2", output: "1", explanation: "2 = 1 + 1, product 1" },
      { input: "n = 10", output: "36", explanation: "10 = 3 + 3 + 4, product 36" },
    ],
    constraints: ["2 <= n <= 58"],
    functionName: "integerBreak",
    starterCode: starter(
      "@param {number} n\n * @return {number}",
      "integerBreak", "n", "n: number", "number",
    ),
    testCases: [
      tc([2], 1),
      tc([10], 36),
      tc([3], 2, { hidden: true }),
      tc([8], 18, { hidden: true }),
    ],
    hints: [
      "Cutting a number into as many 3s as possible is optimal, except for small remainders.",
      "`dp[i] = max(j * (i - j), j * dp[i - j])` is the dynamic-programming version.",
    ],
  },
  {
    id: "perfect-squares", number: 96, title: "Perfect Squares", difficulty: "MEDIUM" as D,
    topics: ["Math", "Dynamic Programming", "Breadth-First Search"],
    description:
      "Given an integer `n`, return the **fewest** number of perfect squares that sum to `n`.",
    examples: [
      { input: "n = 12", output: "3", explanation: "12 = 4 + 4 + 4" },
      { input: "n = 13", output: "2", explanation: "13 = 4 + 9" },
    ],
    constraints: ["1 <= n <= 10^4"],
    functionName: "numSquares",
    starterCode: starter(
      "@param {number} n\n * @return {number}",
      "numSquares", "n", "n: number", "number",
    ),
    testCases: [
      tc([12], 3),
      tc([13], 2),
      tc([1], 1, { hidden: true }),
      tc([4], 1, { hidden: true }),
    ],
    hints: [
      "`dp[i] = 1 + min(dp[i - square])` over every square up to `i`.",
      "The answer is never above 4 — Legendre's three-square theorem explains why.",
    ],
  },
  {
    id: "minimum-path-sum", number: 97, title: "Minimum Path Sum", difficulty: "MEDIUM" as D,
    topics: ["Dynamic Programming", "Matrix"],
    description:
      "A robot in the top-left corner of a grid filled with non-negative numbers moves only right or down. Return the minimum sum of a path to the bottom-right corner.",
    examples: [
      { input: "grid = [[1,3,1],[1,5,1],[4,2,1]]", output: "7", explanation: "1 → 3 → 1 → 1 → 1" },
      { input: "grid = [[1,2,3],[4,5,6]]", output: "12" },
    ],
    constraints: ["1 <= m, n <= 200", "0 <= grid[i][j] <= 200"],
    functionName: "minPathSum",
    starterCode: starter(
      "@param {number[][]} grid\n * @return {number}",
      "minPathSum", "grid", "grid: number[][]", "number",
    ),
    testCases: [
      tc([[[1, 3, 1], [1, 5, 1], [4, 2, 1]]], 7),
      tc([[[1, 2, 3], [4, 5, 6]]], 12),
      tc([[[5]]], 5, { hidden: true }),
      tc([[[1, 2], [1, 1]]], 3, { hidden: true }),
    ],
    hints: [
      "Each cell takes its own value plus the cheaper of the cell above and the cell to the left.",
      "Only the previous row is needed, so a single array works.",
    ],
  },
  {
    id: "number-of-islands", number: 98, title: "Number of Islands", difficulty: "MEDIUM" as D,
    topics: ["Matrix", "Depth-First Search", "Breadth-First Search", "Union Find"],
    description:
      "`grid` contains `1`s (land) and `0`s (water). An island is land connected **horizontally or vertically**.\n\nReturn the number of islands.",
    examples: [
      { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: "1" },
      { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: "3" },
    ],
    constraints: ["1 <= m, n <= 300", "Every cell is `\"0\"` or `\"1\"`."],
    functionName: "numIslands",
    starterCode: starter(
      "@param {string[][]} grid\n * @return {number}",
      "numIslands", "grid", "grid: string[][]", "number",
    ),
    testCases: [
      tc([[["1", "1", "1", "1", "0"], ["1", "1", "0", "1", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "0", "0", "0"]]], 1),
      tc([[["1", "1", "0", "0", "0"], ["1", "1", "0", "0", "0"], ["0", "0", "1", "0", "0"], ["0", "0", "0", "1", "1"]]], 3),
      tc([[["0"]]], 0, { hidden: true }),
      tc([[["1"]]], 1, { hidden: true }),
    ],
    hints: [
      "Scan every cell; when you meet land, count an island and flood-fill everything connected to it.",
      "Mark visited land by rewriting it to `\"0\"` — no extra visited matrix needed.",
    ],
  },

  /* ========================================================== 99 – 102 */
  {
    id: "string-to-integer-atoi", number: 99, title: "String to Integer (atoi)", difficulty: "MEDIUM" as D,
    topics: ["Strings", "Simulation"],
    description:
      "Convert `s` to a 32-bit signed integer:\n\n1. skip leading whitespace\n2. read an optional `+` or `-`\n3. read digits until a non-digit appears\n4. clamp the result to `[-2^31, 2^31 - 1]` and return `0` when no digits were read",
    examples: [
      { input: 's = "42"', output: "42" },
      { input: 's = "   -42"', output: "-42" },
    ],
    constraints: ["0 <= s.length <= 200", "`s` may contain letters, digits, spaces, `+`, `-` and `.`."],
    functionName: "myAtoi",
    starterCode: starter(
      "@param {string} s\n * @return {number}",
      "myAtoi", "s", "s: string", "number",
    ),
    testCases: [
      tc(["42"], 42),
      tc(["   -42"], -42),
      tc(["4193 with words"], 4193, { hidden: true }),
      tc(["-91283472332"], -2147483648, { hidden: true }),
    ],
    hints: [
      "Handle one concern per loop: whitespace, then sign, then digits.",
      "Clamp with `Math.max(MIN, Math.min(MAX, value))` after the digits are read.",
    ],
  },
  {
    id: "count-and-say", number: 100, title: "Count and Say", difficulty: "MEDIUM" as D,
    topics: ["Strings", "Recursion"],
    description:
      "The count-and-say sequence starts at `\"1\"`. Each following term reads the previous one out loud: run lengths followed by the digit.\n\nGiven `n`, return the `n`-th term.",
    examples: [
      { input: "n = 1", output: '"1"' },
      { input: "n = 4", output: '"1211"', explanation: '1 → 11 → 21 → 1211' },
    ],
    constraints: ["1 <= n <= 30"],
    functionName: "countAndSay",
    starterCode: starter(
      "@param {number} n\n * @return {string}",
      "countAndSay", "n", "n: number", "string",
    ),
    testCases: [
      tc([1], "1"),
      tc([4], "1211"),
      tc([5], "111221", { hidden: true }),
      tc([6], "312211", { hidden: true }),
    ],
    hints: [
      "Scan the previous term, counting how long the current run of identical digits is.",
      "Append `count` then `digit` every time the run ends.",
    ],
  },
  {
    id: "longest-valid-parentheses", number: 101, title: "Longest Valid Parentheses", difficulty: "HARD" as D,
    topics: ["Strings", "Stack", "Dynamic Programming"],
    description:
      "Given a string containing only `(` and `)`, return the length of the **longest valid** (well-formed) parentheses substring.",
    examples: [
      { input: 's = "(()"', output: "2", explanation: 'The substring "()" is valid.' },
      { input: 's = ")()())"', output: "4" },
    ],
    constraints: ["0 <= s.length <= 3 * 10^4", "`s` contains only `(` and `)`."],
    functionName: "longestValidParentheses",
    starterCode: starter(
      "@param {string} s\n * @return {number}",
      "longestValidParentheses", "s", "s: string", "number",
    ),
    testCases: [
      tc(["(()"], 2),
      tc([")()())"], 4),
      tc([""], 0, { hidden: true }),
      tc(["()(()"], 2, { hidden: true }),
    ],
    hints: [
      "Push indices onto a stack and seed it with `-1` so the first match has a base.",
      "When a `)` has no matching `(`, use its index as the new base.",
    ],
  },
  {
    id: "first-missing-positive", number: 102, title: "First Missing Positive", difficulty: "HARD" as D,
    topics: ["Arrays", "Hash Table"],
    description:
      "Given an unsorted integer array `nums`, return the smallest **positive** integer that does not appear in it.\n\nYour algorithm must run in O(n) time and use O(1) extra space.",
    examples: [
      { input: "nums = [1,2,0]", output: "3" },
      { input: "nums = [3,4,-1,1]", output: "2" },
    ],
    constraints: ["1 <= nums.length <= 10^5", "-2^31 <= nums[i] <= 2^31 - 1"],
    functionName: "firstMissingPositive",
    starterCode: starter(
      "@param {number[]} nums\n * @return {number}",
      "firstMissingPositive", "nums", "nums: number[]", "number",
    ),
    testCases: [
      tc([[1, 2, 0]], 3),
      tc([[3, 4, -1, 1]], 2),
      tc([[7, 8, 9, 11, 12]], 1, { hidden: true }),
      tc([[1]], 2, { hidden: true }),
    ],
    hints: [
      "The answer is always between `1` and `n + 1`, so only values in that range matter.",
      "Swap each value into its own index slot (`value - 1`) to sort in place.",
    ],
  },

  /* ========================================================= 103 – 106 */
  {
    id: "edit-distance", number: 103, title: "Edit Distance", difficulty: "HARD" as D,
    topics: ["Dynamic Programming", "Strings"],
    description:
      "Given `word1` and `word2`, return the minimum number of single-character **insert**, **delete** or **replace** operations needed to turn `word1` into `word2`.",
    examples: [
      { input: 'word1 = "horse", word2 = "ros"', output: "3", explanation: "horse → rorse → rose → ros" },
      { input: 'word1 = "intention", word2 = "execution"', output: "5" },
    ],
    constraints: ["0 <= word1.length, word2.length <= 500", "Both words are lowercase English letters."],
    functionName: "minDistance",
    starterCode: starter(
      "@param {string} word1\n * @param {string} word2\n * @return {number}",
      "minDistance", "word1, word2", "word1: string, word2: string", "number",
    ),
    testCases: [
      tc(["horse", "ros"], 3),
      tc(["intention", "execution"], 5),
      tc(["", ""], 0, { hidden: true }),
      tc(["", "abc"], 3, { hidden: true }),
    ],
    hints: [
      "`dp[i][j]` is the distance between the first `i` and `j` characters.",
      "Equal characters cost `dp[i-1][j-1]`; otherwise it is 1 plus the cheapest of the three neighbours.",
    ],
  },
  {
    id: "largest-rectangle-in-histogram", number: 104, title: "Largest Rectangle in Histogram", difficulty: "HARD" as D,
    topics: ["Arrays", "Stack", "Monotonic Stack"],
    description:
      "`heights[i]` is the height of a bar of width `1`. Return the area of the largest rectangle that fits inside the histogram.",
    examples: [
      { input: "heights = [2,1,5,6,2,3]", output: "10", explanation: "The 5×2 rectangle spanning bars 2 and 3." },
      { input: "heights = [2,4]", output: "4" },
    ],
    constraints: ["1 <= heights.length <= 10^5", "0 <= heights[i] <= 10^4"],
    functionName: "largestRectangleArea",
    starterCode: starter(
      "@param {number[]} heights\n * @return {number}",
      "largestRectangleArea", "heights", "heights: number[]", "number",
    ),
    testCases: [
      tc([[2, 1, 5, 6, 2, 3]], 10),
      tc([[2, 4]], 4),
      tc([[1]], 1, { hidden: true }),
      tc([[5, 5, 5]], 15, { hidden: true }),
    ],
    hints: [
      "For each bar you need the nearest shorter bar on both sides.",
      "A monotonic stack gives those boundaries in one pass.",
    ],
  },
  {
    id: "sliding-window-maximum", number: 105, title: "Sliding Window Maximum", difficulty: "HARD" as D,
    topics: ["Arrays", "Sliding Window", "Deque", "Monotonic Queue"],
    description:
      "Given `nums` and a window size `k`, return the maximum of every window as it slides from left to right.",
    examples: [
      { input: "nums = [1,3,-1,-3,5,3,6,7], k = 3", output: "[3,3,5,5,6,7]" },
      { input: "nums = [1], k = 1", output: "[1]" },
    ],
    constraints: ["1 <= nums.length <= 10^5", "1 <= k <= nums.length", "-10^4 <= nums[i] <= 10^4"],
    functionName: "maxSlidingWindow",
    starterCode: starter(
      "@param {number[]} nums\n * @param {number} k\n * @return {number[]}",
      "maxSlidingWindow", "nums, k", "nums: number[], k: number", "number[]",
    ),
    testCases: [
      tc([[1, 3, -1, -3, 5, 3, 6, 7], 3], [3, 3, 5, 5, 6, 7]),
      tc([[1], 1], [1]),
      tc([[9, 11], 2], [11], { hidden: true }),
      tc([[4, -2], 2], [4], { hidden: true }),
    ],
    hints: [
      "The naive `max()` per window is O(n·k) — too slow at this size.",
      "Keep a deque of indices whose values decrease; the front is always the window's maximum.",
    ],
  },
  {
    id: "candy", number: 106, title: "Candy", difficulty: "HARD" as D,
    topics: ["Arrays", "Greedy"],
    description:
      "Children stand in a line with `ratings[i]`. Every child must receive at least one candy, and a child with a higher rating than a neighbour must receive more.\n\nReturn the minimum number of candies needed.",
    examples: [
      { input: "ratings = [1,0,2]", output: "5", explanation: "[2,1,2]" },
      { input: "ratings = [1,2,2]", output: "4", explanation: "[1,2,1]" },
    ],
    constraints: ["1 <= ratings.length <= 2 * 10^4", "0 <= ratings[i] <= 2 * 10^4"],
    functionName: "candy",
    starterCode: starter(
      "@param {number[]} ratings\n * @return {number}",
      "candy", "ratings", "ratings: number[]", "number",
    ),
    testCases: [
      tc([[1, 0, 2]], 5),
      tc([[1, 2, 2]], 4),
      tc([[1]], 1, { hidden: true }),
      tc([[1, 2, 3]], 6, { hidden: true }),
    ],
    hints: [
      "One left-to-right pass fixes the rising slopes, one right-to-left pass fixes the falling ones.",
      "Take the maximum of the two passes per child; summing that is the answer.",
    ],
  },

  /* ========================================================= 107 – 110 */
  {
    id: "n-queens-ii", number: 107, title: "N-Queens II", difficulty: "HARD" as D,
    topics: ["Backtracking", "Recursion"],
    description:
      "The n-queens puzzle places `n` queens on an `n × n` board so that no two attack each other.\n\nReturn the number of distinct solutions.",
    examples: [
      { input: "n = 1", output: "1" },
      { input: "n = 4", output: "2" },
    ],
    constraints: ["1 <= n <= 9"],
    functionName: "totalNQueens",
    starterCode: starter(
      "@param {number} n\n * @return {number}",
      "totalNQueens", "n", "n: number", "number",
    ),
    testCases: [
      tc([1], 1),
      tc([4], 2),
      tc([5], 10, { hidden: true }),
      tc([8], 92, { hidden: true }),
    ],
    hints: [
      "Place one queen per row and recurse into the next row.",
      "Track the used columns and both diagonals as sets — `row + col` and `row - col` identify them.",
    ],
  },
  {
    id: "word-search", number: 108, title: "Word Search", difficulty: "HARD" as D,
    topics: ["Matrix", "Backtracking", "Depth-First Search"],
    description:
      "Given a `board` of letters and a `word`, return `true` if the word can be built from **sequentially adjacent** cells (horizontally or vertically).\n\nThe same cell may not be used twice.",
    examples: [
      { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"', output: "true" },
      { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "SEE"', output: "true" },
    ],
    constraints: ["1 <= m, n <= 6", "1 <= word.length <= 15", "Cells hold a single uppercase letter."],
    functionName: "wordSearch",
    starterCode: starter(
      "@param {string[][]} board\n * @param {string} word\n * @return {boolean}",
      "wordSearch", "board, word", "board: string[][], word: string", "boolean",
    ),
    testCases: [
      tc([[["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], "ABCCED"], true),
      tc([[["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], "SEE"], true),
      tc([[["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]], "ABCB"], false, { hidden: true }),
      tc([[["a"]], "a"], true, { hidden: true }),
    ],
    hints: [
      "Try every cell as a starting point and walk the word with DFS.",
      "Mark the current cell as visited before recursing, then restore it afterwards.",
    ],
  },
  {
    id: "basic-calculator", number: 109, title: "Basic Calculator", difficulty: "HARD" as D,
    topics: ["Strings", "Stack", "Math"],
    description:
      "Evaluate a valid expression containing non-negative integers, `+`, `-`, `(`, `)` and spaces, and return its integer value.\n\nYou must not use `eval`.",
    examples: [
      { input: 's = "1 + 1"', output: "2" },
      { input: 's = " 2-1 + 2 "', output: "3" },
    ],
    constraints: ["1 <= s.length <= 3 * 10^5", "The expression is always valid."],
    functionName: "calculate",
    starterCode: starter(
      "@param {string} s\n * @return {number}",
      "calculate", "s", "s: string", "number",
    ),
    testCases: [
      tc(["1 + 1"], 2),
      tc([" 2-1 + 2 "], 3),
      tc(["(1+(4+5+2)-3)+(6+8)"], 23, { hidden: true }),
      tc(["2-(5-6)"], 3, { hidden: true }),
    ],
    hints: [
      "Keep a running result and a current sign, and push both onto a stack at `(`.",
      "Restore the previous result and sign after `)`, subtracting when the sign was negative.",
    ],
  },
  {
    id: "longest-palindromic-subsequence", number: 110, title: "Longest Palindromic Subsequence", difficulty: "HARD" as D,
    topics: ["Dynamic Programming", "Strings"],
    description:
      "Given a string `s`, return the length of the longest palindromic **subsequence** (characters keep their order but need not be adjacent).",
    examples: [
      { input: 's = "bbbab"', output: "4", explanation: '"bbbb"' },
      { input: 's = "cbbd"', output: "2" },
    ],
    constraints: ["1 <= s.length <= 1000", "`s` consists of lowercase English letters."],
    functionName: "longestPalindromeSubseq",
    starterCode: starter(
      "@param {string} s\n * @return {number}",
      "longestPalindromeSubseq", "s", "s: string", "number",
    ),
    testCases: [
      tc(["bbbab"], 4),
      tc(["cbbd"], 2),
      tc(["a"], 1, { hidden: true }),
      tc(["aaaa"], 4, { hidden: true }),
    ],
    hints: [
      "If the two end characters match, they are both part of the answer.",
      "Otherwise drop one end at a time and keep the better result.",
    ],
  },
];