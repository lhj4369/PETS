import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { APP_COLORS } from "../../constants/theme";

type Props = {
  lines: string[];
  lineIndex: number;
  speakerLabel?: string;
  onNext: () => void;
  onSkipToBattle: () => void;
  nextLabel?: string;
};

/**
 * 시나리오 스테이지 진입 시 대화 출력용 뼈대 (스크립트 데이터는 추후 외부화).
 */
export default function DefenseDialoguePanel({
  lines,
  lineIndex,
  speakerLabel = "나레이션",
  onNext,
  onSkipToBattle,
  nextLabel = "다음",
}: Props) {
  const isLast = lineIndex >= lines.length - 1;
  const visible = lines.slice(0, lineIndex + 1);

  return (
    <View style={styles.wrap}>
      <View style={styles.speakerRow}>
        <Text style={styles.speaker}>{speakerLabel}</Text>
        <TouchableOpacity onPress={onSkipToBattle} hitSlop={12}>
          <Text style={styles.skip}>대화 스킵 ▶</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.box} contentContainerStyle={styles.boxInner}>
        {visible.map((line, i) => (
          <Text key={`${i}-${line.slice(0, 8)}`} style={styles.line}>
            {line}
          </Text>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.primaryBtn} onPress={onNext} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>{isLast ? "전투 시작" : nextLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  speakerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  speaker: {
    fontSize: 15,
    fontWeight: "700",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  skip: {
    fontSize: 13,
    color: APP_COLORS.brownLight,
    fontFamily: "KotraHope",
  },
  box: {
    maxHeight: 200,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: APP_COLORS.ivoryDark,
  },
  boxInner: {
    padding: 16,
    gap: 10,
  },
  line: {
    fontSize: 15,
    lineHeight: 22,
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  primaryBtn: {
    backgroundColor: APP_COLORS.yellow,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: APP_COLORS.yellowDark,
  },
  primaryBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
});
