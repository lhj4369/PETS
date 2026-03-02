import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ChatMessage } from "../../types/chat";

interface ExerciseChatViewProps {
  messages: ChatMessage[];
  inputText: string;
  onChangeInput: (text: string) => void;
  onSend: () => void;
  /** 추천 질문 칩 탭 시 해당 문구로 바로 전송 */
  onSendWithText?: (text: string) => void;
  onBackToDaily: () => void;
  /** 대화 초기화 */
  onReset?: () => void;
  isLoadingResponse?: boolean;
}

export default function ExerciseChatView({
  messages,
  inputText,
  onChangeInput,
  onSend,
  onSendWithText,
  onBackToDaily,
  onReset,
  isLoadingResponse = false,
}: ExerciseChatViewProps) {
  const isSendDisabled = useMemo(() => inputText.trim() === "" || isLoadingResponse, [inputText, isLoadingResponse]);

  // 추천 질문: 입력창이 비어 있을 때만 노출 (대화 중에도 빠르게 재질문 가능)
  const showSuggestedQuestions = inputText.trim() === "" && !isLoadingResponse;
  const SUGGESTED_QUESTIONS = [
    "오늘 뭐 할까요?",
    "30분 운동 추천해줘",
    "스트레칭 추천해줘",
    "몸무게 감량 운동 알려줘",
  ];

  const handleSuggestedPress = (text: string) => {
    if (onSendWithText) {
      onSendWithText(text);
    } else {
      onChangeInput(text);
    }
  };

  const handleResetPress = () => {
    Alert.alert(
      "대화 초기화",
      "채팅 내용을 모두 지우고 처음부터 시작할까요?",
      [
        { text: "취소", style: "cancel" },
        { text: "초기화", style: "destructive", onPress: () => onReset?.() },
      ]
    );
  };

  // 로딩 애니메이션을 위한 점 깜빡임
  const [loadingDots, setLoadingDots] = useState(".");
  
  useEffect(() => {
    if (!isLoadingResponse) {
      setLoadingDots(".");
      return;
    }
    
    const interval = setInterval(() => {
      setLoadingDots((prev) => {
        if (prev === ".") return "..";
        if (prev === "..") return "...";
        return ".";
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, [isLoadingResponse]);

  const renderExerciseMessage = ({ item }: { item: ChatMessage }) => (
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
          style={[styles.bubbleText, item.isUser && styles.userBubbleText]}
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
    <KeyboardAvoidingView
      style={styles.exerciseContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseTitle}>운동 조언 채팅</Text>
        <View style={styles.headerButtons}>
          {onReset ? (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="refresh-outline" size={22} color={THEME_TEXT_DARK} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.headerButton} onPress={onBackToDaily}>
            <Text style={styles.headerButtonText}>일상 대화 보기</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={messages}
        renderItem={renderExerciseMessage}
        keyExtractor={(item) => item.id}
        style={styles.chatList}
        contentContainerStyle={styles.chatContent}
        ListFooterComponent={
          isLoadingResponse ? (
            <View style={[styles.messageRow, styles.aiRow]}>
              <View style={styles.profileColumn}>
                <View style={styles.profilePlaceholder} />
                <Text style={styles.profileName}>헬시</Text>
              </View>
              <View style={[styles.bubble, styles.aiBubble]}>
                <Text style={styles.bubbleText}>입력중{loadingDots}</Text>
              </View>
            </View>
          ) : null
        }
      />

      <View style={styles.bottomSection}>
        {showSuggestedQuestions ? (
          <View style={styles.suggestedSection}>
            <Text style={styles.suggestedLabel}>이런 걸 물어봐도 좋아요</Text>
            <View style={styles.suggestedChipRow}>
              {SUGGESTED_QUESTIONS.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={styles.suggestedChip}
                  onPress={() => handleSuggestedPress(q)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestedChipText} numberOfLines={1}>
                    {q}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}
        <View style={styles.inputBar}>
        <TextInput
          style={styles.chatInput}
          value={inputText}
          onChangeText={onChangeInput}
          placeholder="운동에 대해 물어보세요..."
          placeholderTextColor="#666"
          multiline
        />
        <TouchableOpacity
          style={[styles.chatSendButton, isSendDisabled && styles.chatSendButtonDisabled]}
          disabled={isSendDisabled}
          onPress={onSend}
        >
          <Text style={[styles.chatSendButtonText, isSendDisabled && styles.chatSendButtonTextDisabled]}>전송</Text>
        </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// records·customize 탭과 동일한 PETS 앱 테마
const THEME_YELLOW = "#FFD54F";
const THEME_CREAM = "#FFF8E1";
const THEME_TEXT_DARK = "#333333";

const styles = StyleSheet.create({
  exerciseContainer: {
    flex: 1,
    backgroundColor: THEME_CREAM,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 70,
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
    color: THEME_TEXT_DARK,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  resetButton: {
    padding: 6,
    marginRight: 6,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EDE7D6",
  },
  headerButtonText: {
    color: THEME_TEXT_DARK,
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
    backgroundColor: "#E8E0C8",
    marginBottom: 4,
  },
  profileName: {
    fontSize: 12,
    color: "#666",
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
    backgroundColor: THEME_YELLOW,
    borderBottomRightRadius: 4,
    alignSelf: "flex-end",
  },
  bubbleText: {
    fontSize: 16,
    color: THEME_TEXT_DARK,
    lineHeight: 22,
  },
  userBubbleText: {
    color: THEME_TEXT_DARK,
  },
  bubbleTimestamp: {
    fontSize: 11,
    color: "#666",
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
    backgroundColor: THEME_YELLOW,
  },
  chatSendButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  chatSendButtonText: {
    color: THEME_TEXT_DARK,
    fontWeight: "600",
  },
  chatSendButtonTextDisabled: {
    color: "#999",
  },
  bottomSection: {
    paddingTop: 8,
  },
  suggestedSection: {
    marginBottom: 10,
  },
  suggestedLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  suggestedChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  suggestedChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: THEME_YELLOW,
    marginRight: 8,
    marginBottom: 8,
  },
  suggestedChipText: {
    fontSize: 14,
    color: THEME_TEXT_DARK,
    fontWeight: "500",
  },
});

