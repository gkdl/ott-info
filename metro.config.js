const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Enable package exports resolution for packages like react-native-reanimated 4.x
const nativeWindConfig = withNativeWind(config, { input: "./src/globals.css" });
nativeWindConfig.resolver.unstable_enablePackageExports = true;

module.exports = nativeWindConfig;
