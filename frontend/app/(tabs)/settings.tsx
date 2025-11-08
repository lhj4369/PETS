//설정 화면
import { View, Text, SafeAreaView } from "react-native";
import HomeButton from "../../components/HomeButton";

export default function SettingsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 10 }}>
      <HomeButton />
      <Text>설정 화면</Text>
    </SafeAreaView>
  );
}
