import AsyncStorage from '@react-native-async-storage/async-storage';

export type StoredUser = Record<string, unknown> | null;

const DEV_MODE_FLAG_KEY = 'pets_dev_mode';
const DEV_PROFILE_KEY = 'pets_dev_profile';

class AuthManager {
  private readonly tokenKey = 'pets_token';
  private readonly userKey = 'pets_user';

  async isLoggedIn(): Promise<boolean> {
    const token = await AsyncStorage.getItem(this.tokenKey);
    return !!token;
  }

  async login(token: string, user: StoredUser): Promise<void> {
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
    await AsyncStorage.setItem(DEV_PROFILE_KEY, JSON.stringify(profile));
  }

  // 개발자 모드: 프로필 조회
  async getDevProfile(): Promise<Record<string, unknown> | null> {
    const raw = await AsyncStorage.getItem(DEV_PROFILE_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

export default new AuthManager();

