import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SafeAreaView, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import HomeButton from "../../components/HomeButton";
import DailyChatView from "../../components/chatting/DailyChatView";
import ExerciseChatView from "../../components/chatting/ExerciseChatView";
import { ChatMessage } from "../../types/chat";
import AuthManager from "../../utils/AuthManager";
import API_BASE_URL from "../../config/api";
import { useCustomization } from "../../context/CustomizationContext";
import { getDailyScripts, getPlaceholderPhrase } from "../../utils/dailyScripts";

const EXERCISE_RESPONSES = [
  "가벼운 준비 운동부터 시작해 봐요. 어깨와 허리를 살짝 돌려주는 것만으로도 큰 도움이 돼요!",
  "오늘은 하체 날로 어떠세요? 스쿼트 15회 × 3세트 추천드릴게요.",
  "물이 부족하면 근육이 더 쉽게 피로해져요. 지금 한 잔 마실까요?",
  "목표를 작게 쪼개보세요. 10분 집중해서 운동하는 것부터 시작해도 충분히 멋져요!",
  "운동 마무리엔 가벼운 스트레칭으로 근육을 풀어 주세요. 다음 날 몸이 훨씬 가볍답니다.",
];

export default function ChattingScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string | string[] }>();
  const { selectedAnimalId } = useCustomization();
  const dailyScripts = useMemo(() => getDailyScripts(selectedAnimalId ?? null), [selectedAnimalId]);
  const placeholderPhrase = useMemo(() => getPlaceholderPhrase(selectedAnimalId ?? null), [selectedAnimalId]);

  const [viewMode, setViewMode] = useState<"daily" | "exercise">("daily");
  const [scriptIndex, setScriptIndex] = useState(-1);
  const [isScriptVisible, setIsScriptVisible] = useState(false);
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
    () => (scriptIndex >= 0 ? dailyScripts[scriptIndex] : ""),
    [scriptIndex, dailyScripts]
  );

  const normalizedMode = Array.isArray(mode) ? mode[0] : mode;
  const scriptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAutoPlayedGreeting = useRef(false);

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

  // 진입 시 동물별 인사 한 줄 자동 재생 (일상 탭에서 한 번만)
  useEffect(() => {
    if (viewMode !== "daily" || dailyScripts.length === 0 || hasAutoPlayedGreeting.current) return;

    const showTimer = setTimeout(() => {
      setScriptIndex(0);
      setIsScriptVisible(true);
      hasAutoPlayedGreeting.current = true;
      scriptTimerRef.current = setTimeout(() => {
        setIsScriptVisible(false);
      }, 4000);
    }, 500);

    return () => {
      clearTimeout(showTimer);
      if (scriptTimerRef.current) {
        clearTimeout(scriptTimerRef.current);
        scriptTimerRef.current = null;
      }
    };
  }, [viewMode, dailyScripts.length]);

  useEffect(() => {
    return () => {
      if (scriptTimerRef.current) clearTimeout(scriptTimerRef.current);
    };
  }, []);

  const handleAnimalPress = () => {
    setScriptIndex((prev) => (prev + 1) % dailyScripts.length);
    setIsScriptVisible(true);
    if (scriptTimerRef.current) {
      clearTimeout(scriptTimerRef.current);
    }
    scriptTimerRef.current = setTimeout(() => {
      setIsScriptVisible(false);
    }, 4000);
  };

  const [isLoadingResponse, setIsLoadingResponse] = useState(false);

  const sendMessage = async () => {
    if (inputText.trim() === "" || isLoadingResponse) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    const userMessageText = inputText;
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoadingResponse(true);

    try {
      const headers = await AuthManager.getAuthHeader();
      
      if (!headers.Authorization) {
        Alert.alert("오류", "로그인이 필요합니다.");
        setIsLoadingResponse(false);
        return;
      }

      // 대화 히스토리 전송 (최근 10개)
      const conversationHistory = messages.slice(-10);

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessageText,
          conversationHistory,
        }),
      });

      if (response.status === 401) {
        await AuthManager.logout();
        Alert.alert("오류", "인증이 만료되었습니다. 다시 로그인해주세요.");
        setIsLoadingResponse(false);
        return;
      }

      if (!response.ok) {
        let errorMessage = "채팅 응답 생성에 실패했습니다.";
        try {
          const errorData = await response.json();
          errorMessage = errorData?.error || errorMessage;
          console.error("채팅 API 에러 응답:", errorData);
        } catch (e) {
          console.error("에러 응답 파싱 실패:", e);
          errorMessage = `서버 오류 (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.message,
        isUser: false,
        timestamp: new Date(data.timestamp || new Date()),
      };
      
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error: any) {
      console.error("채팅 메시지 전송 실패:", error);
      Alert.alert("오류", error?.message ?? "채팅 메시지 전송 중 문제가 발생했습니다.");
      
      // 에러 발생 시 사용자 메시지 제거 (선택사항)
      // setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setIsLoadingResponse(false);
    }
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
          placeholderPhrase={placeholderPhrase}
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
          isLoadingResponse={isLoadingResponse}
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
