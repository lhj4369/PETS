import { Pressable, Text, StyleSheet } from "react-native";
import { APP_COLORS } from "../../constants/theme";

const SIZE = 52;

type Props = {
  mult: 1 | 2;
  onToggle: () => void;
  disabled?: boolean;
};

export default function DefenseGameSpeedToggle({
  mult,
  onToggle,
  disabled,
}: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.circle,
        disabled && styles.circleDisabled,
        pressed && !disabled && styles.circlePressed,
      ]}
      onPress={onToggle}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={
        mult === 1
          ? "게임 속도 보통. 두 배로 전환"
          : "게임 속도 두 배. 보통으로 전환"
      }
    >
      <Text style={styles.label}>x{mult}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: APP_COLORS.yellow,
    borderWidth: 2,
    borderColor: APP_COLORS.yellowDark,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 3,
  },
  circlePressed: {
    opacity: 0.9,
  },
  circleDisabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: 17,
    fontWeight: "800",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
});
