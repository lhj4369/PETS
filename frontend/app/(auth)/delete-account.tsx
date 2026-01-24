import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import Navigator from "../../components/Navigator";
import AuthManager from "../../utils/AuthManager";
import API_BASE_URL from "../../config/api";

export default function DeleteAccountScreen() {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    // 최종 확인
    Alert.alert(
      "계정 삭제 확인",
      "정말로 계정을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다.",
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              const headers = await AuthManager.getAuthHeader();
              
              if (!headers.Authorization) {
                Alert.alert("오류", "로그인이 필요합니다.");
                router.replace("/(auth)/login" as any);
                return;
              }

              const response = await fetch(`${API_BASE_URL}/api/auth/delete-account`, {
                method: "DELETE",
                headers,
              });

              const data = await response.json();

              if (!response.ok) {
                Alert.alert("오류", data?.error ?? "계정 삭제에 실패했습니다.");
                setIsDeleting(false);
                return;
              }

              // 로그아웃 처리
              await AuthManager.logout();
              
              Alert.alert(
                "계정 삭제 완료",
                "계정이 성공적으로 삭제되었습니다.\n\n법적 요구사항에 따라 일부 데이터는 30일간 보관될 수 있습니다.",
                [
                  {
                    text: "확인",
                    onPress: () => {
                      router.replace("/(auth)/login" as any);
                    },
                  },
                ]
              );
            } catch (error) {
              console.error("계정 삭제 요청 실패:", error);
              Alert.alert("오류", "계정 삭제 중 문제가 발생했습니다. 네트워크 상태를 확인해주세요.");
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <Navigator />
      <View style={styles.container}>
        <Text style={styles.title}>계정 삭제</Text>
        <Text style={styles.appName}>PETS</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정 삭제 방법</Text>
          <Text style={styles.stepText}>
            <Text style={styles.stepNumber}>1. </Text>
            아래 "계정 삭제" 버튼을 클릭하세요.
          </Text>
          <Text style={styles.stepText}>
            <Text style={styles.stepNumber}>2. </Text>
            확인 대화상자에서 "삭제"를 선택하세요.
          </Text>
          <Text style={styles.stepText}>
            <Text style={styles.stepNumber}>3. </Text>
            계정과 모든 데이터가 영구적으로 삭제됩니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>삭제되는 데이터</Text>
          <View style={styles.dataList}>
            <Text style={styles.dataItem}>• 계정 정보 (이메일, 이름, 닉네임)</Text>
            <Text style={styles.dataItem}>• 운동 기록 (타이머 기록, 운동 세트)</Text>
            <Text style={styles.dataItem}>• 성취 및 도전 과제</Text>
            <Text style={styles.dataItem}>• 랭킹 데이터</Text>
            <Text style={styles.dataItem}>• 채팅 기록</Text>
            <Text style={styles.dataItem}>• Google Fit 연동 정보</Text>
            <Text style={styles.dataItem}>• 앱 설정 및 사용자 지정 데이터</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>보관되는 데이터</Text>
          <Text style={styles.warningText}>
            법적 요구사항 및 분쟁 해결을 위해 다음 데이터는 삭제 요청 후 30일간 보관됩니다:
          </Text>
          <View style={styles.dataList}>
            <Text style={styles.dataItem}>• 계정 생성 및 삭제 로그</Text>
            <Text style={styles.dataItem}>• 결제 관련 기록 (해당되는 경우)</Text>
            <Text style={styles.dataItem}>• 법적 분쟁 관련 데이터</Text>
          </View>
          <Text style={styles.warningText}>
            보관 기간 종료 후 위 데이터도 영구적으로 삭제됩니다.
          </Text>
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ 주의사항</Text>
          <Text style={styles.warningContent}>
            • 계정 삭제는 되돌릴 수 없습니다.{"\n"}
            • 모든 운동 기록과 데이터가 영구적으로 삭제됩니다.{"\n"}
            • Google Fit 연동 정보도 함께 삭제됩니다.{"\n"}
            • 삭제 후 동일한 이메일로 재가입이 가능합니다.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
          onPress={handleDeleteAccount}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.deleteButtonText}>계정 삭제</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={isDeleting}
        >
          <Text style={styles.cancelButtonText}>취소</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
    fontFamily: 'KotraHope',
  },
  appName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 32,
    textAlign: "center",
    fontFamily: 'KotraHope',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    fontFamily: 'KotraHope',
  },
  stepText: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    marginBottom: 8,
    fontFamily: 'KotraHope',
  },
  stepNumber: {
    fontWeight: "bold",
    color: "#007AFF",
  },
  dataList: {
    marginTop: 8,
    marginBottom: 8,
  },
  dataItem: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
    marginBottom: 6,
    fontFamily: 'KotraHope',
  },
  warningText: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
    marginBottom: 12,
    fontFamily: 'KotraHope',
  },
  warningBox: {
    backgroundColor: "#FFF3CD",
    borderColor: "#FFC107",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 8,
    fontFamily: 'KotraHope',
  },
  warningContent: {
    fontSize: 15,
    color: "#856404",
    lineHeight: 22,
    fontFamily: 'KotraHope',
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: 'KotraHope',
  },
  cancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: 'KotraHope',
  },
});
