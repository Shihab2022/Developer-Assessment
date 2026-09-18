/**
 * Lightweight TypeScript → JavaScript stripper.
 *
 * WHY THIS EXISTS
 * The practice runner executes user code in a browser Web Worker, which only
 * understands JavaScript. Pulling the full `typescript` compiler into a client
 * bundle costs several megabytes, so instead we strip the TypeScript *syntax*
 * that appears in algorithm solutions.
 *
 * SUPPORTED
 * Parameter / return type annotations, optional parameters, variable
 * annotations, `interface` and `type` declarations, `enum` (converted to an
 * object), access modifiers, `readonly` / `abstract`, generic parameter lists,
 * `as` casts, `satisfies`, and non-null assertions.
 *
 * NOT SUPPORTED
 * `namespace` / `module` blocks, decorators, declaration merging and
 * angle-bracket casts (`<T>value`). Use JavaScript for those.
 */

/** Skips a quoted string or template literal, returning the index after it. */
function skipString(code: string, start: number): number {
  const quote = code[start];
  let i = start + 1;

  while (i < code.length) {
    const char = code[i];
    if (char === "\\") {
      i += 2;
      continue;
    }
    if (char === quote) return i + 1;
    // Template literal `${ ... }` — skip the balanced interpolation.
    if (quote === "`" && char === "$" && code[i + 1] === "{") {
      i = skipBalanced(code, i + 1, "{", "}") + 1;
      continue;
    }
    i += 1;
  }
  return code.length;
}

/** Skips a `//` or `/* *` comment starting at `start` (returns `start` if none). */
function skipComment(code: string, start: number): number {
  if (code[start] !== "/") return start;
  const next = code[start + 1];
  if (next === "/") {
    const end = code.indexOf("\n", start);
    return end === -1 ? code.length : end;
  }
  if (next === "*") {
    const end = code.indexOf("*/", start + 2);
    return end === -1 ? code.length : end + 2;
  }
  return start;
}

/** Index of the delimiter that closes the one at `start`. */
function skipBalanced(code: string, start: number, open: string, close: string): number {
  let depth = 0;
  let i = start;

  while (i < code.length) {
    const char = code[i]!;
    if (char === '"' || char === "'" || char === "`") {
      i = skipString(code, i);
      continue;
    }
    const afterComment = skipComment(code, i);
    if (afterComment !== i) {
      i = afterComment;
      continue;
    }
    if (char === open) depth += 1;
    if (char === close) {
      depth -= 1;
      if (depth === 0) return i;
    }
    i += 1;
  }
  return code.length;
}

const isIdentChar = (char: string | undefined): boolean =>
  Boolean(char) && /[A-Za-z0-9_$]/.test(char!);

/** Removes `interface X { ... }` and bare `interface X extends Y;` declarations. */
function stripInterfaces(code: string): string {
  let out = "";
  let i = 0;

  while (i < code.length) {
    if (code.startsWith("interface", i) && !isIdentChar(code[i - 1]) && !isIdentChar(code[i + 9])) {
      const braceStart = code.indexOf("{", i);
      const semi = code.indexOf(";", i);
      const newline = code.indexOf("\n", i);
      const bodyless =
        braceStart === -1 ||
        (semi !== -1 && semi < braceStart) ||
        (newline !== -1 && newline < braceStart);

      if (bodyless) {
        const stop = semi !== -1 && (newline === -1 || semi < newline) ? semi + 1 : newline === -1 ? code.length : newline + 1;
        out += "\n";
        i = stop;
        continue;
      }

      const braceEnd = skipBalanced(code, braceStart, "{", "}");
      out += "\n";
      i = braceEnd + 1;
      if (code[i] === ";") i += 1;
      continue;
    }
    const next = advance(code, i);
    if (next !== i) {
      out += code.slice(i, next);
      i = next;
      continue;
    }
    out += code[i];
    i += 1;
  }
  return out;
}

