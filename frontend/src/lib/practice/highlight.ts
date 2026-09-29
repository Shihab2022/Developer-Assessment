/**
 * Tiny, dependency-free tokenizer for code samples.
 *
 * Problem examples, constraints and hints are short snippets in a mix of
 * JavaScript, Python and plain notation (`nums = [2,7,11,15], target = 9`).
 * Pulling in a full highlighter (Shiki/Prism) for a handful of one-liners would
 * cost hundreds of kilobytes, so this scanner recognises just enough grammar to
 * colour them: comments, strings, numbers, keywords, calls, properties and
 * punctuation.
 *
 * It never produces HTML — callers render the tokens as React elements, which
 * keeps problem data impossible to inject markup with.
 */

export type TokenKind =
  | "plain"
  | "comment"
  | "string"
  | "number"
  | "keyword"
  | "boolean"
  | "constant"
  | "call"
  | "property"
  | "operator"
  | "punctuation";

export interface Token {
  kind: TokenKind;
  value: string;
}

/** Reserved words across the languages the arena accepts. */
const KEYWORDS = new Set([
  "const", "let", "var", "function", "return", "if", "else", "for", "while",
  "do", "switch", "case", "break", "continue", "new", "class", "extends",
  "this", "super", "try", "catch", "finally", "throw", "typeof", "instanceof",
  "in", "of", "await", "async", "yield", "import", "export", "from", "as",
  "default", "static", "get", "set", "def", "elif", "lambda", "pass", "raise",
  "with", "global", "not", "and", "or", "is", "del", "assert", "select",
  "where", "group", "order", "by", "join", "left", "inner", "having", "limit",
  "insert", "into", "values", "update", "delete", "create", "table", "index",
]);

/** Literal keywords (`true`, `null`, `None`, …) rendered in their own colour. */
const LITERALS = new Set([
  "true", "false", "null", "undefined", "None", "True", "False", "NULL",
  "Infinity", "NaN",
]);

/** Well-known globals and built-ins that read better in the "constant" colour. */
const CONSTANTS = new Set([
  "Math", "Number", "String", "Array", "Object", "Map", "Set", "JSON",
  "Promise", "Date", "RegExp", "BigInt", "Symbol", "console", "Integer",
  "float", "int", "str", "list", "dict", "len", "range", "sorted", "sum",
  "min", "max", "abs", "print",
]);

const IDENTIFIER_START = /[A-Za-z_$]/;
const IDENTIFIER_PART = /[A-Za-z0-9_$]/;

/**
 * Splits a snippet into coloured tokens.
 *
 * Whitespace is preserved as `plain` tokens so callers keep the exact spacing
 * of the original text.
 */
export function tokenizeCode(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  const push = (kind: TokenKind, value: string) => {
    if (!value) return;
    const last = tokens[tokens.length - 1];
    // Merge adjacent plain runs so the rendered tree stays shallow.
    if (kind === "plain" && last && last.kind === "plain") last.value += value;
    else tokens.push({ kind, value });
  };

  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];

    // Line comments: //, # and -- (SQL).
    if ((char === "/" && next === "/") || char === "#" || (char === "-" && next === "-")) {
      const end = source.indexOf("\n", index);
      const stop = end === -1 ? source.length : end;
      push("comment", source.slice(index, stop));
      index = stop;
      continue;
    }

    // Block comments.
    if (char === "/" && next === "*") {
      const end = source.indexOf("*/", index + 2);
      const stop = end === -1 ? source.length : end + 2;
      push("comment", source.slice(index, stop));
      index = stop;
      continue;
    }

    // Strings (single, double, backtick) with simple escape handling.
    if (char === '"' || char === "'" || char === "`") {
      let cursor = index + 1;
      while (cursor < source.length) {
        if (source[cursor] === "\\") cursor += 2;
        else if (source[cursor] === char) break;
        else cursor += 1;
      }
      push("string", source.slice(index, Math.min(cursor + 1, source.length)));
      index = cursor + 1;
      continue;
    }

    // Numbers, including decimals and scientific notation.
    if (DIGIT.test(char)) {
      let cursor = index;
      while (cursor < source.length && /[0-9._eE+-]/.test(source[cursor] ?? "")) {
        // Only continue on +/- when it directly follows an exponent marker.
        const previous = source[cursor - 1];
        if (
          (source[cursor] === "+" || source[cursor] === "-") &&
          previous !== "e" &&
          previous !== "E"
        ) {
          break;
        }
        cursor += 1;
      }
      push("number", source.slice(index, cursor));
      index = cursor;
      continue;
    }

    // Identifiers, keywords, literals and function calls.
    if (IDENTIFIER_START.test(char)) {
      let cursor = index;
      while (cursor < source.length && IDENTIFIER_PART.test(source[cursor] ?? "")) cursor += 1;
      const word = source.slice(index, cursor);
      const isCall = /^\s*\(/.test(source.slice(cursor));

      if (KEYWORDS.has(word)) push("keyword", word);
      else if (LITERALS.has(word)) push("boolean", word);
      else if (CONSTANTS.has(word)) push("constant", word);
      else if (isCall) push("call", word);
      else if (source[cursor] === "." || source[index - 1] === ".") push("property", word);
      else push("plain", word);

      index = cursor;
      continue;
    }

    if (OPERATORS.includes(char)) {
      // Collapse multi-character operators (`===`, `->`, `=>`, `<=`, …).
      let cursor = index;
      while (
        cursor < source.length &&
        OPERATORS.includes(source[cursor] ?? "") &&
        cursor - index < 2
      ) {
        cursor += 1;
      }
      push("operator", source.slice(index, cursor));
      index = cursor;
      continue;
    }

    if ("(){}[]".includes(char)) {
      push("punctuation", char);
      index += 1;
      continue;
    }

    if (char === "," || char === ";" || char === ":") {
      push("punctuation", char);
      index += 1;
      continue;
    }

    push("plain", char);
    index += 1;
  }

  return tokens;
}

/** Tailwind colour per token kind, theme-aware. */
export const TOKEN_CLASSES: Record<TokenKind, string> = {
  plain: "text-slate-800 dark:text-slate-100",
  comment: "italic text-slate-400 dark:text-slate-500",
  string: "text-emerald-700 dark:text-emerald-300",
  number: "text-amber-700 dark:text-amber-300",
  keyword: "text-violet-700 dark:text-violet-300",
  boolean: "text-sky-700 dark:text-sky-300",
  constant: "text-fuchsia-700 dark:text-fuchsia-300",
  call: "text-blue-700 dark:text-blue-300",
  property: "text-rose-700 dark:text-rose-300",
  operator: "text-slate-500 dark:text-slate-400",
  punctuation: "text-slate-400 dark:text-slate-500",
};

const DIGIT = /[0-9]/;
const OPERATORS = "+-*/%=<>!&|^~?:";
