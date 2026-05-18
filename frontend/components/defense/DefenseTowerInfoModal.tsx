import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";
import {
  formatDefenseTowerRangeCellsLabel,
  getDefenseTowerCombat,
} from "./defenseCombatConstants";
import { APP_COLORS } from "../../constants/theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  /** 표시용 유닛 식별자 */
  unitId: string;
};

function formatAttackIntervalSec(ms: number): string {
  const s = ms / 1000;
  const t = Number.isInteger(s) ? s.toFixed(0) : s.toFixed(1);
  return `${t}초마다 1회`;
}

export default function DefenseTowerInfoModal({
  visible,
  onClose,
  unitId,
}: Props) {
  const combat = getDefenseTowerCombat(unitId);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <Text style={styles.title}>타워 정보</Text>
          <Text style={styles.unitId}>{unitId}</Text>

          <View style={styles.rows}>
            <View style={styles.row}>
              <Text style={styles.label}>공격력</Text>
              <Text style={styles.value}>{combat.damage}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>사거리</Text>
              <Text style={styles.value}>
                {formatDefenseTowerRangeCellsLabel(unitId)}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>공격 속도</Text>
              <Text style={styles.value}>
                {formatAttackIntervalSec(combat.attackIntervalMs)}
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="닫기"
          >
            <Text style={styles.closeBtnText}>닫기</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  card: {
    width: "86%",
    maxWidth: 360,
    paddingVertical: 22,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: APP_COLORS.ivory,
    borderWidth: 2,
    borderColor: APP_COLORS.brown,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
    textAlign: "center",
    marginBottom: 6,
  },
  unitId: {
    fontSize: 16,
    fontWeight: "700",
    color: APP_COLORS.brownLight,
    fontFamily: "KotraHope",
    textAlign: "center",
    marginBottom: 18,
  },
  rows: {
    gap: 14,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  label: {
    width: 88,
    fontSize: 16,
    fontWeight: "700",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  value: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#2C2C2C",
    fontFamily: "KotraHope",
  },
  closeBtn: {
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 14,
    backgroundColor: APP_COLORS.brown,
  },
  closeBtnText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "KotraHope",
  },
});
