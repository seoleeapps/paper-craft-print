import { ExpoConfig } from "expo/config";
import registered from "../../release/admob.json";
const production = process.env.CRAFT_AD_MODE === "production";
const appId = process.env.ADMOB_APP_ID;
const unitId = process.env.ADMOB_REWARDED_AD_UNIT_ID;
const bannerId = process.env.ADMOB_BANNER_AD_UNIT_ID;
if (
  production &&
  (appId !== registered.androidAppId ||
    unitId !== registered.rewardedAdUnitId ||
    !bannerId ||
    bannerId !== (registered as { bannerAdUnitId?: string }).bannerAdUnitId)
)
  throw new Error("Production requires verified Paper Craft Print AdMob IDs");
const config: ExpoConfig = {
  name: "Paper Craft Print",
  slug: "paper-craft-print",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  android: {
    package: "com.seoleeapps.papercraftprint",
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#faf7f0",
    },
    blockedPermissions: [
      "android.permission.SYSTEM_ALERT_WINDOW",
      "android.permission.RECORD_AUDIO",
      "android.permission.READ_MEDIA_IMAGES",
      "android.permission.READ_MEDIA_VIDEO",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
    ],
    allowBackup: false,
  },
  plugins: [
    "expo-sqlite",
    "expo-sharing",
    "expo-localization",
    "expo-asset",
    "expo-font",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#faf7f0",
        image: "./assets/splash-icon.png",
        imageWidth: 160,
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission: false,
        cameraPermission: false,
        microphonePermission: false,
      },
    ],
    [
      "react-native-google-mobile-ads",
      {
        delayAppMeasurementInit: true,
        androidAppId: production
          ? appId
          : "ca-app-pub-3940256099942544~3347511713",
      },
    ],
  ],
  extra: {
    adMode: production ? "production" : "test",
    rewardedAdUnitId: production ? unitId : null,
    bannerAdUnitId: production ? bannerId : null,
  },
};
export default config;
