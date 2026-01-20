import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, Modal, Alert, Image, Platform } from "react-native";
import HomeButton from "../../components/HomeButton";

type ChallengeStage = {
  stage: number;
  distanceKm: number;
  timeMinutes: number;
  reward: string;
  note: string;
};

type ChallengeTheme = {
  id: string;
  title: string;
  subtitle: string;
  accent: string;
  background: string;
  description: string;
  stages: ChallengeStage[];
};

type ResultPayload = {
  success: boolean;
  title: string;
  subtitle: string;
};

const RUN_STAGES: ChallengeStage[] = [
  {
    stage: 1,
    distanceKm: 2,
    timeMinutes: 15,
    reward: "미정",
    note: "워밍업 단계, 평균 페이스 7'30\"/km",
  },
  {
    stage: 2,
    distanceKm: 2.5,
    timeMinutes: 15,
    reward: "미정",
    note: "지속 페이스 6'00\"/km 유지",
  },
  {
    stage: 3,
    distanceKm: 3,
    timeMinutes: 16,
    reward: "미정",
    note: "템포 러닝, 페이스 5'20\"/km",
  },
  {
    stage: 4,
    distanceKm: 3.5,
    timeMinutes: 17,
    reward: "미정",
    note: "지속주와 스퍼트 혼합",
  },
  {
    stage: 5,
    distanceKm: 4,
    timeMinutes: 18,
    reward: "미정",
    note: "레이스 시뮬레이션 단계",
  },
];

const THEMES: ChallengeTheme[] = [
  {
    id: "time-attack-run",
    title: "타임어택 러닝",
    subtitle: "주어진 시간 안에 완주하세요",
    accent: "#FF6B6B",
    background: "#FFF3F3",
    description: "외부 러닝 데이터, GPS, 러닝 플랫폼 API를 연동해 기록을 검증하는 모드입니다.",
    stages: RUN_STAGES,
  },
  {
    id: "distance-control",
    title: "페이스 조절",
    subtitle: "목표 페이스 유지 훈련",
    accent: "#4ECDC4",
    background: "#EEFFFD",
    description: "향후 페이스 메이커 기능, 실시간 오디오 코칭을 연동할 예정입니다.",
    stages: RUN_STAGES,
  },
];

const formatSeconds = (value: number) => {
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.max(value % 60, 0)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
};

