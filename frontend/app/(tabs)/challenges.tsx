
import { View, Text } from "react-native";
import Header from "../../components/Header";

export default function ChallengesScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Header showBackButton={true} showMenuButton={true} menuType="challenges" />
      <Text>도전 과제</Text>
    </View>
  );
}