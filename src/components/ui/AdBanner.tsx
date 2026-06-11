import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";

// 실제 배포 시 AdMob 콘솔에서 발급받은 Unit ID로 교체
const BANNER_ID = Platform.select({
  ios: __DEV__ ? TestIds.BANNER : "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX",
  android: __DEV__ ? TestIds.BANNER : "ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX",
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
