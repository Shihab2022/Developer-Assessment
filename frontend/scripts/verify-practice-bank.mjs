#!/usr/bin/env node
/*
 * Practice-bank integrity checker.
 * Run from the repo root: `node frontend/scripts/verify-practice-bank.mjs`
 * Checks structure for every problem, then executes a bundled reference
 * solution through the same `new Function` evaluation the browser worker
 * uses and compares each case (exact / unordered, float epsilon).
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const problemsPath = path.join(scriptDir, "..", "src", "data", "practice-problems", "problems.ts");
const { PRACTICE_PROBLEMS } = require(problemsPath);


let failures = 0;
function fail(message) { failures += 1; console.error("FAIL  " + message); }
function ok(message) { console.log("ok    " + message); }

function deepEqual(a, b, epsilon = 1e-5) {
  if (a === b) return true;
  if (typeof a === "number" && typeof b === "number") {
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    return Math.abs(a - b) <= epsilon;
  }
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;
  const aIsArray = Array.isArray(a);
  const bIsArray = Array.isArray(b);
  if (aIsArray !== bIsArray) return false;
  if (aIsArray && bIsArray) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index], epsilon));
  }
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();
  if (aKeys.length !== bKeys.length) return false;
  if (aKeys.some((key, index) => key !== bKeys[index])) return false;
  return aKeys.every((key) => deepEqual(a[key], b[key], epsilon));
}
function compareForSort(a, b) {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return JSON.stringify(a ?? null).localeCompare(JSON.stringify(b ?? null));
}
function normalizeUnordered(value) {
  if (!Array.isArray(value)) return value;
  const children = value.map(normalizeUnordered);
  const sorted = children.map((item) => (Array.isArray(item) ? [...item].sort(compareForSort) : item));
  return [...sorted].sort(compareForSort);
}
function matchesExpected(actual, expected, mode = "exact") {
  if (mode === "unordered") return deepEqual(normalizeUnordered(actual), normalizeUnordered(expected));
  return deepEqual(actual, expected);
}
function evaluateSolution(code, functionName, args) {
  const factory = new Function(
    `"use strict";\n${code}\n;return typeof ${functionName} === "function" ? ${functionName} : undefined;`,
  );
  const fn = factory();
  if (typeof fn !== "function") throw new Error("no function named " + functionName);
  return fn(...args);
}
function toSnake(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9_]/g, "_")
    .toLowerCase();
}

const MIN_PROBLEMS = 100;
const VALID_DIFFICULTIES = new Set(["EASY", "MEDIUM", "HARD"]);

const ids = new Set();
const numbers = new Set();
let visible = 0;
let hidden = 0;

for (const problem of PRACTICE_PROBLEMS) {
  const label = problem.number + ". " + problem.id;
  if (ids.has(problem.id)) fail("duplicate id " + problem.id);
  ids.add(problem.id);
  if (numbers.has(problem.number)) fail("duplicate number " + problem.number);
  numbers.add(problem.number);
  if (!VALID_DIFFICULTIES.has(problem.difficulty)) fail(label + ": bad difficulty");
  if (!problem.title || !problem.description) fail(label + ": missing title/description");
  if (!Array.isArray(problem.examples) || problem.examples.length === 0) fail(label + ": no examples");
  if (!Array.isArray(problem.constraints) || problem.constraints.length === 0) fail(label + ": no constraints");
  if (!problem.functionName || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(problem.functionName)) fail(label + ": bad functionName");

  const starter = problem.starterCode ?? {};
  for (const lang of ["javascript", "typescript", "python"]) {
    if (typeof starter[lang] !== "string" || !starter[lang].trim()) fail(label + ": missing starterCode." + lang);
  }
  if (starter.javascript && !starter.javascript.includes("function " + problem.functionName + "(")) {
    fail(label + ": js starter lacks function");
  }
  if (starter.typescript && !starter.typescript.includes("function " + problem.functionName + "(")) {
    fail(label + ": ts starter lacks function");
  }
  const snake = toSnake(problem.functionName);
  if (starter.python && !starter.python.includes("def " + snake + "(")) {
    fail(label + ": python starter lacks def " + snake);
  }

  const cases = problem.testCases ?? [];
  if (cases.length < 2) fail(label + ": need at least 2 test cases");
  let seenVisible = 0;
  let seenHidden = 0;
  for (const testCase of cases) {
    if (!Array.isArray(testCase.args)) fail(label + ": test case args must be an array");
    try { JSON.stringify(testCase.expected); } catch { fail(label + ": expected is not JSON-safe"); }
    if (testCase.compareMode && testCase.compareMode !== "exact" && testCase.compareMode !== "unordered") {
      fail(label + ": bad compareMode");
    }
    if (testCase.isHidden) seenHidden += 1; else seenVisible += 1;
  }
  if (seenVisible === 0) fail(label + ": no visible cases");
  if (seenHidden === 0) fail(label + ": no hidden cases");
  visible += seenVisible;
  hidden += seenHidden;
}

if (PRACTICE_PROBLEMS.length < MIN_PROBLEMS) {
  fail("only " + PRACTICE_PROBLEMS.length + " problems, need 100+");
} else {
  ok(PRACTICE_PROBLEMS.length + " problems, " + visible + " visible + " + hidden + " hidden cases");
}



/* ---------------------------------------------------------------- references */

