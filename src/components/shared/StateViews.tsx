import React from "react";
import { View, Text, Pressable } from "react-native";

// ─── 네트워크 에러 ────────────────────────────────────────────────────────────

interface ErrorViewProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorView({
  message = "데이터를 불러오지 못했습니다.",
  onRetry,
}: ErrorViewProps) {
  return (
    <View className="items-center justify-center py-12 px-6 gap-3">
      <Text className="text-3xl">⚠️</Text>
      <Text className="text-gray-400 text-sm text-center">{message}</Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          className="mt-2 px-5 py-2 rounded-full border border-gray-600"
        >
          <Text className="text-gray-300 text-sm font-medium">다시 시도</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── 오프라인 배너 ────────────────────────────────────────────────────────────

export function OfflineBanner() {
  return (
    <View className="mx-4 mb-3 px-4 py-3 rounded-xl bg-yellow-900/60 flex-row items-center gap-2">
      <Text className="text-yellow-400 text-sm">📡</Text>
      <Text className="text-yellow-300 text-sm flex-1">
        오프라인 상태입니다. 캐시된 데이터를 표시합니다.
      </Text>
    </View>
  );
}

// ─── 빈 상태 ──────────────────────────────────────────────────────────────────

interface EmptyViewProps {
  emoji?: string;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyView({ emoji = "🎬", title, description, action }: EmptyViewProps) {
  return (
    <View className="items-center justify-center py-16 px-6 gap-2">
      <Text className="text-5xl mb-2">{emoji}</Text>
      <Text className="text-gray-200 font-semibold text-base">{title}</Text>
      {description && (
        <Text className="text-gray-500 text-sm text-center mt-1">{description}</Text>
      )}
      {action && (
        <Pressable
          onPress={action.onPress}
          className="mt-4 px-6 py-3 rounded-full bg-indigo-600"
        >
          <Text className="text-white font-semibold text-sm">{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── 인라인 섹션 에러 (캐러셀 로드 실패) ────────────────────────────────────

export function SectionError({ onRetry }: { onRetry?: () => void }) {
  return (
    <View className="h-44 mx-4 rounded-xl bg-gray-900 items-center justify-center gap-2">
      <Text className="text-gray-500 text-sm">콘텐츠를 불러올 수 없습니다.</Text>
      {onRetry && (
        <Pressable onPress={onRetry}>
          <Text className="text-indigo-400 text-sm underline">재시도</Text>
        </Pressable>
      )}
    </View>
  );
}
