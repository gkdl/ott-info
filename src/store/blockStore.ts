import { create } from "zustand";

// ─── 차단 목록 전역 스토어 ────────────────────────────────────────────────────
// 차단한 유저 ID Set을 전역에 두어 피드/리뷰 목록을 클라이언트에서 즉시 필터링.
// 차단 추가 시 피드를 invalidate하기 전에 이 Set으로 즉각 UI에서 숨겨 UX 개선.

interface BlockState {
  blockedUserIds: Set<string>;
  setBlockedUserIds: (ids: string[]) => void;
  addBlock: (userId: string) => void;
  removeBlock: (userId: string) => void;
  isBlocked: (userId: string) => boolean;
}

export const useBlockStore = create<BlockState>((set, get) => ({
  blockedUserIds: new Set(),

  setBlockedUserIds: (ids) =>
    set({ blockedUserIds: new Set(ids) }),

  addBlock: (userId) =>
    set((s) => ({ blockedUserIds: new Set([...s.blockedUserIds, userId]) })),

  removeBlock: (userId) =>
    set((s) => {
      const next = new Set(s.blockedUserIds);
      next.delete(userId);
      return { blockedUserIds: next };
    }),

  isBlocked: (userId) => get().blockedUserIds.has(userId),
}));
