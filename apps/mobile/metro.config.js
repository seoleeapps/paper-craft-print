const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);
// pdf-lib's tslib CommonJS UMD entry has no ESM default export in Metro.
// Resolve tslib through its supported legacy main field for both native and web.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "tslib") {
    return context.resolveRequest(
      { ...context, unstable_enablePackageExports: false },
      moduleName,
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};
module.exports = config;
