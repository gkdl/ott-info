import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";

// 개발 중에는 테스트 광고, 릴리스에서는 실제 AdMob 광고 단위 사용
const BANNER_ID = Platform.select({
  android: __DEV__ ? TestIds.BANNER : "ca-app-pub-6630409826466167/3359563605",
  ios: TestIds.BANNER, // iOS 출시 시 실제 iOS 배너 단위 ID로 교체
}) as string;

interface AdBannerProps {
  style?: object;
  // 화면 최하단(시스템 네비게이션바 위)에 직접 붙을 때 true.
  // 탭바 위에 얹는 경우엔 탭바가 safe-area를 처리하므로 false로 둔다.
  safeBottom?: boolean;
}

export function AdBanner({ style, safeBottom = false }: AdBannerProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.container,
        safeBottom && { paddingBottom: 8 + insets.bottom },
        style,
      ]}
    >
      <BannerAd
        unitId={BANNER_ID}
        size={BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#0f172a",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
  },
});
