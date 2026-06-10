import React from "react";
import { QueryProvider } from "@/lib/queryClient";
import { useAuthInit } from "@/lib/useAuthInit";

// 세션 구독을 앱 루트에서 초기화하는 내부 컴포넌트.
// Provider 밖에서 훅을 호출할 수 없으므로 QueryProvider 안쪽에 위치.
function AuthInitializer({ children }: { children: React.ReactNode }) {
  useAuthInit();
  return <>{children}</>;
}

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <AuthInitializer>
        {children}
      </AuthInitializer>
    </QueryProvider>
  );
}
