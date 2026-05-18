import { View, Text, StyleSheet } from "react-native";
import { APP_COLORS } from "../../constants/theme";

/**
 * 스테이지 클리어 시 게임판과 타워 선택 바 사이에 표시.
 */
export default function DefenseStageVictoryBanner() {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Text style={styles.text}>승리했습니다!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: "rgba(46, 125, 50, 0.14)",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(27, 94, 32, 0.75)",
  },
  text: {
    fontSize: 22,
    fontWeight: "800",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
    letterSpacing: 0.5,
  },
});
