import React, { useEffect, useState, useSyncExternalStore } from "react";
import { View, Text, StyleSheet } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { consent, subscribeAds, getAdState, bannerUnitId } from "./ads";
export function AdBanner({ label }: { label: string }) {
  const state = useSyncExternalStore(subscribeAds, getAdState);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    void consent().catch(() => {});
  }, []);
  useEffect(() => {
    setFailed(false);
  }, [state.revision]);
  if (!state.canRequestAds || !bannerUnitId || failed) return null;
  return (
    <View style={styles.area} testID="ad-banner">
      <Text style={styles.label}>{label}</Text>
      <BannerAd
        key={state.revision}
        unitId={bannerUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  area: {
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#dce1d8",
    paddingTop: 12,
    paddingBottom: 12,
    marginTop: 16,
  },
  label: { fontSize: 11, color: "#65766c", marginBottom: 6 },
});
