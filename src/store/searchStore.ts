import { create } from "zustand";

const MAX_RECENT = 10;

interface SearchState {
  recentQueries: string[];
  addQuery: (q: string) => void;
  removeQuery: (q: string) => void;
  clearAll: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  recentQueries: [],
  addQuery: (q) =>
    set((s) => ({
      recentQueries: [q, ...s.recentQueries.filter((x) => x !== q)].slice(0, MAX_RECENT),
    })),
  removeQuery: (q) =>
    set((s) => ({ recentQueries: s.recentQueries.filter((x) => x !== q) })),
  clearAll: () => set({ recentQueries: [] }),
}));
