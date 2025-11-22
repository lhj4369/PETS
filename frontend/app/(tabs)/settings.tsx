//설정 화면
import { View, Text, SafeAreaView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import HomeButton from "../../components/HomeButton";
import AuthManager from "../../utils/AuthManager";

export default function SettingsScreen() {
  const handleLogout = async () => {
    console.log("로그아웃 버튼 클릭됨");
    
    Alert.alert(
      "로그아웃",
      "정말 로그아웃 하시겠습니까?",
      [
        {
          text: "취소",
          style: "cancel",
          onPress: () => {
            console.log("로그아웃 취소됨");
          },
        },
        {
          text: "로그아웃",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("로그아웃 프로세스 시작...");
              
              // 로그아웃 처리
              await AuthManager.logout();
              console.log("AuthManager.logout() 완료");
              
              // 로그인 화면으로 이동 - expo-router는 탭에서 auth로 직접 이동 가능
              console.log("화면 이동 시작...");
              router.replace("/(auth)/login" as any);
              
            } catch (error) {
              console.error("로그아웃 실패:", error);
              const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
              Alert.alert("오류", "로그아웃 중 문제가 발생했습니다: " + errorMessage);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <HomeButton />
      <View style={styles.content}>
        <Text style={styles.title}>설정 화면</Text>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 40,
    fontFamily: 'KotraHope',
  },
  logoutButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 200,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: 'KotraHope',
  },
});
