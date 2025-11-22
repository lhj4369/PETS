//타이머 화면
import React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HomeButton from "../../components/HomeButton";
import styles from "../../features/timer/styles";
import {
  DEFAULT_REST_DURATION_MS,
  REST_MAX_MS,
  REST_MIN_MS,
  REST_STEP_MS,
} from "../../features/timer/constants";
import { formatDuration } from "../../features/timer/utils/formatDuration";
import { useWorkoutTimer } from "../../features/timer/hooks/useWorkoutTimer";
import AuthManager from "../../utils/AuthManager";
import API_BASE_URL from "../../config/api";
import { useCustomization } from "../../context/CustomizationContext";
import { useFocusEffect } from "@react-navigation/native";
import { getClockImageFromType } from "../../utils/customizationUtils";

type Mode = "aerobic" | "interval";
type Phase = "idle" | "running" | "summary";

type SummaryStat = {
  label: string;
  value: number;
};

type SummaryData = {
  mode: Mode;
  elapsedMs: number;
  heartRate: number;
  stats: SummaryStat[];
  restDurationMs?: number;
  laps?: number[];
  intervalInfo?: {
    completedRounds: number;
  };
};

export default function TimerScreen() {
  const [mode, setMode] = useState<Mode>("aerobic");
  const [phase, setPhase] = useState<Phase>("idle");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [laps, setLaps] = useState<number[]>([]);
  const [restDurationMs, setRestDurationMs] = useState(DEFAULT_REST_DURATION_MS);
  const [activeRestDurationMs, setActiveRestDurationMs] =
    useState(DEFAULT_REST_DURATION_MS);
  const [showIntervalConfigurator, setShowIntervalConfigurator] =
    useState(false);
  const [completedSets, setCompletedSets] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restRemainingMs, setRestRemainingMs] = useState(0);
  const restEndTimeRef = useRef<number | null>(null);
  const restFrameRef = useRef<number | null>(null);
  const wasRunningBeforeRestRef = useRef(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [pausedForConfirm, setPausedForConfirm] = useState(false);
  const [hasClaimedReward, setHasClaimedReward] = useState(false);
  const [hasSavedRecord, setHasSavedRecord] = useState(false);
  const [animalType, setAnimalType] = useState<string | null>("dog");
  const timer = useWorkoutTimer();
  const { loadCustomizationFromServer } = useCustomization();

  // 프로필에서 동물 정보 로드
  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        try {
          const headers = await AuthManager.getAuthHeader();
          if (!headers.Authorization) return;

          const response = await fetch(`${API_BASE_URL}/api/auth/me`, { headers });
          if (response.ok) {
            const data = await response.json();
            loadCustomizationFromServer(data.profile?.backgroundType, data.profile?.clockType);
            setAnimalType(data.profile?.animalType ?? "dog");
          }
        } catch (error) {
          console.error("프로필 로드 실패:", error);
        }
      };
      loadProfile();
    }, [loadCustomizationFromServer])
  );

  const handleStart = () => {
    finishRest(false);
    timer.reset();
    timer.start();
    setSummary(null);
    setLaps([]);
    setCompletedSets(0);
    setHasClaimedReward(false);
    setHasSavedRecord(false);
    const initialRest =
      mode === "interval" ? restDurationMs : DEFAULT_REST_DURATION_MS;
    setActiveRestDurationMs(initialRest);
    setShowIntervalConfigurator(false);
    setPhase("running");
  };

  const handlePauseToggle = () => {
    if (!timer.isRunning) {
      return;
    }
    if (timer.isPaused) {
      timer.resume();
    } else {
      timer.pause();
    }
  };

  const handleAddLap = () => {
    if (!timer.isRunning || timer.isPaused) {
      return;
    }
    setLaps((prev) => [...prev, timer.elapsedMs]);
  };

  const handleAdjustRestDuration = (deltaMs: number) => {
    setRestDurationMs((prev) => {
      const nextValue = Math.min(
        REST_MAX_MS,
        Math.max(REST_MIN_MS, prev + deltaMs)
      );
      const snapped =
        Math.round(nextValue / REST_STEP_MS) * REST_STEP_MS;
      return snapped;
    });
  };

  const handleResetRestDuration = () => {
    setRestDurationMs(DEFAULT_REST_DURATION_MS);
  };

  const stopRestTimer = useCallback(() => {
    if (restFrameRef.current !== null) {
      cancelAnimationFrame(restFrameRef.current);
      restFrameRef.current = null;
    }
    restEndTimeRef.current = null;
  }, []);

  const finishRest = useCallback(
    (shouldResume: boolean) => {
      stopRestTimer();
      setIsResting(false);
      setRestRemainingMs(0);
      if (shouldResume && wasRunningBeforeRestRef.current) {
        timer.resume();
      }
      wasRunningBeforeRestRef.current = false;
    },
    [stopRestTimer, timer]
  );

  const tickRest = useCallback(() => {
    if (restEndTimeRef.current === null) {
      return;
    }
    const remaining = Math.max(restEndTimeRef.current - Date.now(), 0);
    setRestRemainingMs(remaining);
    if (remaining <= 0) {
      finishRest(true);
    } else {
      restFrameRef.current = requestAnimationFrame(() => tickRest());
    }
  }, [finishRest]);

  const handleStartRest = () => {
    if (isResting) {
      return;
    }
    const restDuration = activeRestDurationMs;
    if (restDuration <= 0) {
      return;
    }
    stopRestTimer();
    setCompletedSets((prev) => prev + 1);
    const wasRunning = timer.isRunning && !timer.isPaused;
    wasRunningBeforeRestRef.current = wasRunning;
    if (wasRunning) {
      timer.pause();
    }
    setIsResting(true);
    setRestRemainingMs(restDuration);
    restEndTimeRef.current = Date.now() + restDuration;
    restFrameRef.current = requestAnimationFrame(() => tickRest());
  };

  const handleSkipRest = useCallback(() => {
    if (!isResting) {
      return;
    }
    finishRest(true);
  }, [finishRest, isResting]);

  useEffect(() => {
    return () => {
      stopRestTimer();
    };
  }, [stopRestTimer]);

  const handleRequestStop = () => {
    if (!timer.isPaused && timer.isRunning) {
      timer.pause();
      setPausedForConfirm(true);
    } else {
      setPausedForConfirm(false);
    }
    setShowStopConfirm(true);
  };

  const handleClaimRewards = async () => {
    if (!summary) return;
    
    // 이미 보상을 수령했는지 확인
    if (hasClaimedReward) {
      Alert.alert("알림", "이미 보상을 수령하셨습니다.");
      return;
    }
    
    try {
      await saveWorkoutRecord(summary, true);
      setHasClaimedReward(true);
      setHasSavedRecord(true);
      Alert.alert("완료", "보상이 지급되었고 운동 기록이 저장되었습니다.");
    } catch (error: any) {
      Alert.alert("오류", error?.message ?? "운동 기록 저장 중 문제가 발생했습니다.");
    }
  };

  const handleConfirmSummary = async () => {
    if (!summary) return;
    
    // 이미 저장했으면 다시 저장하지 않음
    if (hasSavedRecord) {
      return;
    }
    
    try {
      await saveWorkoutRecord(summary, false);
      setHasSavedRecord(true);
      Alert.alert("완료", "운동 기록이 저장되었습니다.");
    } catch (error: any) {
      Alert.alert("오류", error?.message ?? "운동 기록 저장 중 문제가 발생했습니다.");
    }
  };

  const saveWorkoutRecord = async (summaryData: SummaryData, hasReward: boolean) => {
    // 로컬 시간대 기준으로 오늘 날짜 계산 (YYYY-MM-DD)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    
    const headers = await AuthManager.getAuthHeader();
    
    if (!headers.Authorization) {
      throw new Error("인증이 필요합니다. 다시 로그인해주세요.");
    }

    const durationMinutes = Math.max(1, Math.floor(summaryData.elapsedMs / 1000 / 60)); // 최소 1분
    const workoutType = summaryData.mode === "aerobic" ? "유산소" : "인터벌";

    const payload = {
      workoutDate: today,
      workoutType,
      durationMinutes,
      heartRate: summaryData.heartRate,
      hasReward,
      notes: null,
      stats: summaryData.stats, // 스탯 정보 전송
    };
    
    // 유효성 검사
    if (!payload.workoutDate || !payload.workoutType || !payload.durationMinutes) {
      throw new Error("운동 기록 데이터가 유효하지 않습니다.");
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/workout`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = "운동 기록 저장에 실패했습니다.";
        try {
          const errorData = await response.json();
          errorMessage = errorData?.error ?? errorMessage;
        } catch (e) {
          // 응답 파싱 실패 시 기본 메시지 사용
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      // 네트워크 에러 등
      if (error.message && !error.message.includes("운동 기록 저장에 실패")) {
        throw new Error(`네트워크 오류: ${error.message}`);
      }
      throw error;
    }
  };

  const handleReturnToLanding = () => {
    finishRest(false);
    timer.reset();
    setSummary(null);
    setLaps([]);
    setCompletedSets(0);
    setHasClaimedReward(false);
    setHasSavedRecord(false);
    setShowIntervalConfigurator(false);
    setPhase("idle");
  };

  const handleStopCancel = () => {
    setShowStopConfirm(false);
    if (pausedForConfirm) {
      timer.resume();
    }
    setPausedForConfirm(false);
  };

  const handleStopConfirm = () => {
    finishRest(false);
    const finalElapsed = timer.stop();
    const summaryData = buildSummary(mode, finalElapsed, {
      laps,
      restDurationMs: activeRestDurationMs,
      completedSets,
    });
    setSummary(summaryData);
    setPhase("summary");
    setShowStopConfirm(false);
    setPausedForConfirm(false);
    setCompletedSets(0);
  };

  const handleToggleIntervalConfigurator = () => {
    setShowIntervalConfigurator((prev) => !prev);
  };

  const handleCloseIntervalConfigurator = () => {
    setShowIntervalConfigurator(false);
  };

  useEffect(() => {
    if (mode !== "interval") {
      setShowIntervalConfigurator(false);
    }
  }, [mode]);

  useEffect(() => {
    if (phase !== "running") {
      setActiveRestDurationMs(restDurationMs);
    }
  }, [restDurationMs, phase]);

  return (
    <SafeAreaView style={styles.container}>
      <HomeButton />
      {phase === "idle" && (
        <TimerLanding
          mode={mode}
          onModeChange={setMode}
          onStart={handleStart}
          restDurationMs={restDurationMs}
          onAdjustRestDuration={handleAdjustRestDuration}
          showConfigurator={showIntervalConfigurator}
          onToggleConfigurator={handleToggleIntervalConfigurator}
          onCloseConfigurator={handleCloseIntervalConfigurator}
          onResetRestDuration={handleResetRestDuration}
          animalType={animalType}
        />
      )}

      {phase === "running" && (
        <TimerRunning
          mode={mode}
          elapsedMs={timer.elapsedMs}
          isPaused={timer.isPaused}
          laps={laps}
          restDurationMs={activeRestDurationMs}
          isResting={isResting}
          restRemainingMs={restRemainingMs}
          completedSets={completedSets}
          onPauseToggle={handlePauseToggle}
          onRequestStop={handleRequestStop}
          onAddLap={handleAddLap}
          onStartRest={handleStartRest}
          onSkipRest={handleSkipRest}
        />
      )}

      {phase === "summary" && summary && (
        <TimerSummary
          data={summary}
          onClaim={handleClaimRewards}
          onConfirm={handleConfirmSummary}
          onReturn={handleReturnToLanding}
          hasClaimedReward={hasClaimedReward}
        />
      )}

      <StopConfirmModal
        visible={showStopConfirm}
        onConfirm={handleStopConfirm}
        onCancel={handleStopCancel}
      />
    </SafeAreaView>
  );
}

function TimerLanding({
  mode,
  onModeChange,
  onStart,
  restDurationMs,
  onAdjustRestDuration,
  showConfigurator,
  onToggleConfigurator,
  onCloseConfigurator,
  onResetRestDuration,
  animalType,
}: {
  mode: Mode;
  onModeChange: (next: Mode) => void;
  onStart: () => void;
  restDurationMs: number;
  onAdjustRestDuration: (deltaMs: number) => void;
  showConfigurator: boolean;
  onToggleConfigurator: () => void;
  onCloseConfigurator: () => void;
  onResetRestDuration: () => void;
  animalType: string | null;
}) {
  const isInterval = mode === "interval";

  // 동물 타입에 따라 애니메이션 이미지 경로 결정 (임시로 모든 동물에 dog1.png 사용)
  const getAnimationImage = () => {
    // 일단 모든 동물에 dog1.png 하드코딩 (이미지 준비되면 수정 예정)
    return require("../../assets/images/animation/dog/dog1.png");
  };

  return (
    <View style={styles.landingContainer}>
      <View style={styles.clockContainer}>
        <Image
          source={getAnimationImage()}
          style={styles.animationImage}
          accessibilityRole="image"
          accessibilityLabel="애니메이션"
        />
      </View>

      <View style={styles.modeSwitcher}>
        <ModeToggle
          isActive={mode === "aerobic"}
          label="유산소"
          onPress={() => onModeChange("aerobic")}
        />
        <ModeToggle
          isActive={isInterval}
          label="인터벌"
          onPress={() => onModeChange("interval")}
        />
      </View>

      <TouchableOpacity
        style={styles.startWorkoutButton}
        onPress={onStart}
        activeOpacity={0.85}
      >
        <Ionicons name="play" size={24} color="#fff" />
        <Text style={styles.startWorkoutLabel}>운동 시작</Text>
      </TouchableOpacity>

      {isInterval && (
        <View style={styles.intervalToggleSection}>
          <TouchableOpacity
            style={styles.intervalToggleButton}
            onPress={onToggleConfigurator}
            activeOpacity={0.85}
          >
            <Ionicons name="settings-outline" size={18} color="#4a6cf4" />
            <Text style={styles.intervalToggleLabel}>인터벌 설정</Text>
            <Ionicons
              name={showConfigurator ? "chevron-up" : "chevron-down"}
              size={18}
              color="#4a6cf4"
            />
          </TouchableOpacity>

          {showConfigurator && (
            <IntervalConfigurator
              restDurationMs={restDurationMs}
              onAdjust={onAdjustRestDuration}
              onClose={onCloseConfigurator}
              onReset={onResetRestDuration}
            />
          )}
        </View>
      )}
    </View>
  );
}

function IntervalConfigurator({
  restDurationMs,
  onAdjust,
  onClose,
  onReset,
}: {
  restDurationMs: number;
  onAdjust: (deltaMs: number) => void;
  onClose: () => void;
  onReset: () => void;
}) {
  return (
    <View style={styles.intervalConfigurator}>
      <View style={styles.intervalConfiguratorHeader}>
        <Text style={styles.intervalConfiguratorTitle}>인터벌 설정</Text>
        <TouchableOpacity
          onPress={onClose}
          style={styles.intervalConfiguratorClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.intervalConfiguratorCloseText}>닫기</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.intervalConfigRows}>
        <IntervalConfigRow
          label="세트 간 휴식 시간"
          value={restDurationMs}
          onDecrease={() => onAdjust(-REST_STEP_MS)}
          onIncrease={() => onAdjust(REST_STEP_MS)}
          canDecrease={restDurationMs > REST_MIN_MS}
          canIncrease={restDurationMs < REST_MAX_MS}
        />
      </View>

      <View style={styles.intervalConfiguratorFooter}>
        <TouchableOpacity
          style={styles.intervalResetButton}
          onPress={onReset}
          activeOpacity={0.85}
        >
          <Ionicons name="refresh" size={16} color="#4a6cf4" />
          <Text style={styles.intervalResetLabel}>초기화</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function IntervalConfigRow({
  label,
  value,
  onDecrease,
  onIncrease,
  canDecrease,
  canIncrease,
}: {
  label: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  canDecrease: boolean;
  canIncrease: boolean;
}) {
  return (
    <View style={styles.intervalConfigRow}>
      <Text style={styles.intervalConfigLabel}>{label}</Text>
      <View style={styles.intervalConfigControls}>
        <ConfigStepButton
          icon="remove"
          onPress={onDecrease}
          disabled={!canDecrease}
        />
        <Text style={styles.intervalConfigValue}>
          {formatDuration(value)}
        </Text>
        <ConfigStepButton
          icon="add"
          onPress={onIncrease}
          disabled={!canIncrease}
        />
      </View>
    </View>
  );
}

function ConfigStepButton({
  icon,
  onPress,
  disabled,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.intervalStepButton,
        disabled ? styles.intervalStepButtonDisabled : undefined,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <Ionicons
        name={icon}
        size={18}
        color={disabled ? "#b2bec3" : "#4a6cf4"}
      />
    </TouchableOpacity>
  );
}

function TimerRunning({
  mode,
  elapsedMs,
  isPaused,
  laps,
  restDurationMs,
  isResting,
  restRemainingMs,
  completedSets,
  onPauseToggle,
  onRequestStop,
  onAddLap,
  onStartRest,
  onSkipRest,
}: {
  mode: Mode;
  elapsedMs: number;
  isPaused: boolean;
  laps: number[];
  restDurationMs: number;
  isResting: boolean;
  restRemainingMs: number;
  completedSets: number;
  onPauseToggle: () => void;
  onRequestStop: () => void;
  onAddLap: () => void;
  onStartRest: () => void;
  onSkipRest: () => void;
}) {
  // 애니메이션 이미지 가져오기 (임시로 dog1.png만 사용)
  const getAnimationImage = () => {
    return require("../../assets/images/animation/dog/dog1.png");
  };

  const lapEntries = useMemo(() => {
    if (mode !== "aerobic") {
      return [];
    }
    return laps.map((lap, index) => {
      const prev = index === 0 ? 0 : laps[index - 1];
      const segment = lap - prev;
      return {
        index: index + 1,
        total: formatDuration(lap),
        segment: formatDuration(segment),
      };
    });
  }, [laps, mode]);

  const timerStateLabel = isResting
    ? "휴식 중"
    : isPaused
    ? "일시정지"
    : "진행 중";

  const restButtonDisabled = !isResting && restDurationMs <= 0;

  return (
    <View style={styles.runningContainer}>
      {/* 애니메이션 이미지 (시간 위에 표시) */}
      {!isResting && (
        <View style={styles.animationContainer}>
          <Image
            source={getAnimationImage()}
            style={styles.runningAnimationImage}
            accessibilityRole="image"
            accessibilityLabel="애니메이션"
          />
        </View>
      )}
      <View style={styles.timerDisplay}>
        <Text style={styles.timerDigits}>{formatDuration(elapsedMs)}</Text>
        <Text style={styles.timerStateLabel}>{timerStateLabel}</Text>
      </View>

      {mode === "interval" && (
        <>
          <IntervalPanel
            isResting={isResting}
            restRemainingMs={restRemainingMs}
            restDurationMs={restDurationMs}
            completedSets={completedSets}
          />
          <TouchableOpacity
            style={[
              styles.restButton,
              isResting ? styles.restButtonActive : undefined,
              restButtonDisabled ? styles.restButtonDisabled : undefined,
            ]}
            onPress={isResting ? onSkipRest : onStartRest}
            activeOpacity={0.85}
            disabled={restButtonDisabled}
          >
            <Ionicons
            name={isResting ? "play" : "moon"}
              size={18}
              color={isResting ? "#ffffff" : restButtonDisabled ? "#b2bec3" : "#4a6cf4"}
            />
            <Text
              style={[
                styles.restButtonLabel,
                isResting ? styles.restButtonLabelActive : undefined,
                restButtonDisabled ? styles.restButtonLabelDisabled : undefined,
              ]}
            >
              {isResting ? "휴식 종료" : "휴식 시작"}
            </Text>
          </TouchableOpacity>
        </>
      )}

      <View style={styles.controlRow}>
        <ControlButton
          icon={isPaused ? "play" : "pause"}
          label={isPaused ? "재개" : "일시정지"}
          onPress={onPauseToggle}
          variant="primary"
          disabled={isResting}
        />
        <ControlButton
          icon="stop"
          label="종료"
          onPress={onRequestStop}
          variant="danger"
        />
      </View>

      {mode === "aerobic" && (
        <>
          <TouchableOpacity
            style={styles.lapButton}
            onPress={onAddLap}
            activeOpacity={0.85}
          >
            <Text style={styles.lapButtonLabel}>구간 기록</Text>
          </TouchableOpacity>
          <View style={styles.lapListContainer}>
            {lapEntries.length === 0 ? (
              <Text style={styles.lapPlaceholder}>아직 기록된 구간이 없습니다.</Text>
            ) : (
              <ScrollView
                style={styles.lapScroll}
                contentContainerStyle={styles.lapScrollContent}
              >
                {lapEntries.map((entry) => (
                  <View key={entry.index} style={styles.lapItem}>
                    <View style={styles.lapIndexBadge}>
                      <Text style={styles.lapIndexText}>{entry.index}</Text>
                    </View>
                    <View style={styles.lapInfo}>
                      <Text style={styles.lapInfoLabel}>누적</Text>
                      <Text style={styles.lapInfoValue}>{entry.total}</Text>
                    </View>
                    <View style={styles.lapInfo}>
                      <Text style={styles.lapInfoLabel}>구간</Text>
                      <Text style={styles.lapInfoValue}>{entry.segment}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </>
      )}
    </View>
  );
}

function TimerSummary({
  data,
  onClaim,
  onConfirm,
  onReturn,
  hasClaimedReward,
}: {
  data: SummaryData;
  onClaim: () => void;
  onConfirm: () => void;
  onReturn: () => void;
  hasClaimedReward: boolean;
}) {
  return (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>운동 완료</Text>

      <View style={styles.summaryCard}>
        <SummaryRow label="총 운동 시간" value={formatDuration(data.elapsedMs)} />
        {data.mode === "aerobic" && (
          <SummaryRow label="구간 수" value={`${data.laps?.length ?? 0}`} />
        )}
        {data.mode === "interval" && typeof data.restDurationMs === "number" && (
          <SummaryRow
            label="휴식 시간(세트당)"
            value={formatDuration(data.restDurationMs)}
          />
        )}
        {data.mode === "interval" && data.intervalInfo && (
          <SummaryRow
            label="완료 세트"
            value={`${data.intervalInfo.completedRounds}회`}
          />
        )}
        <SummaryRow label="심박수" value={`${data.heartRate} bpm`} />
      </View>

      <View style={styles.summaryStats}>
        {data.stats.map((stat) => (
          <View key={stat.label} style={styles.summaryStatItem}>
            <Text style={styles.summaryStatLabel}>{stat.label}</Text>
            <Text style={styles.summaryStatValue}>{stat.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.summaryActions}>
        <SummaryButton 
          label={hasClaimedReward ? "보상 수령 완료" : "보상 받기"} 
          variant={hasClaimedReward ? "secondary" : "primary"} 
          onPress={onClaim}
          disabled={hasClaimedReward}
        />
        <SummaryButton label="확인" variant="secondary" onPress={onConfirm} />
        <SummaryButton
          label="기본 화면으로"
          variant="ghost"
          onPress={onReturn}
          icon={
            <Image
              source={require("../../assets/images/back_icon.png")}
              style={styles.backIcon}
            />
          }
        />
      </View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryRowLabel}>{label}</Text>
      <Text style={styles.summaryRowValue}>{value}</Text>
    </View>
  );
}

function ModeToggle({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.modeToggleButton,
        isActive ? styles.modeToggleActive : styles.modeToggleInactive,
      ]}
    >
      <Text
        style={[
          styles.modeToggleLabel,
          isActive
            ? styles.modeToggleLabelActive
            : styles.modeToggleLabelInactive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ControlButton({
  icon,
  label,
  variant,
  onPress,
  disabled,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  variant: "primary" | "danger";
  onPress: () => void;
  disabled?: boolean;
}) {
  const backgroundColor = variant === "primary" ? "#2d98da" : "#e94e77";

  return (
    <TouchableOpacity
      style={[
        styles.controlButton,
        { backgroundColor, opacity: disabled ? 0.35 : 1 },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled}
    >
      <Ionicons name={icon} size={24} color="#fff" />
      <Text style={styles.controlButtonLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function IntervalPanel({
  isResting,
  restRemainingMs,
  restDurationMs,
  completedSets,
}: {
  isResting: boolean;
  restRemainingMs: number;
  restDurationMs: number;
  completedSets: number;
}) {
  return (
    <View style={styles.intervalPanel}>
      <View
        style={[
          styles.intervalBadge,
          isResting ? styles.intervalBadgeRest : styles.intervalBadgeWork,
        ]}
      >
        <Text style={styles.intervalBadgeText}>
          {isResting ? "휴식 중" : "운동 중"}
        </Text>
      </View>
      {isResting ? (
        <>
          <Text style={styles.intervalTimer}>
            {formatDuration(restRemainingMs)}
          </Text>
          <Text style={styles.intervalSubLabel}>
            휴식이 끝나면 자동으로 운동이 재개됩니다.
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.intervalConfigSummary}>
            휴식 {formatDuration(restDurationMs)}
          </Text>
          <Text style={styles.intervalSubLabel}>
            세트 종료 후 휴식 버튼을 눌러 주세요.
          </Text>
        </>
      )}
      <Text style={styles.intervalRounds}>완료 세트 : {completedSets}회</Text>
    </View>
  );
}

function SummaryButton({
  label,
  variant,
  onPress,
  icon,
  disabled = false,
}: {
  label: string;
  variant: "primary" | "secondary" | "ghost";
  onPress: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  const { backgroundColor, textColor, borderColor } = useMemo(() => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: "#ff8a3d",
          textColor: "#fff",
          borderColor: "transparent",
        };
      case "secondary":
        return {
          backgroundColor: "#2d3436",
          textColor: "#fff",
          borderColor: "transparent",
        };
      default:
        return {
          backgroundColor: "#ffffff",
          textColor: "#2d3436",
          borderColor: "#dfe6e9",
        };
    }
  }, [variant]);

  return (
    <TouchableOpacity
      style={[
        styles.summaryButton,
        {
          backgroundColor: disabled ? "#e0e0e0" : backgroundColor,
          borderColor,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.85}
      disabled={disabled}
    >
      {icon}
      <Text style={[styles.summaryButtonLabel, { color: textColor, fontFamily: 'KotraHope' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function StopConfirmModal({
  visible,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>운동이 끝나셨습니까?</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={onCancel}
              activeOpacity={0.85}
            >
              <Text style={[styles.modalButtonText, styles.modalCancelText]}>아니오</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalConfirmButton]}
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <Text style={[styles.modalButtonText, styles.modalConfirmText]}>예</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function buildSummary(
  mode: Mode,
  elapsedMs: number,
  options?: {
    laps?: number[];
    restDurationMs?: number;
    completedSets?: number;
  }
): SummaryData {
  const minutes = elapsedMs / 60_000;
  const baseHeartRate = mode === "aerobic" ? 118 : 125;
  const heartRate = Math.min(185, Math.round(baseHeartRate + minutes * 4));
  const laps = options?.laps ?? [];

  const stats: SummaryStat[] =
    mode === "aerobic"
      ? [
          { label: "지구력", value: Math.max(1, Math.round(minutes / 6) + 2) },
          { label: "민첩", value: Math.max(1, Math.round(minutes / 8) + 1) },
        ]
      : [
          { label: "근력", value: Math.max(1, Math.round(minutes / 5) + 3) },
          { label: "집중력", value: Math.max(1, Math.round(minutes / 7) + 2) },
        ];

  if (mode === "interval") {
    const completedRounds = options?.completedSets ?? 0;
    const restDuration = options?.restDurationMs ?? DEFAULT_REST_DURATION_MS;
    return {
      mode,
      elapsedMs,
      heartRate,
      stats,
      intervalInfo: {
        completedRounds,
      },
      restDurationMs: restDuration,
    };
  }

  return {
    mode,
    elapsedMs,
    heartRate,
    stats,
    laps,
  };
}