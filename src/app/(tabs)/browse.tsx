import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CachedImage } from "@/components/ui/CachedImage";
import { EmptyView, SectionError } from "@/components/shared/StateViews";
import { useBrowseByProvider } from "@/hooks/useTmdb";
import {
  OTT_PROVIDERS,
  GENRE_OPTIONS,
  CONTENT_CATEGORIES,
  type OttProvider,
  type ContentCategory,
} from "@/constants/ottProviders";
import { getContentInfo } from "@/lib/tmdbContent";
import type { MediaType, TmdbContent } from "@/types/tmdb";

// ─── OTT 선택 칩 ─────────────────────────────────────────────────────────────

function OttChip({
  provider,
  selected,
  onPress,
}: {
  provider: OttProvider;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.ottChip,
        selected
          ? { backgroundColor: provider.color, borderColor: provider.color }
          : { borderColor: "#374151" },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.ottChipText,
          { color: selected ? provider.textColor : "#9ca3af" },
        ]}
      >
        {provider.name}
      </Text>
    </Pressable>
  );
}

// ─── 장르 칩 ─────────────────────────────────────────────────────────────────

function GenreChip({
  name,
  selected,
  onPress,
}: {
  name: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.genreChip, selected && styles.genreChipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.genreChipText, selected && styles.genreChipTextSelected]}>
        {name}
      </Text>
    </Pressable>
  );
}

// ─── 콘텐츠 그리드 아이템 ────────────────────────────────────────────────────

function GridItem({
  item,
  mediaType,
}: {
  item: TmdbContent;
  mediaType: MediaType;
}) {
  const router = useRouter();
  const { title, mediaType: itemMediaType } = getContentInfo(item, mediaType);

  return (
    <Pressable
      style={styles.gridItem}
      onPress={() =>
        router.push({
          pathname: "/detail/[id]",
          params: { id: item.id, type: itemMediaType },
        })
      }
    >
      <View style={styles.posterWrapper}>
        <CachedImage path={item.poster_path} size="poster" style={styles.posterFill} />
      </View>
      <Text style={styles.gridTitle} numberOfLines={2}>
        {title}
      </Text>
      {item.vote_average > 0 && (
        <Text style={styles.gridRating}>★ {item.vote_average.toFixed(1)}</Text>
      )}
    </Pressable>
  );
}

// ─── 메인 화면 ────────────────────────────────────────────────────────────────

const ITEM_MIN_WIDTH = 120;

export default function BrowseScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const numColumns = useMemo(
    () => Math.max(3, Math.floor(width / ITEM_MIN_WIDTH)),
    [width]
  );

  const [category, setCategory] = useState<ContentCategory>(CONTENT_CATEGORIES[0]);
  const [selectedProvider, setSelectedProvider] = useState<OttProvider>(OTT_PROVIDERS[0]);
  const [selectedSubGenre, setSelectedSubGenre] = useState(0);

  const mediaType = category.mediaType;
  // 영화·드라마는 세부 장르 칩으로 추가 필터링, 예능·애니 등은 카테고리 자체가 장르
  const isBroad = category.genreId == null;
  const effectiveGenreId = isBroad ? selectedSubGenre : category.genreId!;
  const subGenres = GENRE_OPTIONS[mediaType];

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useBrowseByProvider(mediaType, selectedProvider.id, effectiveGenreId);

  const items = data?.pages.flatMap((p) => p.results) ?? [];

  function handleCategoryChange(c: ContentCategory) {
    setCategory(c);
    setSelectedSubGenre(0);
  }

  function handleProviderSelect(p: OttProvider) {
    setSelectedProvider(p);
    setSelectedSubGenre(0);
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── 헤더 ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>탐색</Text>
      </View>

      {/* ── 카테고리 (영화/드라마/예능/애니/다큐/키즈) ─────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
        style={styles.categoryScroll}
      >
        {CONTENT_CATEGORIES.map((c) => {
          const active = category.key === c.key;
          return (
            <Pressable
              key={c.key}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
              onPress={() => handleCategoryChange(c)}
            >
              <Text
                style={[styles.categoryChipText, active && styles.categoryChipTextActive]}
              >
                {c.emoji} {c.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── OTT 선택 ──────────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.ottRow}
        style={styles.ottScroll}
      >
        {OTT_PROVIDERS.map((p) => (
          <OttChip
            key={p.id}
            provider={p}
            selected={selectedProvider.id === p.id}
            onPress={() => handleProviderSelect(p)}
          />
        ))}
      </ScrollView>

      {/* ── 세부 장르 (영화·드라마에서만) ─────────────────────────────── */}
      {isBroad && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genreRow}
          style={styles.genreScroll}
        >
          {subGenres.map((g) => (
            <GenreChip
              key={g.id}
              name={g.name}
              selected={selectedSubGenre === g.id}
              onPress={() => setSelectedSubGenre(g.id)}
            />
          ))}
        </ScrollView>
      )}

      {/* ── 콘텐츠 결과 ──────────────────────────────────────────────── */}
      <View style={styles.listContainer}>
      {isLoading ? (
        <ActivityIndicator color="#6366f1" style={styles.loader} />
      ) : isError ? (
        <SectionError onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyView
          emoji="🎬"
          title="콘텐츠가 없어요"
          description="다른 OTT 또는 장르를 선택해보세요."
        />
      ) : (
        <FlatList
          data={items}
          key={numColumns}
          keyExtractor={(item) => String(item.id)}
          numColumns={numColumns}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color="#6366f1" style={{ padding: 16 }} />
            ) : null
          }
          renderItem={({ item }) => (
            <GridItem item={item} mediaType={mediaType} />
          )}
        />
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },

  // 헤더
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    color: "#f9fafb",
    fontSize: 22,
    fontWeight: "800",
  },
  // 카테고리 칩
  categoryScroll: { flexGrow: 0, flexShrink: 0, minHeight: 44 },
  categoryRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
    flexDirection: "row",
    flexWrap: "nowrap",
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  categoryChipActive: {
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
  },
  categoryChipText: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "700",
  },
  categoryChipTextActive: {
    color: "#fff",
  },

  // OTT 칩
  ottScroll: { flexGrow: 0, flexShrink: 0, minHeight: 44 },
  ottRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
    flexDirection: "row",
    flexWrap: "nowrap",
  },
  ottChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  ottChipText: {
    fontSize: 13,
    fontWeight: "700",
  },

  // 장르 칩
  genreScroll: { flexGrow: 0, flexShrink: 0, minHeight: 44 },
  genreRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    flexDirection: "row",
    flexWrap: "nowrap",
  },
  genreChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  genreChipSelected: {
    backgroundColor: "rgba(99,102,241,0.2)",
    borderColor: "#6366f1",
  },
  genreChipText: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "600",
  },
  genreChipTextSelected: {
    color: "#818cf8",
  },

  // 그리드
  listContainer: { flex: 1 },
  loader: { marginTop: 60 },
  grid: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  gridRow: {
    gap: 8,
    marginBottom: 16,
  },
  gridItem: {
    flex: 1,
    gap: 6,
  },
  posterWrapper: {
    width: "100%",
    aspectRatio: 2 / 3,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#111827",
  },
  posterFill: {
    width: "100%" as unknown as number,
    height: "100%" as unknown as number,
  },
  gridTitle: {
    color: "#e5e7eb",
    fontSize: 11,
    lineHeight: 15,
  },
  gridRating: {
    color: "#fbbf24",
    fontSize: 10,
    fontWeight: "600",
  },
});
