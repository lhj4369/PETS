import { Platform } from 'react-native';

// react-native-health는 선택적 import로 처리 (설치되지 않았을 때 대비)
let AppleHealthKit: any;
let HealthKitPermissions: any;
let HealthInputOptions: any;
let HealthUnit: any;

try {
  const healthModule = require('react-native-health');
  AppleHealthKit = healthModule.default || healthModule;
  HealthKitPermissions = healthModule.HealthKitPermissions;
  HealthInputOptions = healthModule.HealthInputOptions;
  HealthUnit = healthModule.HealthUnit;
} catch (error) {
  console.warn('react-native-health가 설치되지 않았습니다. 개발 빌드 후 설치해주세요.');
}

/**
 * 헬스 API 서비스
 * 
 * 실제 헬스 데이터를 사용하기 위한 설정:
 * 
 * 1. 패키지 설치:
 *    npm install react-native-health expo-dev-client
 * 
 * 2. Expo Development Build 설정:
 *    npx expo prebuild
 *    npx expo run:ios 또는 npx expo run:android
 * 
 * 3. iOS 설정 (Info.plist 자동 생성됨):
 *    - Xcode에서 HealthKit capability 활성화
 *    - NSHealthShareUsageDescription, NSHealthUpdateUsageDescription 확인
 * 
 * 4. Android 설정:
 *    - Google Fit API 키 설정 (또는 Health Connect 사용)
 *    - AndroidManifest.xml에 권한 자동 추가됨
 */

/**
 * 헬스 데이터 타입 정의
 */
export interface HealthData {
  steps: number;
  distance: number; // 미터 단위
  calories: number; // 칼로리
  heartRate?: number; // 심박수 (bpm)
  activeMinutes?: number; // 활동 시간 (분)
}

export interface HealthDataRange {
  startDate: Date;
  endDate: Date;
  data: HealthData[];
}

// HealthKit 권한 설정
const getPermissions = () => {
  if (!AppleHealthKit || !AppleHealthKit.Constants) {
    return null;
  }
  return {
    permissions: {
      read: [
        AppleHealthKit.Constants.Permissions.Steps,
        AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
        AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
        AppleHealthKit.Constants.Permissions.HeartRate,
        AppleHealthKit.Constants.Permissions.Workout,
      ],
      write: [
        AppleHealthKit.Constants.Permissions.Steps,
        AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
        AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
        AppleHealthKit.Constants.Permissions.Workout,
      ],
    },
  };
};

/**
 * 헬스 API 서비스 클래스
 * iOS: HealthKit
 * Android: Google Fit / Health Connect
 */
class HealthService {
  private isInitialized = false;
  private hasPermission = false;
  private healthKitAvailable = false;

