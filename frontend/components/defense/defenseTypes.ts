import { ImageSourcePropType } from "react-native";

export type PlacedTowerData = {
  id: string;
  unitId: string;
  image: ImageSourcePropType;
  /** 유닛 존 안에서의 중심 x 좌표 (px) */
  x: number;
  /** 유닛 존 안에서의 중심 y 좌표 (px) */
  y: number;
};

export type DragUnit = {
  unitId: string;
  image: ImageSourcePropType;
};

export type DragState = {
  unit: DragUnit;
  /** 화면 절대 좌표 */
  absX: number;
  absY: number;
};
