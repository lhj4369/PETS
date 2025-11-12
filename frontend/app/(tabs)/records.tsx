//운동 기록 화면
import { useState, useEffect } from "react";
import {
  View,
   Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
  Alert,
  Platform,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import HomeButton from "../../components/HomeButton";
import AuthManager from "../../utils/AuthManager";
import API_BASE_URL from "../../config/api";

interface WorkoutRecord {
  id: string;
  date: string;
  duration: number;
  type: string;
  notes?: string;
}

export default function RecordsScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [workoutRecords, setWorkoutRecords] = useState<WorkoutRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMonthYearModal, setShowMonthYearModal] = useState(false);
  const [selectedDayRecords, setSelectedDayRecords] = useState<WorkoutRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWorkoutRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      // 개발자 모드: 로컬 데이터 사용
      if (await AuthManager.isDevMode()) {
        const devRecords = await AuthManager.getDevWorkoutRecords();
        
        // 현재 월의 기록만 필터링
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month + 1, 0).getDate();
        const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        
        const filteredRecords = devRecords.filter((r: any) => {
          return r.date >= startDate && r.date <= endDate;
        });
        
        const records: WorkoutRecord[] = filteredRecords.map((r: any) => ({
          id: r.id.toString(),
          date: r.date,
          duration: r.duration,
          type: r.type,
          notes: r.notes || undefined,
        }));
        
        setWorkoutRecords(records);
        setIsLoading(false);
        return;
      }

      const headers = await AuthManager.getAuthHeader();
      if (!headers.Authorization) {
        Alert.alert("오류", "인증이 필요합니다. 다시 로그인해주세요.");
        setIsLoading(false);
        return;
      }

      // 현재 월의 시작일과 종료일 계산
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const response = await fetch(
        `${API_BASE_URL}/api/workout?startDate=${startDate}&endDate=${endDate}`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        // 백엔드에서 이미 YYYY-MM-DD 형식으로 반환
        const records: WorkoutRecord[] = (data.records || []).map((r: any) => ({
          id: r.id.toString(),
          date: r.workoutDate,
          duration: r.durationMinutes,
          type: r.workoutType,
          notes: r.notes || undefined,
        }));
        
        setWorkoutRecords(records);
      } else {
        let errorMessage = `운동 기록을 불러올 수 없습니다. (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData?.error ?? errorMessage;
        } catch (e) {
          // JSON 파싱 실패 시 기본 메시지 사용
        }
        Alert.alert("오류", errorMessage);
        setWorkoutRecords([]);
      }
    } catch (error: any) {
      Alert.alert("오류", `운동 기록을 불러오는 중 문제가 발생했습니다: ${error?.message ?? '알 수 없는 오류'}`);
      setWorkoutRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  // 운동 기록 불러오기
  useEffect(() => {
    fetchWorkoutRecords();
  }, [fetchWorkoutRecords]);

  // 화면 포커스 시 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      fetchWorkoutRecords();
    }, [fetchWorkoutRecords])
  );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: any[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: null, isCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayRecords = workoutRecords.filter((r) => r.date === dateStr);
      days.push({
        date: day,
        isCurrentMonth: true,
        hasWorkout: dayRecords.length > 0,
        workoutCount: dayRecords.length,
      });
    }

    while (days.length < 42) {
      days.push({ date: null, isCurrentMonth: false });
    }

    return days;
  };

  const handleDatePress = (day: number) => {
    if (!day) return;

    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // 이미 불러온 workoutRecords에서 해당 날짜의 기록 찾기
    const dayRecords = workoutRecords.filter((r) => r.date === dateStr);

    setSelectedDate(dateStr);
    setSelectedDayRecords(dayRecords);

    if (dayRecords.length > 0) {
      setShowDetailModal(true);
    } else {
      setShowAddModal(true);
    }
  };

  const addWorkoutRecord = async (record: Omit<WorkoutRecord, 'id'>) => {
    try {
      // 개발자 모드: 로컬 저장
      if (await AuthManager.isDevMode()) {
        const newRecord: WorkoutRecord = {
          ...record,
          id: Date.now().toString(),
        };
        
        // AsyncStorage에 저장
        const existingRecords = await AuthManager.getDevWorkoutRecords();
        const updatedRecords = [...existingRecords, {
          id: newRecord.id,
          date: newRecord.date,
          duration: newRecord.duration,
          type: newRecord.type,
          notes: newRecord.notes || null,
          heartRate: null,
          hasReward: false,
        }];
        await AuthManager.setDevWorkoutRecords(updatedRecords);
        
        // 로컬 상태 업데이트
        setWorkoutRecords([...workoutRecords, newRecord]);
        if (selectedDate && record.date === selectedDate) {
          setSelectedDayRecords([...selectedDayRecords, newRecord]);
        }
        setShowAddModal(false);
        return;
      }

      const headers = await AuthManager.getAuthHeader();
      if (!headers.Authorization) {
        Alert.alert("오류", "인증이 필요합니다.");
        return;
      }

      const payload = {
        workoutDate: record.date,
        workoutType: record.type,
        durationMinutes: record.duration,
        heartRate: null,
        hasReward: false, // 수동 입력은 보상 없음
        notes: record.notes || null,
      };

      const response = await fetch(`${API_BASE_URL}/api/workout`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        Alert.alert("오류", data?.error ?? "운동 기록 저장에 실패했습니다.");
        return;
      }

      // 저장 후 다시 불러오기
      await fetchWorkoutRecords();
      setShowAddModal(false);
    } catch (error) {
      Alert.alert("오류", "운동 기록 저장 중 문제가 발생했습니다.");
    }
  };

  const deleteWorkoutRecord = async (id: string) => {
    const confirmDelete = () => {
      if (Platform.OS === 'web') {
        return window.confirm("이 운동 기록을 삭제하시겠습니까?");
      }
      return new Promise<boolean>((resolve) => {
        Alert.alert("기록 삭제", "이 운동 기록을 삭제하시겠습니까?", [
          { text: "취소", style: "cancel", onPress: () => resolve(false) },
          {
            text: "삭제",
            style: "destructive",
            onPress: () => resolve(true),
          },
        ]);
      });
    };

    const shouldDelete = Platform.OS === 'web' 
      ? confirmDelete() 
      : await confirmDelete();

    if (!shouldDelete) return;

    try {
      // 개발자 모드: 로컬 삭제
      if (await AuthManager.isDevMode()) {
        // AsyncStorage에서 삭제
        const existingRecords = await AuthManager.getDevWorkoutRecords();
        const updatedRecords = existingRecords.filter((r: any) => r.id.toString() !== id);
        await AuthManager.setDevWorkoutRecords(updatedRecords);
        
        // 로컬 상태 업데이트
        setWorkoutRecords(workoutRecords.filter((r) => r.id !== id));
        setSelectedDayRecords(selectedDayRecords.filter((r) => r.id !== id));
        if (selectedDayRecords.length === 1) {
          setShowDetailModal(false);
        }
        return;
      }

      const headers = await AuthManager.getAuthHeader();
      if (!headers.Authorization) {
        Alert.alert("오류", "인증이 필요합니다.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/workout/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        const data = await response.json();
        Alert.alert("오류", data?.error ?? "운동 기록 삭제에 실패했습니다.");
        return;
      }

      // 삭제 후 다시 불러오기
      await fetchWorkoutRecords();
      setSelectedDayRecords(selectedDayRecords.filter((r) => r.id !== id));
      if (selectedDayRecords.length === 1) {
        setShowDetailModal(false);
      }
    } catch (error) {
      Alert.alert("오류", "운동 기록 삭제 중 문제가 발생했습니다.");
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <SafeAreaView style={styles.container}>
      <HomeButton />
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigateMonth('prev')}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowMonthYearModal(true)}>
            <Text style={styles.monthYear}>
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateMonth('next')}>
            <Ionicons name="chevron-forward" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.calendar}>
          <View style={styles.weekHeader}>
            {weekDays.map((day, i) => (
              <Text key={i} style={[styles.weekDay, (i === 0 || i === 6) && styles.weekend]}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {days.map((day, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.dayCell,
                  !day.isCurrentMonth && styles.otherMonth,
                  day.hasWorkout && styles.workoutDay,
                ]}
                onPress={() => handleDatePress(day.date)}
                disabled={!day.isCurrentMonth}
              >
                {day.date && (
                  <>
                    <Text style={styles.dayText}>{day.date}</Text>
                    {day.hasWorkout && (
                      <View style={styles.workoutBadge}>
                        <Text style={styles.workoutBadgeText}>{day.workoutCount}</Text>
                      </View>
                    )}
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 운동 기록 추가 모달 */}
      <AddWorkoutModal
        visible={showAddModal}
        selectedDate={selectedDate || ''}
        onSave={addWorkoutRecord}
        onClose={() => setShowAddModal(false)}
      />

      {/* 운동 기록 상세 모달 */}
      <WorkoutDetailModal
        visible={showDetailModal}
        date={selectedDate || ''}
        records={selectedDayRecords}
        onDelete={deleteWorkoutRecord}
        onClose={() => setShowDetailModal(false)}
        onAddNew={() => {
          setShowDetailModal(false);
          setShowAddModal(true);
        }}
      />

      {/* 월/연도 선택 모달 */}
      <MonthYearModal
        visible={showMonthYearModal}
        currentDate={currentDate}
        onSelect={(date) => {
          setCurrentDate(date);
          setShowMonthYearModal(false);
        }}
        onClose={() => setShowMonthYearModal(false)}
      />
    </SafeAreaView>
  );
}

// 운동 기록 추가 모달
function AddWorkoutModal({ visible, selectedDate, onSave, onClose }: any) {
  const [type, setType] = useState("러닝");
  const [duration, setDuration] = useState("");

  const handleSave = () => {
    if (!duration) return;

    onSave({
      date: selectedDate,
      duration: parseInt(duration),
      type,
    });

    setDuration("");
    setType("러닝");
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>운동 기록 추가</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <Text style={styles.label}>날짜</Text>
          <Text style={styles.dateText}>{selectedDate}</Text>

          <Text style={styles.label}>운동 타입</Text>
          <View style={styles.typeContainer}>
            {["러닝", "헬스", "요가", "사이클링"].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>운동 시간 (분)</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
            placeholder="운동 시간을 입력하세요"
          />
        </ScrollView>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>저장</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

// 운동 기록 상세 모달
function WorkoutDetailModal({ visible, date, records, onDelete, onClose, onAddNew }: any) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{date}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {records.length === 0 ? (
            <Text style={styles.emptyText}>운동 기록이 없습니다</Text>
          ) : (
            records.map((record: WorkoutRecord) => (
              <View key={record.id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <View>
                    <Text style={styles.recordType}>{record.type}</Text>
                    <Text style={styles.recordDuration}>{record.duration}분</Text>
                  </View>
                  <TouchableOpacity onPress={() => onDelete(record.id)}>
                    <Ionicons name="trash" size={20} color="#f44336" />
                  </TouchableOpacity>
                </View>
                {record.notes && <Text style={styles.recordNotes}>{record.notes}</Text>}
              </View>
            ))
          )}
        </ScrollView>

        <TouchableOpacity style={styles.addNewBtn} onPress={onAddNew}>
          <Ionicons name="add" size={24} color="#4CAF50" />
          <Text style={styles.addNewText}>운동 기록 추가</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

// 월/연도 선택 모달
function MonthYearModal({ visible, currentDate, onSelect, onClose }: {
  visible: boolean;
  currentDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}) {
  const [selectedDate, setSelectedDate] = useState(currentDate);

  const handleConfirm = () => {
    onSelect(selectedDate);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.monthModalOverlay}>
        <View style={styles.monthModalContent}>
          <Text style={styles.monthModalTitle}>월/연도 선택</Text>

          <View style={styles.monthGrid}>
            {Array.from({ length: 12 }, (_, i) => i).map((month) => (
              <TouchableOpacity
                key={month}
                style={[
                  styles.monthBtn,
                  selectedDate.getMonth() === month && styles.monthBtnActive,
                ]}
                onPress={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(month);
                  setSelectedDate(newDate);
                }}
              >
                <Text
                  style={[
                    styles.monthBtnText,
                    selectedDate.getMonth() === month && styles.monthBtnTextActive,
                  ]}
                >
                  {month + 1}월
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.monthModalButtons}>
            <TouchableOpacity
              style={[styles.monthModalBtn, styles.monthModalBtnCancel]}
              onPress={onClose}
            >
              <Text style={styles.monthModalBtnText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.monthModalBtn} onPress={handleConfirm}>
              <Text style={styles.monthModalBtnText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 100,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  calendar: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    margin: 20,
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: 10,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    paddingVertical: 8,
  },
  weekend: {
    color: "#f44336",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  otherMonth: {
    opacity: 0.3,
  },
  workoutDay: {
    backgroundColor: "#e8f5e9",
  },
  dayText: {
    fontSize: 14,
    color: "#333",
  },
  workoutBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  workoutBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
    marginTop: 20,
  },
  dateText: {
    fontSize: 16,
    color: "#666",
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  typeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  typeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e0e0e0",
  },
  typeBtnActive: {
    borderColor: "#4CAF50",
    backgroundColor: "#e8f5e9",
  },
  typeBtnText: {
    fontSize: 14,
    color: "#666",
  },
  typeBtnTextActive: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  input: {
    fontSize: 16,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: "#4CAF50",
    padding: 15,
    margin: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 40,
  },
  recordCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recordType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  recordDuration: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  recordNotes: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  addNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    margin: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#4CAF50",
    borderStyle: "dashed",
  },
  addNewText: {
    color: "#4CAF50",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  monthModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  monthModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    width: "80%",
  },
  monthModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  monthBtn: {
    width: "23%",
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    marginBottom: 10,
  },
  monthBtnActive: {
    backgroundColor: "#4CAF50",
  },
  monthBtnText: {
    fontSize: 14,
    color: "#333",
  },
  monthBtnTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  monthModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  monthModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    marginHorizontal: 5,
  },
  monthModalBtnCancel: {
    backgroundColor: "#999",
  },
  monthModalBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
