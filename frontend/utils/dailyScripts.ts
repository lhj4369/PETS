import type { AnimalId } from "../context/CustomizationContext";

/** 동물별 일상 대화 스크립트 (추후 동물 캐릭터에 맞게 확장) */
const DAILY_SCRIPTS_BY_ANIMAL: Record<string, string[]> = {
  dog: [
    "안녕! 오늘 하루는 어땠어? 나는 네 얘기를 듣는 게 제일 좋아.",
    "혹시 오늘 웃을 일이 있었어? 없다면 내가 재미있는 얘기를 해줄게!",
    "밖이 추우면 따뜻한 차 마시는 건 어때? 몸도 마음도 녹을 거야.",
    "잠깐 스트레칭해 보는 건 어때? 어깨도 펴지고 기분도 상쾌해질 거야.",
    "오늘은 조금 여유를 가지고 스스로를 칭찬해 줘 보자!",
  ],
  capybara: [
    "안녕! 오늘 하루는 어땠어? 나는 네 얘기를 듣는 게 제일 좋아.",
    "혹시 오늘 웃을 일이 있었어? 없다면 내가 재미있는 얘기를 해줄게!",
    "밖이 추우면 따뜻한 차 마시는 건 어때? 몸도 마음도 녹을 거야.",
    "잠깐 스트레칭해 보는 건 어때? 어깨도 펴지고 기분도 상쾌해질 거야.",
    "오늘은 조금 여유를 가지고 스스로를 칭찬해 줘 보자!",
  ],
};

/** 대사 없을 때 상시 표시 문구 (동물별 캐릭터 확장용) */
const PLACEHOLDER_PHRASE_BY_ANIMAL: Record<string, string> = {
  dog: "나를 눌러봐!",
  capybara: "나를 눌러봐!",
};

const DEFAULT_SCRIPTS = DAILY_SCRIPTS_BY_ANIMAL.dog;
const DEFAULT_PLACEHOLDER = "…";

export function getDailyScripts(animalId: AnimalId | null): string[] {
  if (!animalId) return DEFAULT_SCRIPTS;
  return DAILY_SCRIPTS_BY_ANIMAL[animalId] ?? DEFAULT_SCRIPTS;
}

export function getPlaceholderPhrase(animalId: AnimalId | null): string {
  if (!animalId) return DEFAULT_PLACEHOLDER;
  return PLACEHOLDER_PHRASE_BY_ANIMAL[animalId] ?? DEFAULT_PLACEHOLDER;
}
