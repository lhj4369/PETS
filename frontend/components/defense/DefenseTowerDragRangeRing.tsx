import { View, StyleSheet } from "react-native";

type Props = {
  centerX: number;
  centerY: number;
  /** 전투 사거리와 동일한 원 지름(px) */
  rangeDiameterPx: number;
};

/**
 * 드래그 중에만 사용. 타워(고스트) 중심, 실제 사거리 지름과 맞춘 원.
 */
export default function DefenseTowerDragRangeRing({
  centerX,
  centerY,
  rangeDiameterPx,
}: Props) {
  const diameter = Math.max(1, rangeDiameterPx);
  const radius = diameter / 2;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          width: diameter,
          height: diameter,
          borderRadius: radius,
          left: centerX - radius,
          top: centerY - radius,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  ring: {
    position: "absolute",
    zIndex: 99,
    backgroundColor: "rgba(52, 152, 219, 0.2)",
    borderWidth: 2,
    borderColor: "rgba(41, 128, 185, 0.6)",
  },
});
