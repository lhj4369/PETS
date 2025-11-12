# 헬스 API 설정 가이드

이 가이드는 실제 헬스 데이터(HealthKit/Google Fit)를 사용하기 위한 설정 방법을 안내합니다.

## 필수 요구사항

- Expo SDK 54 이상
- iOS: Xcode 14 이상 (macOS 필요)
- Android: Android Studio 및 Android SDK
- 실제 기기에서 테스트 (시뮬레이터/에뮬레이터에서는 제한적)

## 1. 패키지 설치

**먼저 모든 의존성 패키지를 설치해야 합니다:**

```bash
cd frontend
npm install
```

그 다음 헬스 API 관련 패키지 설치:

```bash
npm install react-native-health expo-dev-client
```

**중요**: `npm install`을 먼저 실행하지 않으면 `npx expo` 명령어가 작동하지 않습니다. `expo` 패키지가 `node_modules`에 설치되어 있어야 합니다.

**참고**: Expo CLI는 전역 설치가 필요하지 않습니다. 프로젝트에 `expo` 패키지가 설치되어 있으므로 다음 방법들을 사용할 수 있습니다:

1. **npm scripts 사용 (가장 권장)**:
   ```bash
   npm run prebuild          # expo prebuild와 동일
   npm run build:android     # expo prebuild --platform android와 동일
   npm run build:ios         # expo prebuild --platform ios와 동일
   npm start                 # expo start와 동일
   ```

2. **npx 사용**:
   ```bash
   npx expo prebuild
   npx expo prebuild --platform android
   ```

3. **직접 실행**:
   ```bash
   ./node_modules/.bin/expo prebuild
   ```

만약 "unknown command: expo" 오류가 발생한다면:
- `npm install`을 먼저 실행했는지 확인
- `node_modules` 폴더가 존재하는지 확인
- `frontend` 디렉토리에서 명령어를 실행했는지 확인

## 2. Expo Development Build 설정

헬스 API는 네이티브 모듈이므로 Expo Development Build가 필요합니다.

### iOS 설정

```bash
# 방법 1: npm scripts 사용 (권장)
npm run build:ios
npm run start -- --ios

# 방법 2: npx 사용 (npm install 후)
npx expo prebuild --platform ios
npx expo run:ios

# 방법 3: 직접 실행
./node_modules/.bin/expo prebuild --platform ios
```

### Android 설정

```bash
# 방법 1: npm scripts 사용 (권장)
npm run build:android
npm run start -- --android

# 방법 2: npx 사용 (npm install 후)
npx expo prebuild --platform android
npx expo run:android

# 방법 3: 직접 실행
./node_modules/.bin/expo prebuild --platform android
```

**주의**: `npx expo` 명령어가 작동하지 않는다면:
1. `npm install`을 먼저 실행했는지 확인
2. `npm run build:android` 또는 `npm run build:ios` 사용 (더 안전)
3. 현재 디렉토리가 `frontend`인지 확인

## 3. iOS HealthKit 설정

### 3.1 Xcode에서 HealthKit 활성화

1. Xcode에서 프로젝트 열기:
   ```bash
   open ios/*.xcworkspace
   ```

2. 프로젝트 설정에서:
   - **Signing & Capabilities** 탭 선택
   - **+ Capability** 버튼 클릭
   - **HealthKit** 추가
   - Health Records 옵션 활성화 (선택사항)

3. **Info.plist** 확인:
   - `NSHealthShareUsageDescription` (이미 app.json에 설정됨)
   - `NSHealthUpdateUsageDescription` (이미 app.json에 설정됨)

### 3.2 권한 설명 텍스트 (한국어)

app.json에 이미 설정되어 있지만, 필요시 수정 가능:

```json
{
  "ios": {
    "infoPlist": {
      "NSHealthShareUsageDescription": "앱이 건강 데이터를 읽기 위해 HealthKit 접근 권한이 필요합니다.",
      "NSHealthUpdateUsageDescription": "앱이 운동 기록을 저장하기 위해 HealthKit 접근 권한이 필요합니다."
    }
  }
}
```

