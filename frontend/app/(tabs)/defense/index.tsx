import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import HomeButton from "../../../components/HomeButton";
import { APP_COLORS } from "../../../constants/theme";
import { DEFENSE_CHALLENGE_MODE_LOCKED } from "../../../data/defenseStub";

/**
 * 디펜스 모드 선택 (시나리오 / 도전).
 */
export default function DefenseIndexScreen() {
  const { height: windowHeight } = useWindowDimensions();
  /** 기존 대비 ~1.35–1.45배 — 하단 여밉 완화·시각적 균형 */
  const modeCardRowHeight = Math.min(460, Math.max(350, Math.round(windowHeight * 0.46)));

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <HomeButton />

      <View style={styles.pickRoot}>
        <View style={styles.pickHeader}>
          <Text style={styles.titleHero}>디펜스!</Text>
          <Text style={styles.titleSub}>PETS 방범대</Text>
        </View>

        <View style={styles.modeCardsWrap}>
          <View style={[styles.modeCards, { height: modeCardRowHeight }]}>
            <TouchableOpacity
              style={[styles.modeCard, styles.modeCardScenario]}
              onPress={() => router.push("/(tabs)/defense/scenario" as any)}
              activeOpacity={0.85}
            >
              <View style={styles.modeCardIconCircle}>
                <Ionicons name="book-outline" size={44} color={APP_COLORS.brown} />
              </View>
              <Text style={styles.modeCardTitle}>시나리오</Text>
              <Text
                style={styles.modeCardHint}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
              >
                적을 물리치세요
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeCard,
                styles.modeCardChallenge,
                DEFENSE_CHALLENGE_MODE_LOCKED && styles.modeCardChallengeLocked,
              ]}
              onPress={() => {
                if (DEFENSE_CHALLENGE_MODE_LOCKED) {
                  Alert.alert("잠금", "도전 모드는 준비 중입니다.");
                  return;
                }
                router.push("/(tabs)/defense/challenge" as any);
              }}
              activeOpacity={DEFENSE_CHALLENGE_MODE_LOCKED ? 1 : 0.85}
            >
              <View style={[styles.modeCardIconCircle, styles.modeCardIconCircleAlt]}>
                <Ionicons
                  name={DEFENSE_CHALLENGE_MODE_LOCKED ? "lock-closed" : "trophy-outline"}
                  size={44}
                  color={DEFENSE_CHALLENGE_MODE_LOCKED ? APP_COLORS.brownLight : APP_COLORS.brown}
                />
              </View>
              <Text
                style={[
                  styles.modeCardTitle,
                  DEFENSE_CHALLENGE_MODE_LOCKED && styles.modeCardTitleMuted,
                ]}
              >
                도전
              </Text>
              <Text
                style={[
                  styles.modeCardHint,
                  DEFENSE_CHALLENGE_MODE_LOCKED && styles.modeCardHintMuted,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
              >
                {DEFENSE_CHALLENGE_MODE_LOCKED ? "추후 오픈 예정" : "한계에 도전"}
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
    marginBottom: 12,
    paddingRight: 58,
  },
  titleHero: {
    fontSize: 36,
    fontWeight: "800",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
    lineHeight: 42,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  titleSub: {
    fontSize: 19,
    fontWeight: "700",
    color: APP_COLORS.brownLight,
    fontFamily: "KotraHope",
    letterSpacing: 0.3,
  },
  modeCardsWrap: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 8,
    paddingBottom: 32,
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
    paddingVertical: 28,
    paddingHorizontal: 12,
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
  modeCardChallengeLocked: {
    opacity: 0.78,
    backgroundColor: "#D5E8E0",
    borderColor: "#9BBFB3",
  },
  modeCardTitleMuted: {
    color: APP_COLORS.brownLight,
  },
  modeCardIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: APP_COLORS.ivoryDark,
  },
  modeCardIconCircleAlt: {
    borderColor: "#B8E0D2",
  },
  modeCardTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
    textAlign: "center",
    marginBottom: 6,
  },
  modeCardHint: {
    fontSize: 13,
    fontWeight: "600",
    color: APP_COLORS.brownLight,
    fontFamily: "KotraHope",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 2,
    width: "100%",
    maxWidth: "100%",
  },
  modeCardHintMuted: {
    opacity: 0.92,
  },
});
