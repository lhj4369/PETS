import 'dotenv/config';
import { ConfigContext, ExpoConfig } from '@expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'frontend',
  slug: 'frontend',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'frontend',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    infoPlist: {
      NSHealthShareUsageDescription: '앱이 건강 데이터를 읽기 위해 HealthKit 접근 권한이 필요합니다.',
      NSHealthUpdateUsageDescription: '앱이 운동 기록을 저장하기 위해 HealthKit 접근 권한이 필요합니다.',
    },
    entitlements: {
      'com.apple.developer.healthkit': true,
      'com.apple.developer.healthkit.access': ['health-records', 'health-records'],
    },
    bundleIdentifier: 'com.anonymous.frontend',
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: 'com.anonymous.frontend',
  },
  web: {
    output: 'static',
  },
  plugins: [
    'expo-router',
    'expo-dev-client',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#ffffff',
        dark: {
          backgroundColor: '#000000',
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    ...config.extra,
    googleFitApiKey: process.env.EXPO_PUBLIC_GOOGLE_FIT_API_KEY,
  },
});
