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
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel="뒤로"
      >
        <Ionicons name="chevron-back" size={26} color={APP_COLORS.brown} />
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
    gap: 10,
    marginBottom: 6,
    minHeight: 36,
  },
  back: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    marginLeft: -4,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
});
