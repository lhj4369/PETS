import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  ImageSourcePropType,
  Modal,
  PanResponder,
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
import { Ionicons } from "@expo/vector-icons";
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
import HomePlayScene from "../../components/HomePlayScene";
import { useCustomization, DEFAULT_ANIMAL_IMAGE, DEFAULT_BACKGROUND_IMAGE } from "../../context/CustomizationContext";
import { APP_COLORS } from "../../constants/theme";
import { getBackgroundTypeFromImage, getClockTypeFromImage, getBackgroundImageFromType, getClockImageFromType } from "../../utils/customizationUtils";
import { parseHomeLayout, getHouseOverlaySource, FLOOR_PLACE_RATIO } from "../../utils/homeLayout";
import { getDailyScripts, getPlaceholderPhrase } from "../../utils/dailyScripts";
import { getHeldTooLongAfterScripts, getHeldTooLongDuringScripts } from "../../utils/liftScripts";
import { useSession } from "../../context/SessionContext";

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

/** 홈 메인 캐릭터를 좌우로 쓰다듬을 때 표시 (동물별) */
const STROKE_IMAGES: Record<AnimalId, ImageSourcePropType> = {
  dog: require("../../assets/images/stroke/stroke_dog.png"),
  capybara: require("../../assets/images/stroke/stroke_capibara.png"),
  fox: require("../../assets/images/stroke/stroke_fox.png"),
  red_panda: require("../../assets/images/stroke/stroke_redpanda.png"),
  guinea_pig: require("../../assets/images/stroke/stroke_ginipig.png"),
};

function getStrokeImageForAnimal(animalId: AnimalId | null | undefined): ImageSourcePropType {
  if (animalId && animalId in STROKE_IMAGES) {
    return STROKE_IMAGES[animalId];
  }
  return STROKE_IMAGES.dog;
}
type ProfileResponse = {
  account?: { id: number; name: string; email: string } | null;
  isMaster?: boolean;
  unlocks?: string[];
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
    homeLayout?: unknown;
  } | null;
};

const EXP_PER_LEVEL = 100;

