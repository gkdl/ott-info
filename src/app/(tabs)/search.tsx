import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSearch } from "@/hooks/useTmdb";
import { PosterImage } from "@/components/ui/CachedImage";
import { EmptyView, ErrorView } from "@/components/shared/StateViews";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchStore } from "@/store/searchStore";
import type { TmdbMultiResult } from "@/types/tmdb";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const { recentQueries, addQuery, removeQuery, clearAll } = useSearchStore();

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSearch(debouncedQuery);

  // 페이지 경계에서 같은 작품이 중복으로 올 수 있어 id+media_type 기준 중복 제거
  const results = React.useMemo(() => {
    const flat = data?.pages.flatMap((p) => p.results) ?? [];
    const seen = new Set<string>();
    return flat.filter((it) => {
      const k = `${it.id}-${it.media_type}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [data]);
  const showEmpty = debouncedQuery.length >= 2 && !isLoading && results.length === 0;

  // 검색어가 확정되면 최근 검색어에 저장
  React.useEffect(() => {
    if (debouncedQuery.length >= 2) {
      addQuery(debouncedQuery);
    }
  }, [debouncedQuery]);

  function handleRecentSelect(q: string) {
    setQuery(q);
  }

  function renderItem({ item }: { item: TmdbMultiResult }) {
    if (item.media_type === "person") return null;
    const title = item.media_type === "tv" ? item.name : item.title;
    const mediaType = item.media_type ?? "movie";
    return (
      <Pressable
        style={styles.resultItem}
        onPress={() =>
          router.push({
            pathname: "/detail/[id]",
            params: { id: item.id, type: mediaType },
          })
        }
      >
        <PosterImage path={item.poster_path ?? null} width={56} />
        <View style={styles.resultMeta}>
          <Text style={styles.resultTitle} numberOfLines={2}>{title}</Text>
          <Text style={styles.resultType}>
            {mediaType === "tv" ? "📺 드라마" : "🎬 영화"}
          </Text>
          {(item.vote_average ?? 0) > 0 && (
            <Text style={styles.resultRating}>
              ★ {item.vote_average!.toFixed(1)}
            </Text>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 검색 바 */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="영화, 드라마 검색..."
          placeholderTextColor="#4b5563"
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Text style={styles.clearIcon}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* 입력 전: 최근 검색어 or 힌트 */}
      {query.length < 2 && (
        <>
          {recentQueries.length > 0 ? (
            <View>
              <View style={styles.recentHeader}>
                <Text style={styles.recentHeaderText}>최근 검색어</Text>
                <Pressable onPress={clearAll}>
                  <Text style={styles.clearAllText}>전체 삭제</Text>
                </Pressable>
              </View>
              {recentQueries.map((q) => (
                <Pressable
                  key={q}
                  style={styles.recentItem}
                  onPress={() => handleRecentSelect(q)}
                >
                  <Text style={styles.recentIcon}>🕐</Text>
                  <Text style={styles.recentItemText}>{q}</Text>
                  <Pressable
                    style={styles.recentItemRemove}
                    onPress={() => removeQuery(q)}
                    hitSlop={8}
                  >
                    <Text style={styles.recentItemRemoveText}>✕</Text>
                  </Pressable>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.hintArea}>
              <Text style={styles.hintEmoji}>🔍</Text>
              <Text style={styles.hintText}>영화 또는 드라마 제목을 입력하세요</Text>
            </View>
          )}
        </>
      )}

      {/* 검색 중 */}
      {isLoading && query.length >= 2 && (
        <ActivityIndicator color="#6366f1" style={{ marginTop: 40 }} />
      )}

      {isError && <ErrorView message="검색 중 오류가 발생했습니다." />}

      {showEmpty && (
        <EmptyView
          emoji="🔎"
          title={`"${debouncedQuery}" 검색 결과가 없어요`}
          description="다른 키워드로 검색해보세요."
        />
      )}

      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.id}-${item.media_type}`}
          renderItem={renderItem}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
          contentContainerStyle={{ paddingBottom: 20 }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color="#6366f1" style={{ padding: 16 }} />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#111827",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    gap: 10,
  },
  searchIcon: { fontSize: 16 },
  input: { flex: 1, color: "#f9fafb", fontSize: 16 },
  clearIcon: { color: "#6b7280", fontSize: 16 },
  // 최근 검색어
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  recentHeaderText: { color: "#9ca3af", fontSize: 13, fontWeight: "600" },
  clearAllText: { color: "#6366f1", fontSize: 13 },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  recentIcon: { fontSize: 14 },
  recentItemText: { flex: 1, color: "#e5e7eb", fontSize: 15 },
  recentItemRemove: { padding: 4 },
  recentItemRemoveText: { color: "#4b5563", fontSize: 14 },
  // 힌트
  hintArea: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  hintEmoji: { fontSize: 40 },
  hintText: { color: "#4b5563", fontSize: 14 },
  // 검색 결과
  resultItem: {
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  resultMeta: { flex: 1, gap: 4 },
  resultTitle: { color: "#e5e7eb", fontSize: 15, fontWeight: "600" },
  resultType: { color: "#6b7280", fontSize: 12 },
  resultRating: { color: "#9ca3af", fontSize: 12 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: "#1f2937", marginLeft: 86 },
});
