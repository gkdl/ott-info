/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // 앱 기본 팔레트 (다크 테마)
        background: "#030712",
        surface: "#111827",
        "surface-2": "#1f2937",
        border: "#374151",
        primary: "#6366f1",
        "primary-dark": "#312e81",
        muted: "#6b7280",
        subtle: "#9ca3af",
        foreground: "#f9fafb",
        "foreground-2": "#e5e7eb",
        danger: "#ef4444",
        warning: "#fbbf24",
        kakao: "#FEE500"
      }
    }
  },
  plugins: []
};
