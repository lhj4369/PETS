//커스터마이징 화면
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Image } from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import HomeButton from "../../components/HomeButton";
import dog from "../../assets/images/animals/dog.png";
import capibara from "../../assets/images/animals/capibara.png";
import fox from "../../assets/images/animals/fox.png";
import ginipig from "../../assets/images/animals/ginipig.png";
import red_panda from "../../assets/images/animals/red_panda.png";
import spring from "../../assets/images/background/spring.png";
import summer from "../../assets/images/background/summer.png";
import fall from "../../assets/images/background/fall.png";
import winter from "../../assets/images/background/winter.png";
import city from "../../assets/images/background/city.png";
import home from "../../assets/images/background/home.png";
import cute from "../../assets/images/clocks/cute.png";
import alarm from "../../assets/images/clocks/alarm.png";
import sand from "../../assets/images/clocks/sand.png";
import mini from "../../assets/images/clocks/mini.png";
import { useCustomization } from "../../context/CustomizationContext";

const menuItems = ['동물', '배경', '시계'];

const animals = [
  { name: '강아지', src: dog },
  { name: '카피바라', src: capibara },
  { name: '사막여우', src: fox },
  { name: '기니피그', src: ginipig },
  { name: '레서판다', src: red_panda },
];

const backgrounds = [
  { name: '기본', src: home },
  { name: '봄', src: spring },
  { name: '여름', src: summer },
  { name: '도시', src: city },
  { name: '가을', src: fall },
  { name: '겨울', src: winter },
];

const clocks = [
  { name: "귀여운 시계", src: cute },
  { name: "알람 시계", src: alarm },
  { name: "모래 시계", src: sand },
  { name: "미니멀 시계", src: mini },
];

const DEFAULT_CLOCK_NAME = clocks[0].name;


export default function CustomizeScreen() {
  const { setCustomization, selectedAnimal, selectedBackground, selectedClock } = useCustomization();
  const [selectedMenu, setSelectedMenu] = useState('동물');
  const [activeAnimal, setActiveAnimal] = useState(() => {
    const match = animals.find(a => a.src === selectedAnimal);
    return match?.name ?? '강아지';
  });
  const [activeBackground, setActiveBackground] = useState(() => {
    const match = backgrounds.find(bg => bg.src === selectedBackground);
    return match?.name ?? '기본';
  });
  const [activeClock, setActiveClock] = useState(() => {
    if (!selectedClock) {
      return DEFAULT_CLOCK_NAME;
    }
    const match = clocks.find(clock => clock.src === selectedClock);
    return match?.name ?? DEFAULT_CLOCK_NAME;
  });

  useEffect(() => {
    const match = animals.find(a => a.src === selectedAnimal);
    if (match) {
      setActiveAnimal(match.name);
    }
  }, [selectedAnimal]);

  useEffect(() => {
    const match = backgrounds.find(bg => bg.src === selectedBackground);
    if (match) {
      setActiveBackground(match.name);
    }
  }, [selectedBackground]);

  useEffect(() => {
    if (!selectedClock) {
      setActiveClock(DEFAULT_CLOCK_NAME);
      return;
    }
    const match = clocks.find(clock => clock.src === selectedClock);
    if (match) {
      setActiveClock(match.name);
    }
  }, [selectedClock]);

  const renderContent = () => {
    switch (selectedMenu) {
      case '동물':
        return (
          <View style={styles.contentGrid}>
            {animals.map((a) => (
              <TouchableOpacity
                key={a.name}
                style={[
                  styles.optionItem,
                  activeAnimal === a.name && styles.selectedOption
                ]}
                onPress={() => setActiveAnimal(a.name)}
              >
                <Image
                  source={a.src}
                  style={{ width: 60, height: 60, resizeMode: 'contain' }}
                />
                <Text style={styles.optionText}>{a.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );
        case '배경':
          return (
            <View style={styles.contentGrid}>
              {backgrounds.map((bg) => (
                <TouchableOpacity
                  key={bg.name}
                  style={[
                    styles.optionItem,
                    activeBackground === bg.name && styles.selectedOption
                  ]}
                  onPress={() => setActiveBackground(bg.name)}
                >
                  <Image
                    source={bg.src}
                    style={{ width: 80, height: 80, resizeMode: 'cover', borderRadius: 10 }}
                  />
                  <Text style={styles.optionText}>{bg.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        
          case '시계':
            return (
              <View style={styles.contentGrid}>
                {clocks.map((clock) => (
                  <TouchableOpacity
                    key={clock.name}
                    style={[
                      styles.optionItem,
                      activeClock === clock.name && styles.selectedOption,
                    ]}
                    onPress={() => setActiveClock(clock.name)}
                  >
                    <Image
                      source={clock.src}
                      style={{ width: 70, height: 70, resizeMode: 'contain' }}
                    />
                    <Text style={styles.optionText}>{clock.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            );
          
      default:
        return null;
    }
  };

  const handleSave = () => {
    const selectedAnimalData = animals.find(a => a.name === activeAnimal);
    const selectedBgData = backgrounds.find(bg => bg.name === activeBackground);
    const selectedClockData = clocks.find(c => c.name === activeClock);

    setCustomization(
      selectedAnimalData?.src || null,
      selectedBgData?.src || null,
      selectedClockData?.src || null
    );

    router.back();
  };
  

  return (
    <SafeAreaView style={styles.container}>
      <HomeButton />
      {/* 미리보기 영역 - 홈화면과 유사하지만 스탯 없이 */}
      <View style={styles.previewContainer}>
        <View style={styles.previewPetContainer}>
          {(() => {
            const selectedAnimalData = animals.find(a => a.name === activeAnimal);
            const selectedBgData = backgrounds.find(bg => bg.name === activeBackground);
            const selectedClockData = clocks.find(clock => clock.name === activeClock);
            const isBackgroundMode = selectedMenu === '배경';
            const isClockMode = selectedMenu === '시계';
            const previewLabel = isBackgroundMode ? '배경 이미지' : isClockMode ? '시계 이미지' : '동물 이미지';

            const renderPreviewImage = () => {
              if (isBackgroundMode) {
                return selectedBgData ? (
                  <Image source={selectedBgData.src} style={styles.previewBackgroundImage} />
                ) : (
                  <Text style={styles.previewPetPlaceholder}>{previewLabel}</Text>
                );
              }

              if (isClockMode) {
                return selectedClockData ? (
                  <Image source={selectedClockData.src} style={styles.previewClockImage} />
                ) : (
                  <Text style={styles.previewPetPlaceholder}>{previewLabel}</Text>
                );
              }

              return selectedAnimalData ? (
                <Image source={selectedAnimalData.src} style={styles.previewAnimalImage} />
              ) : (
                <Text style={styles.previewPetPlaceholder}>{previewLabel}</Text>
              );
            };

            return (
              <>
                <View style={isBackgroundMode ? styles.previewBackgroundContainer : styles.previewPetImage}>
                  {renderPreviewImage()}
                </View>
                <Text style={styles.previewPetLabel}>{previewLabel}</Text>
              </>
            );
          })()}
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
    width: 220,
    height: 180,
    backgroundColor: '#fff',
    borderRadius: 16,
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
  previewPetImageAsset: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  previewPetPlaceholder: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  previewPetLabel: {
    marginTop: 8,
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
  previewBackgroundContainer: {
    width: 250,
    height: 230,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
  },
  previewBackgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  previewAnimalImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },  
  previewClockImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
});
