import type { ImageSourcePropType } from "react-native";

import type { DragUnit, PlacedTowerData } from "./defenseTypes";
import { DEFENSE_TOWER_SELL_REFUND } from "./defenseCombatConstants";

/** 알 수 없는 타워 id일 때 사용하는 기본 배치 비용 */
export const DEFENSE_DEFAULT_TOWER_PLACE_COST = 50;

/**
 * 타워 종류별 배치 비용. 당분간 전부 동일(50)이며, 이후 타워마다 다른 값으로 조정하면 됩니다.
 */
export const TOWER_PLACE_COST_BY_UNIT_ID: Record<string, number> = {
  dog: 10,
  capybara: 20,
  fox: 30,
  red_panda: 40,
  ginipig: 50,
};

export function getTowerPlaceCost(unitId: string): number {
  return TOWER_PLACE_COST_BY_UNIT_ID[unitId] ?? DEFENSE_DEFAULT_TOWER_PLACE_COST;
}

export type DefensePlacementState = {
  placedTowers: PlacedTowerData[];
  currency: number;
};

export type DefensePlacementAction =
  | { type: "place"; cell: { col: number; row: number }; unit: DragUnit }
  | { type: "remove"; towerId: string }
  | { type: "addCurrency"; amount: number };

function tryPlaceTower(input: {
  placedTowers: PlacedTowerData[];
  currency: number;
  cell: { col: number; row: number };
  unitId: string;
  image: ImageSourcePropType;
}): {
  placedTowers: PlacedTowerData[];
  currency: number;
  placed: boolean;
} {
  const { placedTowers, currency, cell, unitId, image } = input;
  if (placedTowers.some((t) => t.col === cell.col && t.row === cell.row)) {
    return { placedTowers, currency, placed: false };
  }
  const cost = getTowerPlaceCost(unitId);
  if (currency < cost) {
    return { placedTowers, currency, placed: false };
  }
  return {
    placedTowers: [
      ...placedTowers,
      {
        id: `${unitId}-${Date.now()}`,
        unitId,
        image,
        col: cell.col,
        row: cell.row,
      },
    ],
    currency: currency - cost,
    placed: true,
  };
}

export function defensePlacementReducer(
  state: DefensePlacementState,
  action: DefensePlacementAction,
): DefensePlacementState {
  switch (action.type) {
    case "place": {
      const next = tryPlaceTower({
        placedTowers: state.placedTowers,
        currency: state.currency,
        cell: action.cell,
        unitId: action.unit.unitId,
        image: action.unit.image,
      });
      if (!next.placed) return state;
      return { placedTowers: next.placedTowers, currency: next.currency };
    }
    case "remove": {
      return {
        placedTowers: state.placedTowers.filter((t) => t.id !== action.towerId),
        currency: state.currency + DEFENSE_TOWER_SELL_REFUND,
      };
    }
    case "addCurrency": {
      if (action.amount <= 0) return state;
      return { ...state, currency: state.currency + action.amount };
    }
    default:
      return state;
  }
}

export function createDefensePlacementState(initialCurrency: number): DefensePlacementState {
  return { placedTowers: [], currency: initialCurrency };
}
