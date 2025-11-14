import AsyncStorage from '@react-native-async-storage/async-storage';
import devProfileData from '../data/devProfile.json';
import devRankingsData from '../data/devRankings.json';

export type StoredUser = Record<string, unknown> | null;

const DEV_MODE_FLAG_KEY = 'pets_dev_mode';
const DEV_PROFILE_KEY = 'pets_dev_profile';
const DEV_WORKOUT_RECORDS_KEY = 'pets_dev_workout_records';

class AuthManager {
  private readonly tokenKey = 'pets_token';
  private readonly userKey = 'pets_user';

  async isLoggedIn(): Promise<boolean> {
    const token = await AsyncStorage.getItem(this.tokenKey);
    return !!token;
  }

  async login(token: string, user: StoredUser): Promise<void> {
    // 실제 로그인 시 개발자 모드 플래그 초기화
    await AsyncStorage.multiRemove([DEV_MODE_FLAG_KEY, DEV_PROFILE_KEY]);
    
    await AsyncStorage.multiSet([
      [this.tokenKey, token],
      [this.userKey, JSON.stringify(user ?? {})],
    ]);
  }

  async logout(): Promise<void> {
    await AsyncStorage.multiRemove([
      this.tokenKey,
      this.userKey,
      DEV_MODE_FLAG_KEY,
      DEV_PROFILE_KEY,
      DEV_WORKOUT_RECORDS_KEY,
    ]);
  }

  async getAuthHeader(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem(this.tokenKey);
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getUser(): Promise<StoredUser> {
    const raw = await AsyncStorage.getItem(this.userKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  }

  // 개발자 모드: 플래그 설정
  async setDevMode(enabled: boolean): Promise<void> {
    if (enabled) {
      await AsyncStorage.setItem(DEV_MODE_FLAG_KEY, 'true');
    } else {
      await AsyncStorage.multiRemove([DEV_MODE_FLAG_KEY, DEV_PROFILE_KEY]);
    }
  }

  // 개발자 모드: 활성화 여부 확인
  async isDevMode(): Promise<boolean> {
    const flag = await AsyncStorage.getItem(DEV_MODE_FLAG_KEY);
    return flag === 'true';
  }

  // 개발자 모드: 프로필 저장
  async setDevProfile(profile: Record<string, unknown>): Promise<void> {
    // AsyncStorage에 저장 (세션 동안 유지)
    await AsyncStorage.setItem(DEV_PROFILE_KEY, JSON.stringify(profile));
  }

  // 개발자 모드: 프로필 조회
  async getDevProfile(): Promise<Record<string, unknown> | null> {
    // 먼저 AsyncStorage에서 확인 (수정된 데이터가 있으면 우선 사용)
    const raw = await AsyncStorage.getItem(DEV_PROFILE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as Record<string, unknown>;
      } catch {
        // 파싱 실패 시 기본값 사용
      }
    }
    
    // AsyncStorage에 없으면 JSON 파일의 기본값 반환
    return devProfileData as Record<string, unknown>;
  }

  // 개발자 모드: 운동 기록 저장
  async setDevWorkoutRecords(records: any[]): Promise<void> {
    await AsyncStorage.setItem(DEV_WORKOUT_RECORDS_KEY, JSON.stringify(records));
  }

  // 개발자 모드: 운동 기록 조회
  async getDevWorkoutRecords(): Promise<any[]> {
    const raw = await AsyncStorage.getItem(DEV_WORKOUT_RECORDS_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as any[];
      } catch {
        return [];
      }
    }
    return [];
  }

  // 개발자 모드: 랭킹 조회
  async getDevRankings(): Promise<any[]> {
    // AsyncStorage에 저장된 랭킹이 있으면 우선 사용 (수정된 데이터)
    const raw = await AsyncStorage.getItem('pets_dev_rankings');
    if (raw) {
      try {
        return JSON.parse(raw) as any[];
      } catch {
        // 파싱 실패 시 기본값 사용
      }
    }
    
    // AsyncStorage에 없으면 JSON 파일의 기본값 반환
    return devRankingsData as any[];
  }

  // 개발자 모드: 랭킹 저장 (선택사항 - 필요시 사용)
  async setDevRankings(rankings: any[]): Promise<void> {
    await AsyncStorage.setItem('pets_dev_rankings', JSON.stringify(rankings));
  }
}

export default new AuthManager();

