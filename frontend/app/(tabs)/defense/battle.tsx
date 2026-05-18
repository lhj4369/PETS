import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRef, useState } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import DefenseHudWaveChip from "../../../components/defense/DefenseHudWaveChip";
import DefenseHudTimerChip from "../../../components/defense/DefenseHudTimerChip";
import DefenseHudEnemyBar from "../../../components/defense/DefenseHudEnemyBar";
import DefenseBattleFieldPlaceholder from "../../../components/defense/DefenseBattleFieldPlaceholder";
import DefenseDeployBarPlaceholder, {
  type DragCallbacks,
} from "../../../components/defense/DefenseDeployBarPlaceholder";
import { APP_COLORS } from "../../../constants/theme";
import { DEFENSE_SCREEN, DEFENSE_TOWER_SIZE } from "../../../components/defense/defenseScreenTokens";
import type { PlacedTowerData, DragState } from "../../../components/defense/defenseTypes";

// ─── Layout constants ──────────────────────────────────────────────────────────

const BACK_BTN_LEFT = 16;
const BACK_BTN_SIZE = 28;
const ICON_SIZE = 20;
const BTN_TO_HUD_GAP = 6;

// ─── Drag constants ────────────────────────────────────────────────────────────

const TOWER_HALF = DEFENSE_TOWER_SIZE / 2;
const GHOST_SIZE = Math.round(DEFENSE_TOWER_SIZE * 1.25);
const GHOST_HALF = GHOST_SIZE / 2;

// ─── Types ─────────────────────────────────────────────────────────────────────

type Bounds = { x: number; y: number; w: number; h: number };

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function DefenseBattleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ── Tower placement state ──────────────────────────────────────────────────
  const [placedTowers, setPlacedTowers] = useState<PlacedTowerData[]>([]);
  const [dragging, setDragging] = useState<DragState | null>(null);

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
        setPlacedTowers((prev) => [
          ...prev,
          {
            id: `${cur.unit.unitId}-${Date.now()}`,
            unitId: cur.unit.unitId,
            image: cur.unit.image,
            x: Math.max(TOWER_HALF, Math.min(absX - b.x, b.w - TOWER_HALF)),
            y: Math.max(TOWER_HALF, Math.min(absY - b.y, b.h - TOWER_HALF)),
          },
        ]);
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
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        {/* HUD — 세 컴포넌트로 분리 */}
        <View style={styles.hudSection}>
          <View style={styles.hudTopRow}>
            <DefenseHudWaveChip wave={{ current: 6, total: 10 }} />
            <DefenseHudTimerChip waveTimerSec={45} />
          </View>
          <DefenseHudEnemyBar onFieldEnemies={{ current: 10, max: 100 }} />
        </View>

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

        <DefenseDeployBarPlaceholder
          currency={236}
          dragCallbacks={dragCallbacks}
        />
      </View>

      {/* Ghost image — follows finger during drag, must not intercept touches */}
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
    gap: 10,
  },
  hudSection: {
    gap: 8,
  },
  hudTopRow: {
    flexDirection: "row",
    gap: 8,
  },
  spacerTop: { flex: 3 },
  spacerBottom: { flex: 1 },
  fieldWrapper: {
    width: "100%",
    aspectRatio: 1.35,
  },
  ghost: {
    position: "absolute",
    width: GHOST_SIZE,
    height: GHOST_SIZE,
    zIndex: 100,
    opacity: 0.5, // overridden inline when isDropTarget
  },
  ghostImage: {
    width: "100%",
    height: "100%",
  },
});
