import { Redirect } from "expo-router";
import { useAuthStatus } from "@/store/authStore";

export default function Index() {
  const status = useAuthStatus();

  if (status === "loading") return null;

  return <Redirect href={status === "authenticated" ? "/(tabs)/home" : "/login"} />;
}
