import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import type { Database } from "@/types/database";

// ─── expo-secure-store 어댑터 ─────────────────────────────────────────────────
// Supabase 클라이언트의 storage 인터페이스를 SecureStore로 구현.
// AsyncStorage 평문 저장 대신 OS 키체인/키스토어에 세션 토큰을 암호화 저장.
//
// 주의: SecureStore 값은 2048바이트 제한이 있어 큰 JWT를 키 단위로 분할 저장.

const CHUNK_SIZE = 2000; // 바이트 단위 분할 크기

const secureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      // 청크 분할 저장 여부 확인
      const chunkCount = await SecureStore.getItemAsync(`${key}_chunks`);
      if (chunkCount) {
        const count = parseInt(chunkCount, 10);
        const chunks: string[] = [];
        for (let i = 0; i < count; i++) {
          const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
          if (chunk === null) return null;
          chunks.push(chunk);
        }
        return chunks.join("");
      }
      return SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (value.length <= CHUNK_SIZE) {
        await SecureStore.setItemAsync(key, value);
        return;
      }
      // 2048바이트 초과 시 청크 분할
      const chunks: string[] = [];
      for (let i = 0; i < value.length; i += CHUNK_SIZE) {
        chunks.push(value.slice(i, i + CHUNK_SIZE));
      }
      await SecureStore.setItemAsync(`${key}_chunks`, String(chunks.length));
      for (let i = 0; i < chunks.length; i++) {
        await SecureStore.setItemAsync(`${key}_chunk_${i}`, chunks[i]);
      }
    } catch (err) {
      console.error("[SecureStore] setItem failed:", err);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      const chunkCount = await SecureStore.getItemAsync(`${key}_chunks`);
      if (chunkCount) {
        const count = parseInt(chunkCount, 10);
        for (let i = 0; i < count; i++) {
          await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
        }
        await SecureStore.deleteItemAsync(`${key}_chunks`);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.error("[SecureStore] removeItem failed:", err);
    }
  },
};

// ─── Supabase 클라이언트 ──────────────────────────────────────────────────────

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_URL 또는 EXPO_PUBLIC_SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다."
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // React Native에서는 false
  },
});
