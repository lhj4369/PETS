import * as Location from 'expo-location';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  altitude?: number;
}

/**
 * 운동 중 GPS 위치 추적을 관리하는 클래스
 */
export class WorkoutLocationTracker {
  private locations: LocationPoint[] = [];
  private subscription: Location.LocationSubscription | null = null;
  private isTracking: boolean = false;

  /**
   * 위치 추적 시작
   */
  async startTracking(): Promise<void> {
    if (this.isTracking) {
      console.warn('이미 위치 추적이 시작되었습니다.');
      return;
    }

    try {
      // 위치 권한 요청
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('위치 권한이 필요합니다.');
      }

      // 위치 서비스 활성화 확인
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        throw new Error('위치 서비스가 비활성화되어 있습니다.');
      }

      // 위치 추적 시작
      this.subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000, // 1초마다 업데이트
          distanceInterval: 1, // 1미터마다 업데이트
        },
        (location) => {
          this.locations.push({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: Date.now(),
            accuracy: location.coords.accuracy ?? undefined,
            altitude: location.coords.altitude ?? undefined,
          });
        }
      );

      this.isTracking = true;
      console.log('GPS 위치 추적이 시작되었습니다.');
    } catch (error) {
      console.error('위치 추적 시작 실패:', error);
      throw error;
    }
  }

  /**
   * 위치 추적 중지
   */
  stopTracking(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    this.isTracking = false;
    console.log('GPS 위치 추적이 중지되었습니다.');
  }

  /**
   * 총 이동 거리 계산 (미터)
   */
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

  /**
   * 두 지점 간 거리 계산 (Haversine 공식) - 미터 단위
   */
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

  /**
   * 평균 속도 계산 (m/s)
   */
  calculateAverageSpeed(): number {
    if (this.locations.length < 2) return 0;

    const totalDistance = this.calculateTotalDistance();
    const firstTime = this.locations[0].timestamp;
    const lastTime = this.locations[this.locations.length - 1].timestamp;
    const totalTime = (lastTime - firstTime) / 1000; // 초

    return totalTime > 0 ? totalDistance / totalTime : 0;
  }

  /**
   * 현재 속도 계산 (m/s) - 최근 두 지점 기준
   */
  calculateCurrentSpeed(): number {
    if (this.locations.length < 2) return 0;

    const recent = this.locations.slice(-2);
    const distance = this.calculateDistance(
      recent[0].latitude,
      recent[0].longitude,
      recent[1].latitude,
      recent[1].longitude
    );
    const time = (recent[1].timestamp - recent[0].timestamp) / 1000; // 초

    return time > 0 ? distance / time : 0;
  }

  /**
   * 위치 기록 초기화
   */
  reset(): void {
    this.locations = [];
    console.log('위치 기록이 초기화되었습니다.');
  }

  /**
   * 위치 기록 가져오기
   */
  getLocations(): LocationPoint[] {
    return [...this.locations];
  }

  /**
   * 추적 중인지 확인
   */
  getIsTracking(): boolean {
    return this.isTracking;
  }

  /**
   * 위치 기록 개수
   */
  getLocationCount(): number {
    return this.locations.length;
  }

  /**
   * 최근 위치 가져오기
   */
  getLastLocation(): LocationPoint | null {
    return this.locations.length > 0
      ? this.locations[this.locations.length - 1]
      : null;
  }
}
