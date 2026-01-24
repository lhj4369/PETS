# EAS 빌드 횟수 제한 해결 방법

## 현재 상황
EAS Build 무료 플랜의 빌드 횟수를 모두 사용했습니다.

## 해결 방법

### 방법 1: Expo Go로 개발 중 테스트 (권장) ✅

빌드 없이 코드 변경사항을 테스트할 수 있습니다:

```bash
# 개발 서버 실행
npx expo start

# 또는
npm start
```

**장점:**
- 빌드 횟수 제한 없음
- 코드 변경사항을 즉시 확인 가능
- 빠른 개발 사이클

**단점:**
- Google OAuth는 Expo Go에서 제한적으로 작동할 수 있음
- 네이티브 모듈 테스트 제한

### 방법 2: 로컬에서 Android 빌드

로컬 환경에서 직접 빌드할 수 있습니다:

#### 전제 조건
1. Android Studio 설치
2. Java JDK 설치
3. Android SDK 설정

#### 빌드 단계

```bash
# 1. 네이티브 프로젝트 생성 (한 번만)
npx expo prebuild

# 2. Android 빌드
cd android
./gradlew assembleRelease

# 또는 APK 생성
./gradlew bundleRelease
```

**장점:**
- 빌드 횟수 제한 없음
- 완전한 네이티브 기능 테스트 가능

**단점:**
- 로컬 환경 설정 필요
- 시간이 오래 걸릴 수 있음
- 서명 키 관리 필요

### 방법 3: EAS Build 유료 플랜

EAS Build 유료 플랜으로 업그레이드:
- 더 많은 빌드 횟수 제공
- 더 빠른 빌드 속도
- 우선순위 지원

### 방법 4: 무료 플랜 제한 확인

EAS Build 무료 플랜:
- 월별 빌드 제한이 있을 수 있음
- 다음 달까지 대기
- 또는 오래된 빌드 삭제로 공간 확보

## 현재 상황에 맞는 권장 방법

### 단기 해결책 (즉시 테스트)

1. **Expo Go로 코드 변경사항 테스트**
   ```bash
   npx expo start
   ```
   - Google OAuth 코드 변경사항 확인
   - 기본 기능 테스트

2. **로컬에서 Android 빌드** (Google OAuth 완전 테스트 필요 시)
   ```bash
   npx expo prebuild
   cd android
   ./gradlew assembleRelease
   ```

### 장기 해결책

1. **코드 변경사항을 Expo Go로 먼저 테스트**
2. **확신이 생기면 프로덕션 빌드만 생성**
3. **불필요한 빌드 최소화**

## Google OAuth 테스트 전략

### 1단계: Expo Go로 기본 테스트
- 코드 구문 오류 확인
- UI 동작 확인
- 기본 로직 테스트

### 2단계: 로컬 빌드로 Google OAuth 테스트
- 완전한 네이티브 환경에서 Google OAuth 테스트
- 실제 Android 클라이언트 ID 동작 확인

### 3단계: 프로덕션 빌드
- 모든 것이 확인되면 EAS Build로 최종 빌드
- Google Play Console에 업로드

## 로컬 빌드 설정 가이드

### 1. Android Studio 설치
- https://developer.android.com/studio
- Android SDK 및 빌드 도구 설치

### 2. 환경 변수 설정
```bash
# Windows PowerShell
$env:ANDROID_HOME = "C:\Users\YourName\AppData\Local\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools"
```

### 3. 프로젝트 준비
```bash
# 네이티브 프로젝트 생성
npx expo prebuild

# Android 디렉토리로 이동
cd android

# 빌드
./gradlew assembleRelease
```

### 4. APK 위치
빌드된 APK는 다음 위치에 생성됩니다:
```
android/app/build/outputs/apk/release/app-release.apk
```

## 주의사항

1. **서명 키 관리**
   - 로컬 빌드는 로컬 키스토어를 사용합니다
   - EAS Build와 다른 키를 사용할 수 있습니다
   - Google Play Console 업로드 시 키 일치 확인 필요

2. **환경 변수**
   - 로컬 빌드에서는 `.env` 파일의 환경 변수를 사용합니다
   - EAS Secrets는 로컬 빌드에서 사용되지 않습니다

3. **SHA-1 인증서 지문**
   - 로컬 빌드의 SHA-1은 EAS Build와 다를 수 있습니다
   - Google Cloud Console에 로컬 빌드용 SHA-1도 추가해야 할 수 있습니다

## 다음 단계

1. **Expo Go로 코드 변경사항 테스트**
2. **로컬 빌드로 Google OAuth 완전 테스트**
3. **모든 것이 확인되면 EAS Build로 최종 빌드**

이 방법으로 빌드 횟수를 절약하면서도 충분히 테스트할 수 있습니다.
