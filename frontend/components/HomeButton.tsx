import { TouchableOpacity, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeButton() {
  const insets = useSafeAreaInsets();

  const navigateToHome = () => {
    router.push("/(tabs)/home" as any);
  };

  return (
    <TouchableOpacity
      style={[
        styles.homeButton,
        { top: insets.top + 10, right: 20 } // 우측 상단 (Header 위치)
      ]}
      onPress={navigateToHome}
      activeOpacity={0.7}
    >
      <Text style={styles.homeIcon}>🏠</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  homeButton: {
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
  homeIcon: {
    fontSize: 24,
    includeFontPadding: false
  }
});

