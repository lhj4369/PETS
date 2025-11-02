import { View, TouchableOpacity, StyleSheet, Modal, Text } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWindowDimensions } from "react-native";

export default function Navigator() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navigateToScreen = (path: string) => {
    setIsMenuOpen(false);
    router.push(path as any);
  };

  // 모든 화면 목록 (로그인 포함)
  const menuItems = [
    { label: '로그인', path: '/(auth)/login' },
    { label: '홈', path: '/home' },
    { label: '타이머', path: '/timer' },
    { label: '운동 기록', path: '/records' },
    { label: '랭킹', path: '/ranking' },
    { label: '기록 도전', path: '/challenges' },
    { label: '채팅', path: '/chatting' },
    { label: '업적', path: '/achievement' },
    { label: '커스터마이징', path: '/customize' },
    { label: '설정', path: '/settings' },
  ];

  // 좌측 중단 위치 계산 (9시 방향, 세로 중간)
  const buttonTop = insets.top + (height - insets.top - insets.bottom) / 2 - 25; // 버튼 높이(50)의 절반 빼기

  return (
    <>
      {/* 좌측 중단 메뉴 버튼 */}
      <TouchableOpacity 
        style={[
          styles.floatingButton,
          { top: buttonTop }
        ]} 
        onPress={toggleMenu}
      >
        <Text style={styles.buttonText}>☰</Text>
      </TouchableOpacity>

      {/* 플로팅 메뉴 */}
      <Modal
        visible={isMenuOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={closeMenu}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={closeMenu}>
          <View style={styles.floatingMenu}>
            <Text style={styles.menuTitle}>메뉴</Text>
            {menuItems.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.menuItem} 
                onPress={() => navigateToScreen(item.path)}
              >
                <Text style={styles.menuItemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    left: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 999,
  },
  buttonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  floatingMenu: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    width: 250,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
});

