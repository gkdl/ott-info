declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_SUPABASE_URL: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
    EXPO_PUBLIC_KAKAO_REST_API_KEY: string;
    EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY: string;
    EXPO_PUBLIC_KAKAO_REDIRECT_URI: string;
    EXPO_PUBLIC_APP_SCHEME: string;
  }
}
