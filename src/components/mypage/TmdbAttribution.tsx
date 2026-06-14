import React from "react";
import { View, Text, Pressable, Linking, StyleSheet } from "react-native";

/**
 * TMDB API 이용약관에서 요구하는 출처 표기(attribution).
 * 면책 문구 + 워드마크를 표시한다.
 * TODO: 공식 TMDB 로고 이미지를 assets/tmdb-logo.png 로 추가한 뒤
 *       아래 <Text>TMDB</Text> 자리를 <Image>로 교체하면 더 완전한 표기가 된다.
 *       로고: https://www.themoviedb.org/about/logos
 */
export function TmdbAttribution() {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => Linking.openURL("https://www.themoviedb.org")}
        style={styles.row}
      >
        {/* TODO: 로고 추가 시 이 Text를 <Image source={require("@/../assets/tmdb-logo.png")} /> 로 교체 */}
        <Text style={styles.wordmark}>TMDB</Text>
      </Pressable>
      <Text style={styles.disclaimer}>
        이 앱은 TMDB API를 사용하지만 TMDB가 보증하거나 인증하지 않습니다.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    alignItems: "center",
    gap: 6,
  },
  row: { flexDirection: "row", alignItems: "center" },
  wordmark: {
    color: "#01b4e4",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1,
  },
  disclaimer: {
    color: "#6b7280",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
});
