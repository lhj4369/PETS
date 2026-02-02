# 구글 로그인 설정 가이드

## iOS 설정 방법

### 1. Google Cloud Console에서 iOS 클라이언트 ID 생성

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/ 접속
   - 프로젝트 선택 (Android/Web과 동일한 프로젝트 사용 권장)

2. **API 및 서비스 > 사용자 인증 정보**로 이동

3. **OAuth 2.0 클라이언트 ID 만들기** 클릭

4. **애플리케이션 유형 선택**
   - **iOS** 선택

5. **정보 입력**
   - **이름**: 예) "PETS iOS" (원하는 이름)
   - **번들 ID**: `com.pets.app`
     - Android 패키지 이름과 동일하게 설정되어 있습니다
     - 다른 번들 ID를 사용하려면 `app.json`의 `ios.bundleIdentifier`도 변경해야 합니다

6. **만들기** 클릭

7. **클라이언트 ID 복사**
   - 생성된 iOS 클라이언트 ID를 복사하세요
   - 형식: `123456789-abc...xyz.apps.googleusercontent.com`

### 2. .env 파일에 iOS 클라이언트 ID 추가

`frontend/.env` 파일을 열고 다음 줄을 추가하세요:

```bash
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=여기에_복사한_iOS_클라이언트_ID_입력
```

예시:
```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789-web.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=123456789-android.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=123456789-ios.apps.googleusercontent.com
```

### 3. iOS 번들 ID 확인/변경 (필요시)

현재 설정된 번들 ID: `com.anonymous.frontend`

다른 번들 ID를 사용하려면:
1. `app.json` 파일의 `ios.bundleIdentifier` 수정
2. Google Cloud Console에서도 동일한 번들 ID로 iOS 클라이언트 ID 생성

### 4. 앱 재시작

환경 변수를 변경한 후에는 앱을 재시작하세요:

```bash
npx expo start --clear
```

### 5. iOS 빌드 (실제 기기 테스트)

iOS 시뮬레이터에서는 구글 로그인이 제한될 수 있으므로, 실제 iOS 기기에서 테스트하는 것을 권장합니다:

```bash
# iOS 네이티브 빌드
npx expo prebuild
npx expo run:ios
```

또는 EAS Build 사용:

```bash
npx eas build --platform ios
```

## 전체 설정 요약

### 필요한 클라이언트 ID 3개:
1. ✅ **웹 클라이언트 ID** - Web 애플리케이션 타입
2. ✅ **안드로이드 클라이언트 ID** - Android 타입 (패키지: `com.pets.app`)
3. ✅ **iOS 클라이언트 ID** - iOS 타입 (번들 ID: `com.pets.app`)

### .env 파일 예시:
```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id.apps.googleusercontent.com
```

**참고**: Android와 iOS가 동일한 패키지/번들 ID (`com.pets.app`)를 사용하므로 일관성이 유지됩니다.

## 문제 해결

### iOS에서 구글 로그인이 작동하지 않는 경우:
1. 번들 ID가 Google Cloud Console과 일치하는지 확인
2. `.env` 파일의 iOS 클라이언트 ID가 올바른지 확인
3. 앱을 완전히 재시작 (`--clear` 옵션 사용)
4. 실제 iOS 기기에서 테스트 (시뮬레이터 제한 가능)

### 번들 ID 변경이 필요한 경우:
1. `app.json`의 `ios.bundleIdentifier` 수정
2. Google Cloud Console에서 새로운 번들 ID로 iOS 클라이언트 ID 재생성
3. `.env` 파일 업데이트

