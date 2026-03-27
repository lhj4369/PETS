import { TouchableOpacity, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { APP_COLORS } from "../../constants/theme";

/**
 * 전투 등 풀스크린에 가깝게 쓸 때 — 제목/홈 대신 이전 화면으로만 이동하는 작은 버튼.
 */
export default function DefenseScreenBackButton() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      style={[styles.btn, { top: insets.top + 6 }]}
      onPress={() => router.back()}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel="이전 화면"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons name="chevron-back" size={26} color={APP_COLORS.brown} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: "absolute",
    left: 14,
    zIndex: 30,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: APP_COLORS.ivoryDark,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
      },
      android: { elevation: 4 },
    }),
  },
});
