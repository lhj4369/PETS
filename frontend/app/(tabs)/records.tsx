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
          heartRate: r.heartRate ?? null,
          hasReward: r.hasReward ?? false,
          source: r.source ?? determineRecordSource(r),
          createdAt: r.createdAt ?? null,
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
    try {
      // 개발자 모드: 로컬 저장
      if (await AuthManager.isDevMode()) {
        const newRecord: WorkoutRecord = {
          ...record,
          id: Date.now().toString(),
          heartRate: null,
          hasReward: false,
          source: "manual",
          createdAt: new Date().toISOString(),
        };
        
        // AsyncStorage에 저장
        const existingRecords = await AuthManager.getDevWorkoutRecords();
        const updatedRecordsForStorage = [...existingRecords, {
          id: newRecord.id,
          date: newRecord.date,
          duration: newRecord.duration,
          type: newRecord.type,
          notes: newRecord.notes || null,
          heartRate: null,
          hasReward: false,
          source: "manual",
          createdAt: newRecord.createdAt,
        }];
        await AuthManager.setDevWorkoutRecords(updatedRecordsForStorage);
        
        // 로컬 상태 업데이트
        const updatedWorkoutRecords = sortRecordsByCreation([...workoutRecords, newRecord]);
        setWorkoutRecords(updatedWorkoutRecords);
        if (selectedDate && record.date === selectedDate) {
          setSelectedDayRecords(sortRecordsByCreation([...selectedDayRecords, newRecord]));
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
      if (await AuthManager.isDevMode()) {
        const existingRecords = await AuthManager.getDevWorkoutRecords();
        const updatedRecords = existingRecords.map((r: any) =>
          r.id.toString() === id
            ? {
                ...r,
                duration: updates.duration,
                type: updates.type,
              }
            : r
        );

        await AuthManager.setDevWorkoutRecords(updatedRecords);

        const updatedWorkoutRecords = workoutRecords.map((r) =>
          r.id === id
            ? {
                ...r,
                duration: updates.duration,
                type: updates.type,
              }
            : r
        );
        setWorkoutRecords(updatedWorkoutRecords);
        if (selectedDate === targetRecord.date) {
          setSelectedDayRecords((prev) =>
            sortRecordsByCreation(
              prev.map((r) =>
                r.id === id
                  ? {
                      ...r,
                      duration: updates.duration,
                      type: updates.type,
                    }
                  : r
              )
            )
          );
        }
      } else {
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
      }

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
      <View style={styles.mainContainer}>
        {/* 상단: 달력 영역 */}
        <View style={styles.calendarSection}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigateMonth('prev')}>
              <Ionicons name="chevron-back" size={24} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowMonthYearModal(true)}>
              <Text style={styles.monthYear}>
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
                  return canNavigateToMonth(nextMonth) ? "#333" : "#ccc";
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
                const isFuture = dateStr ? isFutureDate(dateStr) : false;
                const isDisabled = !day.isCurrentMonth || isFuture;
                
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.dayCell,
                      !day.isCurrentMonth && styles.otherMonth,
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
                                  <Ionicons name="create-outline" size={20} color="#1976D2" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => deleteWorkoutRecord(record.id)}
                                  style={styles.actionButton}
                                >
                                  <Ionicons name="trash-outline" size={20} color="#f44336" />
                                </TouchableOpacity>
                              </>
                            ) : (
                              <Ionicons name="lock-closed-outline" size={18} color="#78909C" />
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptyRecords}>
                    <Text style={styles.emptyRecordsText}>이 날짜에 운동 기록이 없습니다</Text>
                  </View>
                )}
              </ScrollView>
            ) : (
              <View style={styles.emptyRecords}>
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
        onSave={async (record: WorkoutRecordPayload) => {
          await addWorkoutRecord(record);
          // addWorkoutRecord 내부에서 fetchWorkoutRecords를 호출하므로
          // useEffect가 자동으로 selectedDayRecords를 업데이트함
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
        onClose={() => setShowMonthYearModal(false)}
      />
    </SafeAreaView>
  );
}

// 운동 기록 추가 모달
interface AddWorkoutModalProps {
  visible: boolean;
  selectedDate: string;
  onSave: (record: WorkoutRecordPayload) => void | Promise<void>;
  onClose: () => void;
}

function AddWorkoutModal({ visible, selectedDate, onSave, onClose }: AddWorkoutModalProps) {
  const [type, setType] = useState("유산소");
  const [duration, setDuration] = useState("");

  const handleDurationChange = (text: string) => {
    // 숫자만 허용
    const numericValue = text.replace(/[^0-9]/g, '');
    setDuration(numericValue);
  };

  const handleSave = () => {
    if (!duration || parseInt(duration) <= 0) {
      Alert.alert("오류", "올바른 운동 시간을 입력해주세요.");
      return;
    }

    onSave({
      date: selectedDate,
      duration: parseInt(duration),
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
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.label}>운동 타입</Text>
            <View style={styles.typeContainer}>
              {["유산소", "인터벌", "기타"].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeBtn, 
                    type === t && styles.typeBtnActive,
                    t === "유산소" && type === t && styles.aerobicTypeBtnActive,
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
              placeholder="운동 시간을 입력하세요"
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>저장</Text>
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
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.label}>운동 타입</Text>
            <View style={styles.typeContainer}>
              {["유산소", "인터벌", "기타"].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeBtn, 
                    type === t && styles.typeBtnActive,
                    t === "유산소" && type === t && styles.aerobicTypeBtnActive,
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
              placeholder="운동 시간을 입력하세요"
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
          <Text style={styles.monthModalTitle}>빠른 이동</Text>

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
    paddingTop: 60,
  },
  mainContainer: {
    flex: 1,
    flexDirection: "column",
  },
  calendarSection: {
    flex: 0.53,
    paddingHorizontal: 10,
    paddingTop: 5,
  },
  recordsSection: {
    flex: 0.47,
    backgroundColor: "#f5f5f5",
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  calendar: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 10,
    marginHorizontal: 10,
    marginTop: 0,
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    paddingVertical: 6,
  },
  sunday: {
    color: "#f44336",
  },
  saturday: {
    color: "#0277BD",
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
    borderRadius: 8,
  },
  otherMonth: {
    opacity: 0.3,
  },
  futureDay: {
    opacity: 0.4,
  },
  selectedDay: {
    backgroundColor: "#E3F2FD",
  },
  dayText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  selectedDayText: {
    color: "#1976D2",
    fontWeight: "700",
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
    backgroundColor: "#FFD54F",
  },
  intervalDot: {
    backgroundColor: "#4A90E2",
  },
  otherDot: {
    backgroundColor: "#9E9E9E",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },
  modalBottomSheet: {
    backgroundColor: "#f0f0f0",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "50%",
    minHeight: "45%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#ccc",
    borderRadius: 2,
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
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
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
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
    marginTop: 15,
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
    borderColor: "#1976D2",
    backgroundColor: "#E3F2FD",
  },
  aerobicTypeBtnActive: {
    borderColor: "#4A90E2",
    backgroundColor: "#E3F2FD",
  },
  intervalTypeBtnActive: {
    borderColor: "#FF9500",
    backgroundColor: "#FFF3E0",
  },
  otherTypeBtnActive: {
    borderColor: "#9E9E9E",
    backgroundColor: "#F0F0F0",
  },
  typeBtnText: {
    fontSize: 14,
    color: "#666",
  },
  typeBtnTextActive: {
    color: "#1976D2",
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
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
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
  addRecordButton: {
    backgroundColor: "#E0E0E0",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginHorizontal: 20,
    marginBottom: 15,
    alignItems: "center",
  },
  addRecordButtonDisabled: {
    opacity: 0.5,
  },
  addRecordButtonText: {
    color: "#1976D2",
    fontSize: 16,
    fontWeight: "600",
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
    backgroundColor: "#E3F2FD",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  recordSummaryText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  recordSummaryTime: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
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
    backgroundColor: "#E3F2FD",
  },
  manualRecordItem: {
    backgroundColor: "#ECEFF1",
  },
  recordItemContent: {
    flex: 1,
  },
  recordItemType: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  autoRecordType: {
    color: "#0D47A1",
  },
  manualRecordType: {
    color: "#37474F",
  },
  recordItemDuration: {
    fontSize: 14,
  },
  autoRecordDuration: {
    color: "#1565C0",
  },
  manualRecordDuration: {
    color: "#546E7A",
  },
  recordActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    padding: 6,
  },
  emptyRecords: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyRecordsText: {
    fontSize: 16,
    color: "#999",
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
