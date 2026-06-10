import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { useCreateReview, useUpdateReview } from "@/hooks/useReviews";
import { useCurrentUser } from "@/store/authStore";
import type { ReviewWithProfile } from "@/types/database";

interface ReviewFormProps {
  contentId: string;
  contentType: "movie" | "tv";
  contentTitle: string;
  posterPath: string | null;
  existingReview?: ReviewWithProfile | null;
  onDone?: () => void;
}

export function ReviewForm({
  contentId,
  contentType,
  contentTitle,
  posterPath,
  existingReview,
  onDone,
}: ReviewFormProps) {
  const user = useCurrentUser();
  const isEditing = !!existingReview;

  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");

  const createMutation = useCreateReview(contentId, contentType);
  const updateMutation = useUpdateReview(contentId, contentType);
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function handleSubmit() {
    if (!user) {
      Alert.alert("로그인이 필요합니다.");
      return;
    }
    if (rating === 0) {
      Alert.alert("별점을 선택해주세요.");
      return;
    }
    if (comment.trim().length < 2) {
      Alert.alert("리뷰를 2자 이상 입력해주세요.");
      return;
    }

    if (isEditing && existingReview) {
      updateMutation.mutate(
        { reviewId: existingReview.id, rating, comment: comment.trim() },
        { onSuccess: () => onDone?.() }
      );
    } else {
      createMutation.mutate(
        {
          userId: user.id,
          contentId,
          contentType,
          contentTitle,
          posterPath,
          rating,
          comment: comment.trim(),
        },
        { onSuccess: () => { setRating(0); setComment(""); onDone?.(); } }
      );
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isEditing ? "리뷰 수정" : "리뷰 작성"}</Text>

      {/* 별점 선택 */}
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable key={star} onPress={() => setRating(star)}>
            <Text style={[styles.star, star <= rating && styles.starActive]}>
              ★
            </Text>
          </Pressable>
        ))}
        <Text style={styles.ratingLabel}>
          {rating > 0 ? `${rating}점` : "별점 선택"}
        </Text>
      </View>

      {/* 텍스트 입력 */}
      <TextInput
        style={styles.input}
        value={comment}
        onChangeText={setComment}
        placeholder="이 작품에 대한 솔직한 리뷰를 남겨주세요. (최대 1000자)"
        placeholderTextColor="#4b5563"
        multiline
        maxLength={1000}
        textAlignVertical="top"
      />

      <View style={styles.footer}>
        <Text style={styles.charCount}>{comment.length} / 1000</Text>
        <View style={styles.actions}>
          {isEditing && (
            <Pressable style={styles.cancelButton} onPress={onDone}>
              <Text style={styles.cancelText}>취소</Text>
            </Pressable>
          )}
          <Pressable
            style={[styles.submitButton, isPending && styles.disabled]}
            onPress={handleSubmit}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                {isEditing ? "수정 완료" : "리뷰 등록"}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginHorizontal: 16,
  },
  title: { color: "#f9fafb", fontSize: 15, fontWeight: "700" },
  stars: { flexDirection: "row", alignItems: "center", gap: 6 },
  star: { fontSize: 28, color: "#374151" },
  starActive: { color: "#fbbf24" },
  ratingLabel: { color: "#9ca3af", fontSize: 13, marginLeft: 4 },
  input: {
    backgroundColor: "#1f2937",
    borderRadius: 10,
    padding: 12,
    color: "#e5e7eb",
    fontSize: 14,
    lineHeight: 21,
    minHeight: 100,
    maxHeight: 200,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  charCount: { color: "#6b7280", fontSize: 12 },
  actions: { flexDirection: "row", gap: 8 },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  cancelText: { color: "#9ca3af", fontSize: 14 },
  submitButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#6366f1",
    minWidth: 80,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  disabled: { opacity: 0.5 },
});
