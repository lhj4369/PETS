//업적 화면
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import HomeButton from "../../components/HomeButton";
import AuthManager from "../../utils/AuthManager";
import API_BASE_URL from "../../config/api";

interface Achievement {
  id: number;
  name: string;
  description: string;
  category: string;
  conditionType: string;
  conditionValue: number;
  reward: number;
  icon: string;
  isCompleted: boolean;
  isClaimed: boolean;
  completedAt: string | null;
}

const categories = [
  { id: "overview", name: "개요" },
  { id: "exercise", name: "운동" },
  { id: "streak", name: "연속" },
  { id: "level", name: "레벨" },
  { id: "social", name: "소셜" },
  { id: "special", name: "특별" },
];

export default function AchievementScreen() {
  const [selectedCategory, setSelectedCategory] = useState("overview");
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    setIsLoading(true);
    try {
      // 개발자 모드: 로컬 데이터 사용
      if (await AuthManager.isDevMode()) {
        const devAchievements = await AuthManager.getDevAchievements();
        setAchievements(devAchievements);
        setIsLoading(false);
        return;
      }

      const headers = await AuthManager.getAuthHeader();
      if (!headers.Authorization) {
        Alert.alert("오류", "인증이 필요합니다. 다시 로그인해주세요.");
        setIsLoading(false);
        return;
      }

      // 업적 체크 및 조회
      await fetch(`${API_BASE_URL}/api/achievements/check`, {
        method: "POST",
        headers,
      });

      const response = await fetch(`${API_BASE_URL}/api/achievements`, {
        headers,
      });

      if (response.status === 401) {
        await AuthManager.logout();
        Alert.alert("오류", "인증이 만료되었습니다. 다시 로그인해주세요.");
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("업적 정보를 불러오지 못했습니다.");
      }

      const data = await response.json();
      setAchievements(data.achievements || []);
    } catch (error) {
      console.error("업적 불러오기 실패:", error);
      Alert.alert("오류", "업적 정보를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAchievements = selectedCategory === "overview" 
    ? achievements 
    : achievements.filter(achievement => achievement.category === selectedCategory);

  const claimReward = async (achievementId: number) => {
    try {
      // 개발자 모드: 로컬만 업데이트
      if (await AuthManager.isDevMode()) {
        setAchievements(prev => 
          prev.map(achievement => 
            achievement.id === achievementId 
              ? { ...achievement, isClaimed: true }
              : achievement
          )
        );
        return;
      }

      const headers = await AuthManager.getAuthHeader();
      if (!headers.Authorization) {
        Alert.alert("오류", "인증이 필요합니다.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/achievements/${achievementId}/claim`, {
        method: "POST",
        headers,
      });

      if (!response.ok) {
        const data = await response.json();
        Alert.alert("오류", data?.error ?? "보상 수령에 실패했습니다.");
        return;
      }

      const data = await response.json();
      
      // 업적 목록 새로고침
      await fetchAchievements();
      
      Alert.alert("완료", `${data.reward} 경험치를 받았습니다!`);
    } catch (error) {
      console.error("보상 수령 실패:", error);
      Alert.alert("오류", "보상 수령 중 문제가 발생했습니다.");
    }
  };

  const getTotalScore = () => {
    return achievements
      .filter(achievement => achievement.isCompleted)
      .reduce((total, achievement) => total + achievement.reward, 0);
  };

  const getCompletedCount = () => {
    return achievements.filter(achievement => achievement.isCompleted).length;
  };

  const renderAchievement = (achievement: Achievement) => (
    <View
      key={achievement.id}
      style={[
        styles.achievementCard,
        achievement.isCompleted && styles.completedCard,
      ]}
    >
      <View style={styles.achievementIcon}>
        <Text style={styles.iconText}>{achievement.icon}</Text>
      </View>
      
      <View style={styles.achievementContent}>
        <Text style={styles.achievementTitle}>{achievement.name}</Text>
        <Text style={styles.achievementDescription}>{achievement.description}</Text>
        {achievement.completedAt && (
          <Text style={styles.completedDate}>
            완료일: {new Date(achievement.completedAt).toLocaleDateString('ko-KR')}
          </Text>
        )}
      </View>

      <View style={styles.rewardSection}>
        <View style={styles.rewardBadge}>
          <Text style={styles.rewardText}>{achievement.reward}</Text>
        </View>
        
        {achievement.isCompleted && !achievement.isClaimed && (
          <TouchableOpacity
            style={styles.claimButton}
            onPress={() => claimReward(achievement.id)}
          >
            <Text style={styles.claimButtonText}>보상 받기</Text>
          </TouchableOpacity>
        )}
        
        {achievement.isClaimed && (
          <View style={styles.claimedBadge}>
            <Text style={styles.claimedText}>완료</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <HomeButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>업적을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
       <HomeButton />
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>업적</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>달성한 업적</Text>
            <Text style={styles.statValue}>{getCompletedCount()}/{achievements.length}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>업적 점수</Text>
            <Text style={styles.statValue}>{getTotalScore()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* 왼쪽 카테고리 네비게이션 */}
        <View style={styles.categoryPanel}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryItem,
                  selectedCategory === category.id && styles.activeCategory,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.activeCategoryText,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 오른쪽 업적 목록 */}
        <View style={styles.achievementsPanel}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredAchievements.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>업적 데이터가 없습니다.</Text>
              </View>
            ) : (
              filteredAchievements.map(renderAchievement)
            )}
          </ScrollView>
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
    marginTop: 10,
    fontSize: 16,
    color: "#7f8c8d",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    color: "#7f8c8d",
  },
  header: {
    backgroundColor: "#f8f9fa",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  content: {
    flex: 1,
    flexDirection: "row",
  },
  categoryPanel: {
    width: 120,
    backgroundColor: "#f8f9fa",
    borderRightWidth: 1,
    borderRightColor: "#e9ecef",
  },
  categoryItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  activeCategory: {
    backgroundColor: "#e3f2fd",
  },
  categoryText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  activeCategoryText: {
    color: "#2196F3",
    fontWeight: "bold",
  },
  achievementsPanel: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  achievementCard: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  completedCard: {
    borderColor: "#4CAF50",
    backgroundColor: "#e8f5e9",
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  iconText: {
    fontSize: 24,
  },
  achievementContent: {
    flex: 1,
    justifyContent: "center",
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  achievementDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  completedDate: {
    fontSize: 12,
    color: "#4CAF50",
  },
  rewardSection: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  rewardBadge: {
    backgroundColor: "#4CAF50",
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 8,
  },
  rewardText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  claimButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  claimButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  claimedBadge: {
    backgroundColor: "#4CAF50",
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  claimedText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
});
