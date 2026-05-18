import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import HomeButton from "../../../components/HomeButton";
import DefenseSubHeader from "../../../components/defense/DefenseSubHeader";
import { APP_COLORS } from "../../../constants/theme";
import { STUB_SCENARIO_STAGES } from "../../../data/defenseStub";
import { loadClearedScenarioStageIds } from "../../../utils/defenseScenarioProgress";
<<<<<<< Updated upstream
=======
import { DEFENSE_BOSS_WAVE_NUMBER } from "../../../components/defense/defenseWaveConstants";
>>>>>>> Stashed changes

/**
 * 시나리오 스테이지 목록 뼈대.
 */
export default function DefenseScenarioScreen() {
  const [clearedStageIds, setClearedStageIds] = useState<Set<string>>(() => new Set());

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadClearedScenarioStageIds().then((ids) => {
        if (active) setClearedStageIds(ids);
      });
      return () => {
        active = false;
      };
    }, []),
  );

<<<<<<< Updated upstream
  const openStage = (id: string, locked: boolean) => {
=======
  const openStage = useCallback((id: string, locked: boolean) => {
>>>>>>> Stashed changes
    if (locked) {
      Alert.alert("잠금", "이전 스테이지를 먼저 클리어해 주세요. (뼈대)");
      return;
    }
    router.push(`/(tabs)/defense/stage/${id}` as any);
<<<<<<< Updated upstream
  };
=======
  }, []);
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
        {STUB_SCENARIO_STAGES.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[
              styles.stageRow,
              s.locked && styles.stageRowLocked,
              clearedStageIds.has(s.id) && styles.stageRowCleared,
            ]}
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
=======
        {STUB_SCENARIO_STAGES.map((s) => {
          const hasBossWave = s.totalWaves >= DEFENSE_BOSS_WAVE_NUMBER;
          const cleared = clearedStageIds.has(s.id);
          const showBossSkull = s.id === "1-3" && hasBossWave;

          return (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.stageRow,
                s.locked && styles.stageRowLocked,
                cleared && styles.stageRowCleared,
              ]}
              onPress={() => openStage(s.id, s.locked)}
              activeOpacity={0.85}
            >
              <View style={styles.stageMeta}>
                <Text style={styles.stageId}>{s.id}</Text>
                <Text style={styles.stageArea}>{s.area}</Text>
              </View>
              {showBossSkull ? (
                <View style={styles.skullCenter} pointerEvents="none">
                  <Text style={styles.skullEmoji} accessibilityLabel="보스 웨이브">
                    💀
                  </Text>
                </View>
              ) : null}
              <View style={styles.stageRight}>
                <Text style={styles.stageTier}>{s.tier}</Text>
                <Text style={styles.stageLock}>{s.locked ? "🔒" : "▶"}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
    position: "relative",
>>>>>>> Stashed changes
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
  stageRowCleared: {
    backgroundColor: "rgba(200, 230, 201, 0.72)",
    borderColor: "rgba(129, 199, 132, 0.75)",
<<<<<<< Updated upstream
=======
  },
  skullCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  skullEmoji: {
    fontSize: 30,
    lineHeight: 36,
>>>>>>> Stashed changes
  },
  stageMeta: {
    gap: 4,
    maxWidth: "42%",
    zIndex: 1,
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
<<<<<<< Updated upstream
=======
    zIndex: 1,
>>>>>>> Stashed changes
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
