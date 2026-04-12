import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useCallback, useMemo, useReducer, useRef, useState } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import DefenseHudWaveChip from "../../../components/defense/DefenseHudWaveChip";
import DefenseHudTimerChip from "../../../components/defense/DefenseHudTimerChip";
import DefenseHudEnemyBar from "../../../components/defense/DefenseHudEnemyBar";
import DefenseBattleFieldPlaceholder from "../../../components/defense/DefenseBattleFieldPlaceholder";
import DefenseTowerDragRangeRing from "../../../components/defense/DefenseTowerDragRangeRing";
import DefenseDangerBanner from "../../../components/defense/DefenseDangerBanner";
import DefenseDeployBarPlaceholder, {
  type DragCallbacks,
} from "../../../components/defense/DefenseDeployBarPlaceholder";
import { useDefenseDangerAndGameover } from "../../../components/defense/useDefenseDangerAndGameover";
import { useDefenseWaves } from "../../../components/defense/useDefenseWaves";
import DefenseWaveStartBanner from "../../../components/defense/DefenseWaveStartBanner";
import DefenseTowerInfoModal from "../../../components/defense/DefenseTowerInfoModal";
import { APP_COLORS } from "../../../constants/theme";
import DefenseGameSpeedToggle from "../../../components/defense/DefenseGameSpeedToggle";
import {
  DEFENSE_SCREEN,
  DEFENSE_TOWER_DOCK_MIN_HEIGHT,
} from "../../../components/defense/defenseScreenTokens";
import type { PlacedTowerData, DragState } from "../../../components/defense/defenseTypes";
import { snapAbsoluteToGridCell } from "../../../components/defense/defenseGrid";
import {
  DEFENSE_ENEMY_KILL_REWARD,
  DEFENSE_ENEMY_MAX_HP,
  DEFENSE_TOWER_COMBAT,
  getChallengeModeEnemySpawnHp,
  getDefenseTowerCombat,
} from "../../../components/defense/defenseCombatConstants";
import {
  createDefensePlacementState,
  defensePlacementReducer,
} from "../../../components/defense/defenseTowerEconomy";
import { DEFENSE_EARLY_NEXT_WAVE_IF_CLEAR_WITHIN_SEC } from "../../../components/defense/defenseWaveConstants";
import DefenseManualNextWaveButton from "../../../components/defense/DefenseManualNextWaveButton";

// ─── Layout constants ──────────────────────────────────────────────────────────

const BACK_BTN_LEFT = 16;
const BACK_BTN_SIZE = 56;
const ICON_SIZE = 40;
const BTN_TO_HUD_GAP = 12;

const FIELD_ENEMY_MAX = 100;

// ─── Types ─────────────────────────────────────────────────────────────────────