/** Removes `type X = ...;` aliases, allowing multi-line unions. */
function stripTypeAliases(code: string): string {
  let out = "";
  let i = 0;

  while (i < code.length) {
    const isAlias =
      code.startsWith("type", i) && !isIdentChar(code[i - 1]) && !isIdentChar(code[i + 4]);

    if (isAlias) {
      let j = i + 4;
      while (j < code.length && /\s/.test(code[j]!)) j += 1;
      while (j < code.length && isIdentChar(code[j])) j += 1;
      while (j < code.length && /\s/.test(code[j]!)) j += 1;

      if (code[j] === "=") {
        j += 1;
        let depth = 0;
        while (j < code.length) {
          const char = code[j]!;
          const next = advance(code, j);
          if (next !== j) {
            j = next;
            continue;
          }
          if (char === "{" || char === "<" || char === "(" || char === "[") depth += 1;
          if (char === "}" || char === ">" || char === ")" || char === "]") depth -= 1;
          if (depth <= 0 && char === ";") break;
          if (depth <= 0 && char === "\n" && !/^[|&]/.test(code.slice(j + 1).trimStart())) break;
          j += 1;
        }
        out += "\n";
        i = code[j] === ";" ? j + 1 : j;
        continue;
      }
    }

    const next = advance(code, i);
    if (next !== i) {
      out += code.slice(i, next);
      i = next;
      continue;
    }
    out += code[i];
    i += 1;
  }
  return out;
}

/** Converts `enum X { A, B = 5 }` into a plain object. */
function stripEnums(code: string): string {
  let out = "";
  let i = 0;

  while (i < code.length) {
    const isEnum = code.startsWith("enum", i) && !isIdentChar(code[i - 1]) && !isIdentChar(code[i + 4]);

    if (isEnum) {
      let j = i + 4;
      while (j < code.length && /\s/.test(code[j]!)) j += 1;
      const nameStart = j;
      while (j < code.length && isIdentChar(code[j])) j += 1;
      const name = code.slice(nameStart, j);
      while (j < code.length && /\s/.test(code[j]!)) j += 1;

      if (name && code[j] === "{") {
        const braceEnd = skipBalanced(code, j, "{", "}");
        const entries: string[] = [];
        let nextNumeric = 0;

        for (const rawEntry of code.slice(j + 1, braceEnd).split(",")) {
          const entry = rawEntry.trim();
          if (!entry) continue;
          const eq = entry.indexOf("=");
          const key = (eq === -1 ? entry : entry.slice(0, eq)).trim();
          if (!key) continue;
          const rawValue = eq === -1 ? String(nextNumeric) : entry.slice(eq + 1).trim();
          const numeric = Number(rawValue);
          entries.push(`${JSON.stringify(key)}: ${Number.isNaN(numeric) ? JSON.stringify(rawValue) : numeric}`);
          nextNumeric = Number.isNaN(numeric) ? nextNumeric + 1 : numeric + 1;
        }

        out += `const ${name} = { ${entries.join(", ")} };`;
        i = braceEnd + 1;
        continue;
      }
    }

    const next = advance(code, i);
    if (next !== i) {
      out += code.slice(i, next);
      i = next;
      continue;
    }
    out += code[i];
    i += 1;
  }
  return out;
}


/** Walks `code` from `start` skipping strings and comments. */
function advance(code: string, i: number): number {
  const char = code[i]!;
  if (char === '"' || char === "'" || char === "`") return skipString(code, i);
  return skipComment(code, i);
}


/** Index where a type expression starting at `start` ends. */
function typeEnd(code: string, start: number): number {
  let i = start;
  let depth = 0;
  let firstNonSpace = "";

  while (i < code.length) {
    const char = code[i]!;
    const skipped = advance(code, i);
    if (skipped !== i) {
      i = skipped;
      continue;
    }

    if (!firstNonSpace && !/\s/.test(char)) firstNonSpace = char;

    // An object type (`: { a: number }`) belongs to the annotation.
    if (char === "{" && depth === 0 && firstNonSpace !== "{") return i;

    if (char === "{" || char === "(" || char === "[" || char === "<") {
      depth += 1;
      i += 1;
      continue;
    }
    if (char === "}" || char === ")" || char === "]" || char === ">") {
      if (depth === 0) return i;
      depth -= 1;
      i += 1;
      continue;
    }
    if (depth === 0 && (char === "," || char === ";" || char === "=" || char === "\n")) return i;
    i += 1;
  }
  return i;
}

/** Strips `private` / `public` / `protected` / `readonly` / `abstract` / `declare`. */
function stripModifiers(code: string): string {
  return code.replace(/\b(private|public|protected|readonly|abstract|declare)\s+/g, "");
}

/** Removes `as Type` assertions and `satisfies Type` clauses. */
function stripAsCasts(code: string): string {
  let out = "";
  let i = 0;

  while (i < code.length) {
    const isAs = code.startsWith("as", i) && !isIdentChar(code[i - 1]) && !isIdentChar(code[i + 2]);

    if (isAs) {
      let j = i + 2;
      // `as const` is two tokens; anything else is a type expression.
      const constMatch = code.slice(j).match(/^\s+const\b/);
      if (constMatch) {
        out += " ";
        i = j + constMatch[0].length;
        continue;
      }
      if (/\s/.test(code[j]!)) {
        const end = typeEnd(code, j);
        out += " ";
        i = end;
        continue;
      }
    }

    const skipped = advance(code, i);
    if (skipped !== i) {
      out += code.slice(i, skipped);
      i = skipped;
      continue;
    }
    out += code[i];
    i += 1;
  }
  return out;
}

