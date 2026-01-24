# Google OAuth Android 클라이언트 ID 설정 가이드

## 오류 메시지
```
Custom URI scheme is not enabled for your Android client.
요청 세부정보: flowName=GeneralOAuthFlow
```

## 문제 원인

이 오류는 Google Cloud Console의 **Android OAuth 클라이언트 ID** 설정이 올바르지 않을 때 발생합니다.

## 해결 방법

### 1단계: Google Cloud Console에서 Android 클라이언트 ID 확인

1. **Google Cloud Console 접속**
   https://console.cloud.google.com/apis/credentials

2. **프로젝트 선택**
   - 상단에서 올바른 프로젝트를 선택했는지 확인

3. **Android OAuth 클라이언트 ID 찾기**
   - "사용자 인증 정보" 페이지에서 "OAuth 2.0 클라이언트 ID" 목록 확인
   - **애플리케이션 유형이 "Android"**인 클라이언트 ID 찾기

4. **Android 클라이언트 ID 클릭하여 상세 정보 확인**

### 2단계: 필수 설정 확인

Android 클라이언트 ID의 다음 항목을 확인하세요:

#### ✅ 패키지 이름 (Package name)
- **정확한 값**: `com.idog.googlelogin`
- **대소문자 구분**: 정확히 일치해야 합니다
- **공백 없음**: 앞뒤 공백이 없어야 합니다

#### ✅ SHA-1 인증서 지문 (Certificate fingerprints)
- **EAS 빌드용 SHA-1**이 추가되어 있어야 합니다
- 개발용 SHA-1도 추가하는 것을 권장합니다

**SHA-1 확인 방법:**
```bash
# PowerShell에서 실행
powershell -ExecutionPolicy Bypass -File scripts\get-sha1.ps1
```

### 3단계: Android 클라이언트 ID 재생성 (필요 시)

기존 클라이언트 ID가 올바르게 설정되지 않은 경우:

1. **기존 Android 클라이언트 ID 삭제**
   - 클라이언트 ID 옆의 삭제 아이콘 클릭
   - 확인

2. **새 Android 클라이언트 ID 생성**
   - "사용자 인증 정보 만들기" > "OAuth 클라이언트 ID"
   - 애플리케이션 유형: **Android**
   - 이름: `PETS Android` (원하는 이름)
   - 패키지 이름: `com.idog.googlelogin` (정확히 입력)
   - SHA-1 인증서 지문: EAS 빌드용 SHA-1 입력
   - "만들기" 클릭

3. **클라이언트 ID 복사**
   - 생성된 클라이언트 ID를 복사
   - 형식: `123456789-abc...xyz.apps.googleusercontent.com`

### 4단계: EAS Secrets 업데이트

새 클라이언트 ID를 EAS Secrets에 등록:

```bash
# 기존 secret 삭제
eas secret:delete --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID

# 새 secret 생성
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "새로운-클라이언트-ID"
```

### 5단계: 새 빌드 생성

```bash
eas build --platform android --profile production
```

## 체크리스트

- [ ] Google Cloud Console에서 올바른 프로젝트 선택
- [ ] Android OAuth 클라이언트 ID 존재 확인
- [ ] 패키지 이름이 정확히 `com.idog.googlelogin`인지 확인
- [ ] SHA-1 인증서 지문이 추가되어 있는지 확인
- [ ] 클라이언트 ID 값이 EAS Secrets와 일치하는지 확인
- [ ] 새 빌드 생성 및 테스트

## 중요 사항

### ❌ 하지 말아야 할 것
- Android 클라이언트 ID에 "승인된 리디렉션 URI" 추가 시도 (필드가 없음)
- Web 클라이언트 ID에 `frontend://` 추가 시도 (HTTP/HTTPS만 허용)
- 패키지 이름에 공백이나 오타

### ✅ 해야 할 것
- 패키지 이름을 정확히 `com.idog.googlelogin`으로 입력
- SHA-1 인증서 지문을 정확히 입력
- 클라이언트 ID를 EAS Secrets에 올바르게 등록
- 새 빌드 생성

## 추가 디버깅

앱 실행 후 개발자 콘솔에서 다음을 확인하세요:

```
=== Google OAuth 클라이언트 ID 확인 ===
플랫폼: android
Android Client ID: 123456789-abc...xyz
패키지 이름 (app.json): com.idog.googlelogin
```

Android Client ID가 올바르게 로드되는지 확인하세요.

## 참고

- Android OAuth 클라이언트는 **리디렉션 URI를 사용하지 않습니다**
- 패키지 이름과 SHA-1만으로 인증합니다
- `app.json`의 `scheme: "frontend"`는 앱 내부에서만 사용됩니다

이 가이드를 따라 설정을 다시 확인하고 새 빌드를 생성해보세요.
