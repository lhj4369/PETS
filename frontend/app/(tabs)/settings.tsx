//설정 화면
import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import HomeButton from "../../components/HomeButton";
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
  const [nickname, setNickname] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

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

            {/* 로그아웃 버튼 */}
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
});