## 4. Android Google Fit 설정

### 4.1 Google Fit API 키 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **API 및 서비스** > **라이브러리** 이동
4. **Google Fit API** 검색 및 활성화
5. **사용자 인증 정보** > **API 키 만들기**
6. 생성된 API 키 복사

### 4.2 AndroidManifest.xml 설정

`expo prebuild` 실행 후 자동 생성되지만, 필요시 수정:

```xml
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
<uses-permission android:name="com.google.android.gms.permission.FITNESS_ACTIVITY_READ" />
<uses-permission android:name="com.google.android.gms.permission.FITNESS_ACTIVITY_WRITE" />
<uses-permission android:name="com.google.android.gms.permission.FITNESS_BODY_READ" />
<uses-permission android:name="com.google.android.gms.permission.FITNESS_BODY_WRITE" />
<uses-permission android:name="com.google.android.gms.permission.FITNESS_LOCATION_READ" />
<uses-permission android:name="com.google.android.gms.permission.FITNESS_LOCATION_WRITE" />
```

### 4.3 Google Services 설정

1. `android/app/google-services.json` 파일 추가
2. Google Fit API 키를 `react-native-health`에서 사용할 수 있도록 설정
   - `.env` 또는 Expo 환경변수에 `EXPO_PUBLIC_GOOGLE_FIT_API_KEY=<복사한_API_키>` 추가 (예: `frontend/.env`)
   - `app.json`을 `app.config.ts`로 전환하거나 이미 사용 중인 구성 파일에서 `extra.googleFitApiKey`로 노출
     ```ts
     // frontend/app.config.ts
     import 'dotenv/config';

     export default ({ config }) => ({
       ...config,
       extra: {
         ...config.extra,
         googleFitApiKey: process.env.EXPO_PUBLIC_GOOGLE_FIT_API_KEY,
       },
     });
     ```
   - 서비스 코드에서 `expo-constants`를 통해 키를 읽어 초기화 로직에 전달
     ```ts
     import Constants from 'expo-constants';

     const GOOGLE_FIT_API_KEY =
       Constants.expoConfig?.extra?.googleFitApiKey ??
       Constants.manifest?.extra?.googleFitApiKey;
     ```
   - 키를 요구하는 Google Fit 초기화 함수(예: OAuth 설정, REST 클라이언트 구성)에 `GOOGLE_FIT_API_KEY` 전달
   - 변경 사항을 반영하려면 `npm run build:android` 또는 `npx expo prebuild --platform android` 실행 후 개발 빌드 재설치

## 5. 테스트

### 5.1 권한 요청 테스트

앱 실행 시 자동으로 권한 요청이 나타납니다:

- **iOS**: HealthKit 권한 팝업
- **Android**: Google Fit 권한 팝업

### 5.2 데이터 조회 테스트

홈 화면에서 헬스 데이터가 표시되는지 확인:

- 걸음 수
- 거리
- 칼로리
- 심박수 (있는 경우)

### 5.3 운동 기록 저장 테스트

운동 기록 화면에서 운동을 기록하고 HealthKit/Google Fit에 저장되는지 확인:

1. 기록 화면으로 이동
2. 날짜 선택
3. 운동 기록 추가
4. Health 앱 (iOS) 또는 Google Fit 앱 (Android)에서 확인

## 6. 문제 해결

### 6.1 "unknown command: expo" 오류

**원인**: `expo` 패키지가 설치되지 않았거나 `node_modules`가 없음

**해결 방법:**
```bash
# 1. 모든 패키지 설치
npm install

# 2. 설치 확인
ls node_modules/.bin/expo  # 또는 Windows: dir node_modules\.bin\expo

# 3. npm scripts 사용 (더 안전)
npm run prebuild
npm run build:android  # 또는 npm run build:ios
```

