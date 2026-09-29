import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useState } from "react";
import { DEFAULT_PLAYGROUND_LANGUAGE } from "@/lib/playground/languages";
import type { PlaygroundLanguage } from "@/lib/playground/types";

/**
 * Playground session state.
 *
 * The playground keeps one draft per language so switching tabs never loses
 * work, remembers the last language used, and stores the "live preview" toggle
 * used by the HTML/CSS tabs.
 */

export interface PlaygroundState {
  /** language -> draft source. */
  drafts: Partial<Record<PlaygroundLanguage, string>>;
  /** language -> Input tab (stdin) draft. */
  stdin: Partial<Record<PlaygroundLanguage, string>>;
  /** Last language the user worked in. */
  language: PlaygroundLanguage;
  /** Re-render the preview while typing (HTML/CSS/Tailwind/React only). */
  autoPreview: boolean;

  setDraft: (language: PlaygroundLanguage, code: string) => void;
  clearDraft: (language: PlaygroundLanguage) => void;
  setStdin: (language: PlaygroundLanguage, value: string) => void;
  setLanguage: (language: PlaygroundLanguage) => void;
  setAutoPreview: (enabled: boolean) => void;
  reset: () => void;
}

export const usePlaygroundStore = create<PlaygroundState>()(
  persist(
    (set) => ({
      drafts: {},
      stdin: {},
      language: DEFAULT_PLAYGROUND_LANGUAGE,
      autoPreview: true,

      setDraft: (language, code) =>
        set((state) => ({ drafts: { ...state.drafts, [language]: code } })),

      clearDraft: (language) =>
        set((state) => {
          if (state.drafts[language] === undefined) return state;
          const next = { ...state.drafts };
          delete next[language];
          return { drafts: next };
        }),

      setStdin: (language, value) =>
        set((state) => ({ stdin: { ...state.stdin, [language]: value } })),

      setLanguage: (language) => set({ language }),

      setAutoPreview: (autoPreview) => set({ autoPreview }),

      reset: () =>
        set({ drafts: {}, stdin: {}, language: DEFAULT_PLAYGROUND_LANGUAGE, autoPreview: true }),
    }),
    {
      name: "devassess-playground",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      /** v1 had no Input tab, so a v1 payload simply has no stdin entries. */
      migrate: (persisted) => persisted as PlaygroundState,
    },
  ),
);

/* ------------------------------------------------------------------ helpers */

/**
 * True once the persisted store has rehydrated.
 *
 * Starts `false` on the server and on the first client render so the markup
 * matches, then flips in an effect. Mirrors `usePracticeHydrated`.
 */
export function usePlaygroundHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persistApi = usePlaygroundStore.persist;
    if (!persistApi) {
      setHydrated(true);
      return;
    }
    setHydrated(persistApi.hasHydrated());
    return persistApi.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}