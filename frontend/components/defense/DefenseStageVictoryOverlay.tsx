import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { APP_COLORS } from "../../constants/theme";

type Props = {
  visible: boolean;
  onConfirm: () => void;
};

/** 시나리오 스테이지 승리 — 확인 시 스테이지 선택으로 이동 */
export default function DefenseStageVictoryOverlay({
  visible,
  onConfirm,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityRole="alert">
          <Text style={styles.title}>승리했습니다!</Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={onConfirm}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="확인"
          >
            <Text style={styles.btnText}>확인</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    backgroundColor: APP_COLORS.ivory,
    borderWidth: 2,
    borderColor: "rgba(27, 94, 32, 0.75)",
    gap: 22,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  btn: {
    minWidth: 160,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    backgroundColor: APP_COLORS.yellow,
    borderWidth: 2,
    borderColor: APP_COLORS.yellowDark,
    alignItems: "center",
  },
  btnText: {
    fontSize: 17,
    fontWeight: "800",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
});
