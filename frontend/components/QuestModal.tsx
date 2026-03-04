import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  useWindowDimensions,
} from "react-native";
import AuthManager from "../utils/AuthManager";
import API_BASE_URL from "../config/api";
import { APP_COLORS } from "../constants/theme";

type QuestType = "daily" | "weekly" | "challenge";

interface Quest {
  id: number;
  name: string;
  description: string;
  questType: QuestType;
  conditionType: string;
  conditionValue: number;
  displayName: string;
  displayDescription: string;
  rewardType: string;
  rewardValue: string;
  rewardAmount: number;
  icon: string;
  isRepeatable: boolean;
  progressValue: number;
  isCompleted: boolean;
  isClaimed: boolean;
  completedAt: string | null;
  currentTier: number;
}

const REWARD_LABELS: Record<string, string> = {
  stamina: "지구력",
  strength: "힘",
  agility: "민첩",
  concentration: "집중력",
  all_stats: "올스텟",
  protein_small: "프로틴 1통",
  protein_big: "프로틴 1포대",
  crown: "왕관",
  muscle_suit: "근육맨 슈트",
  red_hairband: "빨간 머리띠",
  city_1: "도시 배경",
  fall: "석양 배경",
  healthclub: "헬스장 배경",
  animal_change: "동물 변환",
};

const REWARD_IMAGES: Record<string, any> = {
  protein_small: require("../assets/images/item/small_protein.png"),
  protein_big: require("../assets/images/item/big_protein.png"),
  crown: require("../assets/images/accessory/crown.png"),
  muscle_suit: require("../assets/images/accessory/muscle_suit.png"),
  red_hairband: require("../assets/images/accessory/red_hairband.png"),
  city_1: require("../assets/images/background/city-1.png"),
  fall: require("../assets/images/background/fall.png"),
  healthclub: require("../assets/images/background/healthclub.png"),
};

interface QuestModalProps {
  visible: boolean;
  onClose: () => void;
  onProfileRefresh?: () => void;
}

