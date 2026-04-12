/** 웨이브 시작 시 보드·배치바 사이 문구 표시 시간(ms) */
export const DEFENSE_WAVE_BANNER_MS = 2000;

/** 배너 종료 후 한 웨이브 본편 길이(ms) */
export const DEFENSE_WAVE_DURATION_MS = 60000;

/** 웨이브 끝 N ms 동안 적 스폰 없음 */
export const DEFENSE_WAVE_NO_SPAWN_TAIL_MS = 20000;

/** 배너 직후부터 스폰 가능한 시간 = 본편 − 꼬리 */
export const DEFENSE_WAVE_SPAWN_WINDOW_MS =
  DEFENSE_WAVE_DURATION_MS - DEFENSE_WAVE_NO_SPAWN_TAIL_MS;

/** 배너 + 본편 한 사이클 */
export const DEFENSE_WAVE_CYCLE_MS =
  DEFENSE_WAVE_BANNER_MS + DEFENSE_WAVE_DURATION_MS;

/**
 * 다음 웨이브 시작까지 남은 시간(초)이 이 값 이하이고 적이 0마리일 때
 * 「다음 웨이브로」 수동 버튼을 표시.
 */
export const DEFENSE_EARLY_NEXT_WAVE_IF_CLEAR_WITHIN_SEC = 19;
