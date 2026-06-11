import React from "react";
import { View, Text, Pressable, StyleSheet, Alert, Platform } from "react-native";
import { Image } from "expo-image";
import { useDeleteReview, useLikeToggle } from "@/hooks/useReviews";
import { useBlockStore } from "@/store/blockStore";
import { useCurrentUser } from "@/store/authStore";
import type { ReplyWithProfile } from "@/types/database";
import type { ReviewSort } from "@/services/review";

interface ReplyCardProps {
  reply: ReplyWithProfile;
  contentId: string;
  contentType: "movie" | "tv";
  sort: ReviewSort;
}

export function ReplyCard({ reply, contentId, contentType, sort }: ReplyCardProps) {
  const user = useCurrentUser();
  const isOwn = user?.id === reply.user_id;
  const isBlocked = useBlockStore((s) => s.isBlocked(reply.user_id));
  const deleteMutation = useDeleteReview();
  const likeMutation = useLikeToggle(contentId, contentType, sort);

  if (isBlocked) return null;

  function handleDelete() {
    if (Platform.OS === "web") {
      if (window.confirm("이 답글을 삭제하시겠습니까?")) {
        deleteMutation.mutate(reply.id);
      }
      return;
    }
    Alert.alert("답글 삭제", "이 답글을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => deleteMutation.mutate(reply.id),
      },
    ]);
  }

  return (
    <View style={styles.container}>
      {/* 들여쓰기 구분선 */}
      <View style={styles.indent} />

      <View style={styles.body}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Image
            source={
              reply.profile.avatar_url
                ? { uri: reply.profile.avatar_url }
                : require("@/assets/default-avatar.png")
            }
            style={styles.avatar}
            cachePolicy="memory-disk"
            contentFit="cover"
          />
          <View style={styles.userMeta}>
            <Text style={styles.nickname}>{reply.profile.nickname}</Text>
            <Text style={styles.timeAgo}>{formatTimeAgo(reply.created_at)}</Text>
          </View>
        </View>

        {/* 본문 */}
        <Text style={styles.comment}>{reply.comment}</Text>

        {/* 액션 */}
        <View style={styles.actions}>
          <Pressable
            style={styles.likeButton}
            onPress={() =>
              likeMutation.mutate({ reviewId: reply.id, isLiked: reply.is_liked_by_me })
            }
            disabled={!user || likeMutation.isPending}
          >
            <Text style={[styles.likeIcon, reply.is_liked_by_me && styles.likeIconActive]}>
              {reply.is_liked_by_me ? "♥" : "♡"}
            </Text>
            <Text style={[styles.likeCount, reply.is_liked_by_me && styles.likeCountActive]}>
              {reply.like_count}
            </Text>
          </Pressable>

          <View style={styles.spacer} />

          {isOwn && (
            <Pressable
              style={styles.textButton}
              onPress={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Text style={styles.deleteLabel}>삭제</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 6,
  },
  indent: {
    width: 2,
    backgroundColor: "#1f2937",
    borderRadius: 1,
    marginLeft: 16,
    marginRight: 12,
  },
  body: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#1f2937",
  },
  userMeta: { flex: 1, gap: 1 },
  nickname: { color: "#d1d5db", fontSize: 12, fontWeight: "600" },
  timeAgo: { color: "#4b5563", fontSize: 10 },
  comment: { color: "#9ca3af", fontSize: 13, lineHeight: 19 },
  actions: { flexDirection: "row", alignItems: "center" },
  likeButton: { flexDirection: "row", alignItems: "center", gap: 3, padding: 2 },
  likeIcon: { color: "#4b5563", fontSize: 14 },
  likeIconActive: { color: "#ef4444" },
  likeCount: { color: "#4b5563", fontSize: 11 },
  likeCountActive: { color: "#ef4444" },
  spacer: { flex: 1 },
  textButton: { padding: 2 },
  deleteLabel: { color: "#6b7280", fontSize: 11 },
});