export default function QuestModal({ visible, onClose, onProfileRefresh }: QuestModalProps) {
  const [activeTab, setActiveTab] = useState<QuestType>("daily");
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { width } = useWindowDimensions();

  const fetchQuests = useCallback(async () => {
    if (!visible) return;
    setIsLoading(true);
    try {
      const headers = await AuthManager.getAuthHeader();
      if (!headers.Authorization) return;

      await fetch(`${API_BASE_URL}/api/quests/check`, { method: "POST", headers });
      const res = await fetch(`${API_BASE_URL}/api/quests`, { headers });
      if (!res.ok) throw new Error("퀘스트 조회 실패");
      const data = await res.json();
      setQuests(data.quests || []);
    } catch (e) {
      console.error("퀘스트 로드 실패:", e);
    } finally {
      setIsLoading(false);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) fetchQuests();
  }, [visible, fetchQuests]);

  const filteredQuests = quests.filter((q) => q.questType === activeTab);

  const claimReward = async (quest: Quest) => {
    try {
      const headers = await AuthManager.getAuthHeader();
      if (!headers.Authorization) {
        Alert.alert("오류", "인증이 필요합니다.");
        return;
      }
      const res = await fetch(`${API_BASE_URL}/api/quests/${quest.id}/claim`, {
        method: "POST",
        headers,
      });
      if (!res.ok) {
        const err = await res.json();
        Alert.alert("오류", err?.error ?? "보상 수령 실패");
        return;
      }
      await fetchQuests();
      onProfileRefresh?.();
      Alert.alert("완료", "보상을 수령했습니다!");
    } catch (e) {
      console.error("보상 수령 실패:", e);
      Alert.alert("오류", "보상 수령 중 문제가 발생했습니다.");
    }
  };

  const getRewardDisplay = (q: Quest) => {
    if (q.rewardType === "stat") {
      const label = REWARD_LABELS[q.rewardValue] || q.rewardValue;
      return `+${q.rewardAmount} ${label}`;
    }
    if (q.rewardType === "item" || q.rewardType === "accessory" || q.rewardType === "background") {
      return REWARD_LABELS[q.rewardValue] || q.rewardValue;
    }
    return REWARD_LABELS[q.rewardValue] || q.rewardValue;
  };

  const getRewardImage = (q: Quest) => {
    const img = REWARD_IMAGES[q.rewardValue];
    if (img)
      return (
        <View style={styles.rewardImageWrap}>
          <Image source={img} style={styles.rewardImage} resizeMode="cover" />
        </View>
      );
    return <Text style={styles.rewardLabel}>{getRewardDisplay(q)}</Text>;
  };

  const modalWidth = Math.min(width - 40, 360);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={[styles.modal, { width: modalWidth }]}>
          <View style={styles.header}>
            <Text style={styles.title}>퀘스트</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabRow}>
            {(["daily", "weekly", "challenge"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === "daily" ? "일일" : tab === "weekly" ? "주간" : "도전과제"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={APP_COLORS.yellowDark} />
              <Text style={styles.loadingText}>퀘스트를 불러오는 중...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {filteredQuests.length === 0 ? (
                <Text style={styles.emptyText}>퀘스트가 없습니다.</Text>
              ) : (
                filteredQuests.map((q) => (
                  <View
                    key={q.id}
                    style={[styles.questCard, q.isClaimed && styles.questCardDone]}
                  >
                    <View style={styles.questBody}>
                      <Text style={styles.questName}>{q.displayName}</Text>
                      <Text style={styles.questDesc}>{q.displayDescription}</Text>
                      {!q.isRepeatable && (q.conditionType.includes("min") || q.conditionType.includes("count") || q.conditionType.includes("attendance")) && (
                        <Text style={styles.progressText}>
                          {q.progressValue} / {q.conditionValue}
                        </Text>
                      )}
                    </View>
                    <View style={styles.rewardCol}>
                      <View style={styles.rewardBox}>
                        {q.rewardType === "stat" ? (
                          <Text style={styles.rewardLabel}>{getRewardDisplay(q)}</Text>
                        ) : (
                          getRewardImage(q)
                        )}
                      </View>
                      {q.isCompleted && !q.isClaimed && (
                        <TouchableOpacity style={styles.claimBtn} onPress={() => claimReward(q)}>
                          <Text style={styles.claimBtnText}>보상 받기</Text>
                        </TouchableOpacity>
                      )}
                      {q.isClaimed && (
                        <View style={styles.doneBadge}>
                          <Text style={styles.doneText}>완료</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: APP_COLORS.ivory,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: APP_COLORS.yellow,
    maxHeight: "80%",
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
    fontSize: 24,
    fontWeight: "bold",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    fontSize: 20,
    color: APP_COLORS.brown,
    fontWeight: "600",
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: APP_COLORS.ivoryDark,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: APP_COLORS.yellow,
  },
  tabText: {
    fontSize: 16,
    color: APP_COLORS.brownLight,
    fontFamily: "KotraHope",
  },
  tabTextActive: {
    color: APP_COLORS.brown,
    fontWeight: "bold",
  },
  loadingBox: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  scroll: {
    maxHeight: 320,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 24,
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: 40,
    fontSize: 18,
    color: APP_COLORS.brownLight,
    fontFamily: "KotraHope",
  },
  questCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.ivoryDark,
    alignItems: "center",
  },
  questCardDone: {
    backgroundColor: "#F0F8E8",
    borderColor: APP_COLORS.yellow,
  },
  questBody: {
    flex: 1,
  },
  questName: {
    fontSize: 16,
    fontWeight: "bold",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  questDesc: {
    fontSize: 14,
    color: APP_COLORS.brownLight,
    marginTop: 2,
    fontFamily: "KotraHope",
  },
  progressText: {
    fontSize: 12,
    color: APP_COLORS.yellowDark,
    marginTop: 4,
    fontFamily: "KotraHope",
  },
  rewardCol: {
    alignItems: "center",
    minWidth: 80,
  },
  rewardBox: {
    backgroundColor: APP_COLORS.yellow,
    borderRadius: 10,
    padding: 4,
    marginBottom: 6,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  rewardLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
    textAlign: "center",
  },
  rewardImageWrap: {
    width: 48,
    height: 48,
    borderRadius: 6,
    overflow: "hidden",
  },
  rewardImage: {
    width: 48,
    height: 48,
  },
  claimBtn: {
    backgroundColor: APP_COLORS.yellowDark,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  claimBtnText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFF",
    fontFamily: "KotraHope",
  },
  doneBadge: {
    backgroundColor: APP_COLORS.yellowDark,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  doneText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFF",
    fontFamily: "KotraHope",
  },
});
