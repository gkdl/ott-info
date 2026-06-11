import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useDeleteReview, useLikeToggle, useReplies, useCreateReply } from "@/hooks/useReviews";
import { useBlockStore } from "@/store/blockStore";
import { useCurrentUser } from "@/store/authStore";
import type { ReplyWithProfile } from "@/types/database";
import type { ReviewSort } from "@/services/review";

const MAX_INDENT_DEPTH = 4; // 이 깊이 이상은 들여쓰기 고정

interface ReplyCardProps {
  reply: ReplyWithProfile;
  contentId: string;
  contentType: "movie" | "tv";
  sort: ReviewSort;
  depth?: number;
}

export function ReplyCard({ reply, contentId, contentType, sort, depth = 0 }: ReplyCardProps) {
  const user = useCurrentUser();
  const isOwn = user?.id === reply.user_id;
  const isBlocked = useBlockStore((s) => s.isBlocked(reply.user_id));
  const deleteMutation = useDeleteReview();
  const likeMutation = useLikeToggle(contentId, contentType, sort);

  const [repliesOpen, setRepliesOpen] = useState(false);
  const [replyInputOpen, setReplyInputOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

  const repliesQuery = useReplies(reply.id, repliesOpen);
  const createReplyMutation = useCreateReply(reply.id);

  if (isBlocked) return null;

  const childReplies = repliesQuery.data ?? [];
  const indentDepth = Math.min(depth, MAX_INDENT_DEPTH);

  function handleDelete() {
    if (Platform.OS === "web") {
      if (window.confirm("이 답글을 삭제하시겠습니까?")) {
        deleteMutation.mutate(reply.id);
      }
      return;
    }
    Alert.alert("답글 삭제", "이 답글을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: () => deleteMutation.mutate(reply.id) },
    ]);
  }

  function handleSubmitReply() {
    if (!user) return;
    const trimmed = replyText.trim();
    if (!trimmed) return;
    createReplyMutation.mutate(
      {
        userId: user.id,
        parentId: reply.id,
        contentId,
        contentType,
        contentTitle: reply.content_title,
        posterPath: reply.poster_path,
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
      <View style={[styles.container, { marginLeft: 16 + indentDepth * 12 }]}>
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

            {reply.reply_count > 0 && (
              <Pressable onPress={() => setRepliesOpen((v) => !v)}>
                <Text style={styles.replyCountText}>
                  {repliesOpen ? "▲" : "▼"} {reply.reply_count}
                </Text>
              </Pressable>
            )}

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

          {/* 답글 입력창 */}
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
                <Pressable onPress={() => { setReplyInputOpen(false); setReplyText(""); }}>
                  <Text style={styles.cancelText}>취소</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.replySubmitButton,
                    (createReplyMutation.isPending || !replyText.trim()) && styles.disabled,
                  ]}
                  onPress={handleSubmitReply}
                  disabled={createReplyMutation.isPending || !replyText.trim()}
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
      </View>

      {/* 중첩 답글 */}
      {repliesOpen && (
        <View>
          {repliesQuery.isLoading ? (
            <ActivityIndicator size="small" color="#6366f1" style={{ margin: 8 }} />
          ) : (
            childReplies.map((child) => (
              <ReplyCard
                key={child.id}
                reply={child}
                contentId={contentId}
                contentType={contentType}
                sort={sort}
                depth={depth + 1}
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
  container: {
    flexDirection: "row",
    marginRight: 16,
    marginTop: 6,
  },
  indent: {
    width: 2,
    backgroundColor: "#1f2937",
    borderRadius: 1,
    marginRight: 10,
    flexShrink: 0,
  },
  body: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  avatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#1f2937" },
  userMeta: { flex: 1, gap: 1 },
  nickname: { color: "#d1d5db", fontSize: 12, fontWeight: "600" },
  timeAgo: { color: "#4b5563", fontSize: 10 },
  comment: { color: "#9ca3af", fontSize: 13, lineHeight: 19 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  likeButton: { flexDirection: "row", alignItems: "center", gap: 3, padding: 2 },
  likeIcon: { color: "#4b5563", fontSize: 14 },
  likeIconActive: { color: "#ef4444" },
  likeCount: { color: "#4b5563", fontSize: 11 },
  likeCountActive: { color: "#ef4444" },
  replyButton: { padding: 2 },
  replyButtonText: { color: "#6b7280", fontSize: 11 },
  replyCountText: { color: "#6366f1", fontSize: 11, fontWeight: "600" },
  spacer: { flex: 1 },
  textButton: { padding: 2 },
  deleteLabel: { color: "#6b7280", fontSize: 11 },
  // 답글 입력
  replyInputContainer: {
    backgroundColor: "#111827",
    borderRadius: 8,
    padding: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  replyInput: {
    color: "#e5e7eb",
    fontSize: 13,
    lineHeight: 18,
    minHeight: 48,
    maxHeight: 100,
  },
  replyInputActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
  },
  cancelText: { color: "#6b7280", fontSize: 12 },
  replySubmitButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    minWidth: 44,
    alignItems: "center",
  },
  replySubmitText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  disabled: { opacity: 0.4 },
});
