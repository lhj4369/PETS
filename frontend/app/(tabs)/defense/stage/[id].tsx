import { useState, useMemo, useRef, useCallback, useEffect, useReducer } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { useState, useRef, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HomeButton from "../../../../components/HomeButton";
import DefenseSubHeader from "../../../../components/defense/DefenseSubHeader";
import DefenseHudWaveChip from "../../../../components/defense/DefenseHudWaveChip";
import DefenseHudTimerChip from "../../../../components/defense/DefenseHudTimerChip";
import DefenseHudEnemyBar from "../../../../components/defense/DefenseHudEnemyBar";
import DefenseBattleFieldPlaceholder from "../../../../components/defense/DefenseBattleFieldPlaceholder";
import DefenseHudBossHpBar from "../../../../components/defense/DefenseHudBossHpBar";
import DefenseBattleFieldPlaceholder, {
  type BossHpHudPayload,
} from "../../../../components/defense/DefenseBattleFieldPlaceholder";
import DefenseTowerDragRangeRing from "../../../../components/defense/DefenseTowerDragRangeRing";
import DefenseDangerBanner from "../../../../components/defense/DefenseDangerBanner";
import DefenseDeployBarPlaceholder, {
  type DragCallbacks,
} from "../../../../components/defense/DefenseDeployBarPlaceholder";
import { useDefenseDangerAndGameover } from "../../../../components/defense/useDefenseDangerAndGameover";
import { useDefenseWaves } from "../../../../components/defense/useDefenseWaves";
import DefenseBossWaveWarning from "../../../../components/defense/DefenseBossWaveWarning";
import DefenseWaveStartBanner from "../../../../components/defense/DefenseWaveStartBanner";
import DefenseTowerInfoModal from "../../../../components/defense/DefenseTowerInfoModal";
import { APP_COLORS } from "../../../../constants/theme";
import type { PlacedTowerData, DragState } from "../../../../components/defense/defenseTypes";
import { snapAbsoluteToGridCell } from "../../../../components/defense/defenseGrid";
import {
  getStubDialogueForStage,
  STUB_SCENARIO_STAGES,
} from "../../../../data/defenseStub";
import DefenseGameSpeedToggle from "../../../../components/defense/DefenseGameSpeedToggle";
import {
  DEFENSE_SCREEN,
  DEFENSE_TOWER_DOCK_MIN_HEIGHT,
} from "../../../../components/defense/defenseScreenTokens";
import {
  DEFENSE_ENEMY_KILL_REWARD,
  DEFENSE_TOWER_COMBAT,
  getDefenseTowerCombat,
} from "../../../../components/defense/defenseCombatConstants";
import {
  createDefensePlacementState,
  defensePlacementReducer,
} from "../../../../components/defense/defenseTowerEconomy";
import { DEFENSE_EARLY_NEXT_WAVE_IF_CLEAR_WITHIN_SEC } from "../../../../components/defense/defenseWaveConstants";
import DefenseManualNextWaveButton from "../../../../components/defense/DefenseManualNextWaveButton";
import DefenseStageVictoryBanner from "../../../../components/defense/DefenseStageVictoryBanner";
import {
  DEFENSE_BOSS_WAVE_NUMBER,
  DEFENSE_EARLY_NEXT_WAVE_IF_CLEAR_WITHIN_SEC,
} from "../../../../components/defense/defenseWaveConstants";
import DefenseManualNextWaveButton from "../../../../components/defense/DefenseManualNextWaveButton";
import DefenseStageVictoryOverlay from "../../../../components/defense/DefenseStageVictoryOverlay";
import DefenseStageDefeatOverlay from "../../../../components/defense/DefenseStageDefeatOverlay";
import { markScenarioStageCleared } from "../../../../utils/defenseScenarioProgress";
import { STUB_SCENARIO_STAGES } from "../../../../data/defenseStub";

const BACK_BTN_LEFT = 16;
const BACK_BTN_SIZE = 56;
const ICON_SIZE = 40;
const BTN_TO_HUD_GAP = 12;

const FIELD_ENEMY_MAX = 100;

type Bounds = { x: number; y: number; w: number; h: number };

/**
 * 시나리오 스테이지 전투 — 대화는 시나리오 목록 모달에서 진행 후 진입.
 */
export default function DefenseStageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const stageId = id ?? "?";

  const meta = useMemo(
    () => STUB_SCENARIO_STAGES.find((s) => s.id === stageId),
    [stageId]
  );

  const [phase, setPhase] = useState<Phase>("dialogue");
  const [lineIndex, setLineIndex] = useState(0);

  // ── 드래그&드롭 state ───────────────────────────────────────────────────────
  const [{ placedTowers, currency }, dispatchPlacement] = useReducer(
    defensePlacementReducer,
    150,
    createDefensePlacementState,
  );
  const [placedTowers, setPlacedTowers] = useState<PlacedTowerData[]>([]);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [placementCellSide, setPlacementCellSide] = useState(0);
  const [fieldEnemyCount, setFieldEnemyCount] = useState(0);
  const [bossHud, setBossHud] = useState<BossHpHudPayload | null>(null);
  const [bossTimedDefeat, setBossTimedDefeat] = useState(false);
  const [defeatOverlayVisible, setDefeatOverlayVisible] = useState(false);
  const [towerInfoUnitId, setTowerInfoUnitId] = useState<string | null>(null);
  const [stageVictory, setStageVictory] = useState(false);
  const [gameSpeedMult, setGameSpeedMult] = useState<1 | 2>(1);
  const stageVictoryLatchedRef = useRef(false);
  /** 보스 웨이브에서 보스가 한 번이라도 살아 있는 상태가 되었을 때만 true — 스폰 전 빈 필드로 즉시 승리하는 오류 방지 */
  const bossHadHpOnFieldRef = useRef(false);
  const draggingRef = useRef<DragState | null>(null);

  const onBoardCellSide = useCallback((s: number) => {
    setPlacementCellSide((prev) => (prev === s ? prev : s));
  }, []);

  const onFieldEnemyCount = useCallback((n: number) => {
    setFieldEnemyCount((prev) => (prev === n ? prev : n));
  }, []);

  const exitToDefenseHome = useCallback(() => {
    router.replace("/(tabs)/defense");
  }, [router]);

  const { gameFrozen, showDangerBanner, dangerSecondsLeft } = useDefenseDangerAndGameover(
    fieldEnemyCount,
    exitToDefenseHome
  );

  const onBossHpForHud = useCallback((payload: BossHpHudPayload | null) => {
    setBossHud((prev) => {
      if (payload == null && prev == null) return prev;
      if (
        payload != null &&
        prev != null &&
        prev.hp === payload.hp &&
        prev.maxHp === payload.maxHp
      ) {
        return prev;
      }
      return payload;
    });
  }, []);

  const exitToScenarioSelect = useCallback(() => {
    router.replace("/(tabs)/defense/scenario" as any);
  }, [router]);

  const showStageDefeatOverlay = useCallback(() => {
    setDefeatOverlayVisible(true);
  }, []);

  const { gameFrozen, showDangerBanner, dangerSecondsLeft } = useDefenseDangerAndGameover(
    fieldEnemyCount,
    exitToScenarioSelect,
    {
      disabled: bossTimedDefeat || defeatOverlayVisible || stageVictory,
      onGameOver: showStageDefeatOverlay,
    }
  );

  const onBossWaveTimedDefeat = useCallback(() => {
    setBossTimedDefeat(true);
    setDefeatOverlayVisible(true);
  }, []);

  const {
    waveNumber,
    showWaveStartBanner,
    secondsUntilNextWave,
    spawnEnemiesEnabled,
    allWavesComplete,
    skipRestOfCurrentWave,
  } = useDefenseWaves(gameFrozen || phase !== "battle" || stageVictory, {
    maxWaves: meta?.totalWaves,
    waveResetKey: stageId,
    speedMultiplier: gameSpeedMult,
  });
  } = useDefenseWaves(
    gameFrozen ||
      phase !== "battle" ||
      stageVictory ||
      bossTimedDefeat ||
      defeatOverlayVisible,
    {
      maxWaves: meta?.totalWaves,
      waveResetKey: stageId,
      speedMultiplier: gameSpeedMult,
      fieldEnemyCount,
      onBossWaveTimedDefeat,
    }
  );

  const toggleGameSpeed = useCallback(() => {
    setGameSpeedMult((v) => (v === 1 ? 2 : 1));
  }, []);

  useEffect(() => {
    if (stageVictoryLatchedRef.current || stageVictory) return;
    if (waveNumber !== DEFENSE_BOSS_WAVE_NUMBER) {
      bossHadHpOnFieldRef.current = false;
      return;
    }
    if (bossHud != null && bossHud.hp > 0) {
      bossHadHpOnFieldRef.current = true;
    }
  }, [waveNumber, bossHud]);

  useEffect(() => {
    if (stageVictoryLatchedRef.current || stageVictory || bossTimedDefeat || defeatOverlayVisible)
      return;
    if (phase !== "battle" || gameFrozen) return;
    const totalWaves = meta?.totalWaves;
    if (totalWaves == null || totalWaves < 1) return;
    if (waveNumber !== totalWaves) return;
    if (fieldEnemyCount !== 0) return;
    if (secondsUntilNextWave > DEFENSE_EARLY_NEXT_WAVE_IF_CLEAR_WITHIN_SEC) return;
    const instantClearOnBossWave =
      waveNumber === DEFENSE_BOSS_WAVE_NUMBER &&
      bossHadHpOnFieldRef.current;
    if (
      !instantClearOnBossWave &&
      secondsUntilNextWave > DEFENSE_EARLY_NEXT_WAVE_IF_CLEAR_WITHIN_SEC
    ) {
      return;
    }

    stageVictoryLatchedRef.current = true;
    setStageVictory(true);
  }, [
    phase,
    gameFrozen,
    stageVictory,
    meta?.totalWaves,
    waveNumber,
    fieldEnemyCount,
    secondsUntilNextWave,
  ]);

  useEffect(() => {
    bossTimedDefeat,
    bossHud,
    defeatOverlayVisible,
  ]);

  useEffect(() => {
    if (
      phase !== "battle" ||
      stageVictory ||
      bossTimedDefeat ||
      defeatOverlayVisible ||
      waveNumber !== DEFENSE_BOSS_WAVE_NUMBER
    ) {
      setBossHud(null);
    }
  }, [phase, stageVictory, bossTimedDefeat, defeatOverlayVisible, waveNumber]);

  useEffect(() => {
    if (!stageVictory) return;
    void markScenarioStageCleared(stageId);
  }, [stageVictory, stageId]);

  useEffect(() => {
    if (!stageVictory) return;
    const id = setTimeout(() => {
      router.replace("/(tabs)/defense/scenario" as any);
    }, 3000);
    return () => clearTimeout(id);
  }, [stageVictory, router]);

  const showManualNextWave =
    phase === "battle" &&
    !gameFrozen &&
  const showManualNextWave =
    phase === "battle" &&
    !gameFrozen &&
    !bossTimedDefeat &&
    !defeatOverlayVisible &&
    !stageVictory &&
    fieldEnemyCount === 0 &&
    secondsUntilNextWave > 0 &&
    secondsUntilNextWave <= DEFENSE_EARLY_NEXT_WAVE_IF_CLEAR_WITHIN_SEC &&
    !allWavesComplete;

  const showBossWaveWarning =
    phase === "battle" &&
    showWaveStartBanner &&
    waveNumber === DEFENSE_BOSS_WAVE_NUMBER &&
    !bossTimedDefeat &&
    !defeatOverlayVisible &&
    !stageVictory;

  const towerChipSize = useMemo(() => {
    const base = placementCellSide > 0 ? placementCellSide : 36;
    const fromCell = Math.max(40, Math.round((base * 2) / 3));
    return Math.round(fromCell * 1.5);
  }, [placementCellSide]);

  const ghostSize = useMemo(
    () => Math.max(44, Math.round(towerChipSize * 1.15)),
    [towerChipSize]
  );
  const ghostHalf = ghostSize / 2;

  const dragRangeDiameterPx = useMemo(() => {
    const cell = placementCellSide > 0 ? placementCellSide : 36;
    const mult = dragging
      ? getDefenseTowerCombat(dragging.unit.unitId).rangeRadiusCellMult
      : DEFENSE_TOWER_COMBAT.rangeRadiusCellMult;
    return Math.max(1, 2 * mult * cell);
  }, [placementCellSide, dragging?.unit.unitId]);

  const unitZoneRef = useRef<View>(null);
  const unitZoneBounds = useRef<Bounds | null>(null);

  const meta = useMemo(
    () => STUB_SCENARIO_STAGES.find((s) => s.id === stageId),
    [stageId]
  );

  const measureUnitZone = () => {
    unitZoneRef.current?.measure((_, __, w, h, px, py) => {
      unitZoneBounds.current = { x: px, y: py, w, h };
    });
  };

  const isInZone = (absX: number, absY: number): boolean => {
    const b = unitZoneBounds.current;
    if (!b) return false;
    return absX >= b.x && absX <= b.x + b.w && absY >= b.y && absY <= b.y + b.h;
  };

  const dragCallbacks: DragCallbacks = {
    onDragStart: (unit, absX, absY) => {
      const state: DragState = { unit, absX, absY };
      draggingRef.current = state;
      setDragging(state);
    },
    onDragMove: (absX, absY) => {
      if (!draggingRef.current) return;
      const state: DragState = { ...draggingRef.current, absX, absY };
      draggingRef.current = state;
      setDragging(state);
    },
    onDragEnd: (absX, absY) => {
      const cur = draggingRef.current;
      if (cur && isInZone(absX, absY)) {
        const b = unitZoneBounds.current!;
        const cell = snapAbsoluteToGridCell(absX, absY, b);
        if (cell) {
          dispatchPlacement({ type: "place", cell, unit: cur.unit });
        }
      }
      draggingRef.current = null;
      setDragging(null);
    },
    onDragCancel: () => {
      draggingRef.current = null;
      setDragging(null);
    },
  };

  const onRemovePlacedTower = useCallback((towerId: string) => {
    dispatchPlacement({ type: "remove", towerId });
  }, []);

  const onEnemiesKilled = useCallback((kills: number) => {
    if (kills <= 0) return;
    dispatchPlacement({
      type: "addCurrency",
      amount: kills * DEFENSE_ENEMY_KILL_REWARD,
    });
  }, []);

  const onPlacedTowerInfoPress = useCallback((tower: PlacedTowerData) => {
    setTowerInfoUnitId(tower.unitId);
  }, []);

  useEffect(() => {
    if (phase !== "battle") setTowerInfoUnitId(null);
  }, [phase]);

  const lines = useMemo(() => getStubDialogueForStage(stageId), [stageId]);

  const onDialogueNext = () => {
    if (lineIndex < lines.length - 1) {
      setLineIndex((i) => i + 1);
    } else {
      setPhase("battle");
    }
  };

  if (meta?.locked) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <HomeButton />
        <View style={styles.lockedBody}>
          <DefenseSubHeader title={`스테이지 ${stageId}`} />
          <Text style={styles.lockedText}>잠금된 스테이지입니다.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === "battle") {
    const btnTop = Math.max(insets.top + 4, 12);
    const hudTop = btnTop + BACK_BTN_SIZE + BTN_TO_HUD_GAP;
    const isDropTarget = dragging ? isInZone(dragging.absX, dragging.absY) : false;
    return (
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <TouchableOpacity
          style={[styles.backBtn, { top: btnTop }]}
          onPress={() => router.back()}
          activeOpacity={0.5}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="이전 화면"
        >
          <Image
            source={require("../../../../assets/images/back_icon.png")}
            style={[styles.backIcon, { tintColor: APP_COLORS.brown }]}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View
          style={[
            styles.battleBody,
            {
              paddingTop: hudTop,
              paddingBottom: Math.max(insets.bottom, 24),
            },
          ]}
        >
          <View style={styles.hudSection}>
            <View style={styles.hudTopRow}>
              <DefenseHudWaveChip
                wave={{ current: waveNumber, total: meta?.totalWaves ?? 1 }}
              />
              <DefenseHudTimerChip waveTimerSec={secondsUntilNextWave} />
            </View>
            <DefenseHudEnemyBar
              onFieldEnemies={{ current: fieldEnemyCount, max: FIELD_ENEMY_MAX }}
            />
              <DefenseHudTimerChip
                waveTimerSec={secondsUntilNextWave}
                isBossWave={waveNumber === DEFENSE_BOSS_WAVE_NUMBER}
              />
            </View>
            {waveNumber === DEFENSE_BOSS_WAVE_NUMBER ? (
              bossHud && !stageVictory ? (
                <DefenseHudBossHpBar
                  currentHp={bossHud.hp}
                  maxHp={bossHud.maxHp}
                />
              ) : null
            ) : (
              <DefenseHudEnemyBar
                onFieldEnemies={{
                  current: fieldEnemyCount,
                  max: FIELD_ENEMY_MAX,
                }}
              />
            )}
          </View>

          {showDangerBanner && dangerSecondsLeft != null ? (
            <DefenseDangerBanner secondsLeft={dangerSecondsLeft} />
          ) : null}

          <View style={styles.fieldColumn}>
            <DefenseBattleFieldPlaceholder
              unitZoneRef={unitZoneRef}
              placedTowers={placedTowers}
              onUnitZoneLayout={measureUnitZone}
              isDropTarget={isDropTarget}
              onCellSideChange={onBoardCellSide}
              onFieldEnemyCountChange={onFieldEnemyCount}
              isFrozen={gameFrozen || stageVictory}
              spawnEnemiesEnabled={spawnEnemiesEnabled}
              onRemovePlacedTower={onRemovePlacedTower}
              onPlacedTowerInfoPress={onPlacedTowerInfoPress}
              onEnemiesKilled={onEnemiesKilled}
              speedMultiplier={gameSpeedMult}
            />
  const btnTop = Math.max(insets.top + 4, 12);
  const hudTop = btnTop + BACK_BTN_SIZE + BTN_TO_HUD_GAP;
  const isDropTarget = dragging ? isInZone(dragging.absX, dragging.absY) : false;

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      <TouchableOpacity
        style={[styles.backBtn, { top: btnTop }]}
        onPress={() => router.back()}
        activeOpacity={0.5}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel="이전 화면"
      >
        <Image
          source={require("../../../../assets/images/back_icon.png")}
          style={[styles.backIcon, { tintColor: APP_COLORS.brown }]}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <View
        style={[
          styles.battleBody,
          {
            paddingTop: hudTop,
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        <View style={styles.hudSection}>
          <View style={styles.hudTopRow}>
            <DefenseHudWaveChip wave={{ current: 1, total: 3 }} />
            <DefenseHudTimerChip waveTimerSec={0} />
          </View>
          <DefenseHudEnemyBar onFieldEnemies={{ current: 10, max: 100 }} />
        </View>

          {showWaveStartBanner && !stageVictory ? (
            <DefenseWaveStartBanner waveNumber={waveNumber} />
          ) : null}
          <View style={styles.battleFieldStack}>
            <View style={styles.fieldColumn}>
              <DefenseBattleFieldPlaceholder
                unitZoneRef={unitZoneRef}
                placedTowers={placedTowers}
                onUnitZoneLayout={measureUnitZone}
                isDropTarget={isDropTarget}
                onCellSideChange={onBoardCellSide}
                onFieldEnemyCountChange={onFieldEnemyCount}
                isFrozen={
                  gameFrozen ||
                  stageVictory ||
                  bossTimedDefeat ||
                  defeatOverlayVisible
                }
                spawnEnemiesEnabled={spawnEnemiesEnabled}
                onRemovePlacedTower={onRemovePlacedTower}
                onPlacedTowerInfoPress={onPlacedTowerInfoPress}
                onEnemiesKilled={onEnemiesKilled}
                speedMultiplier={gameSpeedMult}
                activeWaveNumber={waveNumber}
                onBossHpForHud={onBossHpForHud}
              />
            </View>

            <DefenseBossWaveWarning visible={showBossWaveWarning} />

            {showWaveStartBanner && !stageVictory ? (
              <View style={styles.waveBannerFloat}>
                <DefenseWaveStartBanner waveNumber={waveNumber} />
              </View>
            ) : null}
          </View>

          {showManualNextWave ? (
            <DefenseManualNextWaveButton onPress={skipRestOfCurrentWave} />
          ) : null}

          {stageVictory ? <DefenseStageVictoryBanner /> : null}

          <View pointerEvents={stageVictory ? "none" : "auto"}>
          <View
            pointerEvents={
              stageVictory || bossTimedDefeat || defeatOverlayVisible
                ? "none"
                : "auto"
            }
          >
            <DefenseDeployBarPlaceholder
              currency={currency}
              dragCallbacks={dragCallbacks}
              chipSize={towerChipSize}
            />
          </View>
        </View>

        {dragging ? (
          <DefenseTowerDragRangeRing
            centerX={dragging.absX}
            centerY={dragging.absY}
            rangeDiameterPx={dragRangeDiameterPx}
          />
        ) : null}

        {/* 드래그 고스트 */}
        {dragging && (
          <View
            pointerEvents="none"
            style={[
              styles.ghost,
              {
                width: ghostSize,
                height: ghostSize,
                left: dragging.absX - ghostHalf,
                top: dragging.absY - ghostHalf,
                opacity: isDropTarget ? 0.9 : 0.5,
              },
            ]}
          >
            <Image
              source={dragging.unit.image}
              style={styles.ghostImage}
              resizeMode="contain"
            />
          </View>
        )}

        <View
          style={[
            styles.speedToggleWrap,
            {
              bottom:
                Math.max(insets.bottom, 16) +
                Math.round(DEFENSE_TOWER_DOCK_MIN_HEIGHT * 0.28),
              right: DEFENSE_SCREEN.paddingH,
            },
          ]}
          pointerEvents="box-none"
        >
          <DefenseGameSpeedToggle
            mult={gameSpeedMult}
            onToggle={toggleGameSpeed}
            disabled={stageVictory}
            disabled={stageVictory || bossTimedDefeat || defeatOverlayVisible}
          />
        </View>

        <DefenseTowerInfoModal
          visible={towerInfoUnitId != null}
          onClose={() => setTowerInfoUnitId(null)}
          unitId={towerInfoUnitId ?? ""}
        />

        <DefenseStageVictoryOverlay
          visible={stageVictory}
          onConfirm={exitToScenarioSelect}
        />
        <DefenseStageDefeatOverlay
          visible={defeatOverlayVisible}
          onConfirm={exitToScenarioSelect}
        />
      </SafeAreaView>
    );
  }
=======
        <View style={styles.spacerTop} />

        <View style={styles.fieldWrapper}>
          <DefenseBattleFieldPlaceholder
            unitZoneRef={unitZoneRef}
            placedTowers={placedTowers}
            onUnitZoneLayout={measureUnitZone}
            isDropTarget={isDropTarget}
          />
        </View>

        <View style={styles.spacerBottom} />
        <DefenseDeployBarPlaceholder currency={150} dragCallbacks={dragCallbacks} />
      </View>

      {dragging && (
        <View
          pointerEvents="none"
          style={[
            styles.ghost,
            {
              left: dragging.absX - GHOST_HALF,
              top: dragging.absY - GHOST_HALF,
              opacity: isDropTarget ? 0.9 : 0.5,
            },
          ]}
        >
          <Image
            source={dragging.unit.image}
            style={styles.ghostImage}
            resizeMode="contain"
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: APP_COLORS.ivory,
  },
  battleBody: {
    flex: 1,
    paddingHorizontal: 20,
    flexDirection: "column",
    gap: 20,
  },
  hudSection: {
    gap: 16,
  },
  hudTopRow: {
    flexDirection: "row",
    gap: 16,
  },
  backBtn: {
    position: "absolute",
    left: BACK_BTN_LEFT,
    zIndex: 30,
    width: BACK_BTN_SIZE,
    height: BACK_BTN_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  battleFieldStack: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    position: "relative",
  },
  waveBannerFloat: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 10,
    alignItems: "center",
    zIndex: 26,
    pointerEvents: "none",
  },
  fieldColumn: {
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
  ghost: {
    position: "absolute",
    zIndex: 100,
  },
  ghostImage: {
    width: "100%",
    height: "100%",
  },
  speedToggleWrap: {
    position: "absolute",
    zIndex: 35,
  },
  phaseColumn: {
    gap: DEFENSE_SCREEN.blockGap,
  },
  phaseTag: {
    fontSize: 13,
    fontWeight: "700",
    color: APP_COLORS.brownLight,
    fontFamily: "KotraHope",
    marginBottom: 4,
  },
  lockedBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 72,
  },
  lockedText: {
    fontSize: 16,
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: APP_COLORS.yellow,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: APP_COLORS.yellowDark,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
});
