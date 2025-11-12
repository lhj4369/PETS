import { useEffect, useState } from "react";
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
import AuthManager from "../../utils/AuthManager";
import API_BASE_URL from "../../config/api";
import ChatBubbleButton from "../../components/ChatBubbleButton";
import SettingsButton from "../../components/SettingsButton";
import RankingButton from "../../components/RankingButton";
import { useCustomization, DEFAULT_ANIMAL_IMAGE, DEFAULT_BACKGROUND_IMAGE } from "../../context/CustomizationContext";

const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

const ANIMAL_OPTIONS = [
  { id: "capybara", label: "카피바라", emoji: "🦫", image: require("../../assets/images/animals/capibara.png") },
  { id: "fox", label: "여우", emoji: "🦊", image: require("../../assets/images/animals/fox.png") },
  { id: "red_panda", label: "레서판다", emoji: "🦝", image: require("../../assets/images/animals/red_panda.png") },
  { id: "guinea_pig", label: "기니피그", emoji: "🐹", image: require("../../assets/images/animals/ginipig.png") },
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

  const [selectedAnimalId, setSelectedAnimalId] = useState<AnimalId | null>(null);
  const [nickname, setNickname] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [accountName, setAccountName] = useState("");
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  const [strength, setStrength] = useState(0);
  const [agility, setAgility] = useState(0);
  const { selectedAnimal, selectedBackground, selectedClock } = useCustomization();

  const petSize = Math.min(240, screenWidth * 0.5);
  const buttonSize = Math.max(96, Math.min(144, screenWidth * 0.3));
  const cardHeight = Math.max(140, Math.min(200, screenWidth * 0.45));
  const clockIconSize = Math.max(60, Math.min(100, screenWidth * 0.25));

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // 개발자 모드: 로컬 목 데이터 우선 사용
        if (await AuthManager.isDevMode()) {
          const devData = (await AuthManager.getDevProfile()) ?? (await AuthManager.getUser());

          if (devData && typeof devData === "object") {
            const devAccount = devData as {
              name?: string;
              profile?: {
                animalType?: AnimalId | null;
                nickname?: string | null;
                height?: number | null;
                weight?: number | null;
                level?: number | null;
                experience?: number | null;
                strength?: number | null;
                agility?: number | null;
              } | null;
            };

            const devProfile = devAccount.profile ?? null;
            const animalType = (devProfile?.animalType as AnimalId | null) ?? null;
            const nicknameValue = devProfile?.nickname ?? "";
            const heightValue = devProfile?.height ?? null;
            const weightValue = devProfile?.weight ?? null;
            const levelValue = devProfile?.level ?? 1;
            const experienceValue = devProfile?.experience ?? 0;
            const strengthValue = devProfile?.strength ?? 0;
            const agilityValue = devProfile?.agility ?? 0;

            const hasAnimal = !!animalType;
            const hasNickname = !!nicknameValue;

            setAccountName(devAccount.name ?? "");
            setSelectedAnimalId(animalType);
            setNickname(nicknameValue ?? "");
            setHeight(
              heightValue !== null && heightValue !== undefined
                ? String(heightValue)
                : ""
            );
            setWeight(
              weightValue !== null && weightValue !== undefined
                ? String(weightValue)
                : ""
            );
            setLevel(levelValue);
            setExperience(experienceValue);
            setStrength(strengthValue);
            setAgility(agilityValue);
            
            // 동물이 있으면 CustomizationContext 업데이트
            if (hasAnimal) {
              const animalImage = getAnimalImage(animalType);
              setCustomization(animalImage, selectedBackground, null);
            }
            
            setShowAnimalModal(!hasAnimal);
            setShowProfileModal(hasAnimal && !hasNickname);
          } else {
            setAccountName("");
            setSelectedAnimalId(null);
            setNickname("");
            setHeight("");
            setWeight("");
            setLevel(1);
            setExperience(0);
            setStrength(0);
            setAgility(0);
            setShowAnimalModal(true);
            setShowProfileModal(false);
          }

          return;
        }

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
          setExperience(data.profile.experience ?? 0);
          setStrength(data.profile.strength ?? 0);
          setAgility(data.profile.agility ?? 0);
          
          // 동물이 있으면 CustomizationContext 업데이트
          if (hasAnimal) {
            const animalImage = getAnimalImage(animalType);
            setCustomization(animalImage, selectedBackground, null);
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
          setShowAnimalModal(true);
          setShowProfileModal(false);
        }
      } catch (error) {
        console.error("프로필 불러오기 실패:", error);
        Alert.alert("오류", "사용자 정보를 불러오지 못했습니다.");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

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

    // 개발자 모드: 로컬 목 데이터 저장
    if (await AuthManager.isDevMode()) {
      const nameForDev = accountName || nickname || "개발자";
      const devProfileData = {
        id: "dev",
        name: nameForDev,
        email: "dev@example.com",
        profile: {
          animalType: selectedAnimalId,
          nickname,
          height: height ? Number(height) : null,
          weight: weight ? Number(weight) : null,
          level: 1,
          experience: 0,
          strength: 0,
          agility: 0,
        },
      };

      await AuthManager.setDevProfile(devProfileData); // 개발자 모드
      await AuthManager.login("dev-token", devProfileData); // 개발자 모드
      await AuthManager.setDevMode(true); // 개발자 모드

      // CustomizationContext 업데이트
      const animalImage = getAnimalImage(selectedAnimalId);
      setCustomization(animalImage, selectedBackground, null);

      setAccountName(nameForDev);
      setShowAnimalModal(false);
      setShowProfileModal(false);
      Alert.alert("완료", "프로필이 저장되었습니다.");
      return;
    }

    const headers = await AuthManager.getAuthHeader();
    if (!headers.Authorization) {
      router.replace("/(auth)/login" as any);
      return;
    }

    const payload = {
      animalType: selectedAnimalId,
      nickname,
      height: height ? Number(height) : null,
      weight: weight ? Number(weight) : null,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
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
      setCustomization(animalImage, selectedBackground, null);

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
    setCustomization(animalImage, selectedBackground, null);
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

        <ChatBubbleButton />
        <SettingsButton />
        <RankingButton />

        <View
          style={[
            styles.statusBarContainer,
            { paddingTop: insets.top + 20, maxWidth: Math.min(360, screenWidth - 32) },
          ]}
        >
          <TouchableOpacity
            style={styles.statusBar}
            activeOpacity={0.7}
            onPress={navigateToRanking}
          >
            <Text style={styles.petName}>{nickname || accountName || "PETS"}</Text>
            <Text style={styles.statusText}>레벨 {level} | 경험치 {experience}</Text>
            <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
              <Text style={styles.editProfileText}>프로필 수정</Text>
            </TouchableOpacity>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>힘</Text>
                <Text style={styles.statValue}>{strength}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>민첩</Text>
                <Text style={styles.statValue}>{agility}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.centerContainer}>
          <TouchableOpacity
            style={[styles.petPortrait, { width: petSize * 0.8, height: petSize * 0.8, marginTop: -150 }]}
            activeOpacity={0.7}
            onPress={navigateToCustomize}
          >
            <Image
              source={selectedAnimal ?? DEFAULT_ANIMAL_IMAGE}
              style={[styles.petPortraitImage, { width: petSize * 0.8, height: petSize * 0.8 }]}
            />
          </TouchableOpacity>

          <View
            style={[
              styles.clockButtonContainer,
              { transform: [{ translateX: -150 * scale }, { translateY: -100 * scale }] },
            ]}
          >
            <TouchableOpacity
              style={[styles.clockButton, { width: clockIconSize, height: clockIconSize }]}
              onPress={navigateToTimer}
              activeOpacity={0.8}
            >
              <Image
                source={selectedClock ?? require("../../assets/images/clock_icon.png")}
                style={[styles.clockButtonIcon, { width: clockIconSize, height: clockIconSize }]}
              />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.recordsButtonContainer,
              { transform: [{ translateX: 30 * scale }, { translateY: 20 * scale }] },
            ]}
          >
            <TouchableOpacity
              style={[styles.recordsButton, { width: buttonSize * 1.3, height: cardHeight * 1.2 }]}
              onPress={navigateToRecords}
              activeOpacity={0.8}
            >
              <Image
                source={require("../../assets/images/calendar.png")}
                style={[styles.recordsButtonIcon, { width: buttonSize * 1.3, height: cardHeight * 1.2 }]}
              />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.trophyButtonContainer,
              { transform: [{ translateX: -180 * scale }, { translateY: 20 * scale }] },
            ]}
          >
            <TouchableOpacity
              style={[styles.trophyButton, { width: buttonSize * 1.1, height: cardHeight }]}
              onPress={navigateToAchievement}
              activeOpacity={0.8}
            >
              <Image
                source={require("../../assets/images/trophy.png")}
                style={[styles.trophyButtonIcon, { width: buttonSize * 1.1, height: cardHeight }]}
              />
            </TouchableOpacity>
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
                      source={ANIMAL_OPTIONS.find((animal) => animal.id === selectedAnimalId)?.image ?? require("../../assets/images/animals/capibara.png")}
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
  statusBarContainer: {
    alignSelf: "center",
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  statusBar: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  petName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  statusText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    marginTop: 6,
    marginBottom: 12,
  },
  editProfileButton: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#F0F4FF",
    marginBottom: 12,
  },
  editProfileText: {
    color: "#007AFF",
    fontSize: 12,
    fontWeight: "600",
  },
  statsContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  animalModalSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
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
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
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
    fontSize: 16,
    fontWeight: "600",
    color: "#1F3B73",
    textAlign: "center",
    marginBottom: 6,
  },
  animalConfirmSubtitle: {
    fontSize: 13,
    color: "#4A5A88",
    textAlign: "center",
    marginBottom: 12,
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
    fontSize: 14,
    fontWeight: "600",
  },
  animalConfirmOkText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  profileSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
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
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  input: {
    width: "100%",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: "600",
  },
});
