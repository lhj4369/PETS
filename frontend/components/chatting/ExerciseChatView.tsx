import React, { useMemo } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ChatMessage } from "../../types/chat";

interface ExerciseChatViewProps {
  messages: ChatMessage[];
  inputText: string;
  onChangeInput: (text: string) => void;
  onSend: () => void;
  onBackToDaily: () => void;
}

export default function ExerciseChatView({
  messages,
  inputText,
  onChangeInput,
  onSend,
  onBackToDaily,
}: ExerciseChatViewProps) {
  const isSendDisabled = useMemo(() => inputText.trim() === "", [inputText]);

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
        <TouchableOpacity style={styles.headerButton} onPress={onBackToDaily}>
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
          onChangeText={onChangeInput}
          placeholder="운동에 대해 물어보세요..."
          placeholderTextColor="#9aa0a6"
          multiline
        />
        <TouchableOpacity
          style={[styles.chatSendButton, isSendDisabled && styles.chatSendButtonDisabled]}
          disabled={isSendDisabled}
          onPress={onSend}
        >
          <Text style={styles.chatSendButtonText}>전송</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  exerciseContainer: {
    flex: 1,
    backgroundColor: "#e5ecf5",
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

