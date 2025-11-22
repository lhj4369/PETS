//업적 화면
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
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
  { id: "overview", name: "개요", icon: "📊" },
  { id: "exercise", name: "운동", icon: "💪" },
  { id: "streak", name: "연속", icon: "🔥" },
  { id: "level", name: "레벨", icon: "⭐" },
  { id: "social", name: "소셜", icon: "👥" },
  { id: "special", name: "특별", icon: "🎁" },
];

export default function AchievementScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    setIsLoading(true);
    try {
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
    : selectedCategory 
    ? achievements.filter(achievement => achievement.category === selectedCategory)
    : [];

  const claimReward = async (achievementId: number) => {
    try {
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

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleBackToMain = () => {
    setSelectedCategory(null);
  };

  const handleNavigateToChallenges = () => {
    router.push("/(tabs)/challenges");
  };

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

  // 초기 화면 (분류 선택 화면)
  if (selectedCategory === null) {
    return (
      <SafeAreaView style={styles.container}>
        <HomeButton />
        <View style={styles.mainContainer}>
          <Text style={styles.mainTitle}>업적</Text>
          
          {/* 분류 버튼 그리드 (2x3) */}
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryButton}
                onPress={() => handleCategorySelect(category.id)}
              >
                <Text style={styles.categoryButtonIcon}>{category.icon}</Text>
                <Text style={styles.categoryButtonText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 기록 도전 버튼 */}
          <TouchableOpacity
            style={styles.challengeButton}
            onPress={handleNavigateToChallenges}
          >
            <Text style={styles.challengeButtonText}>기록 도전</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 분류별 업적 화면
  const selectedCategoryName = categories.find(cat => cat.id === selectedCategory)?.name || "업적";

  return (
    <SafeAreaView style={styles.container}>
      <HomeButton />
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleBackToMain} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedCategoryName}</Text>
          <View style={styles.backButtonPlaceholder} />
        </View>
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

      {/* 업적 목록 */}
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
    fontSize: 20,
    color: "#7f8c8d",
    fontFamily: 'KotraHope',
  },
  // 초기 화면 스타일
  mainContainer: {
    flex: 1,
    padding: 20,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 40,
    fontFamily: 'KotraHope',
  },
  categoryGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  categoryButton: {
    width: "48%",
    aspectRatio: 1.2,
    backgroundColor: "#f8f9fa",
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#e9ecef",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  categoryButtonIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  categoryButtonText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    fontFamily: 'KotraHope',
  },
  challengeButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 15,
    paddingVertical: 18,
    paddingHorizontal: 30,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  challengeButtonText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    fontFamily: 'KotraHope',
  },
  // 분류별 화면 스타일
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 22,
    color: "#7f8c8d",
    fontFamily: 'KotraHope',
  },
  header: {
    backgroundColor: "#f8f9fa",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 28,
    color: "#2196F3",
    fontWeight: "bold",
  },
  backButtonPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    flex: 1,
    fontFamily: 'KotraHope',
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 18,
    color: "#666",
    marginBottom: 5,
    fontFamily: 'KotraHope',
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4CAF50",
    fontFamily: 'KotraHope',
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
    fontSize: 28,
    fontFamily: 'KotraHope',
  },
  achievementContent: {
    flex: 1,
    justifyContent: "center",
  },
  achievementTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
    fontFamily: 'KotraHope',
  },
  achievementDescription: {
    fontSize: 18,
    color: "#666",
    marginBottom: 5,
    fontFamily: 'KotraHope',
  },
  completedDate: {
    fontSize: 16,
    color: "#4CAF50",
    fontFamily: 'KotraHope',
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
    fontSize: 18,
    fontFamily: 'KotraHope',
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
    fontSize: 16,
    fontFamily: 'KotraHope',
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
    fontSize: 16,
    fontFamily: 'KotraHope',
  },
});
