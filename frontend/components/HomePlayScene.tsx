import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  ImageSourcePropType,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import {
  DECORATION_ASSETS,
  DecorationId,
  HomeLayout,
} from "../utils/homeLayout";

export type PlacementTarget = "animal" | DecorationId | null;

type Props = {
  layout: HomeLayout;
  animalSource: ImageSourcePropType;
  petSize: number;
  petPanHandlers?: ReturnType<typeof PanResponder.create>["panHandlers"];
  petScaleAnim?: Animated.Value;
  /** 홈: 들어 올리기 드래그 시 오프셋(배치 모드에서는 미전달) */
  petOffsetX?: Animated.Value;
  petOffsetY?: Animated.Value;
  pickupShadowAnim?: Animated.Value;
  shadowScale?: Animated.AnimatedInterpolation<number>;
  shadowTranslateY?: Animated.AnimatedInterpolation<number>;
  placementTarget?: PlacementTarget;
  placementValid?: boolean;
  onAnimalDragTo?: (x: number, y: number) => void;
  onDecorationDragTo?: (id: DecorationId, x: number, y: number) => void;
  /** 커마: 배치 모드가 아닐 때 탭하면 해당 오브젝트 배치 모드 진입 */
  onRequestPlaceAnimal?: () => void;
  onRequestPlaceDecoration?: (id: DecorationId) => void;
};

/** 장식 표시 크기 — petSize 대비 (동물보다 살짝 키움) */
const DECORATION_DISPLAY_SCALE = 0.58;

