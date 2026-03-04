import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import * as Google from "expo-auth-session/providers/google";
import AuthManager from "../utils/AuthManager";
import GoogleFitManager from "../utils/GoogleFitManager";
import API_BASE_URL from "../config/api";
import { deleteAccount } from "../api/auth";
import { APP_COLORS } from "../constants/theme";
import { useSettingsModal } from "../context/SettingsModalContext";

type ProfileResponse = {
  account?: { id: number; name: string; email: string } | null;
  profile?: { nickname: string | null } | null;
};

export default function SettingsModal() {
  const { isOpen, closeSettings } = useSettingsModal();
  const { width } = useWindowDimensions();
  const modalWidth = Math.min(width - 40, 360);

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isGoogleFitAuthenticated, setIsGoogleFitAuthenticated] = useState(false);
  const [isGoogleFitLoading, setIsGoogleFitLoading] = useState(false);
  const [isCheckingGoogleFit, setIsCheckingGoogleFit] = useState(true);

  const [googleFitRequest, googleFitResponse, googleFitPromptAsync] = GoogleFitManager.createAuthRequest();

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const headers = await AuthManager.getAuthHeader();
      if (!headers.Authorization) {
        router.replace("/" as any);
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, { headers });
      if (res.status === 401) {
        await AuthManager.logout();
        router.replace("/" as any);
        return;
      }
      if (!res.ok) throw new Error("사용자 정보를 불러오지 못했습니다.");
      const data = (await res.json()) as ProfileResponse;
      setNickname(data.profile?.nickname ?? "");
      setEmail(data.account?.email ?? "");
    } catch {
      Alert.alert("오류", "사용자 정보를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const check = async () => {
      setIsCheckingGoogleFit(true);
      try {
        setIsGoogleFitAuthenticated(await GoogleFitManager.isAuthenticated());
      } catch {
        // ignore
      } finally {
        setIsCheckingGoogleFit(false);
      }
    };
    check();
  }, [isOpen]);

  useEffect(() => {
    const accessToken = googleFitResponse?.type === "success" ? googleFitResponse.authentication?.accessToken : null;
    if (accessToken) {
      (async () => {
        try {
          await GoogleFitManager.saveToken(accessToken);
          setIsGoogleFitAuthenticated(true);
          Alert.alert("성공", "Google Fit 인증이 완료되었습니다.");
        } catch {
          Alert.alert("오류", "토큰 저장에 실패했습니다.");
        } finally {
          setIsGoogleFitLoading(false);
        }
      })();
    } else if (googleFitResponse?.type === "error") {
      Alert.alert("인증 실패", "Google Fit 인증에 실패했습니다.");
      setIsGoogleFitLoading(false);
    }
  }, [googleFitResponse]);

  useEffect(() => {
    if (isOpen) fetchProfile();
  }, [isOpen]);

  const handleClose = () => closeSettings();

  const handleGoogleFitLogin = async () => {
    if (!googleFitRequest) {
      Alert.alert("알림", "Google Fit 인증을 준비하는 중입니다.");
      return;
    }
    setIsGoogleFitLoading(true);
    try {
      await googleFitPromptAsync();
    } catch {
      Alert.alert("오류", "Google Fit 로그인 중 문제가 발생했습니다.");
      setIsGoogleFitLoading(false);
    }
  };

  const handleGoogleFitLogout = async () => {
    try {
      await GoogleFitManager.clearToken();
      setIsGoogleFitAuthenticated(false);
      Alert.alert("완료", "Google Fit 인증이 해제되었습니다.");
    } catch {
      Alert.alert("오류", "로그아웃 중 문제가 발생했습니다.");
    }
  };

  const handleLogout = async () => {
    try {
      await AuthManager.logout();
      handleClose();
      router.replace("/" as any);
    } catch (e) {
      Alert.alert("오류", e instanceof Error ? e.message : "로그아웃 중 문제가 발생했습니다.");
    }
  };

  const handleWithdrawConfirm = async () => {
    setIsWithdrawing(true);
    try {
      const headers = await AuthManager.getAuthHeader();
      if (!headers.Authorization) {
        router.replace("/" as any);
        return;
      }
      await deleteAccount(headers);
      await AuthManager.logout();
      setShowWithdrawModal(false);
      handleClose();
      router.replace("/" as any);
    } catch (e) {
      Alert.alert("오류", e instanceof Error ? e.message : "회원 탈퇴 중 문제가 발생했습니다.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={[styles.modal, { width: modalWidth }]}
        >
          <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>설정</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={16}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isLoading || isCheckingGoogleFit ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="large" color={APP_COLORS.yellow} />
              </View>
            ) : (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>내 계정</Text>
                  <View style={styles.infoCard}>
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

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Google Fit</Text>
                  <View style={styles.infoCard}>
                    <View style={styles.statusRow}>
                      <Text style={styles.infoLabel}>인증 상태</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          isGoogleFitAuthenticated ? styles.statusBadgeActive : styles.statusBadgeInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            isGoogleFitAuthenticated ? styles.statusTextActive : styles.statusTextInactive,
                          ]}
                        >
                          {isGoogleFitAuthenticated ? "인증됨" : "미인증"}
                        </Text>
                      </View>
                    </View>
                    {!isGoogleFitAuthenticated ? (
                      <TouchableOpacity
                        style={[styles.primaryButton, isGoogleFitLoading && styles.buttonDisabled]}
                        onPress={handleGoogleFitLogin}
                        disabled={!googleFitRequest || isGoogleFitLoading}
                      >
                        {isGoogleFitLoading ? (
                          <ActivityIndicator color={APP_COLORS.brown} />
                        ) : (
                          <Text style={styles.primaryButtonText}>Google Fit 로그인</Text>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={handleGoogleFitLogout}
                        disabled={isGoogleFitLoading}
                      >
                        <Text style={styles.secondaryButtonText}>Google Fit 로그아웃</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
                  <Text style={styles.logoutButtonText}>로그아웃</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.withdrawButton}
                  onPress={() => setShowWithdrawModal(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.withdrawButtonText}>회원 탈퇴</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* 회원 탈퇴 확인 모달 */}
      <Modal
        visible={showWithdrawModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isWithdrawing && setShowWithdrawModal(false)}
      >
        <TouchableOpacity
          style={styles.withdrawModalBackdrop}
          activeOpacity={1}
          onPress={() => !isWithdrawing && setShowWithdrawModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.withdrawModalContent}
          >
            <Text style={styles.modalTitle}>진짜 사라지는 거야? ㅠㅠ</Text>
            <Text style={styles.modalSubtitle}>확인 버튼을 누를 시 모든 정보가 사라집니다.</Text>
            <Text style={styles.modalWarning}>운동 기록, 업적, 퀘스트 진행 상황 등 복구할 수 없어요.</Text>
            <TouchableOpacity
              style={[styles.modalConfirmBtn, isWithdrawing && styles.buttonDisabled]}
              onPress={handleWithdrawConfirm}
              disabled={isWithdrawing}
            >
              {isWithdrawing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalConfirmText}>확인</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowWithdrawModal(false)}
              disabled={isWithdrawing}
            >
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: APP_COLORS.ivory,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: APP_COLORS.yellow,
    maxHeight: "80%",
    overflow: "hidden",
    shadowColor: APP_COLORS.brown,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: APP_COLORS.yellow,
    borderBottomWidth: 2,
    borderBottomColor: APP_COLORS.yellowDark,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  closeBtn: {
    fontSize: 22,
    color: APP_COLORS.brownLight,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 32 },
  loaderWrap: { paddingVertical: 40, alignItems: "center" },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: APP_COLORS.brown,
    marginBottom: 10,
    fontFamily: "KotraHope",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: APP_COLORS.ivoryDark,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  infoRowFirst: { borderBottomWidth: 1, borderBottomColor: APP_COLORS.ivoryDark },
  infoRowLast: {},
  infoLabel: { fontSize: 14, color: APP_COLORS.brownLight, fontFamily: "KotraHope" },
  infoValue: { fontSize: 14, color: APP_COLORS.brown, fontWeight: "600", fontFamily: "KotraHope" },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  statusBadgeActive: {
    backgroundColor: APP_COLORS.yellow,
    borderWidth: 1,
    borderColor: APP_COLORS.yellowDark,
  },
  statusBadgeInactive: { backgroundColor: APP_COLORS.ivoryDark },
  statusText: { fontSize: 13, fontWeight: "600", fontFamily: "KotraHope" },
  statusTextActive: { color: APP_COLORS.brown },
  statusTextInactive: { color: APP_COLORS.brownLight },
  primaryButton: {
    backgroundColor: APP_COLORS.yellow,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: APP_COLORS.yellowDark,
  },
  primaryButtonText: {
    color: APP_COLORS.brown,
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "KotraHope",
  },
  secondaryButton: {
    backgroundColor: APP_COLORS.ivoryDark,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.brownLight,
  },
  secondaryButtonText: {
    color: APP_COLORS.brown,
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "KotraHope",
  },
  buttonDisabled: { opacity: 0.6 },
  logoutButton: {
    backgroundColor: APP_COLORS.yellow,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 2,
    borderColor: APP_COLORS.yellowDark,
  },
  logoutButtonText: {
    color: APP_COLORS.brown,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "KotraHope",
  },
  withdrawButton: {
    backgroundColor: APP_COLORS.ivoryDark,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.brownLight,
  },
  withdrawButtonText: {
    color: APP_COLORS.brownLight,
    fontSize: 14,
    fontFamily: "KotraHope",
  },
  withdrawModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  withdrawModalContent: {
    backgroundColor: APP_COLORS.ivory,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: APP_COLORS.yellow,
    padding: 24,
    width: "100%",
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: APP_COLORS.brown,
    marginBottom: 10,
    fontFamily: "KotraHope",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 15,
    color: APP_COLORS.brown,
    marginBottom: 6,
    fontFamily: "KotraHope",
    textAlign: "center",
    lineHeight: 22,
  },
  modalWarning: {
    fontSize: 13,
    color: APP_COLORS.brownLight,
    marginBottom: 18,
    fontFamily: "KotraHope",
    textAlign: "center",
    lineHeight: 20,
  },
  modalConfirmBtn: {
    backgroundColor: "#E53935",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalConfirmText: { color: "#fff", fontSize: 15, fontWeight: "700", fontFamily: "KotraHope" },
  modalCancelBtn: {
    marginTop: 10,
    backgroundColor: APP_COLORS.ivoryDark,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: APP_COLORS.brownLight,
  },
  modalCancelText: { color: APP_COLORS.brown, fontSize: 15, fontFamily: "KotraHope" },
});
