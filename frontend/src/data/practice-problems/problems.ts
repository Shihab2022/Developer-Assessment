import type { Difficulty, PracticeProblem, PracticeTestCase } from "@/lib/practice/types";

/**
 * Generates starter code for both languages from a function signature.
 * Keeps each problem definition down to a single `starter(...)` call.
 */
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
];