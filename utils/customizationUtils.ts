import { ImageSourcePropType } from "react-native";

// 배경 타입 매핑
export const BACKGROUND_IMAGES: Record<string, ImageSourcePropType> = {
  home: require("../assets/images/background/home.png"),
  spring: require("../assets/images/background/spring.png"),
  summer: require("../assets/images/background/summer.png"),
  fall: require("../assets/images/background/fall.png"),
  winter: require("../assets/images/background/winter.png"),
  city: require("../assets/images/background/city.png"),
};

// 시계 타입 매핑
export const CLOCK_IMAGES: Record<string, ImageSourcePropType> = {
  cute: require("../assets/images/clocks/cute.png"),
  alarm: require("../assets/images/clocks/alarm.png"),
  sand: require("../assets/images/clocks/sand.png"),
  mini: require("../assets/images/clocks/mini.png"),
};

// 이미지 소스에서 타입 추출
export const getBackgroundTypeFromImage = (image: ImageSourcePropType | null): string => {
  if (!image) return 'home';
  
  for (const [type, img] of Object.entries(BACKGROUND_IMAGES)) {
    if (img === image) return type;
  }
  return 'home';
};

export const getClockTypeFromImage = (image: ImageSourcePropType | null): string => {
  if (!image) return 'alarm';
  
  for (const [type, img] of Object.entries(CLOCK_IMAGES)) {
    if (img === image) return type;
  }
  return 'alarm';
};

// 타입에서 이미지 소스로 변환
export const getBackgroundImageFromType = (type: string | null | undefined): ImageSourcePropType => {
  if (!type || !BACKGROUND_IMAGES[type]) {
    return BACKGROUND_IMAGES.home;
  }
  return BACKGROUND_IMAGES[type];
};

export const getClockImageFromType = (type: string | null | undefined): ImageSourcePropType => {
  if (!type || !CLOCK_IMAGES[type]) {
    return CLOCK_IMAGES.alarm;
  }
  return CLOCK_IMAGES[type];
};

