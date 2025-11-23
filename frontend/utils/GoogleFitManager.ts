import * as Google from "expo-auth-session/providers/google";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from "expo-web-browser";

// WebBrowser 완료 후 자동으로 닫히도록 설정
WebBrowser.maybeCompleteAuthSession();

// Google Fit API 타입 정의
export interface GoogleFitActivity {
  activityType: string;
  startTimeMillis: string;
  endTimeMillis: string;
  calories?: number;
  steps?: number;
  distance?: number;
}

export interface GoogleFitDataSource {
  dataType: {
    name: string;
    field: Array<{
      name: string;
      format: string;
    }>;
  };
  dataStreamId: string;
  dataStreamName: string;
  device: {
    manufacturer: string;
    model: string;
    type: string;
    uid: string;
    version: string;
  };
}

export interface GoogleFitDataset {
  dataSourceId: string;
  point: Array<{
    startTimeNanos: string;
    endTimeNanos: string;
    value: Array<{
      intVal?: number;
      fpVal?: number;
    }>;
  }>;
}

export interface GoogleFitSession {
  id: string;
  name: string;
  description: string;
  startTimeMillis: string;
  endTimeMillis: string;
  activityType: number;
  application: {
    name: string;
    packageName: string;
  };
}

const GOOGLE_FIT_SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.activity.write',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/fitness.body.write',
  'https://www.googleapis.com/auth/fitness.location.read',
  'https://www.googleapis.com/auth/fitness.location.write',
];

const STORAGE_KEY = 'google_fit_access_token';
const STORAGE_REFRESH_KEY = 'google_fit_refresh_token';

class GoogleFitManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private readonly baseUrl = 'https://www.googleapis.com/fitness/v1';

  /**
   * Google Fit 인증 요청 생성
   */
  createAuthRequest() {
    return Google.useAuthRequest({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "",
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "",
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "",
      scopes: GOOGLE_FIT_SCOPES,
    });
  }

  /**
   * 저장된 액세스 토큰 로드
   */
  async loadStoredToken(): Promise<void> {
    const token = await AsyncStorage.getItem(STORAGE_KEY);
    const refresh = await AsyncStorage.getItem(STORAGE_REFRESH_KEY);
    this.accessToken = token;
    this.refreshToken = refresh;
  }

  /**
   * 액세스 토큰 저장
   */
  async saveToken(accessToken: string, refreshToken?: string): Promise<void> {
    this.accessToken = accessToken;
    if (refreshToken) {
      this.refreshToken = refreshToken;
      await AsyncStorage.setItem(STORAGE_REFRESH_KEY, refreshToken);
    }
    await AsyncStorage.setItem(STORAGE_KEY, accessToken);
  }

  /**
   * 토큰 삭제
   */
  async clearToken(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    await AsyncStorage.multiRemove([STORAGE_KEY, STORAGE_REFRESH_KEY]);
  }

  /**
   * 인증 여부 확인
   */
  async isAuthenticated(): Promise<boolean> {
    if (!this.accessToken) {
      await this.loadStoredToken();
    }
    return !!this.accessToken;
  }

  /**
   * API 요청 헤더 생성
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    if (!this.accessToken) {
      await this.loadStoredToken();
    }

    if (!this.accessToken) {
      throw new Error('Google Fit 인증이 필요합니다.');
    }

    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * API 요청 실행
   */
  private async fetchApi(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Google Fit API 오류: ${error.error?.message || response.statusText}`);
    }

    return response;
  }

  /**
   * 오늘의 걸음 수 가져오기
   */
  async getTodaySteps(): Promise<number> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getSteps(
      startOfDay.getTime(),
      endOfDay.getTime()
    );
  }

  /**
   * 특정 기간의 걸음 수 가져오기
   */
  async getSteps(startTimeMillis: number, endTimeMillis: number): Promise<number> {
    const startTimeNanos = startTimeMillis * 1000000;
    const endTimeNanos = endTimeMillis * 1000000;

    const response = await this.fetchApi(
      `/users/me/dataset:aggregate`,
      {
        method: 'POST',
        body: JSON.stringify({
          aggregateBy: [
            {
              dataTypeName: 'com.google.step_count.delta',
            },
          ],
          bucketByTime: { durationMillis: endTimeMillis - startTimeMillis },
          startTimeMillis,
          endTimeMillis,
        }),
      }
    );

    const data = await response.json();
    let totalSteps = 0;

    if (data.bucket && data.bucket.length > 0) {
      for (const bucket of data.bucket) {
        if (bucket.dataset && bucket.dataset.length > 0) {
          for (const dataset of bucket.dataset) {
            if (dataset.point && dataset.point.length > 0) {
              for (const point of dataset.point) {
                if (point.value && point.value.length > 0) {
                  for (const value of point.value) {
                    if (value.intVal !== undefined) {
                      totalSteps += value.intVal;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return totalSteps;
  }

  /**
   * 오늘의 칼로리 소모량 가져오기
   */
  async getTodayCalories(): Promise<number> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    return this.getCalories(
      startOfDay.getTime(),
      endOfDay.getTime()
    );
  }

  /**
   * 특정 기간의 칼로리 소모량 가져오기
   */
  async getCalories(startTimeMillis: number, endTimeMillis: number): Promise<number> {
    const response = await this.fetchApi(
      `/users/me/dataset:aggregate`,
      {
        method: 'POST',
        body: JSON.stringify({
          aggregateBy: [
            {
              dataTypeName: 'com.google.calories.expended',
            },
          ],
          bucketByTime: { durationMillis: endTimeMillis - startTimeMillis },
          startTimeMillis,
          endTimeMillis,
        }),
      }
    );

    const data = await response.json();
    let totalCalories = 0;

    if (data.bucket && data.bucket.length > 0) {
      for (const bucket of data.bucket) {
        if (bucket.dataset && bucket.dataset.length > 0) {
          for (const dataset of bucket.dataset) {
            if (dataset.point && dataset.point.length > 0) {
              for (const point of dataset.point) {
                if (point.value && point.value.length > 0) {
                  for (const value of point.value) {
                    if (value.fpVal !== undefined) {
                      totalCalories += value.fpVal;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return Math.round(totalCalories);
  }

  /**
   * 특정 기간의 이동 거리 가져오기 (미터 단위)
   */
  async getDistance(startTimeMillis: number, endTimeMillis: number): Promise<number> {
    const response = await this.fetchApi(
      `/users/me/dataset:aggregate`,
      {
        method: 'POST',
        body: JSON.stringify({
          aggregateBy: [
            {
              dataTypeName: 'com.google.distance.delta',
            },
          ],
          bucketByTime: { durationMillis: endTimeMillis - startTimeMillis },
          startTimeMillis,
          endTimeMillis,
        }),
      }
    );

    const data = await response.json();
    let totalDistance = 0;

    if (data.bucket && data.bucket.length > 0) {
      for (const bucket of data.bucket) {
        if (bucket.dataset && bucket.dataset.length > 0) {
          for (const dataset of bucket.dataset) {
            if (dataset.point && dataset.point.length > 0) {
              for (const point of dataset.point) {
                if (point.value && point.value.length > 0) {
                  for (const value of point.value) {
                    if (value.fpVal !== undefined) {
                      totalDistance += value.fpVal;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return Math.round(totalDistance * 100) / 100; // 소수점 둘째 자리까지 반올림
  }

  /**
   * 특정 기간의 평균 심박수 가져오기 (bpm)
   * Google Fit에서 기록된 심박수 데이터를 가져옵니다.
   * (웨어러블 기기, Google Fit 앱의 카메라 측정, 또는 다른 앱에서 기록된 데이터)
   */
  async getHeartRate(startTimeMillis: number, endTimeMillis: number): Promise<number | null> {
    const response = await this.fetchApi(
      `/users/me/dataset:aggregate`,
      {
        method: 'POST',
        body: JSON.stringify({
          aggregateBy: [
            {
              dataTypeName: 'com.google.heart_rate.bpm',
            },
          ],
          bucketByTime: { durationMillis: endTimeMillis - startTimeMillis },
          startTimeMillis,
          endTimeMillis,
        }),
      }
    );

    const data = await response.json();
    const heartRateValues: number[] = [];

    if (data.bucket && data.bucket.length > 0) {
      for (const bucket of data.bucket) {
        if (bucket.dataset && bucket.dataset.length > 0) {
          for (const dataset of bucket.dataset) {
            if (dataset.point && dataset.point.length > 0) {
              for (const point of dataset.point) {
                if (point.value && point.value.length > 0) {
                  for (const value of point.value) {
                    // 심박수는 fpVal (부동소수점) 또는 intVal (정수)로 올 수 있습니다
                    if (value.fpVal !== undefined) {
                      heartRateValues.push(value.fpVal);
                    } else if (value.intVal !== undefined) {
                      heartRateValues.push(value.intVal);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    if (heartRateValues.length === 0) {
      return null; // 데이터가 없으면 null 반환
    }

    // 평균 심박수 계산
    const averageHeartRate = heartRateValues.reduce((sum, val) => sum + val, 0) / heartRateValues.length;
    return Math.round(averageHeartRate);
  }

  /**
   * 특정 기간의 최신 심박수 가져오기 (bpm)
   * 가장 최근에 기록된 심박수 값을 반환합니다.
   */
  async getLatestHeartRate(startTimeMillis: number, endTimeMillis: number): Promise<number | null> {
    const response = await this.fetchApi(
      `/users/me/dataset:aggregate`,
      {
        method: 'POST',
        body: JSON.stringify({
          aggregateBy: [
            {
              dataTypeName: 'com.google.heart_rate.bpm',
            },
          ],
          bucketByTime: { durationMillis: endTimeMillis - startTimeMillis },
          startTimeMillis,
          endTimeMillis,
        }),
      }
    );

    const data = await response.json();
    let latestHeartRate: number | null = null;
    let latestTime = 0;

    if (data.bucket && data.bucket.length > 0) {
      for (const bucket of data.bucket) {
        if (bucket.dataset && bucket.dataset.length > 0) {
          for (const dataset of bucket.dataset) {
            if (dataset.point && dataset.point.length > 0) {
              for (const point of dataset.point) {
                const pointTime = parseInt(point.startTimeNanos) / 1000000; // 나노초를 밀리초로 변환
                if (pointTime > latestTime && point.value && point.value.length > 0) {
                  for (const value of point.value) {
                    if (value.fpVal !== undefined) {
                      latestHeartRate = value.fpVal;
                      latestTime = pointTime;
                    } else if (value.intVal !== undefined) {
                      latestHeartRate = value.intVal;
                      latestTime = pointTime;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return latestHeartRate ? Math.round(latestHeartRate) : null;
  }

  /**
   * 활동 데이터 쓰기 (걸음 수)
   */
  async writeSteps(steps: number, startTimeMillis: number, endTimeMillis: number): Promise<void> {
    const startTimeNanos = startTimeMillis * 1000000;
    const endTimeNanos = endTimeMillis * 1000000;

    // 데이터 소스 ID 가져오기 또는 생성
    const dataSourceId = `raw:com.google.step_count.delta:${process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.split('-')[0] || 'unknown'}:${Date.now()}`;

    await this.fetchApi(
      `/users/me/dataSources/${encodeURIComponent(dataSourceId)}/datasets/${startTimeNanos}-${endTimeNanos}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          dataSourceId,
          point: [
            {
              startTimeNanos: startTimeNanos.toString(),
              endTimeNanos: endTimeNanos.toString(),
              value: [
                {
                  intVal: steps,
                },
              ],
            },
          ],
        }),
      }
    );
  }

  /**
   * 활동 세션 읽기
   */
  async getSessions(startTimeMillis: number, endTimeMillis: number): Promise<GoogleFitSession[]> {
    const response = await this.fetchApi(
      `/users/me/sessions?startTime=${startTimeMillis}&endTime=${endTimeMillis}`
    );

    const data = await response.json();
    return data.session || [];
  }

  /**
   * 활동 세션 쓰기
   */
  async writeSession(session: {
    name: string;
    description: string;
    startTimeMillis: number;
    endTimeMillis: number;
    activityType: number;
  }): Promise<GoogleFitSession> {
    const response = await this.fetchApi(
      `/users/me/sessions`,
      {
        method: 'POST',
        body: JSON.stringify({
          ...session,
          application: {
            name: 'PETS',
            packageName: 'com.idog.googlelogin',
          },
        }),
      }
    );

    return await response.json();
  }

  /**
   * 데이터 소스 목록 가져오기
   */
  async getDataSources(): Promise<GoogleFitDataSource[]> {
    const response = await this.fetchApi('/users/me/dataSources');
    const data = await response.json();
    return data.dataSource || [];
  }
}

export default new GoogleFitManager();

