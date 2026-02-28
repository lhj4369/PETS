# GPS 연동 가이드

이 앱에 GPS 기능을 추가하는 방법입니다.

## 1. 패키지 설치

```bash
cd frontend
npx expo install expo-location
```

## 2. 권한 설정

### app.json에 권한 추가

```json
{
  "expo": {
    "android": {
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    },
    "ios": {
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "이 앱은 운동 중 위치 정보를 추적하기 위해 위치 권한이 필요합니다.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "이 앱은 운동 중 위치 정보를 추적하기 위해 위치 권한이 필요합니다."
      }
    }
  }
}
```

## 3. 기본 사용 예시

### 현재 위치 가져오기

```typescript
import * as Location from 'expo-location';

// 위치 권한 요청
const getLocationPermission = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('권한 필요', '위치 권한이 필요합니다.');
    return false;
  }
  return true;
};

// 현재 위치 가져오기
const getCurrentLocation = async () => {
  const hasPermission = await getLocationPermission();
  if (!hasPermission) return null;

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    altitude: location.coords.altitude,
    accuracy: location.coords.accuracy,
  };
};
```

### 실시간 위치 추적

```typescript
import * as Location from 'expo-location';

// 위치 추적 시작
const startLocationTracking = async (
  onLocationUpdate: (location: Location.LocationObject) => void
) => {
  const hasPermission = await getLocationPermission();
  if (!hasPermission) return null;

  // 위치 추적 시작
  const subscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 1000, // 1초마다 업데이트
      distanceInterval: 1, // 1미터마다 업데이트
    },
    (location) => {
      onLocationUpdate(location);
    }
  );

  return subscription;
};

// 위치 추적 중지
const stopLocationTracking = (subscription: Location.LocationSubscription) => {
  subscription.remove();
};
```

## 4. 운동 중 거리 계산 예시

```typescript
import * as Location from 'expo-location';

interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
}

class WorkoutLocationTracker {
  private locations: LocationPoint[] = [];
  private subscription: Location.LocationSubscription | null = null;

  // 위치 추적 시작
  async startTracking() {
    const hasPermission = await Location.requestForegroundPermissionsAsync();
    if (hasPermission.status !== 'granted') {
      throw new Error('위치 권한이 필요합니다.');
    }

    this.subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000, // 1초마다
        distanceInterval: 1, // 1미터마다
      },
      (location) => {
        this.locations.push({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: Date.now(),
        });
      }
    );
  }

  // 위치 추적 중지
  stopTracking() {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }

  // 총 이동 거리 계산 (미터)
  calculateTotalDistance(): number {
    if (this.locations.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < this.locations.length; i++) {
      const prev = this.locations[i - 1];
      const curr = this.locations[i];
      totalDistance += this.calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude
      );
    }
    return totalDistance;
  }

  // 두 지점 간 거리 계산 (Haversine 공식)
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // 지구 반지름 (미터)
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // 미터
  }

  // 평균 속도 계산 (m/s)
  calculateAverageSpeed(): number {
    if (this.locations.length < 2) return 0;

    const totalDistance = this.calculateTotalDistance();
    const firstTime = this.locations[0].timestamp;
    const lastTime = this.locations[this.locations.length - 1].timestamp;
    const totalTime = (lastTime - firstTime) / 1000; // 초

    return totalTime > 0 ? totalDistance / totalTime : 0;
  }

  // 위치 기록 초기화
  reset() {
    this.locations = [];
  }

  // 위치 기록 가져오기
  getLocations(): LocationPoint[] {
    return [...this.locations];
  }
}
```

## 5. Timer 화면에 통합 예시

```typescript
// app/(tabs)/timer.tsx에 추가

import { WorkoutLocationTracker } from '../../utils/WorkoutLocationTracker';

export default function TimerScreen() {
  const locationTracker = useRef(new WorkoutLocationTracker());

  const handleStart = async () => {
    // 위치 추적 시작
    try {
      await locationTracker.current.startTracking();
    } catch (error) {
      console.error('위치 추적 시작 실패:', error);
    }
    
    // 기존 타이머 시작 로직...
  };

  const handleStopConfirm = async () => {
    // 위치 추적 중지
    locationTracker.current.stopTracking();
    
    // 총 이동 거리 계산
    const distance = locationTracker.current.calculateTotalDistance();
    const averageSpeed = locationTracker.current.calculateAverageSpeed();
    
    // 기존 종료 로직에 거리 정보 추가...
  };
}
```

## 6. 배터리 최적화

위치 추적은 배터리를 많이 소모할 수 있으므로, 다음을 고려하세요:

1. **정확도 조절**: 필요에 따라 `Accuracy`를 조절
   - `Accuracy.Highest`: 가장 정확하지만 배터리 많이 소모
   - `Accuracy.High`: 높은 정확도
   - `Accuracy.Balanced`: 균형잡힌 정확도
   - `Accuracy.Low`: 낮은 정확도, 배터리 절약

2. **업데이트 간격 조절**: 
   - `timeInterval`: 업데이트 시간 간격
   - `distanceInterval`: 이동 거리 간격

3. **백그라운드 추적**: 백그라운드에서도 추적하려면 `requestBackgroundPermissionsAsync()` 사용

## 7. 주의사항

- 위치 권한은 사용자가 거부할 수 있으므로, 권한이 없을 때의 대체 로직 필요
- 실시간 위치 추적은 배터리를 많이 소모하므로, 운동 중에만 활성화하는 것을 권장
- 개인정보 보호를 위해 위치 데이터는 암호화하여 저장하는 것을 권장

## 8. 테스트

```bash
# 개발 빌드에서 테스트
npx expo run:android
# 또는
npx expo run:ios
```

실제 기기에서 테스트해야 위치 정보를 정확히 확인할 수 있습니다.