const REFERENCE_SOLUTIONS = {
/* 1-10 */
"two-sum": "function twoSum(nums, target) { const seen = new Map(); for (let i = 0; i < nums.length; i++) { const need = target - nums[i]; if (seen.has(need)) return [seen.get(need), i]; seen.set(nums[i], i); } }",
"valid-palindrome": "function isPalindrome(s) { const t = s.toLowerCase().replace(/[^a-z0-9]/g, ''); return t === [...t].reverse().join(''); }",
"fizz-buzz": "function fizzBuzz(n) { const out = []; for (let i = 1; i <= n; i++) out.push(i % 15 === 0 ? 'FizzBuzz' : i % 3 === 0 ? 'Fizz' : i % 5 === 0 ? 'Buzz' : String(i)); return out; }",
"reverse-string": "function reverseString(s) { return [...s].reverse().join(''); }",
"contains-duplicate": "function containsDuplicate(nums) { return new Set(nums).size !== nums.length; }",
"valid-anagram": "function isAnagram(s, t) { if (s.length !== t.length) return false; const c = {}; for (const ch of s) c[ch] = (c[ch] || 0) + 1; for (const ch of t) { if (!c[ch]) return false; c[ch]--; } return true; }",
"best-time-stock": "function maxProfit(prices) { let lo = Infinity, best = 0; for (const p of prices) { lo = Math.min(lo, p); best = Math.max(best, p - lo); } return best; }",
"move-zeroes": "function moveZeroes(nums) { const kept = nums.filter(x => x !== 0); const zeros = new Array(nums.length - kept.length).fill(0); return [...kept, ...zeros]; }",
"single-number": "function singleNumber(nums) { return nums.reduce((a, b) => a ^ b, 0); }",
"plus-one": "function plusOne(digits) { for (let i = digits.length - 1; i >= 0; i--) { if (digits[i] < 9) { digits[i]++; return digits; } digits[i] = 0; } return [1, ...digits]; }",
/* 11-20 */
"remove-duplicates-sorted": "function removeDuplicates(nums) { return [...new Set(nums)]; }",
"length-last-word": "function lengthOfLastWord(s) { return s.trim().split(/\\s+/).pop().length; }",
"roman-to-integer": "function romanToInt(s) { const v = {I:1,V:5,X:10,L:50,C:100,D:500,M:1000}; let t = 0; for (let i = 0; i < s.length; i++) t += v[s[i]] < v[s[i+1]] ? -v[s[i]] : v[s[i]]; return t; }",
"longest-common-prefix": "function longestCommonPrefix(strs) { if (!strs.length) return ''; let p = strs[0]; for (const s of strs) while (!s.startsWith(p)) p = p.slice(0, -1); return p; }",
"majority-element": "function majorityElement(nums) { let c = 0, m = 0; for (const x of nums) { if (c === 0) m = x; c += x === m ? 1 : -1; } return m; }",
"merge-sorted-array": "function mergeSorted(nums1, nums2) { return [...nums1, ...nums2].sort((a, b) => a - b); }",
"max-subarray": "function maxSubArray(nums) { let best = nums[0], cur = 0; for (const x of nums) { cur = Math.max(x, cur + x); best = Math.max(best, cur); } return best; }",
"product-except-self": "function productExceptSelf(nums) { const n = nums.length, out = new Array(n).fill(1); let l = 1; for (let i = 0; i < n; i++) { out[i] = l; l *= nums[i]; } let r = 1; for (let i = n - 1; i >= 0; i--) { out[i] *= r; r *= nums[i]; } return out; }",
"three-sum": "function threeSum(nums) { nums.sort((a, b) => a - b); const out = []; for (let i = 0; i < nums.length - 2; i++) { if (i > 0 && nums[i] === nums[i-1]) continue; let l = i + 1, r = nums.length - 1; while (l < r) { const s = nums[i] + nums[l] + nums[r]; if (s === 0) { out.push([nums[i], nums[l], nums[r]]); l++; r--; while (l < r && nums[l] === nums[l-1]) l++; while (l < r && nums[r] === nums[r+1]) r--; } else if (s < 0) l++; else r--; } } return out; }",
"longest-substring-no-repeat": "function lengthOfLongestSubstring(s) { const last = new Map(); let best = 0, lo = 0; for (let i = 0; i < s.length; i++) { if (last.has(s[i])) lo = Math.max(lo, last.get(s[i]) + 1); last.set(s[i], i); best = Math.max(best, i - lo + 1); } return best; }",
/* 21-30 */
"valid-parentheses": "function isValid(s) { const st = []; const m = {')':'(','}':'{',']':'['}; for (const c of s) { if (m[c]) { if (st.pop() !== m[c]) return false; } else st.push(c); } return st.length === 0; }",
"binary-search": "function search(nums, target) { let l = 0, r = nums.length - 1; while (l <= r) { const m = (l + r) >> 1; if (nums[m] === target) return m; if (nums[m] < target) l = m + 1; else r = m - 1; } return -1; }",
"climb-stairs": "function climbStairs(n) { let a = 1, b = 1; for (let i = 2; i <= n; i++) { const t = a + b; a = b; b = t; } return b; }",
"merge-intervals": "function merge(intervals) { if (!intervals.length) return []; intervals.sort((a, b) => a[0] - b[0]); const out = [intervals[0].slice()]; for (let i = 1; i < intervals.length; i++) { const last = out[out.length - 1]; if (intervals[i][0] <= last[1]) last[1] = Math.max(last[1], intervals[i][1]); else out.push(intervals[i].slice()); } return out; }",
"group-anagrams": "function groupAnagrams(strs) { const m = new Map(); for (const s of strs) { const k = [...s].sort().join(''); if (!m.has(k)) m.set(k, []); m.get(k).push(s); } return [...m.values()]; }",
"coin-change": "function coinChange(coins, amount) { const dp = new Array(amount + 1).fill(Infinity); dp[0] = 0; for (let i = 1; i <= amount; i++) for (const c of coins) if (c <= i) dp[i] = Math.min(dp[i], dp[i - c] + 1); return dp[amount] === Infinity ? -1 : dp[amount]; }",
"longest-palindromic-substring": "function longestPalindrome(s) { if (s.length < 2) return s; let best = s[0]; const expand = (l, r) => { while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; } return s.slice(l + 1, r); }; for (let i = 0; i < s.length; i++) { for (const cand of [expand(i, i), expand(i, i + 1)]) if (cand.length > best.length) best = cand; } return best; }",
"trap-rain-water": "function trap(height) { let l = 0, r = height.length - 1, lm = 0, rm = 0, t = 0; while (l < r) { if (height[l] < height[r]) { lm = Math.max(lm, height[l]); t += lm - height[l]; l++; } else { rm = Math.max(rm, height[r]); t += rm - height[r]; r--; } } return t; }",
"spiral-matrix": "function spiralOrder(matrix) { const out = []; let t = 0, b = matrix.length - 1, l = 0, r = matrix[0].length - 1; while (t <= b && l <= r) { for (let i = l; i <= r; i++) out.push(matrix[t][i]); t++; for (let i = t; i <= b; i++) out.push(matrix[i][r]); r--; if (t <= b) { for (let i = r; i >= l; i--) out.push(matrix[b][i]); b--; } if (l <= r) { for (let i = b; i >= t; i--) out.push(matrix[i][l]); l++; } } return out; }",
"median-two-sorted-arrays": "function findMedianSortedArrays(a, b) { const m = [...a, ...b].sort((x, y) => x - y); const n = m.length; return n % 2 ? m[(n - 1) / 2] : (m[n / 2 - 1] + m[n / 2]) / 2; }",
/* 31-40 */
"sqrt-x": "function mySqrt(x) { let lo = 0, hi = x; while (lo <= hi) { const m = (lo + hi) >> 1; const q = x / m || 0; if (m === q || (m < q && (m + 1) * (m + 1) > x)) { if (m * m <= x) return m; hi = m - 1; } else if (m < q) lo = m + 1; else hi = m - 1; } return lo; }",
"excel-sheet-column-number": "function titleToNumber(s) { let t = 0; for (const c of s) t = t * 26 + (c.charCodeAt(0) - 64); return t; }",
"isomorphic-strings": "function isIsomorphic(s, t) { const a = new Map(), b = new Map(); for (let i = 0; i < s.length; i++) { if ((a.has(s[i]) && a.get(s[i]) !== t[i]) || (b.has(t[i]) && b.get(t[i]) !== s[i])) return false; a.set(s[i], t[i]); b.set(t[i], s[i]); } return true; }",
"ransom-note": "function canConstruct(ransomNote, magazine) { const c = {}; for (const ch of magazine) c[ch] = (c[ch] || 0) + 1; for (const ch of ransomNote) { if (!c[ch]) return false; c[ch]--; } return true; }",
"word-pattern": "function wordPattern(pattern, s) { const w = s.split(' '); if (pattern.length !== w.length) return false; const a = new Map(), b = new Map(); for (let i = 0; i < pattern.length; i++) { if ((a.has(pattern[i]) && a.get(pattern[i]) !== w[i]) || (b.has(w[i]) && b.get(w[i]) !== pattern[i])) return false; a.set(pattern[i], w[i]); b.set(w[i], pattern[i]); } return true; }",
"first-unique-character-in-a-string": "function firstUniqChar(s) { const c = {}; for (const ch of s) c[ch] = (c[ch] || 0) + 1; for (let i = 0; i < s.length; i++) if (c[s[i]] === 1) return i; return -1; }",
"intersection-of-two-arrays": "function intersection(nums1, nums2) { const set = new Set(nums1); return [...new Set(nums2.filter(x => set.has(x)))]; }",
"missing-number": "function missingNumber(nums) { const n = nums.length; return (n * (n + 1)) / 2 - nums.reduce((a, b) => a + b, 0); }",
"add-binary": "function addBinary(a, b) { let i = a.length - 1, j = b.length - 1, carry = 0, out = ''; while (i >= 0 || j >= 0 || carry) { const s = (i >= 0 ? +a[i--] : 0) + (j >= 0 ? +b[j--] : 0) + carry; out = (s % 2) + out; carry = s > 1 ? 1 : 0; } return out; }",
"happy-number": "function isHappy(n) { const seen = new Set(); while (n !== 1 && !seen.has(n)) { seen.add(n); let s = 0; while (n > 0) { const d = n % 10; s += d * d; n = Math.floor(n / 10); } n = s; } return n === 1; }",
/* 41-50 */
"power-of-two": "function isPowerOfTwo(n) { return n > 0 && (n & (n - 1)) === 0; }",
"find-the-index-of-the-first-occurrence": "function strStr(haystack, needle) { return haystack.indexOf(needle); }",
"fibonacci-number": "function fib(n) { let a = 0, b = 1; for (let i = 0; i < n; i++) { const t = a + b; a = b; b = t; } return a; }",
"count-primes": "function countPrimes(n) { if (n < 2) return 0; const is = new Array(n).fill(true); is[0] = is[1] = false; for (let i = 2; i * i < n; i++) if (is[i]) for (let j = i * i; j < n; j += i) is[j] = false; return is.filter(Boolean).length; }",
"number-of-1-bits": "function hammingWeight(n) { let c = 0; while (n) { c += n & 1; n >>>= 1; } return c; }",
"reverse-bits": "function reverseBits(n) { let r = 0; for (let i = 0; i < 32; i++) { r = (r << 1) | (n & 1); n >>>= 1; } return r >>> 0; }",
"remove-element": "function removeElement(nums, val) { return nums.filter(x => x !== val); }",
"kids-with-the-greatest-number-of-candies": "function kidsWithCandies(candies, extraCandies) { const m = Math.max(...candies); return candies.map(c => c + extraCandies >= m); }",
"shuffle-the-array": "function shuffle(nums, n) { const out = []; for (let i = 0; i < n; i++) out.push(nums[i], nums[i + n]); return out; }",
"number-of-steps-to-reduce-a-number-to-zero": "function numberOfSteps(num) { let s = 0; while (num > 0) { num = num % 2 === 0 ? num / 2 : num - 1; s++; } return s; }",
/* 51-60 */
"running-sum-of-1d-array": "function runningSum(nums) { const out = []; let t = 0; for (const x of nums) { t += x; out.push(t); } return out; }",
"final-value-of-variable": "function finalValue(operations) { let x = 0; for (const op of operations) x += op.includes('+') ? 1 : -1; return x; }",
"richest-customer-wealth": "function maximumWealth(accounts) { return Math.max(...accounts.map(r => r.reduce((a, b) => a + b, 0))); }",
"defanging-an-ip-address": "function defangIPaddr(address) { return address.split('.').join('[.]'); }",
"goal-parser-interpretation": "function interpret(command) { return command.replace(/\\(\\)/g, 'o').replace(/\\(al\\)/g, 'al'); }",
"find-numbers-with-even-number-of-digits": "function findNumbers(nums) { return nums.filter(x => String(x).length % 2 === 0).length; }",
"count-of-matches-in-tournament": "function numberOfMatches(n) { return n - 1; }",
"to-lower-case": "function toLowerCase(s) { return s.toLowerCase(); }",
"number-of-good-pairs": "function numIdenticalPairs(nums) { let t = 0; const c = {}; for (const x of nums) { t += c[x] || 0; c[x] = (c[x] || 0) + 1; } return t; }",
"how-many-numbers-are-smaller-than-the-current-number": "function smallerNumbersThanCurrent(nums) { const sorted = [...nums].sort((a, b) => a - b); const first = new Map(); sorted.forEach((x, i) => { if (!first.has(x)) first.set(x, i); }); return nums.map(x => first.get(x)); }",
/* 61-70 */
"count-items-matching-a-rule": "function countMatches(items, ruleKey, ruleValue) { const col = { type: 0, color: 1, name: 2 }[ruleKey]; return items.filter(item => item[col] === ruleValue).length; }",
"sort-array-by-parity": "function sortArrayByParity(nums) { return [...nums.filter(x => x % 2 === 0), ...nums.filter(x => x % 2 !== 0)]; }",
"height-checker": "function heightChecker(heights) { const sorted = [...heights].sort((a, b) => a - b); let c = 0; for (let i = 0; i < heights.length; i++) if (heights[i] !== sorted[i]) c++; return c; }",
"maximum-product-of-two-elements-in-an-array": "function maxProduct(nums) { const s = [...nums].sort((a, b) => b - a); return (s[0] - 1) * (s[1] - 1); }",
"unique-number-of-occurrences": "function uniqueOccurrences(arr) { const c = {}; for (const x of arr) c[x] = (c[x] || 0) + 1; const v = Object.values(c); return new Set(v).size === v.length; }",
"can-place-flowers": "function canPlaceFlowers(flowerbed, n) { const b = [0, ...flowerbed, 0]; let c = 0; for (let i = 1; i < b.length - 1; i++) if (b[i - 1] === 0 && b[i] === 0 && b[i + 1] === 0) { b[i] = 1; c++; } return c >= n; }",
"number-complement": "function findComplement(num) { let mask = 1; while (mask < num) mask = (mask << 1) | 1; return mask ^ num; }",
"repeated-substring-pattern": "function repeatedSubstringPattern(s) { return (s + s).slice(1, -1).includes(s); }",
"add-digits": "function addDigits(num) { while (num >= 10) { let s = 0; while (num > 0) { s += num % 10; num = Math.floor(num / 10); } num = s; } return num; }",
"find-the-difference": "function findTheDifference(s, t) { let c = 0; for (const ch of s) c ^= ch.charCodeAt(0); for (const ch of t) c ^= ch.charCodeAt(0); return String.fromCharCode(c); }",
/* 71-80 */
"best-time-to-buy-and-sell-stock-ii": "function maxProfitII(prices) { let t = 0; for (let i = 1; i < prices.length; i++) if (prices[i] > prices[i - 1]) t += prices[i] - prices[i - 1]; return t; }",
"longest-consecutive-sequence": "function longestConsecutive(nums) { const set = new Set(nums); let best = 0; for (const x of set) { if (!set.has(x - 1)) { let cur = x, len = 1; while (set.has(cur + 1)) { cur++; len++; } best = Math.max(best, len); } } return best; }",
"top-k-frequent-elements": "function topKFrequent(nums, k) { const c = new Map(); for (const x of nums) c.set(x, (c.get(x) || 0) + 1); return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, k).map(e => e[0]); }",
"set-matrix-zeroes": "function setZeroes(matrix) { const rows = new Set(), cols = new Set(); for (let i = 0; i < matrix.length; i++) for (let j = 0; j < matrix[i].length; j++) if (matrix[i][j] === 0) { rows.add(i); cols.add(j); } return matrix.map((row, i) => row.map((v, j) => (rows.has(i) || cols.has(j) ? 0 : v))); }",
"rotate-image": "function rotate(matrix) { const n = matrix.length; return matrix.map((row, i) => row.map((_, j) => matrix[n - 1 - j][i])); }",
"container-with-most-water": "function maxArea(height) { let l = 0, r = height.length - 1, best = 0; while (l < r) { best = Math.max(best, Math.min(height[l], height[r]) * (r - l)); if (height[l] < height[r]) l++; else r--; } return best; }",
"sort-colors": "function sortColors(nums) { const c = [0, 0, 0]; for (const x of nums) c[x]++; return [...new Array(c[0]).fill(0), ...new Array(c[1]).fill(1), ...new Array(c[2]).fill(2)]; }",
"permutations": "function permute(nums) { const out = []; const go = (path, rest) => { if (!rest.length) { out.push(path); return; } for (let i = 0; i < rest.length; i++) go([...path, rest[i]], [...rest.slice(0, i), ...rest.slice(i + 1)]); }; go([], nums); return out; }",
"subsets": "function subsets(nums) { const out = [[]]; for (const x of nums) { const n = out.length; for (let i = 0; i < n; i++) out.push([...out[i], x]); } return out; }",
"combination-sum": "function combinationSum(candidates, target) { candidates.sort((a, b) => a - b); const out = []; const go = (start, rest, path) => { if (rest === 0) { out.push([...path]); return; } if (rest < 0) return; for (let i = start; i < candidates.length; i++) { path.push(candidates[i]); go(i, rest - candidates[i], path); path.pop(); } }; go(0, target, []); return out; }",
/* 81-90 */
"jump-game": "function canJump(nums) { let reach = 0; for (let i = 0; i < nums.length; i++) { if (i > reach) return false; reach = Math.max(reach, i + nums[i]); } return true; }",
"unique-paths": "function uniquePaths(m, n) { const row = new Array(n).fill(1); for (let i = 1; i < m; i++) for (let j = 1; j < n; j++) row[j] += row[j - 1]; return row[n - 1]; }",
"daily-temperatures": "function dailyTemperatures(temperatures) { const out = new Array(temperatures.length).fill(0); const st = []; for (let i = 0; i < temperatures.length; i++) { while (st.length && temperatures[i] > temperatures[st[st.length - 1]]) { const j = st.pop(); out[j] = i - j; } st.push(i); } return out; }",
"evaluate-reverse-polish-notation": "function evalRPN(tokens) { const st = []; for (const t of tokens) { if (t === '+' || t === '-' || t === '*' || t === '/') { const b = st.pop(), a = st.pop(); st.push(t === '+' ? a + b : t === '-' ? a - b : t === '*' ? a * b : Math.trunc(a / b)); } else st.push(Number(t)); } return st[0]; }",
"longest-repeating-character-replacement": "function characterReplacement(s, k) { const c = {}; let best = 0, lo = 0, mx = 0; for (let hi = 0; hi < s.length; hi++) { c[s[hi]] = (c[s[hi]] || 0) + 1; mx = Math.max(mx, c[s[hi]]); while (hi - lo + 1 - mx > k) { c[s[lo]]--; lo++; } best = Math.max(best, hi - lo + 1); } return best; }",
"find-all-anagrams-in-a-string": "function findAnagrams(s, p) { const out = []; if (p.length > s.length) return out; const need = new Array(26).fill(0), win = new Array(26).fill(0); const ci = c => c.charCodeAt(0) - 97; for (const c of p) need[ci(c)]++; for (let i = 0; i < s.length; i++) { win[ci(s[i])]++; if (i >= p.length) win[ci(s[i - p.length])]--; if (i >= p.length - 1 && win.every((v, j) => v === need[j])) out.push(i - p.length + 1); } return out; }",
"subarray-sum-equals-k": "function subarraySum(nums, k) { const seen = new Map([[0, 1]]); let sum = 0, t = 0; for (const x of nums) { sum += x; t += seen.get(sum - k) || 0; seen.set(sum, (seen.get(sum) || 0) + 1); } return t; }",
"insert-interval": "function insertInterval(intervals, newInterval) { const out = []; let i = 0; while (i < intervals.length && intervals[i][1] < newInterval[0]) out.push(intervals[i++]); while (i < intervals.length && intervals[i][0] <= newInterval[1]) { newInterval = [Math.min(newInterval[0], intervals[i][0]), Math.max(newInterval[1], intervals[i][1])]; i++; } out.push(newInterval); while (i < intervals.length) out.push(intervals[i++]); return out; }",
"house-robber": "function rob(nums) { let a = 0, b = 0; for (const x of nums) { const t = Math.max(b, a + x); a = b; b = t; } return b; }",
"longest-increasing-subsequence": "function lengthOfLIS(nums) { const tails = []; for (const x of nums) { let l = 0, r = tails.length; while (l < r) { const m = (l + r) >> 1; if (tails[m] < x) l = m + 1; else r = m; } tails[l] = x; } return tails.length; }",
/* 91-100 */
"word-break": "function wordBreak(s, wordDict) { const words = new Set(wordDict); const ok = new Array(s.length + 1).fill(false); ok[0] = true; for (let i = 0; i < s.length; i++) { if (!ok[i]) continue; for (const w of words) if (s.startsWith(w, i)) ok[i + w.length] = true; } return ok[s.length]; }",
"decode-ways": "function numDecodings(s) { if (s[0] === '0') return 0; let a = 1, b = 1; for (let i = 1; i < s.length; i++) { let cur = 0; if (s[i] !== '0') cur += b; const two = Number(s.slice(i - 1, i + 1)); if (two >= 10 && two <= 26) cur += a; a = b; b = cur; } return b; }",
"maximum-product-subarray": "function maxProduct(nums) { let mx = nums[0], mn = nums[0], best = nums[0]; for (let i = 1; i < nums.length; i++) { const x = nums[i]; const cands = [x, mx * x, mn * x]; mx = Math.max(...cands); mn = Math.min(...cands); best = Math.max(best, mx); } return best; }",
"kth-largest-element-in-an-array": "function findKthLargest(nums, k) { return [...nums].sort((a, b) => b - a)[k - 1]; }",
"integer-break": "function integerBreak(n) { const dp = new Array(n + 1).fill(1); for (let i = 3; i <= n; i++) { let best = 0; for (let j = 1; j < i; j++) best = Math.max(best, Math.max(j * (i - j), j * dp[i - j])); dp[i] = best; } return dp[n]; }",
"perfect-squares": "function numSquares(n) { const dp = new Array(n + 1).fill(Infinity); dp[0] = 0; for (let i = 1; i <= n; i++) for (let s = 1; s * s <= i; s++) dp[i] = Math.min(dp[i], dp[i - s * s] + 1); return dp[n]; }",
"minimum-path-sum": "function minPathSum(grid) { const m = grid.length, n = grid[0].length; for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) { if (i === 0 && j === 0) continue; if (i === 0) grid[i][j] += grid[i][j - 1]; else if (j === 0) grid[i][j] += grid[i - 1][j]; else grid[i][j] += Math.min(grid[i - 1][j], grid[i][j - 1]); } return grid[m - 1][n - 1]; }",
"number-of-islands": "function numIslands(grid) { if (!grid.length) return 0; const m = grid.length, n = grid[0].length; let t = 0; const go = (i, j) => { if (i < 0 || j < 0 || i >= m || j >= n || grid[i][j] !== '1') return; grid[i][j] = '0'; go(i + 1, j); go(i - 1, j); go(i, j + 1); go(i, j - 1); }; for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (grid[i][j] === '1') { t++; go(i, j); } return t; }",
"string-to-integer-atoi": "function myAtoi(s) { let i = 0, sign = 1, v = 0; while (s[i] === ' ') i++; if (s[i] === '+' || s[i] === '-') { sign = s[i] === '-' ? -1 : 1; i++; } while (i < s.length && s[i] >= '0' && s[i] <= '9') { v = v * 10 + (s.charCodeAt(i) - 48); i++; } v *= sign; return Math.max(-2147483648, Math.min(2147483647, v)); }",
"count-and-say": "function countAndSay(n) { let s = '1'; for (let k = 1; k < n; k++) { let next = '', c = 1; for (let i = 1; i <= s.length; i++) { if (s[i] === s[i - 1]) c++; else { next += c + s[i - 1]; c = 1; } } s = next; } return s; }",
/* 101-110 */
"longest-valid-parentheses": "function longestValidParentheses(s) { const st = [-1]; let best = 0; for (let i = 0; i < s.length; i++) { if (s[i] === '(') st.push(i); else { st.pop(); if (!st.length) st.push(i); else best = Math.max(best, i - st[st.length - 1]); } } return best; }",
"first-missing-positive": "function firstMissingPositive(nums) { const n = nums.length; for (let i = 0; i < n; i++) while (nums[i] > 0 && nums[i] <= n && nums[nums[i] - 1] !== nums[i]) { const j = nums[i] - 1; const t = nums[i]; nums[i] = nums[j]; nums[j] = t; } for (let i = 0; i < n; i++) if (nums[i] !== i + 1) return i + 1; return n + 1; }",
"edit-distance": "function minDistance(a, b) { const m = a.length, n = b.length; const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...new Array(n).fill(0)]); for (let j = 1; j <= n; j++) dp[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]); return dp[m][n]; }",
"largest-rectangle-in-histogram": "function largestRectangleArea(heights) { const h = [...heights, 0]; const st = []; let best = 0; for (let i = 0; i < h.length; i++) { while (st.length && h[i] < h[st[st.length - 1]]) { const top = st.pop(); const w = st.length ? i - st[st.length - 1] - 1 : i; best = Math.max(best, h[top] * w); } st.push(i); } return best; }",
"sliding-window-maximum": "function maxSlidingWindow(nums, k) { const dq = []; const out = []; for (let i = 0; i < nums.length; i++) { while (dq.length && dq[0] <= i - k) dq.shift(); while (dq.length && nums[dq[dq.length - 1]] <= nums[i]) dq.pop(); dq.push(i); if (i >= k - 1) out.push(nums[dq[0]]); } return out; }",
"candy": "function candy(ratings) { const n = ratings.length; const c = new Array(n).fill(1); for (let i = 1; i < n; i++) if (ratings[i] > ratings[i - 1]) c[i] = c[i - 1] + 1; for (let i = n - 2; i >= 0; i--) if (ratings[i] > ratings[i + 1]) c[i] = Math.max(c[i], c[i + 1] + 1); return c.reduce((a, b) => a + b, 0); }",
"n-queens-ii": "function totalNQueens(n) { let t = 0; const cols = new Set(), d1 = new Set(), d2 = new Set(); const go = (r) => { if (r === n) { t++; return; } for (let c = 0; c < n; c++) { if (cols.has(c) || d1.has(r + c) || d2.has(r - c)) continue; cols.add(c); d1.add(r + c); d2.add(r - c); go(r + 1); cols.delete(c); d1.delete(r + c); d2.delete(r - c); } }; go(0); return t; }",
"word-search": "function wordSearch(board, word) { const m = board.length, n = board[0].length; const go = (i, j, k) => { if (k === word.length) return true; if (i < 0 || j < 0 || i >= m || j >= n || board[i][j] !== word[k]) return false; const t = board[i][j]; board[i][j] = '#'; const ok = go(i + 1, j, k + 1) || go(i - 1, j, k + 1) || go(i, j + 1, k + 1) || go(i, j - 1, k + 1); board[i][j] = t; return ok; }; for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) if (go(i, j, 0)) return true; return false; }",
"basic-calculator": "function calculate(s) { let res = 0, num = 0, sign = 1; const st = []; for (const ch of s) { if (ch >= '0' && ch <= '9') num = num * 10 + (ch.charCodeAt(0) - 48); else if (ch === '+' || ch === '-') { res += sign * num; num = 0; sign = ch === '+' ? 1 : -1; } else if (ch === '(') { st.push(res, sign); res = 0; sign = 1; } else if (ch === ')') { res += sign * num; num = 0; res = st.pop() * res + st.pop(); } } return res + sign * num; }",
"longest-palindromic-subsequence": "function longestPalindromeSubseq(s) { const n = s.length; const dp = Array.from({ length: n }, () => new Array(n).fill(0)); for (let i = n - 1; i >= 0; i--) { dp[i][i] = 1; for (let j = i + 1; j < n; j++) dp[i][j] = s[i] === s[j] ? 2 + (dp[i + 1]?.[j - 1] ?? 0) : Math.max(dp[i + 1][j], dp[i][j - 1]); } return dp[0][n - 1]; }",
};

