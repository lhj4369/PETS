import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import Navigator from "../../components/Navigator";
import API_BASE_URL from "../../config/api";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("이름, 이메일, 비밀번호를 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data?.error ?? "회원가입에 실패했습니다.");
        return;
      }

      alert("회원가입이 완료되었습니다. 로그인해 주세요.");
      router.replace("/(auth)/login" as any);
    } catch (error) {
      console.error("회원가입 요청 실패:", error);
      alert("회원가입 중 문제가 발생했습니다. 네트워크 상태를 확인해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoLogin = () => {
    router.replace("/(auth)/login" as any);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Navigator />
      <View style={styles.container}>
        <Text style={styles.title}>회원가입</Text>
        <Text style={styles.subtitle}>기본 정보를 입력해주세요.</Text>

        <TextInput
          style={styles.input}
          placeholder="이름"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#999"
        />

        <TextInput
          style={styles.input}
          placeholder="이메일"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#999"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="#999"
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleRegister}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>회원가입</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleGoLogin}>
          <Text style={styles.linkText}>이미 계정이 있으신가요? 로그인하기</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 12,
    fontFamily: 'KotraHope',
  },
  subtitle: {
    fontSize: 20,
    color: "#666666",
    marginBottom: 32,
    fontFamily: 'KotraHope',
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    width: "100%",
  },
  submitButton: {
    backgroundColor: "#34C759",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
    fontFamily: 'KotraHope',
  },
  linkText: {
    fontSize: 18,
    color: "#007AFF",
    fontFamily: 'KotraHope',
  },
});

