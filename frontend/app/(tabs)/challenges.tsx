import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Alert,
  ImageBackground,
  Platform,
} from "react-native";
import HomeButton from "../../components/HomeButton";
import AuthManager from "../../utils/AuthManager";
import API_BASE_URL from "../../config/api";

const STAGES = [
  { stage: 1, distanceKm: 3, timeMinutes: 15 },
  { stage: 2, distanceKm: 3, timeMinutes: 14 },
  { stage: 3, distanceKm: 3, timeMinutes: 13 },
  { stage: 4, distanceKm: 3, timeMinutes: 12 },
  { stage: 5, distanceKm: 3, timeMinutes: 11 },
  { stage: 6, distanceKm: 3, timeMinutes: 10 },
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

const GLOW_COLOR = "#DC2626";
const GLOW_INTENSE = "#F87171";

export default function ChallengesScreen() {
  const [highestStage, setHighestStage] = useState(0);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [mode, setMode] = useState<"setup" | "running" | "result">("setup");
  const [timeLeft, setTimeLeft] = useState(0);
  const [distanceTracked, setDistanceTracked] = useState(0);
  const [result, setResult] = useState<{ success: boolean; title: string; subtitle: string } | null>(null);
  const [isStageModalVisible, setStageModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const nextUnlockedStage = highestStage + 1;
  const activeStage = useMemo(
    () => STAGES.find((s) => s.stage === selectedStage) ?? null,
    [selectedStage]
  );
  const totalSeconds = activeStage ? activeStage.timeMinutes * 60 : 0;
  const distanceProgress = activeStage ? distanceTracked / activeStage.distanceKm : 0;
  const timeProgress = totalSeconds ? (totalSeconds - timeLeft) / totalSeconds : 0;

  const fetchProgress = async () => {
    try {
      const headers = await AuthManager.getAuthHeader();
      if (!headers.Authorization) return;
      const res = await fetch(`${API_BASE_URL}/api/challenges`, { headers });
      if (!res.ok) throw new Error("조회 실패");
      const data = await res.json();
      const highest = data.highestStage ?? 0;
      setHighestStage(highest);
      setSelectedStage((prev) => prev ?? data.nextStage ?? 1);
    } catch (e) {
      console.error("기록도전 조회 실패:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const resetToSetup = () => {
    setMode("setup");
    setResult(null);
    setDistanceTracked(0);
    setTimeLeft(0);
  };

  const handleStart = () => {
    if (!activeStage) return;
    setDistanceTracked(0);
    setTimeLeft(activeStage.timeMinutes * 60);
    setResult(null);
    setMode("running");
  };

  const recordCompletion = async () => {
    if (!activeStage) return;
    try {
      const headers = await AuthManager.getAuthHeader();
      if (!headers.Authorization) return;
      await fetch(`${API_BASE_URL}/api/challenges/complete`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ stage: activeStage.stage }),
      });
      setHighestStage((prev) => Math.max(prev, activeStage.stage));
    } catch (e) {
      console.error("완료 기록 실패:", e);
    }
  };

  useEffect(() => {
    if (mode !== "running" || !activeStage) return;
    const distancePerSecond = activeStage.distanceKm / (activeStage.timeMinutes * 60);
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
    if (mode !== "running" || !activeStage) return;
    const total = activeStage.timeMinutes * 60;
    const elapsed = total - timeLeft;

    if (distanceTracked >= activeStage.distanceKm) {
      setMode("result");
      setResult({
        success: true,
        title: "기록 달성!",
        subtitle: `${activeStage.distanceKm}km 목표를 ${formatSeconds(elapsed)} 안에 완주했어요.`,
      });
      recordCompletion();
    } else if (timeLeft === 0) {
      setMode("result");
      setResult({
        success: false,
        title: "시간 종료",
        subtitle: `목표까지 ${(activeStage.distanceKm - distanceTracked).toFixed(2)}km 남았어요.`,
      });
    }
  }, [timeLeft, distanceTracked, mode, activeStage]);

  const isStageUnlocked = (stageNum: number) => stageNum <= nextUnlockedStage;
  const isStageCompleted = (stageNum: number) => stageNum <= highestStage;

  return (
    <ImageBackground
      source={require("../../assets/images/background/Dark.png")}
      style={styles.background}
      resizeMode="stretch"
      imageStyle={styles.backgroundImage}
    >
      <SafeAreaView style={styles.safeArea}>
        <HomeButton />
        <View style={styles.glowOverlay} pointerEvents="none" />
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>기록 도전</Text>
          <Text style={styles.headerSubtitle}>3km를 주어진 시간 안에 돌파하세요</Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <Text style={styles.loadingText}>불러오는 중...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            {mode === "setup" && (
              <>
                <TouchableOpacity
                  style={styles.stageSelectorCard}
                  onPress={() => setStageModalVisible(true)}
                  activeOpacity={0.9}
                >
                  <View style={styles.stageSelectorGlow} />
                  <Text style={styles.selectorLabel}>도전 단계</Text>
                  <Text style={styles.selectorValue}>
                    {activeStage ? `${activeStage.stage}단계` : `${nextUnlockedStage}단계 선택`}
                  </Text>
                  <Text style={styles.selectorDesc}>
                    {activeStage
                      ? `${activeStage.distanceKm}km · ${activeStage.timeMinutes}분`
                      : "1단계부터 순차 도전"}
                  </Text>
                </TouchableOpacity>

                <View style={[styles.summaryCard, styles.glowCard]}>
                  <Text style={styles.summaryTitle}>도전 준비</Text>
                  {activeStage && (
                    <View style={styles.summaryLevelBadge}>
                      <Text style={styles.summaryLevelText}>{activeStage.stage}단계</Text>
                    </View>
                  )}
                  <View style={styles.summaryTimerBlock}>
                    <Text style={styles.summaryTimer}>
                      {activeStage ? formatSeconds(activeStage.timeMinutes * 60) : "--:--"}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryColumn}>
                      <Text style={styles.summaryLabel}>목표 거리</Text>
                      <Text style={styles.summaryValue}>{activeStage ? `${activeStage.distanceKm}km` : "--"}</Text>
                    </View>
                    <View style={styles.summaryColumn}>
                      <Text style={styles.summaryLabel}>제한 시간</Text>
                      <Text style={styles.summaryValue}>{activeStage ? `${activeStage.timeMinutes}분` : "--"}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.startButton, !activeStage && styles.startButtonDisabled]}
                    onPress={handleStart}
                    disabled={!activeStage}
                  >
                    <View style={styles.startButtonGlow} />
                    <Text style={styles.startButtonText}>도전 시작</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {mode === "running" && activeStage && (
              <View style={styles.runningSection}>
                <View style={[styles.runningTimerCard, styles.glowCard]}>
                  <View style={styles.timerGlow} />
                  <Text style={styles.digiTimer}>{formatSeconds(timeLeft)}</Text>
                </View>
                <View style={[styles.runningMetricsCard, styles.glowCard]}>
                  <View style={styles.metricsGlow} />
                  <View style={styles.progressBlock}>
                    <Text style={styles.progressLabel}>경과 시간</Text>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${Math.min(timeProgress * 100, 100)}%` }]} />
                    </View>
                    <Text style={styles.progressValue}>
                      {(timeProgress * 100).toFixed(0)}% · 제한 {activeStage.timeMinutes}분
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
                  <TouchableOpacity style={styles.abortButton} onPress={resetToSetup}>
                    <Text style={styles.abortButtonText}>긴급 종료</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {mode === "result" && activeStage && result && (
              <>
                <View style={[styles.resultCard, result.success ? styles.resultSuccess : styles.resultFail, styles.glowCard]}>
                  <View style={styles.resultGlow} />
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
                  </View>
                </View>
                <View style={styles.resultButtons}>
                  <TouchableOpacity style={[styles.retryButton, styles.glowCard]} onPress={handleStart}>
                    <View style={styles.buttonGlow} />
                    <Text style={styles.retryText}>같은 단계 재도전</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.backButton} onPress={resetToSetup}>
                    <Text style={styles.backText}>다른 단계 선택</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        )}

        <Modal visible={isStageModalVisible} animationType="fade" transparent>
          <View style={styles.stageModalBackdrop}>
            <View style={[styles.stageModalSheet, styles.glowCard]}>
              <View style={styles.modalGlow} />
              <Text style={styles.modalTitle}>도전 단계 선택</Text>
              <Text style={styles.modalSubtitle}>이전 단계를 완료해야 다음 단계에 도전할 수 있어요</Text>
              <View style={styles.stagePickerHeader}>
                {STAGES.map((s) => {
                  const unlocked = isStageUnlocked(s.stage);
                  const completed = isStageCompleted(s.stage);
                  const active = selectedStage === s.stage;
                  return (
                    <TouchableOpacity
                      key={s.stage}
                      style={[
                        styles.stageNumButton,
                        !unlocked && styles.stageNumButtonLocked,
                        completed && styles.stageNumButtonCompleted,
                        active && styles.stageNumButtonActive,
                      ]}
                      onPress={() => unlocked && setSelectedStage(s.stage)}
                      activeOpacity={unlocked ? 0.9 : 1}
                      disabled={!unlocked}
                    >
                      <Text
                        style={[
                          styles.stageNumText,
                          !unlocked && styles.stageNumTextLocked,
                          completed && styles.stageNumTextCompleted,
                          active && styles.stageNumTextActive,
                        ]}
                      >
                        {s.stage}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.stageDetailCard}>
                {activeStage && (
                  <>
                    <Text style={styles.stageDetailTitle}>{activeStage.stage}단계</Text>
                    <Text style={styles.stageDetailMain}>
                      {activeStage.distanceKm}km, {activeStage.timeMinutes}분 내에 완주
                    </Text>
                  </>
                )}
              </View>
              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={[styles.modalActionButton, styles.modalPrimaryButton]}
                  onPress={() => setStageModalVisible(false)}
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#0a0505",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
    ...(Platform.OS === "web" && { objectPosition: "center center" } as object),
  },
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    borderWidth: 0,
    shadowColor: GLOW_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 0,
  },
  headerBar: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "KotraHope",
    textShadowColor: GLOW_COLOR,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    fontFamily: "KotraHope",
  },
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "KotraHope",
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 80,
  },
  stageSelectorCard: {
    backgroundColor: "rgba(20, 10, 10, 0.85)",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.5)",
    overflow: "hidden",
    position: "relative",
  },
  stageSelectorGlow: {
    position: "absolute",
    top: -20,
    left: -20,
    right: -20,
    height: 60,
    backgroundColor: GLOW_COLOR,
    opacity: 0.08,
    borderRadius: 40,
  },
  selectorLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 6,
    fontFamily: "KotraHope",
  },
  selectorValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "KotraHope",
  },
  selectorDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginTop: 6,
    fontFamily: "KotraHope",
  },
  glowCard: {
    position: "relative",
    overflow: "hidden",
  },
  summaryCard: {
    backgroundColor: "rgba(20, 10, 10, 0.9)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.45)",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
    fontFamily: "KotraHope",
  },
  summaryLevelBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(220, 38, 38, 0.3)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.5)",
  },
  summaryLevelText: {
    fontSize: 14,
    fontWeight: "700",
    color: GLOW_INTENSE,
    fontFamily: "KotraHope",
  },
  summaryTimerBlock: {
    marginBottom: 20,
  },
  summaryTimer: {
    fontSize: 48,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 4,
    fontFamily: Platform.select({ android: "monospace", ios: undefined, default: undefined }),
    textShadowColor: GLOW_COLOR,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  summaryColumn: {
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 4,
    fontFamily: "KotraHope",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "KotraHope",
  },
  startButton: {
    backgroundColor: "rgba(220, 38, 38, 0.4)",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.7)",
    position: "relative",
  },
  startButtonGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: GLOW_COLOR,
    opacity: 0.1,
    borderRadius: 16,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "KotraHope",
  },
  runningSection: {
    gap: 20,
    marginTop: 20,
  },
  runningTimerCard: {
    backgroundColor: "rgba(20, 10, 10, 0.95)",
    borderRadius: 24,
    paddingVertical: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.5)",
  },
  timerGlow: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -100,
    marginTop: -50,
    width: 200,
    height: 100,
    backgroundColor: GLOW_COLOR,
    opacity: 0.08,
    borderRadius: 100,
  },
  digiTimer: {
    color: "#fff",
    fontSize: 72,
    fontWeight: "800",
    letterSpacing: 6,
    fontFamily: Platform.select({ android: "monospace", ios: undefined, default: undefined }),
    textShadowColor: GLOW_COLOR,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  runningMetricsCard: {
    backgroundColor: "rgba(20, 10, 10, 0.9)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.45)",
  },
  metricsGlow: {
    position: "absolute",
    top: -30,
    left: "50%",
    marginLeft: -60,
    width: 120,
    height: 60,
    backgroundColor: GLOW_COLOR,
    opacity: 0.05,
    borderRadius: 60,
  },
  progressBlock: {
    marginTop: 16,
  },
  progressLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginBottom: 8,
    fontFamily: "KotraHope",
  },
  progressBar: {
    width: "100%",
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: GLOW_COLOR,
    borderRadius: 6,
  },
  progressFillDistance: {
    height: "100%",
    backgroundColor: "#F97316",
    borderRadius: 6,
  },
  progressValue: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 6,
    fontFamily: "KotraHope",
  },
  abortButton: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.7)",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  abortButtonText: {
    color: "#FCA5A5",
    fontWeight: "600",
    fontFamily: "KotraHope",
  },
  resultCard: {
    borderRadius: 24,
    padding: 24,
    marginTop: 20,
    borderWidth: 1,
    position: "relative",
  },
  resultGlow: {
    position: "absolute",
    top: -20,
    left: "50%",
    marginLeft: -60,
    width: 120,
    height: 60,
    borderRadius: 60,
    backgroundColor: GLOW_COLOR,
    opacity: 0.06,
  },
  resultSuccess: {
    backgroundColor: "rgba(234, 88, 12, 0.2)",
    borderColor: "rgba(249, 115, 22, 0.6)",
  },
  resultFail: {
    backgroundColor: "rgba(185, 28, 28, 0.2)",
    borderColor: "rgba(220, 38, 38, 0.6)",
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "KotraHope",
  },
  resultSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 8,
    fontFamily: "KotraHope",
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  resultColumn: {
    alignItems: "center",
  },
  resultLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontFamily: "KotraHope",
  },
  resultValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginTop: 4,
    fontFamily: "KotraHope",
  },
  resultButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  retryButton: {
    flex: 1,
    backgroundColor: "rgba(220, 38, 38, 0.4)",
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.6)",
    position: "relative",
  },
  buttonGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: GLOW_COLOR,
    opacity: 0.08,
    borderRadius: 14,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
    fontFamily: "KotraHope",
  },
  backButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 14,
  },
  backText: {
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    fontFamily: "KotraHope",
  },
  stageModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  stageModalSheet: {
    backgroundColor: "rgba(20, 10, 10, 0.98)",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.5)",
    position: "relative",
  },
  modalGlow: {
    position: "absolute",
    top: -40,
    left: "50%",
    marginLeft: -80,
    width: 160,
    height: 80,
    backgroundColor: GLOW_COLOR,
    opacity: 0.1,
    borderRadius: 80,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    fontFamily: "KotraHope",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 20,
    fontFamily: "KotraHope",
  },
  stagePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  stageNumButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(220, 38, 38, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(20, 10, 10, 0.8)",
  },
  stageNumButtonLocked: {
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(0,0,0,0.3)",
    opacity: 0.6,
  },
  stageNumButtonCompleted: {
    borderColor: "rgba(249, 115, 22, 0.7)",
    backgroundColor: "rgba(234, 88, 12, 0.25)",
  },
  stageNumButtonActive: {
    borderColor: GLOW_COLOR,
    backgroundColor: "rgba(220, 38, 38, 0.3)",
  },
  stageNumText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "KotraHope",
  },
  stageNumTextLocked: {
    color: "rgba(255,255,255,0.3)",
  },
  stageNumTextCompleted: {
    color: "#FB923C",
  },
  stageNumTextActive: {
    color: GLOW_INTENSE,
  },
  stageDetailCard: {
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.4)",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
    marginBottom: 20,
  },
  stageDetailTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    fontFamily: "KotraHope",
  },
  stageDetailMain: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginTop: 8,
    fontFamily: "KotraHope",
  },
  modalActionRow: {
    flexDirection: "row",
    gap: 12,
  },
  modalActionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  modalPrimaryButton: {
    backgroundColor: "rgba(220, 38, 38, 0.4)",
    borderColor: "rgba(248, 113, 113, 0.7)",
  },
  modalSecondaryButton: {
    backgroundColor: "transparent",
    borderColor: "rgba(255,255,255,0.3)",
  },
  modalPrimaryText: {
    color: "#fff",
    fontWeight: "600",
    fontFamily: "KotraHope",
  },
  modalSecondaryText: {
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    fontFamily: "KotraHope",
  },
});
