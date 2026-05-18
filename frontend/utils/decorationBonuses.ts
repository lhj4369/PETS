import type { DecorationId } from "./homeLayout";

type Mode = "aerobic" | "weight" | "interval";

export type SummaryStat = { label: string; value: number };

/** 홈에 배치된 장식품에 따른 운동 보상 추가 스탯 */
export function appendDecorationBonuses(
  stats: SummaryStat[],
  mode: Mode,
  placedDecorationIds: DecorationId[]
): SummaryStat[] {
  const out = [...stats];
  const set = new Set(placedDecorationIds);

  if (set.has("bench") && mode === "weight") {
    out.push({ label: "근력", value: 2 });
  }
  if (set.has("dumbbell") && mode === "weight") {
    out.push({ label: "근력", value: 1 });
  }
  if (set.has("treadmill") && (mode === "aerobic" || mode === "interval")) {
    out.push({ label: "민첩", value: 1 });
    out.push({ label: "지구력", value: 1 });
  }

  return out;
}
