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
        <Text style={styles.updated}>최종 업데이트: 2026년 6월 12일</Text>

        <Section title="1. 수집하는 개인정보">
          {`본 서비스는 카카오 소셜 로그인을 통해 다음 정보를 수집합니다.\n\n• 카카오 계정 고유 식별자\n• 닉네임\n• 프로필 사진 URL\n\n서비스 이용 과정에서 작성한 리뷰, 즐겨찾기 목록, 신고/차단 내역이 저장됩니다.\n\n또한 광고 게재 및 서비스 운영을 위해 다음 정보가 자동으로 수집될 수 있습니다.\n\n• 광고 식별자(Google 광고 ID, AAID)\n• 기기 정보(모델, OS 버전, 네트워크 상태) 및 IP 기반 대략적 위치\n• 광고 노출·클릭 등 상호작용 정보`}
        </Section>

        <Section title="2. 수집 목적">
          {`• 회원 식별 및 로그인 서비스 제공\n• 리뷰·즐겨찾기 등 사용자 데이터 저장\n• 부적절한 콘텐츠 신고 및 차단 처리\n• 광고 게재 및 광고 성과 측정`}
        </Section>

        <Section title="3. 보유 및 이용 기간">
          {`회원 탈퇴 시 모든 개인정보 및 관련 데이터를 즉시 삭제(파기)합니다.\n단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관 후 파기합니다.`}
        </Section>

        <Section title="4. 광고 및 광고 식별자">
          {`본 서비스는 Google AdMob 광고 SDK를 사용합니다. 이 과정에서 광고 식별자 및 기기 정보가 수집되어 Google에 의해 광고 게재·측정 목적으로 처리되며, 자세한 사항은 Google의 개인정보처리방침(https://policies.google.com/privacy)을 따릅니다.\n\n이용자는 기기 설정에서 맞춤형 광고를 끄거나 광고 식별자를 재설정·삭제할 수 있습니다.\n\n• Android: 설정 > Google > 광고 > 광고 ID 삭제 / 맞춤 광고 선택 해제\n• iOS: 설정 > 개인정보 보호 및 보안 > 추적 > 앱 추적 허용 해제`}
        </Section>

        <Section title="5. 개인정보 처리위탁">
          {`원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.\n\n• Supabase Inc.(미국): 데이터베이스 및 인증 인프라 운영\n• Google LLC: 광고 게재(AdMob)\n\n이 외 TMDB(The Movie Database)는 콘텐츠 정보 조회에만 이용되며 개인정보를 전송하지 않습니다.`}
        </Section>

        <Section title="6. 제3자 제공">
          {`수집한 개인정보는 법령에 의한 경우를 제외하고 제3자에게 제공하지 않습니다.`}
        </Section>

        <Section title="7. 만 14세 미만 아동의 개인정보">
          {`본 서비스는 만 14세 미만 아동을 대상으로 하지 않으며, 해당 아동의 개인정보를 고의로 수집하지 않습니다. 수집된 사실이 확인될 경우 지체 없이 파기합니다.`}
        </Section>

        <Section title="8. 이용자의 권리">
          {`• 언제든지 앱 내 마이페이지 → 회원탈퇴를 통해 모든 데이터 삭제 가능\n• 개인정보 열람·정정·삭제·처리정지 요청은 아래 연락처로 문의 가능`}
        </Section>

        <Section title="9. 권익침해 구제방법">
          {`개인정보 침해 상담·신고가 필요한 경우 아래 기관에 문의할 수 있습니다.\n\n• 개인정보분쟁조정위원회: 1833-6972 (www.kopico.go.kr)\n• 개인정보침해신고센터: 118 (privacy.kisa.or.kr)\n• 대검찰청 사이버수사과: 1301\n• 경찰청 사이버수사국: 182 (ecrm.police.go.kr)`}
        </Section>

        <Section title="10. 개인정보 보호책임자 및 문의처">
          {`개인정보 처리에 관한 문의·불만·피해구제는 아래로 연락해 주시기 바랍니다.\n\n• 개인정보 보호책임자: 임대영\n• 이메일: limyoung9222@gmail.com`}
        </Section>

        <Section title="11. 처리방침의 변경">
          {`본 개인정보 처리방침은 법령·서비스 변경에 따라 수정될 수 있으며, 변경 시 앱 내 공지 또는 본 페이지를 통해 고지합니다.`}
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
