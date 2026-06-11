module.exports = {
  extends: ["expo", "eslint:recommended"],
  plugins: [],
  rules: {
    "no-unused-vars": "warn",
    "no-console": ["warn", { allow: ["error", "warn"] }]
  },
  ignorePatterns: ["node_modules/", "dist/", ".expo/"]
};
