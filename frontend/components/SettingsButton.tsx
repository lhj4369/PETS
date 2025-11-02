import { TouchableOpacity, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SettingsButton() {
  const insets = useSafeAreaInsets();

  const navigateToSettings = () => {
    router.push("/(tabs)/settings" as any);
  };

  return (
    <TouchableOpacity
      style={[
        styles.settingsButton,
        { top: insets.top + 70, right: 20 } // 말풍선 버튼 아래 위치 (insets.top + 10 + 버튼 높이 50 + 간격 10)
      ]}
      onPress={navigateToSettings}
      activeOpacity={0.7}
    >
      <Text style={styles.settingsIcon}>⚙️</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  settingsButton: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10
  },
  settingsIcon: {
    fontSize: 24,
    includeFontPadding: false
  }
});

