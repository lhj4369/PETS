//타이머 화면
import React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HomeButton from "../../components/HomeButton";

type Mode = "aerobic" | "interval";
type Phase = "idle" | "running" | "summary";

type SummaryStat = {
  label: string;
  value: number;
};

type IntervalConfig = {
  workMs: number;
  restMs: number;
};

type SummaryData = {
  mode: Mode;
  elapsedMs: number;
  heartRate: number;
  stats: SummaryStat[];
  intervalConfig?: IntervalConfig;
  laps?: number[];
  intervalInfo?: {
    completedRounds: number;
    totalRounds: number;
  };
};

const INTERVAL_TOTAL_ROUNDS = 5;
const INTERVAL_STEP_MS = 5_000;
const INTERVAL_MIN_MS = 0;
const INTERVAL_WORK_MAX_MS = 90_000; // 1분 30초
const INTERVAL_REST_MAX_MS = 45_000; // 45초
const DEFAULT_INTERVAL_CONFIG: IntervalConfig = {
  workMs: 30_000,
  restMs: 15_000,
};

export default function TimerScreen() {
  const [mode, setMode] = useState<Mode>("aerobic");
  const [phase, setPhase] = useState<Phase>("idle");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [laps, setLaps] = useState<number[]>([]);
  const [intervalConfig, setIntervalConfig] = useState<IntervalConfig>(
    DEFAULT_INTERVAL_CONFIG
  );
  const [activeIntervalConfig, setActiveIntervalConfig] =
    useState<IntervalConfig>(DEFAULT_INTERVAL_CONFIG);
  const [showIntervalConfigurator, setShowIntervalConfigurator] =
    useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [pausedForConfirm, setPausedForConfirm] = useState(false);
  const timer = useWorkoutTimer();

  const handleStart = () => {
    timer.reset();
    timer.start();
    setSummary(null);
    setLaps([]);
    if (mode === "interval") {
      setActiveIntervalConfig({ ...intervalConfig });
    } else {
      setActiveIntervalConfig({ ...DEFAULT_INTERVAL_CONFIG });
    }
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

  const handleAdjustInterval = (
    key: keyof IntervalConfig,
    deltaMs: number
  ) => {
    setIntervalConfig((prev) => {
      const max =
        key === "workMs" ? INTERVAL_WORK_MAX_MS : INTERVAL_REST_MAX_MS;
      const nextValue = Math.min(
        max,
        Math.max(INTERVAL_MIN_MS, prev[key] + deltaMs)
      );
      const snapped =
        Math.round(nextValue / INTERVAL_STEP_MS) * INTERVAL_STEP_MS;
      return {
        ...prev,
        [key]: snapped,
      };
    });
  };

  const handleResetIntervalConfig = () => {
    setIntervalConfig({
      workMs: 45_000,
      restMs: 15_000,
    });
  };

  const handleRequestStop = () => {
    if (!timer.isPaused && timer.isRunning) {
      timer.pause();
      setPausedForConfirm(true);
    } else {
      setPausedForConfirm(false);
    }
    setShowStopConfirm(true);
  };

  const handleClaimRewards = () => {
    Alert.alert("보상 수령", "보상이 지급되었다고 가정하고 UI만 구성해두었습니다.");
  };

  const handleConfirmSummary = () => {
    setSummary((prev) => prev);
  };

  const handleReturnToLanding = () => {
    timer.reset();
    setSummary(null);
    setLaps([]);
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
    const finalElapsed = timer.stop();
    const summaryData = buildSummary(mode, finalElapsed, {
      laps,
      intervalConfig: activeIntervalConfig,
    });
    setSummary(summaryData);
    setPhase("summary");
    setShowStopConfirm(false);
    setPausedForConfirm(false);
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

  return (
    <SafeAreaView style={styles.container}>
      <HomeButton />
      {phase === "idle" && (
        <TimerLanding
          mode={mode}
          onModeChange={setMode}
          onStart={handleStart}
          intervalConfig={intervalConfig}
          onAdjustInterval={handleAdjustInterval}
          showConfigurator={showIntervalConfigurator}
          onToggleConfigurator={handleToggleIntervalConfigurator}
          onCloseConfigurator={handleCloseIntervalConfigurator}
          onResetConfigurator={handleResetIntervalConfig}
        />
      )}

      {phase === "running" && (
        <TimerRunning
          mode={mode}
          elapsedMs={timer.elapsedMs}
          isPaused={timer.isPaused}
          laps={laps}
          intervalConfig={activeIntervalConfig}
          onPauseToggle={handlePauseToggle}
          onRequestStop={handleRequestStop}
          onAddLap={handleAddLap}
        />
      )}

      {phase === "summary" && summary && (
        <TimerSummary
          data={summary}
          onClaim={handleClaimRewards}
          onConfirm={handleConfirmSummary}
          onReturn={handleReturnToLanding}
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
  intervalConfig,
  onAdjustInterval,
  showConfigurator,
  onToggleConfigurator,
  onCloseConfigurator,
  onResetConfigurator,
}: {
  mode: Mode;
  onModeChange: (next: Mode) => void;
  onStart: () => void;
  intervalConfig: IntervalConfig;
  onAdjustInterval: (key: keyof IntervalConfig, deltaMs: number) => void;
  showConfigurator: boolean;
  onToggleConfigurator: () => void;
  onCloseConfigurator: () => void;
  onResetConfigurator: () => void;
}) {
  const isInterval = mode === "interval";

  return (
    <View style={styles.landingContainer}>
      <Image
        source={require("../../assets/images/clock_icon.png")}
        style={styles.clockImage}
        accessibilityRole="image"
        accessibilityLabel="운동 타이머 시계"
      />

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
              config={intervalConfig}
              onAdjust={onAdjustInterval}
              onClose={onCloseConfigurator}
              onReset={onResetConfigurator}
            />
          )}
        </View>
      )}
    </View>
  );
}

