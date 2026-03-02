//커스터마이징 화면
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Image, ImageBackground, ActivityIndicator } from "react-native";
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
import city1 from "../../assets/images/background/city-1.png";
import healthclub from "../../assets/images/background/healthclub.png";
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
  { name: '도시2', src: city1 },
  { name: '가을', src: fall },
  { name: '겨울', src: winter },
  { name: '헬스장', src: healthclub },
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
  const [isLoading, setIsLoading] = useState(false);
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
      setActiveClock(DEFAULT_CLOCK_NAME);
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
      setActiveClock(match.name);
    } else {
      // 매칭 실패 시 기본값(알람 시계)으로 설정
      updateClockSelection(DEFAULT_CLOCK_NAME);
      setActiveClock(DEFAULT_CLOCK_NAME);
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
                activeOpacity={0.7}
              >
                <Image
                  source={a.src}
                  style={{ width: 65, height: 65, resizeMode: 'contain' }}
                />
                <Text style={styles.optionText} numberOfLines={2}>{a.name}</Text>
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
                activeOpacity={0.7}
              >
                <Image
                  source={bg.src}
                  style={{ width: 75, height: 75, resizeMode: 'cover', borderRadius: 8 }}
                />
                <Text style={styles.optionText} numberOfLines={2}>{bg.name}</Text>
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
                  activeOpacity={0.7}
                >
                  <Image
                    source={clock.src}
                    style={{ width: 65, height: 65, resizeMode: 'contain' }}
                  />
                  <Text style={styles.optionText} numberOfLines={2}>{clock.name}</Text>
                </TouchableOpacity>
                ))}
              </View>
            );
          
      default:
        return null;
    }
  };

  const handleSave = async () => {
    // 중복 클릭 방지
    if (isLoading) return;
    
    const { animal, background, clock } = selectionsRef.current;
    const selectedAnimalData = animals.find(a => a.name === animal);
    const selectedBgData = backgrounds.find(bg => bg.name === background);
    const selectedClockData = clocks.find(c => c.name === clock);

    if (!selectedAnimalData) {
      Alert.alert("알림", "동물을 선택해주세요.");
      return;
    }

    setIsLoading(true);

    // 로컬 상태 업데이트
    setCustomization(
      selectedAnimalData?.src || null,
      selectedBgData?.src || null,
      selectedClockData?.src || null,
      selectedAnimalData?.id ?? null
    );

    // 서버에 저장
    try {
      const headers = await AuthManager.getAuthHeader();
      if (!headers.Authorization) {
        // 로그인하지 않은 경우 로컬만 저장
        setIsLoading(false);
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
        setIsLoading(false);
        Alert.alert("오류", data?.error ?? "커스터마이징 저장에 실패했습니다.");
        return;
      }

      setIsLoading(false);
      router.back();
    } catch (error) {
      setIsLoading(false);
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
            activeOpacity={0.8}
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
        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={[styles.saveButtonText, { marginLeft: 8 }]}>저장 중...</Text>
            </View>
          ) : (
            <Text style={styles.saveButtonText}>저장</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// 퀘스트 팝업 테마 컬러 (참조: 첫 번째 이미지)
const THEME_YELLOW = '#FFD54F';      // 밝은 노란색 - 활성 탭, 저장 버튼, 선택 테두리
const THEME_CREAM = '#FFF8E1';       // 오프화이트/연한 크림 - 본문, 비활성 탭 배경
const THEME_TEXT_DARK = '#333333';   // 짙은 회색 - 텍스트

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_CREAM,
  },
  previewContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: THEME_CREAM,
  },
  previewPetContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  homePreviewWrapper: {
    width: 380,
    height: 500,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
  },
  homePreviewBackground: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 45,
  },
  homePreviewBackgroundImage: {
    resizeMode: 'cover',
  },
  previewPetPlaceholder: {
    fontSize: 22,
    color: '#666',
    fontWeight: '500',
    fontFamily: 'KotraHope',
  },
  previewAnimal: {
    width: 220,
    height: 220,
    resizeMode: 'contain',
    marginLeft: 25,
  },
  previewClock: {
    position: 'absolute',
    top: 260,
    left: 20,
    width: 110,
    height: 110,
    resizeMode: 'contain',
  },
  menuContainer: {
    flexDirection: 'row',
    backgroundColor: THEME_CREAM,
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  menuTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: THEME_CREAM,
  },
  activeMenuTab: {
    backgroundColor: THEME_YELLOW,
    shadowColor: THEME_YELLOW,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  menuTabText: {
    fontSize: 17,
    color: THEME_TEXT_DARK,
    fontWeight: '500',
    fontFamily: 'KotraHope',
  },
  activeMenuTabText: {
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'KotraHope',
    fontSize: 17,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: THEME_CREAM,
    borderTopWidth: 1,
    borderTopColor: '#EDE7D6',
  },
  contentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
  },
  optionItem: {
    width: '30%',
    aspectRatio: 0.95,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E8E0C8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    padding: 8,
  },
  selectedOption: {
    borderColor: THEME_YELLOW,
    borderWidth: 3,
    backgroundColor: '#FFFDE7',
  },
  optionText: {
    fontSize: 16,
    color: THEME_TEXT_DARK,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'KotraHope',
    marginTop: 6,
    lineHeight: 20,
  },
  saveButtonContainer: {
    padding: 16,
    backgroundColor: THEME_CREAM,
    borderTopWidth: 1,
    borderTopColor: '#EDE7D6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 4,
  },
  saveButton: {
    backgroundColor: THEME_YELLOW,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: THEME_YELLOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 21,
    fontWeight: 'bold',
    fontFamily: 'KotraHope',
  },
  saveButtonDisabled: {
    backgroundColor: '#9E9E9E',
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
