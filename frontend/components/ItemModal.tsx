import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  useWindowDimensions,
} from "react-native";
import AuthManager from "../utils/AuthManager";
import API_BASE_URL from "../config/api";
import { APP_COLORS } from "../constants/theme";

const ACCESSORY_IMAGES: Record<string, any> = {
  crown: require("../assets/images/accessory/crown.png"),
  muscle_suit: require("../assets/images/accessory/muscle_suit.png"),
  red_hairband: require("../assets/images/accessory/red_hairband.png"),
};

const CONSUMABLE_IMAGES: Record<string, any> = {
  protein_small: require("../assets/images/item/small_protein.png"),
  protein_big: require("../assets/images/item/big_protein.png"),
};

const ITEM_DESCRIPTIONS: Record<string, string> = {
  crown: "운동시 얻는 모든 스탯 +2",
  muscle_suit: "운동시 얻는 모든 스탯 +1",
  red_hairband: "운동시 추가로 집중 +1",
  protein_small: "운동 이후 얻는 능력치 2배, 1회 사용가능 아이템",
  protein_big: "운동 이후 얻는 능력치 2배, 10회 사용가능 아이템",
};

type Accessory = {
  id: string;
  name: string;
  imageKey: string;
  owned: boolean;
};

type Consumable = {
  id: string;
  name: string;
  imageKey: string;
  quantity: number;
};

interface ItemModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ItemModal({ visible, onClose }: ItemModalProps) {
  const [activeTab, setActiveTab] = useState<"accessory" | "consumable">("accessory");
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Accessory | Consumable | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<"accessory" | "consumable" | null>(null);
  const { width } = useWindowDimensions();

  const fetchItems = useCallback(async () => {
    if (!visible) return;
    setIsLoading(true);
    try {
      const headers = await AuthManager.getAuthHeader();
      if (!headers.Authorization) return;

      const res = await fetch(`${API_BASE_URL}/api/items`, { headers });
      if (!res.ok) throw new Error("아이템 조회 실패");
      const data = await res.json();
      setAccessories(data.accessories || []);
      setConsumables(data.consumables || []);
    } catch (e) {
      console.error("아이템 로드 실패:", e);
    } finally {
      setIsLoading(false);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) fetchItems();
  }, [visible, fetchItems]);

  const openDetail = (item: Accessory | Consumable, type: "accessory" | "consumable") => {
    setSelectedItem(item);
    setSelectedItemType(type);
  };

  const closeDetail = () => {
    setSelectedItem(null);
    setSelectedItemType(null);
  };

