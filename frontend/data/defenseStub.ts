/** 디펜스 뼈대용 더미 데이터 (추후 서버·JSON으로 교체) */

/** 시나리오 우선 오픈 — 도전 라우트·코드는 유지, 진입만 차단 */
export const DEFENSE_CHALLENGE_MODE_LOCKED = true;

export type StubScenarioStage = {
  id: string;
  area: string;
  /** 난이도 라벨 (쉬움/보통/어려움 등) */
  tier: string;
  locked: boolean;
};

/** 메인 챕터(n) — 서브 스테이지는 n-1, n-2 … 형식으로 `StubScenarioStage.id`에 둠 */
export type StubScenarioChapter = {
  chapterId: string;
  /** 목록 헤더에 `1. 숲의 길` 형식으로 쓰는 이름 */
  name: string;
  stages: StubScenarioStage[];
};

/**
 * 시나리오 소스 오브 트루스 — 챕터 추가 시 여기만 늘리면 됨.
 * `STUB_SCENARIO_STAGES`는 이 배열을 평탄화한 값(라우트·조회용).
 */
export const STUB_SCENARIO_CHAPTERS: StubScenarioChapter[] = [
  {
    chapterId: "1",
    name: "숲의 길",
    stages: [
      { id: "1-1", area: "초원", tier: "쉬움", locked: false },
      { id: "1-2", area: "풀숲", tier: "쉬움", locked: false },
      { id: "1-3", area: "깊은 숲속", tier: "보통", locked: false },
    ],
  },
  {
    chapterId: "2",
    name: "마을로",
    stages: [
      { id: "2-1", area: "마을 초입", tier: "보통", locked: true },
      { id: "2-2", area: "돌담 골목", tier: "보통", locked: true },
      { id: "2-3", area: "마을 광장", tier: "보통", locked: true },
    ],
  },
  {
    chapterId: "3",
    name: "도시로",
    stages: [
      { id: "3-1", area: "비탈길", tier: "보통", locked: true },
      { id: "3-2", area: "소도시 입구", tier: "보통", locked: true },
      { id: "3-3", area: "소도시 외곽", tier: "보통", locked: true },
    ],
  },
  {
    chapterId: "4",
    name: "대도시로!",
    stages: [
      { id: "4-1", area: "소도시 광장", tier: "보통", locked: true },
      { id: "4-2", area: "대도시 입구", tier: "보통", locked: true },
      { id: "4-3", area: "대도시 외곽", tier: "보통", locked: true },
    ],
  },
];

export const STUB_SCENARIO_STAGES: StubScenarioStage[] = STUB_SCENARIO_CHAPTERS.flatMap(
  (c) => c.stages
);

const DIALOGUE_BY_STAGE: Record<string, string[]> = {
  "1-1": [
    "여긴 어디지? 처음 보는 숲이다. 큰일났다! 집에 가야 하는데. 주인이 기다릴텐데....",
    "-바스락",
    "뭔가 움직이는 기척이 느껴진다! 틀림없다. 집을 어지럽히던 벌레! 훌륭한 펫이라면, 벌레를 그냥 지나칠 수는 없지! "
  ],
  "1-2": [
    "잡아도 잡아도 끝이 없다! 이렇게 된 이상, 벌레들의 대장을 찾는 수밖에!",
    "그런데, 해가 저물어간다. 주인... 나 없어도 얌전히 집 지킬 수 있지?",
  ],
  "1-3": [
    "숲이 점점 어두워진다. 나뭇가지 사이로 들려오는 소리가 가까워진다.",
    "저 녀석이 대장이군! 내 진가를 보여주지!"
  ],
  "2-1": [
    "집에 돌아가야 하는데... 난, 여기가 어디인지 모른다!",
    "일단 저 사람들에게 길을 물어보자",
    "나, 집에 갈 수 있겠지...?",
  ],
  //이하 임시 스크립트. 추가 작성 필요.

  "2-2": [
    "낡은 돌담 사이로 좁은 골목이 이어진다. 지붕 너머로 발소리가 섞인다.",
  ],
  "2-3": [
    "넓어진 마을 광장, 우물가에 사람들의 웅성거림이 잦아든다. 무언가가 온다.",
  ],
  "3-1": [
    "숲을 지나 오르막 비탈길이 이어진다. 멀리서 도시의 빛이 희미하게 보인다.",
  ],
  "3-2": [
    "소도시 입구의 표지판. 차분한 거리 소리와 함께, 익숙하지 않은 기척이 섞인다.",
  ],
  "3-3": [
    "외곽 주택가 뒤편. 좁은 골목 너머로 그림자가 길게 드리운다.",
  ],
  "4-1": [
    "소도시 한가운데 광장. 분수대 물소리와 함께, 군중 속에서 시선이 느껴진다.",
  ],
  "4-2": [
    "대도시 입구의 아치. 차량 소리와 네온 빛이 뒤섞인다. 숨 막히는 긴장이 올라온다.",
  ],
  "4-3": [
    "외곽 고가 아래. 그림자가 길게 이어지고, 바람이 건물 틈을 통과한다.",
  ],
};

export function getStubDialogueForStage(stageId: string): string[] {
  return (
    DIALOGUE_BY_STAGE[stageId] ?? [
      `스테이지 ${stageId} 대화 스크립트는 추후 데이터로 연결합니다.`,
    ]
  );
}
