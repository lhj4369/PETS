import { TouchableOpacity, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ChatBubbleButton() {
  const insets = useSafeAreaInsets();

  const navigateToChatting = () => {
    router.push("/(tabs)/chatting" as any);
  };

  return (
    <TouchableOpacity
      style={[
        styles.chatBubbleButton,
        { top: insets.top + 10, right: 20 } // Header 제거 후 위로 이동
      ]}
      onPress={navigateToChatting}
      activeOpacity={0.7}
    >
      <Text style={styles.chatBubbleIcon}>💬</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chatBubbleButton: {
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
  chatBubbleIcon: {
    fontSize: 24,
    includeFontPadding: false
  }
});

