import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/mypage")} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#f9fafb" />
        </Pressable>
        <Text style={styles.title}>개인정보 처리방침</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>최종 업데이트: 2025년 1월 1일</Text>

        <Section title="1. 수집하는 개인정보">
          {`본 서비스는 카카오 소셜 로그인을 통해 다음 정보를 수집합니다.\n\n• 카카오 계정 고유 식별자\n• 닉네임\n• 프로필 사진 URL\n\n서비스 이용 과정에서 작성한 리뷰, 즐겨찾기 목록, 신고/차단 내역이 저장됩니다.`}
        </Section>

        <Section title="2. 수집 목적">
          {`• 회원 식별 및 로그인 서비스 제공\n• 리뷰·즐겨찾기 등 사용자 데이터 저장\n• 부적절한 콘텐츠 신고 및 차단 처리`}
        </Section>

        <Section title="3. 보유 및 이용 기간">
          {`회원 탈퇴 시 모든 개인정보 및 관련 데이터를 즉시 삭제합니다.\n단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.`}
        </Section>

        <Section title="4. 제3자 제공">
          {`수집한 개인정보는 법령에 의한 경우를 제외하고 제3자에게 제공하지 않습니다.`}
        </Section>

        <Section title="5. 사용하는 외부 서비스">
          {`• Supabase: 데이터베이스 및 인증 서비스 (미국)\n• TMDB(The Movie Database): 영화·TV 콘텐츠 정보 제공\n• 카카오: 소셜 로그인 인증`}
        </Section>

        <Section title="6. 사용자 권리">
          {`• 언제든지 앱 내 마이페이지 → 회원탈퇴를 통해 모든 데이터 삭제 가능\n• 개인정보 처리에 관한 문의는 앱 내 문의 기능을 이용해주세요.`}
        </Section>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#030712" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 4,
  },
  backButton: { padding: 8 },
  title: { color: "#f9fafb", fontSize: 18, fontWeight: "700" },
  content: { paddingHorizontal: 20, paddingBottom: 40, gap: 24 },
  updated: { color: "#6b7280", fontSize: 12, marginBottom: 4 },
  section: { gap: 8 },
  sectionTitle: { color: "#e5e7eb", fontSize: 15, fontWeight: "700" },
  sectionBody: { color: "#9ca3af", fontSize: 14, lineHeight: 22 },
});
