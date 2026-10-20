// Development boundary. This module never requests a real ad or loads the native SDK.
import { Pattern, RewardPort } from "@paper-craft/product-core";
import { repository } from "./storage";
let state = { canRequestAds: false, revision: 0 };
const listeners = new Set<() => void>();
export const getAdState = () => state;
export function subscribeAds(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
const publish = (allowed: boolean) => {
  state = { canRequestAds: allowed, revision: state.revision + 1 };
  listeners.forEach((fn) => fn());
};
export const adScenario = () =>
  sessionStorage.getItem("paper-craft.qa.ads") ?? "available";
export async function consent() {
  const allowed = adScenario() !== "consent-denied";
  publish(allowed);
  if (!allowed) throw new Error("CONSENT");
}
export async function privacy() {
  publish(false);
  const allowed = window.confirm(
    "Development consent: allow test advertising?",
  );
  sessionStorage.setItem(
    "paper-craft.qa.ads",
    allowed ? "available" : "consent-denied",
  );
  publish(allowed);
  return true;
}
export const rewards: RewardPort = {
  async unlock(id: string, pattern: Pattern) {
    await consent();
    const scenario = adScenario();
    if (scenario !== "available")
      throw new Error(
        scenario === "reward-cancel" ? "AD_CANCELLED" : "AD_NO_FILL",
      );
    await repository.grant(id, pattern, `web-reward-${crypto.randomUUID()}`);
  },
};
