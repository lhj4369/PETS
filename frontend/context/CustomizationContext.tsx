import { ImageSourcePropType } from "react-native";
import { createContext, ReactNode, useContext, useMemo, useState } from "react";

export const DEFAULT_ANIMAL_IMAGE = require("../assets/images/dog_character.png");
export const DEFAULT_BACKGROUND_IMAGE = require("../assets/images/background_test.png");

type CustomizationContextValue = {
  selectedAnimal: ImageSourcePropType | null;
  selectedBackground: ImageSourcePropType | null;
  selectedClock: string | null;
  setCustomization: (
    animal: ImageSourcePropType | null,
    background: ImageSourcePropType | null,
    clock: string | null
  ) => void;
};

const CustomizationContext = createContext<CustomizationContextValue | undefined>(undefined);

type CustomizationProviderProps = {
  children: ReactNode;
};

export const CustomizationProvider = ({ children }: CustomizationProviderProps) => {
  const [selectedAnimal, setSelectedAnimal] = useState<ImageSourcePropType | null>(
    DEFAULT_ANIMAL_IMAGE
  );
  const [selectedBackground, setSelectedBackground] = useState<ImageSourcePropType | null>(
    DEFAULT_BACKGROUND_IMAGE
  );
  const [selectedClock, setSelectedClock] = useState<string | null>(null);

  const setCustomization = (
    animal: ImageSourcePropType | null,
    background: ImageSourcePropType | null,
    clock: string | null
  ) => {
    setSelectedAnimal(animal ?? DEFAULT_ANIMAL_IMAGE);
    setSelectedBackground(background ?? DEFAULT_BACKGROUND_IMAGE);
    setSelectedClock(clock ?? null);
  };

  const value = useMemo(
    () => ({
      selectedAnimal,
      selectedBackground,
      selectedClock,
      setCustomization,
    }),
    [selectedAnimal, selectedBackground, selectedClock]
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

