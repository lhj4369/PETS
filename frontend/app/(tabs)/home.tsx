import { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  ImageSourcePropType,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import AuthManager from "../../utils/AuthManager";
import API_BASE_URL from "../../config/api";
import ChatBubbleButton from "../../components/ChatBubbleButton";
import SettingsButton from "../../components/SettingsButton";
import RankingButton from "../../components/RankingButton";
import { useCustomization, DEFAULT_ANIMAL_IMAGE, DEFAULT_BACKGROUND_IMAGE } from "../../context/CustomizationContext";
import { getBackgroundTypeFromImage, getClockTypeFromImage, getBackgroundImageFromType, getClockImageFromType } from "../../utils/customizationUtils";

const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

const ANIMAL_OPTIONS = [
  { id: "dog", label: "강아지", image: require("../../assets/images/animals/dog.png") },
  { id: "capybara", label: "카피바라", image: require("../../assets/images/animals/capibara.png") },
  { id: "fox", label: "여우", image: require("../../assets/images/animals/fox.png") },
  { id: "red_panda", label: "레서판다", image: require("../../assets/images/animals/red_panda.png") },
  { id: "guinea_pig", label: "기니피그", image: require("../../assets/images/animals/ginipig.png") },
] as const;

type AnimalId = (typeof ANIMAL_OPTIONS)[number]["id"];

type ProfileResponse = {
  account?: {
    id: number;
    name: string;
    email: string;
  } | null;
  profile?: {
    animalType: AnimalId | null;
    nickname: string | null;
    height: number | null;
    weight: number | null;
    level?: number | null;
    experience?: number | null;
    strength?: number | null;
    agility?: number | null;
    stamina?: number | null;
    concentration?: number | null;
    backgroundType?: string | null;
    clockType?: string | null;
  } | null;
};

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const scale = Math.min(screenWidth / BASE_WIDTH, screenHeight / BASE_HEIGHT);

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showAnimalModal, setShowAnimalModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [pendingAnimal, setPendingAnimal] = useState<AnimalId | null>(null);
  const [showAnimalConfirm, setShowAnimalConfirm] = useState(false);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);

  const [selectedAnimalId, setSelectedAnimalId] = useState<AnimalId | null>(null);
  const [nickname, setNickname] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [accountName, setAccountName] = useState("");
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  const [strength, setStrength] = useState(0);
  const [agility, setAgility] = useState(0);
  const [stamina, setStamina] = useState(0);
  const [concentration, setConcentration] = useState(0);
  const { selectedAnimal, selectedBackground, selectedClock, setCustomization, loadCustomizationFromServer } = useCustomization();

  // 동물 ID를 이미지 소스로 변환하는 함수
  const getAnimalImage = (animalId: AnimalId | null): ImageSourcePropType => {
    if (!animalId) return DEFAULT_ANIMAL_IMAGE;
    const animal = ANIMAL_OPTIONS.find((a) => a.id === animalId);
    return animal?.image ?? DEFAULT_ANIMAL_IMAGE;
  };

  const petSize = Math.min(240, screenWidth * 0.5);
  const buttonSize = Math.max(60, Math.min(100, screenWidth * 0.25));
  const cardHeight = Math.max(140, Math.min(200, screenWidth * 0.45));
  const clockIconSize = Math.max(60, Math.min(100, screenWidth * 0.25));
  const trophyWidth = buttonSize * 1.1;
  const trophyHeight = buttonSize * 1.3;
  const calendarWidth = buttonSize * 1.2;
  const calendarHeight = buttonSize * 1.2;

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoadingProfile(true);
      const headers = await AuthManager.getAuthHeader();
      if (!headers.Authorization) {
        router.replace("/(auth)/login" as any);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/me`, { headers });

      if (response.status === 401) {
        await AuthManager.logout();
        router.replace("/(auth)/login" as any);
        return;
      }

      if (!response.ok) {
        throw new Error("사용자 정보를 불러오지 못했습니다.");
      }

      const data = (await response.json()) as ProfileResponse;

      setAccountName(data.account?.name ?? "");

      if (data.profile) {
        const animalType = data.profile.animalType ?? null;
        const nicknameValue = data.profile.nickname ?? "";
        const hasAnimal = !!animalType;
        const hasNickname = !!nicknameValue;

        setSelectedAnimalId(animalType);
        setNickname(nicknameValue);
        setHeight(
          data.profile.height !== null && data.profile.height !== undefined
            ? String(data.profile.height)
            : ""
        );
        setWeight(
          data.profile.weight !== null && data.profile.weight !== undefined
            ? String(data.profile.weight)
            : ""
        );
        setLevel(data.profile.level ?? 1);
        setStrength(data.profile.strength ?? 0);
        setAgility(data.profile.agility ?? 0);
        setStamina(data.profile.stamina ?? 0);
        setConcentration(data.profile.concentration ?? 0);
        
        // 경험치 계산: 스탯 합산
        const totalStats = (data.profile.strength ?? 0) + (data.profile.agility ?? 0) + (data.profile.stamina ?? 0) + (data.profile.concentration ?? 0);
        setExperience(totalStats);
        
        // 서버에서 받은 커스터마이징 정보로 이미지 가져오기
        const serverBackground = getBackgroundImageFromType(data.profile?.backgroundType);
        const serverClock = getClockImageFromType(data.profile?.clockType);
        
        // 동물이 있으면 CustomizationContext 업데이트
        if (hasAnimal) {
          const animalImage = getAnimalImage(animalType);
          setCustomization(animalImage, serverBackground, serverClock);
        } else {
          // 동물이 없어도 커스터마이징 정보는 로드
          loadCustomizationFromServer(data.profile?.backgroundType, data.profile?.clockType);
        }
        
        // 동물이 없으면 동물 선택 모달, 동물은 있지만 닉네임이 없으면 프로필 입력 모달
        setShowAnimalModal(!hasAnimal);
        setShowProfileModal(hasAnimal && !hasNickname);
      } else {
        // 프로필이 없으면 동물 선택 모달만 표시 (프로필 입력 모달은 동물 선택 후 표시)
        setSelectedAnimalId(null);
        setNickname("");
        setHeight("");
        setWeight("");
        setLevel(1);
        setExperience(0);
        setStrength(0);
        setAgility(0);
        setStamina(0);
        setConcentration(0);
        // 프로필이 없어도 기본 커스터마이징 정보는 로드 (alarm, home)
        loadCustomizationFromServer(null, null);
        setShowAnimalModal(true);
        setShowProfileModal(false);
      }
    } catch (error) {
      console.error("프로필 불러오기 실패:", error);
      Alert.alert("오류", "사용자 정보를 불러오지 못했습니다.");
    } finally {
      setIsLoadingProfile(false);
    }
  }, [setCustomization, loadCustomizationFromServer]);

  // 화면이 포커스될 때마다 프로필 새로고침
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const navigateToTimer = () => router.push("/(tabs)/timer" as any);
  const navigateToRecords = () => router.push("/(tabs)/records" as any);
  const navigateToRanking = () => router.push("/(tabs)/ranking" as any);
  const navigateToAchievement = () => router.push("/(tabs)/achievement" as any);
  const navigateToCustomize = () => router.push("/(tabs)/customize" as any);

  const handleSaveProfile = async () => {
    if (!selectedAnimalId) {
      Alert.alert("알림", "함께할 동물을 먼저 선택해주세요.");
      return;
    }

    if (!nickname.trim() || !height.trim() || !weight.trim()) {
      Alert.alert("알림", "모든 정보를 입력해주세요.");
      return;
    }

    const headers = await AuthManager.getAuthHeader();
    if (!headers.Authorization) {
      router.replace("/(auth)/login" as any);
      return;
    }

    const backgroundType = getBackgroundTypeFromImage(selectedBackground);
    const clockType = getClockTypeFromImage(selectedClock);
    
    const payload = {
      animalType: selectedAnimalId,
      nickname,
      height: height ? Number(height) : null,
      weight: weight ? Number(weight) : null,
      backgroundType,
      clockType,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "any",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        Alert.alert("오류", data?.error ?? "프로필 저장에 실패했습니다.");
        return;
      }

      // CustomizationContext 업데이트
      const animalImage = getAnimalImage(selectedAnimalId);
      setCustomization(animalImage, selectedBackground, selectedClock, selectedAnimalId ?? null);

      Alert.alert("완료", "프로필이 저장되었습니다.");
      setShowProfileModal(false);
    } catch (error) {
      console.error("프로필 저장 실패:", error);
      Alert.alert("오류", "프로필 저장 중 문제가 발생했습니다.");
    }
  };

  const handleEditProfile = () => {
    setShowProfileModal(true);
  };

  const handleSelectAnimal = (animalId: AnimalId) => {
    setPendingAnimal(animalId);
    setShowAnimalConfirm(true);
  };

  const confirmAnimalSelection = () => {
    if (!pendingAnimal) return;
    setSelectedAnimalId(pendingAnimal);
    // CustomizationContext 업데이트
    const animalImage = getAnimalImage(pendingAnimal);
    setCustomization(animalImage, selectedBackground, selectedClock, pendingAnimal);
    setPendingAnimal(null);
    setShowAnimalConfirm(false);
    setShowAnimalModal(false);
    setShowProfileModal(true);
  };

  const cancelAnimalSelection = () => {
    setPendingAnimal(null);
    setShowAnimalConfirm(false);
  };

  return (
    <ImageBackground
      source={selectedBackground ?? DEFAULT_BACKGROUND_IMAGE}
      style={styles.background}
      resizeMode="contain"
    >
      <SafeAreaView style={styles.safeArea}>
        {isLoadingProfile && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}

        {/* 햄버거 메뉴 버튼 */}
        <TouchableOpacity 
          style={[styles.hamburgerButton, { top: insets.top + 28 }]} //햄버거 메뉴 상하 위치 조절
          onPress={() => setShowHamburgerMenu(!showHamburgerMenu)}
          activeOpacity={0.7}
        >
          <Text style={styles.hamburgerIcon}>☰</Text>
        </TouchableOpacity>

        {/* 햄버거 메뉴 드롭다운 */}
        {showHamburgerMenu && (
          <View style={[styles.hamburgerMenu, { top: insets.top + 100 }]}>
            <TouchableOpacity 
              style={styles.hamburgerMenuItem}
              onPress={() => {
                setShowHamburgerMenu(false);
                router.push("/(tabs)/chatting" as any);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.hamburgerMenuIcon}>💬</Text>
              <Text style={styles.hamburgerMenuText}>채팅</Text>
            </TouchableOpacity>

            <View style={styles.hamburgerMenuDivider} />

            <TouchableOpacity 
              style={styles.hamburgerMenuItem}
              onPress={() => {
                setShowHamburgerMenu(false);
                navigateToRanking();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.hamburgerMenuIcon}>🏆</Text>
              <Text style={styles.hamburgerMenuText}>랭킹</Text>
            </TouchableOpacity>

            <View style={styles.hamburgerMenuDivider} />

            <TouchableOpacity 
              style={styles.hamburgerMenuItem}
              onPress={() => {
                setShowHamburgerMenu(false);
                router.push("/(tabs)/settings" as any);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.hamburgerMenuIcon}>⚙️</Text>
              <Text style={styles.hamburgerMenuText}>설정</Text>
            </TouchableOpacity>
          </View>
        )}

        <View
          style={[
            styles.statusBarContainer,
            { paddingTop: insets.top + 80, maxWidth: Math.min(280, screenWidth - 80) }, //상태창 상하 위치 조절
          ]}
        >
          <TouchableOpacity
            style={styles.statusBar}
            activeOpacity={0.7}
            onPress={navigateToRanking}
          >
            {/* 프로필 수정 버튼 - 우측 상단 */}
            <TouchableOpacity 
              style={styles.editProfileButton} 
              onPress={(e) => {
                e.stopPropagation();
                handleEditProfile();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.editProfileIcon}>✏️</Text>
            </TouchableOpacity>

            <Text style={styles.petName}>Lv.{level} {nickname || accountName || "PETS"}</Text>
            
            {/* 경험치 바 */}
            <View style={styles.expBarContainer}>
              <View style={styles.expBarBackground}>
                <View 
                  style={[
                    styles.expBarFill, 
                    { 
                      width: `${Math.min(100, Math.max(0, ((experience - (level - 1) * 100) / 100) * 100))}%` 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.expBarText}>
                {Math.max(0, experience - (level - 1) * 100)} / 100
              </Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>힘</Text>
                <Text style={styles.statValue}>{strength}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>민첩</Text>
                <Text style={styles.statValue}>{agility}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>지구력</Text>
                <Text style={styles.statValue}>{stamina}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>집중력</Text>
                <Text style={styles.statValue}>{concentration}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.centerContainer}>
          <TouchableOpacity
            style={[styles.petPortrait, { width: petSize * 0.8, height: petSize * 0.8, marginTop: -240 }]} //동물 이미지 상하 위치 조절
            activeOpacity={0.7}
            onPress={navigateToCustomize}
          >
            <Image
              source={selectedAnimal ?? DEFAULT_ANIMAL_IMAGE}
              style={[styles.petPortraitImage, { width: petSize * 1.2, height: petSize * 1.2}]}
            />
          </TouchableOpacity>

          {/* 시계 오브젝트 컨테이너 */}
          <View
            style={[
              styles.clockButtonContainer,
              { transform: [{ translateX: -180 * scale }, { translateY: 58 * scale }] }, //시계 오브젝트 위치 조정
            ]}
          >
            <TouchableOpacity
              style={[styles.clockButton, { width: clockIconSize, height: clockIconSize }]}
              onPress={navigateToTimer}
              activeOpacity={0.8}
            >
              <Image
                source={selectedClock ?? require("../../assets/images/clocks/alarm.png")}
                style={[styles.clockButtonIcon, { width: clockIconSize, height: clockIconSize }]}
              />
            </TouchableOpacity>
            <Text style={styles.objectLabel}>타이머</Text>
          </View>


          {/* 달력 오브젝트 컨테이너 */}
          <View
            style={[
              styles.recordsButtonContainer,
              { transform: [{ translateX: 60 * scale }, { translateY: 40 * scale }] }, //달력 오브젝트 위치 조정
            ]}
          >
            <TouchableOpacity
              style={[styles.recordsButton, { width: calendarWidth, height: calendarHeight }]}
              onPress={navigateToRecords}
              activeOpacity={0.8}
            >
              <Image
                source={require("../../assets/images/calendar.png")}
                style={[styles.recordsButtonIcon, { width: calendarWidth, height: calendarHeight }]}
              />
            </TouchableOpacity>
            <Text style={styles.objectLabel}>운동 기록</Text>
          </View>

          {/* 트로피 오브젝트 컨테이너 */}
          <View
            style={[
              styles.trophyButtonContainer,
              { transform: [{ translateX: -60 * scale }, { translateY: 30 * scale }] }, //트로피 오브젝트 위치 조정
            ]}
          >
            <TouchableOpacity
              style={[styles.trophyButton, { width: trophyWidth, height: trophyHeight }]}
              onPress={navigateToAchievement}
              activeOpacity={0.8}
            >
              <Image
                source={require("../../assets/images/trophy.png")}
                style={[styles.trophyButtonIcon, { width: trophyWidth, height: trophyHeight }]}
              />
            </TouchableOpacity>
            <Text style={styles.objectLabel}>업적</Text>
          </View>
        </View>

        <Modal visible={showAnimalModal} transparent animationType="fade" onRequestClose={() => {}}>
          <View style={styles.modalOverlay}>
            <View style={styles.animalModal}>
              <Text style={styles.animalModalTitle}>함께할 동물을 골라주세요</Text>
              <Text style={styles.animalModalSubtitle}>
                선택한 동물은 특정 도전 과제를 완료하기 전까지 변경할 수 없어요.
              </Text>

              <View style={styles.animalOptions}>
                {ANIMAL_OPTIONS.map((animal) => {
                  const isSelected =
                    animal.id === pendingAnimal || animal.id === selectedAnimalId;
                  return (
                    <TouchableOpacity
                      key={animal.id}
                      style={[styles.animalOption, isSelected && styles.animalOptionSelected]}
                      onPress={() => handleSelectAnimal(animal.id)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={animal.image}
                        style={styles.animalImage}
                        resizeMode="contain"
                      />
                      <Text style={styles.animalLabel}>{animal.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {showAnimalConfirm && pendingAnimal && (
                <View style={styles.animalConfirmBox}>
                  <Text style={styles.animalConfirmTitle}>이 동물과 함께할까요?</Text>
                  <Text style={styles.animalConfirmSubtitle}>
                    특정 도전 과제를 완료하기 전까지 변경할 수 없어요.
                  </Text>
                  <View style={styles.animalConfirmButtons}>
                    <TouchableOpacity
                      style={[styles.animalConfirmButton, styles.animalConfirmCancel]}
                      onPress={cancelAnimalSelection}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.animalConfirmCancelText}>취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.animalConfirmButton, styles.animalConfirmOk]}
                      onPress={confirmAnimalSelection}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.animalConfirmOkText}>확인</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>

        <Modal visible={showProfileModal} transparent animationType="fade" onRequestClose={() => {}}>
          <View style={styles.modalOverlay}>
            <ScrollView contentContainerStyle={styles.profileScrollContent}>
              <View style={styles.profileModal}>
                <Text style={styles.profileTitle}>기본 정보 입력</Text>
                <Text style={styles.profileSubtitle}>
                  선택한 동물과 함께할 준비가 되었어요. 정보를 입력해주세요.
                </Text>

                {selectedAnimalId && (
                  <View style={styles.selectedAnimalSummary}>
                    <Image
                      source={ANIMAL_OPTIONS.find((animal) => animal.id === selectedAnimalId)?.image ?? require("../../assets/images/animals/dog.png")}
                      style={styles.selectedAnimalImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.selectedAnimalLabel}>
                      {ANIMAL_OPTIONS.find((animal) => animal.id === selectedAnimalId)?.label ?? ""}
                    </Text>
                  </View>
                )}

                <TextInput
                  style={styles.input}
                  placeholder="닉네임을 입력하세요"
                  value={nickname}
                  onChangeText={setNickname}
                  placeholderTextColor="#999"
                />

                <TextInput
                  style={styles.input}
                  placeholder="키(cm)를 입력하세요"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />

                <TextInput
                  style={styles.input}
                  placeholder="몸무게(kg)를 입력하세요"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                  <Text style={styles.saveButtonText}>저장하기</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  hamburgerButton: {
    position: "absolute",
    right: 8, //햄버거 메뉴 좌우 위치 조절
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 15,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  hamburgerIcon: {
    fontSize: 24,
    color: "#333",
    fontWeight: "600",
  },
  hamburgerMenu: {
    position: "absolute",
    right: 16,
    width: 140,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 14,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  hamburgerMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  hamburgerMenuIcon: {
    fontSize: 20,
  },
  hamburgerMenuText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    fontFamily: 'KotraHope',
  },
  hamburgerMenuDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 12,
  },
  statusBarContainer: {
    alignSelf: "center",
    width: "100%",    
    alignItems: "center",
    gap: 16,
  },
  statusBar: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  petName: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#333",
    fontFamily: 'KotraHope',
  },
  statusText: {
    fontSize: 24,
    color: "#333",
    fontWeight: "600",
    marginTop: 6,
    marginBottom: 8,
    fontFamily: 'KotraHope',
  },
  expBarContainer: {
    width: "100%",
    marginBottom: 8,
    marginTop: 4,
  },
  expBarBackground: {
    width: "100%",
    height: 20,
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 4,
  },
  expBarFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 10,
  },
  expBarText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    fontFamily: 'KotraHope',
  },
  editProfileButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F4FF",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  editProfileIcon: {
    fontSize: 20,
  },
  statsContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 8,
  },
  statItem: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 40,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  statLabel: {
    fontSize: 16,
    color: "#666",
    fontFamily: 'KotraHope',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    fontFamily: 'KotraHope',
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  petPortrait: {
    alignItems: "center",
    justifyContent: "center",
  },
  petPortraitImage: {
    resizeMode: "contain",
  },
  clockButtonContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    alignItems: "center",
  },
  clockButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  clockButtonIcon: {
    resizeMode: "contain",
  },
  recordsButtonContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    alignItems: "center",
  },
  recordsButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  recordsButtonIcon: {
    resizeMode: "contain",
  },
  trophyButtonContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    alignItems: "center",
  },
  trophyButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  trophyButtonIcon: {
    resizeMode: "contain",
  },
  objectLabel: {
    fontSize: 24,
    color: "#333",
    fontWeight: "600",
    fontFamily: 'KotraHope',
    textAlign: "center",
    marginTop: 5,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  animalModal: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  animalModalTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: 'KotraHope',
  },
  animalModalSubtitle: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    fontFamily: 'KotraHope',
  },
  animalOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  animalOption: {
    flexBasis: "48%",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  animalOptionSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#E6F0FF",
  },
  animalImage: {
    width: 80,
    height: 80,
  },
  animalLabel: {
    fontSize: 18,
    color: "#333",
    fontWeight: "600",
    fontFamily: 'KotraHope',
  },
  animalConfirmBox: {
    marginTop: 16,
    backgroundColor: "#F8F9FF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CCD6FF",
  },
  animalConfirmTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F3B73",
    textAlign: "center",
    marginBottom: 6,
    fontFamily: 'KotraHope',
  },
  animalConfirmSubtitle: {
    fontSize: 17,
    color: "#4A5A88",
    textAlign: "center",
    marginBottom: 12,
    fontFamily: 'KotraHope',
  },
  animalConfirmButtons: {
    flexDirection: "row",
    gap: 12,
  },
  animalConfirmButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },
  animalConfirmCancel: {
    backgroundColor: "#E8ECF8",
  },
  animalConfirmOk: {
    backgroundColor: "#007AFF",
  },
  animalConfirmCancelText: {
    color: "#4A5A88",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: 'KotraHope',
  },
  animalConfirmOkText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: 'KotraHope',
  },
  profileScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    width: "100%",
  },
  profileModal: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  profileTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: 'KotraHope',
  },
  profileSubtitle: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    fontFamily: 'KotraHope',
  },
  selectedAnimalSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
    backgroundColor: "#F0F4FF",
    borderRadius: 12,
    paddingVertical: 12,
  },
  selectedAnimalImage: {
    width: 60,
    height: 60,
  },
  selectedAnimalLabel: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    fontFamily: 'KotraHope',
  },
  input: {
    width: "100%",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    fontFamily: 'KotraHope',
  },
});
