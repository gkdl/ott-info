const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Enable package exports resolution for packages like react-native-reanimated 4.x
config.resolver.unstable_enablePackageExports = true;

module.exports = withNativeWind(config, { input: "./src/globals.css" });
