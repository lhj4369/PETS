import { TouchableOpacity, StyleSheet, Text } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RankingButton() {
  const insets = useSafeAreaInsets();

  const navigateToRanking = () => {
    router.push("/(tabs)/ranking" as any);
  };

  return (
    <TouchableOpacity
      style={[
        styles.rankingButton,
        { top: insets.top + 60, right: 20 }
      ]}
      onPress={navigateToRanking}
      activeOpacity={0.7}
    >
      <Text style={styles.rankingIcon}>📊</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  rankingButton: {
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
  rankingIcon: {
    fontSize: 24,
    includeFontPadding: false
  }
});

