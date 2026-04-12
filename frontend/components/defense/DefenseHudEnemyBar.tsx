import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type OnFieldEnemyMeter = {
  current: number;
  max: number;
};

type Props = {
  onFieldEnemies: OnFieldEnemyMeter;
};

export default function DefenseHudEnemyBar({ onFieldEnemies }: Props) {
  const { current, max } = onFieldEnemies;
  const ratio = max > 0 ? Math.min(1, current / max) : 0;
  const pct = ratio * 100;

  const fillColor =
    ratio >= 0.85 ? "#C0392B" : ratio >= 0.55 ? "#E67E22" : "#E74C3C";

  return (
    <View style={styles.panel}>
      <View style={styles.iconCircle}>
        <Ionicons name="skull" size={36} color="#fff" />
      </View>

      <View style={styles.barWrap}>
        <View style={styles.barBg}>
          <View
            style={[
              styles.barFill,
              { width: `${pct}%`, backgroundColor: fillColor },
            ]}
          />
          {/* 7/10(70%) 위치 기준선 */}
          <View style={styles.thresholdLine} pointerEvents="none" />
        </View>
        <Text style={styles.countText}>
          {current} / {max}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    backgroundColor: "#3D2E20",
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#2A1E14",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  barWrap: {
    flex: 1,
    height: 60,
    justifyContent: "center",
  },
  barBg: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 12,
  },
  thresholdLine: {
    position: "absolute",
    left: "70%",
    top: 0,
    bottom: 0,
    width: 3,
    marginLeft: -1.5,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: 1,
    zIndex: 2,
  },
  countText: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "KotraHope",
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
