import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import HomeButton from "../../../components/HomeButton";
import { APP_COLORS } from "../../../constants/theme";

/**
 * 집 지키기 진입 — 모드 선택 (시나리오 / 도전).
 */
export default function DefenseIndexScreen() {
  const { height: windowHeight } = useWindowDimensions();
  const modeCardRowHeight = Math.min(292, Math.max(224, Math.round(windowHeight * 0.32)));

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <HomeButton />

      <View style={styles.pickRoot}>
        <View style={styles.pickHeader}>
          <Text style={styles.title}>집 지키기</Text>
          <Text style={styles.pickHint}>플레이할 모드를 선택해 주세요</Text>
        </View>

        <View style={styles.modeCardsWrap}>
          <View style={[styles.modeCards, { height: modeCardRowHeight }]}>
            <TouchableOpacity
              style={[styles.modeCard, styles.modeCardScenario]}
              onPress={() => router.push("/(tabs)/defense/scenario" as any)}
              activeOpacity={0.85}
            >
              <View style={styles.modeCardIconCircle}>
                <Ionicons name="book-outline" size={36} color={APP_COLORS.brown} />
              </View>
              <Text style={styles.modeCardTitle}>시나리오</Text>
              <Text style={styles.modeCardDesc}>
                스테이지를 순서대로 진행하는 캠페인 모드
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeCard, styles.modeCardChallenge]}
              onPress={() => router.push("/(tabs)/defense/challenge" as any)}
              activeOpacity={0.85}
            >
              <View style={[styles.modeCardIconCircle, styles.modeCardIconCircleAlt]}>
                <Ionicons name="trophy-outline" size={36} color={APP_COLORS.brown} />
              </View>
              <Text style={styles.modeCardTitle}>도전</Text>
              <Text style={styles.modeCardDesc}>
                한계에 도전하는 도전 모드
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: APP_COLORS.ivory,
  },
  pickRoot: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 24,
  },
  pickHeader: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
    marginBottom: 8,
  },
  pickHint: {
    fontSize: 17,
    color: APP_COLORS.brownLight,
    fontFamily: "KotraHope",
  },
  modeCardsWrap: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 20,
  },
  modeCards: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
  modeCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  modeCardScenario: {
    backgroundColor: "#FFF9E6",
    borderColor: APP_COLORS.yellowDark,
  },
  modeCardChallenge: {
    backgroundColor: "#E8F5F0",
    borderColor: "#7CB8A8",
  },
  modeCardIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: APP_COLORS.ivoryDark,
  },
  modeCardIconCircleAlt: {
    borderColor: "#B8E0D2",
  },
  modeCardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
    marginBottom: 8,
    textAlign: "center",
  },
  modeCardDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: APP_COLORS.brownLight,
    fontFamily: "KotraHope",
    textAlign: "center",
    paddingHorizontal: 2,
  },
});
