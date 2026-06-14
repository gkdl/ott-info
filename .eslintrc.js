module.exports = {
  extends: ["expo", "eslint:recommended"],
  // RN 런타임 전역 (URL, URLSearchParams 등) 인식용
  env: { browser: true, es2021: true, node: true },
  plugins: [],
  rules: {
    "no-unused-vars": "warn",
    "no-console": ["warn", { allow: ["error", "warn"] }],
    // React Compiler용 실험 규칙(eslint-config-expo 56이 추가). React Compiler 미사용이라
    // Animated ref 등 정상 RN 패턴을 오탐하므로 경고로만 둔다.
    "react-hooks/refs": "warn",
    "react-hooks/immutability": "warn"
  },
  // supabase/ 는 Deno 런타임(별도 환경)이라 앱 ESLint 대상에서 제외
  ignorePatterns: ["node_modules/", "dist/", ".expo/", "supabase/"]
};
