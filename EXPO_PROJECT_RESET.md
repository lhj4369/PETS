# Expo 프로젝트 초기화 가이드

## 현재 상태

- **새 Expo 계정**: `kachu0514`
- **새 프로젝트 ID**: `29635f77-1c47-4420-9041-e8392363caa3`
- **프로젝트 설정**: 동기화 완료

## 초기화 완료된 항목

### 1. 프로젝트 ID 동기화 ✅
- `app.json`: 새 projectId 설정됨
- `frontend/app.json`: 새 projectId 추가됨

### 2. EAS 설정 확인 ✅
- `eas.json`: 기본 설정 확인됨

## 다음 단계: EAS Credentials 초기화

새 프로젝트이므로 EAS credentials를 새로 설정해야 합니다.

### 1. EAS Credentials 확인

```bash
eas credentials
```

선택:
- **Android** 선택
- **Keystore** 확인
- 새 프로젝트이므로 keystore가 없을 수 있음 (첫 빌드 시 자동 생성)

### 2. EAS Secrets 재설정

새 프로젝트이므로 환경 변수를 다시 설정해야 합니다:

```bash
# Google OAuth 클라이언트 ID 설정
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "your-web-client-id"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "your-android-client-id"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value "your-ios-client-id"
```

### 3. 첫 빌드 실행

```bash
eas build --platform android --profile production
```

첫 빌드 시:
- 새 keystore 자동 생성
- EAS 서버에 저장됨
- 이후 빌드에서 재사용됨

## 기존 데이터 처리

### 기존 빌드 히스토리
- 새 프로젝트이므로 기존 빌드 히스토리는 연결되지 않음
- 새 빌드부터 시작

### 기존 Keystore
- 원래 계정의 EAS 서버에 남아있음
- 필요 시 원래 계정으로 로그인하여 다운로드 가능
- 새 프로젝트에서는 새 keystore 사용

### Google Play Console
- 같은 패키지 이름(`com.idog.googlelogin`)이면 기존 앱과 연결됨
- 새 keystore 사용 시 서명 오류 발생 가능
- 해결 방법:
  1. 원래 계정에서 keystore 다운로드
  2. 새 프로젝트에 업로드
  3. 또는 새 앱으로 등록

## 초기화 체크리스트

- [x] 새 프로젝트 ID 설정
- [x] `app.json` 동기화
- [x] `frontend/app.json` 동기화
- [ ] EAS Secrets 재설정
- [ ] 첫 빌드 실행
- [ ] Google Play Console 설정 확인 (필요 시)

## 주의사항

1. **EAS Secrets는 새로 설정해야 함**
   - 기존 secrets는 원래 계정에 연결되어 있음
   - 새 프로젝트에 다시 설정 필요

2. **Keystore는 첫 빌드 시 자동 생성**
   - 수동으로 생성할 필요 없음
   - EAS 서버에 안전하게 저장됨

3. **Google Play Console 연동**
   - 같은 패키지 이름이면 기존 앱과 연결
   - 서명 키 일치 확인 필요

## 다음 작업

1. **EAS Secrets 설정**
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "your-value"
   ```

2. **첫 빌드 실행**
   ```bash
   eas build --platform android --profile production
   ```

3. **빌드 완료 후 테스트**

초기화가 완료되었습니다! 이제 새 계정으로 빌드를 진행할 수 있습니다.
