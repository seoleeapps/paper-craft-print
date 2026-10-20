import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

// Run the real SDK adapter with controlled native callbacks, without loading RN.
function fixture(canRequestAds = true, saveFailure = false) {
  const listeners = new Map<string, (...args: unknown[]) => void>();
  const grants: unknown[][] = [];
  let initialized = 0,
    loaded = 0,
    shown = 0,
    gathered = 0;
  let timeout: (() => void) | undefined;
  const exports: Record<string, any> = {};
  const ad = {
    addAdEventListener(event: string, fn: (...args: unknown[]) => void) {
      listeners.set(event, fn);
      return () => listeners.delete(event);
    },
    load() {
      loaded++;
    },
    async show() {
      shown++;
    },
  };
  const sdk = Object.assign(
    () => ({
      async initialize() {
        initialized++;
      },
    }),
    {
      AdsConsent: {
        async showPrivacyOptionsForm() {
          canRequestAds = false;
        },
        async gatherConsent() {
          gathered++;
          return { canRequestAds, privacyOptionsRequirementStatus: "required" };
        },
      },
      AdsConsentPrivacyOptionsRequirementStatus: {
        REQUIRED: "required",
        UNKNOWN: "unknown",
      },
      RewardedAd: { createForAdRequest: () => ad },
      RewardedAdEventType: { LOADED: "loaded", EARNED_REWARD: "earned" },
      AdEventType: { CLOSED: "closed", ERROR: "error" },
      TestIds: { REWARDED: "test-rewarded", BANNER: "test-banner" },
    },
  );
  const javascript = ts.transpileModule(
    readFileSync("apps/mobile/src/ads.ts", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  vm.runInNewContext(javascript, {
    exports,
    require(name: string) {
      if (name === "react-native-google-mobile-ads") return sdk;
      if (name === "expo-constants")
        return { expoConfig: { extra: { adMode: "test" } } };
      if (name === "./storage")
        return {
          repository: {
            async grant(...args: unknown[]) {
              grants.push(args);
              if (saveFailure) throw new Error("SQLITE_WRITE_FAILED");
            },
          },
        };
      throw new Error(`Unexpected adapter dependency: ${name}`);
    },
    setTimeout(fn: () => void) {
      timeout = fn;
      return 1;
    },
    clearTimeout() {
      timeout = undefined;
    },
  });
  return {
    consent: exports.consent as () => Promise<void>,
    privacy: exports.privacy as () => Promise<boolean>,
    adState: exports.getAdState as () => {
      canRequestAds: boolean;
      revision: number;
    },
    bannerUnit: exports.bannerUnitId,
    gathered: () => gathered,
    unlock: exports.rewards.unlock as (
      id: string,
      pattern: string,
    ) => Promise<void>,
    emit: (name: string, ...args: unknown[]) => listeners.get(name)?.(...args),
    expire: () => timeout?.(),
    grants,
    state: () => ({ initialized, loaded, shown, listeners: listeners.size }),
  };
}
async function ready(f: ReturnType<typeof fixture>) {
  const completion = f.unlock("project-at-ad-start", "stars");
  // Consent and SDK initialization each yield once before listeners attach.
  await new Promise<void>((resolve) => setImmediate(resolve));
  return { completion };
}
test("earned callbacks grant once to the captured draft and close only after save", async () => {
  const f = fixture();
  const { completion } = await ready(f);
  f.emit("loaded");
  f.emit("earned");
  f.emit("earned");
  f.emit("closed");
  await completion;
  assert.equal(f.grants.length, 1);
  assert.deepEqual(f.grants[0].slice(0, 2), ["project-at-ad-start", "stars"]);
  assert.deepEqual(f.state(), {
    initialized: 1,
    loaded: 1,
    shown: 1,
    listeners: 0,
  });
});
test("closing without a reward preserves locked status", async () => {
  const f = fixture();
  const { completion } = await ready(f);
  f.emit("closed");
  await assert.rejects(completion, /AD_CANCELLED/);
  assert.equal(f.grants.length, 0);
});
test("SDK failure and inventory/load timeout never grant a reward", async () => {
  for (const failure of ["error", "timeout"]) {
    const f = fixture();
    const { completion } = await ready(f);
    if (failure === "error") f.emit("error", new Error("AD_NO_FILL"));
    else f.expire();
    await assert.rejects(completion, /AD_NO_FILL|AD_TIMEOUT/);
    assert.equal(f.grants.length, 0);
    assert.equal(f.state().listeners, 0);
  }
});
test("consent denial prevents SDK initialization and loading", async () => {
  const f = fixture(false);
  await assert.rejects(f.unlock("project", "stars"), /CONSENT/);
  assert.deepEqual(f.state(), {
    initialized: 0,
    loaded: 0,
    shown: 0,
    listeners: 0,
  });
});
test("a failed durable reward save cannot report success", async () => {
  const f = fixture(true, true);
  const { completion } = await ready(f);
  f.emit("earned");
  f.emit("closed");
  await assert.rejects(completion, /SQLITE_WRITE_FAILED/);
  assert.equal(f.grants.length, 1);
});

test("parallel consent calls initialize the SDK only once; banner is gated until allowed", async () => {
  const f = fixture();
  assert.equal(f.adState().canRequestAds, false);
  assert.equal(f.bannerUnit, "test-banner");
  await Promise.all([f.consent(), f.consent()]);
  assert.equal(f.state().initialized, 1);
  assert.equal(f.adState().canRequestAds, true);
  await f.consent();
  assert.equal(f.state().initialized, 1);
  assert.equal(f.gathered(), 1);
});
test("privacy revocation removes existing banner permission and prevents another request", async () => {
  const f = fixture();
  await f.consent();
  assert.equal(await f.privacy(), true);
  assert.equal(f.adState().canRequestAds, false);
  await assert.rejects(f.unlock("p", "stars"), /CONSENT/);
  assert.equal(f.state().loaded, 0);
  assert.equal(f.state().initialized, 1);
});
