import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, SafeAreaView, ActivityIndicator, ScrollView } from "react-native";
import { useState, useEffect, useMemo } from "react";
import { router } from "expo-router";
import Header from "../../components/Header";
import Navigator from "../../components/Navigator";
import AuthManager from "../../utils/AuthManager";
import API_BASE_URL from "../../config/api";

export default function HomeScreen() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAnimalModal, setShowAnimalModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [nickname, setNickname] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [selectedAnimal, setSelectedAnimal] = useState<string | null>(null);
  const [pendingAnimal, setPendingAnimal] = useState<string | null>(null);
  const [showAnimalConfirm, setShowAnimalConfirm] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [accountName, setAccountName] = useState<string>("");

  const animalOptions = useMemo(
    () => [
      { id: "capybara", label: "카피바라", emoji: "🦫" },
      { id: "fox", label: "여우", emoji: "🦊" },
      { id: "red_panda", label: "레서판다", emoji: "🦝" },
      { id: "guinea_pig", label: "기니피그", emoji: "🐹" },
    ],
    []
  );

  const currentAnimal = useMemo(
    () => animalOptions.find((animal) => animal.id === selectedAnimal),
    [animalOptions, selectedAnimal]
  );

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const headers = await AuthManager.getAuthHeader();
        if (!headers.Authorization) {
          router.replace("/(auth)/login" as any);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers,
        });

        if (response.status === 401) {
          await AuthManager.logout();
          router.replace("/(auth)/login" as any);
          return;
        }

        if (!response.ok) {
          throw new Error("사용자 정보를 불러오지 못했습니다.");
        }

        const data = await response.json();

        setAccountName(data?.account?.name ?? "");

        if (data?.profile) {
          setNickname(data.profile.nickname ?? "");
          setHeight(
            data.profile.height !== null && data.profile.height !== undefined
              ? String(data.profile.height)
              : ""
          );
          setWeight(
            data.profile.weight !== null && data.profile.weight !== undefined
              ? String(data.profile.weight)
              : ""
          );
          setSelectedAnimal(data.profile.animalType ?? null);
          setShowAnimalModal(false);
          setShowProfileModal(false);
        } else {
          setSelectedAnimal(null);
          setNickname("");
          setHeight("");
          setWeight("");
          setShowAnimalModal(true);
          setShowProfileModal(false);
        }
      } catch (error) {
        console.error("프로필 불러오기 실패:", error);
        Alert.alert("오류", "사용자 정보를 불러오지 못했습니다.");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navigateToScreen = (screen: string) => {
    setIsMenuOpen(false);
    router.push(`/(tabs)/${screen}` as any);
  };

  const navigateToTimer = () => {
    router.push("/(tabs)/timer" as any);
  };

  const navigateToChatting = () => {
    router.push("/(tabs)/chatting" as any);
  };

  const handleSaveUserInfo = async () => {
    if (!selectedAnimal) {
      Alert.alert("알림", "함께할 동물을 선택해주세요.");
      return;
    }

    if (!nickname.trim() || !height.trim() || !weight.trim()) {
      Alert.alert("알림", "모든 정보를 입력해주세요.");
      return;
    }

    const headers = await AuthManager.getAuthHeader();
    if (!headers.Authorization) {
      router.replace("/(auth)/login" as any);
      return;
    }

    const payload = {
      animalType: selectedAnimal,
      nickname,
      height: height ? Number(height) : null,
      weight: weight ? Number(weight) : null,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        Alert.alert("오류", data?.error ?? "프로필 저장에 실패했습니다.");
        return;
      }

      Alert.alert("완료", "프로필이 저장되었습니다.");
      setShowProfileModal(false);
    } catch (error) {
      console.error("프로필 저장 실패:", error);
      Alert.alert("오류", "프로필 저장 중 문제가 발생했습니다.");
    }
  };

  const handleEditProfile = () => {
    setShowProfileModal(true);
  };

  const handleSelectAnimal = (animalId: string) => {
    setPendingAnimal(animalId);
    setShowAnimalConfirm(true);
  };

  const confirmAnimalSelection = () => {
    if (!pendingAnimal) {
      return;
    }
    setSelectedAnimal(pendingAnimal);
    setPendingAnimal(null);
    setShowAnimalConfirm(false);
    setShowAnimalModal(false);
    setShowProfileModal(true);
  };

  const cancelAnimalSelection = () => {
    setPendingAnimal(null);
    setShowAnimalConfirm(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {isLoadingProfile && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
      {/* 우측 상단 메뉴 버튼 */}
      <Header showBackButton={false} showMenuButton={true} menuType="home" />
      <Navigator />
      {/* 메인 컨텐츠 */}
      <View style={styles.mainContent}>
        {/* 동물 이미지 영역 */}
        <View style={styles.petContainer}>
          {/* 상태창 - 동물 이미지 바로 위에 직사각형 */}
          <View style={styles.statusBar}>
            <Text style={styles.petName}>
              {nickname || accountName || "PETS"}
            </Text>
            <Text style={styles.statusText}>레벨 5 | 경험치 120/200</Text>
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={handleEditProfile}
            >
              <Text style={styles.editProfileText}>프로필 수정</Text>
            </TouchableOpacity>
            
            {/* 스탯들 */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>힘</Text>
                <Text style={styles.statValue}>85</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>민첩</Text>
                <Text style={styles.statValue}>72</Text>
              </View>              
            </View>
          </View>
          
          <TouchableOpacity style={styles.petImage} onPress={navigateToChatting}>
            <Text style={styles.petImageText}>
              {currentAnimal?.emoji ?? "🐾"}
            </Text>
            <Text style={styles.petImageLabel}>
              {currentAnimal?.label ?? "동물 선택 필요"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 타이머 버튼들 */}
        <View style={styles.timerButtons}>
          <TouchableOpacity style={styles.timerButton} onPress={navigateToTimer}>
            <Text style={styles.timerButtonText}>타이머</Text>
          </TouchableOpacity>          
        </View>

      </View>      
       

      {/* 동물 선택 모달 */}
      <Modal
        visible={showAnimalModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlayUserInfo}>
          <View style={styles.animalModal}>
            <Text style={styles.animalModalTitle}>함께할 동물을 골라주세요</Text>
            <Text style={styles.animalModalSubtitle}>
              선택한 동물은 특정 도전 과제를 완료하기 전까지 변경할 수 없어요.
            </Text>

            <View style={styles.animalOptions}>
              {animalOptions.map((animal) => {
                const isSelected =
                  pendingAnimal === animal.id || selectedAnimal === animal.id;
                return (
                  <TouchableOpacity
                    key={animal.id}
                    style={[
                      styles.animalOption,
                      isSelected && styles.animalOptionSelected,
                    ]}
                    onPress={() => handleSelectAnimal(animal.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.animalEmoji}>{animal.emoji}</Text>
                    <Text style={styles.animalLabel}>{animal.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {showAnimalConfirm && pendingAnimal && (
              <View style={styles.animalConfirmBox}>
                <Text style={styles.animalConfirmTitle}>이 동물과 함께할까요?</Text>
                <Text style={styles.animalConfirmSubtitle}>
                  특정 도전 과제를 완료하기 전까지 변경할 수 없어요.
                </Text>
                <View style={styles.animalConfirmButtons}>
                  <TouchableOpacity
                    style={[styles.animalConfirmButton, styles.animalConfirmCancel]}
                    onPress={cancelAnimalSelection}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.animalConfirmCancelText}>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.animalConfirmButton, styles.animalConfirmOk]}
                    onPress={confirmAnimalSelection}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.animalConfirmOkText}>확인</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* 프로필 정보 입력 모달 */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlayUserInfo}>
          <ScrollView contentContainerStyle={styles.userInfoScroll}>
            <View style={styles.userInfoModal}>
              <Text style={styles.userInfoTitle}>기본 정보 입력</Text>
              <Text style={styles.userInfoSubtitle}>
                선택한 동물과 함께할 준비가 되었어요. 정보를 입력해주세요.
              </Text>

              {currentAnimal && (
                <View style={styles.selectedAnimalSummary}>
                  <Text style={styles.selectedAnimalEmoji}>
                    {currentAnimal.emoji}
                  </Text>
                  <Text style={styles.selectedAnimalLabel}>
                    {currentAnimal.label}
                  </Text>
                </View>
              )}

              <TextInput
                style={styles.input}
                placeholder="닉네임을 입력하세요"
                value={nickname}
                onChangeText={setNickname}
                placeholderTextColor="#999"
              />

              <TextInput
                style={styles.input}
                placeholder="키(cm)를 입력하세요"
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />

              <TextInput
                style={styles.input}
                placeholder="몸무게(kg)를 입력하세요"
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholderTextColor="#999"
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveUserInfo}
              >
                <Text style={styles.saveButtonText}>저장하기</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
  </SafeAreaView>  

  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  petName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 10,
    width: '100%',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  menuButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  menuIcon: {
    width: 20,
    height: 15,
    justifyContent: 'space-between',
  },
  menuLine: {
    height: 2,
    backgroundColor: '#333',
    borderRadius: 1,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  petContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  petImage: {
    width: 200,
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  petImageText: {
    fontSize: 80,
    marginBottom: 10,
  },
  petImageLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  timerButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  timerButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  floatingMenu: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    width: 250,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  modalOverlayUserInfo: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  userInfoScroll: {
    flexGrow: 1,
    justifyContent: "center",
    width: "100%",
  },
  userInfoModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  animalOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  animalModal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  animalModalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  animalModalSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  animalOption: {
    flexBasis: "48%",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  animalOptionSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#E6F0FF",
  },
  animalEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  animalLabel: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  animalConfirmBox: {
    marginTop: 16,
    backgroundColor: "#F8F9FF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CCD6FF",
  },
  animalConfirmTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F3B73",
    marginBottom: 6,
    textAlign: "center",
  },
  animalConfirmSubtitle: {
    fontSize: 13,
    color: "#4A5A88",
    textAlign: "center",
    marginBottom: 12,
  },
  animalConfirmButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  animalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  animalConfirmCancel: {
    backgroundColor: "#E8ECF8",
  },
  animalConfirmOk: {
    backgroundColor: "#007AFF",
  },
  animalConfirmCancelText: {
    color: "#4A5A88",
    fontSize: 14,
    fontWeight: "600",
  },
  animalConfirmOkText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  userInfoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  userInfoSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  editProfileButton: {
    alignSelf: "center",
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#F0F4FF",
  },
  editProfileText: {
    color: "#007AFF",
    fontSize: 12,
    fontWeight: "600",
  },
  selectedAnimalSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
    backgroundColor: "#F0F4FF",
    borderRadius: 12,
    paddingVertical: 12,
  },
  selectedAnimalEmoji: {
    fontSize: 32,
  },
  selectedAnimalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});

