import { ImageSourcePropType } from "react-native";
import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { getBackgroundImageFromType, getClockImageFromType, BACKGROUND_IMAGES } from "../utils/customizationUtils";
import { DEFAULT_HOME_LAYOUT, HomeLayout, parseHomeLayout } from "../utils/homeLayout";

export const DEFAULT_ANIMAL_IMAGE = require("../assets/images/animals/dog.png");
export const DEFAULT_BACKGROUND_IMAGE = BACKGROUND_IMAGES.spring;
export const DEFAULT_CLOCK_IMAGE = require("../assets/images/clocks/alarm.png");

/** 채팅/스크립트 확장용 동물 식별자 (예: "dog", "capybara") */
export type AnimalId = string;

type CustomizationContextValue = {
  selectedAnimal: ImageSourcePropType | null;
  selectedAnimalId: AnimalId | null;
  selectedBackground: ImageSourcePropType | null;
  selectedClock: ImageSourcePropType | null;
  homeLayout: HomeLayout;
  setHomeLayout: (layout: HomeLayout) => void;
  setCustomization: (
    animal: ImageSourcePropType | null,
    background: ImageSourcePropType | null,
    clock: ImageSourcePropType | null,
    animalId?: AnimalId | null
  ) => void;
  loadCustomizationFromServer: (
    backgroundType: string | null | undefined,
    clockType: string | null | undefined,
    homeLayoutRaw?: unknown
  ) => void;
};

const CustomizationContext = createContext<CustomizationContextValue | undefined>(undefined);

type CustomizationProviderProps = {
  children: ReactNode;
};

const DEFAULT_ANIMAL_ID: AnimalId = "dog";

export const CustomizationProvider = ({ children }: CustomizationProviderProps) => {
  const [selectedAnimal, setSelectedAnimal] = useState<ImageSourcePropType | null>(
    DEFAULT_ANIMAL_IMAGE
  );
  const [selectedAnimalId, setSelectedAnimalId] = useState<AnimalId | null>(DEFAULT_ANIMAL_ID);
  const [selectedBackground, setSelectedBackground] = useState<ImageSourcePropType | null>(
    DEFAULT_BACKGROUND_IMAGE
  );
  const [selectedClock, setSelectedClock] = useState<ImageSourcePropType | null>(
    DEFAULT_CLOCK_IMAGE
  );
  const [homeLayout, setHomeLayout] = useState<HomeLayout>(DEFAULT_HOME_LAYOUT);

  const setCustomization = (
    animal: ImageSourcePropType | null,
    background: ImageSourcePropType | null,
    clock: ImageSourcePropType | null,
    animalId?: AnimalId | null
  ) => {
    setSelectedAnimal(animal ?? DEFAULT_ANIMAL_IMAGE);
    setSelectedAnimalId(animalId ?? DEFAULT_ANIMAL_ID);
    setSelectedBackground(background ?? DEFAULT_BACKGROUND_IMAGE);
    setSelectedClock(clock ?? DEFAULT_CLOCK_IMAGE);
  };

  const loadCustomizationFromServer = (
    backgroundType: string | null | undefined,
    clockType: string | null | undefined,
    homeLayoutRaw?: unknown
  ) => {
    setSelectedBackground(getBackgroundImageFromType(backgroundType));
    setSelectedClock(getClockImageFromType(clockType));
    setHomeLayout(parseHomeLayout(homeLayoutRaw));
  };

  const value = useMemo(
    () => ({
      selectedAnimal,
      selectedAnimalId,
      selectedBackground,
      selectedClock,
      homeLayout,
      setHomeLayout,
      setCustomization,
      loadCustomizationFromServer,
    }),
    [selectedAnimal, selectedAnimalId, selectedBackground, selectedClock, homeLayout]
  );

  return <CustomizationContext.Provider value={value}>{children}</CustomizationContext.Provider>;
};

export const useCustomization = () => {
  const context = useContext(CustomizationContext);
  if (!context) {
    throw new Error("useCustomization은 CustomizationProvider 내에서만 사용할 수 있습니다.");
  }

  return context;
};

