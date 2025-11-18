//랭킹 화면
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, SafeAreaView, ActivityIndicator, Alert, Image, ImageSourcePropType } from "react-native";
import { useState, useEffect } from "react";
import HomeButton from "../../components/HomeButton";
import AuthManager from "../../utils/AuthManager";
import API_BASE_URL from "../../config/api";
import dog from "../../assets/images/animals/dog.png";
import capibara from "../../assets/images/animals/capibara.png";
import fox from "../../assets/images/animals/fox.png";
import ginipig from "../../assets/images/animals/ginipig.png";
import red_panda from "../../assets/images/animals/red_panda.png";
import { DEFAULT_ANIMAL_IMAGE } from "../../context/CustomizationContext";

type RankingItem = {
  rank: number;
  name: string;
  animal: ImageSourcePropType;
  score: number;
  nickname: string;
  level: number;
  totalWorkouts: number;
  totalDurationMinutes: number;
  avgHeartRate: number;
};

const ANIMAL_IMAGE_MAP: Record<string, ImageSourcePropType> = {
  dog: dog,
  capybara: capibara,
  fox: fox,
  red_panda: red_panda,
  guinea_pig: ginipig,
};

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}시간 ${mins}분`;
  }
  return `${mins}분`;
};

export default function RankingScreen() {
  const [selectedAnimal, setSelectedAnimal] = useState<RankingItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    setIsLoading(true);
    try {
      const headers = await AuthManager.getAuthHeader();
      if (!headers.Authorization) {
        Alert.alert("오류", "인증이 필요합니다. 다시 로그인해주세요.");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/ranking`, {
        headers,
      });

      if (response.status === 401) {
        await AuthManager.logout();
        Alert.alert("오류", "인증이 만료되었습니다. 다시 로그인해주세요.");
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("랭킹 정보를 불러오지 못했습니다.");
      }

      const data = await response.json();
      
      const formattedRankings: RankingItem[] = data.rankings.map((item: any, index: number) => ({
        rank: index + 1,
        name: item.name || "익명",
        animal: ANIMAL_IMAGE_MAP[item.animalType] || DEFAULT_ANIMAL_IMAGE,
        score: item.experience || 0,
        nickname: item.nickname || item.name || "익명",
        level: item.level || 1,
        totalWorkouts: item.totalWorkouts || 0,
        totalDurationMinutes: item.totalDurationMinutes || 0,
        avgHeartRate: Math.round(item.avgHeartRate || 0),
      }));

      setRankings(formattedRankings);
    } catch (error) {
      console.error("랭킹 불러오기 실패:", error);
      Alert.alert("오류", "랭킹 정보를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleAnimalPress = (animal: RankingItem) => {
    setSelectedAnimal(animal);
    setModalVisible(true);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <HomeButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>랭킹을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <HomeButton />
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.title}>전체 랭킹</Text>
        
        {rankings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>랭킹 데이터가 없습니다.</Text>
          </View>
        ) : (
          <>
            {/* 시상대 */}
            {rankings.length >= 3 && (
              <View style={styles.podiumContainer}>
                {/* 2등 */}
                <TouchableOpacity 
                  style={styles.podiumItem}
                  onPress={() => handleAnimalPress(rankings[1])}
                >
                  <View style={styles.animalContainer}>
                    <Image source={rankings[1].animal} style={styles.animalImage} resizeMode="contain" />
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
                  <Text style={styles.podiumName}>{rankings[1].nickname}</Text>
                  <Text style={styles.podiumScore}>{rankings[1].score}점</Text>
                </TouchableOpacity>

                {/* 1등 */}
                <TouchableOpacity 
                  style={styles.podiumItem}
                  onPress={() => handleAnimalPress(rankings[0])}
                >
                  <View style={styles.animalContainer}>
                    <Image source={rankings[0].animal} style={styles.animalImageLarge} resizeMode="contain" />
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
                  <Text style={styles.podiumNameLarge}>{rankings[0].nickname}</Text>
                  <Text style={styles.podiumScoreLarge}>{rankings[0].score}점</Text>
                </TouchableOpacity>

                {/* 3등 */}
                <TouchableOpacity 
                  style={styles.podiumItem}
                  onPress={() => handleAnimalPress(rankings[2])}
                >
                  <View style={styles.animalContainer}>
                    <Image source={rankings[2].animal} style={styles.animalImage} resizeMode="contain" />
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
                  <Text style={styles.podiumName}>{rankings[2].nickname}</Text>
                  <Text style={styles.podiumScore}>{rankings[2].score}점</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 동물별 랭킹 리스트 */}
            <View style={styles.listContainer}>
              <Text style={styles.subtitle}>전체 랭킹</Text>
              {rankings.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.rankItem}
                  onPress={() => handleAnimalPress(item)}
                >
                  <View style={styles.rankLeft}>
                    <Text style={styles.rankNumber}>{item.rank}</Text>
                    <Image source={item.animal} style={styles.rankAnimalImage} resizeMode="contain" />
                    <Text style={styles.rankName}>{item.nickname}</Text>
                  </View>
                  <View style={styles.rankRight}>
                    <Text style={styles.rankScore}>{item.score}점</Text>
                    <Text style={styles.rankTime}>Lv.{item.level}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
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
                  <Image source={selectedAnimal.animal} style={styles.modalAnimalImage} resizeMode="contain" />
                  <Text style={styles.modalName}>{selectedAnimal.nickname}</Text>
                  <Text style={styles.modalOwner}>레벨 {selectedAnimal.level} | 경험치 {selectedAnimal.score}점</Text>
                </View>
                
                <View style={styles.modalDivider} />
                
                <View style={styles.modalStats}>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>총 운동 시간</Text>
                    <Text style={styles.statValue}>{formatDuration(selectedAnimal.totalDurationMinutes)}</Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>총 운동 횟수</Text>
                    <Text style={styles.statValue}>{selectedAnimal.totalWorkouts}회</Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>평균 심박수</Text>
                    <Text style={styles.statValue}>{selectedAnimal.avgHeartRate > 0 ? `${selectedAnimal.avgHeartRate} bpm` : '데이터 없음'}</Text>
                  </View>
                  
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>랭킹</Text>
                    <Text style={styles.statValue}>{selectedAnimal.rank}위</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#7f8c8d",
  

    fontFamily: 'KotraHope',},
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    color: "#7f8c8d",
  

    fontFamily: 'KotraHope',},
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 40,
    marginBottom: 30,
    color: "#2c3e50",
  

    fontFamily: 'KotraHope',},
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
  animalImage: {
    width: 50,
    height: 50,
    marginBottom: 5,
  },
  animalImageLarge: {
    width: 70,
    height: 70,
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
  

    fontFamily: 'KotraHope',},
  crownTextLarge: {
    fontSize: 30,
  

    fontFamily: 'KotraHope',},
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
    fontFamily: 'KotraHope',
  },
  podiumName: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
    color: "#2c3e50",
  

    fontFamily: 'KotraHope',},
  podiumNameLarge: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 10,
    color: "#2c3e50",
  

    fontFamily: 'KotraHope',},
  podiumScore: {
    fontSize: 14,
    color: "#7f8c8d",
    marginTop: 2,
  

    fontFamily: 'KotraHope',},
  podiumScoreLarge: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e67e22",
    marginTop: 3,
  

    fontFamily: 'KotraHope',},
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
  

    fontFamily: 'KotraHope',},
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
  

    fontFamily: 'KotraHope',},
  rankAnimalImage: {
    width: 32,
    height: 32,
    marginRight: 10,
  },
  rankName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
  

    fontFamily: 'KotraHope',},
  rankRight: {
    alignItems: "flex-end",
  },
  rankScore: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e67e22",
  

    fontFamily: 'KotraHope',},
  rankTime: {
    fontSize: 14,
    color: "#95a5a6",
    marginTop: 2,
  

    fontFamily: 'KotraHope',},
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
  modalAnimalImage: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  modalName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 5,
  

    fontFamily: 'KotraHope',},
  modalOwner: {
    fontSize: 16,
    color: "#7f8c8d",
  

    fontFamily: 'KotraHope',},
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
  

    fontFamily: 'KotraHope',},
  statValue: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "bold",
  

    fontFamily: 'KotraHope',},
});