import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import Header from "../../components/Header";

export default function HomeScreen() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navigateToScreen = (screen: string) => {
    setIsMenuOpen(false);
    router.push(`/(tabs)/${screen}` as any);
  };

  const navigateToTimer = () => {
    router.push("/(tabs)/timer" as any);
  };

  return (
    <View style={styles.container}>
      {/* 우측 상단 메뉴 버튼 */}
      <Header showBackButton={false} showMenuButton={true} menuType="home" />
      {/* 메인 컨텐츠 */}
      <View style={styles.mainContent}>
        {/* 동물 이미지 영역 */}
        <View style={styles.petContainer}>
          {/* 상태창 - 동물 이미지 바로 위에 직사각형 */}
          <View style={styles.statusBar}>
            <Text style={styles.petName}>멍멍이</Text>
            <Text style={styles.statusText}>레벨 5 | 경험치 120/200</Text>
            
            {/* 스탯들 */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>힘</Text>
                <Text style={styles.statValue}>85</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>민첩</Text>
                <Text style={styles.statValue}>72</Text>
              </View>              
            </View>
          </View>
          
          <View style={styles.petImage}>
            <Text style={styles.petImageText}>🐕</Text>
            <Text style={styles.petImageLabel}>동물 이미지</Text>
          </View>
        </View>

        {/* 타이머 버튼들 */}
        <View style={styles.timerButtons}>
          <TouchableOpacity style={styles.timerButton} onPress={navigateToTimer}>
            <Text style={styles.timerButtonText}>타이머</Text>
          </TouchableOpacity>          
        </View>
      </View>      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  petName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 10,
    width: '100%',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
    height: 15,
    justifyContent: 'space-between',
  },
  menuLine: {
    height: 2,
    backgroundColor: '#333',
    borderRadius: 1,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  petContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  petImage: {
    width: 200,
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  petImageText: {
    fontSize: 80,
    marginBottom: 10,
  },
  petImageLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  timerButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  timerButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerButtonText: {
    color: '#fff',
    fontSize: 16,
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

