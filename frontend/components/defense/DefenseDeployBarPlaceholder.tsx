import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageSourcePropType,
} from "react-native";
import { ScrollView, Gesture, GestureDetector } from "react-native-gesture-handler";
import { useRef, useMemo } from "react";
import { APP_COLORS } from "../../constants/theme";
import type { DragUnit } from "./defenseTypes";
import { getTowerPlaceCost } from "./defenseTowerEconomy";

// ─── Data ──────────────────────────────────────────────────────────────────────

export type TowerUnit = {
  id: string;
  image: ImageSourcePropType;
  /** 배치 시 소모 자원 (타워별 상수에서 결정) */
  cost: number;
};

export const TOWER_UNITS: TowerUnit[] = [
  { id: "dog",       image: require("../../assets/images/animals/dog.png"),       cost: getTowerPlaceCost("dog") },
  { id: "capybara",  image: require("../../assets/images/animals/capibara.png"),  cost: getTowerPlaceCost("capybara") },
  { id: "fox",       image: require("../../assets/images/animals/fox.png"),       cost: getTowerPlaceCost("fox") },
  { id: "red_panda", image: require("../../assets/images/animals/red_panda.png"), cost: getTowerPlaceCost("red_panda") },
  { id: "ginipig",   image: require("../../assets/images/animals/ginipig.png"),   cost: getTowerPlaceCost("ginipig") },
];

// ─── Types ─────────────────────────────────────────────────────────────────────

export type DragCallbacks = {
  onDragStart: (unit: DragUnit, absX: number, absY: number) => void;
  onDragMove: (absX: number, absY: number) => void;
  onDragEnd: (absX: number, absY: number) => void;
  onDragCancel: () => void;
};

type Props = {
  currency?: number;
  dragCallbacks?: DragCallbacks;
  /** 배치 칸 한 변의 2/3 권장 — 미전달 시 기본 80 */
  chipSize?: number;
};

// ─── Draggable chip ────────────────────────────────────────────────────────────

type ChipProps = {
  unit: TowerUnit;
  chipSize: number;
  dragCallbacks?: DragCallbacks;
  canAfford: boolean;
};

function DraggableChip({ unit, chipSize, dragCallbacks, canAfford }: ChipProps) {
  const cbRef = useRef(dragCallbacks);
  cbRef.current = dragCallbacks;

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .onStart((e) => {
          cbRef.current?.onDragStart(
            { unitId: unit.id, image: unit.image },
            e.absoluteX,
            e.absoluteY,
          );
        })
        .onUpdate((e) => {
          cbRef.current?.onDragMove(e.absoluteX, e.absoluteY);
        })
        .onEnd((e) => {
          cbRef.current?.onDragEnd(e.absoluteX, e.absoluteY);
        })
        .onFinalize((_e, success) => {
          if (!success) cbRef.current?.onDragCancel();
        }),
    [],
  );

  const pad = Math.max(4, Math.round(chipSize * 0.1));
  const radius = Math.max(12, Math.round(chipSize * 0.22));

  return (
    <View style={[styles.chipColumn, { opacity: canAfford ? 1 : 0.42 }]}>
      <GestureDetector gesture={pan}>
        <View
          style={[
            styles.chip,
            {
              width: chipSize,
              height: chipSize,
              borderRadius: radius,
              padding: pad,
            },
          ]}
        >
          <Image source={unit.image} style={styles.chipImage} resizeMode="contain" />
        </View>
      </GestureDetector>
      <Text style={styles.costText}>비용 {unit.cost}</Text>
    </View>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function DefenseDeployBarPlaceholder({
  currency,
  dragCallbacks,
  chipSize: chipSizeProp,
}: Props) {
  const chipSize = chipSizeProp ?? 80;

  return (
    <View style={styles.dock}>
      <View style={styles.topRow}>
        <Text style={styles.dockTitle}>타워 선택</Text>
        {currency !== undefined && (
          <View style={styles.resourcePill}>
            <Text style={styles.resourceLabel}>보유 자원</Text>
            <Text style={styles.resourceValue}>{currency}</Text>
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        contentContainerStyle={styles.scrollRow}
      >
        {TOWER_UNITS.map((unit) => {
          const canAfford = currency === undefined || currency >= unit.cost;
          return (
            <DraggableChip
              key={unit.id}
              unit={unit}
              chipSize={chipSize}
              dragCallbacks={dragCallbacks}
              canAfford={canAfford}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  dock: {
    width: "100%",
    flexShrink: 0,
    paddingTop: 22,
    paddingBottom: 22,
    paddingHorizontal: 12,
    gap: 16,
    borderTopWidth: 2,
    borderTopColor: APP_COLORS.ivoryDark,
    backgroundColor: APP_COLORS.ivory,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  dockTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  resourcePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: APP_COLORS.yellowDark,
  },
  resourceLabel: {
    fontSize: 16,
    color: APP_COLORS.brownLight,
    fontFamily: "KotraHope",
  },
  resourceValue: {
    fontSize: 22,
    fontWeight: "800",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  scrollRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingVertical: 8,
    paddingHorizontal: 6,
    paddingRight: 24,
  },
  chipColumn: {
    alignItems: "center",
    gap: 6,
  },
  costText: {
    fontSize: 14,
    fontWeight: "700",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  chip: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: APP_COLORS.yellowDark,
    alignItems: "center",
    justifyContent: "center",
  },
  chipImage: {
    width: "100%",
    height: "100%",
  },
});
