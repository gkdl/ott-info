import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { AppProviders } from "@/lib/AppProviders";
import { useAuthStatus } from "@/store/authStore";
import "../globals.css";

SplashScreen.preventAutoHideAsync();

function AuthGuard() {
  const status = useAuthStatus();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (status === "loading") return;

    const inAuthGroup = segments[0] === "login";

    // 게스트(비로그인)도 둘러볼 수 있으므로 로그인 강제 리다이렉트는 하지 않는다.
    // 실제 로그인 완료 후 로그인 화면에 남아있으면 홈으로 보낸다.
    if (status === "authenticated" && inAuthGroup) {
      router.replace("/(tabs)/home");
    }
  }, [status, segments]);

  return null;
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AppProviders>
      <StatusBar style="light" />
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="detail/[id]"
          options={{
            animation: "slide_from_right",
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            animation: "fade",
          }}
        />
        <Stack.Screen
          name="privacy"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="terms"
          options={{ animation: "slide_from_right" }}
        />
      </Stack>
    </AppProviders>
  );
}
