import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 운동 시간을 측정하는 stop-watch 형태의 타이머 훅입니다.
 * requestAnimationFrame을 사용해 경과 시간을 밀리초 단위로 추적합니다.
 */
export function useWorkoutTimer() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);
  const frameRef = useRef<number | null>(null);

  // requestAnimationFrame 루프에서 경과 시간을 업데이트
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

  // animation frame 중복 등록을 방지하기 위해 해제
  const clearFrame = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  // 타이머 시작 (정지 상태에서도 재사용 가능)
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

  // 경과 시간을 누적하고 일시정지
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

  // 일시정지된 타이머 재개
  const resume = useCallback(() => {
    if (!isRunning || !isPaused) {
      return;
    }
    startTimeRef.current = Date.now();
    setIsPaused(false);
    clearFrame();
    frameRef.current = requestAnimationFrame(step);
  }, [clearFrame, isPaused, isRunning, step]);

  // 타이머 정지 후 누적 시간을 반환
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

  // 모든 상태를 초기값으로 재설정
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

