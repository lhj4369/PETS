import { ImageSourcePropType } from "react-native";

export type PlacedTowerData = {
  id: string;
  unitId: string;
  image: ImageSourcePropType;
  /** 그리드 열 0 ~ GRID_COLS-1 */
  col: number;
  /** 그리드 행 0 ~ GRID_ROWS-1 */
  row: number;
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
