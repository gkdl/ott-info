import React from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EulaModal } from "@/components/ui/EulaModal";
import { useKakaoLogin } from "@/hooks/useAuth";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, isPending, showEula, handleEulaAgree, handleEulaDecline } =
    useKakaoLogin();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom + 24 },
      ]}
    >
      {/* 로고 영역 */}
      <View style={styles.logoArea}>
        <Text style={styles.logoEmoji}>🎬</Text>
        <Text style={styles.appName}>OTT Info</Text>
        <Text style={styles.tagline}>
          영화·드라마를 어디서 볼 수 있는지{"\n"}한 번에 확인하세요
        </Text>
      </View>

      {/* 카카오 로그인 버튼 */}
      <View style={styles.bottom}>
        <Pressable
          style={[styles.kakaoButton, isPending && styles.disabled]}
          onPress={() => login()}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Text style={styles.kakaoIcon}>💬</Text>
              <Text style={styles.kakaoText}>카카오로 시작하기</Text>
            </>
          )}
        </Pressable>
        <Text style={styles.disclaimer}>
          로그인 시 서비스 이용약관 및{"\n"}개인정보 처리방침에 동의하게 됩니다.
        </Text>
      </View>

      {/* EULA 동의 모달 (최초 가입자) */}
      <EulaModal
        visible={showEula}
        onAgree={handleEulaAgree}
        onDecline={handleEulaDecline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#030712",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  logoArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  logoEmoji: { fontSize: 72 },
  appName: {
    color: "#f9fafb",
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1,
  },
  tagline: {
    color: "#6b7280",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 4,
  },
  bottom: { gap: 16, alignItems: "center" },
  kakaoButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE500",
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
  },
  kakaoIcon: { fontSize: 22 },
  kakaoText: { color: "#000", fontSize: 17, fontWeight: "700" },
  disclaimer: {
    color: "#4b5563",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  disabled: { opacity: 0.6 },
});
