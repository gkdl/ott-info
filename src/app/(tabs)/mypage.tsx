import React from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ProfileHeader } from "@/components/mypage/ProfileHeader";
import { FavoritesGrid } from "@/components/mypage/FavoritesGrid";
import { MyReviewList } from "@/components/mypage/MyReviewList";
import { AccountActions } from "@/components/mypage/AccountActions";
import { useAuthStatus } from "@/store/authStore";

export default function MyPageScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const authStatus = useAuthStatus();

  // 비로그인 상태
  if (authStatus === "unauthenticated") {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.loginPromptEmoji}>👤</Text>
        <Text style={styles.loginPromptTitle}>로그인이 필요해요</Text>
        <Text style={styles.loginPromptDesc}>
          카카오 로그인 후 즐겨찾기와 리뷰를 관리할 수 있습니다.
        </Text>
        <Pressable
          style={styles.loginButton}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.loginButtonText}>로그인하기</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 페이지 타이틀 */}
        <Text style={styles.pageTitle}>마이페이지</Text>

        {/* 프로필 카드 */}
        <ProfileHeader />

        <View style={styles.sections}>
          {/* 즐겨찾기 그리드 */}
          <FavoritesGrid />

          <View style={styles.divider} />

          {/* 내 리뷰 목록 */}
          <MyReviewList />

          <View style={styles.divider} />

          {/* 로그아웃 / 회원탈퇴 / 약관 */}
          <AccountActions />

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },
  centered: { justifyContent: "center", alignItems: "center", gap: 12, padding: 32 },
  pageTitle: {
    color: "#f9fafb",
    fontSize: 24,
    fontWeight: "800",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  sections: { gap: 28, paddingTop: 24 },
  divider: { height: 1, marginHorizontal: 16, backgroundColor: "#1f2937" },
  loginPromptEmoji: { fontSize: 56 },
  loginPromptTitle: { color: "#f9fafb", fontSize: 20, fontWeight: "700" },
  loginPromptDesc: { color: "#6b7280", fontSize: 14, textAlign: "center", lineHeight: 22 },
  loginButton: {
    marginTop: 8,
    backgroundColor: "#FEE500",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  loginButtonText: { color: "#000", fontWeight: "700", fontSize: 16 },
});
