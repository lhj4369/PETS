import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, ActivityIndicator, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import AuthManager from "../../utils/AuthManager";
import Navigator from "../../components/Navigator";
import API_BASE_URL from "../../config/api";

// WebBrowser 완료 후 자동으로 닫히도록 설정
WebBrowser.maybeCompleteAuthSession();

const LOGIN_COLORS = {
  ivory: "#FFFEF5",
  ivoryDark: "#F5F0E0",
  yellow: "#FFE566",
  yellowDark: "#E6C94A",
  brown: "#8B7355",
  brownLight: "#A08060",
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
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
    <View style={styles.wrapper}>
      <Navigator />
      {/* 상단: 이미지 꽉 채움 (cover) */}
      <View style={styles.imageSection}>
        <Image
          source={require("../../assets/images/background/login.png")}
          style={styles.loginImage}
          resizeMode="cover"
        />
        {/* 이미지 중앙 상단에 PETS 문구 오버레이 */}
        <View style={styles.titleOverlay} pointerEvents="none">
          <Text style={styles.title}>PETS</Text>
          <Text style={styles.subtitle}>오늘도 목표를 향해 한 걸음</Text>
        </View>
      </View>
      {/* 하단: 로그인 박스 */}
      <View style={[styles.bottomCard, { backgroundColor: LOGIN_COLORS.ivory, borderColor: LOGIN_COLORS.yellow, paddingBottom: insets.bottom }]}>
        <ScrollView
          contentContainerStyle={styles.cardScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 이메일 입력 */}
          <TextInput
            style={styles.input}
            placeholder="이메일"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor={LOGIN_COLORS.brownLight}
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
            placeholderTextColor={LOGIN_COLORS.brownLight}
          />

          {/* 로그인 버튼 */}
          <TouchableOpacity
            style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={LOGIN_COLORS.brown} />
            ) : (
              <Text style={styles.loginButtonText}>로그인</Text>
            )}
          </TouchableOpacity>

          {/* 구분선 */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* 구글 로그인 버튼 */}
          <TouchableOpacity
            style={[styles.googleButton, (!request || isGoogleLoading) && styles.googleButtonDisabled]}
            onPress={handleGoogleLogin}
            disabled={!request || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color="#3c4043" />
            ) : (
              <>
                <Image source={require("../../assets/images/icons/google.png")} style={styles.googleIcon} resizeMode="contain" />
                <Text style={styles.googleButtonText}>Google 계정으로 로그인</Text>
              </>
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
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    width: "100%",
    backgroundColor: LOGIN_COLORS.ivory,
  },
  imageSection: {
    width: "100%",
    flex: 0.42,
    position: "relative",
    overflow: "hidden",
  },
  loginImage: {
    width: "100%",
    height: "100%",
  },
  titleOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 48,
  },
  bottomCard: {
    flex: 1,
    marginTop: -40,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 2,
    paddingTop: 40,
    elevation: 8,
    shadowColor: LOGIN_COLORS.brown,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  cardScrollContent: {
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
  title: {
    fontSize: 46,
    fontWeight: "bold",
    letterSpacing: 1,
    color: LOGIN_COLORS.brown,
    marginBottom: 8,
    fontFamily: "KotraHope",
    textShadowColor: "rgba(255, 255, 255, 0.9)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 19,
    color: LOGIN_COLORS.brown,
    marginTop: 4,
    fontFamily: "KotraHope",
    textShadowColor: "rgba(255, 255, 255, 0.9)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: LOGIN_COLORS.ivoryDark,
    width: "100%",
    fontFamily: "KotraHope",
  },
  loginButton: {
    backgroundColor: LOGIN_COLORS.yellow,
    paddingVertical: 16,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: LOGIN_COLORS.yellowDark,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: LOGIN_COLORS.brown,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "KotraHope",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: LOGIN_COLORS.ivoryDark,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: LOGIN_COLORS.brownLight,
    fontFamily: "KotraHope",
  },
  googleButton: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#dadce0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonText: {
    color: "#3c4043",
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "KotraHope",
  },
  devButton: {
    backgroundColor: LOGIN_COLORS.ivoryDark,
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 1,
    borderColor: LOGIN_COLORS.brownLight,
  },
  devButtonText: {
    color: LOGIN_COLORS.brown,
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "KotraHope",
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  linkText: {
    fontSize: 16,
    color: LOGIN_COLORS.brownLight,
    fontFamily: "KotraHope",
  },
  separator: {
    fontSize: 16,
    color: LOGIN_COLORS.ivoryDark,
  },
});

