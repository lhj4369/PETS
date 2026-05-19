import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Text,
  Pressable,
  ScrollView,
} from "react-native";
import { router, type Href } from "expo-router";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWindowDimensions } from "react-native";
import { useSettingsModal } from "../context/SettingsModalContext";

const MENU_ITEMS: { label: string; path: Href }[] = [
  { label: "로그인", path: "/" },
  { label: "홈", path: "/(tabs)/home" },
  { label: "타이머", path: "/(tabs)/timer" },
  { label: "운동 기록", path: "/(tabs)/records" },
  { label: "랭킹", path: "/(tabs)/ranking" },
  { label: "기록 도전", path: "/(tabs)/challenges" },
  { label: "채팅", path: "/(tabs)/chatting" },
  { label: "퀘스트", path: "/(tabs)/home?openQuest=1" },
  { label: "커스터마이징", path: "/(tabs)/customize" },
  { label: "디펜스", path: "/(tabs)/defense" },
  { label: "설정", path: "/settings" },
];

export default function Navigator() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { openSettings } = useSettingsModal();

  const closeMenu = () => setIsMenuOpen(false);

  const handleMenuSelect = (path: Href) => {
    closeMenu();
    // Android: 모달 닫힌 뒤 라우팅해야 메뉴 탭이 overlay에 삼켜지지 않음
    setTimeout(() => {
      if (path === "/settings") {
        openSettings();
      } else {
        router.push(path);
      }
    }, 80);
  };

  const buttonTop = insets.top + (height - insets.top - insets.bottom) / 2 - 25;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <TouchableOpacity
        style={[styles.floatingButton, { top: buttonTop }]}
        onPress={() => setIsMenuOpen((prev) => !prev)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="개발자 메뉴"
      >
        <Text style={styles.buttonText}>☰</Text>
      </TouchableOpacity>

      <Modal
        visible={isMenuOpen}
        transparent
        animationType="slide"
        onRequestClose={closeMenu}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closeMenu} />
          <View style={styles.floatingMenu}>
            <Text style={styles.menuTitle}>메뉴</Text>
            <ScrollView
              style={styles.menuScroll}
              contentContainerStyle={styles.menuScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {MENU_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.menuItem}
                  onPress={() => handleMenuSelect(item.path)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10000,
    elevation: 10000,
  },
  floatingButton: {
    position: "absolute",
    left: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 10001,
    elevation: 11,
  },
  buttonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    flexDirection: "row",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  floatingMenu: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    paddingTop: 20,
    width: 250,
    maxWidth: "82%",
    height: "100%",
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  menuScroll: {
    flex: 1,
  },
  menuScrollContent: {
    paddingBottom: 32,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
    paddingHorizontal: 20,
    color: "#333",
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
});
