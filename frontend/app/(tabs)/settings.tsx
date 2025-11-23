//설정 화면
import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import * as Google from "expo-auth-session/providers/google";
import HomeButton from "../../components/HomeButton";
import AuthManager from "../../utils/AuthManager";
import GoogleFitManager from "../../utils/GoogleFitManager";
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
  const [nickname, setNickname] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Google Fit 인증 관련 state
  const [isGoogleFitAuthenticated, setIsGoogleFitAuthenticated] = useState(false);
  const [isGoogleFitLoading, setIsGoogleFitLoading] = useState(false);
  const [isCheckingGoogleFit, setIsCheckingGoogleFit] = useState(true);

  // Google Fit 인증 요청 생성
  const [googleFitRequest, googleFitResponse, googleFitPromptAsync] = GoogleFitManager.createAuthRequest();

  // Google Fit 인증 상태 확인
  useEffect(() => {
    const checkGoogleFitAuth = async () => {
      setIsCheckingGoogleFit(true);
      try {
        const authenticated = await GoogleFitManager.isAuthenticated();
        setIsGoogleFitAuthenticated(authenticated);
      } catch (error) {
        console.error("Google Fit 인증 상태 확인 실패:", error);
      } finally {
        setIsCheckingGoogleFit(false);
      }
    };
    checkGoogleFitAuth();
  }, []);

  // Google Fit 인증 응답 처리
  useEffect(() => {
    if (googleFitResponse?.type === "success") {
      const { authentication } = googleFitResponse;
      if (authentication?.accessToken) {
        handleGoogleFitAuthSuccess(authentication.accessToken);
      }
    } else if (googleFitResponse?.type === "error") {
      console.error("Google Fit 인증 에러:", googleFitResponse.error);
      Alert.alert("인증 실패", "Google Fit 인증에 실패했습니다.");
      setIsGoogleFitLoading(false);
    }
  }, [googleFitResponse]);

  const handleGoogleFitAuthSuccess = async (accessToken: string) => {
    try {
      await GoogleFitManager.saveToken(accessToken);
      setIsGoogleFitAuthenticated(true);
      Alert.alert("성공", "Google Fit 인증이 완료되었습니다.");
    } catch (error) {
      console.error("토큰 저장 실패:", error);
      Alert.alert("오류", "토큰 저장에 실패했습니다.");
    } finally {
      setIsGoogleFitLoading(false);
    }
  };

  const handleGoogleFitLogin = async () => {
    if (!googleFitRequest) {
      Alert.alert("알림", "Google Fit 인증을 준비하는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setIsGoogleFitLoading(true);
    try {
      await googleFitPromptAsync();
    } catch (error) {
      console.error("Google Fit 로그인 요청 실패:", error);
      Alert.alert("오류", "Google Fit 로그인 중 문제가 발생했습니다.");
      setIsGoogleFitLoading(false);
    }
  };

  const handleGoogleFitLogout = async () => {
    try {
      await GoogleFitManager.clearToken();
      setIsGoogleFitAuthenticated(false);
      Alert.alert("완료", "Google Fit 인증이 해제되었습니다.");
    } catch (error) {
      console.error("Google Fit 로그아웃 실패:", error);
      Alert.alert("오류", "로그아웃 중 문제가 발생했습니다.");
    }
  };

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
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
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const handleLogout = async () => {
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

  if (isCheckingGoogleFit) {
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
        {isLoading ? (
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

            {/* Google Fit 인증 섹션 */}
            <View style={styles.googleFitSection}>
              <Text style={styles.sectionTitle}>Google Fit</Text>
              <View style={styles.googleFitInfo}>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>인증 상태:</Text>
                  <View style={[styles.statusBadge, isGoogleFitAuthenticated ? styles.statusBadgeActive : styles.statusBadgeInactive]}>
                    <Text style={[styles.statusText, isGoogleFitAuthenticated ? styles.statusTextActive : styles.statusTextInactive]}>
                      {isGoogleFitAuthenticated ? "인증됨" : "미인증"}
                    </Text>
                  </View>
                </View>
                
                {!isGoogleFitAuthenticated ? (
                  <TouchableOpacity
                    style={[styles.googleFitButton, styles.googleFitLoginButton, isGoogleFitLoading && styles.buttonDisabled]}
                    onPress={handleGoogleFitLogin}
                    disabled={!googleFitRequest || isGoogleFitLoading}
                  >
                    {isGoogleFitLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.googleFitButtonText}>Google Fit 로그인</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.googleFitButton, styles.googleFitLogoutButton]}
                    onPress={handleGoogleFitLogout}
                    disabled={isGoogleFitLoading}
                  >
                    <Text style={styles.googleFitButtonText}>Google Fit 로그아웃</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* 앱 로그아웃 버튼 */}
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={handleLogout}
              activeOpacity={0.7}
              disabled={isLoading}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              accessibilityRole="button"
              accessibilityLabel="로그아웃"
            >
              <Text style={styles.logoutButtonText}>로그아웃</Text>
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
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  loader: {
    marginTop: 100,
  },
  accountSection: {
    marginBottom: 30,
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
  googleFitSection: {
    marginBottom: 30,
  },
  googleFitInfo: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 16,
    color: "#6b7280",
    fontFamily: 'KotraHope',
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
  googleFitButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  googleFitLoginButton: {
    backgroundColor: "#4285F4",
  },
  googleFitLogoutButton: {
    backgroundColor: "#EA4335",
  },
  googleFitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: 'KotraHope',
  },
  buttonDisabled: {
    opacity: 0.6,
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
});
