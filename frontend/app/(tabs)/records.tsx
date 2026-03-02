//운동 기록 화면
import { useState, useEffect, useRef } from "react";
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
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import HomeButton from "../../components/HomeButton";
import AuthManager from "../../utils/AuthManager";
import API_BASE_URL from "../../config/api";

type WorkoutSource = "auto" | "manual";

const determineRecordSource = (record: { heartRate?: number | null; hasReward?: boolean }): WorkoutSource => {
  if (record.hasReward) {
    return "auto";
  }
  if (record.heartRate !== null && record.heartRate !== undefined) {
    return "auto";
  }
  return "manual";
};

interface WorkoutRecord {
  id: string;
  date: string;
  duration: number;
  type: string;
  notes?: string;
  heartRate?: number | null;
  hasReward?: boolean;
  source: WorkoutSource;
  createdAt?: string | null;
}

interface WorkoutRecordPayload {
  date: string;
  duration: number;
  type: string;
  notes?: string;
}

const getRecordTimestamp = (record: WorkoutRecord) => {
  if (record.createdAt) {
    const timestamp = new Date(record.createdAt).getTime();
    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }

  const idAsNumber = Number(record.id);
  if (!Number.isNaN(idAsNumber)) {
    return idAsNumber;
  }

  const dateTimestamp = new Date(record.date).getTime();
  if (!Number.isNaN(dateTimestamp)) {
    return dateTimestamp;
  }

  return 0;
};

const sortRecordsByCreation = (records: WorkoutRecord[]) =>
  [...records].sort((a, b) => getRecordTimestamp(a) - getRecordTimestamp(b));

/** API에서 오는 날짜를 YYYY-MM-DD로 통일 (ISO 문자열·형식 차이 대비) */
function normalizeDateString(value: string | null | undefined): string {
  if (value == null || value === "") return "";
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const iso = str.split("T")[0];
  if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(str);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return str;
}

