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

  // 채움이 많을수록 위험 → 주황→빨강
  const fillColor =
    ratio >= 0.85 ? "#C0392B" : ratio >= 0.55 ? "#E67E22" : "#E74C3C";

  return (
    <View style={styles.panel}>
      {/* 해골 아이콘 — 레퍼런스와 동일한 원형 뱃지 */}
      <View style={styles.iconCircle}>
        <Ionicons name="skull" size={20} color="#fff" />
      </View>

      {/* 레드 채움 바 + 개체수 텍스트 오버레이 */}
      <View style={styles.barWrap}>
        <View style={styles.barBg}>
          <View
            style={[
              styles.barFill,
              { width: `${pct}%`, backgroundColor: fillColor },
            ]}
          />
        </View>
        {/* 텍스트는 바 위에 절대 위치 — 레퍼런스처럼 바 안에 표기 */}
        <Text style={styles.countText}>{current} / {max}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#3D2E20",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#2A1E14",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  barWrap: {
    flex: 1,
    height: 32,
    justifyContent: "center",
  },
  barBg: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 8,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 8,
  },
  countText: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "KotraHope",
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
