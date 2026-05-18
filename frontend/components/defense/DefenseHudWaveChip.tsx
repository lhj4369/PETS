import { View, Text, StyleSheet } from "react-native";

type Props = {
  wave: { current: number; total: number };
};

export default function DefenseHudWaveChip({ wave }: Props) {
  return (
    <View style={styles.chip}>
      <Text style={styles.label}>WAVE</Text>
      <Text style={styles.value}>
        {wave.current}
        <Text style={styles.total}>/{wave.total}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    backgroundColor: "#5D4E37",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    fontFamily: "KotraHope",
    letterSpacing: 1.5,
  },
  value: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "KotraHope",
    fontVariant: ["tabular-nums"],
    lineHeight: 30,
  },
  total: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
  },
});
