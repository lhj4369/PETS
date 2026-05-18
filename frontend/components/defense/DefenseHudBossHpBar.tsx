import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  currentHp: number;
  maxHp: number;
};

/** 보스 웨이브 전용 — 보스 남은 체력 */
export default function DefenseHudBossHpBar({ currentHp, maxHp }: Props) {
  const maxSafe = Math.max(1, maxHp);
  const cur = Math.max(0, Math.min(currentHp, maxSafe));
  const ratio = Math.min(1, cur / maxSafe);
  const pct = ratio * 100;

  const fillColor =
    ratio >= 0.55 ? "#8E44AD" : ratio >= 0.28 ? "#9B59B6" : "#AF7AC5";

  return (
    <View style={styles.panel}>
      <View style={styles.iconCircle}>
        <Ionicons name="ribbon" size={28} color="#fff" />
      </View>
      <View style={styles.barWrap}>
        <Text style={styles.title}>보스 체력</Text>
        <View style={styles.barBg}>
          <View
            style={[
              styles.barFill,
              { width: `${pct}%`, backgroundColor: fillColor },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#2C1F3D",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: "rgba(183, 148, 244, 0.45)",
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#1A1225",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  barWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(255, 235, 255, 0.92)",
    fontFamily: "KotraHope",
  },
  barBg: {
    height: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 8,
  },
});
