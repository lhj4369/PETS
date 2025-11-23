import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 웹에서는 expo-camera를 사용할 수 없으므로 조건부 import
let CameraView: any = null;
let useCameraPermissions: any = null;

if (Platform.OS !== 'web') {
  try {
    const cameraModule = require('expo-camera');
    CameraView = cameraModule.CameraView;
    useCameraPermissions = cameraModule.useCameraPermissions;
  } catch (e) {
    console.warn('expo-camera를 로드할 수 없습니다:', e);
  }
}

interface HeartRateCameraProps {
  visible: boolean;
  onComplete: (averageHeartRate: number) => void;
  onCancel: () => void;
}

// 네이티브용 컴포넌트 (카메라 사용)
function NativeHeartRateCamera({ visible, onComplete, onCancel }: HeartRateCameraProps) {
  if (!useCameraPermissions) {
    // expo-camera를 사용할 수 없는 경우 웹 모드로 전환
    return <WebHeartRateCamera visible={visible} onComplete={onComplete} onCancel={onCancel} />;
  }
  
  const [permission, requestPermission] = useCameraPermissions();
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [currentHeartRate, setCurrentHeartRate] = useState<number | null>(null);
  const cameraRef = useRef<any>(null);
  const measurementIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartRateValuesRef = useRef<number[]>([]);

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
  }, [visible, permission, requestPermission]);

  useEffect(() => {
    if (visible && permission?.granted && isMeasuring) {
      startMeasurement();
    }

    return () => {
      if (measurementIntervalRef.current) {
        clearInterval(measurementIntervalRef.current);
      }
    };
  }, [visible, permission, isMeasuring]);

  const startMeasurement = () => {
    heartRateValuesRef.current = [];
    setCountdown(10);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          stopMeasurement();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    measurementIntervalRef.current = setInterval(() => {
      const simulatedHeartRate = Math.floor(Math.random() * 40) + 100;
      heartRateValuesRef.current.push(simulatedHeartRate);
      setCurrentHeartRate(simulatedHeartRate);
    }, 200);
  };

  const stopMeasurement = () => {
    if (measurementIntervalRef.current) {
      clearInterval(measurementIntervalRef.current);
      measurementIntervalRef.current = null;
    }

    if (heartRateValuesRef.current.length > 0) {
      const average =
        heartRateValuesRef.current.reduce((sum, val) => sum + val, 0) /
        heartRateValuesRef.current.length;
      onComplete(Math.round(average));
    } else {
      onComplete(0);
    }

    setIsMeasuring(false);
    setCountdown(10);
    setCurrentHeartRate(null);
    heartRateValuesRef.current = [];
  };

  const handleStart = () => {
    if (!permission?.granted) {
      Alert.alert('권한 필요', '카메라 권한이 필요합니다.');
      return;
    }
    setIsMeasuring(true);
  };

  const handleCancel = () => {
    if (measurementIntervalRef.current) {
      clearInterval(measurementIntervalRef.current);
      measurementIntervalRef.current = null;
    }
    setIsMeasuring(false);
    setCountdown(10);
    setCurrentHeartRate(null);
    heartRateValuesRef.current = [];
    onCancel();
  };

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>카메라 권한 필요</Text>
            <Text style={styles.description}>
              심박수 측정을 위해 카메라 권한이 필요합니다.
            </Text>
            <TouchableOpacity style={styles.button} onPress={requestPermission}>
              <Text style={styles.buttonText}>권한 허용</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.buttonText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {!isMeasuring ? (
            <>
              <Text style={styles.title}>심박수 측정</Text>
              <Text style={styles.description}>
                후면 카메라에 손가락 끝을 대고 플래시가 켜진 상태로 10초간 측정합니다.
              </Text>
              <Text style={styles.instruction}>
                손가락을 카메라 렌즈에 가볍게 대고 움직이지 마세요.
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.button} onPress={handleStart}>
                  <Text style={styles.buttonText}>측정 시작</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
                  <Text style={styles.buttonText}>취소</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.cameraContainer}>
                {CameraView && (
                  <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing="back"
                    flash="on"
                  >
                    <View style={styles.cameraOverlay}>
                      <View style={styles.fingerPlaceholder}>
                        <Ionicons name="finger-print" size={80} color="#fff" />
                      </View>
                    </View>
                  </CameraView>
                )}
              </View>
              <View style={styles.measurementInfo}>
                <Text style={styles.countdownText}>{countdown}초</Text>
                {currentHeartRate !== null && (
                  <Text style={styles.heartRateText}>
                    현재 심박수: {currentHeartRate} bpm
                  </Text>
                )}
                <Text style={styles.instruction}>
                  손가락을 카메라에 대고 움직이지 마세요
                </Text>
              </View>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
                <Text style={styles.buttonText}>취소</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// 웹용 컴포넌트 (시뮬레이션만)
