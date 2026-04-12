import { View, Text, StyleSheet } from "react-native";
import { APP_COLORS } from "../../constants/theme";

type Props = {
  secondsLeft: number;
};

export default function DefenseDangerBanner({ secondsLeft }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.warn}>위험합니다!</Text>
      <Text style={styles.timer}>{secondsLeft}초</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
    backgroundColor: "rgba(192, 57, 43, 0.18)",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#C0392B",
  },
  warn: {
    fontSize: 22,
    fontWeight: "800",
    color: "#C0392B",
    fontFamily: "KotraHope",
  },
  timer: {
    fontSize: 28,
    fontWeight: "800",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
    fontVariant: ["tabular-nums"],
  },
});
