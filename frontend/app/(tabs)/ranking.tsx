import { View, Text } from "react-native";
import Header from "../../components/Header";

export default function RankingScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Header showBackButton={true} showMenuButton={true} menuType="ranking" />
      <Text>랭킹 화면</Text>
    </View>
  );
}

