//설정 화면
import { View, Text, SafeAreaView } from "react-native";
import Header from "../../components/Header";

export default function SettingsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 10 }}>
      <Header showBackButton={true} showMenuButton={true} menuType="settings" />
      <Text>설정 화면</Text>
    </SafeAreaView>
  );
}
