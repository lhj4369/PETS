import type { ImageSourcePropType } from "react-native";

/** 타워 스프라이트·이펙트 표시 배율 */
export const DEFENSE_TOWER_IMAGE_SCALE = 1.5;

/** 그리드 칸 안 타워 이미지 기본 채움 비율(× 배율, 상한 적용) */
export const DEFENSE_TOWER_CELL_IMAGE_RATIO = Math.min(
  0.95,
  0.76 * DEFENSE_TOWER_IMAGE_SCALE
);

export type TowerRingColors = {
  fill: string;
  border: string;
};

const DEFAULT_RANGE_RING: TowerRingColors = {
  fill: "rgba(52, 152, 219, 0.2)",
  border: "rgba(41, 128, 185, 0.6)",
};

const DEFAULT_AOE_RGB = { border: "210, 255, 255", fill: "30, 190, 215" };

const DEFAULT_PROJECTILE = {
  backgroundColor: "#F1C40F",
  borderColor: "#D4AC0D",
};

const RANGE_BY_UNIT: Partial<Record<string, TowerRingColors>> = {
  capybara: {
    fill: "rgba(200, 175, 235, 0.28)",
    border: "rgba(170, 140, 220, 0.58)",
  },
};

const AOE_RGB_BY_UNIT: Partial<Record<string, { border: string; fill: string }>> = {
  capybara: { border: "195, 160, 235", fill: "190, 165, 230" },
  fox: { border: "255, 75, 95", fill: "255, 100, 115" },
};

const PROJECTILE_BY_UNIT: Partial<
  Record<string, { backgroundColor: string; borderColor: string }>
> = {
  red_panda: { backgroundColor: "#FF8FAB", borderColor: "#FF69B4" },
};

/** 원형 대신 스프라이트로 그릴 투사체/공격 이펙트 */
const PROJECTILE_IMAGE_BY_UNIT: Partial<Record<string, ImageSourcePropType>> = {
  ginipig: require("../../assets/images/defence/rapid_attack_effect.png"),
};

const SLOW_TINT_BY_UNIT: Partial<Record<string, string>> = {
  capybara: "rgba(205, 180, 240, 0.42)",
};

export function getTowerRangeRingColors(unitId: string): TowerRingColors {
  return RANGE_BY_UNIT[unitId] ?? DEFAULT_RANGE_RING;
}

export function getTowerAoePulseColors(
  unitId: string,
  borderAlpha: number,
  fillAlpha: number
): { borderColor: string; backgroundColor: string } {
  const rgb = AOE_RGB_BY_UNIT[unitId] ?? DEFAULT_AOE_RGB;
  return {
    borderColor: `rgba(${rgb.border}, ${borderAlpha})`,
    backgroundColor: `rgba(${rgb.fill}, ${fillAlpha})`,
  };
}

export function getTowerProjectileColors(unitId: string): {
  backgroundColor: string;
  borderColor: string;
} {
  return PROJECTILE_BY_UNIT[unitId] ?? DEFAULT_PROJECTILE;
}

export function getTowerProjectileImage(
  unitId: string
): ImageSourcePropType | null {
  return PROJECTILE_IMAGE_BY_UNIT[unitId] ?? null;
}

/** 이미지 공격 이펙트 기본 직경 배수 */
const PROJECTILE_IMAGE_DIAMETER_MULT = 3.2;
/** 이미지 이펙트 추가 크기 배율 */
export const DEFENSE_PROJECTILE_IMAGE_SIZE_SCALE = 1.1;
/** 이미지 이펙트 밝기(1 = 원본, 0.9 ≈ 10% 어둡게) */
export const DEFENSE_PROJECTILE_IMAGE_BRIGHTNESS = 0.9;

/** 이미지 이펙트 투사체 표시 크기(px) */
export function getTowerProjectileImageSize(
  unitId: string,
  baseDiameter: number
): number {
  if (PROJECTILE_IMAGE_BY_UNIT[unitId]) {
    return Math.max(
      36,
      Math.round(
        baseDiameter *
          PROJECTILE_IMAGE_DIAMETER_MULT *
          DEFENSE_PROJECTILE_IMAGE_SIZE_SCALE
      )
    );
  }
  return baseDiameter;
}

export function getTowerProjectileImageOpacity(unitId: string): number {
  return PROJECTILE_IMAGE_BY_UNIT[unitId]
    ? DEFENSE_PROJECTILE_IMAGE_BRIGHTNESS
    : 1;
}

export function getEnemySlowTintRgba(sourceUnitId?: string): string {
  if (sourceUnitId && SLOW_TINT_BY_UNIT[sourceUnitId]) {
    return SLOW_TINT_BY_UNIT[sourceUnitId]!;
  }
  return "rgba(100, 175, 255, 0.4)";
}
