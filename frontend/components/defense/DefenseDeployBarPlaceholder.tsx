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

// ─── Data ──────────────────────────────────────────────────────────────────────

export type TowerUnit = {
  id: string;
  image: ImageSourcePropType;
};

export const TOWER_UNITS: TowerUnit[] = [
  { id: "dog",       image: require("../../assets/images/animals/dog.png") },
  { id: "capybara",  image: require("../../assets/images/animals/capibara.png") },
  { id: "fox",       image: require("../../assets/images/animals/fox.png") },
  { id: "red_panda", image: require("../../assets/images/animals/red_panda.png") },
  { id: "ginipig",   image: require("../../assets/images/animals/ginipig.png") },
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
};

// ─── Draggable chip ────────────────────────────────────────────────────────────

type ChipProps = { unit: TowerUnit; dragCallbacks?: DragCallbacks };

function DraggableChip({ unit, dragCallbacks }: ChipProps) {
  // always hold latest callbacks — Gesture.Pan is created once (useMemo) and
  // reads cbRef.current at call time, so it always sees the freshest callbacks
  const cbRef = useRef(dragCallbacks);
  cbRef.current = dragCallbacks;

  // stable gesture object — recreating on every render causes RNGH to miss events
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
    // unit is stable (from module-level constant); cbRef.current always fresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.chip}>
        <Image source={unit.image} style={styles.chipImage} resizeMode="contain" />
      </View>
    </GestureDetector>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function DefenseDeployBarPlaceholder({ currency, dragCallbacks }: Props) {
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

      {/* RNGH ScrollView respects GestureDetector priority */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollRow}
      >
        {TOWER_UNITS.map((unit) => (
          <DraggableChip key={unit.id} unit={unit} dragCallbacks={dragCallbacks} />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  dock: {
    width: "100%",
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 8,
    gap: 12,
    borderTopWidth: 2,
    borderTopColor: APP_COLORS.ivoryDark,
    backgroundColor: APP_COLORS.ivory,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  dockTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  resourcePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: APP_COLORS.yellowDark,
  },
  resourceLabel: {
    fontSize: 12,
    color: APP_COLORS.brownLight,
    fontFamily: "KotraHope",
  },
  resourceValue: {
    fontSize: 16,
    fontWeight: "800",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  scrollRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  chip: {
    width: 80,
    height: 80,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: APP_COLORS.yellowDark,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  chipImage: {
    width: "100%",
    height: "100%",
  },
});
