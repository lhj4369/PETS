import { useEffect, useState, useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  ImageBackground,
  ImageSourcePropType,
  InteractionManager,
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
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import AuthManager from "../../utils/AuthManager";
import API_BASE_URL from "../../config/api";
import ChatBubbleButton from "../../components/ChatBubbleButton";
import SettingsButton from "../../components/SettingsButton";
import RankingButton from "../../components/RankingButton";
import { useSettingsModal } from "../../context/SettingsModalContext";
import QuestModal from "../../components/QuestModal";
import ItemModal from "../../components/ItemModal";
import { useCustomization, DEFAULT_ANIMAL_IMAGE, DEFAULT_BACKGROUND_IMAGE } from "../../context/CustomizationContext";
import { APP_COLORS } from "../../constants/theme";
import { getBackgroundTypeFromImage, getClockTypeFromImage, getBackgroundImageFromType, getClockImageFromType } from "../../utils/customizationUtils";

// 홈/하단 메뉴 아이콘 – home-icons 폴더의 AI 커스텀 이미지 사용
// 상단 메뉴용 (퀘스트 / AI CHAT / 랭킹)
const QUEST_ICON = require("../../assets/images/home-icons/quest.png");
const CHAT_ICON = require("../../assets/images/home-icons/chat.png");
const RANKING_ICON = require("../../assets/images/home-icons/ranking.png");

// 하단 메뉴용 (커마 / 타이머 / 기록도전 / 아이템 / 설정)
const CUSTOM_ICON = require("../../assets/images/home-icons/custom.png");   // 커마
const TIMER_ICON = require("../../assets/images/home-icons/timer.png");     // 타이머(운동)
const RECORD_ICON = require("../../assets/images/home-icons/record.png");   // 기록도전
const HOME_ITEM_ICON = require("../../assets/images/home-icons/item.png");  // 아이템
const HOME_SETTING_ICON = require("../../assets/images/home-icons/setting.png"); // 설정

const HOME_ICONS = {
  // 우측 상단 메뉴
  quest: QUEST_ICON,
  aiChat: CHAT_ICON,
  ranking: RANKING_ICON,
  // 하단 고정 메뉴
  customize: CUSTOM_ICON,
  timer: TIMER_ICON,
  challenge: RECORD_ICON,
  item: HOME_ITEM_ICON,
  settings: HOME_SETTING_ICON,
};

const ANIMAL_OPTIONS = [
  { id: "dog", label: "강아지", image: require("../../assets/images/animals/dog.png") },
  { id: "capybara", label: "카피바라", image: require("../../assets/images/animals/capibara.png") },
  { id: "fox", label: "여우", image: require("../../assets/images/animals/fox.png") },
  { id: "red_panda", label: "레서판다", image: require("../../assets/images/animals/red_panda.png") },
  { id: "guinea_pig", label: "기니피그", image: require("../../assets/images/animals/ginipig.png") },
] as const;

type AnimalId = (typeof ANIMAL_OPTIONS)[number]["id"];

type ProfileResponse = {
  account?: { id: number; name: string; email: string } | null;
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

const EXP_PER_LEVEL = 100;

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { openQuest } = useLocalSearchParams<{ openQuest?: string }>();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const scale = Math.min(screenWidth / BASE_WIDTH, screenHeight / BASE_HEIGHT);

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showAnimalModal, setShowAnimalModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [pendingAnimal, setPendingAnimal] = useState<AnimalId | null>(null);
  const [showAnimalConfirm, setShowAnimalConfirm] = useState(false);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showExpDetailModal, setShowExpDetailModal] = useState(false);
  const petScaleAnim = useRef(new Animated.Value(1)).current;
  const { openSettings } = useSettingsModal();

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

  const getAnimalImage = (animalId: AnimalId | null): ImageSourcePropType => {
    if (!animalId) return DEFAULT_ANIMAL_IMAGE;
    const animal = ANIMAL_OPTIONS.find((a) => a.id === animalId);
    return animal?.image ?? DEFAULT_ANIMAL_IMAGE;
  };

  const petSize = Math.min(220, screenWidth * 0.55);
  const iconSize = Math.max(44, Math.min(56, screenWidth * 0.12));
  const bottomIconSize = 42;

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoadingProfile(true);
      const headers = await AuthManager.getAuthHeader();
      if (!headers.Authorization) {
        router.replace("/" as any);
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, { headers });
      if (response.status === 401) {
        await AuthManager.logout();
        router.replace("/" as any);
        return;
      }
      if (!response.ok) throw new Error("사용자 정보를 불러오지 못했습니다.");
      const data = (await response.json()) as ProfileResponse;
      setAccountName(data.account?.name ?? "");
      if (data.profile) {
        const animalType = data.profile.animalType ?? null;
        const nicknameValue = data.profile.nickname ?? "";
        const hasAnimal = !!animalType;
        const hasNickname = !!nicknameValue;
        setSelectedAnimalId(animalType);
        setNickname(nicknameValue);
        setHeight(data.profile.height != null ? String(data.profile.height) : "");
        setWeight(data.profile.weight != null ? String(data.profile.weight) : "");
        setLevel(data.profile.level ?? 1);
        setStrength(data.profile.strength ?? 0);
        setAgility(data.profile.agility ?? 0);
        setStamina(data.profile.stamina ?? 0);
        setConcentration(data.profile.concentration ?? 0);
        const totalStats = (data.profile.strength ?? 0) + (data.profile.agility ?? 0) + (data.profile.stamina ?? 0) + (data.profile.concentration ?? 0);
        setExperience(totalStats);
        const serverBackground = getBackgroundImageFromType(data.profile?.backgroundType);
        const serverClock = getClockImageFromType(data.profile?.clockType);
        if (hasAnimal) {
          const animalImage = getAnimalImage(animalType);
          setCustomization(animalImage, serverBackground, serverClock);
        } else {
          loadCustomizationFromServer(data.profile?.backgroundType, data.profile?.clockType);
        }
        setShowAnimalModal(!hasAnimal);
        setShowProfileModal(hasAnimal && !hasNickname);
      } else {
        setSelectedAnimalId(null);
        setNickname("");
        setHeight("");
        setWeight("");
        setLevel(1);
        setExperience(0);
        setStrength(0);
        setAgility(0);
        setConcentration(0);
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

  useFocusEffect(useCallback(() => { fetchProfile(); }, [fetchProfile]));

  // 메뉴에서 퀘스트 선택 시 모달 열기
  useEffect(() => {
    if (openQuest === "1") {
      setShowQuestModal(true);
      router.replace("/(tabs)/home" as any);
    }
  }, [openQuest]);

  const navigateToTimer = () => router.push("/(tabs)/timer" as any);
  const navigateToRecords = () => router.push("/(tabs)/records" as any);
  const navigateToRanking = () => router.push("/(tabs)/ranking" as any);
  const navigateToCustomize = () => router.push("/(tabs)/customize" as any);
  const navigateToChallenges = () => router.push("/(tabs)/challenges" as any);
  const navigateToChatting = () => router.push("/(tabs)/chatting" as any);
  const navigateToSettings = () => router.push("/(tabs)/settings" as any);
  const navigateToItem = () => setShowItemModal(true);

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
      router.replace("/" as any);
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
        headers: { ...headers, "Content-Type": "application/json", "ngrok-skip-browser-warning": "any" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert("오류", data?.error ?? "프로필 저장에 실패했습니다.");
        return;
      }
      const animalImage = getAnimalImage(selectedAnimalId);
      setCustomization(animalImage, selectedBackground, selectedClock, selectedAnimalId ?? null);
      Alert.alert("완료", "프로필이 저장되었습니다.");
      setShowProfileModal(false);
    } catch (error) {
      console.error("프로필 저장 실패:", error);
      Alert.alert("오류", "프로필 저장 중 문제가 발생했습니다.");
    }
  };

  const handleEditProfile = () => setShowProfileModal(true);
  const handleSelectAnimal = (animalId: AnimalId) => {
    setPendingAnimal(animalId);
    setShowAnimalConfirm(true);
  };
  const confirmAnimalSelection = () => {
    if (!pendingAnimal) return;
    setSelectedAnimalId(pendingAnimal);
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

  const onPetPress = () => {
    Animated.sequence([
      Animated.timing(petScaleAnim, { toValue: 1.08, duration: 80, useNativeDriver: true }),
      Animated.timing(petScaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    navigateToCustomize();
  };

  const currentExp = Math.max(0, experience - (level - 1) * EXP_PER_LEVEL);
  const expProgress = Math.min(1, currentExp / EXP_PER_LEVEL);
  const nextLevelExp = EXP_PER_LEVEL;

  return (
    <ImageBackground source={selectedBackground ?? DEFAULT_BACKGROUND_IMAGE} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        {isLoadingProfile && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#B8E0D2" />
          </View>
        )}

        {/* 상단: 프로필 카드(가로 꽉) + 그 아래 퀘스트/채팅/랭킹 */}
        <View style={[styles.topBlock, { paddingTop: insets.top + 8, paddingHorizontal: 16 }]}>
          {/* 프로필 카드: 화면 가로 전체 */}
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
                setShowQuestModal(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.hamburgerMenuIcon}>📋</Text>
              <Text style={styles.hamburgerMenuText}>퀘스트</Text>
            </TouchableOpacity>

            <View style={styles.hamburgerMenuDivider} />

            <TouchableOpacity 
              style={styles.hamburgerMenuItem}
              onPress={() => {
                setShowHamburgerMenu(false);
                setShowItemModal(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.hamburgerMenuIcon}>🎒</Text>
              <Text style={styles.hamburgerMenuText}>아이템</Text>
            </TouchableOpacity>

            <View style={styles.hamburgerMenuDivider} />

            <TouchableOpacity 
              style={styles.hamburgerMenuItem}
              onPress={() => {
                setShowHamburgerMenu(false);
                router.push("/(tabs)/challenges" as any);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.hamburgerMenuIcon}>🔥</Text>
              <Text style={styles.hamburgerMenuText}>기록도전</Text>
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
                InteractionManager.runAfterInteractions(() => openSettings());
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
            style={styles.profileSection}
            activeOpacity={0.85}
            onPress={() => setShowExpDetailModal(true)}
          >
            <View style={styles.profileLeft}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatarCircle}>
                  <Image
                    source={selectedAnimal ?? DEFAULT_ANIMAL_IMAGE}
                    style={styles.avatarImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
              <View style={styles.profileInfo}>
                <View style={styles.nicknameRow}>
                  <Text style={styles.nickname} numberOfLines={1}>
                    {nickname || accountName || "PETS"}
                  </Text>
                  <Text style={styles.levelInline}>Lv.{level}</Text>
                </View>
                <View style={styles.expBarHorizontal}>
                  <View
                    style={[
                      styles.expBarHorizontalFill,
                      { width: `${Math.min(100, expProgress * 100)}%` },
                    ]}
                  />
                </View>
                <View style={styles.statsRow}>
                  <Text style={styles.statNum}>{strength}</Text>
                  <Text style={styles.statDiv}>/</Text>
                  <Text style={styles.statNum}>{agility}</Text>
                  <Text style={styles.statDiv}>/</Text>
                  <Text style={styles.statNum}>{stamina}</Text>
                  <Text style={styles.statDiv}>/</Text>
                  <Text style={styles.statNum}>{concentration}</Text>
                </View>
                <Text style={styles.statHint}>힘 / 민첩 / 지구력 / 집중력</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editProfileBtn} onPress={(e) => { e.stopPropagation(); handleEditProfile(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.editProfileBtnText}>✏️</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* 프로필 아래: 퀘스트 / 채팅 / 랭킹 (가로 배치) */}
          <View style={styles.topIconsRow}>
            <TouchableOpacity style={styles.topIconBtn} onPress={() => setShowQuestModal(true)} activeOpacity={0.7}>
              <Image source={HOME_ICONS.quest} style={[styles.topIcon, { width: iconSize, height: iconSize }]} resizeMode="contain" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.topIconBtn} onPress={navigateToChatting} activeOpacity={0.7}>
              <Image source={HOME_ICONS.aiChat} style={[styles.topIcon, { width: iconSize, height: iconSize }]} resizeMode="contain" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.topIconBtn} onPress={navigateToRanking} activeOpacity={0.7}>
              <Image source={HOME_ICONS.ranking} style={[styles.topIcon, { width: iconSize, height: iconSize }]} resizeMode="contain" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 메인: 캐릭터 중심, 터치 반응 */}
        <View style={styles.mainArea}>
          <TouchableOpacity activeOpacity={1} onPress={onPetPress} style={styles.petTouchArea}>
            <Animated.View style={[styles.petWrap, { transform: [{ scale: petScaleAnim }] }]}>
              <Image source={selectedAnimal ?? DEFAULT_ANIMAL_IMAGE} style={[styles.petImage, { width: petSize, height: petSize }]} resizeMode="contain" />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* 하단 고정 메뉴: 커마 / 타이머 / 기록도전 / 아이템 / 설정 */}
        <View style={[styles.bottomBar, { paddingBottom: Math.max(18, insets.bottom), paddingTop: 18 }]}>
          <TouchableOpacity style={styles.bottomItem} onPress={navigateToCustomize} activeOpacity={0.7}>
            <Image source={HOME_ICONS.customize} style={[styles.bottomIcon, { width: bottomIconSize, height: bottomIconSize }]} resizeMode="contain" />
            <Text style={styles.bottomLabel}>커마</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomItem} onPress={navigateToTimer} activeOpacity={0.7}>
            <Image source={HOME_ICONS.timer} style={[styles.bottomIcon, { width: bottomIconSize, height: bottomIconSize }]} resizeMode="contain" />
            <Text style={styles.bottomLabel}>타이머</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomItem} onPress={navigateToChallenges} activeOpacity={0.7}>
            <Image source={HOME_ICONS.challenge} style={[styles.bottomIcon, { width: bottomIconSize, height: bottomIconSize }]} resizeMode="contain" />
            <Text style={styles.bottomLabel}>기록도전</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomItem} onPress={navigateToItem} activeOpacity={0.7}>
            <Image source={HOME_ICONS.item} style={[styles.bottomIcon, { width: bottomIconSize, height: bottomIconSize }]} resizeMode="contain" />
            <Text style={styles.bottomLabel}>아이템</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomItem} onPress={navigateToSettings} activeOpacity={0.7}>
            <Image source={HOME_ICONS.settings} style={[styles.bottomIcon, { width: bottomIconSize, height: bottomIconSize }]} resizeMode="contain" />
            <Text style={styles.bottomLabel}>설정</Text>
          </TouchableOpacity>
        </View>

        {/* 경험치 상세 모달 (프로필 터치 시) */}
        <Modal visible={showExpDetailModal} transparent animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowExpDetailModal(false)}>
            <View style={styles.expDetailCard}>
              <Text style={styles.expDetailTitle}>경험치</Text>
              <Text style={styles.expDetailLevel}>Lv. {level}</Text>
              <View style={styles.expDetailBarBg}>
                <View style={[styles.expDetailBarFill, { width: `${expProgress * 100}%` }]} />
              </View>
              <Text style={styles.expDetailText}>{currentExp} / {nextLevelExp} XP</Text>
              <Text style={styles.expDetailSub}>다음 레벨까지 {Math.max(0, nextLevelExp - currentExp)} XP</Text>
              <TouchableOpacity style={styles.expDetailClose} onPress={() => setShowExpDetailModal(false)}>
                <Text style={styles.expDetailCloseText}>확인</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal visible={showAnimalModal} transparent animationType="fade" onRequestClose={() => {}}>
          <View style={styles.modalOverlay}>
            <View style={styles.animalModal}>
              <Text style={styles.animalModalTitle}>함께할 동물을 골라주세요</Text>
              <Text style={styles.animalModalSubtitle}>선택한 동물은 특정 도전 과제를 완료하기 전까지 변경할 수 없어요.</Text>
              <Text style={styles.animalModalTitle}>함께 운동할 귀여운 동물 친구를 골라봐!</Text>
              <Text style={styles.animalModalSubtitle}>
                선택한 동물은 특정 도전 과제를 완료하기 전까지 변경할 수 없어요.
              </Text>

              <View style={styles.animalOptions}>
                {ANIMAL_OPTIONS.map((animal) => {
                  const isSelected = animal.id === pendingAnimal || animal.id === selectedAnimalId;
                  return (
                    <TouchableOpacity key={animal.id} style={[styles.animalOption, isSelected && styles.animalOptionSelected]} onPress={() => handleSelectAnimal(animal.id)} activeOpacity={0.8}>
                      <Image source={animal.image} style={styles.animalImage} resizeMode="contain" />
                      <Text style={styles.animalLabel}>{animal.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {showAnimalConfirm && pendingAnimal && (
                <View style={styles.animalConfirmBox}>
                  <Text style={styles.animalConfirmTitle}>이 동물과 함께할까요?</Text>
                  <Text style={styles.animalConfirmSubtitle}>특정 도전 과제를 완료하기 전까지 변경할 수 없어요.</Text>
                  <Text style={styles.animalConfirmTitle}>이 친구와 함께할까요?</Text>
                  <Text style={styles.animalConfirmSubtitle}>
                    특정 도전 과제를 완료하기 전까지 변경할 수 없어요.
                  </Text>
                  <View style={styles.animalConfirmButtons}>
                    <TouchableOpacity style={[styles.animalConfirmButton, styles.animalConfirmCancel]} onPress={cancelAnimalSelection} activeOpacity={0.8}>
                      <Text style={styles.animalConfirmCancelText}>취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.animalConfirmButton, styles.animalConfirmOk]} onPress={confirmAnimalSelection} activeOpacity={0.8}>
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
                <Text style={styles.profileSubtitle}>선택한 동물과 함께할 준비가 되었어요. 정보를 입력해주세요.</Text>
                <Text style={styles.profileTitle}>지금 너의 상태를 알고 싶어!</Text>
                <Text style={styles.profileSubtitle}>
                  닉네임, 키, 몸무게를 알려주면 맞춤 운동을 추천해줄게!
                </Text>

                {selectedAnimalId && (
                  <View style={styles.selectedAnimalSummary}>
                    <Image source={ANIMAL_OPTIONS.find((a) => a.id === selectedAnimalId)?.image ?? require("../../assets/images/animals/dog.png")} style={styles.selectedAnimalImage} resizeMode="contain" />
                    <Text style={styles.selectedAnimalLabel}>{ANIMAL_OPTIONS.find((a) => a.id === selectedAnimalId)?.label ?? ""}</Text>
                  </View>
                )}
                <TextInput style={styles.input} placeholder="닉네임을 입력하세요" value={nickname} onChangeText={setNickname} placeholderTextColor="#999" />
                <TextInput style={styles.input} placeholder="키(cm)를 입력하세요" value={height} onChangeText={setHeight} keyboardType="numeric" placeholderTextColor="#999" />
                <TextInput style={styles.input} placeholder="몸무게(kg)를 입력하세요" value={weight} onChangeText={setWeight} keyboardType="numeric" placeholderTextColor="#999" />

                <TextInput
                  style={styles.input}
                  placeholder="닉네임을 입력해줘"
                  value={nickname}
                  onChangeText={setNickname}
                  placeholderTextColor={APP_COLORS.brownLight}
                />

                <TextInput
                  style={styles.input}
                  placeholder="키(cm)를 입력해줘"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                  placeholderTextColor={APP_COLORS.brownLight}
                />

                <TextInput
                  style={styles.input}
                  placeholder="몸무게(kg)를 입력해줘"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  placeholderTextColor={APP_COLORS.brownLight}
                />

                <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                  <Text style={styles.saveButtonText}>저장하기</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>

        <QuestModal visible={showQuestModal} onClose={() => setShowQuestModal(false)} onProfileRefresh={fetchProfile} />
        <ItemModal visible={showItemModal} onClose={() => setShowItemModal(false)} />
      </SafeAreaView>
    </ImageBackground>
  );
};

export default HomeScreen;

const pastel = {
  bg: "#F5F0F8",
  card: "#FFF8E7",
  mint: "#B8E0D2",
  pink: "#F5D4E8",
  lavender: "#E8E0F0",
  text: "#4A4A4A",
  textLight: "#7A7A7A",
};

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%" },
  safeArea: { flex: 1, backgroundColor: "transparent" },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,248,231,0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  topBlock: {
    width: "100%",
    flexDirection: "column",
    alignItems: "stretch",
  },
  profileSection: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: pastel.card,
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 14,
    minHeight: 120,
    borderWidth: 2,
    borderColor: pastel.lavender,
    ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 }, android: { elevation: 4 } }),
  },
  profileLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatarWrap: {
    position: "relative",
    marginRight: 14,
    alignItems: "center",
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: pastel.mint,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
  expBarHorizontal: {
    width: "100%",
    height: 9,
    borderRadius: 5,
    backgroundColor: "#FBF6ED",
    overflow: "hidden",
    marginTop: 6,
    borderWidth: 1,
    borderColor: pastel.lavender,
  },
  expBarHorizontalFill: {
    height: "100%",
    backgroundColor: pastel.mint,
    borderRadius: 5,
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  animalModal: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: APP_COLORS.ivory,
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: APP_COLORS.yellow,
    shadowColor: APP_COLORS.brown,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  animalModalTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: APP_COLORS.brown,
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "KotraHope",
  },
  animalModalSubtitle: {
    fontSize: 16,
    color: APP_COLORS.brownLight,
    textAlign: "center",
    marginBottom: 24,
    fontFamily: "KotraHope",
  },
  profileInfo: { flex: 1 },
  nicknameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  nickname: { fontSize: 16, fontWeight: "700", color: pastel.text, fontFamily: "KotraHope", flexShrink: 1 },
  levelInline: { fontSize: 14, fontWeight: "700", color: pastel.pink, marginLeft: 4, fontFamily: "KotraHope" },
  statsRow: { flexDirection: "row", alignItems: "baseline", marginTop: 4 },
  statNum: { fontSize: 15, fontWeight: "700", color: pastel.text },
  statDiv: { fontSize: 12, color: pastel.textLight, marginHorizontal: 2 },
  statHint: { fontSize: 10, color: pastel.textLight, marginTop: 2, fontFamily: "KotraHope" },
  editProfileBtn: { padding: 6 },
  editProfileBtnText: { fontSize: 16 },
  topIconsRow: {
    flexDirection: "column",
    alignItems: "flex-end",
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: APP_COLORS.ivoryDark,
    borderWidth: 2,
    borderColor: APP_COLORS.ivoryDark,
  },
  animalOptionSelected: {
    borderColor: APP_COLORS.yellowDark,
    backgroundColor: "#FFF9CC",
  },
  animalImage: {
    width: 80,
    height: 80,
  },
  animalLabel: {
    fontSize: 18,
    color: APP_COLORS.brown,
    fontWeight: "600",
    fontFamily: "KotraHope",
  },
  animalConfirmBox: {
    marginTop: 16,
    backgroundColor: APP_COLORS.ivoryDark,
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: APP_COLORS.yellow,
  },
  animalConfirmTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: APP_COLORS.brown,
    textAlign: "center",
    marginBottom: 6,
    fontFamily: "KotraHope",
  },
  animalConfirmSubtitle: {
    fontSize: 15,
    color: APP_COLORS.brownLight,
    textAlign: "center",
    marginBottom: 12,
    fontFamily: "KotraHope",
  },
  animalConfirmButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  topIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: pastel.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: pastel.lavender,
  },
  topIcon: {},
  mainArea: { flex: 1, justifyContent: "center", alignItems: "center" },
  petTouchArea: { justifyContent: "center", alignItems: "center" },
  petWrap: {},
  petImage: {},
  bottomBar: {
  animalConfirmButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  animalConfirmCancel: {
    backgroundColor: APP_COLORS.ivoryDark,
    borderWidth: 1,
    borderColor: APP_COLORS.brownLight,
  },
  animalConfirmOk: {
    backgroundColor: APP_COLORS.yellow,
    borderWidth: 2,
    borderColor: APP_COLORS.yellowDark,
  },
  animalConfirmCancelText: {
    color: APP_COLORS.brown,
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "KotraHope",
  },
  animalConfirmOkText: {
    color: APP_COLORS.brown,
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "KotraHope",
  },
  profileScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    width: "100%",
  },
  profileModal: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: APP_COLORS.ivory,
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: APP_COLORS.yellow,
    shadowColor: APP_COLORS.brown,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  profileTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: APP_COLORS.brown,
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "KotraHope",
  },
  profileSubtitle: {
    fontSize: 16,
    color: APP_COLORS.brownLight,
    textAlign: "center",
    marginBottom: 24,
    fontFamily: "KotraHope",
  },
  selectedAnimalSummary: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: pastel.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 2,
    borderColor: pastel.lavender,
    ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 6 }, android: { elevation: 6 } }),
  },
  bottomItem: { alignItems: "center", justifyContent: "center", paddingVertical: 8, minWidth: 64 },
  bottomIcon: {},
  bottomLabel: { fontSize: 14, color: pastel.text, marginTop: 6, fontFamily: "KotraHope" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 20 },
  expDetailCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: pastel.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: pastel.lavender,
  },
  expDetailTitle: { fontSize: 18, color: pastel.textLight, fontFamily: "KotraHope" },
  expDetailLevel: { fontSize: 28, fontWeight: "bold", color: pastel.text, marginVertical: 8, fontFamily: "KotraHope" },
  expDetailBarBg: { height: 12, backgroundColor: pastel.lavender, borderRadius: 6, overflow: "hidden", marginBottom: 8 },
  expDetailBarFill: { height: "100%", backgroundColor: pastel.mint, borderRadius: 6 },
  expDetailText: { fontSize: 16, fontWeight: "600", color: pastel.text, fontFamily: "KotraHope" },
  expDetailSub: { fontSize: 13, color: pastel.textLight, marginTop: 4, fontFamily: "KotraHope" },
  expDetailClose: { marginTop: 20, backgroundColor: pastel.mint, paddingVertical: 14, borderRadius: 16, alignItems: "center" },
  expDetailCloseText: { fontSize: 16, fontWeight: "700", color: pastel.text, fontFamily: "KotraHope" },
  animalModal: { width: "100%", maxWidth: 400, backgroundColor: pastel.card, borderRadius: 24, padding: 24, borderWidth: 2, borderColor: pastel.lavender },
  animalModalTitle: { fontSize: 24, fontWeight: "bold", color: pastel.text, textAlign: "center", marginBottom: 8, fontFamily: "KotraHope" },
  animalModalSubtitle: { fontSize: 16, color: pastel.textLight, textAlign: "center", marginBottom: 20, fontFamily: "KotraHope" },
  animalOptions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  animalOption: { flexBasis: "48%", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 16, backgroundColor: pastel.bg, borderWidth: 2, borderColor: pastel.lavender },
  animalOptionSelected: { borderColor: pastel.mint, backgroundColor: "#E8F5E9" },
  animalImage: { width: 72, height: 72 },
  animalLabel: { fontSize: 16, color: pastel.text, fontWeight: "600", fontFamily: "KotraHope" },
  animalConfirmBox: { marginTop: 16, backgroundColor: "#E8F5E9", padding: 16, borderRadius: 16, borderWidth: 2, borderColor: pastel.mint },
  animalConfirmTitle: { fontSize: 18, fontWeight: "600", color: pastel.text, textAlign: "center", marginBottom: 6, fontFamily: "KotraHope" },
  animalConfirmSubtitle: { fontSize: 15, color: pastel.textLight, textAlign: "center", marginBottom: 12, fontFamily: "KotraHope" },
  animalConfirmButtons: { flexDirection: "row", gap: 12 },
  animalConfirmButton: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12 },
  animalConfirmCancel: { backgroundColor: pastel.lavender },
  animalConfirmOk: { backgroundColor: pastel.mint },
  animalConfirmCancelText: { color: pastel.text, fontSize: 16, fontWeight: "600", fontFamily: "KotraHope" },
  animalConfirmOkText: { color: pastel.text, fontSize: 16, fontWeight: "600", fontFamily: "KotraHope" },
  profileScrollContent: { flexGrow: 1, justifyContent: "center", width: "100%" },
  profileModal: { width: "100%", maxWidth: 400, backgroundColor: pastel.card, borderRadius: 24, padding: 24, borderWidth: 2, borderColor: pastel.lavender },
  profileTitle: { fontSize: 24, fontWeight: "bold", color: pastel.text, textAlign: "center", marginBottom: 8, fontFamily: "KotraHope" },
  profileSubtitle: { fontSize: 16, color: pastel.textLight, textAlign: "center", marginBottom: 20, fontFamily: "KotraHope" },
  selectedAnimalSummary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16, backgroundColor: pastel.bg, borderRadius: 12, paddingVertical: 12 },
  selectedAnimalImage: { width: 56, height: 56 },
  selectedAnimalLabel: { fontSize: 18, fontWeight: "600", color: pastel.text, fontFamily: "KotraHope" },
  input: { width: "100%", backgroundColor: pastel.bg, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, marginBottom: 14, borderWidth: 2, borderColor: pastel.lavender },
  saveButton: { backgroundColor: pastel.mint, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  saveButtonText: { color: pastel.text, fontSize: 18, fontWeight: "600", fontFamily: "KotraHope" },
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
    backgroundColor: APP_COLORS.ivoryDark,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.yellow,
  },
  selectedAnimalImage: {
    width: 60,
    height: 60,
  },
  selectedAnimalLabel: {
    fontSize: 20,
    fontWeight: "600",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: APP_COLORS.ivoryDark,
    color: APP_COLORS.brown,
  },
  saveButton: {
    backgroundColor: APP_COLORS.yellow,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 2,
    borderColor: APP_COLORS.yellowDark,
  },
  saveButtonText: {
    color: APP_COLORS.brown,
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "KotraHope",
  },
});
