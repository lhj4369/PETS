import { View, Text, StyleSheet } from "react-native";
import { APP_COLORS } from "../../constants/theme";

type Props = {
  waveNumber: number;
};

export default function DefenseWaveStartBanner({ waveNumber }: Props) {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Text style={styles.text}>WAVE {waveNumber} 시작!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "rgba(93, 78, 55, 0.2)",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: APP_COLORS.brown,
  },
  text: {
    fontSize: 22,
    fontWeight: "800",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
    letterSpacing: 0.5,
  },
});
