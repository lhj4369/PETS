import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFENSE_WAVE_BANNER_MS,
  DEFENSE_WAVE_CYCLE_MS,
  DEFENSE_WAVE_SPAWN_WINDOW_MS,
} from "./defenseWaveConstants";

type Result = {
  waveNumber: number;
  showWaveStartBanner: boolean;
  secondsUntilNextWave: number;
  spawnEnemiesEnabled: boolean;
  /** maxWaves 도달 후 마지막 웨이브까지 끝남 */
  allWavesComplete: boolean;
  /** 현재 웨이브 남은 시간을 즉시 소진하고 다음 웨이브(또는 종료)로 진행 */
  skipRestOfCurrentWave: () => void;
};

export type DefenseWavesOptions = {
  /** 있으면 이 웨이브까지 끝나면 더 진행하지 않음 */
  maxWaves?: number;
  /** 바뀌면 웨이브를 1부터 다시 시작 */
  waveResetKey?: string;
  /** 1 = 보통, 2 = 2배(실시간 델타에만 곱해짐 — 1배 기준 웨이브 시각은 하나) */
  speedMultiplier?: number;
};

/**
 * paused가 true면 웨이브 시계 정지(대화 화면·게임 오버 등).
 * maxWaves가 있으면 해당 웨이브 종료 후 더 진행하지 않음.
 *
 * 웨이브 진행은 항상 1배속 기준 ms(`waveBaseElapsedRef`) 한 줄로만 누적하고,
 * 배속은 `Δ실시간 × speedMultiplier`로만 반영한다.
 */
export function useDefenseWaves(
  paused: boolean,
  options?: DefenseWavesOptions
): Result {
  const { maxWaves, waveResetKey = "", speedMultiplier = 1 } = options ?? {};
  const m = Math.max(1, speedMultiplier);

  const [waveNumber, setWaveNumber] = useState(1);
  const [showWaveStartBanner, setShowWaveStartBanner] = useState(true);
  const [secondsUntilNextWave, setSecondsUntilNextWave] = useState(
    Math.ceil(DEFENSE_WAVE_CYCLE_MS / 1000)
  );
  const [spawnEnemiesEnabled, setSpawnEnemiesEnabled] = useState(false);
  const [allWavesComplete, setAllWavesComplete] = useState(false);

  /** 현재 웨이브 안에서 이미 흐른 시간(ms), 항상 1배속 기준 */
  const waveBaseElapsedRef = useRef(0);
  /** 마지막으로 웨이브 시계를 갱신한 실시각 */
  const lastTickRealRef = useRef(Date.now());
  const pauseBeganAtRef = useRef<number | null>(null);
  const waveNumRef = useRef(1);
  const completedAllWavesRef = useRef(false);
  const maxWavesRef = useRef(maxWaves);
  maxWavesRef.current = maxWaves;

  const speedMultRef = useRef(m);
  speedMultRef.current = m;

  useEffect(() => {
    waveBaseElapsedRef.current = 0;
    lastTickRealRef.current = Date.now();
    waveNumRef.current = 1;
    completedAllWavesRef.current = false;
    setWaveNumber(1);
    setShowWaveStartBanner(true);
    setSpawnEnemiesEnabled(false);
    setSecondsUntilNextWave(Math.ceil(DEFENSE_WAVE_CYCLE_MS / 1000));
    setAllWavesComplete(false);
  }, [waveResetKey, maxWaves]);

  const applyWaveUiFromNow = useCallback((now: number) => {
    const mult = speedMultRef.current;
    const CYCLE = DEFENSE_WAVE_CYCLE_MS;
    const BANNER = DEFENSE_WAVE_BANNER_MS;
    const SPAWN_END = DEFENSE_WAVE_BANNER_MS + DEFENSE_WAVE_SPAWN_WINDOW_MS;
    const max = maxWavesRef.current;

    if (completedAllWavesRef.current) {
      setShowWaveStartBanner(false);
      setSpawnEnemiesEnabled(false);
      setSecondsUntilNextWave(0);
      return;
    }

    const deltaReal = now - lastTickRealRef.current;
    lastTickRealRef.current = now;

    let base = waveBaseElapsedRef.current + deltaReal * mult;

    while (base >= CYCLE) {
      if (max != null && waveNumRef.current >= max) {
        completedAllWavesRef.current = true;
        setAllWavesComplete(true);
        break;
      }
      base -= CYCLE;
      waveNumRef.current += 1;
      setWaveNumber(waveNumRef.current);
    }

    if (completedAllWavesRef.current) {
      setShowWaveStartBanner(false);
      setSpawnEnemiesEnabled(false);
      setSecondsUntilNextWave(0);
      return;
    }

    waveBaseElapsedRef.current = base;

    const e = base;
    setShowWaveStartBanner(e < BANNER);
    setSpawnEnemiesEnabled(e >= BANNER && e < SPAWN_END);

    const remSim = CYCLE - e;
    setSecondsUntilNextWave(Math.max(0, Math.ceil(remSim / 1000)));
  }, []);

  const skipRestOfCurrentWave = useCallback(() => {
    if (completedAllWavesRef.current) return;
    const now = Date.now();
    waveBaseElapsedRef.current = DEFENSE_WAVE_CYCLE_MS;
    lastTickRealRef.current = now;
    applyWaveUiFromNow(now);
  }, [applyWaveUiFromNow]);

  useEffect(() => {
    if (paused) {
      if (pauseBeganAtRef.current === null) {
        pauseBeganAtRef.current = Date.now();
      }
      return;
    }

    if (pauseBeganAtRef.current !== null) {
      pauseBeganAtRef.current = null;
      lastTickRealRef.current = Date.now();
    }

    const tick = () => {
      const now = Date.now();

      if (completedAllWavesRef.current) {
        setShowWaveStartBanner(false);
        setSpawnEnemiesEnabled(false);
        setSecondsUntilNextWave(0);
        return;
      }

      applyWaveUiFromNow(now);
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [paused, applyWaveUiFromNow]);

  return {
    waveNumber,
    showWaveStartBanner,
    secondsUntilNextWave,
    spawnEnemiesEnabled,
    allWavesComplete,
    skipRestOfCurrentWave,
  };
}
