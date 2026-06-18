import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { CachedImage } from "@/components/ui/CachedImage";
import type { ReviewWithProfile } from "@/types/database";

// 커뮤니티 리뷰 카드 — 홈 피드(CommunityFeed)와 커뮤니티 탭에서 공용 사용.

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={styles.stars}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Text key={i} style={i < rating ? styles.starFilled : styles.starEmpty}>
          ★
        </Text>
      ))}
    </View>
  );
}

export function ReviewFeedCard({ review }: { review: ReviewWithProfile }) {
  const router = useRouter();
  const timeAgo = formatTimeAgo(review.created_at);
  const mediaIcon = review.content_type === "tv" ? "📺" : "🎬";

  return (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/detail/[id]",
          params: { id: review.content_id, type: review.content_type },
        })
      }
    >
      {/* 좌측: 포스터 */}
      <CachedImage path={review.poster_path} size="thumb" style={styles.poster} />

      {/* 우측: 콘텐츠 */}
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.mediaIcon}>{mediaIcon}</Text>
          <Text style={styles.contentTitle} numberOfLines={1}>
            {review.content_title}
          </Text>
        </View>

        <View style={styles.userRow}>
          <Image
            source={
              review.profile.avatar_url
                ? { uri: review.profile.avatar_url }
                : require("@/assets/default-avatar.png")
            }
            style={styles.avatar}
            cachePolicy="memory-disk"
            contentFit="cover"
          />
          <Text style={styles.nickname} numberOfLines={1}>
            {review.profile.nickname}
          </Text>
          <StarRating rating={review.rating} />
        </View>

        <Text style={styles.comment} numberOfLines={2}>
          {review.comment}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
          {review.like_count > 0 && (
            <Text style={styles.likeCount}>♥ {review.like_count}</Text>
          )}
          {review.reply_count > 0 && (
            <Text style={styles.replyCount}>💬 {review.reply_count}</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

const POSTER_W = 72;
const POSTER_H = Math.round(POSTER_W * 1.5);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#111827",
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  poster: {
    width: POSTER_W,
    height: POSTER_H,
    borderRadius: 8,
    backgroundColor: "#1f2937",
    flexShrink: 0,
  },
  cardBody: { flex: 1, gap: 6 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  mediaIcon: { fontSize: 12 },
  contentTitle: { flex: 1, color: "#6366f1", fontSize: 13, fontWeight: "700" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#1f2937",
  },
  nickname: { flex: 1, color: "#9ca3af", fontSize: 11, fontWeight: "600" },
  stars: { flexDirection: "row", gap: 1 },
  starFilled: { color: "#fbbf24", fontSize: 10 },
  starEmpty: { color: "#374151", fontSize: 10 },
  comment: { color: "#d1d5db", fontSize: 13, lineHeight: 19 },
  footer: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2 },
  timeAgo: { color: "#4b5563", fontSize: 11 },
  likeCount: { color: "#6b7280", fontSize: 11 },
  replyCount: { color: "#6b7280", fontSize: 11 },
});
