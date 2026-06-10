import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { AppProviders } from "@/lib/AppProviders";
import "../globals.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // 폰트나 초기 리소스 로드 완료 후 스플래시 숨김
    SplashScreen.hideAsync();
  }, []);

  return (
    <AppProviders>
      <StatusBar style="light" />
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
            presentation: "modal",
          }}
        />
      </Stack>
    </AppProviders>
  );
}
