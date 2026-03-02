import { TouchableOpacity, StyleSheet, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettingsModal } from "../context/SettingsModalContext";

export default function SettingsButton() {
  const insets = useSafeAreaInsets();
  const { openSettings } = useSettingsModal();

  return (
    <TouchableOpacity
      style={[
        styles.settingsButton,
        { top: insets.top + 95, right: 20 }
      ]}
      onPress={openSettings}
      activeOpacity={0.7}
    >
      <Image 
        source={require('../assets/images/setting_icon.png')} 
        style={styles.settingsIcon} 
      />
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
    width: 24,
    height: 24,
    resizeMode: 'contain'
  }
});

