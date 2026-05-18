import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { APP_COLORS } from "../../constants/theme";

type Props = {
  lines: string[];
  speakerLabel?: string;
  /** 나레이션 라벨 + 대화 스킵 행 표시 (모달에선 보통 false) */
  showSpeakerAndSkip?: boolean;
  onNext: () => void;
  onSkipToBattle: () => void;
  nextLabel?: string;
  /** 기본 200 — 모달 등에서 넓게 쓸 때 지정 */
  maxBoxHeight?: number;
  /** 텍스트 박스 최소 높이 — 스테이지마다 모달 크기를 맞출 때 사용 */
  minBoxHeight?: number;
  /** 텍스트 박스 안쪽 패딩 */
  boxPadding?: number;
  /** 본문 글자 크기·행간 (모달 등에서 키울 때) */
  lineFontSize?: number;
  lineHeight?: number;
};

/**
 * 시나리오 스테이지 진입 시 대화 출력 — `lines` 전체를 한 번에 표시하고, 입장은 `onNext`로 진행.
 */
export default function DefenseDialoguePanel({
  lines,
  speakerLabel = "나레이션",
  showSpeakerAndSkip = true,
  onNext,
  onSkipToBattle,
  nextLabel = "입장",
  maxBoxHeight = 200,
  minBoxHeight,
  boxPadding = 16,
  lineFontSize = 15,
  lineHeight: lineHeightProp = 22,
}: Props) {
  return (
    <View style={[styles.wrap, !showSpeakerAndSkip && styles.wrapCompact]}>
      {showSpeakerAndSkip ? (
        <View style={styles.speakerRow}>
          <Text style={styles.speaker}>{speakerLabel}</Text>
          <TouchableOpacity onPress={onSkipToBattle} hitSlop={12}>
            <Text style={styles.skip}>대화 스킵 ▶</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <ScrollView
        style={[
          styles.box,
          { maxHeight: maxBoxHeight },
          minBoxHeight != null && { minHeight: minBoxHeight },
        ]}
        contentContainerStyle={[styles.boxInner, { padding: boxPadding }]}
      >
        {lines.map((line, i) => (
          <Text
            key={`${i}-${line.slice(0, 8)}`}
            style={[styles.line, { fontSize: lineFontSize, lineHeight: lineHeightProp }]}
          >
            {line}
          </Text>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.primaryBtn} onPress={onNext} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>{nextLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  wrapCompact: {
    gap: 14,
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
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: APP_COLORS.ivoryDark,
  },
  boxInner: {
    gap: 12,
  },
  line: {
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
