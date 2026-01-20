import { TouchableOpacity, StyleSheet, Image } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ChatBubbleButton() {
  const insets = useSafeAreaInsets();

  const navigateToChatting = () => {
    router.push({
      pathname: "/(tabs)/chatting",
      params: { mode: "daily" },
    } as never);
  };

  return (
    <TouchableOpacity
      style={[
        styles.chatBubbleButton,
        { top: insets.top + 10, right: 20 },
      ]}
      onPress={navigateToChatting}
      activeOpacity={0.7}
    >
      <Image
        source={require("../assets/images/chat_icon.png")}
        style={styles.chatBubbleIcon}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chatBubbleButton: {
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
  chatBubbleIcon: { //말풍선 아이콘 크기조정
    width: 24,
    height: 24,
    resizeMode: 'contain'
  }
});

