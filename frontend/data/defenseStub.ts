/** 디펜스 뼈대용 더미 데이터 (추후 서버·JSON으로 교체) */

export type StubScenarioStage = {
  id: string;
  area: string;
  /** 난이도 라벨 (쉬움/보통/어려움 등) */
  tier: string;
  locked: boolean;
  /** 이 스테이지에서 진행되는 웨이브 수(이후 웨이브 없음) */
  totalWaves: number;
};

export const STUB_SCENARIO_STAGES: StubScenarioStage[] = [
  { id: "1-1", area: "베란다", tier: "쉬움", locked: false, totalWaves: 3 },
  { id: "1-2", area: "거실", tier: "쉬움", locked: false, totalWaves: 3 },
  { id: "2-1", area: "주방", tier: "보통", locked: true, totalWaves: 3 },
];

const DIALOGUE_BY_STAGE: Record<string, string[]> = {
  "1-1": [
    "주인이 운동하러 나갔다. 집 안이 조용해진 순간, 바닥 너머로 작은 소리가 들려온다.",
    "베란다 틈새로 먼지들이 몰려오기 시작한다. 오늘도 막아야 한다.",
  ],
  "1-2": [
    "거실 소파 아래는 늘 전쟁터다. 이번엔 뭉치가 좀 더 단단해 보인다.",
  ],
  "2-1": ["주방의 음식 냄새를 맡고 날아든 녀석들이 있다. 준비는 됐나?"],
};

export function getStubDialogueForStage(stageId: string): string[] {
  return (
    DIALOGUE_BY_STAGE[stageId] ?? [
      `스테이지 ${stageId} 대화 스크립트는 추후 데이터로 연결합니다.`,
    ]
  );
}
