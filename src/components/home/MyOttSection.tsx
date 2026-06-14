import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { ContentCarousel } from "@/components/home/ContentCarousel";
import { OttPicker } from "@/components/home/OttPicker";
import { OTT_PROVIDERS, type OttProvider } from "@/constants/ottProviders";
import { useProviderPicks } from "@/hooks/useTmdb";
import { useOttProviderIds, useOttHydrated } from "@/store/ottPrefStore";
import type { TmdbContent } from "@/types/tmdb";

// 선택한 프로바이더 한 곳의 추천 캐러셀. 영화/드라마를 모두 조회해 섞는다
// (쿠팡플레이 등 일부는 TMDB상 드라마에만 존재하므로 movie 단독이면 비어버림).
function ProviderCarousel({ provider }: { provider: OttProvider }) {
  const movie = useProviderPicks("movie", provider.id);
  const tv = useProviderPicks("tv", provider.id);

  const merged = useMemo(() => {
    const m = (movie.data?.results ?? []).map(
      (it) => ({ ...it, media_type: "movie" }) as TmdbContent
    );
    const t = (tv.data?.results ?? []).map(
      (it) => ({ ...it, media_type: "tv" }) as TmdbContent
    );
    // 영화/드라마 번갈아 섞기
    const out: TmdbContent[] = [];
    for (let i = 0; i < Math.max(m.length, t.length); i++) {
      if (m[i]) out.push(m[i]);
      if (t[i]) out.push(t[i]);
    }
    return out;
  }, [movie.data, tv.data]);

  const query = {
    data: { page: 1, total_pages: 1, total_results: merged.length, results: merged },
    isLoading: movie.isLoading || tv.isLoading,
    isError: movie.isError && tv.isError,
    refetch: () => {
      movie.refetch();
      tv.refetch();
    },
  };

  return (
    <ContentCarousel title={`${provider.name}에서 볼만한`} query={query} />
  );
}

export function MyOttSection() {
  const hydrated = useOttHydrated();
  const providerIds = useOttProviderIds();
  const [editing, setEditing] = useState(false);

  // 저장값 로드 전에는 아무것도 안 그려 깜빡임 방지
  if (!hydrated) return null;

  // 아직 OTT를 안 골랐으면 → 온보딩 프롬프트
  if (providerIds.length === 0) {
    return (
      <View style={styles.promptCard}>
        <View style={styles.promptText}>
          <Text style={styles.promptTitle}>구독 중인 OTT를 골라보세요</Text>
          <Text style={styles.promptDesc}>
            내가 가입한 서비스에서 볼만한 작품만 모아서 보여드려요.
          </Text>
        </View>
        <OttPicker />
      </View>
    );
  }

  const selectedProviders = OTT_PROVIDERS.filter((p) => providerIds.includes(p.id));

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 OTT 추천</Text>
        <Pressable onPress={() => setEditing((v) => !v)} hitSlop={8}>
          <Text style={styles.edit}>{editing ? "완료" : "편집"}</Text>
        </Pressable>
      </View>

      {editing && <OttPicker />}

      {selectedProviders.map((p) => (
        <ProviderCarousel key={p.id} provider={p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerTitle: { color: "#f9fafb", fontSize: 18, fontWeight: "700" },
  edit: { color: "#6366f1", fontSize: 14, fontWeight: "600" },
  promptCard: {
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f2937",
    backgroundColor: "#0b1220",
    gap: 12,
  },
  promptText: { paddingHorizontal: 16, gap: 6 },
  promptTitle: { color: "#f9fafb", fontSize: 16, fontWeight: "700" },
  promptDesc: { color: "#9ca3af", fontSize: 13, lineHeight: 19 },
});
