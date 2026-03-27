// 커스터마이징 — 홈과 동일한 미리보기, 하단 탭 + 바텀시트
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Modal,
  SafeAreaView,
  Image,
  ImageSourcePropType,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
  Alert,
  Animated,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import HomeButton from "../../components/HomeButton";
import HomePlayScene from "../../components/HomePlayScene";
import type { PlacementTarget } from "../../components/HomePlayScene";
import { useCustomization, DEFAULT_ANIMAL_IMAGE, DEFAULT_BACKGROUND_IMAGE } from "../../context/CustomizationContext";
import { getBackgroundTypeFromImage, getClockImageFromType } from "../../utils/customizationUtils";
import {
  layoutHasOverlap,
  DECORATION_ASSETS,
  DECORATION_LABELS,
  DECORATION_EFFECT_TEXT,
  DecorationId,
  HomeLayout,
  HouseType,
  MAX_DECORATIONS,
  STANDARD_HOUSE_IMAGE,
  getHouseOverlaySource,
  FLOOR_PLACE_RATIO,
} from "../../utils/homeLayout";
import AuthManager from "../../utils/AuthManager";
import API_BASE_URL from "../../config/api";

const THEME_YELLOW = "#FFD54F";
const THEME_CREAM = "#FFF8E1";
const THEME_TEXT_DARK = "#333333";

const ANIMALS = [
  { id: "dog", label: "강아지", src: require("../../assets/images/animals/dog.png") },
  { id: "capybara", label: "카피바라", src: require("../../assets/images/animals/capibara.png") },
  { id: "fox", label: "사막여우", src: require("../../assets/images/animals/fox.png") },
  { id: "guinea_pig", label: "기니피그", src: require("../../assets/images/animals/ginipig.png") },
  { id: "red_panda", label: "레서판다", src: require("../../assets/images/animals/red_panda.png") },
] as const;

const BACKGROUNDS: { name: string; src: ImageSourcePropType; type: string }[] = [
  { name: "기본", src: require("../../assets/images/background/home.png"), type: "home" },
  { name: "봄", src: require("../../assets/images/background/spring.png"), type: "spring" },
  { name: "여름", src: require("../../assets/images/background/summer.png"), type: "summer" },
  { name: "도시", src: require("../../assets/images/background/city.png"), type: "city" },
  { name: "도시2", src: require("../../assets/images/background/city-1.png"), type: "city_1" },
  { name: "가을", src: require("../../assets/images/background/fall.png"), type: "fall" },
  { name: "겨울", src: require("../../assets/images/background/winter.png"), type: "winter" },
  { name: "헬스장", src: require("../../assets/images/background/healthclub.png"), type: "healthclub" },
];

const DECORATION_IDS: DecorationId[] = ["bench", "dumbbell", "treadmill"];

function cloneLayout(layout: HomeLayout): HomeLayout {
  return {
    animal: { ...layout.animal },
    decorations: layout.decorations.map((d) => ({ ...d })),
    houseType: layout.houseType ?? "none",
  };
}

const HOUSE_OPTIONS: { id: HouseType; label: string; thumb: ImageSourcePropType | null }[] = [
  { id: "none", label: "없음", thumb: null },
  { id: "standard", label: "기본", thumb: STANDARD_HOUSE_IMAGE },
];

