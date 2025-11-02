//업적 화면
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Image,
} from "react-native";
import Header from "../../components/Header";

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  isCompleted: boolean;
  isClaimed: boolean;
  reward: number;
  icon: string;
  completedDate?: string;
}

const categories = [
  { id: "overview", name: "개요" },
  { id: "exercise", name: "운동" },
  { id: "streak", name: "연속" },
  { id: "level", name: "레벨" },
  { id: "social", name: "소셜" },
  { id: "special", name: "특별" },
];

const mockAchievements: Achievement[] = [
  {
    id: "1",
    title: "첫 운동 완료",
    description: "첫 번째 운동을 완료하세요",
    category: "exercise",
    isCompleted: true,
    isClaimed: false,
    reward: 50,
    icon: "🏃‍♂️",
    completedDate: "2024-01-15",
  },
  {
    id: "2",
    title: "3일 연속 운동",
    description: "3일 연속으로 운동을 완료하세요",
    category: "streak",
    isCompleted: true,
    isClaimed: true,
    reward: 100,
    icon: "🔥",
    completedDate: "2024-01-18",
  },
  {
    id: "3",
    title: "레벨 5 달성",
    description: "레벨 5에 도달하세요",
    category: "level",
    isCompleted: false,
    isClaimed: false,
    reward: 200,
    icon: "⭐",
  },
  {
    id: "4",
    title: "첫 친구 추가",
    description: "첫 번째 친구를 추가하세요",
    category: "social",
    isCompleted: false,
    isClaimed: false,
    reward: 75,
    icon: "👥",
  },
  {
    id: "5",
    title: "주간 목표 달성",
    description: "주간 운동 목표를 달성하세요",
    category: "exercise",
    isCompleted: true,
    isClaimed: false,
    reward: 150,
    icon: "🎯",
    completedDate: "2024-01-20",
  },
];

export default function AchievementScreen() {
  const [selectedCategory, setSelectedCategory] = useState("overview");
  const [achievements, setAchievements] = useState<Achievement[]>(mockAchievements);

  const filteredAchievements = selectedCategory === "overview" 
    ? achievements 
    : achievements.filter(achievement => achievement.category === selectedCategory);

  const claimReward = (achievementId: string) => {
    setAchievements(prev => 
      prev.map(achievement => 
        achievement.id === achievementId 
          ? { ...achievement, isClaimed: true }
          : achievement
      )
    );
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
        <Text style={styles.achievementTitle}>{achievement.title}</Text>
        <Text style={styles.achievementDescription}>{achievement.description}</Text>
        {achievement.completedDate && (
          <Text style={styles.completedDate}>
            완료일: {achievement.completedDate}
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

  return (
    <SafeAreaView style={styles.container}>
       <Header showBackButton={true} showMenuButton={true} menuType="achievement" />
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
            {filteredAchievements.map(renderAchievement)}
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
