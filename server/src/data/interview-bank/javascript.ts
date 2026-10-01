import type { InterviewTopic } from "./types";

export const javascriptTopic: InterviewTopic = {
  id: "javascript",
  label: "JavaScript",
  description: "Language fundamentals, async model, runtime behaviour and browser APIs.",
  questions: [
    {
      key: "js-closures",
      topic: "Closures & scope",
      difficulty: "MEDIUM",
      prompt:
        "Explain what a closure is in JavaScript, how the scope chain is captured, and describe a real bug you have fixed because of a closure.",
      hints: [
        "Start from the definition: a function remembering the lexical environment where it was created.",
        "Mention that inner functions keep a live reference to variables, not a copy.",
        "A classic bug: creating handlers inside a `var` loop — compare it with `let` or an IIFE.",
      ],
      keywords: ["closure", "lexical scope", "scope chain", "reference", "let", "var", "memory"],
      model:
        "A closure is a function bundled with the lexical environment it was defined in, so it can read and keep alive outer variables after the outer function returns. The classic failure is loop handlers capturing a shared `var`; switching to `let` or binding the value fixes it. Long-lived closures also pin memory, so they can leak.",
    },
    {
      key: "js-event-loop",
      topic: "Event loop & concurrency",
      difficulty: "MEDIUM",
      prompt:
        "Walk me through the JavaScript event loop. How do microtasks and macrotasks differ, and what does that mean for `setTimeout(fn, 0)` versus a resolved promise?",
      hints: [
        "Describe the call stack, task queue and the single threaded nature of the runtime.",
        "Microtasks (promises, `queueMicrotask`) drain completely before the next macrotask.",
        "`setTimeout(fn, 0)` is a macrotask, so a pending `.then()` runs first.",
      ],
      keywords: ["event loop", "call stack", "microtask", "macrotask", "promise", "queue", "single thread"],
      model:
        "JS runs on one call stack. Finished sync work is followed by draining the microtask queue (promise callbacks), then one macrotask (timer, I/O). So `setTimeout(fn, 0)` always yields to pending promise callbacks, and a long microtask chain can starve rendering.",
    },
    {
      key: "js-equality",
      topic: "Types & coercion",
      difficulty: "EASY",
      prompt:
        "What is the difference between `==`, `===`, `Object.is` and `NaN` comparisons, and what rules do you follow in a codebase you own?",
      hints: [
        "`==` performs type coercion, `===` compares type + value without coercion.",
        "`Object.is` differs from `===` for `NaN` and `-0`.",
        "`NaN` is not equal to itself, so use `Number.isNaN`.",
      ],
      keywords: ["coercion", "strict equality", "Object.is", "NaN", "type safety", "lint rule"],
      model:
        "`===` compares without coercion and is the default. `==` coerces (`null == undefined` is the only widely useful case). `Object.is(NaN, NaN)` is true while `NaN === NaN` is false. Teams usually enforce `eqeqeq` and `Number.isNaN`.",
    },
    {
      key: "js-this",
      topic: "Execution context",
      difficulty: "MEDIUM",
      prompt:
        "Explain how `this` is resolved in JavaScript across regular functions, arrow functions, methods and event handlers — and how you would debug a wrong `this`.",
      hints: [
        "`this` is decided at call time for regular functions, at definition time for arrows.",
        "Arrow functions inherit `this` lexically from the enclosing scope.",
        "Check whether the method was passed as a bare callback, losing the receiver.",
      ],
      keywords: ["this", "call site", "lexical", "arrow function", "bind", "binding", "context"],
      model:
        "For regular functions `this` comes from the call site: `obj.method()` binds `obj`, a bare call binds `undefined` in strict mode, `bind`/`call` override it. Arrow functions capture the enclosing `this`. Wrong `this` usually means a method was passed as a callback without binding.",
    },
    {
      key: "js-memory-leaks",
      topic: "Performance & memory",
      difficulty: "HARD",
      prompt:
        "A single-page app becomes sluggish after an hour of use. How do you find and fix memory leaks in JavaScript?",
      hints: [
        "Start with the Chrome DevTools memory panel: heap snapshots and allocation timelines.",
        "Common culprits: detached DOM nodes, unremoved listeners, timers, growing caches.",
        "Show the fix: disposers, `AbortController`, `WeakMap`, bounded caches.",
      ],
      keywords: ["heap snapshot", "detached DOM", "event listener", "AbortController", "WeakMap", "cache", "profiler"],
      model:
        "Reproduce with Chrome DevTools: take heap snapshots, compare three of them, and look for detached nodes and growing retainers. Typical causes are listeners/timers never removed and unbounded caches. Fix by using cleanup functions or `AbortController`, `WeakMap`/`WeakRef` where appropriate, and bounded LRU caches.",
    },
    {
      key: "js-prototypes",
      topic: "Objects & prototypes",
      difficulty: "MEDIUM",
      prompt:
        "Describe the prototype chain, `Object.create` versus classes, and how you would add behaviour to existing instances safely.",
      hints: [
        "Property lookup walks `[[Prototype]]` until `null`.",
        "`class` is syntax sugar over constructor functions plus prototype wiring.",
        "Be careful: mutating built-in prototypes breaks encapsulation and polyfills.",
      ],
      keywords: ["prototype chain", "Object.create", "class", "inheritance", "property lookup", "composition"],
      model:
        "Every object has a prototype link; lookup climbs the chain until the property is found or `null` is reached. Classes desugar to constructor + prototype assignment. Prefer composition and factory functions over patching prototypes because built-in mutation leaks globally.",
    },
    {
      key: "js-promises-async",
      topic: "Async patterns",
      difficulty: "MEDIUM",
      prompt:
        "Compare callbacks, promises and `async/await`. How do you run ten requests with a concurrency limit of three, and what happens on the first failure?",
      hints: [
        "`async/await` is syntax over promises; errors become rejected promises.",
        "Describe a worker-pool pattern that starts the next task as one finishes.",
        "Mention `Promise.all`, `allSettled`, `race` and `any` semantics.",
      ],
      keywords: ["promise", "async await", "concurrency limit", "Promise.allSettled", "error handling", "worker pool"],
      model:
        "Callbacks invert control, promises make results composable and `async/await` reads linearly while still rejecting promises. For three-at-a-time execution I keep a pool of workers pulling from a queue; on the first failure I decide between failing fast (`Promise.all`) or collecting everything (`Promise.allSettled`).",
    },
    {
      key: "js-immutability",
      topic: "Data handling",
      difficulty: "EASY",
      prompt:
        "Why does immutability matter in JavaScript, and how do you update deeply nested state without mutating it?",
      hints: [
        "Reference equality is what enables cheap change detection in React and memoisation.",
        "Shallow copies with spread `...`, then replace only the changed branch.",
        "Consider structural sharing helpers like Immer for deep trees.",
      ],
      keywords: ["immutability", "reference equality", "spread", "structural sharing", "Immer", "re-render"],
      model:
        "Mutating shared objects hides changes from reference-based comparisons, so memoisation and React re-rendering break. Copy the path you change with spread operators or use Immer/structural sharing for deep updates.",
    },
    {
      key: "js-fp",
      topic: "Functional patterns",
      difficulty: "MEDIUM",
      prompt:
        "Explain pure functions, side effects and referential transparency, and how you isolate side effects in a front-end codebase.",
      hints: [
        "A pure function returns the same output for the same input and mutates nothing external.",
        "Push I/O to the edges: reducers, selectors and formatters stay pure.",
        "Testability and time-travel debugging are the pay-off.",
      ],
      keywords: ["pure function", "side effect", "referential transparency", "reducer", "selector", "testability"],
      model:
        "Pure functions are deterministic and side-effect free, which makes them trivially testable and memo-friendly. I keep state transitions in pure reducers/selectors and push network, storage and DOM writes into thin effect layers.",
    },
    {
      key: "js-security",
      topic: "Security & delivery",
      difficulty: "HARD",
      prompt:
        "How do you protect a browser application from XSS and unsafe dependencies, and what is your review checklist for adding a new npm package?",
      hints: [
        "Prefer text nodes / framework escaping; sanitise only when HTML is unavoidable.",
        "Use a strict Content-Security-Policy and avoid inline scripts.",
        "Check package maintenance, download provenance, lockfile integrity and install scripts.",
      ],
      keywords: ["XSS", "sanitisation", "Content-Security-Policy", "supply chain", "lockfile", "audit", "escaping"],
      model:
        "Never interpolate untrusted data into HTML; render through the framework, sanitise with a vetted library when HTML is required, and add a strict CSP. For dependencies I check maintenance, size, transitive tree, install scripts, and pin with a committed lockfile plus `npm audit` in CI.",
    },
  ],
};
