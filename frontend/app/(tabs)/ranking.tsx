//랭킹 화면
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, SafeAreaView } from "react-native";
import { useState } from "react";
import Header from "../../components/Header";
import Navigator from "../../components/Navigator";

export default function RankingScreen() {
  const [selectedAnimal, setSelectedAnimal] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 랭킹 데이터 (실제로는 서버에서 받아올 데이터)
  const rankings = [
    { 
      rank: 1, 
      name: "치타", 
      animal: "🐆", 
      score: 9850, 
      time: "01:23:45",
      totalTime: "@@@@",
      weeklyWorkouts: "@@@@",
      avgHeartRate: "@@@@",
      weeklyRunTime: "@@@@"
    },
    { 
      rank: 2, 
      name: "독수리", 
      animal: "🦅", 
      score: 9200, 
      time: "01:45:20",
      totalTime: "05:32:15",
      weeklyWorkouts: "5회",
      avgHeartRate: "145 bpm",
      weeklyRunTime: "02:30:00"
    },
    { 
      rank: 3, 
      name: "토끼", 
      animal: "🐰", 
      score: 8900, 
      time: "02:10:15",
      totalTime: "04:20:30",
      weeklyWorkouts: "4회",
      avgHeartRate: "138 bpm",
      weeklyRunTime: "02:00:00"
    },
    { 
      rank: 4, 
      name: "사자", 
      animal: "🦁", 
      score: 8500, 
      time: "02:30:40",
      totalTime: "03:45:20",
      weeklyWorkouts: "3회",
      avgHeartRate: "142 bpm",
      weeklyRunTime: "01:45:00"
    },
    { 
      rank: 5, 
      name: "호랑이", 
      animal: "🐯", 
      score: 8100, 
      time: "02:45:30",
      totalTime: "03:10:45",
      weeklyWorkouts: "3회",
      avgHeartRate: "140 bpm",
      weeklyRunTime: "01:30:00"
    },
  ];

  const getPodiumHeight = (rank: number) => {
    if (rank === 1) return 180;
    if (rank === 2) return 140;
    if (rank === 3) return 120;
    return 0;
  };

  const getPodiumColor = (rank: number) => {
    if (rank === 1) return "#FFD700"; // 금색
    if (rank === 2) return "#C0C0C0"; // 은색
    if (rank === 3) return "#CD7F32"; // 동메달
    return "#e0e0e0";
  };

  const handleAnimalPress = (animal: any) => {
    setSelectedAnimal(animal);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header showBackButton={true} showMenuButton={true} menuType="ranking" />
      <Navigator />
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.title}>전체 랭킹</Text>
        
        {/* 시상대 */}
        <View style={styles.podiumContainer}>
          {/* 2등 */}
          <TouchableOpacity 
            style={styles.podiumItem}
            onPress={() => handleAnimalPress(rankings[1])}
          >
            <View style={styles.animalContainer}>
              <Text style={styles.animalEmoji}>{rankings[1].animal}</Text>
              <View style={[styles.crownSmall, { backgroundColor: getPodiumColor(2) }]}>
                <Text style={styles.crownText}>2</Text>
              </View>
            </View>
            <View style={[styles.podium, { 
              height: getPodiumHeight(2),
              backgroundColor: getPodiumColor(2) 
            }]}>
              <Text style={styles.podiumRank}>2</Text>
            </View>
            <Text style={styles.podiumName}>{rankings[1].name}</Text>
            <Text style={styles.podiumScore}>{rankings[1].score}점</Text>
          </TouchableOpacity>

          {/* 1등 */}
          <TouchableOpacity 
            style={styles.podiumItem}
            onPress={() => handleAnimalPress(rankings[0])}
          >
            <View style={styles.animalContainer}>
              <Text style={styles.animalEmojiLarge}>{rankings[0].animal}</Text>
              <View style={[styles.crown, { backgroundColor: getPodiumColor(1) }]}>
                <Text style={styles.crownTextLarge}>👑</Text>
              </View>
            </View>
            <View style={[styles.podium, { 
              height: getPodiumHeight(1),
              backgroundColor: getPodiumColor(1) 
            }]}>
              <Text style={styles.podiumRank}>1</Text>
            </View>
            <Text style={styles.podiumNameLarge}>{rankings[0].name}</Text>
            <Text style={styles.podiumScoreLarge}>{rankings[0].score}점</Text>
          </TouchableOpacity>

          {/* 3등 */}
          <TouchableOpacity 
            style={styles.podiumItem}
            onPress={() => handleAnimalPress(rankings[2])}
          >
            <View style={styles.animalContainer}>
              <Text style={styles.animalEmoji}>{rankings[2].animal}</Text>
              <View style={[styles.crownSmall, { backgroundColor: getPodiumColor(3) }]}>
                <Text style={styles.crownText}>3</Text>
              </View>
            </View>
            <View style={[styles.podium, { 
              height: getPodiumHeight(3),
              backgroundColor: getPodiumColor(3) 
            }]}>
              <Text style={styles.podiumRank}>3</Text>
            </View>
            <Text style={styles.podiumName}>{rankings[2].name}</Text>
            <Text style={styles.podiumScore}>{rankings[2].score}점</Text>
          </TouchableOpacity>
        </View>

        {/* 동물별 랭킹 리스트 */}
        <View style={styles.listContainer}>
          <Text style={styles.subtitle}>동물별 랭킹</Text>
          {rankings.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.rankItem}
              onPress={() => handleAnimalPress(item)}
            >
              <View style={styles.rankLeft}>
                <Text style={styles.rankNumber}>{item.rank}</Text>
                <Text style={styles.rankAnimal}>{item.animal}</Text>
                <Text style={styles.rankName}>{item.name}</Text>
              </View>
              <View style={styles.rankRight}>
                <Text style={styles.rankScore}>{item.score}점</Text>
                <Text style={styles.rankTime}>{item.time}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 상세 정보 모달 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            {selectedAnimal && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalAnimal}>{selectedAnimal.animal}</Text>
                  <Text style={styles.modalName}>{selectedAnimal.name}</Text>
                  <Text style={styles.modalOwner}>주인 : {selectedAnimal.totalTime}</Text>
                </View>
                
                <View style={styles.modalDivider} />
                
                <View style={styles.modalStats}>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>총 운동 시간</Text>
                    <Text style={styles.statValue}>{selectedAnimal.totalTime}</Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>주로 한 운동</Text>
                    <Text style={styles.statValue}>{selectedAnimal.weeklyWorkouts}</Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>평균 심박수</Text>
                    <Text style={styles.statValue}>{selectedAnimal.avgHeartRate}</Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>일평균 운동 시간</Text>
                    <Text style={styles.statValue}>{selectedAnimal.weeklyRunTime}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 40,
    marginBottom: 30,
    color: "#2c3e50",
  },
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  podiumItem: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
  },
  animalContainer: {
    marginBottom: 10,
    alignItems: "center",
  },
  animalEmoji: {
    fontSize: 50,
    marginBottom: 5,
  },
  animalEmojiLarge: {
    fontSize: 70,
    marginBottom: 5,
  },
  crown: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -10,
  },
  crownSmall: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -5,
  },
  crownText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  crownTextLarge: {
    fontSize: 30,
  },
  podium: {
    width: "100%",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#2c3e50",
    borderBottomWidth: 0,
  },
  podiumRank: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  podiumName: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    color: "#2c3e50",
  },
  podiumNameLarge: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    color: "#2c3e50",
  },
  podiumScore: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 2,
  },
  podiumScoreLarge: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e67e22",
    marginTop: 3,
  },
  listContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#2c3e50",
  },
  rankItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rankLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rankNumber: {
    fontSize: 20,
    fontWeight: "bold",
    width: 30,
    color: "#2c3e50",
  },
  rankAnimal: {
    fontSize: 32,
    marginRight: 10,
  },
  rankName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
  },
  rankRight: {
    alignItems: "flex-end",
  },
  rankScore: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e67e22",
  },
  rankTime: {
    fontSize: 14,
    color: "#95a5a6",
    marginTop: 2,
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    width: "90%",
    maxWidth: 400,
    borderWidth: 3,
    borderColor: "#2c3e50",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalAnimal: {
    fontSize: 60,
    marginBottom: 10,
  },
  modalName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 5,
  },
  modalOwner: {
    fontSize: 16,
    color: "#7f8c8d",
  },
  modalDivider: {
    height: 2,
    backgroundColor: "#2c3e50",
    marginVertical: 15,
  },
  modalStats: {
    gap: 15,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "500",
  },
  statValue: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "bold",
  },
});