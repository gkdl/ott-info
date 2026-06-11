import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  ActionSheetIOS,
  Platform,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useDeleteReview, useLikeToggle, useReplies, useCreateReply } from "@/hooks/useReviews";
import { useReportAndBlock, REPORT_REASONS } from "@/hooks/useSafety";
import { useBlockStore } from "@/store/blockStore";
import { useCurrentUser } from "@/store/authStore";
import { ReplyCard } from "./ReplyCard";
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

  const [repliesOpen, setRepliesOpen] = useState(false);
  const [replyInputOpen, setReplyInputOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

  const deleteMutation = useDeleteReview();
  const likeMutation = useLikeToggle(contentId, contentType, sort);
  const { reportAndBlock, isPending: safetyPending } = useReportAndBlock();

  const repliesQuery = useReplies(review.id, repliesOpen);
  const createReplyMutation = useCreateReply(review.id);

  if (isBlocked) return null;

  const allReplies = repliesQuery.data ?? [];
  const timeAgo = formatTimeAgo(review.created_at);

  function handleDelete() {
    if (Platform.OS === "web") {
      if (window.confirm("이 리뷰를 삭제하시겠습니까?")) {
        deleteMutation.mutate(review.id);
      }
      return;
    }
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
          reportAndBlock(review.id, review.user_id, REPORT_REASONS[idx - 1]);
        }
      );
    } else {
      Alert.alert("신고 사유 선택", undefined, [
        ...REPORT_REASONS.map((reason) => ({
          text: reason,
          onPress: () => reportAndBlock(review.id, review.user_id, reason),
        })),
        { text: "취소", style: "cancel" as const },
      ]);
    }
  }

  function handleToggleReplies() {
    setRepliesOpen((v) => !v);
    setReplyInputOpen(false);
  }

  function handleSubmitReply() {
    if (!user) return;
    const trimmed = replyText.trim();
    if (trimmed.length < 1) return;

    createReplyMutation.mutate(
      {
        userId: user.id,
        parentId: review.id,
        contentId,
        contentType,
        contentTitle: review.content_title,
        posterPath: review.poster_path,
        comment: trimmed,
      },
      {
        onSuccess: () => {
          setReplyText("");
          setReplyInputOpen(false);
          setRepliesOpen(true);
        },
      }
    );
  }

  return (
    <View>
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

          <View style={styles.starRow}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Text key={i} style={i < review.rating ? styles.starFilled : styles.starEmpty}>
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
              likeMutation.mutate({ reviewId: review.id, isLiked: review.is_liked_by_me })
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

          {/* 답글 버튼 */}
          {user && (
            <Pressable
              style={styles.replyButton}
              onPress={() => {
                setReplyInputOpen((v) => !v);
                if (!repliesOpen) setRepliesOpen(true);
              }}
            >
              <Text style={styles.replyButtonText}>💬 답글</Text>
            </Pressable>
          )}

          {/* 답글 수 */}
          {review.reply_count > 0 && (
            <Pressable style={styles.replyCountButton} onPress={handleToggleReplies}>
              <Text style={styles.replyCountText}>
                {repliesOpen ? "▲" : "▼"} 답글 {review.reply_count}개
              </Text>
            </Pressable>
          )}

          <View style={styles.spacer} />

          {/* 본인: 수정/삭제 */}
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

        {/* 인라인 답글 입력창 */}
        {replyInputOpen && (
          <View style={styles.replyInputContainer}>
            <TextInput
              style={styles.replyInput}
              value={replyText}
              onChangeText={setReplyText}
              placeholder="답글을 입력하세요..."
              placeholderTextColor="#4b5563"
              multiline
              maxLength={1000}
              autoFocus
            />
            <View style={styles.replyInputActions}>
              <Pressable
                onPress={() => { setReplyInputOpen(false); setReplyText(""); }}
              >
                <Text style={styles.cancelText}>취소</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.replySubmitButton,
                  (createReplyMutation.isPending || replyText.trim().length === 0) &&
                    styles.disabled,
                ]}
                onPress={handleSubmitReply}
                disabled={createReplyMutation.isPending || replyText.trim().length === 0}
              >
                {createReplyMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.replySubmitText}>등록</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* 답글 목록 */}
      {repliesOpen && (
        <View style={styles.repliesContainer}>
          {repliesQuery.isLoading ? (
            <ActivityIndicator
              size="small"
              color="#6366f1"
              style={{ marginVertical: 8, marginLeft: 44 }}
            />
          ) : (
            allReplies.map((reply) => (
              <ReplyCard
                key={reply.id}
                reply={reply}
                contentId={contentId}
                contentType={contentType}
                sort={sort}
              />
            ))
          )}
        </View>
      )}
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
    marginBottom: 4,
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
  actions: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  likeButton: { flexDirection: "row", alignItems: "center", gap: 4, padding: 4 },
  likeIcon: { color: "#6b7280", fontSize: 18 },
  likeIconActive: { color: "#ef4444" },
  likeCount: { color: "#6b7280", fontSize: 13 },
  likeCountActive: { color: "#ef4444" },
  replyButton: { padding: 4 },
  replyButtonText: { color: "#6b7280", fontSize: 13 },
  replyCountButton: { padding: 4 },
  replyCountText: { color: "#6366f1", fontSize: 12, fontWeight: "600" },
  spacer: { flex: 1 },
  ownerActions: { flexDirection: "row", gap: 12 },
  textButton: { padding: 4 },
  textButtonLabel: { color: "#9ca3af", fontSize: 13 },
  deleteLabel: { color: "#ef4444" },
  reportLabel: { color: "#9ca3af", fontSize: 13 },
  // 답글 입력
  replyInputContainer: {
    backgroundColor: "#0f172a",
    borderRadius: 10,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  replyInput: {
    color: "#e5e7eb",
    fontSize: 14,
    lineHeight: 20,
    minHeight: 60,
    maxHeight: 120,
  },
  replyInputActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
  },
  cancelText: { color: "#6b7280", fontSize: 13 },
  replySubmitButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    minWidth: 52,
    alignItems: "center",
  },
  replySubmitText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  disabled: { opacity: 0.4 },
  // 답글 목록
  repliesContainer: { marginBottom: 10, gap: 4 },
});