type Bounds = { x: number; y: number; w: number; h: number };

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function DefenseBattleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string | string[] }>();
  const modeParam = params.mode;
  const mode =
    modeParam == null
      ? undefined
      : Array.isArray(modeParam)
        ? modeParam[0]
        : modeParam;
  const isChallengeMode = mode === "challenge";

  // ── Tower placement state ──────────────────────────────────────────────────
  const [{ placedTowers, currency }, dispatchPlacement] = useReducer(
    defensePlacementReducer,
    236,
    createDefensePlacementState,
  );
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [placementCellSide, setPlacementCellSide] = useState(0);
  const [fieldEnemyCount, setFieldEnemyCount] = useState(0);
  const [towerInfoUnitId, setTowerInfoUnitId] = useState<string | null>(null);
  const [gameSpeedMult, setGameSpeedMult] = useState<1 | 2>(1);

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

  const {
    waveNumber,
    showWaveStartBanner,
    secondsUntilNextWave,
    spawnEnemiesEnabled,
    allWavesComplete,
    skipRestOfCurrentWave,
  } = useDefenseWaves(gameFrozen, { speedMultiplier: gameSpeedMult });

  const enemySpawnMaxHp = useMemo(
    () =>
      isChallengeMode
        ? getChallengeModeEnemySpawnHp(waveNumber)
        : DEFENSE_ENEMY_MAX_HP,
    [isChallengeMode, waveNumber]
  );

  const toggleGameSpeed = useCallback(() => {
    setGameSpeedMult((v) => (v === 1 ? 2 : 1));
  }, []);

  const showManualNextWave =
    !gameFrozen &&
    fieldEnemyCount === 0 &&
    secondsUntilNextWave > 0 &&
    secondsUntilNextWave <= DEFENSE_EARLY_NEXT_WAVE_IF_CLEAR_WITHIN_SEC &&
    !allWavesComplete;

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

  // ref mirrors dragging state so callbacks always read the latest value
  const draggingRef = useRef<DragState | null>(null);

  // unit zone measurement
  const unitZoneRef = useRef<View>(null);
  const unitZoneBounds = useRef<Bounds | null>(null);

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

  // ── Drag callbacks (stable ref pattern in DraggableChip, so recreation is OK)
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

  const isDropTarget = dragging ? isInZone(dragging.absX, dragging.absY) : false;

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

  // ── Layout offsets ─────────────────────────────────────────────────────────
  const btnTop = Math.max(insets.top + 4, 12);
  const hudTop = btnTop + BACK_BTN_SIZE + BTN_TO_HUD_GAP;

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
      {/* Back button — floats above HUD */}
      <TouchableOpacity
        style={[styles.backBtn, { top: btnTop }]}
        onPress={() => router.back()}
        activeOpacity={0.5}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel="이전 화면"
      >
        <Image
          source={require("../../../assets/images/back_icon.png")}
          style={[styles.backIcon, { tintColor: APP_COLORS.brown }]}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Main layout */}
      <View
        style={[
          styles.body,
          {
            paddingTop: hudTop,
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
      >
        <View style={styles.hudSection}>
          <View style={styles.hudTopRow}>
            <DefenseHudWaveChip
              wave={{
                current: waveNumber,
                total: isChallengeMode ? "∞" : 10,
              }}
            />
            <DefenseHudTimerChip waveTimerSec={secondsUntilNextWave} />
          </View>
          <DefenseHudEnemyBar
            onFieldEnemies={{ current: fieldEnemyCount, max: FIELD_ENEMY_MAX }}
          />
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
            isFrozen={gameFrozen}
            spawnEnemiesEnabled={spawnEnemiesEnabled}
            onRemovePlacedTower={onRemovePlacedTower}
            onPlacedTowerInfoPress={onPlacedTowerInfoPress}
            onEnemiesKilled={onEnemiesKilled}
            speedMultiplier={gameSpeedMult}
            enemySpawnMaxHp={enemySpawnMaxHp}
          />
        </View>

        {showWaveStartBanner ? (
          <DefenseWaveStartBanner waveNumber={waveNumber} />
        ) : null}

        {showManualNextWave ? (
          <DefenseManualNextWaveButton onPress={skipRestOfCurrentWave} />
        ) : null}

        <DefenseDeployBarPlaceholder
          currency={currency}
          dragCallbacks={dragCallbacks}
          chipSize={towerChipSize}
        />
      </View>

      {/* 드래그 중 사거리(원) — 손 떼면 제거; 고스트보다 아래 */}
      {dragging ? (
        <DefenseTowerDragRangeRing
          centerX={dragging.absX}
          centerY={dragging.absY}
          rangeDiameterPx={dragRangeDiameterPx}
        />
      ) : null}

      {/* Ghost image — follows finger during drag, must not intercept touches */}
      <DefenseTowerInfoModal
        visible={towerInfoUnitId != null}
        onClose={() => setTowerInfoUnitId(null)}
        unitId={towerInfoUnitId ?? ""}
      />

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
        <DefenseGameSpeedToggle mult={gameSpeedMult} onToggle={toggleGameSpeed} />
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: APP_COLORS.ivory,
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
  body: {
    flex: 1,
    paddingHorizontal: DEFENSE_SCREEN.paddingH,
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
  /** aspectRatio 제거: 남는 높이만 쓰고 하단 타워 바가 항상 보이게 */
  fieldColumn: {
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
  ghost: {
    position: "absolute",
    zIndex: 100,
    opacity: 0.5, // overridden inline when isDropTarget
  },
  ghostImage: {
    width: "100%",
    height: "100%",
  },
  speedToggleWrap: {
    position: "absolute",
    zIndex: 35,
  },
});
