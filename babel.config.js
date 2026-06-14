module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }]
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: { "@": "./src" }
        }
      ],
      // reanimated 4 requires the worklets plugin, and it MUST be listed last
      "react-native-worklets/plugin"
    ]
  };
};
