import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, ActivityIndicator } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import AuthManager from "../../utils/AuthManager";
import Navigator from "../../components/Navigator";
import API_BASE_URL from "../../config/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data?.error ?? "로그인에 실패했습니다.");
        return;
      }

      await AuthManager.login(data.token, data.account);
      router.replace("/(tabs)/home" as any);
    } catch (error) {
      console.error("로그인 요청 실패:", error);
      alert("로그인 중 문제가 발생했습니다. 네트워크 상태를 확인해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKakaoLogin = async () => {
    // TODO: 카카오 로그인 API 호출
    console.log("카카오 로그인 시도");
    alert("카카오 로그인 기능은 준비 중입니다.");
  };

  const handleDevLogin = async () => {
    // 개발자 모드: 로그인 처리 후 홈으로 이동
    await AuthManager.login("dev-token", {
      id: "dev",
      name: "개발자",
      email: "dev@example.com",
    });
    router.replace("/(tabs)/home" as any);
  };

  const handleFindPassword = () => {
    // TODO: 비밀번호 찾기 화면으로 이동
    alert("비밀번호 찾기 기능은 준비 중입니다.");
  };

  const handleFindId = () => {
    // TODO: 아이디 찾기 화면으로 이동
    alert("아이디 찾기 기능은 준비 중입니다.");
  };

  const handleSignUp = () => {
    router.push("/(auth)/register" as any);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Navigator />
      <View style={styles.container}>
        <Text style={styles.title}>PETS</Text>
        <Text style={styles.subtitle}>당신의 운동 파트너</Text>

        {/* 이메일 입력 */}
        <TextInput
          style={styles.input}
          placeholder="이메일"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#999"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* 비밀번호 입력 */}
        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#999"
        />

        {/* 로그인 버튼 */}
        <TouchableOpacity
          style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.loginButtonText}>로그인</Text>
          )}
        </TouchableOpacity>

        {/* 카카오 로그인 버튼 */}
        <TouchableOpacity style={styles.kakaoButton} onPress={handleKakaoLogin}>
          <Text style={styles.kakaoButtonText}>카카오 로그인</Text>
        </TouchableOpacity>

        {/* 개발자 모드 로그인 버튼 */}
        <TouchableOpacity style={styles.devButton} onPress={handleDevLogin}>
          <Text style={styles.devButtonText}>개발자 모드 로그인</Text>
        </TouchableOpacity>

        {/* 하단 링크들 */}
        <View style={styles.linkContainer}>
          <TouchableOpacity onPress={handleFindPassword}>
            <Text style={styles.linkText}>비밀번호 찾기</Text>
          </TouchableOpacity>
          <Text style={styles.separator}>|</Text>
          <TouchableOpacity onPress={handleFindId}>
            <Text style={styles.linkText}>아이디 찾기</Text>
          </TouchableOpacity>
          <Text style={styles.separator}>|</Text>
          <TouchableOpacity onPress={handleSignUp}>
            <Text style={styles.linkText}>회원가입</Text>
          </TouchableOpacity>
        </View>
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
    fontSize: 48,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: "#666666",
    marginBottom: 40,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    width: "100%",
  },
  loginButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  kakaoButton: {
    backgroundColor: "#FEE500",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  kakaoButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  devButton: {
    backgroundColor: "#6c757d",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 24,
  },
  devButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  linkText: {
    fontSize: 14,
    color: "#666666",
  },
  separator: {
    fontSize: 14,
    color: "#cccccc",
  },
});

