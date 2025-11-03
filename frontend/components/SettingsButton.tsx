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
        { top: insets.top + 110, right: 20 }
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
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    // 배경 적용: 아래 주석 해제
    // width: 50,
    // height: 50,
    // borderRadius: 25,
    // backgroundColor: "#fff",
    // borderWidth: 3,
    // borderColor: "#ddd",
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
  },
  settingsIcon: {
    fontSize: 24,
    includeFontPadding: false
  }
});