/** Removes generics on declarations and calls: `new Map<K, V>()`, `f<T>(x)`. */
function stripGenerics(code: string): string {
  let out = "";
  let i = 0;

  while (i < code.length) {
    const char = code[i]!;
    const skipped = advance(code, i);
    if (skipped !== i) {
      out += code.slice(i, skipped);
      i = skipped;
      continue;
    }

    // A generic list is `<...>` glued to a preceding identifier and followed by
    // a call or bracket — which is what keeps `a < b` comparisons safe.
    if (char === "<" && isIdentChar(code[i - 1])) {
      const close = skipBalanced(code, i, "<", ">");
      if (close < code.length) {
        const inner = code.slice(i + 1, close);
        const looksLikeTypes = !/&&|\|\||;/.test(inner) && /^[\s\w$<>,[\]|&?.:'"()-]*$/.test(inner);
        let after = close + 1;
        while (after < code.length && /\s/.test(code[after]!)) after += 1;
        const nextChar = code[after];

        if (looksLikeTypes && nextChar && "().[,;{}".includes(nextChar)) {
          i = close + 1;
          continue;
        }
      }
    }

    out += char;
    i += 1;
  }
  return out;
}
/** Removes non-null assertions (`value!`) without touching `!==` / `!=`. */
function stripNonNullAssertions(code: string): string {
  let out = "";
  let i = 0;

  while (i < code.length) {
    const char = code[i]!;
    const skipped = advance(code, i);
    if (skipped !== i) {
      out += code.slice(i, skipped);
      i = skipped;
      continue;
    }

    if (char === "!" && code[i + 1] !== "=" && code[i - 1] !== "!") {
      i += 1;
      continue;
    }
    out += char;
    i += 1;
  }
  return out;
}

/** Replaces `: Type` annotations with a space, leaving object literals alone. */
function stripAnnotationColons(code: string): string {
  let out = "";
  let i = 0;
  let parenDepth = 0;
  let braceDepth = 0;
  let prevNonSpace = "";
  const ternaryPending = new Map<string, number>();

  while (i < code.length) {
    const char = code[i]!;
    const skipped = advance(code, i);
    if (skipped !== i) {
      out += code.slice(i, skipped);
      i = skipped;
      continue;
    }

    if (char === "(") parenDepth += 1;
    if (char === ")") parenDepth -= 1;
    if (char === "{") braceDepth += 1;
    if (char === "}") braceDepth -= 1;

    // Optional parameter marker: `a?: T` — drop the `?`, the `:` is handled next.
    if (char === "?" && code[i + 1] === ":" && parenDepth >= 1 && braceDepth === 0) {
      i += 1;
      continue;
    }

    if (char === "?") {
      const key = `${parenDepth}:${braceDepth}`;
      ternaryPending.set(key, (ternaryPending.get(key) ?? 0) + 1);
    }

    if (char === ":") {
      const key = `${parenDepth}:${braceDepth}`;
      const pending = ternaryPending.get(key) ?? 0;
      if (pending > 0) {
        ternaryPending.set(key, pending - 1);
      } else {
        const isParamType = parenDepth >= 1 && braceDepth === 0;
        const isReturnType = parenDepth === 0 && prevNonSpace === ")";
        const isVariableType =
          parenDepth === 0 &&
          /(^|[;{}\n])\s*(const|let|var)\s+[A-Za-z_$][\w$]*$/.test(out.trimEnd());

        if (isParamType || isReturnType || isVariableType) {
          out += " ";
          i = typeEnd(code, i + 1);
          continue;
        }
      }
    }

    out += char;
    if (!/\s/.test(char)) prevNonSpace = char;
    i += 1;
  }
  return out;
}

/**
 * Strips TypeScript syntax so the result can run in a plain JS engine.
 * Returns `{ code, changed }` where `changed` reports whether anything matched.
 */
export function stripTypeScript(source: string): { code: string; changed: boolean } {
  const original = source;
  let code = source;

  // Order matters: declarations first, then casts/generics, then annotations.
  code = stripInterfaces(code);
  code = stripTypeAliases(code);
  code = stripEnums(code);
  code = stripAsCasts(code);
  code = stripGenerics(code);
  code = stripModifiers(code);
  code = stripAnnotationColons(code);
  code = stripNonNullAssertions(code);

  return { code, changed: code !== original };
}
