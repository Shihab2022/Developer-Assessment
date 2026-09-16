import { create } from "zustand";

interface UiState {
  /** Mobile sidebar drawer. */
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  /** ⌘K command palette. */
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  toggleCommand: () => void;

  /** Focus mode used while a candidate is taking an attempt. */
  focusMode: boolean;
  setFocusMode: (value: boolean) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  commandOpen: false,
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  toggleCommand: () => set((state) => ({ commandOpen: !state.commandOpen })),

  focusMode: false,
  setFocusMode: (focusMode) => set({ focusMode }),
}));