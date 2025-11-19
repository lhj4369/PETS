//커스터마이징 화면
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Image, ImageBackground } from "react-native";
import { useEffect, useState, useRef } from "react";
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
import AuthManager from "../../utils/AuthManager";
import API_BASE_URL from "../../config/api";
import { getBackgroundTypeFromImage, getClockTypeFromImage, getClockImageFromType } from "../../utils/customizationUtils";
import { Alert } from "react-native";

const menuItems = ['동물', '배경', '시계'];

const animals = [
  { name: '강아지', id: 'dog', src: dog }, 
  { name: '카피바라', id: 'capybara', src: capibara },
  { name: '사막여우', id: 'fox', src: fox },
  { name: '기니피그', id: 'guinea_pig', src: ginipig },
  { name: '레서판다', id: 'red_panda', src: red_panda },
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

const DEFAULT_CLOCK_NAME = clocks[1].name; // 알람 시계


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
    // 이미지 소스 직접 비교 대신 타입 기반으로 찾기
    const clockType = getClockTypeFromImage(selectedClock);
    const match = clocks.find(clock => {
      const clockTypeFromSrc = getClockTypeFromImage(clock.src);
      return clockTypeFromSrc === clockType;
    });
    // 매칭 실패 시 기본값(알람 시계) 반환
    return match?.name ?? DEFAULT_CLOCK_NAME;
  });

  const defaultClockImage = clocks.find(clock => clock.name === DEFAULT_CLOCK_NAME)?.src ?? clocks[0].src;
  const selectedAnimalData = animals.find(a => a.name === activeAnimal);
  const selectedBgData = backgrounds.find(bg => bg.name === activeBackground);
  const selectedClockData = clocks.find(clock => clock.name === activeClock);

  const selectionsRef = useRef({
    animal: activeAnimal,
    background: activeBackground,
    clock: activeClock,
  });

  const updateAnimalSelection = (name: string) => {
    selectionsRef.current.animal = name;
    setActiveAnimal(name);
  };

  const updateBackgroundSelection = (name: string) => {
    selectionsRef.current.background = name;
    setActiveBackground(name);
  };

  const updateClockSelection = (name: string) => {
    selectionsRef.current.clock = name;
    setActiveClock(name);
  };

  useEffect(() => {
    const match = animals.find(a => a.src === selectedAnimal);
    if (match) {
      setActiveAnimal(match.name);
      selectionsRef.current.animal = match.name;
    }
  }, [selectedAnimal]);

  useEffect(() => {
    const match = backgrounds.find(bg => bg.src === selectedBackground);
    if (match) {
      setActiveBackground(match.name);
      selectionsRef.current.background = match.name;
    }
  }, [selectedBackground]);

  useEffect(() => {
    if (!selectedClock) {
      updateClockSelection(DEFAULT_CLOCK_NAME);
      return;
    }
    // 이미지 소스 직접 비교 대신 타입 기반으로 찾기
    const clockType = getClockTypeFromImage(selectedClock);
    const match = clocks.find(clock => {
      const clockTypeFromSrc = getClockTypeFromImage(clock.src);
      return clockTypeFromSrc === clockType;
    });
    if (match) {
      updateClockSelection(match.name);
    } else {
      // 매칭 실패 시 기본값(알람 시계)으로 설정
      updateClockSelection(DEFAULT_CLOCK_NAME);
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
                onPress={() => updateAnimalSelection(a.name)}
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
                  onPress={() => updateBackgroundSelection(bg.name)}
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
                    onPress={() => updateClockSelection(clock.name)}
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

  const handleSave = async () => {
    const { animal, background, clock } = selectionsRef.current;
    const selectedAnimalData = animals.find(a => a.name === animal);
    const selectedBgData = backgrounds.find(bg => bg.name === background);
    const selectedClockData = clocks.find(c => c.name === clock);

    if (!selectedAnimalData) {
      Alert.alert("알림", "동물을 선택해주세요.");
      return;
    }

    // 로컬 상태 업데이트
    setCustomization(
      selectedAnimalData?.src || null,
      selectedBgData?.src || null,
      selectedClockData?.src || null
    );

    // 서버에 저장
    try {
      const headers = await AuthManager.getAuthHeader();
      if (!headers.Authorization) {
        // 로그인하지 않은 경우 로컬만 저장
        router.back();
        return;
      }

      const backgroundType = getBackgroundTypeFromImage(selectedBgData?.src || null);
      const clockType = getClockTypeFromImage(selectedClockData?.src || null);
      const animalType = selectedAnimalData?.id || null;

      const response = await fetch(`${API_BASE_URL}/api/auth/customization`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          animalType,
          backgroundType,
          clockType,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        Alert.alert("오류", data?.error ?? "커스터마이징 저장에 실패했습니다.");
        return;
      }

      router.back();
    } catch (error) {
      console.error("커스터마이징 저장 실패:", error);
      Alert.alert("오류", "커스터마이징 저장 중 문제가 발생했습니다.");
    }
  };
  

  return (
    <SafeAreaView style={styles.container}>
      <HomeButton />
      {/* 미리보기 영역 - 홈화면과 동일 구성 */}
      <View style={styles.previewContainer}>
        <View style={styles.previewPetContainer}>
          <View style={styles.homePreviewWrapper}>
            <ImageBackground
              source={selectedBgData?.src ?? home}
              style={styles.homePreviewBackground}
              imageStyle={styles.homePreviewBackgroundImage}
            >
              <Image source={selectedClockData?.src ?? defaultClockImage} style={styles.previewClock} />
              {selectedAnimalData ? (
                <Image source={selectedAnimalData.src} style={styles.previewAnimal} />
              ) : (
                <Text style={styles.previewPetPlaceholder}>동물을 선택해주세요</Text>
              )}
            </ImageBackground>
          </View>
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
    paddingTop: 40,
    paddingBottom: 0,
  },
  previewPetContainer: {
    alignItems: 'center',
  },
  homePreviewWrapper: {
    width: 300,
    height: 350,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#ddd',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  homePreviewBackground: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 32,
  },
  homePreviewBackgroundImage: {
    resizeMode: 'cover',
  },
  previewPetPlaceholder: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  

    fontFamily: 'KotraHope',},
  previewAnimal: {
    width: 170,
    height: 170,
    resizeMode: 'contain',
    marginLeft: 25,
  },
  previewClock: {
    position: 'absolute',
    top: 180,
    left: 10,
    width: 90,
    height: 90,
    resizeMode: 'contain',
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
    fontSize: 20,
    color: '#666',
    fontWeight: '500',
  

    fontFamily: 'KotraHope',},
  activeMenuTabText: {
    color: '#fff',
    fontWeight: 'bold',
  

    fontFamily: 'KotraHope',},
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
    fontSize: 20,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  

    fontFamily: 'KotraHope',},
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
    fontSize: 22,
    fontWeight: 'bold',
  

    fontFamily: 'KotraHope',},
});
