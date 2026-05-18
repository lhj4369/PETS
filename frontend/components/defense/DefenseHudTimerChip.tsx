import { View, Text, StyleSheet } from "react-native";

type Props = {
  waveTimerSec?: number;
};

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function DefenseHudTimerChip({ waveTimerSec }: Props) {
  const label = waveTimerSec !== undefined ? formatTime(waveTimerSec) : "--:--";

  return (
    <View style={styles.chip}>
      <Text style={styles.subLabel}>다음 웨이브</Text>
      <Text style={styles.digits}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    backgroundColor: "#5D4E37",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  subLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    fontFamily: "KotraHope",
    letterSpacing: 0.5,
  },
  digits: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "KotraHope",
    fontVariant: ["tabular-nums"],
    lineHeight: 30,
  },
});
