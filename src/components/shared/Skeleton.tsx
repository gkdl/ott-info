import React, { useEffect, useRef } from "react";
import { Animated, View, type ViewStyle } from "react-native";

interface SkeletonBoxProps {
  style?: ViewStyle;
  className?: string;
}

// 펄스 애니메이션 베이스
export function SkeletonBox({ style, className }: SkeletonBoxProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[{ backgroundColor: "#1f2937", borderRadius: 8, opacity }, style]}
      className={className}
    />
  );
}

// ─── 히어로 배너 스켈레톤 ────────────────────────────────────────────────────

export function HeroBannerSkeleton() {
  return (
    <View className="w-full" style={{ height: 480 }}>
      <SkeletonBox style={{ flex: 1 }} />
      <View className="absolute bottom-0 left-0 right-0 p-6 gap-3">
        <SkeletonBox style={{ height: 28, width: "60%", borderRadius: 6 }} />
        <SkeletonBox style={{ height: 16, width: "40%", borderRadius: 4 }} />
        <View className="flex-row gap-3 mt-2">
          <SkeletonBox style={{ height: 44, width: 120, borderRadius: 22 }} />
          <SkeletonBox style={{ height: 44, width: 44, borderRadius: 22 }} />
        </View>
      </View>
    </View>
  );
}

// ─── 카드 캐러셀 스켈레톤 ────────────────────────────────────────────────────

export function CarouselSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View className="gap-4">
      <SkeletonBox style={{ height: 22, width: 140, marginHorizontal: 16, borderRadius: 6 }} />
      <View className="flex-row gap-3 px-4">
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} className="gap-2">
            <SkeletonBox style={{ width: 120, height: 180, borderRadius: 8 }} />
            <SkeletonBox style={{ width: 100, height: 14, borderRadius: 4 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── 커뮤니티 피드 카드 스켈레톤 ─────────────────────────────────────────────

export function FeedCardSkeleton() {
  return (
    <View
      className="mx-4 mb-3 p-4 rounded-2xl"
      style={{ backgroundColor: "#111827" }}
    >
      <View className="flex-row items-center gap-3 mb-3">
        <SkeletonBox style={{ width: 36, height: 36, borderRadius: 18 }} />
        <View className="gap-2">
          <SkeletonBox style={{ width: 80, height: 14, borderRadius: 4 }} />
          <SkeletonBox style={{ width: 60, height: 12, borderRadius: 4 }} />
        </View>
      </View>
      <SkeletonBox style={{ height: 14, width: "100%", borderRadius: 4, marginBottom: 8 }} />
      <SkeletonBox style={{ height: 14, width: "80%", borderRadius: 4 }} />
    </View>
  );
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View className="gap-0">
      <SkeletonBox style={{ height: 22, width: 180, marginHorizontal: 16, marginBottom: 12, borderRadius: 6 }} />
      {Array.from({ length: count }).map((_, i) => (
        <FeedCardSkeleton key={i} />
      ))}
    </View>
  );
}
