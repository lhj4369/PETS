import type { AnimalId } from "../context/CustomizationContext";

/** 강아지 캐릭터 일상 대화 스크립트 */
const DOG_SCRIPTS: string[] = [
  "안녕! 오늘 하루는 어땠어? 나는 네 얘기를 듣는 게 제일 좋아.",
  "혹시 오늘 웃을 일이 있었어? 없다면 내가 재미있는 얘기를 해줄게!",
  "밖이 추우면 따뜻한 차 마시는 건 어때? 몸도 마음도 녹을 거야.",
  "잠깐 스트레칭해 보는 건 어때? 어깨도 펴지고 기분도 상쾌해질 거야.",
  "오늘은 조금 여유를 가지고 스스로를 칭찬해 줘 보자!",
];

/** 카피바라 캐릭터 일상 대화 스크립트 */
const CAPYBARA_SCRIPTS: string[] = [
  "안녕! 오늘 하루는 어땠어? 나는 네 얘기를 듣는 게 제일 좋아.",
  "혹시 오늘 웃을 일이 있었어? 없다면 내가 재미있는 얘기를 해줄게!",
  "밖이 추우면 따뜻한 차 마시는 건 어때? 몸도 마음도 녹을 거야.",
  "잠깐 스트레칭해 보는 건 어때? 어깨도 펴지고 기분도 상쾌해질 거야.",
  "오늘은 조금 여유를 가지고 스스로를 칭찬해 줘 보자!",
];

/** 사막여우 캐릭터 일상 대화 스크립트 */
const FOX_SCRIPTS: string[] = [
  "야호! 사막여우 나왔다~ 오늘 뭐 했어?",
  "나 사막에서 왔거든. 더운 날엔 그늘 찾는 게 생존이야!",
  "귀 크지? 덕분에 멀리서 오는 소리까지 다 들려. 네 목소리도 잘 들려~",
  "밤에 활동하는 타입이라 낮엔 좀 나른해. 너도 낮잠 한 번 자봐!",
  "꼬리로 바람 막고 사막에서 살아남았어. 넌 오늘 어떤 일 견뎌냈어?",
];

/** 기니피그 캐릭터 일상 대화 스크립트 */
const GUINEA_PIG_SCRIPTS: string[] = [
  "안녕! 오늘 하루는 어땠어? 나는 네 얘기를 듣는 게 제일 좋아.",
  "혹시 오늘 웃을 일이 있었어? 없다면 내가 재미있는 얘기를 해줄게!",
  "밖이 추우면 따뜻한 차 마시는 건 어때? 몸도 마음도 녹을 거야.",
  "잠깐 스트레칭해 보는 건 어때? 어깨도 펴지고 기분도 상쾌해질 거야.",
  "오늘은 조금 여유를 가지고 스스로를 칭찬해 줘 보자!",
];

/** 레서판다 캐릭터 일상 대화 스크립트 */
const RED_PANDA_SCRIPTS: string[] = [
  "안녕! 오늘 하루는 어땠어? 나는 네 얘기를 듣는 게 제일 좋아.",
  "혹시 오늘 웃을 일이 있었어? 없다면 내가 재미있는 얘기를 해줄게!",
  "밖이 추우면 따뜻한 차 마시는 건 어때? 몸도 마음도 녹을 거야.",
  "잠깐 스트레칭해 보는 건 어때? 어깨도 펴지고 기분도 상쾌해질 거야.",
  "오늘은 조금 여유를 가지고 스스로를 칭찬해 줘 보자!",
];

/** 동물별 일상 대화 스크립트 매핑 */
const DAILY_SCRIPTS_BY_ANIMAL: Record<string, string[]> = {
  dog: DOG_SCRIPTS,
  capybara: CAPYBARA_SCRIPTS,
  fox: FOX_SCRIPTS,
  guinea_pig: GUINEA_PIG_SCRIPTS,
  red_panda: RED_PANDA_SCRIPTS,
};

/** 강아지 대사 없을 때 상시 표시 문구 */
const DOG_PLACEHOLDER = "나를 눌러봐!";

/** 카피바라 대사 없을 때 상시 표시 문구 */
const CAPYBARA_PLACEHOLDER = "나를 눌러봐!";

/** 사막여우 대사 없을 때 상시 표시 문구 */
const FOX_PLACEHOLDER = "나를 터치해봐~";

/** 기니피그 대사 없을 때 상시 표시 문구 */
const GUINEA_PIG_PLACEHOLDER = "나를 눌러봐!";

/** 레서판다 대사 없을 때 상시 표시 문구 */
const RED_PANDA_PLACEHOLDER = "나를 눌러봐!";

/** 동물별 플레이스홀더 문구 매핑 */
const PLACEHOLDER_PHRASE_BY_ANIMAL: Record<string, string> = {
  dog: DOG_PLACEHOLDER,
  capybara: CAPYBARA_PLACEHOLDER,
  fox: FOX_PLACEHOLDER,
  guinea_pig: GUINEA_PIG_PLACEHOLDER,
  red_panda: RED_PANDA_PLACEHOLDER,
};

const DEFAULT_SCRIPTS = DOG_SCRIPTS;
const DEFAULT_PLACEHOLDER = "…";

export function getDailyScripts(animalId: AnimalId | null): string[] {
  if (!animalId) return DEFAULT_SCRIPTS;
  return DAILY_SCRIPTS_BY_ANIMAL[animalId] ?? DEFAULT_SCRIPTS;
}

export function getPlaceholderPhrase(animalId: AnimalId | null): string {
  if (!animalId) return DEFAULT_PLACEHOLDER;
  return PLACEHOLDER_PHRASE_BY_ANIMAL[animalId] ?? DEFAULT_PLACEHOLDER;
}
