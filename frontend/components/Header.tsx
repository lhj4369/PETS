import { View, TouchableOpacity, StyleSheet, Modal, Text, Image } from "react-native";
import { router } from "expo-router";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettingsModal } from "../context/SettingsModalContext";

interface HeaderProps {
  showBackButton?: boolean;
  showMenuButton?: boolean;
  menuType?: "home" | "timer" | "records" | "ranking" | "challenges" | "customize" | "chatting" | "quest";
}

export default function Header({ showBackButton = false, showMenuButton = true, menuType = "home" }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { openSettings } = useSettingsModal();

  const goBack = () => {
    router.back();
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleMenuSelect = (screen: string) => {
    setIsMenuOpen(false);
    if (screen === "settings") {
      openSettings();
    } else {
      router.push(`/(tabs)/${screen}` as any);
    }
  };

  const getMenuItems = () => {
    switch (menuType) {
      case 'timer':
        return [
          { label: '홈', screen: 'home' },   
          { label: '운동 기록', screen: 'records' },           
          { label: '랭킹', screen: 'ranking' },      
          { label: '기록 도전', screen: 'challenges' },            
          { label: '채팅', screen: 'chatting' },
          { label: '퀘스트', screen: 'quest' },
          { label: '커스터마이징', screen: 'customize' },
          { label: '설정', screen: 'settings' }, 
      ];
      case 'records':
        return [
          { label: '홈', screen: 'home' },
          { label: '타이머', screen: 'timer' },    
          { label: '랭킹', screen: 'ranking' },      
          { label: '기록 도전', screen: 'challenges' },            
          { label: '채팅', screen: 'chatting' },
          { label: '퀘스트', screen: 'quest' },
          { label: '커스터마이징', screen: 'customize' },
          { label: '설정', screen: 'settings' }, 
      ];
      case 'ranking':
        return [
          { label: '홈', screen: 'home' },
          { label: '타이머', screen: 'timer' },
          { label: '운동 기록', screen: 'records' },
          { label: '기록 도전', screen: 'challenges' },            
          { label: '채팅', screen: 'chatting' },
          { label: '퀘스트', screen: 'quest' },
          { label: '커스터마이징', screen: 'customize' },
          { label: '설정', screen: 'settings' }, 
      ];
      case 'challenges':
        return [
            { label: '홈', screen: 'home' },
            { label: '타이머', screen: 'timer' },
            { label: '운동 기록', screen: 'records' },
            { label: '랭킹', screen: 'ranking' },            
            { label: '채팅', screen: 'chatting' },
            { label: '퀘스트', screen: 'quest' },
            { label: '커스터마이징', screen: 'customize' },
            { label: '설정', screen: 'settings' }, 
        ];
      case "customize":
        return [
            { label: '홈', screen: 'home' },
            { label: '타이머', screen: 'timer' },
            { label: '운동 기록', screen: 'records' },
            { label: '랭킹', screen: 'ranking' },
            { label: '기록 도전', screen: 'challenges' },
            { label: '채팅', screen: 'chatting' },
            { label: '퀘스트', screen: 'quest' },
            { label: '설정', screen: 'settings' }, 
        ];
      case 'chatting':
        return [
            { label: '홈', screen: 'home' },
            { label: '타이머', screen: 'timer' },
            { label: '운동 기록', screen: 'records' },
            { label: '랭킹', screen: 'ranking' },
            { label: '기록 도전', screen: 'challenges' },
            { label: '퀘스트', screen: 'quest' },
            { label: '커스터마이징', screen: 'customize' },
            { label: '설정', screen: 'settings' },
        ];
      case 'quest':
        return [
            { label: '홈', screen: 'home' },
            { label: '타이머', screen: 'timer' },
            { label: '운동 기록', screen: 'records' },
            { label: '랭킹', screen: 'ranking' },
            { label: '기록 도전', screen: 'challenges' },
            { label: '채팅', screen: 'chatting' },
            { label: '커스터마이징', screen: 'customize' },
            { label: '설정', screen: 'settings' },
        ];
      default: // home
        return [
          { label: '타이머', screen: 'timer' },
          { label: '운동 기록', screen: 'records' },
          { label: '랭킹', screen: 'ranking' },
          { label: '기록 도전', screen: 'challenges' },
          { label: '채팅', screen: 'chatting' },
          { label: '퀘스트', screen: 'quest' },
          { label: '커스터마이징', screen: 'customize' },
          { label: '설정', screen: 'settings' },          
        ];
    }
  };

  const containerStyle = {
    ...styles.container,
    top: insets.top + 10, // Safe Area top + 추가 여백
    justifyContent: (showBackButton ? 'space-between' : 'flex-end') as 'space-between' | 'flex-end',
  };

  return (
    <View style={containerStyle}>
      {/* 좌측 상단 뒤로가기 버튼 */}
      {showBackButton && (
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Image 
            source={require('../assets/images/back_icon.png')} 
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}
      
      {/* 우측 상단 메뉴 버튼 */}
      {showMenuButton && (
        <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
          <Image 
            source={require('../assets/images/menu_icon.png')} 
            style={styles.menuIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}

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
            {getMenuItems().map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.menuItem} 
                onPress={() => handleMenuSelect(item.screen)}
              >
                <Text style={styles.menuItemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  menuButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  menuIcon: {
    width: 20,
    height: 20,
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
