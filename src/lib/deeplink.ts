import { Linking, Platform } from "react-native";
import Toast from "react-native-toast-message";

// OTT 제공사별 딥링크 정보 (TMDB provider_id 기준)
//  - scheme: 설치된 앱을 여는 커스텀 스킴
//  - web:    공식 사이트(폴백). 앱 미설치 시 이쪽으로 이동.
//            안드로이드는 해당 도메인이 App Link로 검증돼 있으면 web URL로도 앱이 바로 열림.
// 신규 플랫폼 추가 시 여기에만 추가.
interface OttTarget {
  scheme: string;
  web: string;
}

const OTT_TARGETS: Record<number, OttTarget> = {
  8:    { scheme: "nflx://www.netflix.com/", web: "https://www.netflix.com" }, // Netflix
  1796: { scheme: "nflx://www.netflix.com/", web: "https://www.netflix.com" }, // Netflix(광고형)
  356:  { scheme: "wavve://",                web: "https://www.wavve.com" },    // Wavve
  97:   { scheme: "watcha://",               web: "https://watcha.com" },        // Watcha
  337:  { scheme: "disneyplus://",           web: "https://www.disneyplus.com" },// Disney+
  350:  { scheme: "videos://",               web: "https://tv.apple.com" },      // Apple TV+
  1883: { scheme: "tving://",                web: "https://www.tving.com" },     // TVING
  119:  { scheme: "primevideo://",           web: "https://www.primevideo.com" },// Prime Video
  1881: { scheme: "coupangplay://",          web: "https://www.coupangplay.com" },// Coupang Play
  525:  { scheme: "paramountplus://",        web: "https://www.paramountplus.com" },// Paramount+
  2:    { scheme: "videos://",               web: "https://tv.apple.com" },      // Apple TV (구매/대여)
};

// URL 유효성 검증 (스킴·형식 기본 체크)
function isValidUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === "https:" ||
        parsed.protocol === "http:" ||
        // 앱 딥링크 커스텀 스킴
        /^[a-z][a-z0-9+\-.]*:$/.test(parsed.protocol)) &&
      url.length < 2048
    );
  } catch {
    return false;
  }
}

export interface OttOpenOptions {
  providerId: number;
  // TMDB watch/providers 응답의 link (themoviedb.org). 매핑이 없을 때만 최후 폴백.
  webFallbackUrl?: string | null;
}

export async function openOttApp({
  providerId,
  webFallbackUrl,
}: OttOpenOptions): Promise<void> {
  const target = OTT_TARGETS[providerId];

  // 1단계: 앱 딥링크 시도 (설치돼 있으면 앱이 열림)
  if (target?.scheme && isValidUrl(target.scheme)) {
    try {
      // Android는 canOpenURL이 신뢰할 수 없어 openURL 실패 여부로 판단.
      const canOpen =
        Platform.OS === "ios"
          ? await Linking.canOpenURL(target.scheme)
          : true;

      if (canOpen) {
        await Linking.openURL(target.scheme);
        return;
      }
    } catch {
      // 앱 미설치 또는 스킴 불일치 → 공식 사이트로 폴백
    }
  }

  // 2단계: 해당 OTT 공식 사이트로 폴백 (TMDB가 아니라 실제 서비스로 이동)
  const webUrl = target?.web ?? webFallbackUrl ?? null;
  if (webUrl && isValidUrl(webUrl)) {
    try {
      await Linking.openURL(webUrl);
      return;
    } catch {
      // 웹 URL도 열기 실패 → 3단계
    }
  }

  // 3단계: 안내 토스트
  Toast.show({
    type: "error",
    text1: "이동할 수 없습니다",
    text2: "해당 서비스 앱이 설치되어 있지 않거나 링크를 열 수 없습니다.",
    position: "bottom",
  });
}
