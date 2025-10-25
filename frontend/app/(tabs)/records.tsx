import { View, Text } from "react-native";
import Header from "../../components/Header";

export default function RecordsScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Header showBackButton={true} showMenuButton={true} menuType="records" />
      <Text>운동 기록 화면</Text>
    </View>
  );
}








