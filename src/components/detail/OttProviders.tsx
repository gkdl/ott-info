import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { OttLogo } from "@/components/ui/CachedImage";
import { SkeletonBox } from "@/components/shared/Skeleton";
import { openOttApp } from "@/lib/deeplink";
import { useWatchProviders } from "@/hooks/useTmdb";
import type { MediaType } from "@/types/tmdb";

interface OttProvidersProps {
  contentId: number;
  mediaType: MediaType;
}

export function OttProviders({ contentId, mediaType }: OttProvidersProps) {
  const { data, isLoading, isError } = useWatchProviders(mediaType, contentId);

  if (isLoading) return <OttProvidersSkeleton />;

  const kr = data?.results?.KR;
  // flatrate(구독), rent(대여), buy(구매), free 순으로 수집 후 중복 제거
  const allProviders = [
    ...(kr?.flatrate ?? []),
    ...(kr?.rent ?? []),
    ...(kr?.buy ?? []),
    ...(kr?.free ?? []),
  ].filter(
    (p, idx, arr) => arr.findIndex((x) => x.provider_id === p.provider_id) === idx
  );

  if (isError || allProviders.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>시청 가능한 OTT</Text>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            현재 한국에서 시청 가능한 OTT 서비스 정보가 없습니다.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>시청 가능한 OTT</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {allProviders.map((provider) => (
          <Pressable
            key={provider.provider_id}
            style={styles.providerItem}
            onPress={() =>
              openOttApp({
                providerId: provider.provider_id,
                webFallbackUrl: kr?.link ?? null,
              })
            }
          >
            <OttLogo path={provider.logo_path} size={52} />
            <Text style={styles.providerName} numberOfLines={2}>
              {provider.provider_name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function OttProvidersSkeleton() {
  return (
    <View style={styles.section}>
      <SkeletonBox style={{ height: 18, width: 160, borderRadius: 6 }} />
      <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ alignItems: "center", gap: 6 }}>
            <SkeletonBox style={{ width: 52, height: 52, borderRadius: 8 }} />
            <SkeletonBox style={{ width: 48, height: 12, borderRadius: 4 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  sectionTitle: {
    color: "#f9fafb",
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 16,
  },
  list: { paddingHorizontal: 16, gap: 12 },
  providerItem: { alignItems: "center", gap: 6, width: 64 },
  providerName: {
    color: "#9ca3af",
    fontSize: 10,
    textAlign: "center",
    lineHeight: 14,
  },
  emptyBox: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#111827",
  },
  emptyText: { color: "#6b7280", fontSize: 13, textAlign: "center" },
});
