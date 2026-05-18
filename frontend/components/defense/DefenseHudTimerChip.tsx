import { View, Text, StyleSheet } from "react-native";

type Props = {
  waveTimerSec?: number;
  /** 보스 웨이브: 남은 시간을 「제한 시간」으로 표시하고 칩을 적색 톤으로 */
  isBossWave?: boolean;
};

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function DefenseHudTimerChip({
  waveTimerSec,
  isBossWave = false,
}: Props) {
  const label = waveTimerSec !== undefined ? formatTime(waveTimerSec) : "--:--";

  return (
    <View style={[styles.chip, isBossWave && styles.chipBoss]}>
      <Text style={[styles.subLabel, isBossWave && styles.subLabelBoss]}>
        {isBossWave ? "제한 시간" : "다음 웨이브"}
      </Text>
      <Text style={[styles.digits, isBossWave && styles.digitsBoss]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#5D4E37",
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 18,
  },
  chipBoss: {
    backgroundColor: "#7D1A1A",
    borderWidth: 2,
    borderColor: "rgba(255, 120, 120, 0.45)",
  },
  subLabel: {
    fontSize: 18,
    color: "rgba(255,255,255,0.6)",
    fontFamily: "KotraHope",
    letterSpacing: 0.8,
  },
  subLabelBoss: {
    color: "rgba(255, 210, 210, 0.95)",
  },
  digits: {
    fontSize: 48,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "KotraHope",
    fontVariant: ["tabular-nums"],
    lineHeight: 54,
  },
  digitsBoss: {
    color: "#FFF5F5",
  },
});
