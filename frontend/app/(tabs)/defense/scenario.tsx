import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import HomeButton from "../../../components/HomeButton";
import DefenseStageDialogueModal from "../../../components/defense/DefenseStageDialogueModal";
import DefenseSubHeader from "../../../components/defense/DefenseSubHeader";
import { APP_COLORS } from "../../../constants/theme";
import {
  STUB_SCENARIO_CHAPTERS,
  type StubScenarioChapter,
  type StubScenarioStage,
} from "../../../data/defenseStub";

type Section = StubScenarioChapter & { data: StubScenarioStage[] };

/**
 * 시나리오 스테이지 목록 — 챕터(메인 n)별 구역 + 서브 스테이지(n-m).
 */
export default function DefenseScenarioScreen() {
  const [dialogueStage, setDialogueStage] = useState<StubScenarioStage | null>(null);

  const sections: Section[] = STUB_SCENARIO_CHAPTERS.map((ch) => ({
    ...ch,
    data: ch.stages,
  }));

  const openStage = (stage: StubScenarioStage) => {
    if (stage.locked) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setDialogueStage(stage);
  };

  const proceedToBattle = (stageId: string) => {
    setDialogueStage(null);
    router.push(`/(tabs)/defense/stage/${stageId}` as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.homeButtonLayer}>
        <HomeButton />
      </View>
      <View style={styles.fixedTop}>
        <View style={styles.headerBlock}>
          <DefenseSubHeader title="시나리오" />
        </View>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        renderSectionHeader={({ section }) => {
          const isFirst = section.chapterId === STUB_SCENARIO_CHAPTERS[0]?.chapterId;
          return (
            <View
              style={[styles.sectionHeader, !isFirst && styles.sectionHeaderFollow]}
            >
              <Text style={styles.sectionHeading}>
                {section.chapterId}. {section.name}
              </Text>
            </View>
          );
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.stageRow, item.locked && styles.stageRowLocked]}
            onPress={() => openStage(item)}
            activeOpacity={0.85}
          >
            <View style={styles.stageMeta}>
              <Text style={styles.stageId}>{item.id}</Text>
              <Text style={styles.stageArea} numberOfLines={1}>
                {item.area}
              </Text>
            </View>
            <View style={styles.stageRight}>
              <Ionicons
                name={item.locked ? "lock-closed" : "chevron-forward"}
                size={20}
                color={item.locked ? APP_COLORS.brownLight : APP_COLORS.brown}
              />
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.rowSep} />}
        SectionSeparatorComponent={() => null}
      />

      <DefenseStageDialogueModal
        visible={dialogueStage !== null}
        stage={dialogueStage}
        onClose={() => setDialogueStage(null)}
        onProceedToBattle={proceedToBattle}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: APP_COLORS.ivory,
  },
  /** fixedTop(zIndex 20)보다 위에 두어 홈 버튼이 가려지지 않게 */
  homeButtonLayer: {
    zIndex: 25,
    elevation: 10,
  },
  /** 스크롤과 분리 — SectionList가 형제로 뒤에 그려져 겹침 방지에 zIndex 필수 */
  fixedTop: {
    zIndex: 20,
    elevation: 8,
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 10,
    backgroundColor: APP_COLORS.ivory,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: APP_COLORS.ivoryDark,
  },
  list: {
    flex: 1,
    zIndex: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 40,
    flexGrow: 1,
  },
  headerBlock: {
    marginBottom: 6,
  },
  sectionHeader: {
    backgroundColor: APP_COLORS.ivory,
    paddingBottom: 8,
    paddingTop: 4,
  },
  sectionHeaderFollow: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: APP_COLORS.ivoryDark,
  },
  sectionHeading: {
    fontSize: 22,
    fontWeight: "700",
    color: APP_COLORS.brownLight,
    fontFamily: "KotraHope",
    letterSpacing: 0.2,
  },
  stageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 72,
    borderWidth: 2,
    borderColor: APP_COLORS.ivoryDark,
  },
  stageRowLocked: {
    opacity: 0.55,
  },
  rowSep: {
    height: 8,
  },
  stageMeta: {
    flex: 1,
    marginRight: 12,
    gap: 4,
  },
  stageId: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: APP_COLORS.brownLight,
    fontFamily: "KotraHope",
  },
  stageArea: {
    fontSize: 17,
    fontWeight: "700",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  stageRight: {
    justifyContent: "center",
    alignItems: "center",
    width: 28,
  },
});
