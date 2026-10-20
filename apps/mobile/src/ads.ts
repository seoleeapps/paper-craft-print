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
export type AdState = { canRequestAds: boolean; revision: number };
let state: AdState = { canRequestAds: false, revision: 0 };
const listeners = new Set<() => void>();
export const getAdState = () => state;
export function subscribeAds(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function publish(canRequestAds: boolean) {
  if (state.canRequestAds === canRequestAds) return;
  state = { canRequestAds, revision: state.revision + 1 };
  listeners.forEach((fn) => fn());
}
let sdk: Promise<unknown> | undefined;
let checking: Promise<void> | undefined;
let gathered = false;
export function consent(force = false): Promise<void> {
  if (checking) return checking;
  if (!force && gathered)
    return state.canRequestAds
      ? Promise.resolve()
      : Promise.reject(new Error("CONSENT"));
  publish(false);
  checking = (async () => {
    try {
      const info = await AdsConsent.gatherConsent();
      gathered = true;
      if (!info.canRequestAds) throw new Error("CONSENT");
      if (!sdk)
        sdk = mobileAds()
          .initialize()
          .catch((error) => {
            sdk = undefined;
            gathered = false;
            throw error;
          });
      await sdk;
      publish(true);
    } finally {
      checking = undefined;
    }
  })();
  return checking;
}
export const bannerUnitId: string | undefined = test
  ? TestIds.BANNER
  : Constants.expoConfig?.extra?.bannerAdUnitId;
export async function privacy() {
  // Remove previously loaded inventory before changing the user's choices.
  publish(false);
  if (checking) {
    try {
      await checking;
    } catch {}
    publish(false);
  }
  try {
    const info = await AdsConsent.gatherConsent();
    if (
      info.privacyOptionsRequirementStatus ===
      AdsConsentPrivacyOptionsRequirementStatus.REQUIRED
    ) {
      await AdsConsent.showPrivacyOptionsForm();
      try {
        await consent(true);
      } catch (error) {
        if (!(error instanceof Error) || error.message !== "CONSENT")
          throw error;
      }
      return true;
    }
    if (
      info.privacyOptionsRequirementStatus ===
      AdsConsentPrivacyOptionsRequirementStatus.UNKNOWN
    )
      throw new Error("CONSENT");
    try {
      await consent(true);
    } catch (error) {
      if (!(error instanceof Error) || error.message !== "CONSENT") throw error;
    }
    return false;
  } catch (error) {
    publish(false);
    throw error;
  }
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
