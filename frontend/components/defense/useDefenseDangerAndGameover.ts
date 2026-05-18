import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

/** 이 인원 초과 시 위험 타이머 시작 */
export const DEFENSE_DANGER_ENEMY_THRESHOLD = 70;

const DANGER_DURATION_MS = 30000;

export type DefenseDangerOptions = {
  /** true면 위험·게임오버 판정 비활성(보스 시간 패배 등과 겹침 방지) */
  disabled?: boolean;
  /**
   * 과밀 게임오버 시 Alert 대신 호출 — 스테이지에서 패배 모달 등으로 처리.
   * 미지정 시 기존처럼 Alert 후 `onExitToDefenseHome`으로 이동.
   */
  onGameOver?: () => void;
};

/**
 * 적 수가 임계값을 넘으면 30초 카운트다운.
 * 그동안 임계 이하로 내려가면 해제.
 * 0초까지 임계 초과면 게임 정지 + Alert 후 콜백.
 */
export function useDefenseDangerAndGameover(
  fieldEnemyCount: number,
  onExitToDefenseHome: () => void,
  options?: DefenseDangerOptions
) {
  const disabled = options?.disabled ?? false;
  const onGameOver = options?.onGameOver;
  const [gameFrozen, setGameFrozen] = useState(false);
  const [dangerSecondsLeft, setDangerSecondsLeft] = useState<number | null>(null);
  const dangerEndTimeRef = useRef<number | null>(null);
  const countRef = useRef(fieldEnemyCount);
  const frozenRef = useRef(false);
  const gameOverDoneRef = useRef(false);
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  countRef.current = fieldEnemyCount;
  frozenRef.current = gameFrozen;

  useEffect(() => {
    if (disabled) {
      dangerEndTimeRef.current = null;
      setDangerSecondsLeft(null);
      return;
    }
    if (gameFrozen || gameOverDoneRef.current) return;

    if (fieldEnemyCount <= DEFENSE_DANGER_ENEMY_THRESHOLD) {
      dangerEndTimeRef.current = null;
      setDangerSecondsLeft(null);
      return;
    }

    if (dangerEndTimeRef.current === null) {
      dangerEndTimeRef.current = Date.now() + DANGER_DURATION_MS;
    }

    const tick = () => {
      if (gameOverDoneRef.current || frozenRef.current) return;
      if (countRef.current <= DEFENSE_DANGER_ENEMY_THRESHOLD) {
        dangerEndTimeRef.current = null;
        setDangerSecondsLeft(null);
        return;
      }
      const end = dangerEndTimeRef.current;
      if (end === null) return;
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setDangerSecondsLeft(left);
      if (left <= 0 && countRef.current > DEFENSE_DANGER_ENEMY_THRESHOLD) {
        gameOverDoneRef.current = true;
        setGameFrozen(true);
        dangerEndTimeRef.current = null;
        setDangerSecondsLeft(null);
        const custom = onGameOverRef.current;
        if (custom) {
          custom();
        } else {
          Alert.alert("패배했습니다!", "", [
            { text: "확인", onPress: onExitToDefenseHome },
          ]);
        }
      }
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [fieldEnemyCount, gameFrozen, onExitToDefenseHome, disabled, onGameOver]);

  const showDangerBanner =
    !disabled &&
    !gameFrozen &&
    fieldEnemyCount > DEFENSE_DANGER_ENEMY_THRESHOLD &&
    dangerSecondsLeft !== null &&
    dangerSecondsLeft > 0;

  return { gameFrozen, dangerSecondsLeft, showDangerBanner };
}