export default function CustomizeScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const {
    setCustomization,
    setHomeLayout,
    homeLayout,
    selectedAnimalId,
    selectedBackground,
  } = useCustomization();

  const [draftLayout, setDraftLayout] = useState<HomeLayout>(() => cloneLayout(homeLayout));
  const [draftAnimalId, setDraftAnimalId] = useState<string>(selectedAnimalId ?? "dog");
  const [draftBg, setDraftBg] = useState<ImageSourcePropType>(selectedBackground ?? DEFAULT_BACKGROUND_IMAGE);
  const [sheet, setSheet] = useState<"animal" | "bg" | "house" | "decor" | null>(null);
  const [decorDetail, setDecorDetail] = useState<DecorationId | null>(null);
  const [placementTarget, setPlacementTarget] = useState<PlacementTarget>(null);
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setDraftLayout(cloneLayout(homeLayout));
      setDraftAnimalId(selectedAnimalId ?? "dog");
      setDraftBg(selectedBackground ?? DEFAULT_BACKGROUND_IMAGE);
      setPlacementTarget(null);
      setSheet(null);
      setDecorDetail(null);
    }, [homeLayout, selectedAnimalId, selectedBackground])
  );

  const petSize = Math.min(178, screenWidth * 0.43);

  const animalSrc = useMemo(() => {
    const a = ANIMALS.find((x) => x.id === draftAnimalId);
    return a?.src ?? DEFAULT_ANIMAL_IMAGE;
  }, [draftAnimalId]);

  const placementValid = !layoutHasOverlap(draftLayout);
  const currentBgType = getBackgroundTypeFromImage(draftBg);
  const draftHouseType = draftLayout.houseType ?? "none";
  const houseOverlay = getHouseOverlaySource(draftHouseType);

  const sheetHeight = Math.min(screenHeight * 0.52, 420);
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (sheet !== null) {
      slideAnim.setValue(sheetHeight);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 68,
        friction: 12,
      }).start();
    }
  }, [sheet, sheetHeight, slideAnim]);

  const closeSheetAnimated = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: sheetHeight,
      duration: 260,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setSheet(null);
    });
  }, [sheetHeight, slideAnim]);

  const onAnimalDragTo = useCallback((x: number, y: number) => {
    setDraftLayout((prev) => ({ ...prev, animal: { x, y } }));
  }, []);

  const onDecorationDragTo = useCallback((id: DecorationId, x: number, y: number) => {
    setDraftLayout((prev) => ({
      ...prev,
      decorations: prev.decorations.map((d) => (d.id === id ? { ...d, x, y } : d)),
    }));
  }, []);

  const selectAnimal = (id: string) => {
    setDraftAnimalId(id);
    setDraftLayout((prev) => ({
      ...prev,
      animal: { x: 0.5, y: 0.58 },
    }));
    setPlacementTarget("animal");
    closeSheetAnimated();
  };

  const canPlaceNewDecoration = useCallback(
    (id: DecorationId) => {
      const exists = draftLayout.decorations.some((d) => d.id === id);
      if (exists) return true;
      return draftLayout.decorations.length < MAX_DECORATIONS;
    },
    [draftLayout.decorations]
  );

  const removeDecoration = useCallback((id: DecorationId) => {
    setDraftLayout((prev) => ({
      ...prev,
      decorations: prev.decorations.filter((d) => d.id !== id),
    }));
    setPlacementTarget(null);
    setDecorDetail(null);
  }, []);

  const startPlaceDecoration = (id: DecorationId) => {
    if (!canPlaceNewDecoration(id)) {
      Alert.alert("안내", `장식품은 최대 ${MAX_DECORATIONS}개까지 배치할 수 있어요.`);
      return;
    }
    setDraftLayout((prev) => {
      const others = prev.decorations.filter((d) => d.id !== id);
      return {
        ...prev,
        decorations: [...others, { id, x: 0.5, y: 0.72 }],
      };
    });
    setPlacementTarget(id);
    setDecorDetail(null);
    closeSheetAnimated();
  };

  const handleSave = async () => {
    if (isLoading) return;
    if (layoutHasOverlap(draftLayout)) {
      Alert.alert("배치 불가", "오브젝트가 겹치지 않게 배치해주세요.");
      return;
    }
    const animalData = ANIMALS.find((a) => a.id === draftAnimalId);
    if (!animalData) {
      Alert.alert("알림", "동물을 선택해주세요.");
      return;
    }

    setIsLoading(true);
    const clockImg = getClockImageFromType("alarm");
    setCustomization(animalData.src, draftBg, clockImg, draftAnimalId);
    setHomeLayout(draftLayout);

    try {
      const headers = await AuthManager.getAuthHeader();
      if (!headers.Authorization) {
        setIsLoading(false);
        router.back();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/customization`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          animalType: draftAnimalId,
          backgroundType: getBackgroundTypeFromImage(draftBg),
          clockType: "alarm",
          homeLayout: draftLayout,
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
    } catch (e) {
      setIsLoading(false);
      console.error(e);
      Alert.alert("오류", "커스터마이징 저장 중 문제가 발생했습니다.");
    }
  };

  const openSheet = (tab: "animal" | "bg" | "house" | "decor") => {
    setDecorDetail(null);
    if (sheet === tab) {
      closeSheetAnimated();
      return;
    }
    setSheet(tab);
  };

  return (
    <SafeAreaView style={styles.container}>
      <HomeButton />
      <View style={styles.previewOuter}>
        <View style={styles.previewBg}>
          <Image source={draftBg} style={styles.previewLayerImage} resizeMode="stretch" />
          {houseOverlay ? (
            <Image source={houseOverlay} style={styles.previewLayerImage} resizeMode="stretch" />
          ) : null}
          <View style={{ paddingTop: insets.top + 8, flex: 1 }} pointerEvents="box-none">
            <View style={styles.previewMain}>
              <View style={[styles.floorPlaceSlot, { height: `${FLOOR_PLACE_RATIO * 100}%` }]}>
                <HomePlayScene
                  layout={draftLayout}
                  animalSource={animalSrc}
                  petSize={petSize}
                  placementTarget={placementTarget}
                  placementValid={placementValid}
                  onAnimalDragTo={placementTarget === "animal" ? onAnimalDragTo : undefined}
                  onDecorationDragTo={
                    placementTarget && placementTarget !== "animal"
                      ? onDecorationDragTo
                      : undefined
                  }
                  onRequestPlaceAnimal={() => setPlacementTarget("animal")}
                  onRequestPlaceDecoration={(id) => setPlacementTarget(id)}
                />
              </View>
            </View>
          </View>
        </View>
      </View>

      {placementTarget != null && (
        <View style={[styles.placementBar, { bottom: 120 + insets.bottom }]}>
          {placementTarget !== "animal" && (
            <TouchableOpacity
              style={styles.placementRemove}
              onPress={() => removeDecoration(placementTarget as DecorationId)}
              activeOpacity={0.85}
            >
              <Text style={styles.placementRemoveText}>제거</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.placementDone,
              placementTarget !== "animal" && styles.placementDoneInRow,
              !placementValid && styles.placementDoneDisabled,
            ]}
            onPress={() => {
              if (!placementValid) return;
              setPlacementTarget(null);
            }}
            disabled={!placementValid}
            activeOpacity={placementValid ? 0.85 : 1}
          >
            <Text style={styles.placementDoneText}>배치 완료</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.bottomTabs, { paddingBottom: 8 + insets.bottom }]}>
        {(["동물", "배경", "집", "장식품"] as const).map((label, i) => {
          const key = (["animal", "bg", "house", "decor"] as const)[i];
          return (
            <TouchableOpacity
              key={key}
              style={[styles.bottomTab, sheet === key && styles.bottomTabActive]}
              onPress={() => openSheet(key)}
              activeOpacity={0.85}
            >
              <Text
                style={[styles.bottomTabText, sheet === key && styles.bottomTabTextActive]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.saveRow}>
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={[styles.saveButtonText, { marginLeft: 8 }]}>저장 중...</Text>
            </View>
          ) : (
            <Text style={styles.saveButtonText}>저장</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={sheet !== null} transparent animationType="fade" onRequestClose={closeSheetAnimated}>
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheetAnimated} />
          <Animated.View
            style={[
              styles.sheet,
              { maxHeight: sheetHeight, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.sheetInner}>
            <View style={styles.sheetHandle} />
            {sheet === "animal" && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScroll}>
                <Text style={styles.sheetTitle}>동물 선택</Text>
                <View style={styles.grid}>
                  {ANIMALS.map((a) => (
                    <TouchableOpacity
                      key={a.id}
                      style={[styles.optionItem, draftAnimalId === a.id && styles.optionSelected]}
                      onPress={() => selectAnimal(a.id)}
                      activeOpacity={0.8}
                    >
                      <Image source={a.src} style={styles.optImg} resizeMode="contain" />
                      <Text style={styles.optLabel}>{a.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
            {sheet === "bg" && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScroll}>
                <Text style={styles.sheetTitle}>배경 선택</Text>
                <View style={styles.grid}>
                  {BACKGROUNDS.map((bg) => (
                    <TouchableOpacity
                      key={bg.name}
                      style={[styles.optionItem, currentBgType === bg.type && styles.optionSelected]}
                      onPress={() => {
                        setDraftBg(bg.src);
                        closeSheetAnimated();
                      }}
                      activeOpacity={0.8}
                    >
                      <Image source={bg.src} style={styles.bgThumb} resizeMode="cover" />
                      <Text style={styles.optLabel}>{bg.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
            {sheet === "house" && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScroll}>
                <Text style={styles.sheetTitle}>집 선택</Text>
                <Text style={styles.sheetHint}>창문 뒤 배경은 집 PNG의 창 영역을 투명(알파)으로 두면 보입니다.</Text>
                <View style={styles.grid}>
                  {HOUSE_OPTIONS.map((h) => (
                    <TouchableOpacity
                      key={h.id}
                      style={[styles.optionItem, draftHouseType === h.id && styles.optionSelected]}
                      onPress={() => {
                        setDraftLayout((prev) => ({ ...prev, houseType: h.id }));
                        closeSheetAnimated();
                      }}
                      activeOpacity={0.8}
                    >
                      {h.thumb ? (
                        <Image source={h.thumb} style={styles.bgThumb} resizeMode="cover" />
                      ) : (
                        <View style={styles.houseNoneThumb}>
                          <Text style={styles.houseNoneThumbText}>—</Text>
                        </View>
                      )}
                      <Text style={styles.optLabel}>{h.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
            {sheet === "decor" && !decorDetail && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScroll}>
                <Text style={styles.sheetTitle}>장식품</Text>
                <View style={styles.grid}>
                  {DECORATION_IDS.map((id) => {
                    const canTap = canPlaceNewDecoration(id) || draftLayout.decorations.some((d) => d.id === id);
                    return (
                    <TouchableOpacity
                      key={id}
                      style={[styles.optionItem, !canTap && styles.optionDisabled]}
                      onPress={() => {
                        if (!canTap) {
                          Alert.alert("안내", `장식품은 최대 ${MAX_DECORATIONS}개까지 배치할 수 있어요.`);
                          return;
                        }
                        setDecorDetail(id);
                      }}
                      activeOpacity={0.8}
                    >
                      <Image source={DECORATION_ASSETS[id]} style={styles.optImg} resizeMode="contain" />
                      <Text style={styles.optLabel}>{DECORATION_LABELS[id]}</Text>
                    </TouchableOpacity>
                  );
                  })}
                </View>
              </ScrollView>
            )}
            {sheet === "decor" && decorDetail && (
              <View style={styles.detailBox}>
                <View style={styles.detailImageWrap}>
                  <Image source={DECORATION_ASSETS[decorDetail]} style={styles.detailImage} resizeMode="contain" />
                </View>
                <Text style={styles.detailName}>{DECORATION_LABELS[decorDetail]}</Text>
                <Text style={styles.detailDesc}>{DECORATION_EFFECT_TEXT[decorDetail]}</Text>
                <TouchableOpacity
                  style={[styles.placeBtn, !canPlaceNewDecoration(decorDetail) && styles.placeBtnDisabled]}
                  onPress={() => startPlaceDecoration(decorDetail)}
                  disabled={!canPlaceNewDecoration(decorDetail)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.placeBtnText}>배치</Text>
                </TouchableOpacity>
                {draftLayout.decorations.some((d) => d.id === decorDetail) && (
                  <TouchableOpacity
                    style={styles.removeDecorBtn}
                    onPress={() => {
                      removeDecoration(decorDetail);
                      closeSheetAnimated();
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.removeDecorBtnText}>장식품 제거</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.backLink} onPress={() => setDecorDetail(null)}>
                  <Text style={styles.backLinkText}>← 목록</Text>
                </TouchableOpacity>
              </View>
            )}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME_CREAM },
  previewOuter: { flex: 1 },
  previewBg: { flex: 1, width: "100%", backgroundColor: THEME_CREAM, position: "relative", overflow: "hidden" },
  previewLayerImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    ...(Platform.OS === "web" && ({ objectPosition: "center center" } as object)),
  },
  previewMain: { flex: 1, marginHorizontal: 0, position: "relative" },
  floorPlaceSlot: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
  },
  houseNoneThumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: "#E8E4DC",
    alignItems: "center",
    justifyContent: "center",
  },
  houseNoneThumbText: { fontSize: 28, color: "#999", fontFamily: "KotraHope" },
  sheetHint: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
    fontFamily: "KotraHope",
    lineHeight: 18,
  },
  placementBar: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    zIndex: 10,
    elevation: 6,
  },
  placementRemove: {
    backgroundColor: "#94A3B8",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
  },
  placementRemoveText: { color: "#fff", fontWeight: "bold", fontSize: 17, fontFamily: "KotraHope" },
  placementDone: {
    backgroundColor: THEME_YELLOW,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  placementDoneInRow: { flex: 1, maxWidth: 220, alignItems: "center" },
  placementDoneText: { color: "#fff", fontWeight: "bold", fontSize: 17, fontFamily: "KotraHope" },
  placementDoneDisabled: { opacity: 0.4, backgroundColor: "#9CA3AF" },
  bottomTabs: {
    flexDirection: "row",
    backgroundColor: THEME_CREAM,
    marginHorizontal: 12,
    borderRadius: 12,
    padding: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: "#EDE7D6",
  },
  bottomTab: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10 },
  bottomTabActive: { backgroundColor: THEME_YELLOW },
  bottomTabText: { fontSize: 16, color: THEME_TEXT_DARK, fontFamily: "KotraHope" },
  bottomTabTextActive: { color: "#fff", fontWeight: "bold" },
  saveRow: { paddingHorizontal: 16, paddingBottom: 12, backgroundColor: THEME_CREAM },
  saveButton: {
    backgroundColor: THEME_YELLOW,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
  },
  saveButtonDisabled: { opacity: 0.65 },
  saveButtonText: { color: "#fff", fontSize: 21, fontWeight: "bold", fontFamily: "KotraHope" },
  loadingRow: { flexDirection: "row", alignItems: "center" },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheetInner: { width: "100%" },
  sheet: {
    backgroundColor: THEME_CREAM,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderTopWidth: 2,
    borderColor: "#EDE7D6",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D6CBB8",
    marginVertical: 10,
  },
  sheetScroll: { paddingBottom: 16 },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: THEME_TEXT_DARK,
    marginBottom: 14,
    fontFamily: "KotraHope",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  optionItem: {
    width: "30%",
    minWidth: 100,
    aspectRatio: 0.95,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#E8E0C8",
    padding: 8,
  },
  optionSelected: { borderColor: THEME_YELLOW, borderWidth: 3, backgroundColor: "#FFFDE7" },
  optionDisabled: { opacity: 0.45 },
  optImg: { width: 64, height: 64 },
  bgThumb: { width: 72, height: 72, borderRadius: 8 },
  optLabel: { fontSize: 14, marginTop: 6, textAlign: "center", fontFamily: "KotraHope", color: THEME_TEXT_DARK },
  detailBox: { paddingVertical: 8, alignItems: "center" },
  detailImageWrap: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: THEME_YELLOW,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  detailImage: { width: 100, height: 100 },
  detailName: { fontSize: 20, fontWeight: "bold", color: THEME_TEXT_DARK, fontFamily: "KotraHope", marginBottom: 8 },
  detailDesc: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
    fontFamily: "KotraHope",
    paddingHorizontal: 8,
  },
  placeBtn: {
    backgroundColor: THEME_YELLOW,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  placeBtnDisabled: { backgroundColor: "#C4C4C4", opacity: 0.8 },
  removeDecorBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#94A3B8",
    marginBottom: 8,
  },
  removeDecorBtnText: { color: "#64748B", fontWeight: "600", fontSize: 16, fontFamily: "KotraHope" },
  placeBtnText: { color: "#fff", fontWeight: "bold", fontSize: 18, fontFamily: "KotraHope" },
  backLink: { padding: 8 },
  backLinkText: { color: "#666", fontSize: 16, fontFamily: "KotraHope" },
});
