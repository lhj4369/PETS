import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import HomeButton from "../../../components/HomeButton";
import DefenseSubHeader from "../../../components/defense/DefenseSubHeader";
import { APP_COLORS } from "../../../constants/theme";

/**
 * 도전 모드 허브 뼈대 (무한·점수 등은 추후).
 */
export default function DefenseChallengeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <HomeButton />
      <View style={styles.body}>
        <DefenseSubHeader title="도전" />
        <Text style={styles.lead}>
          도전 모드에서는 대화 없이 바로 전투 화면으로 진입하는 흐름을 가정했습니다.
        </Text>
        <View style={styles.card}>
          <Text style={styles.cardText}>
            티켓 소모 · 주간 보상 · 리더보드 연동은 이후 단계에서 붙일 수 있습니다.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/defense/battle",
              params: { mode: "challenge" },
            } as any)
          }
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>도전 시작</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: APP_COLORS.ivory,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 24,
  },
  lead: {
    fontSize: 15,
    lineHeight: 22,
    color: APP_COLORS.brownLight,
    fontFamily: "KotraHope",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: APP_COLORS.ivoryDark,
    marginBottom: 24,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 21,
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  primaryBtn: {
    backgroundColor: APP_COLORS.yellow,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: APP_COLORS.yellowDark,
  },
  primaryBtnText: {
    fontSize: 18,
    fontWeight: "700",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
});
