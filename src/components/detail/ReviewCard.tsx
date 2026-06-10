import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActionSheetIOS, Platform, Alert } from "react-native";
import { Image } from "expo-image";
import { useDeleteReview, useLikeToggle } from "@/hooks/useReviews";
import { useReportAndBlock, REPORT_REASONS } from "@/hooks/useSafety";
import { useBlockStore } from "@/store/blockStore";
import { useCurrentUser } from "@/store/authStore";
import type { ReviewWithProfile } from "@/types/database";
import type { ReviewSort } from "@/services/review";

interface ReviewCardProps {
  review: ReviewWithProfile;
  contentId: string;
  contentType: "movie" | "tv";
  sort: ReviewSort;
  onEditRequest: (review: ReviewWithProfile) => void;
}

export function ReviewCard({
  review,
  contentId,
  contentType,
  sort,
  onEditRequest,
}: ReviewCardProps) {
  const user = useCurrentUser();
  const isOwn = user?.id === review.user_id;
  const isBlocked = useBlockStore((s) => s.isBlocked(review.user_id));

  const deleteMutation = useDeleteReview();
  const likeMutation = useLikeToggle(contentId, contentType, sort);
  const { reportAndBlock, isPending: safetyPending } = useReportAndBlock();

  // 차단된 유저 리뷰는 렌더 자체를 하지 않음
  if (isBlocked) return null;

  const timeAgo = formatTimeAgo(review.created_at);

  function handleDelete() {
    Alert.alert("리뷰 삭제", "이 리뷰를 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => deleteMutation.mutate(review.id),
      },
    ]);
  }

  function handleSafetyAction() {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: "이 리뷰를 신고하고 차단하시겠습니까?",
          options: ["취소", ...REPORT_REASONS],
          cancelButtonIndex: 0,
          destructiveButtonIndex: REPORT_REASONS.length,
        },
        (idx) => {
          if (idx === 0) return;
          const reason = REPORT_REASONS[idx - 1];
          reportAndBlock(review.id, review.user_id, reason);
        }
      );
    } else {
      // Android: Alert 방식
      Alert.alert(
        "신고 사유 선택",
        undefined,
        [
          ...REPORT_REASONS.map((reason) => ({
            text: reason,
            onPress: () => reportAndBlock(review.id, review.user_id, reason),
          })),
          { text: "취소", style: "cancel" as const },
        ]
      );
    }
  }

  return (
    <View style={styles.card}>
      {/* 헤더: 아바타 + 닉네임 + 별점 */}
      <View style={styles.header}>
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
        <View style={styles.userMeta}>
          <Text style={styles.nickname} numberOfLines={1}>
            {review.profile.nickname}
          </Text>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>

        {/* 별점 */}
        <View style={styles.starRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Text
              key={i}
              style={i < review.rating ? styles.starFilled : styles.starEmpty}
            >
              ★
            </Text>
          ))}
        </View>
      </View>

      {/* 리뷰 본문 */}
      <Text style={styles.comment}>{review.comment}</Text>

      {/* 액션 바 */}
      <View style={styles.actions}>
        {/* 좋아요 */}
        <Pressable
          style={styles.likeButton}
          onPress={() =>
            likeMutation.mutate({
              reviewId: review.id,
              isLiked: review.is_liked_by_me,
            })
          }
          disabled={!user || likeMutation.isPending}
        >
          <Text style={[styles.likeIcon, review.is_liked_by_me && styles.likeIconActive]}>
            {review.is_liked_by_me ? "♥" : "♡"}
          </Text>
          <Text style={[styles.likeCount, review.is_liked_by_me && styles.likeCountActive]}>
            {review.like_count}
          </Text>
        </Pressable>

        <View style={styles.spacer} />

        {/* 본인 리뷰: 수정/삭제 */}
        {isOwn ? (
          <View style={styles.ownerActions}>
            <Pressable style={styles.textButton} onPress={() => onEditRequest(review)}>
              <Text style={styles.textButtonLabel}>수정</Text>
            </Pressable>
            <Pressable
              style={styles.textButton}
              onPress={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Text style={[styles.textButtonLabel, styles.deleteLabel]}>삭제</Text>
            </Pressable>
          </View>
        ) : (
          /* 타인 리뷰: 신고/차단 */
          user && (
            <Pressable
              style={styles.textButton}
              onPress={handleSafetyAction}
              disabled={safetyPending}
            >
              <Text style={styles.reportLabel}>신고</Text>
            </Pressable>
          )
        )}
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
  card: {
    backgroundColor: "#111827",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#1f2937",
  },
  userMeta: { flex: 1, gap: 2 },
  nickname: { color: "#e5e7eb", fontSize: 13, fontWeight: "600" },
  timeAgo: { color: "#6b7280", fontSize: 11 },
  starRow: { flexDirection: "row", gap: 1 },
  starFilled: { color: "#fbbf24", fontSize: 12 },
  starEmpty: { color: "#374151", fontSize: 12 },
  comment: { color: "#d1d5db", fontSize: 14, lineHeight: 21 },
  actions: { flexDirection: "row", alignItems: "center" },
  likeButton: { flexDirection: "row", alignItems: "center", gap: 4, padding: 4 },
  likeIcon: { color: "#6b7280", fontSize: 18 },
  likeIconActive: { color: "#ef4444" },
  likeCount: { color: "#6b7280", fontSize: 13 },
  likeCountActive: { color: "#ef4444" },
  spacer: { flex: 1 },
  ownerActions: { flexDirection: "row", gap: 12 },
  textButton: { padding: 4 },
  textButtonLabel: { color: "#9ca3af", fontSize: 13 },
  deleteLabel: { color: "#ef4444" },
  reportLabel: { color: "#9ca3af", fontSize: 13 },
});
