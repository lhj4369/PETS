import { View, Text, StyleSheet } from "react-native";

type Props = {
  wave: { current: number; total: number | "∞" };
};

export default function DefenseHudWaveChip({ wave }: Props) {
  const totalLabel = wave.total === "∞" ? "∞" : String(wave.total);
  return (
    <View
      style={styles.chip}
      accessibilityLabel={`웨이브 ${wave.current}, 총 ${totalLabel}`}
    >
      <Text style={styles.label}>WAVE</Text>
      <Text style={styles.value}>
        {wave.current}
        <Text style={styles.total}>/{totalLabel}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#5D4E37",
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 18,
  },
  label: {
    fontSize: 18,
    color: "rgba(255,255,255,0.6)",
    fontFamily: "KotraHope",
    letterSpacing: 2,
  },
  value: {
    fontSize: 48,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "KotraHope",
    fontVariant: ["tabular-nums"],
    lineHeight: 54,
  },
  total: {
    fontSize: 30,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
  },
});
