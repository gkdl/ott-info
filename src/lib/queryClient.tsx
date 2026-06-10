import React from "react";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";
import type { AppStateStatus } from "react-native";

// React Native에서 앱 포그라운드 복귀 시 stale 쿼리 자동 refetch
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== "web") {
    focusManager.setFocused(status === "active");
  }
}

AppState.addEventListener("change", onAppStateChange);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5분 stale — TMDB 데이터는 자주 바뀌지 않음
      staleTime: 5 * 60 * 1000,
      // 30분 캐시 유지 (백그라운드 진입 후 재진입 시 재사용)
      gcTime: 30 * 60 * 1000,
      retry: (failureCount, error) => {
        // 401/403은 재시도 무의미
        if (error instanceof Error && /40[13]/.test(error.message)) return false;
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
