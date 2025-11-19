//설정 화면
import { useState, useEffect } from "react";
import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import HomeButton from "../../components/HomeButton";
import GoogleFitManager from "../../utils/GoogleFitManager";

export default function SettingsScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Google Fit 인증 요청 생성
  const [request, response, promptAsync] = GoogleFitManager.createAuthRequest();

  // 인증 상태 확인
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 인증 응답 처리
  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      if (authentication?.accessToken) {
        handleAuthSuccess(authentication.accessToken);
      }
    } else if (response?.type === "error") {
      console.error("Google Fit 인증 에러:", response.error);
      Alert.alert("인증 실패", "Google Fit 인증에 실패했습니다.");
      setIsLoading(false);
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

  const handleAuthSuccess = async (accessToken: string) => {
    try {
      await GoogleFitManager.saveToken(accessToken);
      setIsAuthenticated(true);
      Alert.alert("성공", "Google Fit 인증이 완료되었습니다.");
    } catch (error) {
      console.error("토큰 저장 실패:", error);
      Alert.alert("오류", "토큰 저장에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!request) {
      Alert.alert("알림", "Google Fit 인증을 준비하는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      await promptAsync();
    } catch (error) {
      console.error("Google Fit 로그인 요청 실패:", error);
      Alert.alert("오류", "Google Fit 로그인 중 문제가 발생했습니다.");
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await GoogleFitManager.clearToken();
      setIsAuthenticated(false);
      Alert.alert("완료", "Google Fit 인증이 해제되었습니다.");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      Alert.alert("오류", "로그아웃 중 문제가 발생했습니다.");
    }
  };

  const handleTestConnection = async () => {
    if (!isAuthenticated) {
      Alert.alert("알림", "먼저 Google Fit에 로그인해주세요.");
      return;
    }

    setIsLoading(true);
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
      setIsLoading(false);
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
            style={[styles.button, styles.loginButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={!request || isLoading}
          >
            {isLoading ? (
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
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>연결 테스트</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.logoutButton]}
              onPress={handleLogout}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>로그아웃</Text>
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
  },
});
