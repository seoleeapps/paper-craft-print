import React, { useEffect, useSyncExternalStore } from "react";
import { View, Text } from "react-native";
import { consent, subscribeAds, getAdState, adScenario } from "./ads.web";
export function AdBanner({ label }: { label: string }) {
  const state = useSyncExternalStore(subscribeAds, getAdState);
  useEffect(() => {
    void consent().catch(() => {});
  }, []);
  if (!state.canRequestAds || adScenario() === "no-fill") return null;
  return (
    <View
      testID="ad-banner"
      style={{
        alignItems: "center",
        padding: 12,
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#dce1d8",
      }}
    >
      <Text style={{ fontSize: 11, color: "#65766c", marginBottom: 6 }}>
        {label}
      </Text>
      <View
        style={{
          height: 50,
          width: "100%",
          maxWidth: 468,
          backgroundColor: "#e5e8e0",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>Test ad · Development preview</Text>
      </View>
    </View>
  );
}
