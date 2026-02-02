import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, ActivityIndicator, Platform } from "react-native";
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

  // 환경 변수 확인
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "";
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";

  // 현재 플랫폼에 맞는 클라이언트 ID 확인
  const getCurrentPlatformClientId = () => {
    if (Platform.OS === "android") return androidClientId;
    if (Platform.OS === "ios") return iosClientId;
    return webClientId;
  };

  // 디버깅: 클라이언트 ID 로그 출력 (개발 환경에서만)
  useEffect(() => {
    if (__DEV__) {
      console.log("=== Google OAuth 클라이언트 ID 확인 ===");
      console.log("플랫폼:", Platform.OS);
      console.log("Web Client ID:", webClientId ? `${webClientId.substring(0, 20)}...` : "❌ 없음");
      console.log("Android Client ID:", androidClientId ? `${androidClientId.substring(0, 20)}...` : "❌ 없음");
      console.log("iOS Client ID:", iosClientId ? `${iosClientId.substring(0, 20)}...` : "❌ 없음");
      console.log("현재 플랫폼 Client ID:", getCurrentPlatformClientId() ? `${getCurrentPlatformClientId().substring(0, 20)}...` : "❌ 없음");
      console.log("패키지 이름 (app.json):", Platform.OS === "android" ? "com.petshealth.app" : "com.petshealth.app");
      console.log("=====================================");
    }
  }, []);

  // Google 인증 요청을 위한 훅 초기화
  // Android에서는 useAuthRequest가 커스텀 URI 스킴을 사용하려고 해서 오류가 발생할 수 있습니다
  // Android에서는 androidClientId만 제공하고, webClientId를 전혀 전달하지 않아야 합니다
  // expo-auth-session이 Android에서 자동으로 올바른 플로우를 사용하도록 합니다
  const [request, response, promptAsync] = Google.useAuthRequest(
    Platform.OS === 'android'
      ? {
          // Android에서는 androidClientId만 사용
          androidClientId: androidClientId,
          // webClientId는 전혀 전달하지 않음 (커스텀 URI 스킴 오류 방지)
          // expo-auth-session이 Android에서 자동으로 올바른 플로우를 사용하도록 함
        }
      : {
          // iOS와 Web에서는 기존 설정 사용
          webClientId: webClientId,
          iosClientId: iosClientId,
        }
  );

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
    // 환경 변수 확인
    const currentClientId = getCurrentPlatformClientId();
    
    if (!currentClientId || currentClientId === "") {
      const platformName = Platform.OS === "android" ? "Android" : Platform.OS === "ios" ? "iOS" : "Web";
      alert(
        `구글 로그인 설정이 완료되지 않았습니다.\n\n` +
        `현재 플랫폼: ${platformName}\n\n` +
        `해결 방법:\n` +
        `1. 로컬 개발: 프로젝트 루트에 .env 파일을 생성하고\n` +
        `   EXPO_PUBLIC_GOOGLE_${platformName.toUpperCase()}_CLIENT_ID를 설정하세요.\n\n` +
        `2. EAS 빌드: 다음 명령어로 환경 변수를 등록하세요:\n` +
        `   eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_${platformName.toUpperCase()}_CLIENT_ID --value "your-client-id"\n\n` +
        `자세한 내용은 GOOGLE_LOGIN_SETUP.md 파일을 참고하세요.`
      );
      setIsGoogleLoading(false);
      return;
    }

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
      setIsGoogleLoading(false);
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
      console.error("에러 코드:", response.error?.code);
      console.error("에러 메시지:", response.error?.message);
      console.error("사용된 클라이언트 ID:", getCurrentPlatformClientId());
      
      // 구체적인 에러 메시지 표시
      let errorMessage = "구글 로그인에 실패했습니다.";
      
      if (response.error?.code === "invalid_request" || response.error?.message?.includes("client_id")) {
        const platformName = Platform.OS === "android" ? "Android" : Platform.OS === "ios" ? "iOS" : "Web";
        errorMessage = 
          `구글 로그인 설정 오류: 클라이언트 ID가 없습니다.\n\n` +
          `현재 플랫폼: ${platformName}\n\n` +
          `해결 방법:\n` +
          `1. 로컬 개발: 프로젝트 루트에 .env 파일 생성\n` +
          `2. EAS 빌드: eas secret:create 명령어로 환경 변수 등록\n\n` +
          `자세한 내용은 GOOGLE_LOGIN_SETUP.md 파일을 참고하세요.`;
      } else if (response.error?.code === "invalid_client" || response.error?.message?.includes("OAuth client")) {
        const platformName = Platform.OS === "android" ? "Android" : Platform.OS === "ios" ? "iOS" : "Web";
        errorMessage = 
          `구글 OAuth 클라이언트를 찾을 수 없습니다.\n\n` +
          `현재 플랫폼: ${platformName}\n` +
          `패키지/번들 ID: com.petshealth.app\n\n` +
          `확인 사항:\n` +
          `1. Google Cloud Console에서 ${platformName} OAuth 클라이언트 ID 확인\n` +
          `2. 패키지 이름이 정확히 "com.petshealth.app"인지 확인\n` +
          `3. EAS Secrets에 저장된 클라이언트 ID가 올바른지 확인\n` +
          `4. 최신 빌드를 다시 생성했는지 확인\n\n` +
          `디버깅: 개발자 콘솔에서 클라이언트 ID를 확인하세요.`;
      } else if (response.error?.message) {
        errorMessage = `구글 로그인 오류: ${response.error.message}`;
      }
      
      alert(errorMessage);
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

