//채팅 화면
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import HomeButton from "../../components/HomeButton";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChattingScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "안녕하세요! 저는 당신의 헬스케어 파트너입니다. 일상 대화를 나누거나 운동 조언을 받고 싶으시면 언제든 말씀해주세요!",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [chatMode, setChatMode] = useState<"daily" | "exercise">("daily");

  const getRandomResponse = (isExercise: boolean): string => {
    const dailyResponses = [
      "오늘 하루는 어떠셨나요? 운동은 잘 하셨나요?",
      "좋은 하루 보내고 계시는군요! 건강한 생활 습관을 유지하고 있어요.",
      "오늘도 수고하셨습니다! 내일도 화이팅이에요!",
      "건강한 하루를 보내고 계시는 것 같아서 기뻐요!",
      "오늘의 목표는 달성하셨나요? 작은 성취도 소중해요!",
    ];

    const exerciseResponses = [
      "오늘은 어떤 운동을 계획하고 계신가요?",
      "운동 전후로 충분한 스트레칭을 잊지 마세요!",
      "물을 충분히 마시는 것도 운동만큼 중요해요.",
      "규칙적인 운동이 건강의 기본이에요. 꾸준히 해보세요!",
      "운동 후에는 충분한 휴식도 필요해요. 무리하지 마세요!",
      "오늘의 운동 목표를 세워보는 것은 어떨까요?",
    ];

    const responses = isExercise ? exerciseResponses : dailyResponses;
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const sendMessage = () => {
    if (inputText.trim() === "") return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    // 1-2초 후 AI 응답
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getRandomResponse(chatMode === "exercise"),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000 + Math.random() * 1000);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessage : styles.aiMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.timestamp}>
        {item.timestamp.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
       <HomeButton />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* 채팅 모드 선택 탭 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              chatMode === "daily" && styles.activeTab,
            ]}
            onPress={() => setChatMode("daily")}
          >
            <Text
              style={[
                styles.tabText,
                chatMode === "daily" && styles.activeTabText,
              ]}
            >
              일상 대화
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              chatMode === "exercise" && styles.activeTab,
            ]}
            onPress={() => setChatMode("exercise")}
          >
            <Text
              style={[
                styles.tabText,
                chatMode === "exercise" && styles.activeTabText,
              ]}
            >
              운동 조언
            </Text>
          </TouchableOpacity>
        </View>

        {/* 메시지 리스트 */}
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
        />

        {/* 입력창 */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={
              chatMode === "daily"
                ? "일상 대화를 나누어보세요..."
                : "운동에 대해 물어보세요..."
            }
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim() === "" && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={inputText.trim() === ""}
          >
            <Text style={styles.sendButtonText}>전송</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 50,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: "#007AFF",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: "#fff",
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    maxWidth: "80%",
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    alignItems: "flex-end",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
