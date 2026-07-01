import React from "react";
import { View, Text, FlatList, Pressable, Linking, StyleSheet } from "react-native";
import { Image } from "expo-image";
import type { TmdbVideo } from "@/types/tmdb";

interface TrailerSectionProps {
  videos?: TmdbVideo[];
}

// 예고편 우선순위: Trailer > Teaser, 공식 영상 우선, 한국어 약간 우선
function rank(v: TmdbVideo): number {
  let score = 0;
  if (v.type === "Trailer") score -= 4;
  else if (v.type === "Teaser") score -= 2;
  if (v.official) score -= 1;
  if (v.iso_639_1 === "ko") score -= 1;
  return score;
}

function selectTrailers(videos: TmdbVideo[]): TmdbVideo[] {
  const youtube = videos.filter((v) => v.site === "YouTube" && v.key);
  const trailers = youtube.filter(
    (v) => v.type === "Trailer" || v.type === "Teaser"
  );
  const pool = trailers.length > 0 ? trailers : youtube;
  return [...pool].sort((a, b) => rank(a) - rank(b));
}

export function TrailerSection({ videos }: TrailerSectionProps) {
  const trailers = selectTrailers(videos ?? []);
  if (trailers.length === 0) return null;

  function openTrailer(key: string) {
    // YouTube 앱이 있으면 앱으로, 없으면 브라우저로 열림
    Linking.openURL(`https://www.youtube.com/watch?v=${key}`).catch(() => {});
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>예고편</Text>
      <FlatList
        data={trailers}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => openTrailer(item.key)}>
            <View style={styles.thumbWrap}>
              <Image
                source={{ uri: `https://img.youtube.com/vi/${item.key}/hqdefault.jpg` }}
                style={styles.thumb}
                contentFit="cover"
                transition={200}
              />
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.name}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  title: {
    color: "#f9fafb",
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 16,
  },
  list: { paddingHorizontal: 16 },
  card: { width: 240, gap: 6 },
  thumbWrap: {
    width: 240,
    height: 135,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#111827",
  },
  thumb: { width: "100%", height: "100%" },
  cardTitle: { color: "#e5e7eb", fontSize: 12, lineHeight: 16 },
});
