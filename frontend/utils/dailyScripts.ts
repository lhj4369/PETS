import type { AnimalId } from "../context/CustomizationContext";

const DOG_SCRIPTS: string[] = [
  "안녕! 오늘 하루는 어땠어? 나는 네 얘기를 듣는 게 제일 좋아.",
  "네가 없는 동안 집 잘 지키고 있었지! 헤헤, 머리 쓰다듬어줘.",
  "오늘 웃을 일이 있었어? 없다면 내가 재미있는 얘기를 해줄게!",
  "밖이 추우면 따뜻한 차 마시는 건 어때? 몸도 마음도 녹을 거야.",
  "헉, 배가 고프다고? 으으... 아끼는 사료인데... 그래도 너 줄게. 여기! 어서 먹어봐!",
  "잠깐 스트레칭해 보는 건 어때? 어깨도 펴지고 기분도 상쾌해질 거야.",
  "난 네 냄새가 세상에서 제일 좋더라. 나 두고 어디 가면 안 된다?!",
];

const CAPYBARA_SCRIPTS: string[] = [
  "후우~ 천천히 가도 괜찮아. 오늘 너도 충분히 잘하고 있어.",
  "네가 없는 동안 나도 운동을 좀 하고 있었어. 무슨 운동이냐고? 당연히 숨쉬기 운동이지.",
  "따뜻~한 물에 몸 담그는 상상만 해도 마음이 노곤노곤해지지 않아?",
  "지금 당장 완벽하지 않아도 돼. 한 걸음이면 이미 전진이야.",
  "어깨 힘 살짝 빼고 숨 크게 쉬어봐. 나처럼 말야.",
  "바쁜 하루였네. 이제 나랑 같이 목욕하러 가자.",
];

const FOX_SCRIPTS: string[] = [
  "야호! 사막여우 나왔다~ 오늘 뭐 했어?",
  "배 고프다고? 밥 먹으면 되잖아! 잘 됐다! 내 것도 가져다 줄거지?",
  "나 사막에서 왔거든. 더운 날엔 그늘 찾는 게 생존이야!",
  "귀 크지? 덕분에 멀리서 오는 소리까지 다 들려. 네 목소리도 잘 들려~",
  "운동? 그런 거 안 해도 난 귀엽다구! 근데 넌 운동 좀 해야 해.",
  "열심히 운동 해서 나에게 걸맞는 멋진 주인이 되도록 해!",
  "밤에 활동하는 타입이라 낮엔 좀 나른해... 너도 피곤하다구? 안돼! 어서 나가서 운동해!",
  "사실, 사막보다 네 품이 좋아... 응? 아무 말도 안 했는데?",
];

const GUINEA_PIG_SCRIPTS: string[] = [
  "삐익! 왠지 네 기분이 궁금해. 오늘 있었던 일 들려줄래?",
  "작은 간식 하나, 짧은 휴식 한 번! 그런 게 하루를 반짝이게 해.",
  "돼지 아니고 기니피그라니까! 나 완전 건강하거든?",
  "걱정이 커 보이면 내가 옆에서 볼에 바람 넣고 응원해줄게!",
  "자고로 운동은 근력 운동이 제일이지! 어렵다구? 내가 시범 보여줄게!",
  "조금만 움직여도 몸이 깨어나. 우리 1분 스트레칭부터 시작하자!",
  "오늘의 목표는 '무리하지 않기'! 꾸준함은 작고 귀여운 한 걸음부터야.",
];

const RED_PANDA_SCRIPTS: string[] = [
  "보고싶었어! 너 없는 동안 내가 나무 가꿔 뒀어. 한 번 볼래?",
  "나무 타듯 차근차근 올라가면 돼. 급하게 안 가도 정상은 보여.",
  "오늘 표정이 조금 지쳐 보여. 따뜻한 차 한 잔 하고 다시 시작하자.",
  "점점 운동에 흥미가 붙어가는 모양이네? 곧있으면 나랑 나무 타기 경주 할 수 있겠는걸?",
  "실수해도 괜찮아. 발 한번 미끄러져도 다시 중심 잡으면 되니까!",
  "끝까지 버틴 너, 꽤 멋진데? 널 멋진 레서판다로 인정해줄게.",
];

const DAILY_SCRIPTS_BY_ANIMAL: Record<string, string[]> = {
  dog: DOG_SCRIPTS,
  capybara: CAPYBARA_SCRIPTS,
  fox: FOX_SCRIPTS,
  guinea_pig: GUINEA_PIG_SCRIPTS,
  red_panda: RED_PANDA_SCRIPTS,
};

const PLACEHOLDER_PHRASE_BY_ANIMAL: Record<string, string> = {
  dog: "헤헤, 나를 눌러줘!",
  capybara: "나를 눌러봐~ 너무 빠르게는 말고.",
  fox: "나를 터치해!",
  guinea_pig: "삐익! 나를 눌러봐!",
  red_panda: "나랑 얘기할래? 여기를 터치해봐!",
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
