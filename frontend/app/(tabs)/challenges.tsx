import { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Alert } from "react-native";
import Header from "../../components/Header";

export default function ChallengesScreen() {
  const [achievements, setAchievements] = useState([
    { id: 1, title: "🏃 첫 걸음", condition: "운동 기록 1회 달성", achieved: true, locked: false },
    { id: 2, title: "🔥 꾸준함의 시작", condition: "7일 연속 운동 기록", achieved: false, locked: false },
    { id: 3, title: "💪 습관 완성", condition: "30일 연속 운동 기록", achieved: false, locked: true },
    { id: 4, title: "🌊 러닝 마스터", condition: "러닝 20회 기록", achieved: false, locked: true },
    { id: 5, title: "🐢 느려도 꾸준히", condition: "요가 10회 기록", achieved: false, locked: true },
    { id: 6, title: "🌟 운동 마스터", condition: "총 100회 운동 기록", achieved: false, locked: true },
  ]);

  const totalAchievements = achievements.length;
  const achievedCount = achievements.filter((a) => a.achieved).length;
  const progressRate = achievedCount / totalAchievements;

  const handlePress = (item: any) => {
    if (item.locked) {
      Platform.OS === "web"
        ? window.alert("🔒 아직 해금되지 않은 도전입니다!")
        : Alert.alert("잠금 상태", "아직 해금되지 않은 도전이에요!");
      return;
    }

    if (item.achieved) {
      Platform.OS === "web"
        ? window.alert(`🏅 '${item.title}' 업적을 이미 달성했습니다!`)
        : Alert.alert("달성 완료", `'${item.title}' 업적을 이미 달성했습니다!`);
    } else {
      setAchievements((prev) => {
        const updated = prev.map((ach) =>
          ach.id === item.id ? { ...ach, achieved: true } : ach
        );
        
        // 다음 도전 자동 해금
        const nextAchievement = updated.find((ach) => ach.id === item.id + 1);
        if (nextAchievement && nextAchievement.locked) {
          const updatedWithUnlock = updated.map((ach) =>
            ach.id === nextAchievement.id ? { ...ach, locked: false } : ach
          );
          
          // 다음 도전 해금 알림
          const nextTitle = nextAchievement.title.replace(/^[^\s]+\s*/, "");
          setTimeout(() => {
            Platform.OS === "web"
              ? window.alert(`🔓 '${nextTitle}' 도전이 해금되었습니다!`)
              : Alert.alert("도전 해금", `'${nextTitle}' 도전이 해금되었습니다!`);
          }, 500);
          
          return updatedWithUnlock;
        }
        
        return updated;
      });
      
      Platform.OS === "web"
        ? window.alert(`🎉 '${item.title}' 업적을 달성했습니다!`)
        : Alert.alert("축하합니다!", `'${item.title}' 업적을 달성했습니다!`);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      {/* 기존 Header 유지 */}
      <Header showBackButton={true} showMenuButton={true} menuType="challenges" />

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
              item.locked && styles.lockedCard,
            ]}
            onPress={() => handlePress(item)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.icon}>{item.title.split(" ")[0]}</Text>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.title}>{item.title.replace(/^[^\s]+\s*/, "")}</Text>
                <Text style={styles.condition}>{item.condition}</Text>
              </View>
            </View>
            <Text
              style={[
                styles.status,
                item.achieved && styles.statusAchieved,
                item.locked && styles.statusLocked,
              ]}
            >
              {item.locked ? "🔒 잠금" : item.achieved ? "🏅 달성 완료" : "🔥 진행 중"}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
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
  },
  status: {
    fontSize: 14,
    fontWeight: "bold",
  },
  statusAchieved: {
    color: "#FFD700",
  },
  statusLocked: {
    color: "#aaa",
  },
  achievedCard: {
    backgroundColor: "#FFF7E1",
    borderColor: "#FFD700",
    borderWidth: 1.5,
  },
  lockedCard: {
    backgroundColor: "#ECECEC",
    opacity: 0.8,
  },
});