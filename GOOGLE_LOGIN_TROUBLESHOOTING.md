# Google 로그인 문제 해결 가이드

## 현재 상황
- EAS Secrets는 설정되어 있음 ✅
- `build.gradle`의 패키지 이름: `com.idog.googlelogin` ✅
- `app.json`의 패키지 이름: `com.idog.googlelogin` ✅

## 문제 진단 단계

### 1. Google Cloud Console 확인

**Android OAuth 클라이언트 ID 설정 확인:**

1. https://console.cloud.google.com/ 접속
2. **API 및 서비스 > 사용자 인증 정보**로 이동
3. **OAuth 2.0 클라이언트 ID** 목록에서 Android 클라이언트 찾기
4. 클릭하여 상세 정보 확인

**확인 사항:**
- ✅ **패키지 이름**이 정확히 `com.idog.googlelogin`인지 확인
- ✅ **클라이언트 ID** 형식이 올바른지 확인 (예: `123456789-abc...xyz.apps.googleusercontent.com`)
- ❌ 패키지 이름이 `com.pets.app` 또는 다른 값이면 **수정 필요**

**패키지 이름 수정 방법:**
1. 기존 Android 클라이언트 ID 삭제 (또는 새로 생성)
2. **OAuth 2.0 클라이언트 ID 만들기** 클릭
3. **애플리케이션 유형**: Android 선택
4. **이름**: 원하는 이름 (예: "PETS Android")
5. **패키지 이름**: `com.idog.googlelogin` 입력
6. **SHA-1 인증서 지문**: (선택사항, Google Play Console에서 자동 관리)
7. **만들기** 클릭
8. 생성된 **클라이언트 ID 복사**

### 2. EAS Secrets 확인 및 업데이트

**현재 설정된 Secrets 확인:**
```bash
eas secret:list
```

**Android 클라이언트 ID 업데이트:**
```bash
# 기존 Secret 삭제
eas secret:delete --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID

# 새 클라이언트 ID로 재생성
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "여기에_새로운_클라이언트_ID_입력"
```

**클라이언트 ID 형식 확인:**
- 올바른 형식: `123456789-abc...xyz.apps.googleusercontent.com`
- 잘못된 형식: `123456789-abc...xyz` (`.apps.googleusercontent.com` 없음)

### 3. 앱 빌드 및 테스트

**새 빌드 생성:**
```bash
eas build --platform android --profile production
```

**디버깅 로그 확인:**
앱 실행 시 개발자 콘솔에서 다음 로그 확인:
```
=== Google OAuth 클라이언트 ID 확인 ===
플랫폼: android
Web Client ID: ...
Android Client ID: ...
현재 플랫폼 Client ID: ...
패키지 이름 (app.json): com.idog.googlelogin
=====================================
```

**로그인 시도 시 에러 로그:**
```
구글 로그인 에러: ...
에러 코드: invalid_client
에러 메시지: ...
사용된 클라이언트 ID: ...
```

### 4. 일반적인 문제 및 해결 방법

#### 문제 1: "OAuth client was not found" (401 invalid_client)

**원인:**
- Google Cloud Console의 패키지 이름과 앱의 패키지 이름이 일치하지 않음
- 클라이언트 ID가 잘못되었거나 삭제됨
- EAS Secrets에 잘못된 클라이언트 ID가 저장됨

**해결:**
1. Google Cloud Console에서 Android OAuth 클라이언트 ID의 패키지 이름 확인
2. `com.idog.googlelogin`과 정확히 일치하는지 확인
3. 일치하지 않으면 새 클라이언트 ID 생성
4. EAS Secrets 업데이트
5. 새 빌드 생성

#### 문제 2: "Missing required parameter: client_id" (400 invalid_request)

**원인:**
- 환경 변수가 빌드에 포함되지 않음
- EAS Secrets가 설정되지 않음

**해결:**
1. `eas secret:list`로 Secrets 확인
2. 없으면 `eas secret:create`로 생성
3. 새 빌드 생성

#### 문제 3: 클라이언트 ID가 로그에 표시되지 않음

**원인:**
- 환경 변수가 빌드 시 주입되지 않음
- `EXPO_PUBLIC_` 접두사 누락

**해결:**
1. Secret 이름이 `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`인지 확인
2. `EXPO_PUBLIC_` 접두사 필수
3. 새 빌드 생성

### 5. 체크리스트

빌드 전 확인:
- [ ] Google Cloud Console에서 Android OAuth 클라이언트 ID의 패키지 이름이 `com.idog.googlelogin`
- [ ] 클라이언트 ID 형식이 올바름 (`.apps.googleusercontent.com` 포함)
- [ ] EAS Secrets에 `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` 설정됨
- [ ] `app.json`의 `android.package`가 `com.idog.googlelogin`
- [ ] `build.gradle`의 `applicationId`가 `com.idog.googlelogin`

빌드 후 확인:
- [ ] 개발자 콘솔에서 클라이언트 ID가 로그에 표시됨
- [ ] 로그인 시도 시 구체적인 에러 메시지 확인
- [ ] 에러 코드와 메시지에 따라 위의 해결 방법 적용

## 추가 도움말

문제가 계속되면:
1. 개발자 콘솔의 전체 에러 로그 복사
2. Google Cloud Console의 OAuth 클라이언트 ID 스크린샷
3. `eas secret:list` 출력 결과

이 정보들을 함께 확인하면 더 정확한 진단이 가능합니다.
