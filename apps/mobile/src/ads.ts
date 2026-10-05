import mobileAds, {
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from "react-native-google-mobile-ads";
import Constants from "expo-constants";
import { Pattern, RewardPort } from "@paper-craft/product-core";
import { repository } from "./storage";
const test = Constants.expoConfig?.extra?.adMode !== "production";
export async function consent() {
  const result = await AdsConsent.gatherConsent();
  if (!result.canRequestAds) throw new Error("CONSENT");
  await mobileAds().initialize();
}
export async function privacy() {
  const info = await AdsConsent.gatherConsent();
  if (
    info.privacyOptionsRequirementStatus ===
    AdsConsentPrivacyOptionsRequirementStatus.REQUIRED
  ) {
    await AdsConsent.showPrivacyOptionsForm();
    return true;
  }
  if (
    info.privacyOptionsRequirementStatus ===
    AdsConsentPrivacyOptionsRequirementStatus.UNKNOWN
  )
    throw new Error("CONSENT");
  return false;
}
export const rewards: RewardPort = {
  async unlock(projectId: string, pattern: Pattern) {
    await consent();
    const unit = test
      ? TestIds.REWARDED
      : Constants.expoConfig?.extra?.rewardedAdUnitId;
    if (!unit) throw new Error("AD_ID");
    const eventId = `reward-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await new Promise<void>((resolve, reject) => {
      const ad = RewardedAd.createForAdRequest(unit);
      let earned = false,
        closed = false,
        save = Promise.resolve();
      const off: (() => void)[] = [];
      const finish = (error?: Error) => {
        clearTimeout(timer);
        off.forEach((fn) => fn());
        error ? reject(error) : resolve();
      };
      const timer = setTimeout(() => {
        if (!earned) finish(new Error("AD_TIMEOUT"));
      }, 45000);
      off.push(
        ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
          clearTimeout(timer);
          void ad.show().catch(finish);
        }),
      );
      off.push(
        ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
          if (earned) return;
          earned = true;
          clearTimeout(timer);
          save = repository.grant(projectId, pattern, eventId);
          void save.catch(finish);
          if (closed) void save.then(() => finish(), finish);
        }),
      );
      off.push(
        ad.addAdEventListener(AdEventType.CLOSED, () => {
          closed = true;
          if (earned) void save.then(() => finish(), finish);
          else finish(new Error("AD_CANCELLED"));
        }),
      );
      off.push(
        ad.addAdEventListener(AdEventType.ERROR, (error) => finish(error)),
      );
      ad.load();
    });
  },
};
