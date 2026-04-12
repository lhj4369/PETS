export const DEFENSE_GRID_COLS = 6;
export const DEFENSE_GRID_ROWS = 3;

/**
 * 타워가 놓인 칸을 중심으로 한 사거리(3×3). 경계 밖 칸은 제외.
 * 공격 판정·사거리 UI에서 동일하게 사용.
 */
export function getTowerRangeCells3x3(
  centerCol: number,
  centerRow: number
): { col: number; row: number }[] {
  const out: { col: number; row: number }[] = [];
  for (let dc = -1; dc <= 1; dc++) {
    for (let dr = -1; dr <= 1; dr++) {
      const col = centerCol + dc;
      const row = centerRow + dr;
      if (
        col >= 0 &&
        col < DEFENSE_GRID_COLS &&
        row >= 0 &&
        row < DEFENSE_GRID_ROWS
      ) {
        out.push({ col, row });
      }
    }
  }
  return out;
}

type Bounds = { x: number; y: number; w: number; h: number };

/** 드롭 좌표(화면 절대)를 그리드 칸으로 스냅합니다. 존 밖이면 null. */
export function snapAbsoluteToGridCell(
  absX: number,
  absY: number,
  b: Bounds
): { col: number; row: number } | null {
  if (absX < b.x || absX > b.x + b.w || absY < b.y || absY > b.y + b.h) {
    return null;
  }
  const lx = absX - b.x;
  const ly = absY - b.y;
  const col = Math.min(
    DEFENSE_GRID_COLS - 1,
    Math.max(0, Math.floor((lx / b.w) * DEFENSE_GRID_COLS))
  );
  const row = Math.min(
    DEFENSE_GRID_ROWS - 1,
    Math.max(0, Math.floor((ly / b.h) * DEFENSE_GRID_ROWS))
  );
  return { col, row };
}
