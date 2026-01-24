//설정 화면
import { useState, useEffect, useCallback } from "react";
import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import * as Google from "expo-auth-session/providers/google";
import HomeButton from "../../components/HomeButton";
import GoogleFitManager from "../../utils/GoogleFitManager";
import AuthManager from "../../utils/AuthManager";
import API_BASE_URL from "../../config/api";

type ProfileResponse = {
  account?: {
    id: number;
    name: string;
    email: string;
  } | null;
  profile?: {
    nickname: string | null;
  } | null;
};

export default function SettingsScreen() {
  // Google Fit 관련 상태
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGoogleFitLoading, setIsGoogleFitLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  // 사용자 프로필 관련 상태
  const [nickname, setNickname] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  // Google Fit 인증 요청 생성 (React Hook은 컴포넌트 내에서 직접 사용)
  const [request, response, promptAsync] = Google.useAuthRequest(
    GoogleFitManager.getAuthRequestConfig()
  );

  // 인증 상태 확인
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 인증 응답 처리
  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      if (authentication?.accessToken) {
        // iOS에서도 refresh token을 함께 저장
        handleAuthSuccess(
          authentication.accessToken,
          authentication.refreshToken || undefined
        );
      }
    } else if (response?.type === "error") {
      console.error("Google Fit 인증 에러:", response.error);
      Alert.alert("인증 실패", "Google Fit 인증에 실패했습니다.");
      setIsGoogleFitLoading(false);
    }
  }, [response]);

  const checkAuthStatus = async () => {
    setIsChecking(true);
    try {
      const authenticated = await GoogleFitManager.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error("인증 상태 확인 실패:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleAuthSuccess = async (accessToken: string, refreshToken?: string) => {
    try {
      // access token과 refresh token 모두 저장
      await GoogleFitManager.saveToken(accessToken, refreshToken);
      setIsAuthenticated(true);
      Alert.alert("성공", "Google Fit 인증이 완료되었습니다.");
    } catch (error) {
      console.error("토큰 저장 실패:", error);
      Alert.alert("오류", "토큰 저장에 실패했습니다.");
    } finally {
      setIsGoogleFitLoading(false);
    }
  };

  const handleGoogleFitLogin = async () => {
    if (!request) {
      Alert.alert("알림", "Google Fit 인증을 준비하는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setIsGoogleFitLoading(true);
    try {
      await promptAsync();
    } catch (error) {
      console.error("Google Fit 로그인 요청 실패:", error);
      Alert.alert("오류", "Google Fit 로그인 중 문제가 발생했습니다.");
      setIsGoogleFitLoading(false);
    }
  };

  const handleGoogleFitLogout = async () => {
    try {
      await GoogleFitManager.clearToken();
      setIsAuthenticated(false);
      Alert.alert("완료", "Google Fit 인증이 해제되었습니다.");
    } catch (error) {
      console.error("Google Fit 로그아웃 실패:", error);
      Alert.alert("오류", "로그아웃 중 문제가 발생했습니다.");
    }
  };

  const handleTestConnection = async () => {
    if (!isAuthenticated) {
      Alert.alert("알림", "먼저 Google Fit에 로그인해주세요.");
      return;
    }

    setIsGoogleFitLoading(true);
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999);

      const steps = await GoogleFitManager.getTodaySteps();
      const distance = await GoogleFitManager.getDistance(startOfDay.getTime(), endOfDay.getTime());
      
      Alert.alert(
        "연결 테스트 성공",
        `오늘의 데이터:\n걸음 수: ${steps.toLocaleString()}걸음\n이동 거리: ${(distance / 1000).toFixed(2)}km`
      );
    } catch (error: any) {
      console.error("연결 테스트 실패:", error);
      Alert.alert("연결 테스트 실패", error?.message || "Google Fit API 연결에 실패했습니다.");
    } finally {
      setIsGoogleFitLoading(false);
    }
  };

  // 사용자 프로필 가져오기
  const fetchProfile = useCallback(async () => {
    try {
      setIsProfileLoading(true);
      const headers = await AuthManager.getAuthHeader();
      
      if (!headers.Authorization) {
        router.replace("/(auth)/login" as any);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/me`, { headers });

      if (response.status === 401) {
        await AuthManager.logout();
        router.replace("/(auth)/login" as any);
        return;
      }

      if (!response.ok) {
        throw new Error("사용자 정보를 불러오지 못했습니다.");
      }

      const data = (await response.json()) as ProfileResponse;
      
      setNickname(data.profile?.nickname ?? "");
      setEmail(data.account?.email ?? "");
    } catch (error) {
      Alert.alert("오류", "사용자 정보를 불러오는데 실패했습니다.");
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const handleAppLogout = async () => {
    try {
      // 로그아웃 처리
      await AuthManager.logout();
      
      // 모바일과 웹 모두 router.replace 사용
      router.replace("/(auth)/login" as any);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
      Alert.alert("오류", "로그아웃 중 문제가 발생했습니다: " + errorMessage);
    }
  };

  if (isChecking) {
    return (
      <SafeAreaView style={styles.container}>
        <HomeButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>인증 상태 확인 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <HomeButton />
      <View style={styles.content}>
        <Text style={styles.title}>Google Fit 설정</Text>

        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>인증 상태:</Text>
          <View style={[styles.statusBadge, isAuthenticated ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
            <Text style={[styles.statusText, isAuthenticated ? styles.statusTextActive : styles.statusTextInactive]}>
              {isAuthenticated ? "인증됨" : "미인증"}
            </Text>
          </View>
        </View>

        {!isAuthenticated ? (
          <TouchableOpacity
            style={[styles.button, styles.loginButton, isGoogleFitLoading && styles.buttonDisabled]}
            onPress={handleGoogleFitLogin}
            disabled={!request || isGoogleFitLoading}
          >
            {isGoogleFitLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Google Fit 로그인</Text>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, styles.testButton]}
              onPress={handleTestConnection}
              disabled={isGoogleFitLoading}
            >
              {isGoogleFitLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>연결 테스트</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.logoutButton]}
              onPress={handleGoogleFitLogout}
              disabled={isGoogleFitLoading}
            >
              <Text style={styles.buttonText}>Google Fit 로그아웃</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>안내</Text>
          <Text style={styles.infoText}>
            • Google Fit 인증을 통해 운동 데이터를 가져올 수 있습니다.{"\n"}
            • 웹에서는 인증이 제한될 수 있습니다.{"\n"}
            • 실제 기기에서 테스트하는 것을 권장합니다.
          </Text>
        </View>
        {isProfileLoading ? (
          <ActivityIndicator size="large" color="#2b59ff" style={styles.loader} />
        ) : (
          <>
            {/* 계정 정보 섹션 */}
            <View style={styles.accountSection}>
              <Text style={styles.sectionTitle}>내 계정</Text>
              <View style={styles.accountInfo}>
                <View style={[styles.infoRow, styles.infoRowFirst]}>
                  <Text style={styles.infoLabel}>닉네임</Text>
                  <Text style={styles.infoValue}>{nickname || "설정되지 않음"}</Text>
                </View>
                <View style={[styles.infoRow, styles.infoRowLast]}>
                  <Text style={styles.infoLabel}>이메일</Text>
                  <Text style={styles.infoValue}>{email || "설정되지 않음"}</Text>
                </View>
              </View>
            </View>

            {/* 앱 로그아웃 버튼 */}
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={handleAppLogout}
              activeOpacity={0.7}
              disabled={isProfileLoading}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              accessibilityRole="button"
              accessibilityLabel="로그아웃"
            >
              <Text style={styles.logoutButtonText}>로그아웃</Text>
            </TouchableOpacity>

            {/* 계정 삭제 링크 */}
            <TouchableOpacity 
              style={styles.deleteAccountLink}
              onPress={() => router.push("/(auth)/delete-account" as any)}
              activeOpacity={0.7}
              disabled={isProfileLoading}
            >
              <Text style={styles.deleteAccountLinkText}>계정 삭제</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 30,
    textAlign: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  statusLabel: {
    fontSize: 16,
    color: "#666",
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusBadgeActive: {
    backgroundColor: "#4CAF50",
  },
  statusBadgeInactive: {
    backgroundColor: "#E0E0E0",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusTextActive: {
    color: "#fff",
  },
  statusTextInactive: {
    color: "#666",
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  loginButton: {
    backgroundColor: "#4285F4",
  },
  testButton: {
    backgroundColor: "#34A853",
  },
  logoutButton: {
    backgroundColor: "#EA4335",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoContainer: {
    marginTop: 40,
    padding: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    backgroundColor: "#f7f7f7",
  },
  content: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  loader: {
    marginTop: 100,
  },
  accountSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 20,
    fontFamily: 'KotraHope',
  },
  accountInfo: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoRowFirst: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 16,
    color: "#6b7280",
    fontFamily: 'KotraHope',
  },
  infoValue: {
    fontSize: 16,
    color: "#0f172a",
    fontWeight: "600",
    fontFamily: 'KotraHope',
  },
  logoutButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
    minHeight: 50,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: 'KotraHope',
  },
  deleteAccountLink: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  deleteAccountLinkText: {
    color: "#FF3B30",
    fontSize: 16,
    textDecorationLine: "underline",
    fontFamily: 'KotraHope',
  },
});
