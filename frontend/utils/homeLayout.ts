import { ImageSourcePropType } from "react-native";

export type DecorationId = "bench" | "dumbbell" | "treadmill";

/** 집 오버레이: standard만 사용(없음 옵션 제거) */
export type HouseType = "standard";

export type HomeLayout = {
  animal: { x: number; y: number };
  decorations: Array<{ id: DecorationId; x: number; y: number }>;
  houseType?: HouseType;
};

/** 방 이미지 기준 배치 가능 영역(바닥) — 플레이 컨테이너 높이 비율 */
export const FLOOR_PLACE_RATIO = 0.5;

export const STANDARD_HOUSE_IMAGE: ImageSourcePropType = require("../assets/images/house/standard.png");

export function getHouseOverlaySource(houseType: HouseType | undefined | null): ImageSourcePropType | null {
  if (houseType === "standard" || houseType == null) return STANDARD_HOUSE_IMAGE;
  return null;
}

export const DEFAULT_HOME_LAYOUT: HomeLayout = {
  animal: { x: 0.5, y: 0.55 },
  decorations: [],
  houseType: "standard",
};

/** 장식품 최대 배치 개수 */
export const MAX_DECORATIONS = 2;

/**
 * 동물 ↔ 장식 겹침 전용 (수평은 유지, 수직만 더 타이트하게)
 */
const HITBOX_ANIMAL_VS_DEC = {
  animal: { w: 0.38, h: 0.16 },
  decoration: { w: 0.24, h: 0.075 },
};

/** 장식 ↔ 장식 */
const HITBOX_DECORATION_PAIR: Record<DecorationId, { w: number; h: number }> = {
  bench: { w: 0.13, h: 0.07 },
  dumbbell: { w: 0.13, h: 0.07 },
  treadmill: { w: 0.13, h: 0.07 },
};

type Rect = { left: number; right: number; top: number; bottom: number };

function rectFromCenter(cx: number, cy: number, w: number, h: number): Rect {
  return {
    left: cx - w / 2,
    right: cx + w / 2,
    top: cy - h / 2,
    bottom: cy + h / 2,
  };
}

function toDecorationPairRect(id: DecorationId, cx: number, cy: number): Rect {
  const { w, h } = HITBOX_DECORATION_PAIR[id];
  return rectFromCenter(cx, cy, w, h);
}

function overlap(a: Rect, b: Rect): boolean {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

export function layoutHasOverlap(layout: HomeLayout): boolean {
  const { animal: aBox, decoration: dBox } = HITBOX_ANIMAL_VS_DEC;
  const animal = rectFromCenter(layout.animal.x, layout.animal.y, aBox.w, aBox.h);
  for (const d of layout.decorations) {
    const dr = rectFromCenter(d.x, d.y, dBox.w, dBox.h);
    if (overlap(animal, dr)) return true;
  }
  for (let i = 0; i < layout.decorations.length; i++) {
    for (let j = i + 1; j < layout.decorations.length; j++) {
      const di = layout.decorations[i];
      const dj = layout.decorations[j];
      const a = toDecorationPairRect(di.id, di.x, di.y);
      const b = toDecorationPairRect(dj.id, dj.x, dj.y);
      if (overlap(a, b)) return true;
    }
  }
  return false;
}

export function parseHomeLayout(raw: unknown): HomeLayout {
  if (raw == null) return { ...DEFAULT_HOME_LAYOUT };
  try {
    const o = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!o || typeof o !== "object") return { ...DEFAULT_HOME_LAYOUT };
    const ax = clamp01((o as HomeLayout).animal?.x ?? DEFAULT_HOME_LAYOUT.animal.x);
    const ay = clamp01((o as HomeLayout).animal?.y ?? DEFAULT_HOME_LAYOUT.animal.y);
    const decs: HomeLayout["decorations"] = [];
    const seen = new Set<DecorationId>();
    const list = Array.isArray((o as HomeLayout).decorations) ? (o as HomeLayout).decorations : [];
    const allowed: DecorationId[] = ["bench", "dumbbell", "treadmill"];
    for (const d of list) {
      if (decs.length >= MAX_DECORATIONS) break;
      if (!d || typeof d !== "object") continue;
      const id = d.id as DecorationId;
      if (!allowed.includes(id) || seen.has(id)) continue;
      seen.add(id);
      decs.push({ id, x: clamp01(d.x), y: clamp01(d.y) });
    }
    const houseType: HouseType = "standard";

    return { animal: { x: ax, y: ay }, decorations: decs, houseType };
  } catch {
    return { ...DEFAULT_HOME_LAYOUT };
  }
}

function clamp01(n: number): number {
  if (typeof n !== "number" || Number.isNaN(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

export const DECORATION_ASSETS: Record<DecorationId, ImageSourcePropType> = {
  bench: require("../assets/images/decor/bench.png"),
  dumbbell: require("../assets/images/decor/dumbbell.png"),
  treadmill: require("../assets/images/decor/treadmill.png"),
};

export const DECORATION_LABELS: Record<DecorationId, string> = {
  bench: "벤치",
  dumbbell: "덤벨 세트",
  treadmill: "런닝머신",
};

export const DECORATION_EFFECT_TEXT: Record<DecorationId, string> = {
  bench: "웨이트 운동 완료 후 추가 힘 +2",
  dumbbell: "웨이트 운동 완료 후 추가 힘 +1",
  treadmill: "유산소·인터벌 운동 완료 후 추가 민첩 +1, 지구력 +1",
};
