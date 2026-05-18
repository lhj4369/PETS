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
import DefenseDeployBarPlaceholder, {
  type DragCallbacks,
} from "../../../../components/defense/DefenseDeployBarPlaceholder";
import { APP_COLORS } from "../../../../constants/theme";
import { DEFENSE_TOWER_SIZE } from "../../../../components/defense/defenseScreenTokens";
import type { PlacedTowerData, DragState } from "../../../../components/defense/defenseTypes";
import { STUB_SCENARIO_STAGES } from "../../../../data/defenseStub";

const BACK_BTN_LEFT = 16;
const BACK_BTN_SIZE = 28;
const ICON_SIZE = 20;
const BTN_TO_HUD_GAP = 6;

const TOWER_HALF = DEFENSE_TOWER_SIZE / 2;
const GHOST_SIZE = Math.round(DEFENSE_TOWER_SIZE * 1.25);
const GHOST_HALF = GHOST_SIZE / 2;

type Bounds = { x: number; y: number; w: number; h: number };

/**
 * 시나리오 스테이지 전투 — 대화는 시나리오 목록 모달에서 진행 후 진입.
 */
export default function DefenseStageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const stageId = id ?? "?";

  const [placedTowers, setPlacedTowers] = useState<PlacedTowerData[]>([]);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const draggingRef = useRef<DragState | null>(null);
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
    gap: 10,
  },
  hudSection: {
    gap: 8,
  },
  hudTopRow: {
    flexDirection: "row",
    gap: 8,
  },
  spacerTop: {
    flex: 3,
  },
  spacerBottom: {
    flex: 1,
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
  fieldWrapper: {
    width: "100%",
    aspectRatio: 1.35,
  },
  ghost: {
    position: "absolute",
    width: GHOST_SIZE,
    height: GHOST_SIZE,
    zIndex: 100,
  },
  ghostImage: {
    width: "100%",
    height: "100%",
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