export default function ChallengesScreen() {
  const [selectedThemeId, setSelectedThemeId] = useState(THEMES[0].id);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [mode, setMode] = useState<"setup" | "running" | "result">("setup");
  const [timeLeft, setTimeLeft] = useState(0);
  const [distanceTracked, setDistanceTracked] = useState(0);
  const [result, setResult] = useState<ResultPayload | null>(null);
  const [isThemeModalVisible, setThemeModalVisible] = useState(false);
  const [isStageModalVisible, setStageModalVisible] = useState(false);
  const [tempStage, setTempStage] = useState<number | null>(null);

  const selectedTheme = useMemo(
    () => THEMES.find((theme) => theme.id === selectedThemeId),
    [selectedThemeId]
  );
  const activeStage = useMemo(
    () => selectedTheme?.stages.find((stage) => stage.stage === selectedStage) ?? null,
    [selectedTheme, selectedStage]
  );
  const totalSeconds = activeStage ? activeStage.timeMinutes * 60 : 0;
  const distanceProgress = activeStage ? distanceTracked / activeStage.distanceKm : 0;
  const timeProgress = totalSeconds ? (totalSeconds - timeLeft) / totalSeconds : 0;

  const resetToSetup = () => {
    setMode("setup");
    setResult(null);
    setDistanceTracked(0);
    setTimeLeft(0);
  };

  const handleStart = () => {
    if (!activeStage) {
      return;
    }
    setDistanceTracked(0);
    setTimeLeft(activeStage.timeMinutes * 60);
    setResult(null);
    setMode("running");
  };

  useEffect(() => {
    if (mode !== "running" || !activeStage) {
      return;
    }
    const total = activeStage.timeMinutes * 60;
    const distancePerSecond = activeStage.distanceKm / total;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
      setDistanceTracked((prev) => {
        const next = Math.min(activeStage.distanceKm, prev + distancePerSecond);
        return Number(next.toFixed(3));
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, activeStage]);

  useEffect(() => {
    if (mode !== "running" || !activeStage) {
      return;
    }

    const total = activeStage.timeMinutes * 60;
    const elapsed = total - timeLeft;

    if (distanceTracked >= activeStage.distanceKm) {
      setMode("result");
      setResult({
        success: true,
        title: "기록 달성!",
        subtitle: `${activeStage.distanceKm}km 목표를 ${formatSeconds(elapsed)} 안에 완주했어요.`,
      });
    } else if (timeLeft === 0) {
      setMode("result");
      setResult({
        success: false,
        title: "시간 종료",
        subtitle: `목표까지 ${(activeStage.distanceKm - distanceTracked).toFixed(2)}km 남았어요.`,
      });
    }
  }, [timeLeft, distanceTracked, mode, activeStage]);

  const renderSectionTitle = (label: string) => (
    <Text style={styles.sectionTitle}>{label}</Text>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <HomeButton />
      <View style={styles.headerBar} pointerEvents="none">
          <Image
            source={require("../../assets/images/running_icon.png")}
            style={styles.headerIcon}
            resizeMode="contain"
          />
      </View>
      <ScrollView contentContainerStyle={styles.container}>

        {mode === "setup" && (
          <>
            <View style={styles.selectorRow}>
              <TouchableOpacity
                style={styles.selectorCard}
                onPress={() => setThemeModalVisible(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.selectorLabel}>도전 테마</Text>
                <Text style={styles.selectorValue}>{selectedTheme?.title}</Text>
                <Text style={styles.selectorDesc}>{selectedTheme?.subtitle}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.selectorCard, !selectedTheme && styles.selectorDisabled]}
                onPress={() => {
                  if (selectedTheme) {
                    const defaultStage = selectedStage ?? (selectedTheme.stages[0]?.stage ?? 1);
                    setTempStage(defaultStage);
                    setStageModalVisible(true);
                  }
                }}
                activeOpacity={selectedTheme ? 0.85 : 1}
                disabled={!selectedTheme}
              >
                <Text style={styles.selectorLabel}>도전 단계</Text>
                <Text style={styles.selectorValue}>
                  {activeStage ? `Level ${activeStage.stage}` : "선택하세요"}
                </Text>
                <Text style={styles.selectorDesc}>
                  {activeStage
                    ? `${activeStage.distanceKm}km · ${activeStage.timeMinutes}분`
                    : "1~5단계 중 선택"}
                </Text>
              </TouchableOpacity>
            </View>

            <ChallengeSummary
              activeStage={activeStage}
              mode={mode}
              timeLeft={timeLeft}
              onPressStart={handleStart}
            />
          </>
        )}

        {mode === "running" && activeStage && (
          <View style={styles.runningSection}>
            <View style={styles.runningTimerCard}>
              <Text style={styles.digiTimer}>{formatSeconds(timeLeft)}</Text>
            </View>

            <View style={styles.runningMetricsCard}>
              <View style={styles.progressBlock}>
                <Text style={styles.progressLabel}>경과 시간</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(timeProgress * 100, 100)}%` }]} />
                </View>
                <Text style={styles.progressValue}>
                  {(timeProgress * 100).toFixed(0)}% 진행 · 제한 {activeStage.timeMinutes}분
                </Text>
              </View>

              <View style={styles.progressBlock}>
                <Text style={styles.progressLabel}>진행 거리</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFillDistance, { width: `${Math.min(distanceProgress * 100, 100)}%` }]} />
                </View>
                <Text style={styles.progressValue}>
                  {distanceTracked.toFixed(2)}km / {activeStage.distanceKm}km
                </Text>
              </View>

              <View style={styles.devButtonRow}>
                <TouchableOpacity
                  style={[styles.devButton, styles.devFailButton]}
                  onPress={() => setTimeLeft(0)}
                >
                  <Text style={styles.devButtonText}>시간 종료 테스트</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.devButton, styles.devSuccessButton]}
                  onPress={() => setDistanceTracked(activeStage.distanceKm)}
                >
                  <Text style={[styles.devButtonText, { fontFamily: 'KotraHope' }]}>거리 달성 테스트</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.runningDetailsCard}>
              <Text style={styles.runningExitLabel}>세션 중단이 필요한가요?</Text>
              <TouchableOpacity style={styles.abortButton} onPress={resetToSetup}>
                <Text style={styles.abortButtonText}>긴급 종료</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {mode === "result" && activeStage && result && (
          <>
            <View style={[styles.resultCard, result.success ? styles.resultSuccess : styles.resultFail]}>
              <Text style={styles.resultTitle}>{result.title}</Text>
              <Text style={styles.resultSubtitle}>{result.subtitle}</Text>
              <View style={styles.resultRow}>
                <View style={styles.resultColumn}>
                  <Text style={styles.resultLabel}>누적 거리</Text>
                  <Text style={styles.resultValue}>{distanceTracked.toFixed(2)}km</Text>
                </View>
                <View style={styles.resultColumn}>
                  <Text style={styles.resultLabel}>제한 시간</Text>
                  <Text style={styles.resultValue}>{activeStage.timeMinutes}분</Text>
                </View>
                <View style={styles.resultColumn}>
                  <Text style={styles.resultLabel}>보상</Text>
                  <Text style={styles.resultValue}>{activeStage.reward}</Text>
                </View>
              </View>
            </View>
            <View style={styles.resultButtons}>
              <TouchableOpacity style={styles.retryButton} onPress={handleStart}>
                <Text style={styles.retryText}>같은 단계 재도전</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backButton} onPress={resetToSetup}>
                <Text style={styles.backText}>다른 단계 선택</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={isThemeModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>도전 테마 선택</Text>
            <ScrollView contentContainerStyle={styles.modalContent}>
              {THEMES.map((theme) => {
                const isActive = theme.id === selectedThemeId;
                const isPlannedOnly = theme.id === "distance-control";
                return (
                  <TouchableOpacity
                    key={theme.id}
                    style={[
                      styles.modalThemeCard,
                      { borderColor: theme.accent },
                      isActive && styles.modalThemeCardActive,
                      isPlannedOnly && styles.modalThemeCardDisabled,
                    ]}
                    onPress={() => {
                      if (isPlannedOnly) {
                        Alert.alert("추가 예정", "추후 추가될 예정입니다.");
                        return;
                      }
                      setSelectedThemeId(theme.id);
                      setSelectedStage(null);
                      setThemeModalVisible(false);
                    }}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.modalThemeTitle, { fontFamily: 'KotraHope' }]}>{theme.title}</Text>
                    <Text style={styles.modalThemeSubtitle}>
                      {isPlannedOnly ? "추가 예정" : theme.subtitle}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setThemeModalVisible(false)}>
              <Text style={styles.modalCloseText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isStageModalVisible} animationType="fade" transparent>
        <View style={styles.stageModalBackdrop}>
          <View style={styles.stageModalSheet}>
            <Text style={styles.modalTitle}>도전 단계 선택</Text>
            <View style={styles.stagePickerHeader}>
              {(selectedTheme?.stages ?? []).map((stage) => {
                const isActive = tempStage === stage.stage;
                return (
                  <TouchableOpacity
                    key={stage.stage}
                    style={[styles.stageNumButton, isActive && styles.stageNumButtonActive]}
                    onPress={() => setTempStage(stage.stage)}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.stageNumText, isActive && styles.stageNumTextActive]}>
                      {stage.stage}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.stageDetailCard}>
              {(() => {
                const stage =
                  (selectedTheme?.stages ?? []).find((s) => s.stage === tempStage) ??
                  (selectedTheme?.stages[0] ?? null);
                if (!stage) {
                  return null;
                }
                return (
                  <>
                    <Text style={styles.stageDetailTitle}>Level {stage.stage}</Text>
                    <Text style={styles.stageDetailMain}>
                      {stage.distanceKm} KM, {stage.timeMinutes}분 내에 완주
                    </Text>
                    <Text style={styles.stageDetailReward}>보상 : ???</Text>
                  </>
                );
              })()}
            </View>
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.modalPrimaryButton]}
                onPress={() => {
                  if (tempStage != null) {
                    setSelectedStage(tempStage);
                  }
                  setStageModalVisible(false);
                }}
                activeOpacity={0.9}
              >
                <Text style={styles.modalPrimaryText}>선택</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.modalSecondaryButton]}
                onPress={() => setStageModalVisible(false)}
                activeOpacity={0.9}
              >
                <Text style={styles.modalSecondaryText}>닫기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

type ChallengeSummaryProps = {
  activeStage: ChallengeStage | null;
  mode: "setup" | "running" | "result";
  timeLeft: number;
  onPressStart: () => void;
};

const ChallengeSummary = ({ activeStage, mode, timeLeft, onPressStart }: ChallengeSummaryProps) => {
  const displaySeconds =
    mode === "running"
      ? timeLeft
      : activeStage
      ? activeStage.timeMinutes * 60
      : 0;

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>도전 준비</Text>
      {activeStage && (
        <View style={styles.summaryLevelBadge}>
          <Text style={styles.summaryLevelText}>Level {activeStage.stage}</Text>
        </View>
      )}
      <View style={styles.summaryTimerBlock}>
        <Text style={styles.summaryTimer}>{formatSeconds(displaySeconds)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryLabel}>목표 거리</Text>
          <Text style={styles.summaryValue}>
            {activeStage ? `${activeStage.distanceKm}km` : "--"}
          </Text>
        </View>
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryLabel}>제한 시간</Text>
          <Text style={styles.summaryValue}>
            {activeStage ? `${activeStage.timeMinutes}분` : "--"}
          </Text>
        </View>
        <View style={styles.summaryColumn}>
          <Text style={styles.summaryLabel}>보상</Text>
          <Text style={styles.summaryValue}>
            {activeStage ? activeStage.reward : "미정"}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.startButton, !activeStage && styles.startButtonDisabled]}
        onPress={onPressStart}
        disabled={!activeStage}
      >
        <Text style={styles.startButtonText}>도전 시작</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F6FA",
    paddingTop: 96,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 80,
    paddingTop: 84,
  },
  headerBar: {
    position: "absolute",
    top: 35,
    left: 20,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    overflow: "visible",
  },
  headerIcon: {
    width: 64,
    height: 64,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 12,
  

    fontFamily: 'KotraHope',},
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
  

    fontFamily: 'KotraHope',},
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 24,
  

    fontFamily: 'KotraHope',},
  themeRow: {
    paddingBottom: 12,
    gap: 12,
  },
  themeCard: {
    width: 260,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  themeCardActive: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  themeTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  

    fontFamily: 'KotraHope',},
  themeSubtitle: {
    fontSize: 13,
    color: "#1F2933",
    marginBottom: 8,
  

    fontFamily: 'KotraHope',},
  themeDesc: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
  

    fontFamily: 'KotraHope',},
  stageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  stageCard: {
    flexBasis: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  stageCardActive: {
    borderColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
  },
  stageBadge: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  

    fontFamily: 'KotraHope',},
  stageDistance: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 6,
  

    fontFamily: 'KotraHope',},
  stageTime: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
  

    fontFamily: 'KotraHope',},
  stageReward: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
  

    fontFamily: 'KotraHope',},
  stageNote: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  

    fontFamily: 'KotraHope',},
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  

    fontFamily: 'KotraHope',},
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryColumn: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#9CA3AF",
  

    fontFamily: 'KotraHope',},
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
  

    fontFamily: 'KotraHope',},
  summaryNote: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 16,
  

    fontFamily: 'KotraHope',},
  summaryGuide: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 12,
  

    fontFamily: 'KotraHope',},
  startButton: {
    backgroundColor: "#2563EB",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  startButtonDisabled: {
    backgroundColor: "#93C5FD",
  },
  startButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  

    fontFamily: 'KotraHope',},
  runningSection: {
    gap: 16,
    marginTop: 40,
  },
  runningCoreCard: {
    backgroundColor: "#0F172A",
    borderRadius: 24,
    padding: 24,
    gap: 16,
  },
  runningTimerCard: {
    backgroundColor: "#0F172A",
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1E293B",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  digiTimer: {
    color: "#fff",
    fontSize: 88,
    fontWeight: "800",
    letterSpacing: 4,
    lineHeight: 96,
    fontVariant: ["tabular-nums"],
    fontFamily: Platform.select({ android: "monospace", ios: undefined, default: undefined }),
    textShadowColor: "rgba(56, 189, 248, 0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  runningMetricsCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  runningDetailsCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    gap: 8,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  runningTitle: {
    color: "#9CA3AF",
    fontSize: 14,
    letterSpacing: 1,
  

    fontFamily: 'KotraHope',},
  runningTimer: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "700",
  

    fontFamily: 'KotraHope',},
  progressBlock: {
    marginTop: 4,
  },
  progressLabel: {
    color: "#6B7280",
    fontSize: 12,
    marginBottom: 6,
  

    fontFamily: 'KotraHope',},
  progressBar: {
    width: "100%",
    height: 10,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#38BDF8",
  },
  progressFillDistance: {
    height: "100%",
    backgroundColor: "#34D399",
  },
  progressValue: {
    color: "#374151",
    fontSize: 12,
    marginTop: 6,
  

    fontFamily: 'KotraHope',},
  abortButton: {
    borderWidth: 1,
    borderColor: "#F87171",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: "center",
    alignSelf: "stretch",
    marginTop: 4,
  },
  abortButtonText: {
    color: "#F87171",
    fontWeight: "600",
  

    fontFamily: 'KotraHope',},
  runningExitLabel: {
    color: "#374151",
    fontSize: 13,
  

    fontFamily: 'KotraHope',},
  devButtonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  devButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  devFailButton: {
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  devSuccessButton: {
    borderColor: "#A7F3D0",
    backgroundColor: "#ECFDF5",
  },
  devButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7F1D1D",
  

    fontFamily: 'KotraHope',},
  resultCard: {
    borderRadius: 20,
    padding: 22,
    marginTop: 20,
  },
  resultSuccess: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  resultFail: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: "700",
  

    fontFamily: 'KotraHope',},
  resultSubtitle: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 6,
  

    fontFamily: 'KotraHope',},
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  resultColumn: {
    flex: 1,
  },
  resultLabel: {
    fontSize: 12,
    color: "#6B7280",
  

    fontFamily: 'KotraHope',},
  resultValue: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  

    fontFamily: 'KotraHope',},
  resultButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  retryButton: {
    flex: 1,
    backgroundColor: "#2563EB",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
  

    fontFamily: 'KotraHope',},
  backButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CBD5F5",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
  },
  backText: {
    color: "#2563EB",
    fontWeight: "600",
  

    fontFamily: 'KotraHope',},
  summaryTimerBlock: {
    marginTop: 8,
    marginBottom: 16,
    alignItems: "flex-start",
  },
  summaryTimerLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  

    fontFamily: 'KotraHope',},
  summaryTimer: {
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: 2,
  

    fontFamily: 'KotraHope',},
  selectorRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  selectorCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  selectorDisabled: {
    opacity: 0.6,
  },
  selectorLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 6,
  

    fontFamily: 'KotraHope',},
  selectorValue: {
    fontSize: 18,
    fontWeight: "700",
  

    fontFamily: 'KotraHope',},
  selectorDesc: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
  

    fontFamily: 'KotraHope',},
  summaryLevelBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  summaryLevelText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  

    fontFamily: 'KotraHope',},
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxHeight: "85%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  

    fontFamily: 'KotraHope',},
  modalContent: {
    paddingBottom: 20,
    gap: 12,
  },
  modalThemeCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#F9FAFB",
  },
  modalThemeCardActive: {
    borderColor: "#2563EB",
    backgroundColor: "#EEF2FF",
  },
  modalThemeCardDisabled: {
    opacity: 0.6,
  },
  modalThemeTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  

    fontFamily: 'KotraHope',},
  modalThemeSubtitle: {
    fontSize: 13,
    color: "#1F2933",
    marginBottom: 6,
  

    fontFamily: 'KotraHope',},
  modalThemeDesc: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
  

    fontFamily: 'KotraHope',},
  stageModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  stageModalSheet: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 14,
    width: "92%",
    maxWidth: 520,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  modalCloseButton: {
    paddingVertical: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 8,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563EB",
  

    fontFamily: 'KotraHope',},
  stagePickerHeader: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  stageNumButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  stageNumButtonActive: {
    borderColor: "#2563EB",
    backgroundColor: "#EEF2FF",
  },
  stageNumText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  

    fontFamily: 'KotraHope',},
  stageNumTextActive: {
    color: "#1D4ED8",
  

    fontFamily: 'KotraHope',},
  stageDetailCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#fff",
  },
  stageDetailTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
  

    fontFamily: 'KotraHope',},
  stageDetailMain: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 6,
  

    fontFamily: 'KotraHope',},
  stageDetailReward: {
    fontSize: 13,
    color: "#374151",
    marginTop: 6,
  

    fontFamily: 'KotraHope',},
  stageDetailNote: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 10,
  

    fontFamily: 'KotraHope',},
  modalActionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
    marginBottom: 8,
  },
  modalActionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  modalPrimaryButton: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  modalSecondaryButton: {
    backgroundColor: "#fff",
    borderColor: "#CBD5F5",
  },
  modalPrimaryText: {
    color: "#fff",
    fontWeight: "600",
  

    fontFamily: 'KotraHope',},
  modalSecondaryText: {
    color: "#2563EB",
    fontWeight: "600",
  

    fontFamily: 'KotraHope',},
});