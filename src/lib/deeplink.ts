import { Linking, Platform } from "react-native";
import Toast from "react-native-toast-message";

// OTT 앱 딥링크 스킴 맵 (provider_id → app scheme)
// TMDB provider_id 기준. 신규 플랫폼 추가 시 여기에만 추가.
const OTT_APP_SCHEMES: Record<number, string> = {
  8:    "netflix://",          // Netflix
  356:  "wavve://",            // Wavve
  97:   "watcha://",           // Watcha
  337:  "disneyplus://",       // Disney+
  350:  "appletv://",          // Apple TV+
  96:   "amazonprime://",      // Prime Video (KR)
  619:  "coupangplay://",      // Coupang Play
  525:  "paramountplus://",    // Paramount+
  2:    "appletvplus://",      // Apple TV (buy/rent)
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
  // TMDB watch/providers 응답의 link 필드 (JustWatch 또는 OTT 웹 URL)
  webFallbackUrl?: string | null;
}

export async function openOttApp({
  providerId,
  webFallbackUrl,
}: OttOpenOptions): Promise<void> {
  const appScheme = OTT_APP_SCHEMES[providerId];

  // 1단계: 앱 딥링크 시도
  if (appScheme && isValidUrl(appScheme)) {
    try {
      // Android는 canOpenURL이 항상 true를 반환할 수 있어 openURL 실패로 판단
      const canOpen =
        Platform.OS === "ios"
          ? await Linking.canOpenURL(appScheme)
          : true; // Android는 실제 openURL 결과로 판단

      if (canOpen) {
        await Linking.openURL(appScheme);
        return;
      }
    } catch {
      // 앱 미설치 또는 openURL 실패 → 2단계로 진행
    }
  }

  // 2단계: 웹 URL 폴백
  if (webFallbackUrl && isValidUrl(webFallbackUrl)) {
    try {
      await Linking.openURL(webFallbackUrl);
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
