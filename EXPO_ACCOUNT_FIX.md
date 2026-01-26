# Expo 계정 권한 오류 해결 방법

## 문제
새 Expo 계정으로 로그인했지만 기존 프로젝트 ID(`b52779a1-0ec1-4e86-a16c-84f0c5cb6b2e`)가 원래 계정에 연결되어 있어 접근할 수 없습니다.

## 해결 방법

### 방법 1: 새 프로젝트 ID 생성 (권장) ✅

새 계정으로 새 프로젝트를 생성합니다:

```bash
# 1. 현재 로그인된 계정 확인
eas whoami

# 2. 새 프로젝트 초기화
eas init

# 3. 기존 프로젝트 ID 제거 후 새 프로젝트 ID 생성
# app.json에서 projectId를 제거하고 eas init 실행
```

**단계별 설명:**

1. `app.json`에서 `projectId` 제거:
   ```json
   "extra": {
     "eas": {
       "projectId": "b52779a1-0ec1-4e86-a16c-84f0c5cb6b2e"  // 이 부분 제거
     }
   }
   ```

2. `eas init` 실행:
   ```bash
   eas init
   ```
   - 새 프로젝트 ID가 자동으로 생성되고 `app.json`에 추가됩니다.

3. 빌드 실행:
   ```bash
   eas build --platform android --profile production
   ```

### 방법 2: 원래 계정으로 다시 로그인

원래 계정이 있다면 다시 로그인:

```bash
eas logout
eas login
# 원래 계정으로 로그인
```

### 방법 3: 프로젝트 소유권 이전 (원래 계정 필요)

원래 계정에서 새 계정으로 소유권 이전:

1. 원래 계정으로 로그인
2. Expo 대시보드에서 프로젝트 설정
3. 새 계정에 권한 부여 또는 소유권 이전

## 주의사항

1. **새 프로젝트 ID 생성 시:**
   - 기존 빌드 히스토리는 새 프로젝트에 연결되지 않습니다
   - EAS Secrets는 새 프로젝트에 다시 설정해야 합니다
   - Google Play Console의 앱은 그대로 유지됩니다 (패키지 이름이 같으면)

2. **EAS Secrets 재설정:**
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "your-value"
   eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "your-value"
   eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value "your-value"
   ```

3. **기존 빌드:**
   - 기존 빌드는 원래 계정에서만 접근 가능합니다
   - 새 프로젝트로 전환하면 새 빌드부터 시작합니다

## 권장 순서

1. **새 프로젝트 ID 생성** (가장 간단)
2. **EAS Secrets 재설정**
3. **빌드 테스트**

이 방법으로 새 계정에서 빌드를 진행할 수 있습니다.
