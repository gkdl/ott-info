import React, { useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { PosterImage } from "@/components/ui/CachedImage";
import { EmptyView, SectionError } from "@/components/shared/StateViews";
import { SkeletonBox } from "@/components/shared/Skeleton";
import { useFavoriteList } from "@/hooks/useFavorite";
import type { FavoriteItem } from "@/types/database";

const COLUMNS = 3;
const GAP = 8;

export function FavoritesGrid() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const itemWidth = Math.floor((width - 32 - GAP * (COLUMNS - 1)) / COLUMNS);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFavoriteList();

  const items = data?.pages.flat() ?? [];

  const renderItem = useCallback(
    ({ item }: { item: FavoriteItem }) => (
      <Pressable
        style={{ width: itemWidth }}
        onPress={() =>
          router.push({
            pathname: "/detail/[id]",
            params: { id: item.content_id, type: item.content_type },
          })
        }
      >
        <PosterImage path={item.poster_path} width={itemWidth} />
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.title}
        </Text>
      </Pressable>
    ),
    [itemWidth, router]
  );

  if (isLoading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>즐겨찾기</Text>
        <View style={styles.gridSkeleton}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBox
              key={i}
              style={{ width: itemWidth, height: itemWidth * 1.5, borderRadius: 8 }}
            />
          ))}
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>즐겨찾기</Text>
        <SectionError onRetry={refetch} />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle}>즐겨찾기</Text>
        {items.length > 0 && (
          <Text style={styles.count}>{items.length}개</Text>
        )}
      </View>

      {items.length === 0 ? (
        <EmptyView
          emoji="⭐"
          title="즐겨찾기가 없어요"
          description="마음에 드는 콘텐츠를 즐겨찾기에 추가해보세요."
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => `${item.content_id}-${item.content_type}`}
          numColumns={COLUMNS}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={{ gap: GAP, paddingHorizontal: 16 }}
          renderItem={renderItem}
          scrollEnabled={false} // 부모 ScrollView가 스크롤 담당
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                color="#6366f1"
                style={{ paddingVertical: 12 }}
              />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 14 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  sectionTitle: { color: "#f9fafb", fontSize: 16, fontWeight: "700" },
  count: { color: "#6b7280", fontSize: 13 },
  itemTitle: {
    color: "#d1d5db",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 6,
  },
  gridSkeleton: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
    paddingHorizontal: 16,
  },
});
