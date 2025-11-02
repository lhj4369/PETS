//기록 도전 화면
import { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Alert, SafeAreaView } from "react-native";
import Header from "../../components/Header";
import Navigator from "../../components/Navigator";

export default function ChallengesScreen() {
  const [achievements, setAchievements] = useState([
    { id: 1, title: "🏃 3km 14분 도전", condition: "러닝 3km를 14분 안에 완주하기", achieved: false, locked: false, level: 1 },
    { id: 2, title: "❤️ 심박수 140 넘기", condition: "운동 중 심박수 140bpm 이상 기록하기", achieved: false, locked: false, level: 1 },
    { id: 3, title: "🔥 7일 연속 운동", condition: "7일 연속으로 운동 기록 남기기", achieved: false, locked: false, level: 1 },
    { id: 4, title: "💪 50kg 벤치 도전", condition: "벤치프레스 50kg 10회 성공하기", achieved: false, locked: false, level: 1 },
  ]);

  const totalAchievements = achievements.length;
  const achievedCount = achievements.filter((a) => a.achieved).length;
  const progressRate = achievedCount / totalAchievements;

  const handlePress = (item: any) => {
    setAchievements((prev) =>
      prev.map((ach) => {
        if (ach.id === item.id && ach.level < 15) {
          // 15단계 미달성일 때만 강화
          const newLevel = ach.level + 1;
          
          // ✅ 3km 도전 → 1분씩 강화
          if (ach.title.includes("3km")) {
            const currentMinute = parseInt(ach.title.match(/(\d+)분/)?.[1] || "14");
            const newMinute = currentMinute - 1;
            const isCompleted = newLevel === 15;
            
            if (isCompleted) {
              setTimeout(() => {
                Alert.alert("완전 달성!", "🏅 3km 도전 15단계 완료! 축하합니다!");
              }, 100);
            }
            
            return {
              ...ach,
              title: `🏃 3km ${newMinute}분 도전`,
              condition: `러닝 3km를 ${newMinute}분 안에 완주하기`,
              level: newLevel,
              achieved: isCompleted,
            };
          }

          // ✅ 심박수 도전 → 5bpm씩 강화
          if (ach.title.includes("심박수")) {
            const currentBpm = parseInt(ach.title.match(/(\d+)/)?.[1] || "140");
            const newBpm = currentBpm + 5;
            const isCompleted = newLevel === 15;
            
            if (isCompleted) {
              setTimeout(() => {
                Alert.alert("완전 달성!", "🏅 심박수 도전 15단계 완료! 축하합니다!");
              }, 100);
            }
            
            return {
              ...ach,
              title: `❤️ 심박수 ${newBpm} 넘기`,
              condition: `운동 중 심박수 ${newBpm}bpm 이상 기록하기`,
              level: newLevel,
              achieved: isCompleted,
            };
          }

          // ✅ 7일 연속 운동 → 목표 일수 3일씩 증가
          if (ach.title.includes("연속 운동")) {
            const currentDays = parseInt(ach.title.match(/(\d+)일/)?.[1] || "7");
            const newDays = currentDays + 3;
            const isCompleted = newLevel === 15;
            
            if (isCompleted) {
              setTimeout(() => {
                Alert.alert("완전 달성!", "🏅 연속 운동 도전 15단계 완료! 축하합니다!");
              }, 100);
            }
            
            return {
              ...ach,
              title: `🔥 ${newDays}일 연속 운동`,
              condition: `${newDays}일 연속으로 운동 기록 남기기`,
              level: newLevel,
              achieved: isCompleted,
            };
          }

          // ✅ 벤치프레스 도전 → 무게 5kg씩 증가
          if (ach.title.includes("벤치")) {
            const currentKg = parseInt(ach.title.match(/(\d+)kg/)?.[1] || "50");
            const newKg = currentKg + 5;
            const isCompleted = newLevel === 15;
            
            if (isCompleted) {
              setTimeout(() => {
                Alert.alert("완전 달성!", "🏅 벤치프레스 도전 15단계 완료! 축하합니다!");
              }, 100);
            }
            
            return {
              ...ach,
              title: `💪 ${newKg}kg 벤치 도전`,
              condition: `벤치프레스 ${newKg}kg 10회 성공하기`,
              level: newLevel,
              achieved: isCompleted,
            };
          }
        }
        return ach;
      })
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB", paddingTop: 100 }}>
      <Header showBackButton={true} showMenuButton={true} menuType="challenges" />
      <Navigator />
      
      {/* 전체 달성률 표시 */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>
          전체 달성률: {(progressRate * 100).toFixed(0)}%
        </Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progressRate * 100}%` }]} />
        </View>
      </View>

      {/* 기록 도전 리스트 */}
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.mainTitle}>🏆 기록 도전</Text>

        {achievements.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.card,
              item.achieved && styles.achievedCard,
              item.level >= 10 && styles.advancedCard,
            ]}
            onPress={() => handlePress(item)}
            activeOpacity={0.8}
            disabled={item.level >= 15}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.icon}>{item.title.split(" ")[0]}</Text>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.title}>{item.title.replace(/^[^\s]+\s*/, "")}</Text>
                <Text style={styles.condition}>{item.condition}</Text>
                <Text style={styles.levelText}>단계: {item.level}/15</Text>
              </View>
            </View>
            <Text style={[
              styles.status,
              item.achieved && styles.statusAchieved,
              item.level >= 10 && styles.statusAdvanced
            ]}>
              {item.achieved ? "🏅 완전 달성" : `🔥 ${item.level}단계`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 10,
  },
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  advancedCard: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
    borderWidth: 1.5,
  },
  icon: {
    fontSize: 26,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
  },
  condition: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  levelText: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  status: {
    fontSize: 14,
    fontWeight: "bold",
  },
  statusAchieved: {
    color: "#FFD700",
  },
  statusAdvanced: {
    color: "#4CAF50",
  },
  achievedCard: {
    backgroundColor: "#FFF7E1",
    borderColor: "#FFD700",
    borderWidth: 1.5,
  },
});