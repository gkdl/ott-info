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
import type { TmdbMultiResult } from "@/types/tmdb";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSearch(debouncedQuery);

  const results = data?.pages.flatMap((p) => p.results) ?? [];
  const showEmpty =
    debouncedQuery.length >= 2 && !isLoading && results.length === 0;

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
              ⭐ {item.vote_average!.toFixed(1)}
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

      {/* 상태별 UI */}
      {query.length < 2 && (
        <View style={styles.hintArea}>
          <Text style={styles.hintText}>영화 또는 드라마 제목을 입력하세요</Text>
        </View>
      )}

      {isLoading && (
        <ActivityIndicator color="#6366f1" style={{ marginTop: 40 }} />
      )}

      {isError && (
        <ErrorView message="검색 중 오류가 발생했습니다." />
      )}

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
  hintArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  hintText: { color: "#4b5563", fontSize: 14 },
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