/** 이 시간(ms) 동안 가만히 누른 뒤에만 들어 올리기 가능 */
const PICKUP_ARM_MS = 420;
/** 가로 쓰다듬기로 인정하는 최소 이동(px) */
const STROKE_MIN_DX = 10;
/** 길게 누르기 전 움직임 허용치 — 초과 시 들기 취소(쓰다듬기 제외) */
const PRE_ARM_MOVE_CANCEL = 18;

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { openQuest } = useLocalSearchParams<{ openQuest?: string }>();

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showAnimalModal, setShowAnimalModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [pendingAnimal, setPendingAnimal] = useState<AnimalId | null>(null);
  const [showAnimalConfirm, setShowAnimalConfirm] = useState(false);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showExpDetailModal, setShowExpDetailModal] = useState(false);
  const petScaleAnim = useRef(new Animated.Value(1)).current;
  const [isPetStroking, setIsPetStroking] = useState(false);
  const petTranslateX = useRef(new Animated.Value(0)).current;
  const petTranslateY = useRef(new Animated.Value(0)).current;
  const pickupShadowAnim = useRef(new Animated.Value(0)).current;
  /** 들어 올리기 모드(길게 누른 뒤)에서만 true — 말풍선이 동물을 따라감 */
  const [isLiftDragging, setIsLiftDragging] = useState(false);
  const [isHeldTooLong, setIsHeldTooLong] = useState(false);
  const [heldTooLongText, setHeldTooLongText] = useState("");
  const [injectScript, setInjectScript] = useState<string | null>(null);
  const heldTooLongTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasHeldTooLongRef = useRef(false);
  const pickupArmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickupArmedRef = useRef(false);
  const strokeActiveRef = useRef(false);
  const heldTooLongStartedRef = useRef(false);

  // 위로 올라갈수록(translateY 음수) 그림자가 작아지는 인터폴레이션
  const shadowScale = petTranslateY.interpolate({
    inputRange: [-250, 0, 80],
    outputRange: [0.25, 1, 1.12],
    extrapolate: "clamp",
  });

  // 아래로 드래그 시 그림자가 동물을 따라 내려감(발 밑 유지),
  // 위로 드래그 시 그림자는 땅에 고정(제자리)
  const shadowTranslateY = petTranslateY.interpolate({
    inputRange: [-300, 0, 300],
    outputRange: [0, 0, 300],
    extrapolate: "clamp",
  });
  const { openSettings } = useSettingsModal();
  const { setSessionFromLogin, refreshSession } = useSession();

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
  const {
    selectedAnimal,
    selectedBackground,
    selectedClock,
    setCustomization,
    loadCustomizationFromServer,
    homeLayout,
    setHomeLayout,
    selectedAnimalId: ctxAnimalId,
  } = useCustomization();

  // 말풍선 상호작용
  const [scriptIndex, setScriptIndex] = useState(-1);
  const [isScriptVisible, setIsScriptVisible] = useState(false);
  const speechBubbleOpacity = useRef(new Animated.Value(0)).current;
  const speechBubbleScale = useRef(new Animated.Value(0.95)).current;
  const scriptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAutoPlayedGreeting = useRef(false);

  const dailyScripts = useMemo(() => getDailyScripts(ctxAnimalId ?? null), [ctxAnimalId]);
  const placeholderPhrase = useMemo(() => getPlaceholderPhrase(ctxAnimalId ?? null), [ctxAnimalId]);
  const heldTooLongDuringScripts = useMemo(() => getHeldTooLongDuringScripts(ctxAnimalId ?? null), [ctxAnimalId]);
  const heldTooLongAfterScripts = useMemo(() => getHeldTooLongAfterScripts(ctxAnimalId ?? null), [ctxAnimalId]);
  const currentScript = useMemo(() => (scriptIndex >= 0 ? dailyScripts[scriptIndex] : ""), [scriptIndex, dailyScripts]);

  const dailyScriptsRef = useRef(dailyScripts);
  useEffect(() => {
    dailyScriptsRef.current = dailyScripts;
  }, [dailyScripts]);

  const heldTooLongDuringScriptsRef = useRef(heldTooLongDuringScripts);
  useEffect(() => {
    heldTooLongDuringScriptsRef.current = heldTooLongDuringScripts;
  }, [heldTooLongDuringScripts]);

  const heldTooLongAfterScriptsRef = useRef(heldTooLongAfterScripts);
  useEffect(() => {
    heldTooLongAfterScriptsRef.current = heldTooLongAfterScripts;
  }, [heldTooLongAfterScripts]);

  const getAnimalImage = (animalId: AnimalId | null): ImageSourcePropType => {
    if (!animalId) return DEFAULT_ANIMAL_IMAGE;
    const animal = ANIMAL_OPTIONS.find((a) => a.id === animalId);
    return animal?.image ?? DEFAULT_ANIMAL_IMAGE;
  };

  const petSize = Math.min(178, screenWidth * 0.43);
  const rightIconSize = Math.max(68, Math.min(76, screenWidth * 0.17));
  const bottomIconSize = 84;

  const [floorLayout, setFloorLayout] = useState({ w: 0, h: 0 });

  /** 동물 머리 위(바닥 슬롯 좌표계) — 말풍선 앵커 */
  const speechAnchorStyle = useMemo(() => {
    if (floorLayout.w <= 0 || floorLayout.h <= 0) {
      return { opacity: 0, pointerEvents: "none" as const };
    }
    const ax = homeLayout.animal.x * floorLayout.w;
    const ay = homeLayout.animal.y * floorLayout.h;
    const bubbleW = 280;
    const bubbleStackH = 108;
    const top = ay - petSize * 0.5 - bubbleStackH;
    const left = Math.max(8, Math.min(ax - bubbleW / 2, floorLayout.w - bubbleW - 8));
    return {
      position: "absolute" as const,
      left,
      top,
      width: bubbleW,
      zIndex: 21,
      alignItems: "center" as const,
      pointerEvents: "none" as const,
    };
  }, [floorLayout.w, floorLayout.h, homeLayout.animal.x, homeLayout.animal.y, petSize]);

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
      setSessionFromLogin({
        isMaster: !!data.isMaster,
        unlocks: Array.isArray(data.unlocks) ? data.unlocks : [],
      });
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
          setCustomization(animalImage, serverBackground, serverClock, animalType);
          setHomeLayout(parseHomeLayout(data.profile?.homeLayout));
        } else {
          loadCustomizationFromServer(data.profile?.backgroundType, data.profile?.clockType, data.profile?.homeLayout);
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
  }, [setCustomization, loadCustomizationFromServer, setHomeLayout, setSessionFromLogin]);

  useFocusEffect(useCallback(() => {
    fetchProfile();
    hasAutoPlayedGreeting.current = false;
  }, [fetchProfile]));

  // 홈 화면 진입 시 인사 말풍선 자동 재생
  useEffect(() => {
    if (dailyScripts.length === 0 || hasAutoPlayedGreeting.current) return;
    const showTimer = setTimeout(() => {
      setScriptIndex(0);
      setIsScriptVisible(true);
      hasAutoPlayedGreeting.current = true;
      scriptTimerRef.current = setTimeout(() => setIsScriptVisible(false), 4000);
    }, 600);
    return () => {
      clearTimeout(showTimer);
      if (scriptTimerRef.current) clearTimeout(scriptTimerRef.current);
    };
  }, [dailyScripts]);

  // 말풍선 등장 애니메이션 (일반 스크립트 + inject 스크립트)
  useEffect(() => {
    const textToShow = injectScript ?? currentScript;
    if (isScriptVisible && textToShow !== "") {
      speechBubbleOpacity.setValue(0);
      speechBubbleScale.setValue(0.95);
      Animated.parallel([
        Animated.timing(speechBubbleOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(speechBubbleScale, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [isScriptVisible, currentScript, injectScript]);

  // 오래 들고있을 때 말풍선 등장 애니메이션
  useEffect(() => {
    if (isHeldTooLong && heldTooLongText !== "") {
      speechBubbleOpacity.setValue(0);
      speechBubbleScale.setValue(0.95);
      Animated.parallel([
        Animated.timing(speechBubbleOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(speechBubbleScale, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [isHeldTooLong, heldTooLongText]);

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (scriptTimerRef.current) clearTimeout(scriptTimerRef.current);
      if (heldTooLongTimerRef.current) clearTimeout(heldTooLongTimerRef.current);
      if (pickupArmTimerRef.current) clearTimeout(pickupArmTimerRef.current);
    };
  }, []);

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
  const navigateToDefense = () => router.push("/(tabs)/defense" as any);
  const navigateToCustomize = () => router.push("/(tabs)/customize" as any);
  const navigateToChallenges = () => router.push("/(tabs)/challenges" as any);
  const navigateToChatting = () => router.push("/(tabs)/chatting" as any);
  const navigateToSettings = () => openSettings();
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
      homeLayout,
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
      await refreshSession();
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

  const showNextScript = useCallback(() => {
    setInjectScript(null);
    const len = dailyScriptsRef.current.length;
    if (len === 0) return;
    setScriptIndex((prev) => (prev + 1) % len);
    setIsScriptVisible(true);
    if (scriptTimerRef.current) clearTimeout(scriptTimerRef.current);
    scriptTimerRef.current = setTimeout(() => setIsScriptVisible(false), 4000);
  }, []);

  const showInjectScript = useCallback((text: string) => {
    setInjectScript(text);
    setIsScriptVisible(true);
    if (scriptTimerRef.current) clearTimeout(scriptTimerRef.current);
    scriptTimerRef.current = setTimeout(() => {
      setIsScriptVisible(false);
      setInjectScript(null);
    }, 4000);
  }, []);

  const showInjectScriptRef = useRef(showInjectScript);
  useEffect(() => { showInjectScriptRef.current = showInjectScript; }, [showInjectScript]);

  const showNextScriptRef = useRef(showNextScript);
  useEffect(() => { showNextScriptRef.current = showNextScript; }, [showNextScript]);

  const setIsHeldTooLongRef = useRef(setIsHeldTooLong);
  const setHeldTooLongTextRef = useRef(setHeldTooLongText);
  const setIsScriptVisibleRef = useRef(setIsScriptVisible);
  const setInjectScriptRef = useRef(setInjectScript);

  const snapLiftBack = () => {
    Animated.parallel([
      Animated.spring(petTranslateX, { toValue: 0, tension: 180, friction: 8, useNativeDriver: true }),
      Animated.spring(petTranslateY, { toValue: 0, tension: 220, friction: 7, useNativeDriver: true }),
      Animated.timing(pickupShadowAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(petScaleAnim, { toValue: 1.0, duration: 140, useNativeDriver: true }),
        Animated.timing(petScaleAnim, { toValue: 0.85, duration: 70, useNativeDriver: true }),
        Animated.spring(petScaleAnim, { toValue: 1, tension: 420, friction: 9, useNativeDriver: true }),
      ]),
    ]).start();
  };

  const resetAfterStroke = () => {
    petTranslateX.setValue(0);
    petTranslateY.setValue(0);
    Animated.parallel([
      Animated.timing(pickupShadowAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(petScaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const cancelPickupArmTimer = () => {
    if (pickupArmTimerRef.current) {
      clearTimeout(pickupArmTimerRef.current);
      pickupArmTimerRef.current = null;
    }
  };

  const petPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,

      onPanResponderGrant: () => {
        pickupArmedRef.current = false;
        strokeActiveRef.current = false;
        heldTooLongStartedRef.current = false;
        setIsPetStroking(false);
        setIsLiftDragging(false);
        setIsScriptVisibleRef.current(false);
        setInjectScriptRef.current(null);
        wasHeldTooLongRef.current = false;
        setIsHeldTooLongRef.current(false);
        cancelPickupArmTimer();
        if (heldTooLongTimerRef.current) {
          clearTimeout(heldTooLongTimerRef.current);
          heldTooLongTimerRef.current = null;
        }

        pickupArmTimerRef.current = setTimeout(() => {
          if (strokeActiveRef.current) return;
          pickupArmedRef.current = true;
          setIsLiftDragging(true);
          Animated.parallel([
            Animated.spring(petScaleAnim, {
              toValue: 1.12,
              tension: 200,
              friction: 10,
              useNativeDriver: true,
            }),
            Animated.timing(pickupShadowAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
          ]).start();
        }, PICKUP_ARM_MS);
      },

      onPanResponderMove: (_, g) => {
        const stroke =
          Math.abs(g.dx) > STROKE_MIN_DX &&
          Math.abs(g.dx) >= Math.abs(g.dy) * 1.05;

        if (stroke) {
          strokeActiveRef.current = true;
          cancelPickupArmTimer();
          pickupArmedRef.current = false;
          setIsLiftDragging(false);
          setIsPetStroking(true);
          petTranslateX.setValue(0);
          petTranslateY.setValue(0);
          Animated.parallel([
            Animated.timing(pickupShadowAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
            Animated.timing(petScaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
          ]).start();
          return;
        }

        if (!pickupArmedRef.current) {
          if (Math.abs(g.dx) + Math.abs(g.dy) > PRE_ARM_MOVE_CANCEL) {
            cancelPickupArmTimer();
          }
          return;
        }

        petTranslateX.setValue(g.dx);
        petTranslateY.setValue(g.dy - 30);

        if (!heldTooLongStartedRef.current && (Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6)) {
          heldTooLongStartedRef.current = true;
          heldTooLongTimerRef.current = setTimeout(() => {
            const scripts = heldTooLongDuringScriptsRef.current;
            if (scripts.length === 0) return;
            const text =
              scripts[
                Math.floor(Math.random() * scripts.length)
              ];
            setIsHeldTooLongRef.current(true);
            setHeldTooLongTextRef.current(text);
            wasHeldTooLongRef.current = true;
          }, 5000);
        }
      },

      onPanResponderRelease: (_, g) => {
        cancelPickupArmTimer();
        if (heldTooLongTimerRef.current) {
          clearTimeout(heldTooLongTimerRef.current);
          heldTooLongTimerRef.current = null;
        }

        setIsLiftDragging(false);
        setIsPetStroking(false);
        setIsHeldTooLongRef.current(false);

        const heldLong = wasHeldTooLongRef.current;
        wasHeldTooLongRef.current = false;
        heldTooLongStartedRef.current = false;

        const tap = Math.abs(g.dx) < 10 && Math.abs(g.dy) < 10;
        const hadStroke = strokeActiveRef.current;
        strokeActiveRef.current = false;

        const hadLift = pickupArmedRef.current;
        pickupArmedRef.current = false;

        const tapBounce = () => {
          Animated.sequence([
            Animated.timing(petScaleAnim, { toValue: 1.08, duration: 80, useNativeDriver: true }),
            Animated.timing(petScaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
          ]).start();
        };

        if (hadStroke) {
          resetAfterStroke();
          return;
        }

        if (hadLift) {
          snapLiftBack();
          if (heldLong) {
            const scripts = heldTooLongAfterScriptsRef.current;
            if (scripts.length === 0) return;
            const text =
              scripts[
                Math.floor(Math.random() * scripts.length)
              ];
            showInjectScriptRef.current(text);
          } else if (tap) {
            showNextScriptRef.current();
            tapBounce();
          }
          return;
        }

        petTranslateX.setValue(0);
        petTranslateY.setValue(0);
        Animated.parallel([
          Animated.timing(pickupShadowAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
          Animated.timing(petScaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        ]).start();
        if (tap) {
          showNextScriptRef.current();
          tapBounce();
        }
      },

      onPanResponderTerminate: () => {
        cancelPickupArmTimer();
        if (heldTooLongTimerRef.current) {
          clearTimeout(heldTooLongTimerRef.current);
          heldTooLongTimerRef.current = null;
        }
        const hadStroke = strokeActiveRef.current;
        const hadLift = pickupArmedRef.current;
        strokeActiveRef.current = false;
        pickupArmedRef.current = false;
        wasHeldTooLongRef.current = false;
        heldTooLongStartedRef.current = false;
        setIsLiftDragging(false);
        setIsPetStroking(false);
        setIsHeldTooLong(false);
        if (hadStroke) resetAfterStroke();
        else if (hadLift) snapLiftBack();
        else resetAfterStroke();
      },
    }),
  ).current;

  const strokeAnimalId = (ctxAnimalId ?? selectedAnimalId) as AnimalId | null;
  const mainPetImage = isPetStroking
    ? getStrokeImageForAnimal(strokeAnimalId)
    : (selectedAnimal ?? DEFAULT_ANIMAL_IMAGE);

  const currentExp = Math.max(0, experience - (level - 1) * EXP_PER_LEVEL);
  const expProgress = Math.min(1, currentExp / EXP_PER_LEVEL);
  const nextLevelExp = EXP_PER_LEVEL;

  const houseOverlay = useMemo(
    () => getHouseOverlaySource(homeLayout.houseType),
    [homeLayout.houseType],
  );

  return (
    <View style={styles.background}>
      <Image
        source={selectedBackground ?? DEFAULT_BACKGROUND_IMAGE}
        style={styles.fullBleedLayer}
        resizeMode="stretch"
      />
      {houseOverlay ? (
        <Image source={houseOverlay} style={styles.fullBleedLayer} resizeMode="stretch" />
      ) : null}
      <SafeAreaView style={styles.safeArea}>
        {isLoadingProfile && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#B8E0D2" />
          </View>
        )}

        {/* 상단: 프로필 / 닉네임 / 스탯박스 (창 크기에 맞게) */}
        <View style={[styles.topBlock, { paddingTop: insets.top, paddingHorizontal: 0 }]}>
          <View style={[styles.topRow, { width: screenWidth }]}>
            {/* 좌측: 프로필 + 닉네임 */}
            <View style={styles.topRowLeft}>
            <TouchableOpacity
              style={styles.profileLeftBox}
              activeOpacity={0.85}
              onPress={() => setShowExpDetailModal(true)}
            >
              <View style={styles.avatarCircle}>
                <Image
                  source={selectedAnimal ?? DEFAULT_ANIMAL_IMAGE}
                  style={styles.avatarImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.profileLevelRow}>
                <Text style={styles.levelLabel}>Lv.{level}</Text>
                <View style={styles.expBarSmall}>
                  <View
                    style={[
                      styles.expBarHorizontalFill,
                      { width: `${Math.min(100, expProgress * 100)}%` },
                    ]}
                  />
                </View>
              </View>
              <TouchableOpacity style={styles.editProfileBtn} onPress={(e) => { e.stopPropagation(); handleEditProfile(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.editProfileBtnText}>✏️</Text>
              </TouchableOpacity>
            </TouchableOpacity>

            <View style={styles.nicknameBox}>
              <Text style={styles.nicknameInBox} numberOfLines={1}>{nickname || accountName || "PETS"}</Text>
            </View>
            </View>

            {/* 스탯 박스들 (flex로 남은 공간 채움) */}
            <View style={styles.topRowStats}>
            <View style={[styles.statBox, styles.statBoxMid]}>
              <View style={styles.statLabelCircle}><Text style={styles.statLabelText}>힘</Text></View>
              <Text style={styles.statValue}>{strength}</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxMid]}>
              <View style={styles.statLabelCircle}><Text style={styles.statLabelText}>민첩</Text></View>
              <Text style={styles.statValue}>{agility}</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxMid]}>
              <View style={styles.statLabelCircle}><Text style={styles.statLabelText}>지구력</Text></View>
              <Text style={styles.statValue}>{stamina}</Text>
            </View>
            <View style={[styles.statBox, styles.statBoxLast]}>
              <View style={styles.statLabelCircle}><Text style={styles.statLabelText}>집중</Text></View>
              <Text style={styles.statValue}>{concentration}</Text>
            </View>
            </View>
          </View>
        </View>

        {/* 메인: 캐릭터 + 우측 세로 버튼 3개 + 햄버거 */}
        <View style={styles.mainArea}>
          <View
            style={[styles.floorPlaceSlot, { height: `${FLOOR_PLACE_RATIO * 100}%` }]}
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              setFloorLayout({ w: width, h: height });
            }}
          >
            <View
              style={[
                styles.homePlaySceneWrap,
                Platform.OS === "web" && ({ touchAction: "none" } as object),
              ]}
            >
              <HomePlayScene
                layout={homeLayout}
                animalSource={mainPetImage}
                petSize={petSize}
                petPanHandlers={petPanResponder.panHandlers}
                petScaleAnim={petScaleAnim}
                petOffsetX={petTranslateX}
                petOffsetY={petTranslateY}
                pickupShadowAnim={pickupShadowAnim}
                shadowScale={shadowScale}
                shadowTranslateY={shadowTranslateY}
                expandPetTouchPad
              />
            </View>
            {/* 말풍선·플레이스홀더는 씬 위에 그려야 동물 좌표와 맞고, pointerEvents none으로 터치는 씬으로 통과 */}
            <View style={styles.speechOverlay} pointerEvents="box-none">
              <Animated.View
                style={[
                  speechAnchorStyle,
                  isLiftDragging && {
                    transform: [{ translateX: petTranslateX }, { translateY: petTranslateY }],
                  },
                ]}
              >
                {isLiftDragging && isHeldTooLong ? (
                  <Animated.View
                    style={[
                      styles.homeSpeechBubble,
                      { opacity: speechBubbleOpacity, transform: [{ scale: speechBubbleScale }] },
                    ]}
                  >
                    <Text style={styles.homeSpeechText}>{heldTooLongText}</Text>
                    <View style={styles.homeSpeechTail} />
                  </Animated.View>
                ) : isScriptVisible && (injectScript ?? currentScript) !== "" ? (
                  <Animated.View
                    style={[
                      styles.homeSpeechBubble,
                      { opacity: speechBubbleOpacity, transform: [{ scale: speechBubbleScale }] },
                    ]}
                  >
                    <Text style={styles.homeSpeechText}>{injectScript ?? currentScript}</Text>
                    <View style={styles.homeSpeechTail} />
                  </Animated.View>
                ) : !isLiftDragging ? (
                  <View style={styles.homeSpeechPlaceholderBubble}>
                    <Text style={styles.homeSpeechPlaceholderText}>{placeholderPhrase}</Text>
                    <View style={[styles.homeSpeechTail, styles.homeSpeechPlaceholderTail]} />
                  </View>
                ) : null}
              </Animated.View>
            </View>
          </View>

          {/* 우측 세로 배치: 퀘스트 / 채팅 / 랭킹 (메뉴명 원 안 아래, 아이콘과 약간 겹침) */}
          <View style={[styles.rightFloatingColumn, { top: 16 }]}>
            <TouchableOpacity style={styles.rightFloatingBtn} onPress={() => setShowQuestModal(true)} activeOpacity={0.7}>
              <View style={styles.rightFloatingIconWrap}>
                <Image source={HOME_ICONS.quest} style={[styles.rightFloatingIcon, { width: rightIconSize, height: rightIconSize }]} resizeMode="contain" />
              </View>
              <Text style={styles.rightFloatingLabel}>퀘스트</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rightFloatingBtn} onPress={navigateToChatting} activeOpacity={0.7}>
              <View style={styles.rightFloatingIconWrap}>
                <Image source={HOME_ICONS.aiChat} style={[styles.rightFloatingIcon, { width: rightIconSize, height: rightIconSize }]} resizeMode="contain" />
              </View>
              <Text style={styles.rightFloatingLabel}>채팅</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rightFloatingBtn} onPress={navigateToRanking} activeOpacity={0.7}>
              <View style={styles.rightFloatingIconWrap}>
                <Image source={HOME_ICONS.ranking} style={[styles.rightFloatingIcon, { width: rightIconSize, height: rightIconSize }]} resizeMode="contain" />
              </View>
              <Text style={styles.rightFloatingLabel}>랭킹</Text>
            </TouchableOpacity>
          </View>

          {/* 우측 중단: 디펜스 (퀘스트/채팅/랭킹과 동일 버튼 스타일) */}
          <TouchableOpacity
            style={[styles.rightFloatingBtn, styles.defenseFloatingBtn]}
            onPress={navigateToDefense}
            activeOpacity={0.7}
          >
            <View style={styles.rightFloatingIconWrap}>
              <Ionicons name="shield" size={rightIconSize * 0.42} color={APP_COLORS.brown} />
            </View>
            <Text style={styles.rightFloatingLabel}>디펜스</Text>
          </TouchableOpacity>
        </View>

        {/* 하단 고정 메뉴: 하단에 딱 붙음, 아이콘 크고 아래로 */}
        <View style={[styles.bottomBarWrapper, { paddingBottom: 0 }]}>
          <View style={styles.bottomBar}>
            <View style={[styles.bottomBarBg, { height: 50 + Math.max(0, insets.bottom) }]} />
            <View style={styles.bottomItemsRow}>
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
          </View>
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

                {selectedAnimalId && (
                  <View style={styles.selectedAnimalSummary}>
                    <Image source={ANIMAL_OPTIONS.find((a) => a.id === selectedAnimalId)?.image ?? require("../../assets/images/animals/dog.png")} style={styles.selectedAnimalImage} resizeMode="contain" />
                    <Text style={styles.selectedAnimalLabel}>{ANIMAL_OPTIONS.find((a) => a.id === selectedAnimalId)?.label ?? ""}</Text>
                  </View>
                )}
                <TextInput style={styles.input} placeholder="닉네임을 입력하세요" value={nickname} onChangeText={setNickname} placeholderTextColor="#999" />
                <TextInput style={styles.input} placeholder="키(cm)를 입력하세요" value={height} onChangeText={setHeight} keyboardType="numeric" placeholderTextColor="#999" />
                <TextInput style={styles.input} placeholder="몸무게(kg)를 입력하세요" value={weight} onChangeText={setWeight} keyboardType="numeric" placeholderTextColor="#999" />

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
    </View>
  );
};

export default HomeScreen;

const pastel = {
  bg: "#FFFEF5",
  card: "#FFF8E7",
  mint: "#B8E0D2",
  pink: "#F5D4E8",
  lavender: "#E8E0F0",
  text: "#8B7355",
  textLight: "#A08060",
};

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", height: "100%", backgroundColor: "#FFF8E1" },
  fullBleedLayer: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    ...(Platform.OS === "web" && ({ objectPosition: "center center" } as object)),
  },
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
  topRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "flex-start",
  },
  topRowLeft: {
    flexDirection: "row",
    flexShrink: 0,
  },
  topRowStats: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "stretch",
    justifyContent: "space-between",
    minWidth: 0,
  },
  profileLeftBox: {
    backgroundColor: pastel.bg,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 10,
    paddingTop: 12,
    paddingLeft: 10,
    borderWidth: 1,
    borderColor: pastel.lavender,
    borderTopWidth: 0,
    marginRight: -1,
    alignItems: "center",
    minWidth: 88,
    ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4 }, android: { elevation: 3 } }),
  },
  nicknameBox: {
    backgroundColor: pastel.bg,
    borderRadius: 10,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingVertical: 6,
    paddingHorizontal: 10,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: pastel.lavender,
    marginRight: -1,
    justifyContent: "center",
    alignSelf: "flex-start",
    ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4 }, android: { elevation: 3 } }),
  },
  nicknameInBox: {
    fontSize: 13,
    fontWeight: "700",
    color: pastel.text,
    fontFamily: "KotraHope",
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: pastel.mint,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: pastel.pink,
  },
  avatarImage: {
    width: 40,
    height: 40,
  },
  profileLevelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    width: "100%",
    justifyContent: "center",
  },
  levelLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: pastel.pink,
    fontFamily: "KotraHope",
  },
  expBarSmall: {
    width: 56,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FBF6ED",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: pastel.lavender,
  },
  expBarHorizontalFill: {
    height: "100%",
    backgroundColor: pastel.mint,
    borderRadius: 4,
  },
  statBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: pastel.bg,
    borderRadius: 10,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingVertical: 4,
    paddingHorizontal: 4,
    paddingTop: 8,
    borderWidth: 1,
    borderColor: pastel.lavender,
    marginRight: -1,
    minWidth: 0,
  },
  statBoxMid: {},
  statBoxLast: { marginRight: 0 },
  statLabelCircle: {
    backgroundColor: pastel.mint,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
  },
  statLabelText: {
    fontSize: 11,
    fontWeight: "700",
    color: pastel.text,
    fontFamily: "KotraHope",
  },
  statValue: {
    fontSize: 13,
    fontWeight: "700",
    color: pastel.text,
    fontFamily: "KotraHope",
  },
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
  editProfileBtn: { position: "absolute", top: 4, right: 4, padding: 6 },
  editProfileBtnText: { fontSize: 18, color: "#E07C3C" },
  rightFloatingColumn: {
    position: "absolute",
    right: 16,
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    zIndex: 6,
    elevation: 6,
  },
  rightFloatingBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: pastel.card,
    justifyContent: "flex-end",
    alignItems: "center",
    borderWidth: 2,
    borderColor: pastel.lavender,
    overflow: "hidden",
    paddingBottom: 2,
    paddingTop: 2,
    ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 }, android: { elevation: 3 } }),
  },
  rightFloatingIconWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  rightFloatingIcon: {},
  rightFloatingLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: pastel.text,
    fontFamily: "KotraHope",
    marginTop: -6,
  },
  /** 우측 세로 메뉴와 동일 원형 버튼, 세로 위치만 화면 중단 쪽으로 */
  defenseFloatingBtn: {
    position: "absolute",
    right: 16,
    top: "38%",
    zIndex: 6,
  },
  animalOptionSelected: {
    borderColor: APP_COLORS.yellowDark,
    backgroundColor: "#FFF9CC",
  },
  animalImage: {
    width: 44,
    height: 44,
  },
  animalLabel: {
    fontSize: 11,
    color: APP_COLORS.brown,
    fontWeight: "600",
    fontFamily: "KotraHope",
    textAlign: "center",
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
  mainArea: { flex: 1, width: "100%", position: "relative" },
  floorPlaceSlot: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
  },
  speechOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    elevation: 28,
    pointerEvents: "box-none",
  },
  homePlaySceneWrap: { flex: 1, zIndex: 0 },
  homeSpeechBubble: {
    backgroundColor: "rgba(255,255,255,0.97)",
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderRadius: 22,
    marginBottom: 10,
    maxWidth: 280,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    position: "relative",
  },
  homeSpeechText: { fontSize: 18, color: "#333", lineHeight: 27, textAlign: "center", fontFamily: "KotraHope" },
  homeSpeechPlaceholderBubble: {
    backgroundColor: "rgba(255,255,255,0.75)",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 18,
    marginBottom: 10,
    position: "relative",
  },
  homeSpeechPlaceholderText: { fontSize: 16, color: "#999", textAlign: "center", fontFamily: "KotraHope" },
  homeSpeechTail: {
    position: "absolute",
    bottom: -10,
    left: "50%",
    marginLeft: -10,
    width: 20,
    height: 20,
    backgroundColor: "rgba(255,255,255,0.97)",
    transform: [{ rotate: "45deg" }],
  },
  homeSpeechPlaceholderTail: { backgroundColor: "rgba(255,255,255,0.75)" },
  bottomBarWrapper: {
    width: "100%",
  },
  bottomBar: {
    width: "100%",
    minHeight: 110,
    position: "relative",
  },
  bottomBarBg: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: pastel.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: pastel.lavender,
    ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 6 }, android: { elevation: 4 } }),
  },
  bottomItemsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 10,
    paddingHorizontal: 4,
    minHeight: 110,
  },
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
  bottomItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    minWidth: 0,
  },
  bottomIcon: { marginBottom: -14 },
  bottomLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: pastel.text,
    fontFamily: "KotraHope",
  },
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
  animalOptions: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "space-between",
    alignItems: "stretch",
    gap: 6,
    width: "100%",
  },
  animalOption: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 12,
    backgroundColor: pastel.bg,
    borderWidth: 2,
    borderColor: pastel.lavender,
  },
  selectedAnimalImage: { width: 56, height: 56 },
  selectedAnimalLabel: { fontSize: 18, fontWeight: "600", color: pastel.text, fontFamily: "KotraHope" },
  input: { width: "100%", backgroundColor: pastel.bg, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, marginBottom: 14, borderWidth: 2, borderColor: pastel.lavender },
  saveButton: { backgroundColor: pastel.mint, borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  saveButtonText: { color: pastel.text, fontSize: 18, fontWeight: "600", fontFamily: "KotraHope" },
});
