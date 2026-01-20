/**
 * Google Fit API 사용 예제
 * 
 * 이 파일은 GoogleFitManager를 사용하는 방법을 보여주는 예제입니다.
 * 실제 사용 시에는 이 코드를 적절한 컴포넌트나 화면에 통합하세요.
 */

import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import GoogleFitManager from './GoogleFitManager';

export default function GoogleFitExample() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [steps, setSteps] = useState<number | null>(null);
  const [calories, setCalories] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Google Fit 인증 요청 생성 (React Hook은 컴포넌트 내에서 직접 사용)
  const [request, response, promptAsync] = Google.useAuthRequest(
    GoogleFitManager.getAuthRequestConfig()
  );

  // 인증 상태 확인
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 인증 응답 처리
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        handleAuthSuccess(authentication.accessToken);
      }
    }
  }, [response]);

  const checkAuthStatus = async () => {
    const authenticated = await GoogleFitManager.isAuthenticated();
    setIsAuthenticated(authenticated);
  };

  const handleAuthSuccess = async (accessToken: string) => {
    await GoogleFitManager.saveToken(accessToken);
    setIsAuthenticated(true);
  };

  const handleLogin = async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error('Google Fit 로그인 오류:', error);
      alert('Google Fit 로그인에 실패했습니다.');
    }
  };

  const handleGetTodaySteps = async () => {
    if (!isAuthenticated) {
      alert('먼저 Google Fit에 로그인해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const todaySteps = await GoogleFitManager.getTodaySteps();
      setSteps(todaySteps);
    } catch (error) {
      console.error('걸음 수 가져오기 오류:', error);
      alert('걸음 수를 가져오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetTodayCalories = async () => {
    if (!isAuthenticated) {
      alert('먼저 Google Fit에 로그인해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const todayCalories = await GoogleFitManager.getTodayCalories();
      setCalories(todayCalories);
    } catch (error) {
      console.error('칼로리 가져오기 오류:', error);
      alert('칼로리를 가져오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await GoogleFitManager.clearToken();
    setIsAuthenticated(false);
    setSteps(null);
    setCalories(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Google Fit API 예제</Text>

      {!isAuthenticated ? (
        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={!request}
        >
          <Text style={styles.buttonText}>Google Fit 로그인</Text>
        </TouchableOpacity>
      ) : (
        <>
          <Text style={styles.status}>✅ Google Fit 인증 완료</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handleGetTodaySteps}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? '로딩 중...' : '오늘의 걸음 수 가져오기'}
            </Text>
          </TouchableOpacity>

          {steps !== null && (
            <Text style={styles.result}>오늘 걸음 수: {steps.toLocaleString()}걸음</Text>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={handleGetTodayCalories}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? '로딩 중...' : '오늘의 칼로리 가져오기'}
            </Text>
          </TouchableOpacity>

          {calories !== null && (
            <Text style={styles.result}>오늘 칼로리: {calories.toLocaleString()}kcal</Text>
          )}

          <TouchableOpacity
            style={[styles.button, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Text style={styles.buttonText}>로그아웃</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  status: {
    fontSize: 16,
    color: 'green',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#DB4437',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  result: {
    fontSize: 18,
    marginVertical: 10,
    fontWeight: '600',
  },
});

