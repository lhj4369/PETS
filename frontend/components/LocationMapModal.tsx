import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

// 웹 환경에서는 react-native-maps를 import하지 않음
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;
type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  } catch (error) {
    console.warn('react-native-maps를 로드할 수 없습니다:', error);
  }
}

type AerobicWorkoutMode = 'outdoor' | 'gym' | null;

interface LocationMapModalProps {
  visible: boolean;
  onStart: (workoutMode: AerobicWorkoutMode, selectedGym?: GymPlace | null) => void;
  onClose: () => void;
}

interface GymPlace {
  place_id: string;
  name: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  vicinity?: string;
  rating?: number;
}

export default function LocationMapModal({
  visible,
  onStart,
  onClose,
}: LocationMapModalProps) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gyms, setGyms] = useState<GymPlace[]>([]);
  const [loadingGyms, setLoadingGyms] = useState(false);
  const [selectedGym, setSelectedGym] = useState<GymPlace | null>(null);
  const [workoutMode, setWorkoutMode] = useState<AerobicWorkoutMode>(null);

  useEffect(() => {
    if (visible) {
      loadCurrentLocation();
    } else {
      // 모달이 닫힐 때 상태 초기화
      setLocation(null);
      setRegion(null);
      setError(null);
      setGyms([]);
      setSelectedGym(null);
      setWorkoutMode(null);
    }
  }, [visible]);

  const loadCurrentLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      // 위치 권한 요청
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('위치 권한이 필요합니다.');
        setLoading(false);
        return;
      }

      // 위치 서비스 활성화 확인
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        setError('위치 서비스가 비활성화되어 있습니다.');
        setLoading(false);
        return;
      }

      // 현재 위치 가져오기
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation(currentLocation);

      // 지도 영역 설정
      const newRegion: Region = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.05, // 약 5km (헬스장 검색을 위해 범위 확대)
        longitudeDelta: 0.05,
      };
      setRegion(newRegion);
      
      // 주변 헬스장 검색은 나중에 '헬스장에서 운동' 모드를 선택했을 때만 수행
    } catch (err: any) {
      console.error('위치 로드 실패:', err);
      setError('위치를 가져올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const searchNearbyGyms = async (latitude: number, longitude: number) => {
    try {
      setLoadingGyms(true);
      
      // Google Places API 키 (AndroidManifest.xml에서 가져오거나 환경변수에서)
      // 실제로는 환경변수나 설정에서 가져와야 합니다
      const apiKey = 'AIzaSyDpUsPiMR85NF8fcZDxQ6ublS505AGBPT8'; // TODO: 환경변수로 이동
      
      // Google Places Nearby Search API 호출
      // 헬스장 관련 키워드: gym, fitness_center, health_club
      const radius = 5000; // 5km 반경
      const types = ['gym', 'fitness_center', 'health_club'];
      
      const allGyms: GymPlace[] = [];
      
      // 여러 타입의 헬스장을 검색
      for (const type of types) {
        try {
          const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${apiKey}&language=ko`;
          
          const response = await fetch(url);
          const data = await response.json();
          
          if (data.status === 'OK' && data.results) {
            // 중복 제거를 위해 place_id로 필터링
            data.results.forEach((place: GymPlace) => {
              if (!allGyms.find(g => g.place_id === place.place_id)) {
                allGyms.push(place);
              }
            });
          }
        } catch (err) {
          console.warn(`${type} 검색 실패:`, err);
        }
      }
      
      setGyms(allGyms);
    } catch (err: any) {
      console.error('헬스장 검색 실패:', err);
      // 헬스장 검색 실패는 에러로 표시하지 않음 (선택적 기능)
    } finally {
      setLoadingGyms(false);
    }
  };

  // 두 지점 간 거리 계산 (미터 단위)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371000; // 지구 반지름 (미터)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // 헬스장 마커 클릭 핸들러
  const handleGymMarkerPress = (gym: GymPlace) => {
    if (!location) return;

    const distance = calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      gym.geometry.location.lat,
      gym.geometry.location.lng
    );

    // 10m 이내인지 확인
    if (distance <= 10) {
      setSelectedGym(gym);
      Alert.alert(
        '헬스장 선택됨',
        `${gym.name}\n거리: ${distance.toFixed(1)}m\n\n이 헬스장에서 운동을 시작합니다.`,
        [{ text: '확인' }]
      );
    } else {
      Alert.alert(
        '거리가 너무 멉니다',
        `${gym.name}\n거리: ${distance.toFixed(1)}m\n\n헬스장에서 10m 이내에 있어야 운동을 시작할 수 있습니다.`,
        [{ text: '확인' }]
      );
    }
  };

  const handleStart = () => {
    if (!location) {
      Alert.alert('알림', '위치 정보를 불러오는 중입니다. 잠시만 기다려주세요.');
      return;
    }

    // 운동 모드 선택 확인
    if (!workoutMode) {
      Alert.alert('알림', '운동 방식을 선택해주세요.');
      return;
    }

    // '헬스장에서 운동' 모드일 때만 헬스장 선택 확인
    if (workoutMode === 'gym') {
      if (!selectedGym) {
        Alert.alert('알림', '헬스장을 선택해주세요.');
        return;
      }

      // 선택된 헬스장이 여전히 10m 이내인지 확인
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        selectedGym.geometry.location.lat,
        selectedGym.geometry.location.lng
      );

      if (distance > 10) {
        Alert.alert(
          '거리 확인',
          '선택한 헬스장에서 10m 이내에 있어야 운동을 시작할 수 있습니다. 현재 거리: ' +
            distance.toFixed(1) +
            'm'
        );
        return;
      }
    }

    onStart(workoutMode, selectedGym);
  };

  // 선택 가능한 헬스장 필터링 (10m 이내)
  const getSelectableGyms = (): GymPlace[] => {
    if (!location) return [];

    return gyms.filter((gym) => {
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        gym.geometry.location.lat,
        gym.geometry.location.lng
      );
      return distance <= 10;
    });
  };

  // '헬스장에서 운동' 모드 선택 시 헬스장 검색
  useEffect(() => {
    if (workoutMode === 'gym' && location && gyms.length === 0 && !loadingGyms) {
      searchNearbyGyms(
        location.coords.latitude,
        location.coords.longitude
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutMode, location]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color="#2d3436" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>운동 위치 확인</Text>
          <View style={styles.placeholder} />
        </View>

        {/* 지도 영역 */}
        <View style={styles.mapContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2d98da" />
              <Text style={styles.loadingText}>위치 정보를 불러오는 중...</Text>
              {loadingGyms && (
                <Text style={styles.loadingSubText}>주변 헬스장을 검색하는 중...</Text>
              )}
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="location-outline" size={48} color="#e94e77" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadCurrentLocation}
              >
                <Text style={styles.retryButtonText}>다시 시도</Text>
              </TouchableOpacity>
            </View>
          ) : region && MapView ? (
            <>
              <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={region}
                region={region}
                showsUserLocation={true}
                showsMyLocationButton={true}
                followsUserLocation={false}
              >
                {location && Marker && (
                  <Marker
                    coordinate={{
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                    }}
                    title="현재 위치"
                    description="운동을 시작할 위치입니다"
                    pinColor="#2d98da"
                  />
                )}
                {gyms.map((gym) => {
                  const distance = location
                    ? calculateDistance(
                        location.coords.latitude,
                        location.coords.longitude,
                        gym.geometry.location.lat,
                        gym.geometry.location.lng
                      )
                    : Infinity;
                  const isSelectable = distance <= 10;
                  const isSelected = selectedGym?.place_id === gym.place_id;

                  return (
                    <Marker
                      key={gym.place_id}
                      coordinate={{
                        latitude: gym.geometry.location.lat,
                        longitude: gym.geometry.location.lng,
                      }}
                      title={gym.name}
                      description={
                        isSelected
                          ? `선택됨 (${distance.toFixed(1)}m)`
                          : isSelectable
                          ? `${distance.toFixed(1)}m - 선택 가능`
                          : `${distance.toFixed(1)}m - 너무 멉니다`
                      }
                      pinColor={isSelected ? '#27ae60' : isSelectable ? '#e74c3c' : '#95a5a6'}
                      onPress={() => handleGymMarkerPress(gym)}
                    />
                  );
                })}
              </MapView>
              {loadingGyms && (
                <View style={styles.gymLoadingOverlay}>
                  <ActivityIndicator size="small" color="#e74c3c" />
                  <Text style={styles.gymLoadingText}>헬스장 검색 중...</Text>
                </View>
              )}
              {!loadingGyms && gyms.length > 0 && (
                <View style={styles.gymCountBadge}>
                  <Text style={styles.gymCountText}>
                    주변 헬스장 {gyms.length}개
                    {getSelectableGyms().length > 0 && (
                      <Text style={styles.selectableCountText}>
                        {' '}
                        (선택 가능: {getSelectableGyms().length}개)
                      </Text>
                    )}
                  </Text>
                </View>
              )}
              {selectedGym && (
                <View style={styles.selectedGymInfo}>
                  <View style={styles.selectedGymHeader}>
                    <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
                    <Text style={styles.selectedGymTitle}>선택된 헬스장</Text>
                  </View>
                  <Text style={styles.selectedGymName}>{selectedGym.name}</Text>
                  {selectedGym.vicinity && (
                    <Text style={styles.selectedGymAddress}>{selectedGym.vicinity}</Text>
                  )}
                  {location && (
                    <Text style={styles.selectedGymDistance}>
                      거리:{' '}
                      {calculateDistance(
                        location.coords.latitude,
                        location.coords.longitude,
                        selectedGym.geometry.location.lat,
                        selectedGym.geometry.location.lng
                      ).toFixed(1)}
                      m
                    </Text>
                  )}
                  <TouchableOpacity
                    style={styles.deselectButton}
                    onPress={() => setSelectedGym(null)}
                  >
                    <Text style={styles.deselectButtonText}>선택 해제</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : region && Platform.OS === 'web' ? (
            <View style={styles.webMapPlaceholder}>
              <Ionicons name="map-outline" size={64} color="#2d98da" />
              <Text style={styles.webMapText}>
                위치: {location?.coords.latitude.toFixed(6)}, {location?.coords.longitude.toFixed(6)}
              </Text>
              <Text style={styles.webMapSubtext}>
                지도는 모바일 앱에서만 표시됩니다
              </Text>
            </View>
          ) : null}
        </View>

        {/* 하단 버튼 영역 */}
        <View style={styles.footer}>
          {/* 운동 방식 선택 */}
          {!workoutMode && (
            <View style={styles.workoutModeContainer}>
              <Text style={styles.workoutModeTitle}>운동 방식을 선택하세요</Text>
              <View style={styles.workoutModeButtons}>
                <TouchableOpacity
                  style={styles.workoutModeButton}
                  onPress={() => setWorkoutMode('outdoor')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="walk" size={24} color="#2d98da" />
                  <Text style={styles.workoutModeButtonText}>밖에서 운동</Text>
                  <Text style={styles.workoutModeButtonSubtext}>
                    이동 경로 추적{'\n'}300m 이상 시 보상
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.workoutModeButton}
                  onPress={() => setWorkoutMode('gym')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="fitness" size={24} color="#e74c3c" />
                  <Text style={styles.workoutModeButtonText}>헬스장에서 운동</Text>
                  <Text style={styles.workoutModeButtonSubtext}>
                    헬스장 선택 필요{'\n'}10m 이내 유지
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 선택된 모드에 따른 안내 */}
          {workoutMode === 'outdoor' && (
            <View style={styles.infoBox}>
              <Ionicons name="walk" size={20} color="#2d98da" />
              <Text style={styles.infoText}>
                밖에서 운동 모드: 이동 경로가 추적되며, 300m 이상 이동 시 보상이 지급됩니다.
              </Text>
            </View>
          )}

          {workoutMode === 'gym' && !selectedGym && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#636e72" />
              <Text style={styles.infoText}>
                지도에서 10m 이내의 헬스장을 선택해주세요
              </Text>
            </View>
          )}

          {workoutMode === 'gym' && selectedGym && (
            <View style={styles.infoBox}>
              <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
              <Text style={styles.infoText}>
                선택된 헬스장: {selectedGym.name}
              </Text>
            </View>
          )}

          {/* 모드 변경 버튼 */}
          {workoutMode && (
            <TouchableOpacity
              style={styles.changeModeButton}
              onPress={() => {
                setWorkoutMode(null);
                setSelectedGym(null);
              }}
            >
              <Ionicons name="arrow-back" size={16} color="#636e72" />
              <Text style={styles.changeModeButtonText}>운동 방식 다시 선택</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.startButton,
              (!location || loading || !workoutMode || (workoutMode === 'gym' && !selectedGym)) &&
                styles.startButtonDisabled,
            ]}
            onPress={handleStart}
            disabled={
              !location || loading || !workoutMode || (workoutMode === 'gym' && !selectedGym)
            }
            activeOpacity={0.85}
          >
            <Ionicons name="play" size={24} color="#fff" />
            <Text style={styles.startButtonText}>시작하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dfe6e9',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3436',
  },
  placeholder: {
    width: 32,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#636e72',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
    paddingHorizontal: 40,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#636e72',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2d98da',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#dfe6e9',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2d98da',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
    shadowColor: '#2d98da',
    shadowOpacity: 0.24,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 18,
    elevation: 8,
  },
  startButtonDisabled: {
    backgroundColor: '#b2bec3',
    shadowOpacity: 0,
    elevation: 0,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  webMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
    paddingHorizontal: 40,
  },
  webMapText: {
    marginTop: 16,
    fontSize: 16,
    color: '#2d3436',
    fontWeight: '600',
    textAlign: 'center',
  },
  webMapSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#636e72',
    textAlign: 'center',
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 12,
    color: '#636e72',
  },
  gymMarker: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 4,
    borderWidth: 2,
    borderColor: '#e74c3c',
  },
  gymLoadingOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gymLoadingText: {
    fontSize: 12,
    color: '#636e72',
  },
  gymCountBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  gymCountText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  selectableCountText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '400',
  },
  selectedGymInfo: {
    position: 'absolute',
    bottom: 100,
    left: 10,
    right: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#27ae60',
  },
  selectedGymHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  selectedGymTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27ae60',
  },
  selectedGymName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 4,
  },
  selectedGymAddress: {
    fontSize: 13,
    color: '#636e72',
    marginBottom: 4,
  },
  selectedGymDistance: {
    fontSize: 13,
    color: '#2d98da',
    fontWeight: '600',
    marginBottom: 12,
  },
  deselectButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e74c3c',
    borderRadius: 6,
  },
  deselectButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f5f6fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#636e72',
    lineHeight: 18,
  },
  workoutModeContainer: {
    marginBottom: 16,
  },
  workoutModeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 12,
    textAlign: 'center',
  },
  workoutModeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  workoutModeButton: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#dfe6e9',
  },
  workoutModeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginTop: 8,
    marginBottom: 4,
  },
  workoutModeButtonSubtext: {
    fontSize: 11,
    color: '#636e72',
    textAlign: 'center',
    lineHeight: 16,
  },
  changeModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 12,
    paddingVertical: 8,
  },
  changeModeButtonText: {
    fontSize: 13,
    color: '#636e72',
  },
});
