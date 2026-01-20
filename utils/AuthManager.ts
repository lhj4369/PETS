import AsyncStorage from '@react-native-async-storage/async-storage';

export type StoredUser = Record<string, unknown> | null;

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

}

export default new AuthManager();

