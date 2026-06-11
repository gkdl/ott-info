import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function TermsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/mypage")} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#f9fafb" />
        </Pressable>
        <Text style={styles.title}>이용약관</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>최종 업데이트: 2025년 1월 1일</Text>

        <Section title="제1조 (목적)">
          {`본 약관은 OTT Info 서비스(이하 "서비스")의 이용 조건 및 절차, 이용자와 서비스 제공자의 권리·의무를 규정함을 목적으로 합니다.`}
        </Section>

        <Section title="제2조 (서비스 내용)">
          {`서비스는 다음을 제공합니다.\n\n• 영화·TV 프로그램 정보 및 OTT 제공 플랫폼 안내\n• 콘텐츠 리뷰 작성 및 조회\n• 즐겨찾기 관리\n• 커뮤니티 활동 (답글, 좋아요 등)`}
        </Section>

        <Section title="제3조 (이용자 의무)">
          {`이용자는 다음 행위를 해서는 안 됩니다.\n\n• 타인을 비방하거나 명예를 훼손하는 콘텐츠 작성\n• 음란·폭력적 내용 게시\n• 서비스의 정상적인 운영을 방해하는 행위\n• 타인의 계정을 도용하는 행위`}
        </Section>

        <Section title="제4조 (콘텐츠 권리)">
          {`• 이용자가 작성한 리뷰 등 콘텐츠의 저작권은 이용자에게 귀속됩니다.\n• 단, 서비스 운영을 위해 해당 콘텐츠를 표시·배포할 수 있는 권한을 허락한 것으로 간주합니다.\n• 영화·TV 정보는 TMDB(The Movie Database) API를 통해 제공됩니다.`}
        </Section>

        <Section title="제5조 (서비스 중단)">
          {`천재지변, 서비스 점검 등 불가피한 사유로 서비스가 일시 중단될 수 있습니다. 이 경우 사전 공지를 원칙으로 합니다.`}
        </Section>

        <Section title="제6조 (면책사항)">
          {`서비스는 TMDB에서 제공하는 콘텐츠 정보의 정확성을 보증하지 않습니다. 이용자 간 분쟁에 대해 서비스 제공자는 개입 의무가 없습니다.`}
        </Section>

        <Section title="제7조 (약관 변경)">
          {`약관 변경 시 앱 내 공지를 통해 7일 전 고지합니다. 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다.`}
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
