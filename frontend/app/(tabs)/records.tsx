import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput,
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  ScrollView,
  Modal,
  Alert,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface WorkoutRecord {
  id: string;
  date: string; // YYYY-MM-DD 형식
  duration: number; // 분 단위
  type: string;
  calories?: number;
  notes?: string;
}

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasWorkout: boolean;
  workoutCount: number;
}

export default function RecordsScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [workoutRecords, setWorkoutRecords] = useState<WorkoutRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMonthYearModal, setShowMonthYearModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDayRecords, setSelectedDayRecords] = useState<WorkoutRecord[]>([]);
  const [editingRecord, setEditingRecord] = useState<WorkoutRecord | null>(null);

  // 샘플 데이터 로드
  useEffect(() => {
    loadSampleData();
  }, []);

  const loadSampleData = () => {
    const sampleRecords: WorkoutRecord[] = [
      { id: "1", date: "2024-12-15", duration: 30, type: "러닝", calories: 300, notes: "공원에서 조깅" },
      { id: "2", date: "2024-12-14", duration: 45, type: "헬스", calories: 400, notes: "상체 운동" },
      { id: "3", date: "2024-12-13", duration: 20, type: "요가", calories: 150, notes: "아침 요가" },
      { id: "4", date: "2024-12-12", duration: 60, type: "사이클링", calories: 500, notes: "강변 자전거" },
      { id: "5", date: "2024-12-10", duration: 25, type: "러닝", calories: 250, notes: "저녁 러닝" },
    ];
    setWorkoutRecords(sampleRecords);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: CalendarDay[] = [];

    // 이전 달의 마지막 날들
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: prevMonth.getDate() - i,
        isCurrentMonth: false,
        isToday: false,
        hasWorkout: false,
        workoutCount: 0
      });
    }

    // 현재 달의 날들
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const dayRecords = workoutRecords.filter(record => record.date === dateStr);
      
      days.push({
        date: day,
        isCurrentMonth: true,
        isToday: today.getDate() === day && today.getMonth() === month && today.getFullYear() === year,
        hasWorkout: dayRecords.length > 0,
        workoutCount: dayRecords.length
      });
    }

    // 다음 달의 첫 날들 (캘린더를 6주로 맞추기 위해)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: day,
        isCurrentMonth: false,
        isToday: false,
        hasWorkout: false,
        workoutCount: 0
      });
    }

    return days;
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

  const handleDatePress = (day: CalendarDay) => {
    if (!day.isCurrentMonth) return;
    
    const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.date.toString().padStart(2, '0')}`;
    const dayRecords = workoutRecords.filter(record => record.date === dateStr);
    
    setSelectedDate(dateStr);
    setSelectedDayRecords(dayRecords);
    
    if (dayRecords.length > 0) {
      setShowDetailModal(true);
    } else {
      // 바로 운동 기록 추가 모달 열기
      setShowAddModal(true);
    }
  };

  const addWorkoutRecord = (record: Omit<WorkoutRecord, 'id'>) => {
    const newRecord: WorkoutRecord = {
      ...record,
      id: Date.now().toString()
    };
    // 전체 운동 기록에 추가
    setWorkoutRecords(prev => [...prev, newRecord]);
    
    // 현재 선택된 날짜와 같은 날짜라면 selectedDayRecords에도 추가
    if (selectedDate && record.date === selectedDate) {
      setSelectedDayRecords(prev => [...prev, newRecord]);
    }
    
    setShowAddModal(false);
  };

  const deleteWorkoutRecord = (id: string) => {
    console.log('삭제 버튼 클릭됨, ID:', id);
    
    const performDelete = () => {
      console.log('삭제 확인됨, 삭제 실행:', id);
      
      // 함수형 업데이트로 최신 상태 사용
      setWorkoutRecords(prev => {
        const updatedRecords = prev.filter(record => record.id !== id);
        console.log('삭제 전:', prev.length, '-> 삭제 후:', updatedRecords.length);
        return updatedRecords;
      });
      
      setSelectedDayRecords(prev => {
        const updatedDayRecords = prev.filter(record => record.id !== id);
        console.log('선택된 날짜 기록 - 삭제 전:', prev.length, '-> 삭제 후:', updatedDayRecords.length);
        
        // 기록이 없으면 모달 닫기
        if (updatedDayRecords.length === 0) {
          setShowDetailModal(false);
        }
        
        return updatedDayRecords;
      });
    };
    
    // 웹 환경에서는 window.confirm 사용
    if (Platform.OS === 'web') {
      const confirmed = window.confirm("이 운동 기록을 삭제하시겠습니까?");
      if (confirmed) {
        performDelete();
      }
    } else {
      // 앱 환경에서는 Alert.alert 사용
      Alert.alert(
        "기록 삭제",
        "이 운동 기록을 삭제하시겠습니까?",
        [
          { 
            text: "취소", 
            style: "cancel"
          },
          { 
            text: "삭제", 
            style: "destructive",
            onPress: performDelete
          }
        ]
      );
    }
  };

  const getMonthName = (date: Date) => {
    const months = [
      "1월", "2월", "3월", "4월", "5월", "6월",
      "7월", "8월", "9월", "10월", "11월", "12월"
    ];
    return months[date.getMonth()];
  };

  const getWorkoutTypeIcon = (type: string) => {
    switch (type) {
      case "러닝": return "🏃‍♂️";
      case "헬스": return "💪";
      case "요가": return "🧘‍♀️";
      case "사이클링": return "🚴‍♂️";
      case "수영": return "🏊‍♂️";
      default: return "🏃‍♂️";
    }
  };

  const getWorkoutSummary = (dateStr: string) => {
    const dayRecords = workoutRecords.filter(record => record.date === dateStr);
    if (dayRecords.length === 0) return null;
    
    // 최대 10개까지 표시, 초과시 "..." 추가
    const displayRecords = dayRecords.slice(0, 10);
    const summary = displayRecords.map(record => `${record.type} ${record.duration}분`).join('\n');
    
    if (dayRecords.length > 10) {
      return summary + '\n...';
    }
    
    return summary;
  };

  const handleMonthYearSelect = (year: number, month: number) => {
    const newDate = new Date(year, month);
    setCurrentDate(newDate);
    setShowMonthYearModal(false);
  };

  const handleEditRecord = (record: WorkoutRecord) => {
    setEditingRecord(record);
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleUpdateRecord = (updatedRecord: Omit<WorkoutRecord, 'id'>) => {
    if (!editingRecord) return;

    const recordToUpdate: WorkoutRecord = {
      ...updatedRecord,
      id: editingRecord.id
    };

    // 전체 기록 업데이트
    setWorkoutRecords(prev => 
      prev.map(record => record.id === editingRecord.id ? recordToUpdate : record)
    );

    // 선택된 날짜의 기록도 업데이트
    setSelectedDayRecords(prev => 
      prev.map(record => record.id === editingRecord.id ? recordToUpdate : record)
    );

    setShowEditModal(false);
    setEditingRecord(null);
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="menu" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>{getMonthName(currentDate)}</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.searchButton}>
              <Ionicons name="search" size={20} color="#666" />
            </TouchableOpacity>
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeText}>{new Date().getDate()}</Text>
            </View>
          </View>
        </View>

        {/* 캘린더 네비게이션 */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => navigateMonth('prev')}>
            <Ionicons name="chevron-back" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowMonthYearModal(true)}>
            <Text style={styles.monthYear}>
              {currentDate.getFullYear()}년 {getMonthName(currentDate)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateMonth('next')}>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* 캘린더 */}
        <View style={styles.calendar}>
          {/* 요일 헤더 */}
          <View style={styles.weekHeader}>
            {weekDays.map((day, index) => (
              <Text key={index} style={[
                styles.weekDay,
                index === 0 && styles.sunday,
                index === 6 && styles.saturday
              ]}>
                {day}
              </Text>
            ))}
          </View>

          {/* 날짜 그리드 */}
          <View style={styles.daysGrid}>
            {days.map((day, index) => {
              const dateStr = day.isCurrentMonth 
                ? `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.date.toString().padStart(2, '0')}`
                : '';
              const workoutSummary = day.isCurrentMonth ? getWorkoutSummary(dateStr) : null;
              
  return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    !day.isCurrentMonth && styles.otherMonthDay,
                    day.isToday && styles.todayDay,
                    day.hasWorkout && styles.workoutDay
                  ]}
                  onPress={() => handleDatePress(day)}
                >
                  <Text style={[
                    styles.dayText,
                    !day.isCurrentMonth && styles.otherMonthText,
                    day.isToday && styles.todayText,
                    day.hasWorkout && styles.workoutText
                  ]}>
                    {day.date}
                  </Text>
                  {day.hasWorkout && (
                    <View style={styles.workoutIndicator}>
                      <Text style={styles.workoutCount}>{day.workoutCount}</Text>
                    </View>
                  )}
                  {workoutSummary && (
                    <Text style={styles.workoutSummary} numberOfLines={10}>
                      {workoutSummary}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
    </View>

      </ScrollView>

      {/* 운동 기록 추가 모달 */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <AddWorkoutModal
          selectedDate={selectedDate || new Date().toISOString().split('T')[0]}
          onSave={addWorkoutRecord}
          onClose={() => setShowAddModal(false)}
        />
      </Modal>

      {/* 운동 기록 상세 모달 */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <WorkoutDetailModal
          date={selectedDate || ''}
          records={selectedDayRecords}
          onDelete={deleteWorkoutRecord}
          onClose={() => setShowDetailModal(false)}
          onAddNew={() => {
            setShowDetailModal(false);
            setShowAddModal(true);
          }}
          onEdit={handleEditRecord}
        />
      </Modal>

      {/* 월/연도 선택 모달 */}
      <Modal
        visible={showMonthYearModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowMonthYearModal(false)}
      >
        <MonthYearPickerModal
          currentDate={currentDate}
          onSelect={handleMonthYearSelect}
          onClose={() => setShowMonthYearModal(false)}
        />
      </Modal>

      {/* 운동 기록 편집 모달 */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowEditModal(false);
          setEditingRecord(null);
        }}
      >
        <EditWorkoutModal
          record={editingRecord}
          onSave={handleUpdateRecord}
          onClose={() => {
            setShowEditModal(false);
            setEditingRecord(null);
          }}
        />
      </Modal>
    </SafeAreaView>
  );
}

// 운동 기록 추가 모달 컴포넌트
interface AddWorkoutModalProps {
  selectedDate: string;
  onSave: (record: Omit<WorkoutRecord, 'id'>) => void;
  onClose: () => void;
}

const AddWorkoutModal: React.FC<AddWorkoutModalProps> = ({ selectedDate, onSave, onClose }) => {
  const [workoutType, setWorkoutType] = useState("러닝");
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  const [notes, setNotes] = useState("");

  const workoutTypes = ["러닝", "헬스", "요가", "사이클링", "수영", "기타"];

  const handleSave = () => {
    if (!duration || isNaN(Number(duration))) {
      Alert.alert("오류", "올바른 운동 시간을 입력해주세요.");
      return;
    }

    const record: Omit<WorkoutRecord, 'id'> = {
      date: selectedDate,
      duration: Number(duration),
      type: workoutType,
      calories: calories ? Number(calories) : undefined,
      notes: notes || undefined
    };

    onSave(record);
  };

  return (
    <SafeAreaView style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>운동 기록 추가</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalContent}>
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>날짜</Text>
          <Text style={styles.dateDisplay}>{selectedDate}</Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>운동 타입</Text>
          <View style={styles.typeSelector}>
            {workoutTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeOption,
                  workoutType === type && styles.selectedType
                ]}
                onPress={() => setWorkoutType(type)}
              >
                <Text style={[
                  styles.typeOptionText,
                  workoutType === type && styles.selectedTypeText
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>운동 시간 (분)</Text>
          <View style={styles.timeInput}>
            <TextInput
              style={styles.textInput}
              value={duration}
              onChangeText={(text) => {
                // 빈 문자열이면 완전히 비우기
                setDuration(text === '' ? '' : text);
              }}
              keyboardType="numeric"
              placeholder="운동 시간을 입력하세요"
              selectTextOnFocus={true}
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>칼로리 (선택사항)</Text>
          <View style={styles.timeInput}>
            <TextInput
              style={styles.textInput}
              value={calories}
              onChangeText={(text) => {
                // 빈 문자열이면 완전히 비우기
                setCalories(text === '' ? '' : text);
              }}
              keyboardType="numeric"
              placeholder="칼로리를 입력하세요"
              selectTextOnFocus={true}
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>메모 (선택사항)</Text>
          <View style={styles.timeInput}>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={notes}
              onChangeText={(text) => {
                // 빈 문자열이면 완전히 비우기
                setNotes(text === '' ? '' : text);
              }}
              placeholder="메모를 입력하세요"
              multiline
              numberOfLines={3}
              selectTextOnFocus={true}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.modalFooter}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>저장</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// 운동 기록 편집 모달 컴포넌트
interface EditWorkoutModalProps {
  record: WorkoutRecord | null;
  onSave: (record: Omit<WorkoutRecord, 'id'>) => void;
  onClose: () => void;
}

const EditWorkoutModal: React.FC<EditWorkoutModalProps> = ({ record, onSave, onClose }) => {
  const [workoutType, setWorkoutType] = useState(record?.type || "러닝");
  const [duration, setDuration] = useState(record?.duration.toString() || "");
  const [calories, setCalories] = useState(record?.calories?.toString() || "");
  const [notes, setNotes] = useState(record?.notes || "");

  const workoutTypes = ["러닝", "헬스", "요가", "사이클링", "수영", "기타"];

  useEffect(() => {
    if (record) {
      setWorkoutType(record.type);
      setDuration(record.duration.toString());
      setCalories(record.calories?.toString() || "");
      setNotes(record.notes || "");
    }
  }, [record]);

  const handleSave = () => {
    if (!duration || isNaN(Number(duration))) {
      Alert.alert("오류", "올바른 운동 시간을 입력해주세요.");
      return;
    }

    const updatedRecord: Omit<WorkoutRecord, 'id'> = {
      date: record?.date || "",
      duration: Number(duration),
      type: workoutType,
      calories: calories ? Number(calories) : undefined,
      notes: notes || undefined
    };

    onSave(updatedRecord);
  };

  if (!record) return null;

  return (
    <SafeAreaView style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>운동 기록 수정</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalContent}>
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>날짜</Text>
          <Text style={styles.dateDisplay}>{record.date}</Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>운동 타입</Text>
          <View style={styles.typeSelector}>
            {workoutTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeOption,
                  workoutType === type && styles.selectedType
                ]}
                onPress={() => setWorkoutType(type)}
              >
                <Text style={[
                  styles.typeOptionText,
                  workoutType === type && styles.selectedTypeText
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>운동 시간 (분)</Text>
          <View style={styles.timeInput}>
            <TextInput
              style={styles.textInput}
              value={duration}
              onChangeText={(text) => {
                setDuration(text === '' ? '' : text);
              }}
              keyboardType="numeric"
              placeholder="운동 시간을 입력하세요"
              selectTextOnFocus={true}
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>칼로리 (선택사항)</Text>
          <View style={styles.timeInput}>
            <TextInput
              style={styles.textInput}
              value={calories}
              onChangeText={(text) => {
                setCalories(text === '' ? '' : text);
              }}
              keyboardType="numeric"
              placeholder="칼로리를 입력하세요"
              selectTextOnFocus={true}
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>메모 (선택사항)</Text>
          <View style={styles.timeInput}>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={notes}
              onChangeText={(text) => {
                setNotes(text === '' ? '' : text);
              }}
              placeholder="메모를 입력하세요"
              multiline
              numberOfLines={3}
              selectTextOnFocus={true}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.modalFooter}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>수정 저장</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// 운동 기록 상세 모달 컴포넌트
interface WorkoutDetailModalProps {
  date: string;
  records: WorkoutRecord[];
  onDelete: (id: string) => void;
  onClose: () => void;
  onAddNew: () => void;
  onEdit: (record: WorkoutRecord) => void;
}

const WorkoutDetailModal: React.FC<WorkoutDetailModalProps> = ({ 
  date, records, onDelete, onClose, onAddNew, onEdit 
}) => {
  const getWorkoutTypeIcon = (type: string) => {
    switch (type) {
      case "러닝": return "🏃‍♂️";
      case "헬스": return "💪";
      case "요가": return "🧘‍♀️";
      case "사이클링": return "🚴‍♂️";
      case "수영": return "🏊‍♂️";
      default: return "🏃‍♂️";
    }
  };

  console.log('WorkoutDetailModal 렌더링, records 개수:', records.length);

  return (
    <SafeAreaView style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>{date}</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalContent}>
        {records.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#666', fontSize: 16 }}>운동 기록이 없습니다</Text>
          </View>
        ) : (
          records.map((record) => (
          <TouchableOpacity
            key={record.id}
            style={styles.recordCard}
            onPress={() => onEdit(record)}
            activeOpacity={0.7}
          >
            <View style={styles.recordHeader}>
              <View style={styles.recordTypeInfo}>
                <Text style={styles.recordEmoji}>{getWorkoutTypeIcon(record.type)}</Text>
                <View>
                  <Text style={styles.recordType}>{record.type}</Text>
                  <Text style={styles.recordDuration}>{record.duration}분</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  console.log('휴지통 아이콘 클릭됨, 기록 ID:', record.id);
                  onDelete(record.id);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="trash" size={20} color="#f44336" />
              </TouchableOpacity>
            </View>
            
            {record.calories && (
              <Text style={styles.recordCalories}>🔥 {record.calories} 칼로리</Text>
            )}
            
            {record.notes && (
              <Text style={styles.recordNotes}>{record.notes}</Text>
            )}
          </TouchableOpacity>
        )))}
      </ScrollView>

      {/* 운동 기록 추가 버튼 */}
      <TouchableOpacity style={styles.addNewButton} onPress={onAddNew}>
        <Ionicons name="add" size={24} color="#4CAF50" />
        <Text style={styles.addNewText}>+ 운동 기록 추가</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  menuButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchButton: {
    padding: 8,
  },
  dateBadge: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  dateBadgeText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  monthYear: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  calendar: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: 10,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    paddingVertical: 8,
  },
  sunday: {
    color: "#f44336",
  },
  saturday: {
    color: "#2196F3",
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
    marginVertical: 2,
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  todayDay: {
    backgroundColor: "#4CAF50",
  },
  workoutDay: {
    backgroundColor: "#e8f5e8",
  },
  dayText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  otherMonthText: {
    color: "#ccc",
  },
  todayText: {
    color: "white",
    fontWeight: "bold",
  },
  workoutText: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  workoutIndicator: {
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
  workoutCount: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  workoutSummary: {
    fontSize: 7,
    color: "#666",
    textAlign: "center",
    marginTop: 2,
    fontWeight: "500",
    lineHeight: 9,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
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
  inputSection: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  dateDisplay: {
    fontSize: 18,
    color: "#666",
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "white",
    borderRadius: 10,
  },
  typeSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  typeOption: {
    backgroundColor: "white",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedType: {
    borderColor: "#4CAF50",
    backgroundColor: "#f0f8f0",
  },
  typeOptionText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  selectedTypeText: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  timeInput: {
    backgroundColor: "white",
    borderRadius: 10,
  },
  textInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 15,
    color: "#333",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  modalFooter: {
    padding: 20,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  recordCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  recordTypeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  recordType: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  recordDuration: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  recordCalories: {
    fontSize: 14,
    color: "#FF9800",
    marginBottom: 10,
  },
  recordNotes: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  // 월/연도 선택 모달 스타일
  monthYearModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  monthYearModalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    width: "80%",
    maxWidth: 300,
  },
  monthYearModalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  yearSelector: {
    marginBottom: 20,
  },
  yearSelectorTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  yearGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  yearButton: {
    width: "30%",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  selectedYearButton: {
    backgroundColor: "#4CAF50",
  },
  yearButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  selectedYearButtonText: {
    color: "white",
    fontWeight: "600",
  },
  monthSelector: {
    marginBottom: 20,
  },
  monthSelectorTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  monthButton: {
    width: "22%",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
    alignItems: "center",
  },
  selectedMonthButton: {
    backgroundColor: "#4CAF50",
  },
  monthButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
  },
  selectedMonthButtonText: {
    color: "white",
    fontWeight: "600",
  },
  monthYearModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  monthYearModalButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginHorizontal: 5,
  },
  monthYearModalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  addNewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 20,
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
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#fff5f5",
  },
});

// 월/연도 선택 모달 컴포넌트
interface MonthYearPickerModalProps {
  currentDate: Date;
  onSelect: (year: number, month: number) => void;
  onClose: () => void;
}

const MonthYearPickerModal: React.FC<MonthYearPickerModalProps> = ({ 
  currentDate, onSelect, onClose 
}) => {
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  const months = [
    "1월", "2월", "3월", "4월", "5월", "6월",
    "7월", "8월", "9월", "10월", "11월", "12월"
  ];

  const handleConfirm = () => {
    onSelect(selectedYear, selectedMonth);
  };

  return (
    <View style={styles.monthYearModalOverlay}>
      <View style={styles.monthYearModalContent}>
        <Text style={styles.monthYearModalTitle}>월/연도 선택</Text>
        
        {/* 연도 선택 */}
        <View style={styles.yearSelector}>
          <Text style={styles.yearSelectorTitle}>연도</Text>
          <View style={styles.yearGrid}>
            {years.map((year) => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.yearButton,
                  selectedYear === year && styles.selectedYearButton
                ]}
                onPress={() => setSelectedYear(year)}
              >
                <Text style={[
                  styles.yearButtonText,
                  selectedYear === year && styles.selectedYearButtonText
                ]}>
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 월 선택 */}
        <View style={styles.monthSelector}>
          <Text style={styles.monthSelectorTitle}>월</Text>
          <View style={styles.monthGrid}>
            {months.map((month, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.monthButton,
                  selectedMonth === index && styles.selectedMonthButton
                ]}
                onPress={() => setSelectedMonth(index)}
              >
                <Text style={[
                  styles.monthButtonText,
                  selectedMonth === index && styles.selectedMonthButtonText
                ]}>
                  {month}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 버튼 */}
        <View style={styles.monthYearModalButtons}>
          <TouchableOpacity 
            style={[styles.monthYearModalButton, { backgroundColor: "#666" }]}
            onPress={onClose}
          >
            <Text style={styles.monthYearModalButtonText}>취소</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.monthYearModalButton}
            onPress={handleConfirm}
          >
            <Text style={styles.monthYearModalButtonText}>확인</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};