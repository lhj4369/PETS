import { Pressable, Text, StyleSheet } from "react-native";
import { APP_COLORS } from "../../constants/theme";

type Props = {
  onPress: () => void;
};

export default function DefenseManualNextWaveButton({ onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.wrap, pressed && styles.wrapPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="다음 웨이브로"
    >
      <Text style={styles.text}>다음 웨이브로</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "center",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    backgroundColor: APP_COLORS.brown,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.12)",
  },
  wrapPressed: {
    opacity: 0.88,
  },
  text: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "KotraHope",
    letterSpacing: 0.5,
  },
});
