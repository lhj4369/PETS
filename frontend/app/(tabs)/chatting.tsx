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
  ImageBackground,
  Image,
} from "react-native";
import HomeButton from "../../components/HomeButton";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const DAILY_SCRIPTS = [
  "오늘은 어떤 재미있는 일이 있었나요? 저도 궁금해요!",
  "점심은 맛있게 드셨나요? 저는 상상으로만 먹고 있어요.",
  "요즘 빠진 취미가 있다면 알려주세요. 함께 이야기 나누고 싶어요.",
  "오늘 날씨 이야기도 좋아요. 바람이 시원하던가요?",
  "잠깐 쉬어가는 것도 중요해요. 지금도 충분히 잘하고 있어요!",
];

const chatBackground = require("../../assets/images/chat_background_imsi.png");
const chatAnimal = require("../../assets/images/animals/dog.png");

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
  const [scriptIndex, setScriptIndex] = useState<number | null>(null);

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

  const handleAnimalPress = () => {
    setScriptIndex((prev) => {
      if (prev === null) return 0;
      const next = (prev + 1) % DAILY_SCRIPTS.length;
      return next;
    });
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

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.isUser) {
      return (
        <View style={[styles.messageRow, styles.userRow]}>
          <View style={[styles.chatBubble, styles.userBubble]}>
            <Text style={[styles.messageText, styles.userText]}>
              {item.text}
            </Text>
          </View>
          <Text style={[styles.timestamp, styles.userTimestamp]}>
            {item.timestamp.toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.messageRow}>
        <View style={styles.partnerColumn}>
          <View style={styles.partnerProfilePlaceholder} />
          <View style={[styles.chatBubble, styles.partnerBubble]}>
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
          <Text style={styles.timestamp}>
            {item.timestamp.toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  const dailyScript =
    scriptIndex === null ? null : DAILY_SCRIPTS[scriptIndex];

  return (
    <SafeAreaView style={styles.safeArea}>
      <HomeButton />
      {chatMode === "daily" ? (
        <ImageBackground
          source={chatBackground}
          style={styles.dailyBackground}
          resizeMode="cover"
        >
          <View style={styles.dailyContent}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.animalTouchZone}
              onPress={handleAnimalPress}
            >
              {dailyScript && (
                <View style={styles.speechBubble}>
                  <Text style={styles.speechText}>{dailyScript}</Text>
                  <View style={styles.speechTail} />
                </View>
              )}
              <Image source={chatAnimal} style={styles.animalImage} />
              {!dailyScript && (
                <Text style={styles.dailyHint}>
                  동물을 터치해서 대화를 시작해보세요!
                </Text>
              )}
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setChatMode("exercise")}
          >
            <Text style={styles.switchButtonText}>운동 조언 받으러 가기</Text>
          </TouchableOpacity>
        </ImageBackground>
      ) : (
        <KeyboardAvoidingView
          style={styles.exerciseContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.exerciseHeader}>
            <TouchableOpacity onPress={() => setChatMode("daily")}>
              <Text style={styles.switchBackText}>← 일상 대화 보기</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>운동 조언</Text>
            <View style={{ width: 80 }} />
          </View>
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
          />
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="운동에 대해 물어보세요..."
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  dailyBackground: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 32,
    paddingBottom: 40,
    paddingTop: 20,
  },
  dailyContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  animalTouchZone: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  speechBubble: {
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 16,
    maxWidth: 260,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  speechTail: {
    position: "absolute",
    bottom: -10,
    left: "45%",
    width: 0,
    height: 0,
    borderTopWidth: 12,
    borderTopColor: "rgba(255,255,255,0.95)",
    borderRightWidth: 10,
    borderRightColor: "transparent",
    borderLeftWidth: 10,
    borderLeftColor: "transparent",
  },
  speechText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
    textAlign: "center",
  },
  animalImage: {
    width: 220,
    height: 220,
    resizeMode: "contain",
  },
  dailyHint: {
    marginTop: 12,
    fontSize: 15,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  switchButton: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
  },
  switchButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  exerciseContainer: {
    flex: 1,
    backgroundColor: "#f0f0f2",
  },
  exerciseHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e2e2e2",
  },
  switchBackText: {
    color: "#007AFF",
    fontSize: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 20,
  },
  messageRow: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 16,
  },
  partnerColumn: {
    maxWidth: "80%",
  },
  partnerProfilePlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#e0e0e0",
    marginBottom: 6,
    marginLeft: 6,
  },
  chatBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  partnerBubble: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 4,
    marginLeft: 10,
  },
  userRow: {
    justifyContent: "flex-end",
  },
  userBubble: {
    backgroundColor: "#ffe812",
    borderTopRightRadius: 4,
    alignSelf: "flex-end",
    maxWidth: "80%",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#111",
  },
  userText: {
    color: "#111",
  },
  timestamp: {
    fontSize: 12,
    color: "#8a8a8e",
    marginTop: 4,
    marginLeft: 12,
  },
  userTimestamp: {
    marginLeft: 8,
    alignSelf: "center",
  },
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    alignItems: "flex-end",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e2e2e2",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  sendButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  sendButtonDisabled: {
    backgroundColor: "#b0b0b5",
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
