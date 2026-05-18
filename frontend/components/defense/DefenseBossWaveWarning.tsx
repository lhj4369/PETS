import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { APP_COLORS } from "../../constants/theme";
import { DEFENSE_BOSS_WAVE_NUMBER } from "./defenseWaveConstants";

type Props = {
  visible: boolean;
};

/**
 * 지정 웨이브(기본 2) 시작 배너와 같은 구간에, 보스 등장 경고 연출.
 */
export default function DefenseBossWaveWarning({ visible }: Props) {
  const blink = useRef(new Animated.Value(1)).current;
  const rim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      blink.stopAnimation();
      rim.stopAnimation();
      blink.setValue(1);
      rim.setValue(0);
      return;
    }
    const blinkLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, {
          toValue: 0.58,
          duration: 380,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(blink, {
          toValue: 1,
          duration: 380,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    const rimLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(rim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(rim, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    );
    blinkLoop.start();
    rimLoop.start();
    return () => {
      blinkLoop.stop();
      rimLoop.stop();
    };
  }, [visible, blink, rim]);

  if (!visible) return null;

  const borderColor = rim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(183, 28, 28, 0.75)", "rgba(255, 82, 82, 0.95)"],
  });

  return (
    <View style={styles.root} pointerEvents="none" accessibilityViewIsModal>
      <View style={styles.scrim} />
      <Animated.View style={[styles.card, { borderColor }]}>
        <Animated.Text style={[styles.warnLabel, { opacity: blink }]}>
          경고
        </Animated.Text>
        <Text style={styles.title}>보스 웨이브</Text>
        <Text style={styles.sub}>
          웨이브 {DEFENSE_BOSS_WAVE_NUMBER} — 보스가 출현합니다!
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(12, 4, 8, 0.62)",
  },
  card: {
    maxWidth: 340,
    paddingVertical: 22,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 3,
    backgroundColor: "rgba(45, 12, 18, 0.92)",
    alignItems: "center",
    gap: 8,
    shadowColor: "#ff1744",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  warnLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFCDD2",
    fontFamily: "KotraHope",
    letterSpacing: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFEBEE",
    fontFamily: "KotraHope",
    textAlign: "center",
  },
  sub: {
    fontSize: 15,
    fontWeight: "700",
    color: APP_COLORS.ivory,
    fontFamily: "KotraHope",
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.92,
  },
});
