//커스터마이징 화면
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { useState } from "react";
import HomeButton from "../../components/HomeButton";

export default function CustomizeScreen() {
  const [selectedMenu, setSelectedMenu] = useState('동물');
  const [selectedAnimal, setSelectedAnimal] = useState('🐕');
  const [selectedBackground, setSelectedBackground] = useState('기본');
  const [selectedClock, setSelectedClock] = useState('기본');

  const menuItems = ['동물', '배경', '시계'];

  const animals = ['🐕', '🐱', '🐰', '🐻', '🐼', '🦊'];
  const backgrounds = ['기본', '숲', '바다', '도시', '우주'];
  const clocks = ['기본', '클래식', '모던', '미니멀'];

  const renderContent = () => {
    switch (selectedMenu) {
      case '동물':
        return (
          <View style={styles.contentGrid}>
            {animals.map((animal, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionItem,
                  selectedAnimal === animal && styles.selectedOption
                ]}
                onPress={() => setSelectedAnimal(animal)}
              >
                <Text style={styles.optionText}>{animal}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case '배경':
        return (
          <View style={styles.contentGrid}>
            {backgrounds.map((bg, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionItem,
                  selectedBackground === bg && styles.selectedOption
                ]}
                onPress={() => setSelectedBackground(bg)}
              >
                <Text style={styles.optionText}>{bg}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case '시계':
        return (
          <View style={styles.contentGrid}>
            {clocks.map((clock, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionItem,
                  selectedClock === clock && styles.selectedOption
                ]}
                onPress={() => setSelectedClock(clock)}
              >
                <Text style={styles.optionText}>{clock}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  const handleSave = () => {
    // 저장 로직 구현
    console.log('저장됨:', { selectedAnimal, selectedBackground, selectedClock });
  };

  return (
    <SafeAreaView style={styles.container}>
      <HomeButton />
      {/* 미리보기 영역 - 홈화면과 유사하지만 스탯 없이 */}
      <View style={styles.previewContainer}>
        <View style={styles.previewPetContainer}>
          <View style={styles.previewPetImage}>
            <Text style={styles.previewPetText}>{selectedAnimal}</Text>
            <Text style={styles.previewPetLabel}>동물 이미지</Text>
          </View>
        </View>
        
        <View style={styles.previewTimerButtons}>
          <TouchableOpacity style={styles.previewTimerButton}>
            <Text style={styles.previewTimerButtonText}>타이머</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 메뉴 탭 */}
      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.menuTab,
              selectedMenu === item && styles.activeMenuTab
            ]}
            onPress={() => setSelectedMenu(item)}
          >
            <Text style={[
              styles.menuTabText,
              selectedMenu === item && styles.activeMenuTabText
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 컨텐츠 영역 */}
      <ScrollView style={styles.contentContainer}>
        {renderContent()}
      </ScrollView>

      {/* 저장 버튼 */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>저장</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  previewContainer: {
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 20,
  },
  previewPetContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  previewPetImage: {
    width: 150,
    height: 150,
    backgroundColor: '#fff',
    borderRadius: 75,
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
  previewPetText: {
    fontSize: 60,
    marginBottom: 5,
  },
  previewPetLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  previewTimerButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  previewTimerButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewTimerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  menuContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 5,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeMenuTab: {
    backgroundColor: '#4CAF50',
  },
  menuTabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeMenuTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  optionItem: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0f8f0',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  saveButtonContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