/* ------------------------------------------------------------------ runner */

/* ------------------------------------------------------------------ runner */

let checked = 0;
let solved = 0;
const missing = [];
for (const problem of PRACTICE_PROBLEMS) {
  const code = REFERENCE_SOLUTIONS[problem.id];
  if (!code) { missing.push(problem.id); continue; }
  let pass = true;
  for (const testCase of problem.testCases) {
    checked += 1;
    let actual;
    try {
      actual = evaluateSolution(code, problem.functionName, structuredClone(testCase.args));
    } catch (error) {
      fail(problem.id + " case " + JSON.stringify(testCase.args) + " threw: " + String(error?.message ?? error));
      pass = false;
      continue;
    }
    const mode = testCase.compareMode ?? "exact";
    if (!matchesExpected(actual, testCase.expected, mode)) {
      fail(problem.id + " case " + JSON.stringify(testCase.args) + ": got " + JSON.stringify(actual) + ", want " + JSON.stringify(testCase.expected));
      pass = false;
    }
  }
  if (pass) solved += 1;
}

ok(solved + "/" + (PRACTICE_PROBLEMS.length - missing.length) + " reference solutions pass all cases (" + checked + " checks)");
if (missing.length > 0) fail("no reference for: " + missing.join(", "));

/* ------------------------------------- python harness end-to-end (opt-in: --python) */
import fs from "node:fs";
import os from "node:os";
import { execFileSync } from "node:child_process";