function IntervalConfigurator({
  config,
  onAdjust,
  onClose,
  onReset,
}: {
  config: IntervalConfig;
  onAdjust: (key: keyof IntervalConfig, deltaMs: number) => void;
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
          label="운동 시간"
          value={config.workMs}
          onDecrease={() => onAdjust("workMs", -INTERVAL_STEP_MS)}
          onIncrease={() => onAdjust("workMs", INTERVAL_STEP_MS)}
          canDecrease={config.workMs > INTERVAL_MIN_MS}
          canIncrease={config.workMs < INTERVAL_WORK_MAX_MS}
        />
        <IntervalConfigRow
          label="휴식 시간"
          value={config.restMs}
          onDecrease={() => onAdjust("restMs", -INTERVAL_STEP_MS)}
          onIncrease={() => onAdjust("restMs", INTERVAL_STEP_MS)}
          canDecrease={config.restMs > INTERVAL_MIN_MS}
          canIncrease={config.restMs < INTERVAL_REST_MAX_MS}
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
  intervalConfig,
  onPauseToggle,
  onRequestStop,
  onAddLap,
}: {
  mode: Mode;
  elapsedMs: number;
  isPaused: boolean;
  laps: number[];
  intervalConfig: IntervalConfig;
  onPauseToggle: () => void;
  onRequestStop: () => void;
  onAddLap: () => void;
}) {
  const intervalInfo = useMemo(
    () =>
      mode === "interval"
        ? getIntervalProgress(elapsedMs, intervalConfig)
        : null,
    [mode, elapsedMs, intervalConfig]
  );

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

  return (
    <View style={styles.runningContainer}>
      <View style={styles.timerDisplay}>
        <Text style={styles.timerDigits}>{formatDuration(elapsedMs)}</Text>
        <Text style={styles.timerStateLabel}>
          {isPaused ? "일시정지" : "진행 중"}
        </Text>
      </View>

      {mode === "interval" && intervalInfo && (
        <IntervalPanel info={intervalInfo} config={intervalConfig} />
      )}

      <View style={styles.controlRow}>
        <ControlButton
          icon={isPaused ? "play" : "pause"}
          label={isPaused ? "재개" : "일시정지"}
          onPress={onPauseToggle}
          variant="primary"
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
}: {
  data: SummaryData;
  onClaim: () => void;
  onConfirm: () => void;
  onReturn: () => void;
}) {
  return (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>운동 완료</Text>

      <View style={styles.summaryCard}>
        <SummaryRow label="총 운동 시간" value={formatDuration(data.elapsedMs)} />
        {data.mode === "aerobic" && (
          <SummaryRow label="구간 수" value={`${data.laps?.length ?? 0}`} />
        )}
        {data.mode === "interval" && data.intervalConfig && (
          <SummaryRow
            label="운동/휴식 시간"
            value={`${formatDuration(data.intervalConfig.workMs)} / ${formatDuration(
              data.intervalConfig.restMs
            )}`}
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
        <SummaryButton label="보상 받기" variant="primary" onPress={onClaim} />
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

function getIntervalProgress(elapsedMs: number, config: IntervalConfig) {
  const cycleDuration = config.workMs + config.restMs;

  if (cycleDuration <= 0) {
    return {
      currentRound: 1,
      totalRounds: INTERVAL_TOTAL_ROUNDS,
      phase: "운동",
      remainingMs: 0,
      nextPhaseLabel: "휴식",
      nextPhaseDuration: config.restMs,
      completedRounds: 0,
    };
  }

  const completedRounds = Math.min(
    INTERVAL_TOTAL_ROUNDS,
    Math.floor(elapsedMs / cycleDuration)
  );

  const currentRound = Math.min(
    INTERVAL_TOTAL_ROUNDS,
    completedRounds + 1
  );

  const positionInCycle = elapsedMs % cycleDuration;
  const isWorkPhase = positionInCycle < config.workMs;

  const phaseElapsed = isWorkPhase
    ? positionInCycle
    : positionInCycle - config.workMs;

  const phaseDuration = isWorkPhase ? config.workMs : config.restMs;
  const remainingMs = Math.max(phaseDuration - phaseElapsed, 0);

  const nextPhaseLabel = isWorkPhase ? "휴식" : "운동";
  const nextPhaseDuration = isWorkPhase ? config.restMs : config.workMs;

  return {
    currentRound,
    totalRounds: INTERVAL_TOTAL_ROUNDS,
    phase: isWorkPhase ? "운동" : "휴식",
    remainingMs,
    nextPhaseLabel,
    nextPhaseDuration,
    completedRounds,
  };
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
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  variant: "primary" | "danger";
  onPress: () => void;
}) {
  const backgroundColor = variant === "primary" ? "#2d98da" : "#e94e77";

  return (
    <TouchableOpacity
      style={[styles.controlButton, { backgroundColor }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Ionicons name={icon} size={24} color="#fff" />
      <Text style={styles.controlButtonLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function IntervalPanel({
  info,
  config,
}: {
  info: ReturnType<typeof getIntervalProgress>;
  config: IntervalConfig;
}) {
  return (
    <View style={styles.intervalPanel}>
      <View style={styles.intervalBadge}>
        <Text style={styles.intervalBadgeText}>{info.phase}</Text>
      </View>
      <Text style={styles.intervalTimer}>{formatDuration(info.remainingMs)}</Text>
      <Text style={styles.intervalRounds}>
        현재 세트 수 : {info.currentRound}회
      </Text>
      <Text style={styles.intervalConfigSummary}>
        운동 {formatDuration(config.workMs)} · 휴식{" "}
        {formatDuration(config.restMs)}
      </Text>
      <View style={styles.intervalNextPhase}>
        <Text style={styles.intervalNextPhaseLabel}>다음:</Text>
        <Text style={styles.intervalNextPhaseValue}>
          {info.nextPhaseLabel} · {formatDuration(info.nextPhaseDuration)}
        </Text>
      </View>
    </View>
  );
}

function SummaryButton({
  label,
  variant,
  onPress,
  icon,
}: {
  label: string;
  variant: "primary" | "secondary" | "ghost";
  onPress: () => void;
  icon?: React.ReactNode;
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
          backgroundColor,
          borderColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {icon}
      <Text style={[styles.summaryButtonLabel, { color: textColor }]}>
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

function useWorkoutTimer() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  const step = useCallback(() => {
    if (startTimeRef.current === null) {
      return;
    }
    const now = Date.now();
    const delta = now - startTimeRef.current;
    const total = accumulatedRef.current + delta;
    setElapsedMs(total);
    frameRef.current = requestAnimationFrame(step);
  }, []);

  const clearFrame = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (isRunning && !isPaused) {
      return;
    }
    startTimeRef.current = Date.now();
    setIsRunning(true);
    setIsPaused(false);
    clearFrame();
    frameRef.current = requestAnimationFrame(step);
  }, [clearFrame, isPaused, isRunning, step]);

  const pause = useCallback(() => {
    if (!isRunning || isPaused) {
      return;
    }
    if (startTimeRef.current !== null) {
      const now = Date.now();
      accumulatedRef.current += now - startTimeRef.current;
      startTimeRef.current = null;
    }
    clearFrame();
    setIsPaused(true);
    setElapsedMs(accumulatedRef.current);
  }, [clearFrame, isPaused, isRunning]);

  const resume = useCallback(() => {
    if (!isRunning || !isPaused) {
      return;
    }
    startTimeRef.current = Date.now();
    setIsPaused(false);
    clearFrame();
    frameRef.current = requestAnimationFrame(step);
  }, [clearFrame, isPaused, isRunning, step]);

  const stop = useCallback(() => {
    let finalElapsed = accumulatedRef.current;
    if (startTimeRef.current !== null) {
      const now = Date.now();
      finalElapsed += now - startTimeRef.current;
      startTimeRef.current = null;
    }
    clearFrame();
    accumulatedRef.current = finalElapsed;
    setElapsedMs(finalElapsed);
    setIsRunning(false);
    setIsPaused(false);
    return finalElapsed;
  }, [clearFrame]);

  const reset = useCallback(() => {
    clearFrame();
    startTimeRef.current = null;
    accumulatedRef.current = 0;
    setElapsedMs(0);
    setIsRunning(false);
    setIsPaused(false);
  }, [clearFrame]);

  useEffect(() => {
    return () => {
      clearFrame();
    };
  }, [clearFrame]);

  return {
    elapsedMs,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    stop,
    reset,
  };
}

function buildSummary(
  mode: Mode,
  elapsedMs: number,
  options?: {
    laps?: number[];
    intervalConfig?: IntervalConfig;
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
    const intervalConfig = options?.intervalConfig ?? DEFAULT_INTERVAL_CONFIG;
    const cycleDuration = intervalConfig.workMs + intervalConfig.restMs;
    const completedRounds =
      cycleDuration > 0
        ? Math.min(
            INTERVAL_TOTAL_ROUNDS,
            Math.floor(elapsedMs / cycleDuration)
          )
        : 0;
    return {
      mode,
      elapsedMs,
      heartRate,
      stats,
      intervalInfo: {
        completedRounds,
        totalRounds: INTERVAL_TOTAL_ROUNDS,
      },
      intervalConfig,
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

function formatDuration(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafc",
    paddingHorizontal: 24,
  },
  landingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
  },
  intervalToggleSection: {
    width: "100%",
    gap: 16,
    alignItems: "stretch",
  },
  intervalToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#eef3ff",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#dfe4f5",
  },
  intervalToggleLabel: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 15,
    fontWeight: "600",
    color: "#4a6cf4",
  },
  intervalConfigurator: {
    width: "100%",
    alignSelf: "stretch",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#dfe4f5",
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
  },
  intervalConfiguratorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  intervalConfiguratorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2d3436",
  },
  intervalConfiguratorClose: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  intervalConfiguratorCloseText: {
    fontSize: 13,
    color: "#95a5a6",
  },
  intervalConfigRows: {
    gap: 12,
  },
  intervalConfigRow: {
    gap: 10,
  },
  intervalConfigLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4a6cf4",
  },
  intervalConfigControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e9ff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  intervalStepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#4a6cf4",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f4ff",
  },
  intervalStepButtonDisabled: {
    borderColor: "#dfe6e9",
    backgroundColor: "#f5f5f5",
  },
  intervalConfigValue: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
  },
  intervalConfiguratorFooter: {
    gap: 10,
  },
  intervalResetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4a6cf4",
    backgroundColor: "#f0f4ff",
  },
  intervalResetLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4a6cf4",
  },
  intervalConfiguratorHint: {
    fontSize: 12,
    color: "#95a5a6",
  },
  clockImage: {
    width: 240,
    height: 240,
    resizeMode: "contain",
  },
  modeSwitcher: {
    flexDirection: "row",
    gap: 12,
  },
  modeToggleButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderWidth: 1,
  },
  modeToggleActive: {
    backgroundColor: "#4a6cf4",
    borderColor: "#4a6cf4",
  },
  modeToggleInactive: {
    backgroundColor: "#ffffff",
    borderColor: "#dfe4f5",
  },
  modeToggleLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  modeToggleLabelActive: {
    color: "#ffffff",
  },
  modeToggleLabelInactive: {
    color: "#4a6cf4",
  },
  startWorkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#2d98da",
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 16,
    shadowColor: "#2d98da",
    shadowOpacity: 0.24,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 18,
  },
  startWorkoutLabel: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  runningContainer: {
    flex: 1,
    justifyContent: "center",
    gap: 32,
  },
  timerDisplay: {
    alignItems: "center",
    gap: 8,
  },
  timerDigits: {
    fontSize: 56,
    fontWeight: "700",
    color: "#2d3436",
    fontVariant: ["tabular-nums"],
  },
  timerStateLabel: {
    fontSize: 16,
    color: "#636e72",
  },
  controlRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
  },
  controlButtonLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  lapButton: {
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: "#4a6cf4",
    shadowColor: "#4a6cf4",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
  },
  lapButtonLabel: {
    color: "#4a6cf4",
    fontSize: 16,
    fontWeight: "600",
  },
  lapListContainer: {
    marginHorizontal: 8,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#e2e9ff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxHeight: 220,
  },
  lapPlaceholder: {
    textAlign: "center",
    color: "#95a5a6",
    paddingVertical: 12,
  },
  lapScroll: {
    maxHeight: 196,
  },
  lapScrollContent: {
    gap: 10,
  },
  lapItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4f7ff",
    borderRadius: 14,
    padding: 12,
    gap: 16,
  },
  lapIndexBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4a6cf4",
    alignItems: "center",
    justifyContent: "center",
  },
  lapIndexText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  lapInfo: {
    flex: 1,
  },
  lapInfoLabel: {
    fontSize: 12,
    color: "#636e72",
    marginBottom: 2,
  },
  lapInfoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
  },
  intervalPanel: {
    marginHorizontal: 8,
    padding: 24,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dfe4f5",
    gap: 12,
  },
  intervalBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#ff8a3d",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  intervalBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  intervalTimer: {
    fontSize: 42,
    fontWeight: "700",
    color: "#2d3436",
  },
  intervalRounds: {
    fontSize: 16,
    color: "#636e72",
  },
  intervalConfigSummary: {
    fontSize: 13,
    color: "#4a6cf4",
    fontWeight: "600",
  },
  intervalNextPhase: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  intervalNextPhaseLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3436",
  },
  intervalNextPhaseValue: {
    fontSize: 14,
    color: "#4a6cf4",
    fontWeight: "600",
  },
  summaryContainer: {
    flex: 1,
    justifyContent: "center",
    gap: 24,
  },
  summaryTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#2d3436",
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#dfe4f5",
    gap: 18,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryRowLabel: {
    fontSize: 15,
    color: "#8395a7",
  },
  summaryRowValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3436",
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 16,
  },
  summaryStatItem: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e9ff",
    alignItems: "center",
    gap: 6,
  },
  summaryStatLabel: {
    fontSize: 14,
    color: "#4a6cf4",
    fontWeight: "600",
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2d3436",
  },
  summaryActions: {
    gap: 12,
  },
  summaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  summaryButtonLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  backIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
    tintColor: "#2d3436",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    width: "80%",
    maxWidth: 320,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
    gap: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2d3436",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 120,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  modalCancelButton: {
    backgroundColor: "#ffffff",
    borderColor: "#dfe6e9",
  },
  modalConfirmButton: {
    backgroundColor: "#ff8a3d",
    borderColor: "#ff8a3d",
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalCancelText: {
    color: "#2d3436",
  },
  modalConfirmText: {
    color: "#ffffff",
  },
});