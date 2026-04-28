import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import HomeButton from "../../../components/HomeButton";
import DefenseStageDialogueModal from "../../../components/defense/DefenseStageDialogueModal";
import { APP_COLORS } from "../../../constants/theme";
import {
  STUB_SCENARIO_CHAPTERS,
  type StubScenarioChapter,
  type StubScenarioStage,
} from "../../../data/defenseStub";

const DEFENSE_SCENARIO_BACKGROUND = require("../../../assets/images/defence/defense_scenario.png");
const USE_SCENARIO_HERO_LAYOUT = true;
const SHOW_SCENARIO_HEADER_TITLE = false;

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

  const backgroundStyle = USE_SCENARIO_HERO_LAYOUT
    ? styles.backgroundHero
    : styles.backgroundFull;
  const backgroundImageStyle = USE_SCENARIO_HERO_LAYOUT
    ? styles.backgroundImageHero
    : styles.backgroundImageFull;
  const backgroundOverlayStyle = USE_SCENARIO_HERO_LAYOUT
    ? styles.backgroundOverlayHero
    : styles.backgroundOverlayFull;
  const fixedTopStyle = USE_SCENARIO_HERO_LAYOUT
    ? styles.fixedTopHero
    : styles.fixedTopFull;
  const headerTitleVisible = SHOW_SCENARIO_HEADER_TITLE || !USE_SCENARIO_HERO_LAYOUT;
  const listShellStyle = USE_SCENARIO_HERO_LAYOUT
    ? styles.listShellHero
    : styles.listShellFull;
  const sectionHeaderToneStyle = USE_SCENARIO_HERO_LAYOUT
    ? styles.sectionHeaderHero
    : styles.sectionHeaderFull;
  const stageRowToneStyle = USE_SCENARIO_HERO_LAYOUT
    ? styles.stageRowHero
    : styles.stageRowFull;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.screen}>
        <ImageBackground
          source={DEFENSE_SCENARIO_BACKGROUND}
          style={[styles.backgroundBase, backgroundStyle]}
          imageStyle={backgroundImageStyle}
          resizeMode="cover"
        >
          <View style={[styles.backgroundOverlayBase, backgroundOverlayStyle]} pointerEvents="none" />
        </ImageBackground>
        <View style={styles.homeButtonLayer}>
          <HomeButton />
        </View>

        <View style={[styles.fixedTop, fixedTopStyle]}>
          {headerTitleVisible ? (
            <View style={styles.headerBlock}>
              <View style={styles.headerRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel="뒤로"
                >
                  <Ionicons name="chevron-back" size={26} color={APP_COLORS.brown} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>시나리오</Text>
              </View>
            </View>
          ) : (
            <View style={styles.headerBlockCompact}>
              <TouchableOpacity
                style={styles.backCapsule}
                onPress={() => router.back()}
                activeOpacity={0.82}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="뒤로"
              >
                <Ionicons name="chevron-back" size={24} color={APP_COLORS.brown} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={[styles.listShell, listShellStyle]}>
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
                  style={[
                    styles.sectionHeader,
                    sectionHeaderToneStyle,
                    !isFirst && styles.sectionHeaderFollow,
                  ]}
                >
                  <Text style={styles.sectionHeading}>
                    {section.chapterId}. {section.name}
                  </Text>
                </View>
              );
            }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.stageRow, stageRowToneStyle, item.locked && styles.stageRowLocked]}
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
        </View>

        <DefenseStageDialogueModal
          visible={dialogueStage !== null}
          stage={dialogueStage}
          onClose={() => setDialogueStage(null)}
          onProceedToBattle={proceedToBattle}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: APP_COLORS.ivory,
  },
  screen: {
    flex: 1,
  },
  backgroundBase: {
    position: "absolute",
    left: 0,
    right: 0,
    overflow: "hidden",
  },
  backgroundFull: {
    top: 0,
    bottom: 0,
  },
  backgroundHero: {
    top: 0,
    height: 250,
  },
  backgroundImageFull: {
    opacity: 0.78,
  },
  backgroundImageHero: {
    opacity: 0.9,
    transform: [{ scale: 1.08 }, { translateX: 22 }],
  },
  backgroundOverlayBase: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundOverlayFull: {
    backgroundColor: "rgba(255, 254, 245, 0.20)",
  },
  backgroundOverlayHero: {
    backgroundColor: "rgba(255, 254, 245, 0.32)",
  },
  /** fixedTop(zIndex 20)보다 위에 두어 홈 버튼이 가려지지 않게 */
  homeButtonLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
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
  },
  fixedTopFull: {
    backgroundColor: "rgba(255, 254, 245, 0.82)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: APP_COLORS.ivoryDark,
  },
  fixedTopHero: {
    backgroundColor: "transparent",
    paddingBottom: 12,
  },
  listShell: {
    flex: 1,
  },
  listShellFull: {
    backgroundColor: "transparent",
  },
  listShellHero: {
    backgroundColor: APP_COLORS.ivory,
    marginTop: 6,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    elevation: 6,
  },
  list: {
    flex: 1,
    zIndex: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  headerBlock: {
    marginBottom: 6,
  },
  headerBlockCompact: {
    marginBottom: 2,
    alignItems: "flex-start",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 36,
  },
  backButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    marginLeft: -4,
  },
  backCapsule: {
    minWidth: 44,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 254, 245, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(245, 240, 224, 0.95)",
    shadowColor: "#8B7355",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  sectionHeader: {
    paddingBottom: 8,
    paddingTop: 4,
    paddingHorizontal: 20,
  },
  sectionHeaderFull: {
    backgroundColor: "rgba(255, 254, 245, 0.82)",
  },
  sectionHeaderHero: {
    backgroundColor: APP_COLORS.ivory,
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
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 72,
    borderWidth: 2,
    borderColor: APP_COLORS.ivoryDark,
  },
  stageRowFull: {
    backgroundColor: "rgba(255,255,255,0.88)",
  },
  stageRowHero: {
    backgroundColor: "#FFF",
    shadowColor: "#8B7355",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  stageRowLocked: {
    opacity: 0.65,
  },
  rowSep: {
    height: 10,
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