  const modalWidth = Math.min(width - 40, 360);

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[styles.modal, { width: modalWidth }]}
          >
            <View style={styles.header}>
              <Text style={styles.title}>아이템</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tab, activeTab === "accessory" && styles.tabActive]}
                onPress={() => setActiveTab("accessory")}
              >
                <Text style={[styles.tabText, activeTab === "accessory" && styles.tabTextActive]}>
                  악세서리
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === "consumable" && styles.tabActive]}
                onPress={() => setActiveTab("consumable")}
              >
                <Text style={[styles.tabText, activeTab === "consumable" && styles.tabTextActive]}>
                  소모품
                </Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={APP_COLORS.yellowDark} />
                <Text style={styles.loadingText}>아이템을 불러오는 중...</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {activeTab === "accessory" && (
                  <>
                    {accessories.length === 0 ? (
                      <Text style={styles.emptyText}>악세서리가 없습니다.</Text>
                    ) : (
                      <View style={styles.grid}>
                        {accessories.map((a) => (
                          <TouchableOpacity
                            key={a.id}
                            style={[styles.itemCard, !a.owned && styles.itemCardLocked]}
                            onPress={() => openDetail(a, "accessory")}
                          >
                            <View style={styles.itemImageWrap}>
                              {ACCESSORY_IMAGES[a.imageKey] ? (
                                <Image
                                  source={ACCESSORY_IMAGES[a.imageKey]}
                                  style={[styles.itemImage, !a.owned && styles.itemImageLocked]}
                                  resizeMode="cover"
                                />
                              ) : (
                                <Text style={styles.itemPlaceholder}>?</Text>
                              )}
                            </View>
                            <Text style={styles.itemName}>{a.name}</Text>
                            <View style={[styles.badge, a.owned ? styles.badgeOwned : styles.badgeUnowned]}>
                              <Text style={styles.badgeText}>{a.owned ? "보유" : "미보유"}</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </>
                )}
                {activeTab === "consumable" && (
                  <>
                    {consumables.length === 0 ? (
                      <Text style={styles.emptyText}>소모품이 없습니다.</Text>
                    ) : (
                      <View style={styles.grid}>
                        {consumables.map((c) => (
                          <TouchableOpacity
                            key={c.id}
                            style={styles.itemCard}
                            onPress={() => openDetail(c, "consumable")}
                          >
                            <View style={styles.itemImageWrap}>
                              {CONSUMABLE_IMAGES[c.imageKey] ? (
                                <Image
                                  source={CONSUMABLE_IMAGES[c.imageKey]}
                                  style={styles.itemImage}
                                  resizeMode="cover"
                                />
                              ) : (
                                <Text style={styles.itemPlaceholder}>?</Text>
                              )}
                            </View>
                            <Text style={styles.itemName}>{c.name}</Text>
                            <View style={styles.quantityBadge}>
                              <Text style={styles.quantityText}>보유 {c.quantity}개</Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 아이템 상세 팝업 */}
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="fade"
        onRequestClose={closeDetail}
      >
        <TouchableOpacity style={styles.detailOverlay} activeOpacity={1} onPress={closeDetail}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[styles.detailModal, { width: modalWidth - 40 }]}
          >
            {selectedItem && selectedItemType && (
              <>
                <View style={styles.detailImageWrap}>
                  {selectedItemType === "accessory" && ACCESSORY_IMAGES[selectedItem.imageKey] ? (
                    <Image
                      source={ACCESSORY_IMAGES[selectedItem.imageKey]}
                      style={[
                        styles.detailImage,
                        (selectedItem as Accessory).owned === false && styles.itemImageLocked,
                      ]}
                      resizeMode="cover"
                    />
                  ) : selectedItemType === "consumable" && CONSUMABLE_IMAGES[selectedItem.imageKey] ? (
                    <Image
                      source={CONSUMABLE_IMAGES[selectedItem.imageKey]}
                      style={styles.detailImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.detailPlaceholder}>?</Text>
                  )}
                </View>
                <Text style={styles.detailName}>{selectedItem.name}</Text>
                {selectedItemType === "accessory" && (
                  <View
                    style={[
                      styles.detailBadge,
                      (selectedItem as Accessory).owned ? styles.badgeOwned : styles.badgeUnowned,
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {(selectedItem as Accessory).owned ? "보유 중" : "미보유"}
                    </Text>
                  </View>
                )}
                {selectedItemType === "consumable" && (
                  <Text style={styles.detailQuantity}>
                    보유 개수: {(selectedItem as Consumable).quantity}개
                  </Text>
                )}
                <Text style={styles.detailDesc}>
                  {ITEM_DESCRIPTIONS[selectedItem.id] ?? "퀘스트와 도전과제를 완료하여 획득할 수 있어요."}
                </Text>
                <TouchableOpacity style={styles.detailCloseBtn} onPress={closeDetail}>
                  <Text style={styles.detailCloseText}>닫기</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
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
    maxHeight: 400,
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "flex-start",
  },
  itemCard: {
    width: "47%",
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.ivoryDark,
    alignItems: "center",
  },
  itemCardLocked: {
    backgroundColor: "#F5F5F5",
    opacity: 0.9,
  },
  itemImageWrap: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: APP_COLORS.yellow,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 8,
  },
  itemImage: {
    width: 64,
    height: 64,
  },
  itemImageLocked: {
    opacity: 0.4,
  },
  itemPlaceholder: {
    fontSize: 24,
    color: APP_COLORS.brownLight,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeOwned: {
    backgroundColor: "#22C55E",
  },
  badgeUnowned: {
    backgroundColor: "#94A3B8",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFF",
    fontFamily: "KotraHope",
  },
  quantityBadge: {
    backgroundColor: APP_COLORS.yellowDark,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFF",
    fontFamily: "KotraHope",
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  detailModal: {
    backgroundColor: APP_COLORS.ivory,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: APP_COLORS.yellow,
    padding: 24,
    alignItems: "center",
  },
  detailImageWrap: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: APP_COLORS.yellow,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 16,
  },
  detailImage: {
    width: 120,
    height: 120,
  },
  detailPlaceholder: {
    fontSize: 48,
    color: APP_COLORS.brownLight,
  },
  detailName: {
    fontSize: 20,
    fontWeight: "bold",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
    marginBottom: 12,
  },
  detailBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 12,
  },
  detailQuantity: {
    fontSize: 16,
    fontWeight: "600",
    color: APP_COLORS.brown,
    fontFamily: "KotraHope",
    marginBottom: 12,
  },
  detailDesc: {
    fontSize: 14,
    color: APP_COLORS.brownLight,
    fontFamily: "KotraHope",
    textAlign: "center",
    marginBottom: 20,
  },
  detailCloseBtn: {
    backgroundColor: APP_COLORS.yellowDark,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  detailCloseText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    fontFamily: "KotraHope",
  },
});
