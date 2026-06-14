import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useCurrentUser, useCurrentProfile } from "@/store/authStore";
import { useUpdateNickname } from "@/hooks/useAuth";
import { SkeletonBox } from "@/components/shared/Skeleton";

export function ProfileHeader() {
  const user = useCurrentUser();
  const profile = useCurrentProfile();
  const { mutate: updateNickname, isPending } = useUpdateNickname();

  const [modalVisible, setModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");

  function openModal() {
    setInputValue(profile?.nickname ?? "");
    setModalVisible(true);
  }

  function handleSave() {
    if (!user || !inputValue.trim()) return;
    updateNickname(
      { userId: user.id, nickname: inputValue.trim() },
      { onSuccess: () => setModalVisible(false) }
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <SkeletonBox style={styles.avatarSkeleton} />
        <View style={styles.textArea}>
          <SkeletonBox style={{ height: 20, width: 120, borderRadius: 6 }} />
          <SkeletonBox style={{ height: 14, width: 80, borderRadius: 4, marginTop: 6 }} />
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <Image
          source={
            profile.avatar_url
              ? { uri: profile.avatar_url.replace(/^http:\/\//, "https://") }
              : require("@/assets/default-avatar.png")
          }
          style={styles.avatar}
          cachePolicy="memory-disk"
          contentFit="cover"
        />
        <View style={styles.textArea}>
          <View style={styles.nicknameRow}>
            <Text style={styles.nickname}>{profile.nickname}</Text>
            <Pressable onPress={openModal} hitSlop={8} style={styles.editButton}>
              <Text style={styles.editIcon}>✏️</Text>
            </Pressable>
          </View>
          <Text style={styles.label}>카카오 계정</Text>
        </View>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.overlay}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>닉네임 수정</Text>
            <TextInput
              style={styles.textInput}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="닉네임을 입력하세요"
              placeholderTextColor="#4b5563"
              autoFocus
              maxLength={20}
            />
            <View style={styles.buttonRow}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>취소</Text>
              </Pressable>
              <Pressable
                style={[styles.saveButton, isPending && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={isPending}
              >
                {isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveText}>저장</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: "#111827",
    borderRadius: 16,
    marginHorizontal: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#1f2937",
  },
  avatarSkeleton: { width: 64, height: 64, borderRadius: 32 },
  textArea: { flex: 1 },
  nicknameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nickname: { color: "#f9fafb", fontSize: 18, fontWeight: "700" },
  editButton: { padding: 2 },
  editIcon: { fontSize: 14 },
  label: { color: "#6b7280", fontSize: 13, marginTop: 4 },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  card: {
    width: "100%",
    backgroundColor: "#1f2937",
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  cardTitle: {
    color: "#f9fafb",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  textInput: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#f9fafb",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#374151",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#374151",
  },
  cancelText: { color: "#9ca3af", fontSize: 15, fontWeight: "600" },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#6366f1",
  },
  saveText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
