import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import AuthManager from "../../utils/AuthManager";
import Navigator from "../../components/Navigator";
import API_BASE_URL from "../../config/api";

// WebBrowser 완료 후 자동으로 닫히도록 설정
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Google 인증 요청을 위한 훅 초기화
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "",
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "",
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "",
  });

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

  // Google 로그인 처리하는 함수
  const handleGoogleLogin = async () => {
    if (!request) {
      alert("구글 로그인을 준비하는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setIsGoogleLoading(true);
    try {
      await promptAsync();
    } catch (error) {
      console.error("구글 로그인 요청 실패:", error);
      alert("구글 로그인 중 문제가 발생했습니다.");
      setIsGoogleLoading(false);
    }
  };

  // Google 인증 성공 후 처리
  const handleGoogleAuthSuccess = async (accessToken: string | undefined) => {
    if (!accessToken) {
      alert("구글 인증 토큰을 받을 수 없습니다.");
      setIsGoogleLoading(false);
      return;
    }

    try {
      // Google API로 사용자 정보 가져오기
      const userInfoResponse = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!userInfoResponse.ok) {
        throw new Error("사용자 정보를 가져올 수 없습니다.");
      }

      const googleUserInfo = await userInfoResponse.json();

      // 백엔드로 Google 사용자 정보 전송하여 JWT 토큰 받기
      const backendResponse = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleId: googleUserInfo.sub,
          email: googleUserInfo.email,
          name: googleUserInfo.name,
          picture: googleUserInfo.picture,
        }),
      });

      const data = await backendResponse.json();
      if (!backendResponse.ok) {
        alert(data?.error ?? "구글 로그인에 실패했습니다.");
        setIsGoogleLoading(false);
        return;
      }

      // 로그인 성공
      await AuthManager.login(data.token, data.account);
      router.replace("/(tabs)/home" as any);
    } catch (error) {
      console.error("구글 로그인 처리 실패:", error);
      alert("구글 로그인 중 문제가 발생했습니다. 네트워크 상태를 확인해주세요.");
      setIsGoogleLoading(false);
    }
  };

  // Google 인증 응답 처리
  useEffect(() => {
    if (response?.type === "success") {
      handleGoogleAuthSuccess(response.authentication?.accessToken);
    } else if (response?.type === "error") {
      console.error("구글 로그인 에러:", response.error);
      alert("구글 로그인에 실패했습니다.");
      setIsGoogleLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const handleDevLogin = async () => {
    // 개발자 계정으로 로그인
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "Developer@test.net", password: "1234" }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data?.error ?? "개발자 로그인에 실패했습니다.");
        return;
      }

      await AuthManager.login(data.token, data.account);
      router.replace("/(tabs)/home" as any);
    } catch (error) {
      console.error("개발자 로그인 요청 실패:", error);
      alert("개발자 로그인 중 문제가 발생했습니다. 네트워크 상태를 확인해주세요.");
    } finally {
      setIsSubmitting(false);
    }
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

        {/* 구글 로그인 버튼 */}
        <TouchableOpacity
          style={[styles.googleButton, (!request || isGoogleLoading) && styles.googleButtonDisabled]}
          onPress={handleGoogleLogin}
          disabled={!request || isGoogleLoading}
        >
          {isGoogleLoading ? (
            <ActivityIndicator color="#3c4043" />
          ) : (
            <Text style={styles.googleButtonText}>구글 로그인</Text>
          )}
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
    fontSize: 100,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 12,
    fontFamily: 'KotraHope',
  },
  subtitle: {
    fontSize: 24,
    color: "#666666",
    marginBottom: 40,
    fontFamily: 'KotraHope',
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
    fontSize: 20,
    fontWeight: "600",
    fontFamily: 'KotraHope',
  },
  googleButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#dadce0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    color: "#3c4043",
    fontSize: 20,
    fontWeight: "500",
    fontFamily: 'KotraHope',
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
    fontSize: 20,
    fontWeight: "600",
    fontFamily: 'KotraHope',
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  linkText: {
    fontSize: 18,
    color: "#666666",
    fontFamily: 'KotraHope',
  },
  separator: {
    fontSize: 18,
    color: "#cccccc",
  },
});