export default function HomePlayScene({
  layout,
  animalSource,
  petSize,
  petPanHandlers,
  petScaleAnim,
  petOffsetX,
  petOffsetY,
  pickupShadowAnim,
  shadowScale,
  shadowTranslateY,
  placementTarget,
  placementValid = true,
  onAnimalDragTo,
  onDecorationDragTo,
  onRequestPlaceAnimal,
  onRequestPlaceDecoration,
}: Props) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const dragOrigin = useRef({ x: 0, y: 0 });
  const layoutRef = useRef(layout);
  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox({ w: width, h: height });
  }, []);

  const animalPlacementPan = useMemo(() => {
    if (!onAnimalDragTo) return null;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => placementTarget === "animal",
      onMoveShouldSetPanResponder: () => placementTarget === "animal",
      onPanResponderGrant: () => {
        const a = layoutRef.current.animal;
        dragOrigin.current = { x: a.x, y: a.y };
      },
      onPanResponderMove: (_, g) => {
        if (box.w <= 0 || box.h <= 0) return;
        onAnimalDragTo(
          clamp01(dragOrigin.current.x + g.dx / box.w),
          clamp01(dragOrigin.current.y + g.dy / box.h)
        );
      },
    });
  }, [placementTarget, onAnimalDragTo, box.w, box.h]);

  const decorationPlacementPan = useMemo(() => {
    if (!onDecorationDragTo || !placementTarget || placementTarget === "animal") return null;
    const decId = placementTarget as DecorationId;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        const d = layoutRef.current.decorations.find((x) => x.id === decId);
        dragOrigin.current = { x: d?.x ?? 0.5, y: d?.y ?? 0.5 };
      },
      onPanResponderMove: (_, g) => {
        if (box.w <= 0 || box.h <= 0) return;
        onDecorationDragTo(
          decId,
          clamp01(dragOrigin.current.x + g.dx / box.w),
          clamp01(dragOrigin.current.y + g.dy / box.h)
        );
      },
    });
  }, [placementTarget, onDecorationDragTo, box.w, box.h]);

  const cx = (x: number) => x * box.w;
  const cy = (y: number) => y * box.h;

  const borderStyle =
    placementTarget != null
      ? {
          borderWidth: 3,
          borderColor: placementValid ? "#22C55E" : "#EF4444",
          borderRadius: 12,
        }
      : {};

  const animalHandlers =
    placementTarget === "animal" && animalPlacementPan
      ? animalPlacementPan.panHandlers
      : petPanHandlers;

  const decSize = petSize * DECORATION_DISPLAY_SCALE;

  const renderAnimal = () => {
    if (box.w <= 0) return null;

    const baseLeft = cx(layout.animal.x) - petSize / 2;
    const baseTop = cy(layout.animal.y) - petSize / 2;
    const usePickup = petOffsetX != null && petOffsetY != null;

    const baseStyle = [
      styles.abs,
      {
        left: baseLeft,
        top: baseTop,
        width: petSize,
        height: petSize,
      },
      !usePickup && petScaleAnim ? { transform: [{ scale: petScaleAnim }] } : null,
      placementTarget === "animal" ? borderStyle : null,
    ];

    const img = <Image source={animalSource} style={styles.img} resizeMode="contain" />;

    const petContent = usePickup ? (
      <>
        <Animated.View
          style={{
            width: petSize,
            height: petSize,
            justifyContent: "center",
            alignItems: "center",
            transform: [
              { translateX: petOffsetX },
              { translateY: petOffsetY },
              ...(petScaleAnim ? [{ scale: petScaleAnim }] : []),
            ],
          }}
        >
          {img}
        </Animated.View>
        {pickupShadowAnim && shadowScale && shadowTranslateY ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.petShadow,
              {
                width: petSize * 0.65,
                opacity: pickupShadowAnim,
                transform: [
                  { translateX: petOffsetX },
                  { translateY: shadowTranslateY },
                  { scaleX: shadowScale },
                  { scaleY: shadowScale },
                ],
              },
            ]}
          />
        ) : null}
      </>
    ) : (
      img
    );

    if (placementTarget === "animal" && animalPlacementPan) {
      return (
        <Animated.View {...animalPlacementPan.panHandlers} style={[baseStyle]}>
          {petContent}
        </Animated.View>
      );
    }

    if (onRequestPlaceAnimal) {
      return (
        <Pressable
          onPress={onRequestPlaceAnimal}
          style={({ pressed }) => [baseStyle, pressed && styles.pressedDim]}
        >
          {petContent}
        </Pressable>
      );
    }

    return (
      <Animated.View {...animalHandlers} style={baseStyle}>
        {petContent}
      </Animated.View>
    );
  };

  return (
    <View style={styles.fill} onLayout={onLayout}>
      {box.w > 0 &&
        layout.decorations.map((d) => {
          const w = decSize;
          const h = decSize;
          const isActive = placementTarget === d.id;
          const posStyle = [
            styles.abs,
            {
              left: cx(d.x) - w / 2,
              top: cy(d.y) - h / 2,
              width: w,
              height: h,
            },
            isActive ? borderStyle : null,
          ];

          const imgEl = <Image source={DECORATION_ASSETS[d.id]} style={styles.img} resizeMode="contain" />;

          if (isActive && decorationPlacementPan) {
            return (
              <View key={d.id} {...decorationPlacementPan.panHandlers} style={posStyle}>
                {imgEl}
              </View>
            );
          }

          if (onRequestPlaceDecoration) {
            return (
              <Pressable
                key={d.id}
                onPress={() => onRequestPlaceDecoration(d.id)}
                style={({ pressed }) => [posStyle, pressed && styles.pressedDim]}
              >
                {imgEl}
              </Pressable>
            );
          }

          return (
            <View key={d.id} style={posStyle}>
              {imgEl}
            </View>
          );
        })}

      {renderAnimal()}
    </View>
  );
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

const styles = StyleSheet.create({
  fill: { flex: 1, width: "100%", position: "relative" },
  abs: { position: "absolute", justifyContent: "center", alignItems: "center" },
  img: { width: "100%", height: "100%" },
  petShadow: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    height: 18,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  pressedDim: { opacity: 0.85 },
});