  /**
   * HealthKit 사용 가능 여부 확인
   */
  private async checkHealthKitAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }

    try {
      // react-native-health가 설치되어 있는지 확인
      if (typeof AppleHealthKit === 'undefined') {
        console.warn('react-native-health가 설치되지 않았습니다.');
        return false;
      }
      return true;
    } catch (error) {
      console.warn('HealthKit 사용 불가:', error);
      return false;
    }
  }

  /**
   * 헬스 서비스 초기화
   */
  async initialize(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        console.log('웹 플랫폼에서는 헬스 API를 사용할 수 없습니다.');
        return false;
      }

      // iOS: HealthKit 초기화
      if (Platform.OS === 'ios') {
        this.healthKitAvailable = await this.checkHealthKitAvailable();
        if (!this.healthKitAvailable) {
          console.warn('HealthKit을 사용할 수 없습니다. 개발 빌드가 필요합니다.');
          return false;
        }
      }

      // Android: Google Fit / Health Connect는 react-native-health에서 자동 처리
      // 추가 설정이 필요할 수 있음

      this.isInitialized = true;
      console.log('헬스 서비스 초기화 완료');
      return true;
    } catch (error) {
      console.error('헬스 서비스 초기화 실패:', error);
      return false;
    }
  }

  /**
   * 헬스 데이터 접근 권한 요청
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return false;
        }
      }

      if (Platform.OS === 'ios' && this.healthKitAvailable) {
        // iOS: HealthKit 권한 요청
        const permissions = getPermissions();
        if (!permissions || !AppleHealthKit) {
          console.warn('HealthKit을 사용할 수 없습니다.');
          return false;
        }

        return new Promise((resolve) => {
          AppleHealthKit.initHealthKit(permissions, (error: string) => {
            if (error) {
              console.error('HealthKit 권한 요청 실패:', error);
              this.hasPermission = false;
              resolve(false);
            } else {
              console.log('HealthKit 권한 획득 완료');
              this.hasPermission = true;
              resolve(true);
            }
          });
        });
      } else if (Platform.OS === 'android') {
        // Android: Google Fit / Health Connect 권한 요청
        // react-native-health가 자동으로 처리
        // 필요시 추가 구현
        this.hasPermission = true;
        return true;
      } else {
        // 웹 또는 HealthKit 사용 불가
        console.warn('헬스 API를 사용할 수 없습니다.');
        return false;
      }
    } catch (error) {
      console.error('헬스 데이터 권한 요청 실패:', error);
      return false;
    }
  }

  /**
   * 권한 상태 확인
   */
  async checkPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios' && this.healthKitAvailable) {
        // HealthKit 권한 상태 확인
        const permissions = getPermissions();
        if (!permissions || !AppleHealthKit) {
          return false;
        }

        return new Promise((resolve) => {
          AppleHealthKit.getAuthStatus(permissions, (error: string, results: any) => {
            if (error) {
              console.error('권한 상태 확인 실패:', error);
              resolve(false);
            } else {
              // 권한이 있는지 확인
              const hasAuth = Object.values(results).some((status: any) => status === 2); // 2 = authorized
              this.hasPermission = hasAuth;
              resolve(hasAuth);
            }
          });
        });
      }
      return this.hasPermission;
    } catch (error) {
      console.error('권한 상태 확인 실패:', error);
      return false;
    }
  }

  /**
   * 오늘의 걸음 수 조회
   */
  async getTodaySteps(): Promise<number> {
    try {
      if (!this.hasPermission) {
        const granted = await this.requestPermission();
        if (!granted) {
          return 0;
        }
      }

      if (Platform.OS === 'ios' && this.healthKitAvailable && AppleHealthKit) {
        // iOS: HealthKit에서 걸음 수 조회
        return new Promise((resolve) => {
          const options = {
            date: new Date().toISOString(),
            unit: HealthUnit?.count || 'count',
          };

          AppleHealthKit.getStepCount(options, (error: string, results: any) => {
            if (error) {
              console.error('걸음 수 조회 실패:', error);
              resolve(0);
            } else {
              resolve(results?.value || 0);
            }
          });
        });
      } else if (Platform.OS === 'android') {
        // Android: Google Fit / Health Connect에서 걸음 수 조회
        // react-native-health의 Android 구현 사용
        // 임시로 0 반환 (실제 구현 필요)
        return 0;
      }

      // 웹 또는 사용 불가
      return 0;
    } catch (error) {
      console.error('걸음 수 조회 실패:', error);
      return 0;
    }
  }

  /**
   * 오늘의 거리 조회 (미터 단위)
   */
  async getTodayDistance(): Promise<number> {
    try {
      if (!this.hasPermission) {
        const granted = await this.requestPermission();
        if (!granted) {
          return 0;
        }
      }

      if (Platform.OS === 'ios' && this.healthKitAvailable && AppleHealthKit) {
        // iOS: HealthKit에서 거리 조회
        return new Promise((resolve) => {
          const options = {
            date: new Date().toISOString(),
            unit: HealthUnit?.meter || 'meter',
          };

          AppleHealthKit.getDistanceWalkingRunning(options, (error: string, results: any) => {
            if (error) {
              console.error('거리 조회 실패:', error);
              resolve(0);
            } else {
              // 미터 단위로 반환
              resolve(results?.value || 0);
            }
          });
        });
      } else if (Platform.OS === 'android') {
        // Android: Google Fit / Health Connect에서 거리 조회
        return 0;
      }

      return 0;
    } catch (error) {
      console.error('거리 조회 실패:', error);
      return 0;
    }
  }

  /**
   * 오늘의 칼로리 소모량 조회
   */
  async getTodayCalories(): Promise<number> {
    try {
      if (!this.hasPermission) {
        const granted = await this.requestPermission();
        if (!granted) {
          return 0;
        }
      }

      if (Platform.OS === 'ios' && this.healthKitAvailable && AppleHealthKit) {
        // iOS: HealthKit에서 활성 칼로리 조회
        return new Promise((resolve) => {
          const options = {
            date: new Date().toISOString(),
            unit: HealthUnit?.kilocalories || 'kilocalories',
          };

          AppleHealthKit.getActiveEnergyBurned(options, (error: string, results: any) => {
            if (error) {
              console.error('칼로리 조회 실패:', error);
              resolve(0);
            } else {
              resolve(Math.round(results?.value || 0));
            }
          });
        });
      } else if (Platform.OS === 'android') {
        // Android: Google Fit / Health Connect에서 칼로리 조회
        return 0;
      }

      return 0;
    } catch (error) {
      console.error('칼로리 조회 실패:', error);
      return 0;
    }
  }

  /**
   * 오늘의 심박수 조회
   */
  async getTodayHeartRate(): Promise<number | null> {
    try {
      if (!this.hasPermission) {
        const granted = await this.requestPermission();
        if (!granted) {
          return null;
        }
      }

      if (Platform.OS === 'ios' && this.healthKitAvailable && AppleHealthKit) {
        // iOS: HealthKit에서 심박수 조회
        return new Promise((resolve) => {
          const options = {
            date: new Date().toISOString(),
            unit: HealthUnit?.bpm || 'bpm',
          };

          AppleHealthKit.getHeartRateSamples(options, (error: string, results: any) => {
            if (error) {
              console.error('심박수 조회 실패:', error);
              resolve(null);
            } else if (results && results.length > 0) {
              // 가장 최근 심박수 반환
              const latest = results[results.length - 1];
              resolve(Math.round(latest?.value || 0));
            } else {
              resolve(null);
            }
          });
        });
      } else if (Platform.OS === 'android') {
        // Android: Google Fit / Health Connect에서 심박수 조회
        return null;
      }

      return null;
    } catch (error) {
      console.error('심박수 조회 실패:', error);
      return null;
    }
  }

  /**
   * 오늘의 헬스 데이터 전체 조회
   */
  async getTodayHealthData(): Promise<HealthData> {
    try {
      const [steps, distance, calories, heartRate] = await Promise.all([
        this.getTodaySteps(),
        this.getTodayDistance(),
        this.getTodayCalories(),
        this.getTodayHeartRate(),
      ]);

      // 활동 시간 계산 (걸음 수 기반 추정)
      const activeMinutes = steps > 0 ? Math.floor(steps / 100) : 0;

      return {
        steps,
        distance,
        calories,
        heartRate: heartRate || undefined,
        activeMinutes: activeMinutes > 0 ? activeMinutes : undefined,
      };
    } catch (error) {
      console.error('헬스 데이터 조회 실패:', error);
      return {
        steps: 0,
        distance: 0,
        calories: 0,
      };
    }
  }

  /**
   * 특정 날짜 범위의 헬스 데이터 조회
   */
  async getHealthDataRange(startDate: Date, endDate: Date): Promise<HealthDataRange> {
    try {
      if (!this.hasPermission) {
        const granted = await this.requestPermission();
        if (!granted) {
          return {
            startDate,
            endDate,
            data: [],
          };
        }
      }

      // TODO: 실제 날짜 범위 데이터 조회
      // 임시 데이터 (실제 구현 시 제거)
      const data: HealthData[] = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        data.push({
          steps: Math.floor(Math.random() * 10000),
          distance: Math.floor(Math.random() * 5000),
          calories: Math.floor(Math.random() * 500),
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return {
        startDate,
        endDate,
        data,
      };
    } catch (error) {
      console.error('헬스 데이터 범위 조회 실패:', error);
      return {
        startDate,
        endDate,
        data: [],
      };
    }
  }

  /**
   * 운동 타입을 HealthKit 운동 타입으로 변환
   */
  private getWorkoutType(type: string): string {
    if (!AppleHealthKit || !AppleHealthKit.Constants) {
      return 'Other';
    }

    const typeMap: { [key: string]: string } = {
      '러닝': AppleHealthKit.Constants.WorkoutType.Running,
      '헬스': AppleHealthKit.Constants.WorkoutType.TraditionalStrengthTraining,
      '요가': AppleHealthKit.Constants.WorkoutType.Yoga,
      '사이클링': AppleHealthKit.Constants.WorkoutType.Cycling,
      '걷기': AppleHealthKit.Constants.WorkoutType.Walking,
    };
    return typeMap[type] || AppleHealthKit.Constants.WorkoutType.Other;
  }

  /**
   * 운동 데이터 기록 (HealthKit/Google Fit에 쓰기)
   */
  async saveWorkout(
    type: string,
    duration: number, // 분 단위
    calories: number,
    distance?: number, // 미터 단위
    startDate?: Date,
    endDate?: Date
  ): Promise<boolean> {
    try {
      if (!this.hasPermission) {
        const granted = await this.requestPermission();
        if (!granted) {
          return false;
        }
      }

      if (Platform.OS === 'ios' && this.healthKitAvailable && AppleHealthKit) {
        // iOS: HealthKit에 운동 데이터 저장
        return new Promise((resolve) => {
          const workoutStartDate = startDate || new Date();
          const workoutEndDate = endDate || new Date(workoutStartDate.getTime() + duration * 60 * 1000);

          const workoutData = {
            type: this.getWorkoutType(type),
            startDate: workoutStartDate.toISOString(),
            endDate: workoutEndDate.toISOString(),
            duration: duration * 60, // 초 단위로 변환
            totalEnergyBurned: calories,
            totalDistance: distance || 0,
            metadata: {
              name: type,
            },
          };

          AppleHealthKit.saveWorkout(workoutData, (error: string) => {
            if (error) {
              console.error('운동 데이터 저장 실패:', error);
              resolve(false);
            } else {
              console.log('운동 데이터 저장 완료:', workoutData);
              resolve(true);
            }
          });
        });
      } else if (Platform.OS === 'android') {
        // Android: Google Fit / Health Connect에 운동 데이터 저장
        // react-native-health의 Android 구현 사용
        console.log('운동 데이터 저장 (Android):', { type, duration, calories, distance });
        return true;
      }

      return false;
    } catch (error) {
      console.error('운동 데이터 저장 실패:', error);
      return false;
    }
  }

  /**
   * 플랫폼 정보 반환
   */
  getPlatform(): string {
    return Platform.OS;
  }

  /**
   * 헬스 API 지원 여부 확인
   */
  isAvailable(): boolean {
    // iOS와 Android에서만 지원
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }
}

export default new HealthService();

