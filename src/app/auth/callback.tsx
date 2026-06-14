import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

/**
 * OAuth 콜백 딥링크 핸들러 (ott-info://auth/callback)
 *
 * 정상 로그인 흐름에서는 WebBrowser.openAuthSessionAsync가 콜백 URL을 가로채
 * signInWithKakao 내부에서 세션을 세팅하므로 이 라우트로 들어오지 않는다.
 *
 * 이 라우트가 실제로 열리는 경우:
 *   - 동의 화면에서 사용자가 "뒤로가기/취소" → error=access_denied 로 앱이 직접 열림
 *   - 그 외 인앱 브라우저가 가로채지 못하고 딥링크가 앱으로 빠져나온 경우
 *
 * 어느 경우든 "Unmatched Route" 대신 적절한 화면으로 돌려보낸다.
 */
export default function AuthCallback() {
  const params = useLocalSearchParams<{
    access_token?: string;
    refresh_token?: string;
    error?: string;
  }>();
  const router = useRouter();

  const accessToken = typeof params.access_token === "string" ? params.access_token : undefined;
  const refreshToken = typeof params.refresh_token === "string" ? params.refresh_token : undefined;

  useEffect(() => {
    // 드물게 토큰이 쿼리로 실려 들어온 경우만 처리 (보통은 프래그먼트라 여기 안 옴)
    if (accessToken && refreshToken) {
      (async () => {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!error && data.session) {
          useAuthStore.getState().setSession(data.session);
          router.replace("/(tabs)/home");
        } else {
          router.replace("/login");
        }
      })();
    }
  }, [accessToken, refreshToken]);

  // 토큰 처리 중이면 스피너
  if (accessToken && refreshToken) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#f9fafb" />
      </View>
    );
  }

  // 취소/거부(error) 또는 그 외 → 로그인 화면으로 복귀
  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#030712",
    alignItems: "center",
    justifyContent: "center",
  },
});
