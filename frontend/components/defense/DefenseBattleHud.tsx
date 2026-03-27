import { View, Text, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { APP_COLORS } from "../../constants/theme";

export type OnFieldEnemyMeter = {
  current: number;
  max: number;
};

type Props = {
  onFieldEnemies: OnFieldEnemyMeter;
  wave: { current: number; total: number };
  waveTimerSec?: number;
  /** 바 컨테이너에 추가로 적용할 스타일 (paddingLeft 오버라이드 등) */
  style?: StyleProp<ViewStyle>;
};

/**
 * 전투 상단 HUD 바 — 웨이브 / 타이머 / 맵 위 적 을 가로로 배치.
 * 필드 위에 겹치지 않고 필드 위 별도 영역에 위치.
 */
export default function DefenseBattleHud({ onFieldEnemies, wave, waveTimerSec, style }: Props) {
  const { current, max } = onFieldEnemies;
  const ratio = max > 0 ? current / max : 0;
  const fillPct = Math.min(100, ratio * 100);
  const fillColor =
    ratio >= 0.85 ? "#E07C3C" : ratio >= 0.55 ? APP_COLORS.yellowDark : "#7CB8A8";

  const timerLabel =
    waveTimerSec !== undefined
      ? `${Math.floor(waveTimerSec / 60)
          .toString()
          .padStart(2, "0")}:${(waveTimerSec % 60).toString().padStart(2, "0")}`
      : "--:--";

  return (
    <View style={[styles.bar, style]}>
      {/* 웨이브 */}
      <View style={styles.block}>
        <Text style={styles.blockLabel}>WAVE</Text>
        <Text style={styles.blockValue}>
          {wave.current}
          <Text style={styles.blockSub}>/{wave.total}</Text>
        </Text>
      </View>

      <View style={styles.divider} />

      {/* 타이머 */}
      <View style={[styles.block, styles.blockCenter]}>
        <Text style={styles.blockLabel}>다음 웨이브</Text>
        <Text style={styles.timerDigits}>{timerLabel}</Text>
      </View>

      <View style={styles.divider} />

      {/* 맵 위 적 */}
      <View style={[styles.block, styles.blockEnemy]}>
        <View style={styles.enemyHeader}>
          <Ionicons name="skull-outline" size={12} color={APP_COLORS.brownLight} />
          <Text style={styles.blockLabel}> 맵 위 적</Text>
          <Text style={styles.enemyFraction}>{current}/{max}</Text>
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${fillPct}%`, backgroundColor: fillColor }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5D4E37",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 0,
  },
  block: {
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 10,
  },
  blockCenter: {
    flex: 1,
  },
  blockEnemy: {
    flex: 1,
    alignItems: "stretch",
    gap: 5,
  },
  blockLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.65)",
    fontFamily: "KotraHope",
    letterSpacing: 0.4,
  },
  blockValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "KotraHope",
    fontVariant: ["tabular-nums"],
  },
  blockSub: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.75,
  },
  timerDigits: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "KotraHope",
    fontVariant: ["tabular-nums"],
  },
  enemyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  enemyFraction: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "KotraHope",
    fontVariant: ["tabular-nums"],
    marginLeft: "auto",
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  barBg: {
    width: "100%",
    height: 7,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
  },
});
