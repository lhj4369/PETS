import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { APP_COLORS } from "../../constants/theme";
import {
  getStubDialogueForStage,
  type StubScenarioStage,
} from "../../data/defenseStub";
import DefenseDialoguePanel from "./DefenseDialoguePanel";

type Props = {
  visible: boolean;
  stage: StubScenarioStage | null;
  onClose: () => void;
  /** 스킵 또는 마지막 대사 후 전투 화면으로 */
  onProceedToBattle: (stageId: string) => void;
};

/**
 * 시나리오 목록에서 스테이지 선택 시 — `DIALOGUE_BY_STAGE` 나레이션을 순서대로 표시.
 */
export default function DefenseStageDialogueModal({
  visible,
  stage,
  onClose,
  onProceedToBattle,
}: Props) {
  const { width, height } = useWindowDimensions();
  const [lineIndex, setLineIndex] = useState(0);

  const lines = useMemo(
    () => (stage ? getStubDialogueForStage(stage.id) : []),
    [stage]
  );

  useEffect(() => {
    if (visible && stage) {
      setLineIndex(0);
    }
  }, [visible, stage?.id]);

  const modalWidth = Math.min(width - 20, 440);
  const modalHeight = Math.round(Math.min(height * 0.5, 500, height * 0.85));

  const goBattle = () => {
    if (stage) onProceedToBattle(stage.id);
  };

  const handleNext = () => {
    if (lines.length === 0) {
      goBattle();
      return;
    }
    if (lineIndex < lines.length - 1) {
      setLineIndex((i) => i + 1);
    } else {
      goBattle();
    }
  };

  if (!stage) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={[styles.modal, { width: modalWidth, height: modalHeight }]}
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title} numberOfLines={1}>
                {stage.area}
              </Text>
              <Text style={styles.subtitle}>{stage.id}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <DefenseDialoguePanel
              lines={lines}
              lineIndex={lineIndex}
              speakerLabel="나레이션"
              onNext={handleNext}
              onSkipToBattle={goBattle}
              maxBoxHeight={280}
              lineFontSize={18}
              lineHeight={28}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modal: {
    flexDirection: "column",
    backgroundColor: APP_COLORS.ivory,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: APP_COLORS.yellow,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: APP_COLORS.yellow,
    borderBottomWidth: 2,
    borderBottomColor: APP_COLORS.yellowDark,
    gap: 8,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "600",
    color: APP_COLORS.brownLight,
    fontFamily: "KotraHope",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 20,
    color: APP_COLORS.brown,
    fontWeight: "600",
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    justifyContent: "center",
  },
});