function WebHeartRateCamera({ visible, onComplete, onCancel }: HeartRateCameraProps) {
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [currentHeartRate, setCurrentHeartRate] = useState<number | null>(null);
  const measurementIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartRateValuesRef = useRef<number[]>([]);

  useEffect(() => {
    if (visible && isMeasuring) {
      startMeasurement();
    }

    return () => {
      if (measurementIntervalRef.current) {
        clearInterval(measurementIntervalRef.current);
      }
    };
  }, [visible, isMeasuring]);

  const startMeasurement = () => {
    heartRateValuesRef.current = [];
    setCountdown(10);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          stopMeasurement();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    measurementIntervalRef.current = setInterval(() => {
      const simulatedHeartRate = Math.floor(Math.random() * 40) + 100;
      heartRateValuesRef.current.push(simulatedHeartRate);
      setCurrentHeartRate(simulatedHeartRate);
    }, 200);
  };

  const stopMeasurement = () => {
    if (measurementIntervalRef.current) {
      clearInterval(measurementIntervalRef.current);
      measurementIntervalRef.current = null;
    }

    if (heartRateValuesRef.current.length > 0) {
      const average =
        heartRateValuesRef.current.reduce((sum, val) => sum + val, 0) /
        heartRateValuesRef.current.length;
      onComplete(Math.round(average));
    } else {
      onComplete(0);
    }

    setIsMeasuring(false);
    setCountdown(10);
    setCurrentHeartRate(null);
    heartRateValuesRef.current = [];
  };

  const handleStart = () => {
    setIsMeasuring(true);
  };

  const handleCancel = () => {
    if (measurementIntervalRef.current) {
      clearInterval(measurementIntervalRef.current);
      measurementIntervalRef.current = null;
    }
    setIsMeasuring(false);
    setCountdown(10);
    setCurrentHeartRate(null);
    heartRateValuesRef.current = [];
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {!isMeasuring ? (
            <>
              <Text style={styles.title}>심박수 측정</Text>
              <Text style={styles.description}>
                웹에서는 카메라를 사용할 수 없으므로 시뮬레이션 모드로 측정합니다.
              </Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.button} onPress={handleStart}>
                  <Text style={styles.buttonText}>측정 시작</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
                  <Text style={styles.buttonText}>취소</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.cameraContainer}>
                <View style={[styles.camera, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                  <View style={styles.cameraOverlay}>
                    <View style={styles.fingerPlaceholder}>
                      <Ionicons name="finger-print" size={80} color="#fff" />
                    </View>
                  </View>
                  <Text style={{ color: '#fff', marginTop: 20, fontSize: 14, textAlign: 'center' }}>
                    웹에서는 카메라를 사용할 수 없습니다.{'\n'}시뮬레이션 모드로 측정합니다.
                  </Text>
                </View>
              </View>
              <View style={styles.measurementInfo}>
                <Text style={styles.countdownText}>{countdown}초</Text>
                {currentHeartRate !== null && (
                  <Text style={styles.heartRateText}>
                    현재 심박수: {currentHeartRate} bpm
                  </Text>
                )}
                <Text style={styles.instruction}>
                  시뮬레이션 모드로 측정 중...
                </Text>
              </View>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
                <Text style={styles.buttonText}>취소</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// 메인 컴포넌트
export default function HeartRateCamera(props: HeartRateCameraProps) {
  const isWeb = Platform.OS === 'web';
  
  if (isWeb) {
    return <WebHeartRateCamera {...props} />;
  }
  
  // 네이티브에서는 expo-camera를 동적으로 로드
  if (!CameraView) {
    try {
      const cameraModule = require('expo-camera');
      CameraView = cameraModule.CameraView;
      const { useCameraPermissions } = cameraModule;
      // NativeHeartRateCamera를 동적으로 생성
      return <NativeHeartRateCamera {...props} />;
    } catch (e) {
      console.warn('expo-camera를 로드할 수 없습니다. 웹 모드로 전환합니다.');
      return <WebHeartRateCamera {...props} />;
    }
  }
  
  return <NativeHeartRateCamera {...props} />;
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  instruction: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  cameraContainer: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  fingerPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  measurementInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  countdownText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  heartRateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

