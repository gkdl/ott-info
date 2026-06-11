import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

interface EulaModalProps {
  visible: boolean;
  onAgree: () => Promise<void>;
  onDecline: () => void;
}

// Apple App Store 1.2 / Google Play UGC 정책 필수 항목:
// 가입 시 불쾌 콘텐츠 무관용(zero-tolerance) 정책에 동의 절차 포함.

export function EulaModal({ visible, onAgree, onDecline }: EulaModalProps) {
  const [loading, setLoading] = useState(false);

  async function handleAgree() {
    setLoading(true);
    try {
      await onAgree();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>서비스 이용약관 동의</Text>
          <Text style={styles.subtitle}>
            서비스 이용 전 아래 내용을 확인하고 동의해주세요.
          </Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
          >
            <Text style={styles.sectionTitle}>커뮤니티 이용 규칙 (무관용 정책)</Text>
            <Text style={styles.body}>
              본 서비스는 건전한 커뮤니티 환경 조성을 위해 다음 행위를 엄격히
              금지하며, 위반 시 사전 통보 없이 계정을 영구 정지할 수 있습니다.{"\n\n"}
              • 욕설, 혐오 표현, 차별적 발언{"\n"}
              • 타인에 대한 비방, 명예훼손{"\n"}
              • 스팸, 광고, 도배 게시물{"\n"}
              • 개인정보 무단 공개{"\n"}
              • 저작권 침해 콘텐츠{"\n"}
              • 기타 관련 법령 위반 행위{"\n"}
            </Text>

            <Text style={styles.sectionTitle}>신고 및 조치</Text>
            <Text style={styles.body}>
              부적절한 콘텐츠를 발견한 경우 신고 기능을 이용해주세요.
              신고된 콘텐츠는 24시간 이내에 검토 후 조치됩니다.{"\n"}
            </Text>

            <Text style={styles.sectionTitle}>개인정보 수집 및 이용</Text>
            <Text style={styles.body}>
              카카오 로그인을 통해 닉네임, 프로필 이미지를 수집합니다.
              수집된 정보는 서비스 제공 목적 외에 사용되지 않습니다.
              개인정보 처리방침은 앱 설정 {">"} 개인정보 처리방침에서 확인할 수 있습니다.{"\n"}
            </Text>

            <Text style={styles.sectionTitle}>계정 삭제</Text>
            <Text style={styles.body}>
              앱 내 마이페이지 또는 웹사이트를 통해 언제든지 계정과 관련
              데이터를 삭제할 수 있습니다.
            </Text>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              style={styles.declineButton}
              onPress={onDecline}
              disabled={loading}
            >
              <Text style={styles.declineText}>동의 안 함</Text>
            </Pressable>

            <Pressable
              style={[styles.agreeButton, loading && styles.disabled]}
              onPress={handleAgree}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.agreeText}>동의하고 시작하기</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#111827",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: "80%",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f9fafb",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 16,
  },
  scroll: {
    maxHeight: 320,
    marginBottom: 16,
  },
  scrollContent: {
    paddingRight: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e5e7eb",
    marginBottom: 6,
    marginTop: 12,
  },
  body: {
    fontSize: 13,
    color: "#9ca3af",
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#374151",
    alignItems: "center",
  },
  declineText: {
    color: "#9ca3af",
    fontSize: 15,
    fontWeight: "600",
  },
  agreeButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#FEE500",
    alignItems: "center",
  },
  agreeText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.6,
  },
});
