import { View, Text } from "react-native";
import Header from "../../components/Header";

export default function TimerScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Header showBackButton={true} showMenuButton={true} menuType="timer" />
      <Text>타이머 화면</Text>
    </View>
  );
}
