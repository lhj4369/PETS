import React, { useMemo, useState } from "react";
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
  Image,
  ImageBackground,
} from "react-native";
import HomeButton from "../../components/HomeButton";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

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
  const [viewMode, setViewMode] = useState<"daily" | "exercise">("daily");
  const [scriptIndex, setScriptIndex] = useState(-1);
  const [messages, setMessages] = useState<Message[]>([
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

  const handleAnimalPress = () => {
    setScriptIndex((prev) => (prev + 1) % DAILY_SCRIPTS.length);
  };

  const getRandomResponse = () =>
    EXERCISE_RESPONSES[Math.floor(Math.random() * EXERCISE_RESPONSES.length)];

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

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getRandomResponse(),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000 + Math.random() * 1000);
  };

  const renderExerciseMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageRow,
        item.isUser ? styles.userRow : styles.aiRow,
      ]}
    >
      {item.isUser ? (
        <View style={styles.profileSpacer} />
      ) : (
        <View style={styles.profileColumn}>
          <View style={styles.profilePlaceholder} />
          <Text style={styles.profileName}>헬시</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          item.isUser ? styles.userBubble : styles.aiBubble,
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            item.isUser && styles.userBubbleText,
          ]}
        >
          {item.text}
        </Text>
        <Text style={styles.bubbleTimestamp}>
          {item.timestamp.toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <HomeButton />
      {viewMode === "daily" ? (
        <ImageBackground
          source={require("../../assets/images/chat_background_imsi.png")}
          style={styles.dailyBackground}
          imageStyle={styles.dailyBackgroundImage}
        >
          <View style={styles.dailyOverlay}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.animalWrapper}
              onPress={handleAnimalPress}
            >
              {currentScript !== "" && (
                <View style={styles.speechBubble}>
                  <Text style={styles.speechText}>{currentScript}</Text>
                  <View style={styles.speechTail} />
                </View>
              )}
              <Image
                source={require("../../assets/images/dog_character.png")}
                style={styles.animalImage}
                resizeMode="contain"
              />
              {currentScript === "" && (
                <Text style={styles.tapHint}>동물을 터치해 대화를 시작해보세요</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setViewMode("exercise")}
            >
              <Text style={styles.switchButtonText}>운동 조언 받으러 가기</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      ) : (
        <KeyboardAvoidingView
          style={styles.exerciseContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseTitle}>운동 조언 채팅</Text>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setViewMode("daily")}
            >
              <Text style={styles.headerButtonText}>일상 대화 보기</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={messages}
            renderItem={renderExerciseMessage}
            keyExtractor={(item) => item.id}
            style={styles.chatList}
            contentContainerStyle={styles.chatContent}
          />

          <View style={styles.inputBar}>
            <TextInput
              style={styles.chatInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="운동에 대해 물어보세요..."
              placeholderTextColor="#9aa0a6"
              multiline
            />
            <TouchableOpacity
              style={[
                styles.chatSendButton,
                inputText.trim() === "" && styles.chatSendButtonDisabled,
              ]}
              disabled={inputText.trim() === ""}
              onPress={sendMessage}
            >
              <Text style={styles.chatSendButtonText}>전송</Text>
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
    backgroundColor: "#f7f7f7",
  },
  dailyBackground: {
    flex: 1,
  },
  dailyBackgroundImage: {
    width: "100%",
    height: "100%",
  },
  dailyOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  animalWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  speechBubble: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
    marginBottom: 12,
    maxWidth: 300,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    position: "relative",
  },
  speechText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
    textAlign: "center",
  },
  speechTail: {
    position: "absolute",
    bottom: -12,
    left: "50%",
    marginLeft: -12,
    width: 24,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.9)",
    transform: [{ rotate: "45deg" }],
  },
  animalImage: {
    width: 220,
    height: 220,
  },
  tapHint: {
    marginTop: 16,
    fontSize: 15,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  switchButton: {
    marginTop: 80,
    paddingVertical: 16,
    paddingHorizontal: 28,
    backgroundColor: "#2b59ff",
    borderRadius: 30,
    shadowColor: "#2b59ff",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  switchButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
  },
  exerciseContainer: {
    flex: 1,
    backgroundColor: "#e5ecf5",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  exerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  exerciseTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#fff",
  },
  headerButtonText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "600",
  },
  chatList: {
    flex: 1,
  },
  chatContent: {
    paddingBottom: 16,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  aiRow: {
    alignItems: "flex-start",
  },
  userRow: {
    justifyContent: "flex-end",
  },
  profileColumn: {
    alignItems: "center",
    marginRight: 8,
  },
  profilePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#c8d0da",
    marginBottom: 4,
  },
  profileName: {
    fontSize: 12,
    color: "#6b7280",
  },
  profileSpacer: {
    width: 44,
  },
  bubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  aiBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: "#ffd249",
    borderBottomRightRadius: 4,
    alignSelf: "flex-end",
  },
  bubbleText: {
    fontSize: 16,
    color: "#111827",
    lineHeight: 22,
  },
  userBubbleText: {
    color: "#4c3813",
  },
  bubbleTimestamp: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 6,
    alignSelf: "flex-end",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#fff",
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  chatInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 120,
  },
  chatSendButton: {
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#2b59ff",
  },
  chatSendButtonDisabled: {
    backgroundColor: "#cdd5f0",
  },
  chatSendButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
