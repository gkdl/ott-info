import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { OTT_PROVIDERS } from "@/constants/ottProviders";
import { useOttProviderIds, useOttPrefStore } from "@/store/ottPrefStore";

// 구독 중인 OTT를 토글로 선택하는 칩 그리드. 선택은 즉시 저장된다.
export function OttPicker() {
  const selected = useOttProviderIds();
  const toggle = useOttPrefStore((s) => s.toggle);

  return (
    <View style={styles.grid}>
      {OTT_PROVIDERS.map((p) => {
        const on = selected.includes(p.id);
        return (
          <Pressable
            key={p.id}
            onPress={() => toggle(p.id)}
            style={[
              styles.chip,
              {
                borderColor: on ? p.color : "#374151",
                backgroundColor: on ? p.color : "transparent",
              },
            ]}
          >
            <Text style={[styles.chipText, { color: on ? p.textColor : "#9ca3af" }]}>
              {p.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: "700" },
});
