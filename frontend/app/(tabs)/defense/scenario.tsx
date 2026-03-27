import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import HomeButton from "../../../components/HomeButton";
import DefenseSubHeader from "../../../components/defense/DefenseSubHeader";
import { APP_COLORS } from "../../../constants/theme";
import { STUB_SCENARIO_STAGES } from "../../../data/defenseStub";

/**
 * 시나리오 스테이지 목록 뼈대.
 */
export default function DefenseScenarioScreen() {
  const openStage = (id: string, locked: boolean) => {
    if (locked) {
      Alert.alert("잠금", "이전 스테이지를 먼저 클리어해 주세요. (뼈대)");
      return;
    }
    router.push(`/(tabs)/defense/stage/${id}` as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <HomeButton />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <DefenseSubHeader title="시나리오" />
        <Text style={styles.lead}>
          스테이지 선택 → 대화 → 전투 순으로 이어집니다. (데이터는 `defenseStub`)
        </Text>

        {STUB_SCENARIO_STAGES.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.stageRow, s.locked && styles.stageRowLocked]}
            onPress={() => openStage(s.id, s.locked)}
            activeOpacity={0.85}
          >
            <View style={styles.stageMeta}>
              <Text style={styles.stageId}>{s.id}</Text>
              <Text style={styles.stageArea}>{s.area}</Text>
            </View>
            <View style={styles.stageRight}>
              <Text style={styles.stageTier}>{s.tier}</Text>
              <Text style={styles.stageLock}>{s.locked ? "🔒" : "▶"}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: APP_COLORS.ivory,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 32,
  },
  lead: {
    fontSize: 14,
    lineHeight: 20,
    color: APP_COLORS.brownLight,
    fontFamily: "KotraHope",
    marginBottom: 20,
  },
  stageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: APP_COLORS.ivoryDark,
  },
  stageRowLocked: {
    opacity: 0.55,
  },
  stageMeta: {
    gap: 4,
  },
  stageId: {
    fontSize: 13,
    fontWeight: "600",
    color: APP_COLORS.brownLight,
    fontFamily: "KotraHope",
  },
  stageArea: {
    fontSize: 18,
    fontWeight: "700",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  stageRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stageTier: {
    fontSize: 14,
    color: APP_COLORS.brownLight,
    fontFamily: "KotraHope",
  },
  stageLock: {
    fontSize: 18,
  },
});