### 6.2 "ENOENT: no such file or directory" 오류 (아이콘 이미지)

**원인**: app.json에 참조된 이미지 파일이 존재하지 않음

**해결 방법:**
1. 필요한 이미지 파일 생성 또는
2. app.json에서 해당 이미지 경로 제거

현재 app.json이 기본 설정으로 수정되었습니다. 나중에 아이콘 이미지를 추가하려면:
- `assets/images/icon.png` 파일 추가 (1024x1024px 권장)
- app.json에 `"icon": "./assets/images/icon.png"` 추가

### 6.3 "react-native-health가 설치되지 않았습니다" 오류

**해결 방법:**
```bash
npm install react-native-health expo-dev-client
npm run prebuild
npm run build:android  # 또는 npm run build:ios
```

### 6.4 iOS에서 HealthKit 권한이 표시되지 않음

**해결 방법:**
1. Xcode에서 HealthKit capability가 활성화되었는지 확인
2. Info.plist에 권한 설명이 있는지 확인
3. 실제 기기에서 테스트 (시뮬레이터에서는 제한적)

### 6.5 Android에서 Google Fit 연결 실패

**해결 방법:**
1. Google Fit API가 활성화되었는지 확인
2. API 키가 올바른지 확인
3. Google Play Services가 설치되어 있는지 확인
4. 실제 기기에서 테스트

### 6.6 데이터가 0으로 표시됨

**가능한 원인:**
- 권한이 거부됨
- HealthKit/Google Fit에 데이터가 없음
- 기기가 헬스 데이터를 수집하지 않음 (예: 심박수)

**해결 방법:**
1. 설정 > 건강 (iOS) 또는 Google Fit 앱에서 데이터 확인
2. 권한 재요청
3. 실제 운동/활동 후 데이터 확인

## 7. 개발 모드 vs 프로덕션 모드

### 개발 모드

```bash
# 개발 빌드 실행
npx expo run:ios
npx expo run:android

# 또는 Expo Go 사용 (제한적)
npx expo start
```

### 프로덕션 빌드

```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

## 8. 참고 자료

- [react-native-health 문서](https://github.com/agencyenterprise/react-native-health)
- [Apple HealthKit 문서](https://developer.apple.com/healthkit/)
- [Google Fit API 문서](https://developers.google.com/fit)
- [Expo Development Build 문서](https://docs.expo.dev/development/build/)

## 9. 지원되는 데이터 타입

### iOS (HealthKit)
- ✅ 걸음 수 (Steps)
- ✅ 거리 (Distance Walking/Running)
- ✅ 활성 칼로리 (Active Energy Burned)
- ✅ 심박수 (Heart Rate)
- ✅ 운동 (Workout)

### Android (Google Fit)
- ✅ 걸음 수 (Steps)
- ✅ 거리 (Distance)
- ✅ 칼로리 (Calories)
- ⚠️ 심박수 (기기 지원 시)
- ✅ 운동 (Workout)

## 10. 다음 단계

1. **의존성 패키지 설치**: `npm install`
2. **헬스 API 패키지 설치**: `npm install react-native-health expo-dev-client`
3. **네이티브 코드 생성**: 
   - Android: `npm run build:android` 또는 `npx expo prebuild --platform android`
   - iOS: `npm run build:ios` 또는 `npx expo prebuild --platform ios`
4. **개발 빌드 실행**: 
   - Android: `npm run android` 또는 `npx expo run:android`
   - iOS: `npm run ios` 또는 `npx expo run:ios`
5. **권한 허용 후 데이터 확인**

**주의사항:**
- 웹 플랫폼에서는 헬스 API를 사용할 수 없습니다. 모바일 기기에서만 작동합니다.
- `npx expo` 명령어가 작동하지 않으면 `npm run` 스크립트를 사용하세요.
- `npm install`을 먼저 실행하지 않으면 명령어가 작동하지 않습니다.

