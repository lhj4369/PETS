import type { AnimalId } from "../../context/CustomizationContext";

const HELD_TOO_LONG_DURING_BY_ANIMAL: Record<string, string[]> = {
  dog: [
    "어지러워! 제발 내려줘...",
    "나 무섭다고!",
    "너무 높아~ 내려줘!",
    "흔들흔들... 어지러...",
    "저기... 지금 꽤 높은데?",
    "심장이 쿵쿵거려...",
  ],
  capybara: [
    "천천히... 너무 높으면 조금 긴장돼.",
    "후우... 너무 높은데...",
    "공중은 좀 어려워...",
    "바닥이 가까우면 좋겠어...",
  ],
  fox: [
    "높다! 좋아, 스릴 넘치는데!",
    "야호... 는 무슨, 어지러! 이제 좀 내려줘!",
    "사막여우는 육지 동물이라구!",
    "귀가 핑핑 돌아! 천천히 내려가자~",
    "높은 건 좋지만 너무 오래면 어지럽다구!",
  ],
  guinea_pig: [
    "저기, 나를 운동기구로 착각한 거 아니지?",
    "삐이익... 내려줘!",
    "조금 무서워! 바닥이 보고 싶어!",
    "삐... 눈앞이 빙글빙글 돌아!",
    "나 작아서 더 아찔해! 살려~",
  ],
  red_panda: [
    "잠깐, 너무 오래 들면 중심 잡기 힘들어.",
    "조금 어지럽네. 내려가서 다시 쉬자.",
    "높이 있는 건 괜찮지만 지금은 한계야.",
    "나무 타고 싶어...",
    "천천히 내려줘. 다시 페이스 찾을게.",
  ],
};

const HELD_TOO_LONG_AFTER_BY_ANIMAL: Record<string, string[]> = {
  dog: [
    "그렇게 오래 들고 있으면 어지럽다구!",
    "다음엔 좀 살살 다뤄줘...",
    "땅이 그리웠어. 진짜로.",
    "공중은 나한테 안 맞아.",
  ],
  capybara: [
    "후우... 역시 난 땅에 있을 때 제일 편해.",
    "천천히 내려줘서 고마워. 이제 안정됐어.",
    "다음엔 조금만 짧게 들어 올려줘.",
    "노곤해... 잠깐 쉬면 금방 괜찮아질 거야.",
    "역시 느긋함은 지면에서 완성되지.",
  ],
  fox: [
    "착지 완료! 역시 난 달릴 때가 더 좋아.",
    "스릴은 충분했어! 다음엔 짧게 가자~",
    "귀가 아직 웅웅해... 그래도 재밌긴 했어.",
    "좋았어, 이제 땅에서 다시 텐션 올리자!",
    "사막여우 비행 체험은 여기까지!",
  ],
  guinea_pig: [
    "삐익... 살았다! 바닥 최고야!",
    "심장 콩닥콩닥했어... 이제 안심이야.",
    "다음엔 조금만 낮게 부탁해!",
    "삐... 그래도 잘 버텼다, 나!",
    "땅이 이렇게 반가울 줄이야!",
  ],
  red_panda: [
    "좋아, 다시 중심 찾았어. 이제 괜찮아.",
    "착지 완료. 역시 페이스 조절이 중요해.",
    "조금 놀랐지만 잘 내려왔네.",
    "다음엔 더 안정적으로 가보자.",
    "한숨 돌렸어. 이제 다시 차분하게.",
  ],
};

const DEFAULT_DURING = HELD_TOO_LONG_DURING_BY_ANIMAL.dog;
const DEFAULT_AFTER = HELD_TOO_LONG_AFTER_BY_ANIMAL.dog;

export function getHeldTooLongDuringScripts(animalId: AnimalId | null): string[] {
  if (!animalId) return DEFAULT_DURING;
  return HELD_TOO_LONG_DURING_BY_ANIMAL[animalId] ?? DEFAULT_DURING;
}

export function getHeldTooLongAfterScripts(animalId: AnimalId | null): string[] {
  if (!animalId) return DEFAULT_AFTER;
  return HELD_TOO_LONG_AFTER_BY_ANIMAL[animalId] ?? DEFAULT_AFTER;
}
