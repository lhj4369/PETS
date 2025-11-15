import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import HomeButton from "../../components/HomeButton";
import DailyChatView from "../../components/chatting/DailyChatView";
import ExerciseChatView from "../../components/chatting/ExerciseChatView";
import { ChatMessage } from "../../types/chat";

const DAILY_SCRIPTS = [
  "안녕! 오늘 하루는 어땠어? 나는 네 얘기를 듣는 게 제일 좋아.",
  "혹시 오늘 웃을 일이 있었어? 없다면 내가 재미있는 얘기를 해줄게!",
  "밖이 추우면 따뜻한 차 마시는 건 어때? 몸도 마음도 녹을 거야.",
  "잠깐 스트레칭해 보는 건 어때? 어깨도 펴지고 기분도 상쾌해질 거야.",
  "오늘은 조금 여유를 가지고 스스로를 칭찬해 줘 보자!",
];

const EXERCISE_RESPONSES = [
  "가벼운 준비 운동부터 시작해 봐요. 어깨와 허리를 살짝 돌려주는 것만으로도 큰 도움이 돼요!",
  "오늘은 하체 날로 어떠세요? 스쿼트 15회 × 3세트 추천드릴게요.",
  "물이 부족하면 근육이 더 쉽게 피로해져요. 지금 한 잔 마실까요?",
  "목표를 작게 쪼개보세요. 10분 집중해서 운동하는 것부터 시작해도 충분히 멋져요!",
  "운동 마무리엔 가벼운 스트레칭으로 근육을 풀어 주세요. 다음 날 몸이 훨씬 가볍답니다.",
];

export default function ChattingScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string | string[] }>();
  const [viewMode, setViewMode] = useState<"daily" | "exercise">("daily");
  const [scriptIndex, setScriptIndex] = useState(-1);
  const [isScriptVisible, setIsScriptVisible] = useState(false);
  const [hasTapped, setHasTapped] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: "헬스 메이트예요! 어떤 운동을 할지 고민되면 편하게 물어보세요 :)",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");

  const currentScript = useMemo(
    () => (scriptIndex >= 0 ? DAILY_SCRIPTS[scriptIndex] : ""),
    [scriptIndex]
  );

  const normalizedMode = Array.isArray(mode) ? mode[0] : mode;
  const scriptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (normalizedMode === "daily") {
      setViewMode("daily");
    }
  }, [normalizedMode]);

  useFocusEffect(
    useCallback(() => {
      if (normalizedMode === "daily") {
        setViewMode("daily");
      }
    }, [normalizedMode])
  );

  useEffect(() => {
    return () => {
      if (scriptTimerRef.current) {
        clearTimeout(scriptTimerRef.current);
      }
    };
  }, []);

  const handleAnimalPress = () => {
    if (!hasTapped) {
      setHasTapped(true);
    }
    setScriptIndex((prev) => (prev + 1) % DAILY_SCRIPTS.length);
    setIsScriptVisible(true);
    if (scriptTimerRef.current) {
      clearTimeout(scriptTimerRef.current);
    }
    scriptTimerRef.current = setTimeout(() => {
      setIsScriptVisible(false);
    }, 4000);
  };

  const getRandomResponse = () =>
    EXERCISE_RESPONSES[Math.floor(Math.random() * EXERCISE_RESPONSES.length)];

  const sendMessage = () => {
    if (inputText.trim() === "") return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: getRandomResponse(),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000 + Math.random() * 1000);
  };

  const handleSwitchToExercise = useCallback(() => {
    setViewMode("exercise");
  }, []);

  const handleSwitchToDaily = useCallback(() => {
    setViewMode("daily");
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <HomeButton />
      {viewMode === "daily" ? (
        <DailyChatView
          currentScript={currentScript}
          isScriptVisible={isScriptVisible}
          hasTapped={hasTapped}
          onAnimalPress={handleAnimalPress}
          onSwitchToExercise={handleSwitchToExercise}
        />
      ) : (
        <ExerciseChatView
          messages={messages}
          inputText={inputText}
          onChangeInput={setInputText}
          onSend={sendMessage}
          onBackToDaily={handleSwitchToDaily}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
});
