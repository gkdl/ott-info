import React from "react";
import { View, StyleSheet, Platform } from "react-native";
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
}

export function AdBanner({ style }: AdBannerProps) {
  return (
    <View style={[styles.container, style]}>
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
