import { Alert, Platform } from "react-native";

// RN의 Alert.alert 는 웹(react-native-web)에서 동작하지 않으므로,
// 웹에서는 window.confirm/alert 로 대체하는 크로스플랫폼 헬퍼.

/** 확인/취소 다이얼로그. 확인 시 true. */
export function confirmDialog(
  title: string,
  message: string,
  confirmText = "확인"
): Promise<boolean> {
  if (Platform.OS === "web") {
    const ok =
      typeof window !== "undefined"
        ? window.confirm(`${title}\n\n${message}`)
        : false;
    return Promise.resolve(ok);
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "취소", style: "cancel", onPress: () => resolve(false) },
      { text: confirmText, style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

/** 단순 알림 다이얼로그. */
export function alertDialog(title: string, message: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.alert(`${title}\n\n${message}`);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [{ text: "확인", onPress: () => resolve() }]);
  });
}
