import type { InterviewTopic } from "./types";

export const reactTopic: InterviewTopic = {
  id: "react",
  label: "React",
  description: "Component design, hooks, rendering behaviour, data flow and performance.",
  questions: [
    {
      key: "react-reconciliation",
      topic: "Rendering",
      difficulty: "MEDIUM",
      prompt:
        "Explain React reconciliation. Why are list keys important, and what breaks when you use the array index as the key?",
      hints: [
        "React diffs children by key + element type to decide what to reuse.",
        "Index keys stay stable while items move, so React reuses the wrong instance.",
        "Symptoms: wrong input values, lost focus, broken animations, extra effects.",
      ],
      keywords: ["reconciliation", "key", "virtual DOM", "reuse", "index key", "state loss"],
      model:
        "React compares the previous and next element trees, matching children by type and key, and reuses or remounts instances accordingly. Index keys mean a moved item keeps its old instance, so local state, focus and DOM identity attach to the wrong row. Stable domain ids fix it.",
    },
    {
      key: "react-hooks-rules",
      topic: "Hooks",
      difficulty: "MEDIUM",
      prompt:
        "Why must hooks be called in the same order on every render, and how do you refactor a component that needs conditional hook logic?",
      hints: [
        "React stores hook state in a linked list per component instance.",
        "Conditional calls shift the list and corrupt the mapping.",
        "Refactor by extracting children components or using a hook that handles the condition internally.",
      ],
      keywords: ["rules of hooks", "call order", "linked list", "custom hook", "extract component"],
      model:
        "Hooks are stored positionally in a per-component list, so skipping or reordering them misaligns state. The fix is structural: extract a child component, or move the conditional inside a custom hook that always calls the same hooks.",
    },
    {
      key: "react-effects",
      topic: "Hooks",
      difficulty: "MEDIUM",
      prompt:
        "How do you reason about `useEffect` dependencies and cleanup, and when should the effect not exist at all?",
      hints: [
        "An effect synchronises with something outside React; derived values do not need one.",
        "Every subscription/timer/request needs a cleanup to avoid leaks and race conditions.",
        "Prefer event handlers or `useSyncExternalStore`/render-time derivation where possible.",
      ],
      keywords: ["useEffect", "dependencies", "cleanup", "race condition", "derived state", "subscription"],
      model:
        "Effects are for synchronising with external systems. Dependencies are exactly the reactive values used inside; missing ones cause stale reads. Cleanup must cancel subscriptions, timers and in-flight requests (AbortController). Derived values belong in render, not in an effect.",
    },
    {
      key: "react-performance",
      topic: "Performance",
      difficulty: "HARD",
      prompt:
        "A dashboard re-renders on every keystroke and the UI stutters. Walk me through your diagnosis and the fixes you would apply, in order.",
      hints: [
        "Measure first: React DevTools profiler, why-did-you-render, browser performance traces.",
        "Typical causes: state lifted too high, unstable props/objects, huge lists, heavy work in render.",
        "Fixes: memo, useMemo/useCallback, virtualisation, splitting context, deferring with transitions.",
      ],
      keywords: ["profiler", "memo", "useMemo", "useCallback", "virtualisation", "startTransition", "context split"],
      model:
        "I profile first, then fix in order of impact: move state down to the component that needs it, stabilise props with memo/useMemo/useCallback, virtualise long lists, split frequently changing contexts, and use `useDeferredValue`/`startTransition` for expensive renders.",
    },
    {
      key: "react-data-fetching",
      topic: "Data flow",
      difficulty: "MEDIUM",
      prompt:
        "How do you handle server state in React — loading, caching, refetching and errors — and how does that differ from client state?",
      hints: [
        "Server state is asynchronous, shared and can be stale; client state is owned locally.",
        "Describe cache keys, stale times, invalidation on mutation and optimistic updates.",
        "Mention libraries such as React Query/SWR and their trade-offs versus hand-rolled hooks.",
      ],
      keywords: ["server state", "cache", "invalidation", "optimistic update", "React Query", "stale time", "error boundary"],
      model:
        "I treat server state as a cache with keys, staleness windows and invalidation on mutation rather than in component state. A data library (React Query/SWR) gives me request deduping, retries, optimistic updates and background refetch; local UI state stays in `useState`/`useReducer`.",
    },
    {
      key: "react-state-management",
      topic: "Architecture",
      difficulty: "MEDIUM",
      prompt:
        "How do you decide between local state, context, and a store such as Redux or Zustand? What would make you refactor from one to another?",
      hints: [
        "Start local; lift only when two branches genuinely share the value.",
        "Context is a transport mechanism, not a state manager — value identity drives re-renders.",
        "Stores pay off with cross-cutting, frequently updated state and complex update logic.",
      ],
      keywords: ["local state", "context", "store", "single source of truth", "re-render", "colocation"],
      model:
        "I keep state as local and as low as possible, lift it only when shared, use context for rarely changing values (theme, session) and a store when state is global, mutated from many places, or needs middleware/devtools. The refactor trigger is prop-drilling depth or re-render churn.",
    },
    {
      key: "react-forms",
      topic: "Forms & validation",
      difficulty: "EASY",
      prompt:
        "Compare controlled and uncontrolled inputs, and describe how you would build a large form with validation and good performance.",
      hints: [
        "Controlled inputs keep the value in React state on every keystroke.",
        "Uncontrolled inputs let the DOM own the value and are read via refs/FormData.",
        "Per-field registration and uncontrolled field state avoid re-rendering the whole form.",
      ],
      keywords: ["controlled", "uncontrolled", "validation", "react-hook-form", "schema", "re-render", "FormData"],
      model:
        "Controlled inputs give predictable validation but re-render per keystroke; uncontrolled inputs are faster and native. For large forms I use a form library with schema validation (Zod) and uncontrolled field registration so typing re-renders only the touched field.",
    },
    {
      key: "react-testing",
      topic: "Testing",
      difficulty: "MEDIUM",
      prompt:
        "Describe your testing strategy for a React feature: what do you unit test, what do you integration test, and where do mocks hurt?",
      hints: [
        "Test behaviour through the user's eyes (Testing Library), not implementation details.",
        "Mock the network boundary (MSW), not your own modules.",
        "Coverage of edge states matters more than the percentage number.",
      ],
      keywords: ["Testing Library", "integration test", "MSW", "behaviour", "edge cases", "implementation detail"],
      model:
        "I write a few integration tests per feature that render the real component tree, drive it like a user and mock only the network (MSW). Unit tests target pure logic — reducers, formatters, hooks with `renderHook`. Heavy internal mocking is a smell that the design is too coupled.",
    },
    {
      key: "react-accessibility",
      topic: "Accessibility",
      difficulty: "MEDIUM",
      prompt:
        "How do you make a custom component library accessible? Give concrete techniques and how you verify them.",
      hints: [
        "Prefer semantic elements and native behaviour; add ARIA only to fill gaps.",
        "Manage focus explicitly in dialogs, menus and route changes.",
        "Verify with keyboard-only navigation, axe/Lighthouse and screen reader smoke tests.",
      ],
      keywords: ["semantic HTML", "ARIA", "focus management", "keyboard navigation", "axe", "screen reader", "contrast"],
      model:
        "I start from semantic HTML, keep a logical tab order, manage focus on dialogs/menus, and label everything programmatically. Verification is keyboard-only walks, axe/Lighthouse in CI, and periodic screen-reader checks.",
    },
    {
      key: "react-architecture",
      topic: "Architecture",
      difficulty: "HARD",
      prompt:
        "How would you structure a large React application so features stay independent — folder layout, boundaries, and how server components or SSR change the design?",
      hints: [
        "Feature folders with a public entry point; no deep cross-feature imports.",
        "Push data fetching and heavy logic to the server where the framework allows it.",
        "Enforce boundaries mechanically (lint rules, ownership, dependency graph checks).",
      ],
      keywords: ["feature folders", "boundaries", "server components", "SSR", "colocation", "lint rule", "dependency graph"],
      model:
        "I organise by feature with a public index per feature, keep shared UI in a design-system folder, and enforce boundaries with lint rules and dependency-graph checks. With server components I move data fetching and heavy work server-side and keep client components small and interactive-only.",
    },
  ],
};
