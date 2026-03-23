import React, { useCallback, useState } from "react";
import { SafeAreaView, StyleSheet, Alert } from "react-native";
import HomeButton from "../../components/HomeButton";
import ExerciseChatView from "../../components/chatting/ExerciseChatView";
import { ChatMessage } from "../../types/chat";
import AuthManager from "../../utils/AuthManager";
import API_BASE_URL from "../../config/api";

export default function ChattingScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: "헬스 메이트예요! 어떤 운동을 할지 고민되면 편하게 물어보세요 :)",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);

  const sendMessage = async (overrideText?: string) => {
    const textToSend = (overrideText ?? inputText).trim();
    if (textToSend === "" || isLoadingResponse) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: textToSend,
      isUser: true,
      timestamp: new Date(),
    };

    const userMessageText = textToSend;
    setMessages((prev) => [...prev, userMessage]);
    if (!overrideText) setInputText("");
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

  const INITIAL_MESSAGES: ChatMessage[] = [
    {
      id: "1",
      text: "헬스 메이트예요! 어떤 운동을 할지 고민되면 편하게 물어보세요 :)",
      isUser: false,
      timestamp: new Date(),
    },
  ];

  const handleResetChat = useCallback(() => {
    setMessages(INITIAL_MESSAGES);
    setInputText("");
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <HomeButton />
      <ExerciseChatView
        messages={messages}
        inputText={inputText}
        onChangeInput={setInputText}
        onSend={() => sendMessage()}
        onSendWithText={sendMessage}
        onReset={handleResetChat}
        isLoadingResponse={isLoadingResponse}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },  
});
