//랭킹 화면
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
  ImageSourcePropType,
} from "react-native";
import { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HomeButton from "../../components/HomeButton";
import AuthManager, { StoredUser } from "../../utils/AuthManager";
import API_BASE_URL from "../../config/api";

/** 이전 랭킹 저장 키 (유저별 이전 순위로 rankChange 계산용) */
const RANKING_PREVIOUS_KEY = "@pets_ranking_previous";
import { APP_COLORS } from "../../constants/theme";
import dog from "../../assets/images/animals/dog.png";
import capibara from "../../assets/images/animals/capibara.png";
import fox from "../../assets/images/animals/fox.png";
import ginipig from "../../assets/images/animals/ginipig.png";
import red_panda from "../../assets/images/animals/red_panda.png";
import crownImg from "../../assets/images/accessory/crown.png";
import muscleSuitImg from "../../assets/images/accessory/muscle_suit.png";
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
  rankChange: number | null;
  userId?: string | number;
  email?: string;
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
  const [currentUser, setCurrentUser] = useState<StoredUser>(null);
  const [seasonName, setSeasonName] = useState("Season 1");
  const [seasonEndDate, setSeasonEndDate] = useState<Date | null>(null);

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

      /** 동일 유저 매칭용 키 (이전 순위와 비교 시 사용) */
      const getUserKey = (item: any) => {
        const id = item.id ?? item.accountId ?? item.account_id;
        if (id != null) return String(id);
        if (item.email != null) return String(item.email);
        return null;
      };

      // 이전 랭킹 로드 (순위 변동 계산용)
      let prevRankByKey: Record<string, number> = {};
      try {
        const raw = await AsyncStorage.getItem(RANKING_PREVIOUS_KEY);
        if (raw) {
          const arr = JSON.parse(raw) as { key: string; rank: number }[];
          arr.forEach((e) => {
            prevRankByKey[e.key] = e.rank;
          });
        }
      } catch (_) {
        // 무시: 이전 데이터 없으면 전부 신규/변동 없음 처리
      }

      const toSave: { key: string; rank: number }[] = [];

      const formattedRankings: RankingItem[] = data.rankings.map((item: any, index: number) => {
        const rank = index + 1;
        const key = getUserKey(item);

        // 이전 순위와 비교해 rankChange 계산: 양수=상승, 0=유지, 음수=하락, null=신규
        let rankChange: number | null = null;
        if (key != null) {
          const prevRank = prevRankByKey[key];
          if (prevRank != null) {
            rankChange = prevRank - rank; // 이전 4위 → 현재 3위 = 4-3 = 1 (▲1)
          }
          toSave.push({ key, rank });
        }

        return {
          rank,
          name: item.name || "익명",
          animal: ANIMAL_IMAGE_MAP[item.animalType] || DEFAULT_ANIMAL_IMAGE,
          score: item.experience || 0,
          nickname: item.nickname || item.name || "익명",
          level: item.level || 1,
          totalWorkouts: item.totalWorkouts || 0,
          totalDurationMinutes: item.totalDurationMinutes || 0,
          avgHeartRate: Math.round(item.avgHeartRate || 0),
          rankChange,
          userId: item.id ?? item.accountId ?? item.account_id,
          email: item.email,
        };
      });

      setRankings(formattedRankings);

      // 다음 비교를 위해 현재 순위 저장
      try {
        await AsyncStorage.setItem(RANKING_PREVIOUS_KEY, JSON.stringify(toSave));
      } catch (_) {
        // 저장 실패해도 랭킹 표시에는 영향 없음
      }

      const user = await AuthManager.getUser();
      setCurrentUser(user);

      if (data.seasonName != null) setSeasonName(data.seasonName);
      const endDateRaw = data.seasonEndDate ?? data.endDate ?? data.season?.endDate;
      if (endDateRaw != null) {
        setSeasonEndDate(new Date(endDateRaw));
      } else {
        const end = new Date();
        end.setDate(end.getDate() + 12);
        setSeasonEndDate(end);
      }
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
    if (rank === 1) return APP_COLORS.yellow;
    if (rank === 2) return APP_COLORS.ivoryDark;
    if (rank === 3) return "#D4A574";
    return "#e0e0e0";
  };

  const isCurrentUser = (item: RankingItem): boolean => {
    if (!currentUser) return false;
    const u = currentUser as any;
    const loginName = String(
      u.account?.name ?? u.account?.nickname ?? u.name ?? u.nickname ?? u.displayName ?? ""
    ).trim();
    if (!loginName) return false;
    const itemName = String(item.name ?? "").trim();
    const itemNick = String(item.nickname ?? "").trim();
    return itemName === loginName || itemNick === loginName;
  };

  const getDday = (): number | null => {
    if (!seasonEndDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(seasonEndDate);
    end.setHours(0, 0, 0, 0);
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getDdayLabel = (): string | null => {
    const diff = getDday();
    if (diff === null) return null;
    if (diff > 0) return `D-${diff}`;
    if (diff === 0) return "D-Day";
    return "종료";
  };

  const getRankChangeLabel = (item: RankingItem): { text: string; color: string } => {
    if (item.rankChange === null) return { text: "NEW", color: "#9b59b6" };
    if (item.rankChange > 0) return { text: `▲${item.rankChange}`, color: "#27ae60" };
    if (item.rankChange < 0) return { text: `▼${Math.abs(item.rankChange)}`, color: "#e74c3c" };
    return { text: "-", color: APP_COLORS.brownLight };
  };

  const myRankItem = rankings.find((r) => isCurrentUser(r));
  const insets = useSafeAreaInsets();

  const handleAnimalPress = (animal: RankingItem) => {
    setSelectedAnimal(animal);
    setModalVisible(true);
  };

  const renderRankCard = (item: RankingItem, isMyRank = false) => {
    const changeLabel = getRankChangeLabel(item);
    return (
      <TouchableOpacity
        key={item.rank}
        style={[styles.rankItem, isMyRank && styles.rankItemCurrentUser]}
        onPress={() => handleAnimalPress(item)}
      >
        <View style={styles.rankLeft}>
          <Text style={styles.rankNumber}>{item.rank}</Text>
          <Image source={item.animal} style={styles.rankAnimalImage} resizeMode="contain" />
          <Text style={styles.rankName}>{item.nickname}</Text>
          {isMyRank && (
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>YOU</Text>
            </View>
          )}
        </View>
        <View style={styles.rankRight}>
          <View style={styles.rankScoreRow}>
            <Text style={styles.rankScore}>{item.score}점</Text>
            <Text style={[styles.rankChangeText, { color: changeLabel.color }]}>{changeLabel.text}</Text>
          </View>
          <Text style={styles.rankTime}>Lv.{item.level}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <HomeButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={APP_COLORS.yellowDark} />
          <Text style={styles.loadingText}>랭킹을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <HomeButton />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(40, insets.bottom) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 시즌 헤더 */}
        <View style={styles.seasonHeader}>
          <Text style={styles.seasonName}>{seasonName}</Text>
          {getDdayLabel() != null && (
            <Text style={styles.seasonDday}>{getDdayLabel()}</Text>
          )}
        </View>

        {rankings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>랭킹 데이터가 없습니다.</Text>
          </View>
        ) : (
          <>
            {/* 1, 2, 3위 시상대 - 최상단 */}
            {rankings.length >= 3 && (
                <View style={styles.podiumContainer}>
                  <TouchableOpacity style={styles.podiumItem} onPress={() => handleAnimalPress(rankings[1])}>
                    <View style={styles.animalContainer}>
                      <View style={[styles.crownSmall, { backgroundColor: getPodiumColor(2) }]}>
                        <Text style={styles.crownText}>2</Text>
                      </View>
                      <Image source={rankings[1].animal} style={styles.animalImage} resizeMode="contain" />
                    </View>
                    <View style={[styles.podium, { height: getPodiumHeight(2), backgroundColor: getPodiumColor(2) }]}>
                      <Text style={styles.podiumRank}>2</Text>
                    </View>
                    <Text style={styles.podiumName}>{rankings[1].nickname}</Text>
                    <Text style={styles.podiumScore}>{rankings[1].score}점</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.podiumItem} onPress={() => handleAnimalPress(rankings[0])}>
                    <View style={styles.animalContainer}>
                      <View style={[styles.crown, { backgroundColor: getPodiumColor(1) }]}>
                        <Text style={styles.crownTextLarge}>1</Text>
                      </View>
                      <Image source={rankings[0].animal} style={styles.animalImageLarge} resizeMode="contain" />
                    </View>
                    <View style={[styles.podium, { height: getPodiumHeight(1), backgroundColor: getPodiumColor(1) }]}>
                      <Text style={styles.podiumRank}>1</Text>
                    </View>
                    <Text style={styles.podiumNameLarge}>{rankings[0].nickname}</Text>
                    <Text style={styles.podiumScoreLarge}>{rankings[0].score}점</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.podiumItem} onPress={() => handleAnimalPress(rankings[2])}>
                    <View style={styles.animalContainer}>
                      <View style={[styles.crownSmall, { backgroundColor: getPodiumColor(3) }]}>
                        <Text style={styles.crownText}>3</Text>
                      </View>
                      <Image source={rankings[2].animal} style={styles.animalImage} resizeMode="contain" />
                    </View>
                    <View style={[styles.podium, { height: getPodiumHeight(3), backgroundColor: getPodiumColor(3) }]}>
                      <Text style={styles.podiumRank}>3</Text>
                    </View>
                    <Text style={styles.podiumName}>{rankings[2].nickname}</Text>
                    <Text style={styles.podiumScore}>{rankings[2].score}점</Text>
                  </TouchableOpacity>
                </View>
              )}

            {/* 시즌 보상 */}
            <View style={styles.rewardSection}>
              <Text style={styles.rewardTitle}>🏆 시즌 보상</Text>
              <View style={styles.rewardCards}>
                <View style={styles.rewardCard}>
                  <Image source={crownImg} style={styles.rewardImage} resizeMode="contain" />
                  <Text style={styles.rewardRank}>1위</Text>
                  <Text style={styles.rewardItemName}>왕관</Text>
                  <Text style={styles.rewardDesc}>운동시 얻는 모든 스탯 +2</Text>
                </View>
                <View style={styles.rewardCard}>
                  <Image source={muscleSuitImg} style={styles.rewardImage} resizeMode="contain" />
                  <Text style={styles.rewardRank}>TOP 5</Text>
                  <Text style={styles.rewardItemName}>근육맨 슈트</Text>
                  <Text style={styles.rewardDesc}>운동시 얻는 모든 스탯 +1</Text>
                </View>
              </View>
            </View>

            {/* 내 랭킹 */}
            {currentUser != null && (
              <View style={styles.myRankSection}>
                <Text style={styles.myRankLabel}>내 랭킹</Text>
                {myRankItem ? (
                  <TouchableOpacity
                    style={styles.myRankCard}
                    onPress={() => handleAnimalPress(myRankItem)}
                  >
                    <View style={styles.myRankInner}>
                      <Image source={myRankItem.animal} style={styles.myRankAnimal} resizeMode="contain" />
                      <View style={styles.myRankInfo}>
                        <Text style={styles.myRankNickname}>{myRankItem.nickname}</Text>
                        <Text style={styles.myRankDetail}>
                          {myRankItem.rank}위 · {myRankItem.score}점 · Lv.{myRankItem.level}
                        </Text>
                        {(() => {
                          const lbl = getRankChangeLabel(myRankItem);
                          return <Text style={[styles.myRankChange, { color: lbl.color }]}>{lbl.text}</Text>;
                        })()}
                      </View>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.myRankCard}>
                    <Text style={styles.myRankEmpty}>참여 후 확인</Text>
                    <Text style={styles.myRankEmptySub}>운동을 시작하면 내 순위가 표시됩니다</Text>
                  </View>
                )}
              </View>
            )}

            {/* 전체 랭킹 */}
            <View style={styles.listSection}>
              <Text style={styles.sectionTitle}>전체 랭킹</Text>
              <View style={styles.rankList}>
                {rankings.map((item) => renderRankCard(item, isCurrentUser(item)))}
              </View>
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
                  <Text style={styles.modalOwner}>
                    레벨 {selectedAnimal.level} | 경험치 {selectedAnimal.score}점
                  </Text>
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
                    <Text style={styles.statValue}>
                      {selectedAnimal.avgHeartRate > 0 ? `${selectedAnimal.avgHeartRate} bpm` : "데이터 없음"}
                    </Text>
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
    backgroundColor: APP_COLORS.ivory,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: APP_COLORS.brownLight,
    fontFamily: "KotraHope",
  },
  seasonHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    marginTop: 24,
  },
  seasonName: {
    fontSize: 18,
    fontWeight: "600",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  seasonDday: {
    fontSize: 18,
    fontWeight: "bold",
    color: APP_COLORS.yellowDark,
    fontFamily: "KotraHope",
  },
  myRankSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  myRankLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
    marginBottom: 12,
  },
  myRankCard: {
    backgroundColor: APP_COLORS.yellow,
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: APP_COLORS.yellowDark,
  },
  myRankInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  myRankAnimal: {
    width: 56,
    height: 56,
    marginRight: 16,
  },
  myRankInfo: {
    flex: 1,
  },
  myRankNickname: {
    fontSize: 20,
    fontWeight: "bold",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  myRankDetail: {
    fontSize: 15,
    color: APP_COLORS.brownLight,
    marginTop: 4,
    fontFamily: "KotraHope",
  },
  myRankChange: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
    fontFamily: "KotraHope",
  },
  myRankEmpty: {
    fontSize: 18,
    fontWeight: "600",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
    textAlign: "center",
  },
  myRankEmptySub: {
    fontSize: 14,
    color: APP_COLORS.brownLight,
    marginTop: 6,
    fontFamily: "KotraHope",
    textAlign: "center",
  },
  rewardSection: {
    marginTop: 24,
    marginBottom: 20,
  },
  rewardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
    marginBottom: 14,
  },
  rewardCards: {
    flexDirection: "row",
    gap: 12,
  },
  rewardCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.ivoryDark,
    alignItems: "center",
  },
  rewardImage: {
    width: 48,
    height: 48,
    marginBottom: 8,
  },
  rewardRank: {
    fontSize: 14,
    fontWeight: "bold",
    color: APP_COLORS.yellowDark,
    fontFamily: "KotraHope",
  },
  rewardItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
    marginTop: 2,
  },
  rewardDesc: {
    fontSize: 12,
    color: APP_COLORS.brownLight,
    marginTop: 4,
    fontFamily: "KotraHope",
    textAlign: "center",
  },
  listSection: {
    marginTop: 28,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
    marginBottom: 16,
  },
  podiumContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginTop: 16,
    marginBottom: 24,
  },
  podiumItem: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
  },
  animalContainer: {
    marginBottom: 10,
    alignItems: "center",
  },
  animalImage: {
    width: 50,
    height: 50,
    marginBottom: 5,
    zIndex: 1,
  },
  animalImageLarge: {
    width: 70,
    height: 70,
    marginBottom: 5,
    zIndex: 1,
  },
  crown: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    zIndex: 0,
  },
  crownTextLarge: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    fontFamily: "KotraHope",
  },
  crownSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    zIndex: 0,
  },
  crownText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#fff",
    fontFamily: "KotraHope",
  },
  podium: {
    width: "100%",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: APP_COLORS.brown,
    borderBottomWidth: 0,
  },
  podiumRank: {
    fontSize: 36,
    fontWeight: "bold",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  podiumName: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  podiumNameLarge: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  podiumScore: {
    fontSize: 13,
    color: APP_COLORS.brownLight,
    marginTop: 2,
    fontFamily: "KotraHope",
  },
  podiumScoreLarge: {
    fontSize: 15,
    fontWeight: "600",
    color: APP_COLORS.yellowDark,
    marginTop: 3,
    fontFamily: "KotraHope",
  },
  rankList: {
    gap: 10,
  },
  rankItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.ivoryDark,
  },
  rankItemCurrentUser: {
    borderWidth: 2,
    borderColor: APP_COLORS.yellowDark,
    backgroundColor: APP_COLORS.yellow,
  },
  rankLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: "bold",
    width: 28,
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  rankAnimalImage: {
    width: 32,
    height: 32,
    marginRight: 10,
  },
  rankName: {
    fontSize: 16,
    fontWeight: "600",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
  },
  youBadge: {
    marginLeft: 8,
    backgroundColor: APP_COLORS.yellowDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  youBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFF",
    fontFamily: "KotraHope",
    letterSpacing: 0.5,
  },
  rankRight: {
    alignItems: "flex-end",
  },
  rankScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rankScore: {
    fontSize: 16,
    fontWeight: "bold",
    color: APP_COLORS.yellowDark,
    fontFamily: "KotraHope",
  },
  rankChangeText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "KotraHope",
  },
  rankTime: {
    fontSize: 13,
    color: APP_COLORS.brownLight,
    marginTop: 2,
    fontFamily: "KotraHope",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: APP_COLORS.ivory,
    borderRadius: 20,
    padding: 25,
    width: "90%",
    maxWidth: 400,
    borderWidth: 2,
    borderColor: APP_COLORS.yellow,
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
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
    marginBottom: 5,
  },
  modalOwner: {
    fontSize: 16,
    color: APP_COLORS.brownLight,
    fontFamily: "KotraHope",
  },
  modalDivider: {
    height: 2,
    backgroundColor: APP_COLORS.ivoryDark,
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
    color: APP_COLORS.brown,
    fontWeight: "500",
    fontFamily: "KotraHope",
  },
  statValue: {
    fontSize: 16,
    color: APP_COLORS.brown,
    fontWeight: "bold",
    fontFamily: "KotraHope",
  },
});
