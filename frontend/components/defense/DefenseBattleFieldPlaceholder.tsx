import { View, StyleSheet, Image } from "react-native";
import type { RefObject } from "react";
import type { PlacedTowerData } from "./defenseTypes";
import { DEFENSE_TOWER_SIZE } from "./defenseScreenTokens";

const WAVE_BORDER = "#E57373";
const PLACE_BORDER = "#42A5F5";
const DROP_BORDER = "#1E90FF";
const ZONE_GAP = 22;
const HALF = DEFENSE_TOWER_SIZE / 2;

type Props = {
  unitZoneRef?: RefObject<View | null>;
  placedTowers?: PlacedTowerData[];
  onUnitZoneLayout?: () => void;
  isDropTarget?: boolean;
};

export default function DefenseBattleFieldPlaceholder({
  unitZoneRef,
  placedTowers = [],
  onUnitZoneLayout,
  isDropTarget = false,
}: Props) {
  return (
    <View style={styles.field}>
      <View style={styles.waveZone}>
        <View
          ref={unitZoneRef}
          style={[styles.unitZone, isDropTarget && styles.unitZoneTarget]}
          onLayout={onUnitZoneLayout}
        >
          {placedTowers.map((t) => (
            <Image
              key={t.id}
              source={t.image}
              style={[styles.tower, { left: t.x - HALF, top: t.y - HALF }]}
              resizeMode="contain"
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flex: 1,
    width: "100%",
  },
  waveZone: {
    flex: 1,
    width: "100%",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: WAVE_BORDER,
    borderRadius: 14,
    backgroundColor: "rgba(229,115,115,0.10)",
    padding: ZONE_GAP,
  },
  unitZone: {
    flex: 1,
    width: "100%",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: PLACE_BORDER,
    borderRadius: 10,
    backgroundColor: "rgba(66,165,245,0.14)",
    overflow: "hidden",
  },
  unitZoneTarget: {
    borderColor: DROP_BORDER,
    borderStyle: "solid",
    backgroundColor: "rgba(30,144,255,0.22)",
  },
  tower: {
    position: "absolute",
    width: DEFENSE_TOWER_SIZE,
    height: DEFENSE_TOWER_SIZE,
  },
});
