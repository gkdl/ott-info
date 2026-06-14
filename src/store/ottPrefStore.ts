import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

// 사용자가 "구독 중"이라고 선택한 OTT 프로바이더 ID 목록.
// 로그인과 무관하게 기기에 저장되므로 게스트도 개인화가 동작한다.

const STORAGE_KEY = "ott_pref_providers";

interface OttPrefState {
  providerIds: number[];
  hydrated: boolean; // SecureStore에서 1회 로드 완료 여부 (로드 전 깜빡임 방지)
  hydrate: () => Promise<void>;
  toggle: (id: number) => void;
  setProviders: (ids: number[]) => void;
}

function persist(ids: number[]) {
  SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(ids)).catch(() => {});
}

export const useOttPrefStore = create<OttPrefState>((set, get) => ({
  providerIds: [],
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      set({
        providerIds: Array.isArray(parsed) ? parsed.filter((x) => typeof x === "number") : [],
        hydrated: true,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  toggle: (id) => {
    const cur = get().providerIds;
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    set({ providerIds: next });
    persist(next);
  },

  setProviders: (ids) => {
    set({ providerIds: ids });
    persist(ids);
  },
}));

// ─── 셀렉터 ───────────────────────────────────────────────────────────────────

export const useOttProviderIds = () => useOttPrefStore((s) => s.providerIds);
export const useOttHydrated = () => useOttPrefStore((s) => s.hydrated);
