import { View, StyleSheet } from "react-native";
import DefenseBattleHud, { OnFieldEnemyMeter } from "./DefenseBattleHud";
import DefenseBattleFieldPlaceholder from "./DefenseBattleFieldPlaceholder";

type Props = {
  onFieldEnemies: OnFieldEnemyMeter;
  wave: { current: number; total: number };
  waveTimerSec?: number;
};

/**
 * [HUD 바] ← 상단 별도 영역 (필드 위 겹침 없음)
 * [필드]   ← 나머지 높이 전부 차지
 */
export default function DefenseBattleFieldWithFloatingHud({
  onFieldEnemies,
  wave,
  waveTimerSec,
}: Props) {
  return (
    <View style={styles.column}>
      <DefenseBattleHud
        onFieldEnemies={onFieldEnemies}
        wave={wave}
        waveTimerSec={waveTimerSec}
      />
      <View style={styles.fieldArea}>
        <DefenseBattleFieldPlaceholder />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    gap: 10,
  },
  fieldArea: {
    flex: 1,
  },
});
