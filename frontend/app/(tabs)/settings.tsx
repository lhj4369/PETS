import { View, Text } from "react-native";
import Header from "../../components/Header";

export default function SettingsScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Header showBackButton={true} showMenuButton={true} menuType="settings" />
      <Text>설정 화면</Text>
    </View>
  );
}








