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

interface LocationMapModalProps {
  visible: boolean;
  onStart: () => void;
  onClose: () => void;
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

  useEffect(() => {
    if (visible) {
      loadCurrentLocation();
    } else {
      // 모달이 닫힐 때 상태 초기화
      setLocation(null);
      setRegion(null);
      setError(null);
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
        latitudeDelta: 0.01, // 약 1km
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
    } catch (err: any) {
      console.error('위치 로드 실패:', err);
      setError('위치를 가져올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (location) {
      onStart();
    } else {
      Alert.alert('알림', '위치 정보를 불러오는 중입니다. 잠시만 기다려주세요.');
    }
  };

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
                />
              )}
            </MapView>
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
          <TouchableOpacity
            style={[
              styles.startButton,
              (!location || loading) && styles.startButtonDisabled,
            ]}
            onPress={handleStart}
            disabled={!location || loading}
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
});
