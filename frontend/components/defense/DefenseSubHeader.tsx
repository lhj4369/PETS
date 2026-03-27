import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { APP_COLORS } from "../../constants/theme";
import { DEFENSE_SCREEN } from "./defenseScreenTokens";

type Props = {
  title: string;
};

export default function DefenseSubHeader({ title }: Props) {
  const router = useRouter();

  return (
    <View style={[styles.row, { paddingRight: DEFENSE_SCREEN.headerRightReserve }]}>
      <TouchableOpacity
        style={styles.back}
        onPress={() => router.back()}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="chevron-back" size={22} color={APP_COLORS.brown} />
        <Text style={styles.backText}>뒤로</Text>
      </TouchableOpacity>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  backText: {
    fontSize: 17,
    fontWeight: "600",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
});
