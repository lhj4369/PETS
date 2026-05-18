import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "defense_scenario_cleared_stage_ids_v1";

export async function loadClearedScenarioStageIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

export async function markScenarioStageCleared(stageId: string): Promise<void> {
  const next = await loadClearedScenarioStageIds();
  next.add(stageId);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
}
