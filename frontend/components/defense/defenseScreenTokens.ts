/** 디펜스 전투/스테이지 화면 공통 여백 (목업과 맞춤) */
export const DEFENSE_SCREEN = {
  paddingH: 20,
  /** HomeButton(우측 고정)과 제목 겹침 방지 */
  headerRightReserve: 56,
  contentTop: 68,
  /** 전투 전용: 뒤로 버튼만 둘 때 본문 상단 패딩 */
  battleBodyPaddingTop: 10,
  contentBottom: 28,
  blockGap: 14,
} as const;

/** 웨이브 렌더(빨강) 영역이 차지할 화면 높이 비율 — 목업 기준 약 중단 40% */
export const DEFENSE_WAVE_SLOT_HEIGHT_RATIO = 0.4;

/** 전투: 웨이브 렌더 슬롯 높이(픽셀). 유닛 배치(파랑)는 이 안에서 비율로 잡힘 */
export function getDefenseFieldSlotHeight(windowHeight: number): number {
  const target = Math.round(windowHeight * DEFENSE_WAVE_SLOT_HEIGHT_RATIO);
  return Math.max(220, Math.min(target, 400));
}

/** 하단 타워 선택 영역 최소 높이 */
export const DEFENSE_TOWER_DOCK_MIN_HEIGHT = 248;

/** 유닛 존에 배치되는 타워 이미지 한 변 크기 (px) */
export const DEFENSE_TOWER_SIZE = 52;
