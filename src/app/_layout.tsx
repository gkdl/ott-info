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

    if (status === "unauthenticated" && !inAuthGroup) {
      router.replace("/login");
    } else if (status === "authenticated" && inAuthGroup) {
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
      </Stack>
    </AppProviders>
  );
}
