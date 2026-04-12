/** 적 스폰 시 HP */
export const DEFENSE_ENEMY_MAX_HP = 10;

/** 타워 전투 수치(기본값). 타워별로 덮어쓰려면 `DEFENSE_TOWER_COMBAT_BY_UNIT_ID` 사용 */
export const DEFENSE_TOWER_COMBAT = {
  damage: 5,
  attackIntervalMs: 1500,
  rangeRadiusCellMult: 1.5,
} as const;

export type DefenseTowerCombatStats = {
  damage: number;
  attackIntervalMs: number;
  rangeRadiusCellMult: number;
};

/**
 * `TOWER_UNITS`의 `id`(예: "dog")를 키로, 바꿀 필드만 적습니다. 없는 타워는 `DEFENSE_TOWER_COMBAT`과 동일합니다.
 *
 * @example
 * {
 *   dog: { damage: 7, attackIntervalMs: 1200 },
 *   fox: { rangeRadiusCellMult: 2 },
 * }
 */
export const DEFENSE_TOWER_COMBAT_BY_UNIT_ID: Partial<
  Record<string, Partial<DefenseTowerCombatStats>>
> = {
    dog: { damage: 2, attackIntervalMs: 1500, rangeRadiusCellMult: 1.5 },
    capybara: { damage: 15, attackIntervalMs: 8000, rangeRadiusCellMult: 1 },
    fox: { damage: 5, attackIntervalMs: 1500, rangeRadiusCellMult: 3 },
    red_panda: { damage: 1, attackIntervalMs: 500, rangeRadiusCellMult: 5 },
    ginipig: { damage: 8, attackIntervalMs: 1000, rangeRadiusCellMult: 3 },
};

export function getDefenseTowerCombat(unitId: string): DefenseTowerCombatStats {
  const o = DEFENSE_TOWER_COMBAT_BY_UNIT_ID[unitId] ?? {};
  return {
    damage: o.damage ?? DEFENSE_TOWER_COMBAT.damage,
    attackIntervalMs: o.attackIntervalMs ?? DEFENSE_TOWER_COMBAT.attackIntervalMs,
    rangeRadiusCellMult:
      o.rangeRadiusCellMult ?? DEFENSE_TOWER_COMBAT.rangeRadiusCellMult,
  };
}

/** 타워 공격력 (공통 기본값, 레거시·단순 참조용) */
export const DEFENSE_TOWER_DAMAGE = DEFENSE_TOWER_COMBAT.damage;

/** 타워 공격 간격(ms) 기본값 */
export const DEFENSE_TOWER_ATTACK_INTERVAL_MS = DEFENSE_TOWER_COMBAT.attackIntervalMs;

/** 투사체 비행 시간(ms) */
export const DEFENSE_PROJECTILE_FLIGHT_MS = 220;

/** 투사체 직경(px) */
export const DEFENSE_PROJECTILE_SIZE = 10;

/**
 * 사거리 반경 배수 기본값 (레거시)
 * 사거리 반경 = cellSide × 값
 */
export const DEFENSE_TOWER_RANGE_RADIUS_CELL_MULT =
  DEFENSE_TOWER_COMBAT.rangeRadiusCellMult;

/** UI용: 그리드 칸 기준 사거리 지름 */
export function formatDefenseTowerRangeCellsLabel(unitId: string): string {
  const d = 2 * getDefenseTowerCombat(unitId).rangeRadiusCellMult;
  const s =
    Number.isInteger(d) || Math.abs(d - Math.round(d)) < 1e-6
      ? String(Math.round(d))
      : d.toFixed(1);
  return `${s}칸 (지름)`;
}

/** 배치 타워 삭제(판매) 시 돌려받는 자원 */
export const DEFENSE_TOWER_SELL_REFUND = 15;

/** 적 한 마리 처치 시 지급 자원 */
export const DEFENSE_ENEMY_KILL_REWARD = 5;

/** 도전 모드: 웨이브가 1 오를 때마다 스폰 적 hp에 곱해 누적 (웨이브 n = 기본 × 이값^(n−1)) */
export const DEFENSE_CHALLENGE_ENEMY_HP_WAVE_MULT = 1.5;

export function getChallengeModeEnemySpawnHp(waveNumber: number): number {
  const w = Math.max(1, waveNumber);
  return Math.max(
    1,
    Math.round(
      DEFENSE_ENEMY_MAX_HP * DEFENSE_CHALLENGE_ENEMY_HP_WAVE_MULT ** (w - 1)
    )
  );
}