if (process.argv.includes("--python")) {
  // Transpile the (dependency-light) harness module so plain node can load it,
  // using the project's own TypeScript compiler API.
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "py-harness-"));
  const ts = require(path.join(scriptDir, "..", "node_modules", "typescript"));
  const program = ts.createProgram(
    ["src/lib/practice/python.ts", "src/lib/practice/compare.ts"].map((f) =>
      path.join(scriptDir, "..", f),
    ),
    {
      outDir: tmpDir, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      moduleResolution: ts.ModuleResolutionKind.NodeJs, skipLibCheck: true,
    },
  );
  program.emit();
  const { buildPythonHarness, parsePythonResults } = require(path.join(tmpDir, "python.js"));

  const runProgram = (text) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "py-run-"));
    try {
      const file = path.join(dir, "run.py");
      fs.writeFileSync(file, text);
      try {
        return execFileSync("python", [file], {
          encoding: "utf8", timeout: 30000,
          // Python echoes tracebacks for intentionally broken snippets.
          stdio: ["ignore", "pipe", "ignore"],
        });
      } catch (error) {
        // A syntax error aborts before any harness line is printed.
        return String(error?.stdout ?? "");
      }
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  };
  const casesFor = (problem) => problem.testCases.map((t, i) => ({
    index: i, args: t.args, expected: t.expected,
    compareMode: t.compareMode ?? "exact", isHidden: Boolean(t.isHidden),
  }));

  // Harness behaviours the happy-path solutions cannot cover.
  const EDGE = {
    noisy: { // unrelated prints must not break parsing and must surface as output
      code: "def two_sum(nums, target):\n    print('thinking')\n    return [0, 1]\n",
      expectPassed: [true, false, true, false], expectOutputHas: "thinking",
    },
    camel: { // camelCase name tolerated when the snake_case one is missing
      code: "def twoSum(nums, target):\n    return [0, 1]\n",
      expectPassed: [true, false, true, false],
    },
    raises: { // a per-case exception is reported per case, not fatal to the run
      code: "def two_sum(nums, target):\n    raise ValueError('nope')\n",
      expectPassed: [false, false, false, false], expectErrorHas: "ValueError",
    },
    fatal: { // no matching function at all -> fatal error for every case
      code: "def something_else(nums, target):\n    return [0, 1]\n", expectFatal: true,
    },
    syntax: { // a syntax error means nothing runs, so every case fails
      code: "def two_sum(nums, target)\n    return [0, 1]\n", expectNonePassed: true,
    },
    stale: { // a stale definition from a previous run is cleared before running
      prelude: "two_sum = lambda nums, target: [9, 9]\n", code: "x = 1\n", expectFatal: true,
    },
  };

  const twoSum = PRACTICE_PROBLEMS.find((p) => p.id === "two-sum");
  const edgeCases = casesFor(twoSum);
  for (const [name, edge] of Object.entries(EDGE)) {
    const text = (edge.prelude ?? "") + buildPythonHarness({
      code: edge.code, functionName: twoSum.functionName, cases: edgeCases,
    });
    const stdout = runProgram(text);
    const parsed = parsePythonResults(stdout.split("\n").map((t) => ({ level: "log", text: t })), edgeCases);
    if (edge.expectFatal) {
      if (!parsed.fatal || !parsed.fatal.includes("two_sum")) {
        fail(name + " (py): expected a fatal error naming two_sum, got " + JSON.stringify(parsed.fatal));
      }
      continue;
    }
    if (edge.expectNonePassed) {
      if (parsed.results.some((r) => r.passed)) fail(name + " (py): expected every case to fail");
      continue;
    }
    if (parsed.fatal) { fail(name + " (py): unexpected fatal " + parsed.fatal); continue; }
    const got = parsed.results.map((r) => r.passed);
    if (edge.expectPassed && !got.every((v, i) => v === edge.expectPassed[i])) {
      fail(name + " (py): pass pattern " + JSON.stringify(got) + ", want " + JSON.stringify(edge.expectPassed));
    }
    if (edge.expectOutputHas && !parsed.output.some((line) => line.includes(edge.expectOutputHas))) {
      fail(name + " (py): expected an output line containing " + JSON.stringify(edge.expectOutputHas));
    }
    if (edge.expectErrorHas && !parsed.results.some((r) => (r.error ?? "").includes(edge.expectErrorHas))) {
      fail(name + " (py): expected a per-case error containing " + JSON.stringify(edge.expectErrorHas));
    }
  }
  ok("python harness: exercised prints, camelCase, raising, fatal, syntax and stale cases");

  const SOLUTIONS = {
    "two-sum": "def two_sum(nums, target):\n    seen = {}\n    for i, x in enumerate(nums):\n        if target - x in seen:\n            return [seen[target - x], i]\n        seen[x] = i\n",
    "reverse-string": "def reverse_string(s):\n    return s[::-1]\n",
    "fizz-buzz": "def fizz_buzz(n):\n    out = []\n    for i in range(1, n + 1):\n        s = ''\n        if i % 3 == 0:\n            s += 'Fizz'\n        if i % 5 == 0:\n            s += 'Buzz'\n        out.append(s or str(i))\n    return out\n",
    "valid-palindrome": "def is_palindrome(s):\n    import re\n    t = re.sub(r'[^a-z0-9]', '', s.lower())\n    return t == t[::-1]\n",
    "missing-number": "def missing_number(nums):\n    n = len(nums)\n    return n * (n + 1) // 2 - sum(nums)\n",
  };

  const ids = Object.keys(SOLUTIONS);
  const runDir = fs.mkdtempSync(path.join(os.tmpdir(), "py-run-"));
  let pyChecked = 0;
  for (const id of ids) {
    const problem = PRACTICE_PROBLEMS.find((p) => p.id === id);
    const cases = problem.testCases.map((t, i) => ({
      index: i, args: t.args, expected: t.expected,
      compareMode: t.compareMode ?? "exact", isHidden: Boolean(t.isHidden),
    }));
    const program = buildPythonHarness({ code: SOLUTIONS[id], functionName: problem.functionName, cases });
    const file = path.join(runDir, id + ".py");
    fs.writeFileSync(file, program);
    const stdout = execFileSync("python", [file], { encoding: "utf8", timeout: 30000 });
    const logs = stdout.split("\n").map((text) => ({ level: "log", text }));
    const parsed = parsePythonResults(logs, cases);
    if (parsed.fatal) { fail(id + " (py): fatal " + parsed.fatal); continue; }
    for (const r of parsed.results) {
      pyChecked += 1;
      const testCase = cases[r.index];
      if (!matchesExpected(r.actual, testCase.expected, testCase.compareMode)) {
        fail(id + " (py) case " + JSON.stringify(testCase.args) + ": got " + JSON.stringify(r.actual));
      }
    }
  }
  ok("python harness: " + ids.length + " solutions, " + pyChecked + " cases executed by real Python");
  fs.rmSync(runDir, { recursive: true, force: true });
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

/* ------------------------------------------------------------------ summary */

if (failures > 0) {
  console.error("\n" + failures + " failure(s)");
  process.exit(1);
}
console.log("\nAll practice-bank checks passed.");












