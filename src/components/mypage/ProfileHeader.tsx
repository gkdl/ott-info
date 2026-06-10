import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useCurrentProfile } from "@/store/authStore";
import { SkeletonBox } from "@/components/shared/Skeleton";

export function ProfileHeader() {
  const profile = useCurrentProfile();

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
    <View style={styles.container}>
      <Image
        source={
          profile.avatar_url
            ? { uri: profile.avatar_url }
            : require("@/assets/default-avatar.png")
        }
        style={styles.avatar}
        cachePolicy="memory-disk"
        contentFit="cover"
      />
      <View style={styles.textArea}>
        <Text style={styles.nickname}>{profile.nickname}</Text>
        <Text style={styles.label}>카카오 계정</Text>
      </View>
    </View>
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
  nickname: { color: "#f9fafb", fontSize: 18, fontWeight: "700" },
  label: { color: "#6b7280", fontSize: 13, marginTop: 4 },
});
