import { Redirect } from "expo-router";
import { useAuthStatus } from "@/store/authStore";

export default function Index() {
  const status = useAuthStatus();

  // status === "loading" 동안에는 세션(게스트 익명 세션 포함)이 확정되지 않았으므로 대기.
  // 확정되면 게스트/회원 구분 없이 홈으로. (로그인은 즐겨찾기·리뷰 시 유도)
  if (status === "loading") return null;

  return <Redirect href="/(tabs)/home" />;
}