/** YYYY-MM-DD → "YYYY년 M월 D일" (앞자리 0 제거) */
function formatDateDisplay(dateStr: string): string {
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${y}년 ${m}월 ${d}일`;
}

// 퀘스트/커스터마이징과 동일 테마 (PETS 앱 컨셉)
const THEME_YELLOW = "#FFD54F";
const THEME_CREAM = "#FFF8E1";
const THEME_TEXT_DARK = "#333333";

export default function RecordsScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  // 초기 로드 시 오늘 날짜 선택
  const getTodayDateString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };
  const [selectedDate, setSelectedDate] = useState<string | null>(getTodayDateString());
  
  // 날짜가 미래인지 확인
  const isFutureDate = (dateStr: string) => {
    const today = getTodayDateString();
    return dateStr > today;
  };

  // 현재 연도 기준으로 +1년까지만 이동 가능한지 확인
  const canNavigateToMonth = (targetDate: Date) => {
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear + 1;
    const targetYear = targetDate.getFullYear();
    
    // 현재 연도 + 1년을 넘어가면 이동 불가
    return targetYear <= maxYear;
  };
  const [workoutRecords, setWorkoutRecords] = useState<WorkoutRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMonthYearModal, setShowMonthYearModal] = useState(false);
  const [selectedDayRecords, setSelectedDayRecords] = useState<WorkoutRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isNavigating = useRef(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WorkoutRecord | null>(null);
  const [isSavingAdd, setIsSavingAdd] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchWorkoutRecords = useCallback(async () => {
    setIsLoading(true);
    try {
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
        const rawRecords = data.records ?? [];
        const records: WorkoutRecord[] = rawRecords.map((r: any) => ({
          id: r.id.toString(),
          date: normalizeDateString(r.workoutDate),
          duration: Number(r.durationMinutes) || 0,
          type: r.workoutType ?? "기타",
          notes: r.notes || undefined,
          heartRate: r.heartRate ?? null,
          hasReward: r.hasReward ?? false,
          source: determineRecordSource(r),
          createdAt: r.createdAt ?? null,
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

  // 선택된 날짜의 기록 업데이트
  useEffect(() => {
    if (selectedDate) {
      const dayRecords = workoutRecords.filter((r) => r.date === selectedDate);
      setSelectedDayRecords(sortRecordsByCreation(dayRecords));
    } else {
      setSelectedDayRecords([]);
    }
  }, [selectedDate, workoutRecords]);

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
      const sortedByCreation = sortRecordsByCreation(dayRecords);
      const dotTypes = sortedByCreation.slice(0, 3).map((r) => r.type);
      
      days.push({
        date: day,
        isCurrentMonth: true,
        hasWorkout: dayRecords.length > 0,
        records: sortedByCreation,
        dotTypes,
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
    
    // 미래 날짜는 선택 불가
    if (isFutureDate(dateStr)) {
      Alert.alert("알림", "미래 날짜에는 운동 기록을 추가할 수 없습니다.");
      return;
    }
    
    // 이미 불러온 workoutRecords에서 해당 날짜의 기록 찾기
    const dayRecords = workoutRecords.filter((r) => r.date === dateStr);

    setSelectedDate(dateStr);
    setSelectedDayRecords(sortRecordsByCreation(dayRecords));
  };

  const addWorkoutRecord = async (record: WorkoutRecordPayload) => {
    setIsSavingAdd(true);
    try {
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

      // 저장 후 같은 달 기록 다시 불러오기 → 달력·선택일 목록 갱신
      await fetchWorkoutRecords();
      setShowAddModal(false);
      setToastMessage("저장되었습니다");
      setTimeout(() => setToastMessage(null), 2000);
    } catch (error) {
      Alert.alert("오류", "운동 기록 저장 중 문제가 발생했습니다.");
    } finally {
      setIsSavingAdd(false);
    }
  };

  const updateWorkoutRecord = async (id: string, updates: { type: string; duration: number }) => {
    const targetRecord = workoutRecords.find((r) => r.id === id);
    if (!targetRecord) {
      Alert.alert("오류", "수정할 운동 기록을 찾을 수 없습니다.");
      return;
    }

    if (targetRecord.source === "auto") {
      Alert.alert("알림", "자동 등록된 운동 기록은 수정할 수 없습니다.");
      return;
    }

    try {
      const headers = await AuthManager.getAuthHeader();
        if (!headers.Authorization) {
          Alert.alert("오류", "인증이 필요합니다.");
          return;
        }

        const payload = {
          workoutDate: targetRecord.date,
          workoutType: updates.type,
          durationMinutes: updates.duration,
          heartRate: targetRecord.heartRate ?? null,
          hasReward: targetRecord.hasReward ?? false,
          notes: targetRecord.notes ?? null,
        };

        const response = await fetch(`${API_BASE_URL}/api/workout/${id}`, {
          method: "PUT",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const data = await response.json();
          Alert.alert("오류", data?.error ?? "운동 기록 수정에 실패했습니다.");
          return;
        }

        await fetchWorkoutRecords();

      setShowEditModal(false);
      setEditingRecord(null);
    } catch (error: any) {
      Alert.alert("오류", error?.message ?? "운동 기록 수정 중 문제가 발생했습니다.");
    }
  };

  const deleteWorkoutRecord = async (id: string) => {
    const targetRecord = workoutRecords.find((r) => r.id === id);
    if (targetRecord?.source === "auto") {
      Alert.alert("알림", "자동 등록된 운동 기록은 삭제할 수 없습니다.");
      return;
    }

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
      setToastMessage("삭제되었습니다");
      setTimeout(() => setToastMessage(null), 2000);
    } catch (error) {
      Alert.alert("오류", "운동 기록 삭제 중 문제가 발생했습니다.");
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (isNavigating.current) return;
    
    isNavigating.current = true;
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        // 다음 달로 이동
        newDate.setMonth(newDate.getMonth() + 1);
        
        // 현재 연도 + 1년을 넘어가면 이동 불가
        if (!canNavigateToMonth(newDate)) {
          isNavigating.current = false;
          Alert.alert("알림", "현재 연도로부터 1년 뒤까지만 확인할 수 있습니다.");
          return prevDate; // 원래 날짜 유지
        }
      }
      return newDate;
    });
    
    // 300ms 후에 다시 클릭 가능하도록
    setTimeout(() => {
      isNavigating.current = false;
    }, 300);
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const totalDuration = selectedDayRecords.reduce((sum, record) => sum + record.duration, 0);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const parts: string[] = [];

    if (hours > 0) {
      parts.push(`${hours}시간`);
    }
    if (remainingMinutes > 0) {
      parts.push(`${remainingMinutes}분`);
    }

    if (parts.length === 0) {
      return "0분";
    }

    return parts.join(" ");
  };

  return (
    <SafeAreaView style={styles.container}>
      <HomeButton />
      {toastMessage ? (
        <View style={styles["toast"]}>
          <Text style={styles["toastText"]}>{toastMessage}</Text>
        </View>
      ) : null}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={THEME_YELLOW} />
          <Text style={styles.loadingText}>기록 불러오는 중...</Text>
        </View>
      )}
      <View style={styles.mainContainer}>
        {/* 상단: 달력 영역 */}
        <View style={styles.calendarSection}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.todayButton}
              onPress={() => {
                const today = new Date();
                setCurrentDate(today);
                setSelectedDate(getTodayDateString());
              }}
            >
              <Ionicons name="today-outline" size={20} color={THEME_YELLOW} />
              <Text style={styles.todayButtonText}>오늘</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigateMonth('prev')}>
              <Ionicons name="chevron-back" size={24} color={THEME_TEXT_DARK} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowMonthYearModal(true)} style={styles.monthYearTouchable}>
              <Text style={styles.monthYear} numberOfLines={1}>
                {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => navigateMonth('next')}
              disabled={(() => {
                const nextMonth = new Date(currentDate);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                return !canNavigateToMonth(nextMonth);
              })()}
            >
              <Ionicons 
                name="chevron-forward" 
                size={24} 
                color={(() => {
                  const nextMonth = new Date(currentDate);
                  nextMonth.setMonth(nextMonth.getMonth() + 1);
                  return canNavigateToMonth(nextMonth) ? THEME_TEXT_DARK : "#999";
                })()} 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.calendar}>
            <View style={styles.weekHeader}>
              {weekDays.map((day, i) => (
                <Text
                  key={i}
                  style={[
                    styles.weekDay,
                    i === 0 && styles.sunday,
                    i === 6 && styles.saturday,
                  ]}
                >
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {days.map((day, i) => {
                const dateStr = day.date 
                  ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`
                  : null;
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === getTodayDateString();
                const isFuture = dateStr ? isFutureDate(dateStr) : false;
                const isDisabled = !day.isCurrentMonth || isFuture;
                
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.dayCell,
                      !day.isCurrentMonth && styles.otherMonth,
                      isToday && !isSelected && styles.todayDay,
                      isSelected && styles.selectedDay,
                      isFuture && styles.futureDay,
                    ]}
                    onPress={() => handleDatePress(day.date)}
                    disabled={isDisabled}
                  >
                    {day.date && (
                      <>
                        <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>
                          {day.date}
                        </Text>
                        <View style={styles.dotsContainer}>
                          {day.dotTypes?.map((type: string, idx: number) => (
                            <View
                              key={`${dateStr}-dot-${idx}`}
                              style={[
                                styles.dot,
                                type === "유산소"
                                  ? styles.aerobicDot
                                  : type === "웨이트"
                                  ? styles.weightDot
                                  : type === "인터벌"
                                  ? styles.intervalDot
                                  : styles.otherDot,
                              ]}
                            />
                          ))}
                        </View>
                      </>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* 하단: 운동 기록 영역 */}
        <View style={styles.recordsSection}>
          <View style={styles.recordsContentWrapper}>
            {selectedDate ? (
              <ScrollView style={styles.recordsScrollView} contentContainerStyle={styles.recordsContent}>
                {selectedDayRecords.length > 0 ? (
                  <View style={styles.recordsList}>
                    <View style={styles.recordSummary}>
                      <Text style={styles.recordSummaryText}>
                        {formatDateDisplay(selectedDate)} · 총{" "}
                        <Text style={styles.recordSummaryDuration}>
                          {formatDuration(totalDuration)}
                        </Text>
                      </Text>
                    </View>
                    {selectedDayRecords.map((record) => {
                      const isManual = record.source === "manual";
                      return (
                        <View
                          key={record.id}
                          style={[
                            styles.recordItem,
                            isManual ? styles.manualRecordItem : styles.autoRecordItem,
                          ]}
                        >
                          <View style={styles.recordItemContent}>
                            <Text
                              style={[
                                styles.recordItemType,
                                isManual ? styles.manualRecordType : styles.autoRecordType,
                              ]}
                            >
                              {record.type}
                            </Text>
                            <Text
                              style={[
                                styles.recordItemDuration,
                                isManual
                                  ? styles.manualRecordDuration
                                  : styles.autoRecordDuration,
                              ]}
                            >
                              {formatDuration(record.duration)}
                            </Text>
                            <View style={styles["recordSourceRow"]}>
                              <Ionicons
                                name={isManual ? "create-outline" : "lock-closed-outline"}
                                size={12}
                                color="#888"
                              />
                              <Text style={styles.recordSourceLabel}>
                                {isManual ? "내가 추가한 기록" : "자동 기록 (수정 불가)"}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.recordActions}>
                            {isManual ? (
                              <>
                                <TouchableOpacity
                                  onPress={() => {
                                    setEditingRecord(record);
                                    setShowEditModal(true);
                                  }}
                                  style={styles.actionButton}
                                >
                                  <Ionicons name="create-outline" size={20} color={THEME_YELLOW} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => deleteWorkoutRecord(record.id)}
                                  style={styles.actionButton}
                                >
                                  <Ionicons name="trash-outline" size={20} color="#f44336" />
                                </TouchableOpacity>
                              </>
                            ) : (
                              <Ionicons name="lock-closed-outline" size={18} color={THEME_TEXT_DARK} />
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptyRecords}>
                    <View style={styles.emptyRecordsIconWrap}>
                      <Ionicons name="calendar-outline" size={56} color="#C4B896" />
                    </View>
                    <Text style={styles.emptyRecordsTitle}>이 날은 아직 기록이 없어요</Text>
                    <Text style={styles.emptyRecordsText}>아래 버튼으로 운동 기록을 추가해 보세요!</Text>
                  </View>
                )}
              </ScrollView>
            ) : (
              <View style={styles.emptyRecords}>
                <View style={styles.emptyRecordsIconWrap}>
                  <Ionicons name="calendar-outline" size={56} color="#C4B896" />
                </View>
                <Text style={styles.emptyRecordsText}>날짜를 선택해주세요</Text>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={[
              styles.addRecordButton,
              selectedDate && isFutureDate(selectedDate) && styles.addRecordButtonDisabled
            ]}
            onPress={() => {
              if (!selectedDate) {
                // 날짜가 선택되지 않았으면 오늘 날짜로 설정
                const todayStr = getTodayDateString();
                setSelectedDate(todayStr);
                const todayRecords = workoutRecords.filter((r) => r.date === todayStr);
                setSelectedDayRecords(sortRecordsByCreation(todayRecords));
                setShowAddModal(true);
              } else if (isFutureDate(selectedDate)) {
                Alert.alert("알림", "미래 날짜에는 운동 기록을 추가할 수 없습니다.");
              } else {
                setShowAddModal(true);
              }
            }}
          >
            <Text style={styles.addRecordButtonText}>운동 기록 추가하기</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 운동 기록 추가 모달 */}
      <AddWorkoutModal
        visible={showAddModal}
        selectedDate={selectedDate || new Date().toISOString().split('T')[0]}
        isSaving={isSavingAdd}
        onSave={async (record: WorkoutRecordPayload) => {
          await addWorkoutRecord(record);
        }}
        onClose={() => setShowAddModal(false)}
      />

      <EditWorkoutModal
        visible={showEditModal}
        record={editingRecord}
        onSave={(updates) => {
          if (editingRecord) {
            updateWorkoutRecord(editingRecord.id, updates);
          }
        }}
        onClose={() => {
          setShowEditModal(false);
          setEditingRecord(null);
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
        onSelectToday={() => {
          const today = new Date();
          setCurrentDate(today);
          setSelectedDate(getTodayDateString());
          setShowMonthYearModal(false);
        }}
        onClose={() => setShowMonthYearModal(false)}
      />
    </SafeAreaView>
  );
}

// 운동 기록 추가 모달
function formatDateForDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (y && m && d) return `${y}년 ${m}월 ${d}일`;
  return dateStr;
}

interface AddWorkoutModalProps {
  visible: boolean;
  selectedDate: string;
  isSaving?: boolean;
  onSave: (record: WorkoutRecordPayload) => void | Promise<void>;
  onClose: () => void;
}

const WORKOUT_TYPES = ["유산소", "웨이트", "인터벌", "기타"] as const;

function AddWorkoutModal({ visible, selectedDate, isSaving = false, onSave, onClose }: AddWorkoutModalProps) {
  const [type, setType] = useState("유산소");
  const [duration, setDuration] = useState("");

  const handleDurationChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setDuration(numericValue);
  };

  const durationNum = parseInt(duration, 10);
  const canSave = !isSaving && duration.trim() !== "" && !Number.isNaN(durationNum) && durationNum > 0;

  const handleSave = () => {
    if (!canSave) {
      if (duration.trim() === "" || Number.isNaN(durationNum) || durationNum <= 0) {
        Alert.alert("오류", "올바른 운동 시간을 입력해주세요. (1분 이상)");
      }
      return;
    }

    onSave({
      date: selectedDate,
      duration: durationNum,
      type,
    });

    setDuration("");
    setType("유산소");
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={styles.modalBottomSheet}
        >
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>운동 기록 추가</Text>
            <TouchableOpacity onPress={onClose} disabled={isSaving}>
              <Ionicons name="close" size={24} color={THEME_TEXT_DARK} />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalDateSubtitle}>{formatDateForDisplay(selectedDate)}</Text>

          <View style={styles.modalContent}>
            <Text style={styles.label}>운동 타입</Text>
            <View style={styles.typeContainer}>
              {WORKOUT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeBtn, 
                    type === t && styles.typeBtnActive,
                    t === "유산소" && type === t && styles.aerobicTypeBtnActive,
                    t === "웨이트" && type === t && styles.weightTypeBtnActive,
                    t === "인터벌" && type === t && styles.intervalTypeBtnActive,
                    t === "기타" && type === t && styles.otherTypeBtnActive,
                  ]}
                  onPress={() => setType(t)}
                  disabled={isSaving}
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
              onChangeText={handleDurationChange}
              keyboardType="numeric"
              placeholder="1~999 분 입력"
              editable={!isSaving}
            />
          </View>

          <TouchableOpacity 
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]} 
            onPress={handleSave}
            disabled={!canSave}
          >
            {isSaving ? (
              <View style={styles.saveBtnLoading}>
                <ActivityIndicator size="small" color={THEME_TEXT_DARK} />
                <Text style={styles.saveBtnText}>저장 중...</Text>
              </View>
            ) : (
              <Text style={styles.saveBtnText}>저장</Text>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

interface EditWorkoutModalProps {
  visible: boolean;
  record: WorkoutRecord | null;
  onSave: (updates: { type: string; duration: number }) => void;
  onClose: () => void;
}

function EditWorkoutModal({ visible, record, onSave, onClose }: EditWorkoutModalProps) {
  const [type, setType] = useState(record?.type ?? "유산소");
  const [duration, setDuration] = useState(record ? String(record.duration) : "");

  useEffect(() => {
    setType(record?.type ?? "유산소");
    setDuration(record ? String(record.duration) : "");
  }, [record]);

  const handleDurationChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setDuration(numericValue);
  };

  const handleSave = () => {
    if (!record) return;

    if (!duration || parseInt(duration) <= 0) {
      Alert.alert("오류", "올바른 운동 시간을 입력해주세요.");
      return;
    }

    onSave({
      type,
      duration: parseInt(duration, 10),
    });
  };

  return (
    <Modal 
      visible={visible} 
      animationType="fade" 
      transparent 
      onRequestClose={onClose}
    >
      <View style={styles.editModalOverlay}>
        <View style={styles.editModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>운동 기록 수정</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={THEME_TEXT_DARK} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.label}>운동 타입</Text>
            <View style={styles.typeContainer}>
              {WORKOUT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeBtn, 
                    type === t && styles.typeBtnActive,
                    t === "유산소" && type === t && styles.aerobicTypeBtnActive,
                    t === "웨이트" && type === t && styles.weightTypeBtnActive,
                    t === "인터벌" && type === t && styles.intervalTypeBtnActive,
                    t === "기타" && type === t && styles.otherTypeBtnActive,
                  ]}
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
              onChangeText={handleDurationChange}
              keyboardType="numeric"
              placeholder="1~999 분 입력"
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>저장</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}


// 월/연도 선택 모달
const MIN_YEAR = new Date().getFullYear() - 2;
const MAX_YEAR = new Date().getFullYear() + 1;

function MonthYearModal({ visible, currentDate, onSelect, onSelectToday, onClose }: {
  visible: boolean;
  currentDate: Date;
  onSelect: (date: Date) => void;
  onSelectToday?: () => void;
  onClose: () => void;
}) {
  const [selectedDate, setSelectedDate] = useState(currentDate);

  // 모달이 열릴 때 현재 캘린더 월/연도로 동기화
  useEffect(() => {
    if (visible) {
      setSelectedDate(new Date(currentDate));
    }
  }, [visible, currentDate]);

  const handleConfirm = () => {
    onSelect(selectedDate);
  };

  const changeYear = (delta: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      const nextYear = next.getFullYear() + delta;
      const clamped = Math.min(MAX_YEAR, Math.max(MIN_YEAR, nextYear));
      next.setFullYear(clamped);
      return next;
    });
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.monthModalOverlay}>
        <View style={styles.monthModalContent}>
          <Text style={styles.monthModalTitle}>빠른 이동</Text>

          {/* 연도 선택 */}
          <View style={styles.yearRow}>
            <TouchableOpacity
              onPress={() => changeYear(-1)}
              style={styles.yearArrow}
              disabled={selectedDate.getFullYear() <= MIN_YEAR}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={selectedDate.getFullYear() <= MIN_YEAR ? "#ccc" : THEME_TEXT_DARK}
              />
            </TouchableOpacity>
            <Text style={styles.yearText}>{selectedDate.getFullYear()}년</Text>
            <TouchableOpacity
              onPress={() => changeYear(1)}
              style={styles.yearArrow}
              disabled={selectedDate.getFullYear() >= MAX_YEAR}
            >
              <Ionicons
                name="chevron-forward"
                size={24}
                color={selectedDate.getFullYear() >= MAX_YEAR ? "#ccc" : THEME_TEXT_DARK}
              />
            </TouchableOpacity>
          </View>

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

          {onSelectToday ? (
            <TouchableOpacity
              style={styles.monthModalTodayBtn}
              onPress={() => onSelectToday()}
            >
              <Ionicons name="today-outline" size={18} color={THEME_YELLOW} />
              <Text style={styles.monthModalTodayBtnText}>오늘로 이동</Text>
            </TouchableOpacity>
          ) : null}

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
    backgroundColor: THEME_CREAM,
    paddingTop: 60,
  },
  mainContainer: {
    flex: 1,
    flexDirection: "column",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,248,225,0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: THEME_TEXT_DARK,
    fontFamily: "KotraHope",
  },
  toast: {
    position: "absolute",
    bottom: 100,
    left: 24,
    right: 24,
    backgroundColor: THEME_TEXT_DARK,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  toastText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "KotraHope",
  },
  calendarSection: {
    flex: 0.48,
    paddingHorizontal: 10,
    paddingTop: 5,
  },
  recordsSection: {
    flex: 0.52,
    backgroundColor: THEME_CREAM,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 15,
    paddingBottom: 15,
  },
  recordsContentWrapper: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingRight: 72,
    gap: 8,
  },
  monthYearTouchable: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  monthYear: {
    fontSize: 22,
    fontWeight: "600",
    color: THEME_TEXT_DARK,
    fontFamily: "KotraHope",
  },
  todayButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255, 213, 79, 0.25)",
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME_TEXT_DARK,
    fontFamily: "KotraHope",
  },
  calendar: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 10,
    marginHorizontal: 10,
    marginTop: 0,
  },
  todayDay: {
    borderWidth: 2,
    borderColor: THEME_YELLOW,
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: THEME_TEXT_DARK,
    paddingVertical: 6,
    fontFamily: "KotraHope",
  },
  sunday: {
    color: "#f44336",
  

    fontFamily: 'KotraHope',},
  saturday: {
    color: "#0277BD",
  

    fontFamily: 'KotraHope',},
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
    borderRadius: 8,
  },
  otherMonth: {
    opacity: 0.3,
  },
  futureDay: {
    opacity: 0.4,
  },
  selectedDay: {
    backgroundColor: "#FFFDE7",
    borderWidth: 2,
    borderColor: THEME_YELLOW,
  },
  dayText: {
    fontSize: 18,
    color: THEME_TEXT_DARK,
    fontWeight: "500",
    fontFamily: "KotraHope",
  },
  selectedDayText: {
    color: THEME_TEXT_DARK,
    fontWeight: "700",
    fontFamily: "KotraHope",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  aerobicDot: {
    backgroundColor: "#FFD54F", // 노란색
  },
  weightDot: {
    backgroundColor: "#4A90E2", // 파란색 (기존 인터벌 색상)
  },
  intervalDot: {
    backgroundColor: "#FF8A3D", // 주황색 계열
  },
  otherDot: {
    backgroundColor: "#9E9E9E", // 회색
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },
  modalBottomSheet: {
    backgroundColor: THEME_CREAM,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "50%",
    minHeight: "45%",
  },
  modalHandle: {
    width: 44,
    height: 5,
    backgroundColor: "#9A8B6F",
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: THEME_YELLOW,
    borderBottomWidth: 1,
    borderBottomColor: "#EDE7D6",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: THEME_TEXT_DARK,
    fontFamily: "KotraHope",
  },
  modalDateSubtitle: {
    fontSize: 15,
    color: THEME_TEXT_DARK,
    paddingHorizontal: 20,
    paddingBottom: 8,
    fontFamily: "KotraHope",
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    flexGrow: 1,
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  editModalContent: {
    width: "90%",
    backgroundColor: THEME_CREAM,
    borderRadius: 20,
    overflow: "hidden",
  },
  label: {
    fontSize: 20,
    fontWeight: "600",
    color: THEME_TEXT_DARK,
    marginBottom: 10,
    marginTop: 15,
    fontFamily: "KotraHope",
  },
  dateText: {
    fontSize: 20,
    color: "#666",
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  

    fontFamily: 'KotraHope',},
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
    borderColor: THEME_YELLOW,
    backgroundColor: "#FFFDE7",
  },
  aerobicTypeBtnActive: {
    borderColor: THEME_YELLOW,
    backgroundColor: "#FFFDE7",
  },
  intervalTypeBtnActive: {
    borderColor: THEME_YELLOW,
    backgroundColor: "#FFFDE7",
  },
  otherTypeBtnActive: {
    borderColor: THEME_YELLOW,
    backgroundColor: "#FFFDE7",
  },
  weightTypeBtnActive: {
    borderColor: THEME_YELLOW,
    backgroundColor: "#FFFDE7",
  },
  typeBtnText: {
    fontSize: 18,
    color: THEME_TEXT_DARK,
    fontFamily: "KotraHope",
  },
  typeBtnTextActive: {
    color: THEME_TEXT_DARK,
    fontWeight: "600",
    fontFamily: "KotraHope",
  },
  input: {
    fontSize: 20,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 10,
  

    fontFamily: 'KotraHope',},
  saveBtn: {
    backgroundColor: THEME_YELLOW,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  saveBtnDisabled: {
    backgroundColor: "#E0E0E0",
    opacity: 0.8,
  },
  saveBtnLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: {
    color: THEME_TEXT_DARK,
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "KotraHope",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 40,
  

    fontFamily: 'KotraHope',},
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
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  

    fontFamily: 'KotraHope',},
  recordDuration: {
    fontSize: 18,
    color: "#666",
    marginTop: 4,
  

    fontFamily: 'KotraHope',},
  recordNotes: {
    fontSize: 18,
    color: "#999",
    marginTop: 8,
  

    fontFamily: 'KotraHope',},
  addRecordButton: {
    backgroundColor: THEME_YELLOW,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 20,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: THEME_YELLOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  addRecordButtonDisabled: {
    opacity: 0.5,
    backgroundColor: "#E0E0E0",
  },
  addRecordButtonText: {
    color: THEME_TEXT_DARK,
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "KotraHope",
  },
  recordsScrollView: {
    flex: 1,
  },
  recordsContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  recordSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFDE7",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: THEME_YELLOW,
  },
  recordSummaryText: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME_TEXT_DARK,
    fontFamily: "KotraHope",
  },
  recordSummaryDuration: {
    fontWeight: "700",
    fontFamily: "KotraHope",
  },
  recordSummaryTime: {
    fontSize: 20,
    fontWeight: "600",
    color: THEME_TEXT_DARK,
    fontFamily: "KotraHope",
  },
  recordsList: {
    gap: 10,
  },
  recordItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  autoRecordItem: {
    backgroundColor: "#FFFDE7",
    borderLeftWidth: 4,
    borderLeftColor: THEME_YELLOW,
  },
  manualRecordItem: {
    backgroundColor: "#fff",
    borderLeftWidth: 4,
    borderLeftColor: "#E0E0E0",
  },
  recordItemContent: {
    flex: 1,
  },
  recordSourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  recordSourceLabel: {
    fontSize: 11,
    color: "#888",
    fontFamily: "KotraHope",
  },
  recordItemType: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "KotraHope",
  },
  autoRecordType: {
    color: THEME_TEXT_DARK,
    fontFamily: "KotraHope",
  },
  manualRecordType: {
    color: THEME_TEXT_DARK,
    fontFamily: "KotraHope",
  },
  recordItemDuration: {
    fontSize: 18,
    fontFamily: "KotraHope",
  },
  autoRecordDuration: {
    color: "#666",
    fontFamily: "KotraHope",
  },
  manualRecordDuration: {
    color: "#666",
    fontFamily: "KotraHope",
  },
  recordActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    padding: 6,
  },
  emptyRecords: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyRecordsIconWrap: {
    marginBottom: 12,
  },
  emptyRecordsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME_TEXT_DARK,
    marginBottom: 6,
    fontFamily: "KotraHope",
  },
  emptyRecordsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontFamily: "KotraHope",
  },
  monthModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  monthModalContent: {
    backgroundColor: THEME_CREAM,
    borderRadius: 20,
    padding: 25,
    width: "80%",
  },
  monthModalTitle: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
    color: THEME_TEXT_DARK,
    fontFamily: "KotraHope",
  },
  yearRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    gap: 16,
  },
  yearArrow: {
    padding: 8,
  },
  yearText: {
    fontSize: 20,
    fontWeight: "600",
    color: THEME_TEXT_DARK,
    fontFamily: "KotraHope",
    minWidth: 80,
    textAlign: "center",
  },
  monthModalTodayBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255, 213, 79, 0.3)",
  },
  monthModalTodayBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME_TEXT_DARK,
    fontFamily: "KotraHope",
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
    backgroundColor: "#fff",
    alignItems: "center",
    marginBottom: 10,
  },
  monthBtnActive: {
    backgroundColor: THEME_YELLOW,
  },
  monthBtnText: {
    fontSize: 18,
    color: THEME_TEXT_DARK,
    fontFamily: "KotraHope",
  },
  monthBtnTextActive: {
    color: THEME_TEXT_DARK,
    fontWeight: "600",
    fontFamily: "KotraHope",
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
    backgroundColor: THEME_YELLOW,
    alignItems: "center",
    marginHorizontal: 5,
  },
  monthModalBtnCancel: {
    backgroundColor: "#999",
  },
  monthModalBtnText: {
    color: THEME_TEXT_DARK,
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "KotraHope",
  },
});
