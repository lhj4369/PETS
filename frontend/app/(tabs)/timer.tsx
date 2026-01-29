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
import { Asset } from "expo-asset";
import HomeButton from "../../components/HomeButton";
import styles from "../../features/timer/styles";
import {
  DEFAULT_REST_DURATION_MS,
  REST_MAX_MS,
  REST_MIN_MS,
  REST_STEP_MS,
  DEFAULT_WORKOUT_DURATION_MS,
  WORKOUT_MAX_MS,
  WORKOUT_MIN_MS,
  WORKOUT_STEP_MS,
} from "../../features/timer/constants";
import { formatDuration } from "../../features/timer/utils/formatDuration";
import { useWorkoutTimer } from "../../features/timer/hooks/useWorkoutTimer";
import AuthManager from "../../utils/AuthManager";
import API_BASE_URL from "../../config/api";
import GoogleFitManager from "../../utils/GoogleFitManager";
import HeartRateCamera from "../../components/HeartRateCamera";
import { useCustomization } from "../../context/CustomizationContext";
import { useFocusEffect } from "@react-navigation/native";
import { getClockImageFromType } from "../../utils/customizationUtils";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Mode = "aerobic" | "weight" | "interval";
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
  distance?: number; // 이동 거리 (미터)
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
  
  // 새로운 인터벌 타이머를 위한 상태
  const [workoutDurationMs, setWorkoutDurationMs] = useState(DEFAULT_WORKOUT_DURATION_MS);
  const [workoutRemainingMs, setWorkoutRemainingMs] = useState(0);
  const [isWorking, setIsWorking] = useState(false);
  const workoutEndTimeRef = useRef<number | null>(null);
  const workoutFrameRef = useRef<number | null>(null);
  const startWorkoutRef = useRef<(() => void) | null>(null);
  const startRestForIntervalRef = useRef<(() => void) | null>(null);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [pausedForConfirm, setPausedForConfirm] = useState(false);
  const [hasClaimedReward, setHasClaimedReward] = useState(false);
  const [hasSavedRecord, setHasSavedRecord] = useState(false);
  const [showHeartRateCamera, setShowHeartRateCamera] = useState(false);
  const [pendingSummaryData, setPendingSummaryData] = useState<SummaryData | null>(null);
  const workoutStartTimeRef = useRef<number | null>(null);
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
    stopWorkoutTimer();
    timer.reset();
    timer.start();
    workoutStartTimeRef.current = Date.now(); // 운동 시작 시간 저장
    setSummary(null);
    setLaps([]);
    setCompletedSets(0);
    setHasClaimedReward(false);
    setHasSavedRecord(false);
    setShowIntervalConfigurator(false);
    
    if (mode === "interval") {
      // 새로운 인터벌 타이머: 운동부터 시작
      setActiveRestDurationMs(restDurationMs);
      startWorkout();
    } else {
      // 유산소 또는 웨이트 타이머
      timer.start();
      const initialRest =
        mode === "weight" ? restDurationMs : DEFAULT_REST_DURATION_MS;
      setActiveRestDurationMs(initialRest);
    }
    setPhase("running");
  };

  const handlePauseToggle = () => {
    if (mode === "interval") {
      // 새로운 인터벌 타이머는 일시정지/재개 기능 없음 (자동으로 진행)
      return;
    }
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

  // 새로운 인터벌 타이머: 운동 시간 타이머 관리
  const stopWorkoutTimer = useCallback(() => {
    if (workoutFrameRef.current !== null) {
      cancelAnimationFrame(workoutFrameRef.current);
      workoutFrameRef.current = null;
    }
    workoutEndTimeRef.current = null;
  }, []);

  // 새로운 인터벌 타이머: 운동 시작
  const startWorkout = useCallback(() => {
    stopWorkoutTimer();
    setIsWorking(true);
    setWorkoutRemainingMs(workoutDurationMs);
    workoutEndTimeRef.current = Date.now() + workoutDurationMs;
    
    const tick = () => {
      if (workoutEndTimeRef.current === null) {
        return;
      }
      const remaining = Math.max(workoutEndTimeRef.current - Date.now(), 0);
      setWorkoutRemainingMs(remaining);
      if (remaining <= 0) {
        // 운동 시간 종료
        stopWorkoutTimer();
        setIsWorking(false);
        setWorkoutRemainingMs(0);
        setCompletedSets((prev) => prev + 1);
        
        // 자동으로 휴식 시작
        if (restDurationMs > 0 && startRestForIntervalRef.current) {
          startRestForIntervalRef.current();
        } else if (restDurationMs === 0 && startWorkoutRef.current) {
          // 휴식 시간이 0이면 바로 다음 운동 시작
          startWorkoutRef.current();
        }
      } else {
        workoutFrameRef.current = requestAnimationFrame(tick);
      }
    };
    workoutFrameRef.current = requestAnimationFrame(tick);
  }, [workoutDurationMs, stopWorkoutTimer, restDurationMs]);

  // 새로운 인터벌 타이머: 휴식 시작
  const startRestForInterval = useCallback(() => {
    stopRestTimer();
    setIsResting(true);
    setRestRemainingMs(restDurationMs);
    restEndTimeRef.current = Date.now() + restDurationMs;
    const tick = () => {
      if (restEndTimeRef.current === null) {
        return;
      }
      const remaining = Math.max(restEndTimeRef.current - Date.now(), 0);
      setRestRemainingMs(remaining);
      if (remaining <= 0) {
        // 휴식 시간 종료 - 자동으로 운동 시작
        stopRestTimer();
        setIsResting(false);
        setRestRemainingMs(0);
        if (startWorkoutRef.current) {
          startWorkoutRef.current();
        }
      } else {
        restFrameRef.current = requestAnimationFrame(tick);
      }
    };
    restFrameRef.current = requestAnimationFrame(tick);
  }, [restDurationMs, stopRestTimer]);

  // ref 업데이트
  useEffect(() => {
    startWorkoutRef.current = startWorkout;
    startRestForIntervalRef.current = startRestForInterval;
  }, [startWorkout, startRestForInterval]);

  // 새로운 인터벌 타이머: 운동 중일 때만 메인 타이머 시작/재개
  useEffect(() => {
    if (mode !== "interval") return;
    
    if (isWorking) {
      // 운동 중: 메인 타이머 시작 또는 재개
      if (!timer.isRunning) {
        timer.start();
      } else if (timer.isPaused) {
        timer.resume();
      }
    } else if (isResting) {
      // 휴식 중: 메인 타이머 일시정지
      if (timer.isRunning && !timer.isPaused) {
        timer.pause();
      }
    }
  }, [mode, isWorking, isResting, timer]);

  const finishRest = useCallback(
    (shouldResume: boolean) => {
      stopRestTimer();
      setIsResting(false);
      setRestRemainingMs(0);
      // wasRunningBeforeRestRef는 useEffect에서 사용하므로 여기서는 false로 설정하지 않음
      if (!shouldResume) {
        wasRunningBeforeRestRef.current = false;
      }
    },
    [stopRestTimer]
  );

  const tickRest = useCallback(() => {
    if (restEndTimeRef.current === null) {
      return;
    }
    const remaining = Math.max(restEndTimeRef.current - Date.now(), 0);
    setRestRemainingMs(remaining);
    if (remaining <= 0) {
      if (mode === "interval") {
        // 새로운 인터벌 타이머는 startRestForInterval에서 처리하므로 여기서는 처리하지 않음
        finishRest(false);
      } else {
        // 웨이트 타이머: 휴식이 끝나면 재개
        finishRest(true);
      }
    } else {
      restFrameRef.current = requestAnimationFrame(() => tickRest());
    }
  }, [finishRest, mode]);

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
      stopWorkoutTimer();
    };
  }, [stopRestTimer, stopWorkoutTimer]);

  // 휴식이 끝나면 자동으로 타이머 재개
  useEffect(() => {
    if (!isResting && wasRunningBeforeRestRef.current) {
      // 휴식이 끝났고, 휴식 전에 타이머가 실행 중이었다면 자동으로 재개
      const shouldResume = wasRunningBeforeRestRef.current;
      wasRunningBeforeRestRef.current = false;
      
      if (shouldResume) {
        // 약간의 지연을 두고 재개 (상태 업데이트가 완료된 후)
        const timeoutId = setTimeout(() => {
          if (timer.isRunning && timer.isPaused) {
            timer.resume();
          } else if (!timer.isRunning) {
            // 타이머가 멈춰있으면 다시 시작
            timer.start();
          }
        }, 50);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [isResting, timer]);

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
    const workoutType = 
      summaryData.mode === "aerobic" ? "유산소" 
      : summaryData.mode === "weight" ? "웨이트"
      : "인터벌";

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
    workoutStartTimeRef.current = null;
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

  const handleStopConfirm = async () => {
    finishRest(false);
    stopWorkoutTimer();
    const finalElapsed = timer.stop();
    const endTime = Date.now();
    const startTime = workoutStartTimeRef.current || endTime - finalElapsed;
    
    // Google Fit에서 이동 거리 가져오기
    let distance = 0;
    try {
      const isAuthenticated = await GoogleFitManager.isAuthenticated();
      if (isAuthenticated) {
        distance = await GoogleFitManager.getDistance(startTime, endTime);
      }
    } catch (error) {
      console.error("Google Fit 데이터 가져오기 실패:", error);
      // 에러가 발생해도 운동 종료는 진행
    }
    
    // 임시 summary 데이터 생성 (심박수는 카메라 측정 후 업데이트)
    const tempSummaryData = buildSummary(mode, finalElapsed, {
      laps,
      restDurationMs: activeRestDurationMs,
      completedSets,
      distance,
      heartRate: null, // 카메라 측정 후 업데이트
    });
    
    // 카메라 측정 모달 표시
    setPendingSummaryData(tempSummaryData);
    setShowStopConfirm(false);
    setPausedForConfirm(false);
    setShowHeartRateCamera(true);
  };

  const handleHeartRateMeasurementComplete = (averageHeartRate: number) => {
    setShowHeartRateCamera(false);
    
    // summary 데이터 업데이트 및 표시 (바로 이동)
    if (pendingSummaryData) {
      const updatedSummary = {
        ...pendingSummaryData,
        heartRate: averageHeartRate,
      };
      setSummary(updatedSummary);
      setPhase("summary");
      setCompletedSets(0);
      workoutStartTimeRef.current = null;
      setPendingSummaryData(null);
      
      // 심박수에 따른 팝업 표시 (summary 화면으로 이동한 후)
      setTimeout(() => {
        if (averageHeartRate >= 120) {
          Alert.alert("좋아요!", `평균 심박수: ${averageHeartRate} bpm\n운동 강도가 적절합니다!`);
        } else {
          Alert.alert("안 좋아요!", `평균 심박수: ${averageHeartRate} bpm\n운동 강도를 높여보세요!`);
        }
      }, 100);
    }
  };

  const handleHeartRateMeasurementCancel = () => {
    setShowHeartRateCamera(false);
    
    // 측정 취소 시에도 summary 표시 (시뮬레이션된 심박수 사용)
    if (pendingSummaryData) {
      setSummary(pendingSummaryData);
      setPhase("summary");
      setCompletedSets(0);
      workoutStartTimeRef.current = null;
      setPendingSummaryData(null);
    }
  };

  const handleToggleIntervalConfigurator = () => {
    setShowIntervalConfigurator((prev) => !prev);
  };

  const handleCloseIntervalConfigurator = () => {
    setShowIntervalConfigurator(false);
  };

  useEffect(() => {
    if (mode !== "weight" && mode !== "interval") {
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
          workoutDurationMs={workoutDurationMs}
          onAdjustWorkoutDuration={(delta) => {
            setWorkoutDurationMs((prev) => {
              const nextValue = Math.min(
                WORKOUT_MAX_MS,
                Math.max(WORKOUT_MIN_MS, prev + delta)
              );
              return Math.round(nextValue / WORKOUT_STEP_MS) * WORKOUT_STEP_MS;
            });
          }}
          onResetWorkoutDuration={() => setWorkoutDurationMs(DEFAULT_WORKOUT_DURATION_MS)}
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
          isWorking={isWorking}
          workoutRemainingMs={workoutRemainingMs}
          animalType={animalType}
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

      <HeartRateCamera
        visible={showHeartRateCamera}
        onComplete={handleHeartRateMeasurementComplete}
        onCancel={handleHeartRateMeasurementCancel}
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
  workoutDurationMs,
  onAdjustWorkoutDuration,
  onResetWorkoutDuration,
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
  workoutDurationMs: number;
  onAdjustWorkoutDuration: (deltaMs: number) => void;
  onResetWorkoutDuration: () => void;
}) {
  const isWeight = mode === "weight";
  const isInterval = mode === "interval";

  const { selectedClock } = useCustomization();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.landingContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
      {/* ===== 레이아웃 변경: 메인 콘텐츠와 설정 영역 분리 =====
          이전 구조 (되돌리려면 아래 주석 해제):
      <View style={styles.landingContainer}>
        <View style={styles.clockContainer}>...</View>
        <View style={styles.modeSwitcher}>...</View>
        <TouchableOpacity style={styles.startWorkoutButton}>...</TouchableOpacity>
        {(isWeight || isInterval) && <View style={styles.intervalToggleSection}>...</View>}
      </View>
      ===== 변경 사항: 설정 영역을 고정 영역으로 분리하여 레이아웃 안정성 확보 ===== */}
      
      {/* 메인 콘텐츠 영역 */}
      <View style={styles.landingMainContent}>
        <View style={styles.modeSwitcher}>
          <ModeToggle
            isActive={mode === "aerobic"}
            label="유산소"
            onPress={() => onModeChange("aerobic")}
          />
          <ModeToggle
            isActive={isWeight}
            label="웨이트"
            onPress={() => onModeChange("weight")}
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
      </View>

      {/* 설정 영역 (고정 영역으로 분리) */}
      <View style={[styles.landingConfigSection, { paddingBottom: insets.bottom }]}>
        {(isWeight || isInterval) ? (
          <TouchableOpacity
            style={styles.intervalToggleButton}
            onPress={onToggleConfigurator}
            activeOpacity={0.85}
          >
            <Ionicons name="settings-outline" size={18} color="#4a6cf4" />
            <Text style={styles.intervalToggleLabel}>
              {isWeight ? "웨이트 설정" : "인터벌 설정"}
            </Text>
            <Ionicons
              name="chevron-up"
              size={18}
              color="#4a6cf4"
            />
          </TouchableOpacity>
        ) : (
          // 유산소 모드일 때는 빈 공간 유지 (레이아웃 안정성을 위해)
          <View style={styles.intervalToggleSection} />
        )}
      </View>

      {/* 설정 모달 */}
      <Modal
        visible={showConfigurator}
        transparent
        animationType="slide"
        onRequestClose={onCloseConfigurator}
      >
        <View style={styles.configModalOverlay}>
          <View style={styles.configModalContent}>
            <View style={styles.configModalHeader}>
              <Text style={styles.configModalTitle}>
                {isWeight ? "웨이트 설정" : "인터벌 설정"}
              </Text>
              <TouchableOpacity
                onPress={onCloseConfigurator}
                style={styles.configModalCloseButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {isWeight ? (
              <IntervalConfigurator
                restDurationMs={restDurationMs}
                onAdjust={onAdjustRestDuration}
                onClose={onCloseConfigurator}
                onReset={onResetRestDuration}
                hideHeader={true}
              />
            ) : (
              <IntervalConfigurator
                restDurationMs={restDurationMs}
                onAdjust={onAdjustRestDuration}
                onClose={onCloseConfigurator}
                onReset={onResetRestDuration}
                workoutDurationMs={workoutDurationMs}
                onAdjustWorkoutDuration={onAdjustWorkoutDuration}
                onResetWorkoutDuration={onResetWorkoutDuration}
                hideHeader={true}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function IntervalConfigurator({
  restDurationMs,
  onAdjust,
  onClose,
  onReset,
  workoutDurationMs,
  onAdjustWorkoutDuration,
  onResetWorkoutDuration,
  hideHeader,
}: {
  restDurationMs: number;
  onAdjust: (deltaMs: number) => void;
  onClose: () => void;
  onReset: () => void;
  workoutDurationMs?: number;
  onAdjustWorkoutDuration?: (deltaMs: number) => void;
  onResetWorkoutDuration?: () => void;
  hideHeader?: boolean;
}) {
  const isNewInterval = workoutDurationMs !== undefined;
  
  return (
    <View style={styles.intervalConfigurator}>
      {!hideHeader && (
        <View style={styles.intervalConfiguratorHeader}>
          <Text style={styles.intervalConfiguratorTitle}>
            {isNewInterval ? "인터벌 설정" : "웨이트 설정"}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.intervalConfiguratorClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.intervalConfiguratorCloseText}>닫기</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.intervalConfigRows}>
        {isNewInterval && workoutDurationMs !== undefined && onAdjustWorkoutDuration && (
          <IntervalConfigRow
            label="세트별 운동 시간"
            value={workoutDurationMs}
            onDecrease={() => onAdjustWorkoutDuration(-WORKOUT_STEP_MS)}
            onIncrease={() => onAdjustWorkoutDuration(WORKOUT_STEP_MS)}
            canDecrease={workoutDurationMs > WORKOUT_MIN_MS}
            canIncrease={workoutDurationMs < WORKOUT_MAX_MS}
          />
        )}
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
          onPress={() => {
            onReset();
            if (onResetWorkoutDuration) {
              onResetWorkoutDuration();
            }
          }}
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
  isWorking,
  workoutRemainingMs,
  animalType,
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
  isWorking?: boolean;
  workoutRemainingMs?: number;
  animalType?: string | null;
}) {
  const foxRunningFrames = useMemo(
    () => [
      require("../../assets/images/animation/fox/fox_running/0.png"),
      require("../../assets/images/animation/fox/fox_running/1.png"),
      require("../../assets/images/animation/fox/fox_running/2.png"),
      require("../../assets/images/animation/fox/fox_running/3.png"),
      require("../../assets/images/animation/fox/fox_running/4.png"),
      require("../../assets/images/animation/fox/fox_running/5.png"),
      require("../../assets/images/animation/fox/fox_running/6.png"),
      require("../../assets/images/animation/fox/fox_running/7.png"),
    ],
    []
  );
  const dogRunningFrames = useMemo(
    () => [
      require("../../assets/images/animation/dog/dog_running/0.png"),
      require("../../assets/images/animation/dog/dog_running/1.png"),
      require("../../assets/images/animation/dog/dog_running/2.png"),
      require("../../assets/images/animation/dog/dog_running/3.png"),
      require("../../assets/images/animation/dog/dog_running/4.png"),
      require("../../assets/images/animation/dog/dog_running/5.png"),
      require("../../assets/images/animation/dog/dog_running/6.png"),
      require("../../assets/images/animation/dog/dog_running/7.png"),
    ],
    []
  );
  const capybaraRunningFrames = useMemo(
    () => [
      require("../../assets/images/animation/capibara/capibara_running/0.png"),
      require("../../assets/images/animation/capibara/capibara_running/1.png"),
      require("../../assets/images/animation/capibara/capibara_running/2.png"),
      require("../../assets/images/animation/capibara/capibara_running/3.png"),
      require("../../assets/images/animation/capibara/capibara_running/4.png"),
      require("../../assets/images/animation/capibara/capibara_running/5.png"),
      require("../../assets/images/animation/capibara/capibara_running/6.png"),
      require("../../assets/images/animation/capibara/capibara_running/7.png"),
    ],
    []
  );
  const redPandaRunningFrames = useMemo(
    () => [
      require("../../assets/images/animation/red_panda/red_panda_running/0.png"),
      require("../../assets/images/animation/red_panda/red_panda_running/1.png"),
      require("../../assets/images/animation/red_panda/red_panda_running/2.png"),
      require("../../assets/images/animation/red_panda/red_panda_running/3.png"),
      require("../../assets/images/animation/red_panda/red_panda_running/4.png"),
      require("../../assets/images/animation/red_panda/red_panda_running/5.png"),
      require("../../assets/images/animation/red_panda/red_panda_running/6.png"),
      require("../../assets/images/animation/red_panda/red_panda_running/7.png"),
    ],
    []
  );
  const guineaPigRunningFrames = useMemo(
    () => [
      require("../../assets/images/animation/ginipig/ginipig_running/0.png"),
      require("../../assets/images/animation/ginipig/ginipig_running/1.png"),
      require("../../assets/images/animation/ginipig/ginipig_running/2.png"),
      require("../../assets/images/animation/ginipig/ginipig_running/3.png"),
      require("../../assets/images/animation/ginipig/ginipig_running/4.png"),
      require("../../assets/images/animation/ginipig/ginipig_running/5.png"),
      require("../../assets/images/animation/ginipig/ginipig_running/6.png"),
      require("../../assets/images/animation/ginipig/ginipig_running/7.png"),
    ],
    []
  );

  const getAnimationFrames = useCallback(() => {
    const type = animalType || "dog";
    switch (type) {
      case "dog":
        return dogRunningFrames;
      case "capybara":
        return capybaraRunningFrames;
      case "fox":
        return foxRunningFrames;
      case "guinea_pig":
        return guineaPigRunningFrames;
      case "red_panda":
        return redPandaRunningFrames;
      default:
        return [require("../../assets/images/animation/dog/dog_running/0.png")];
    }
  }, [
    animalType,
    foxRunningFrames,
    capybaraRunningFrames,
    dogRunningFrames,
    redPandaRunningFrames,
    guineaPigRunningFrames,
  ]);

  const animationFrames = useMemo(() => getAnimationFrames(), [getAnimationFrames]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [framesReady, setFramesReady] = useState(false);
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isNewInterval = mode === "interval";
  const animationActive =
    !isResting && !isPaused && (!isNewInterval || isWorking);

  useEffect(() => {
    let cancelled = false;

    const preloadFrames = async () => {
      try {
        const assets = animationFrames.map((frame) => Asset.fromModule(frame));
        await Promise.all(assets.map((asset) => asset.downloadAsync()));
      } catch (error) {
        console.warn("애니메이션 프레임 로드 실패:", error);
      } finally {
        if (!cancelled) {
          setFramesReady(true);
        }
      }
    };

    setFramesReady(false);
    preloadFrames();

    return () => {
      cancelled = true;
    };
  }, [animationFrames]);

  useEffect(() => {
    if (!framesReady || !animationActive || animationFrames.length <= 1) {
      if (frameTimerRef.current) {
        clearInterval(frameTimerRef.current);
        frameTimerRef.current = null;
      }
      return;
    }

    if (frameTimerRef.current) {
      clearInterval(frameTimerRef.current);
    }

    frameTimerRef.current = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % animationFrames.length);
    }, 80);

    return () => {
      if (frameTimerRef.current) {
        clearInterval(frameTimerRef.current);
        frameTimerRef.current = null;
      }
    };
  }, [animationActive, animationFrames, framesReady]);

  useEffect(() => {
    setFrameIndex(0);
  }, [animalType]);
  const safeFrameIndex =
    animationFrames.length > 0 ? frameIndex % animationFrames.length : 0;

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

  const timerStateLabel = isNewInterval
    ? isWorking
      ? "운동 중"
      : isResting
      ? "휴식 중"
      : isPaused
      ? "일시정지"
      : "진행 중"
    : isResting
    ? "휴식 중"
    : isPaused
    ? "일시정지"
    : "진행 중";

  const restButtonDisabled = !isResting && restDurationMs <= 0;

  return (
    <View style={styles.runningContainer}>
      {/* 애니메이션 이미지 (시간 위에 표시) */}
      <View style={[styles.animationContainer, { position: "relative" }]}>
        {animationFrames.map((frame, index) => (
          <Image
            key={index}
            source={frame}
            style={[
              styles.runningAnimationImage,
              {
                position: "absolute",
                opacity: framesReady && index === safeFrameIndex ? 1 : 0,
              },
            ]}
            accessibilityRole="image"
            accessibilityLabel="애니메이션"
            fadeDuration={0}
          />
        ))}
      </View>
      <View style={styles.timerDisplay}>
        <Text style={styles.timerDigits}>{formatDuration(elapsedMs)}</Text>
        <Text style={styles.timerStateLabel}>{timerStateLabel}</Text>
      </View>

      {(mode === "weight" || mode === "interval") && (
        <>
          {isNewInterval ? (
            <IntervalPanel
              isResting={isResting}
              restRemainingMs={restRemainingMs}
              restDurationMs={restDurationMs}
              completedSets={completedSets}
              isWorking={isWorking}
              workoutRemainingMs={workoutRemainingMs}
            />
          ) : (
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
        </>
      )}

      <View style={styles.controlRow}>
        <ControlButton
          icon={isPaused ? "play" : "pause"}
          label={isPaused ? "재개" : "일시정지"}
          onPress={onPauseToggle}
          variant="primary"
          disabled={isResting || mode === "interval"}
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
        {(data.mode === "weight" || data.mode === "interval") && typeof data.restDurationMs === "number" && (
          <SummaryRow
            label="휴식 시간(세트당)"
            value={formatDuration(data.restDurationMs)}
          />
        )}
        {(data.mode === "weight" || data.mode === "interval") && data.intervalInfo && (
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
  isWorking,
  workoutRemainingMs,
}: {
  isResting: boolean;
  restRemainingMs: number;
  restDurationMs: number;
  completedSets: number;
  isWorking?: boolean;
  workoutRemainingMs?: number;
}) {
  const isNewInterval = isWorking !== undefined;
  
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
            {isNewInterval 
              ? "휴식이 끝나면 자동으로 운동이 시작됩니다."
              : "휴식이 끝나면 자동으로 운동이 재개됩니다."}
          </Text>
        </>
      ) : (
        <>
          {isNewInterval && isWorking && workoutRemainingMs !== undefined ? (
            <>
              <Text style={styles.intervalTimer}>
                {formatDuration(workoutRemainingMs)}
              </Text>
              <Text style={styles.intervalSubLabel}>
                운동 시간이 끝나면 자동으로 휴식이 시작됩니다.
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
    distance?: number;
    heartRate?: number | null; // Google Fit에서 가져온 심박수 (옵셔널)
  }
): SummaryData {
  const minutes = elapsedMs / 60_000;
  const laps = options?.laps ?? [];
  
  // Google Fit에서 심박수를 가져왔다면 사용하고, 없으면 시뮬레이션된 값 사용
  let heartRate: number;
  if (options?.heartRate !== null && options?.heartRate !== undefined) {
    heartRate = options.heartRate;
  } else {
    // 시뮬레이션된 심박수 계산
    const baseHeartRate = mode === "aerobic" ? 118 : 125;
    heartRate = Math.min(185, Math.round(baseHeartRate + minutes * 4));
  }

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

  if (mode === "weight" || mode === "interval") {
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
      distance: options?.distance,
    };
  }

  return {
    mode,
    elapsedMs,
    heartRate,
    stats,
    laps,
    distance: options?.distance,
  };
}