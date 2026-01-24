# Google OAuth Android 리디렉션 URI 설정 (수정)

## 중요: Android 클라이언트에는 리디렉션 URI 필드가 없습니다!

Google Cloud Console의 **Android OAuth 클라이언트 ID**에는 "승인된 리디렉션 URI" 섹션이 **없습니다**.

Android 클라이언트는 다음만 사용합니다:
- ✅ **패키지 이름** (`com.idog.googlelogin`)
- ✅ **SHA-1 인증서 지문**

## 해결 방법: Web 클라이언트 ID에 리디렉션 URI 추가

Expo는 커스텀 URI 스킴을 사용하므로, **Web 클라이언트 ID**에 리디렉션 URI를 추가해야 합니다.

### 1. Google Cloud Console 접속
https://console.cloud.google.com/apis/credentials

### 2. Web 클라이언트 ID 편집
1. **OAuth 2.0 클라이언트 ID** 목록에서 **Web 애플리케이션** 클라이언트 찾기
2. 클라이언트 ID 클릭하여 상세 정보 열기
3. **편집** 버튼 클릭

### 3. 승인된 리디렉션 URI 추가
**"승인된 리디렉션 URI"** 섹션에 다음 URI를 추가:

```
frontend://
```

**중요:**
- URI 끝에 슬래시(`/`)를 포함해야 합니다
- `app.json`의 `scheme` 값과 일치해야 합니다 (현재: `"frontend"`)

### 4. 저장
**저장** 버튼을 클릭하여 변경사항 저장

## 왜 Web 클라이언트 ID인가?

Expo의 `expo-auth-session`은:
- Android에서 `androidClientId`를 사용하여 인증을 시작하지만
- 리디렉션은 커스텀 URI 스킴(`frontend://`)을 사용합니다
- 이 리디렉션 URI는 **Web 클라이언트 ID**에 등록되어야 합니다

## 전체 설정 체크리스트

### Android 클라이언트 ID:
- [ ] 패키지 이름: `com.idog.googlelogin`
- [ ] SHA-1 인증서 지문 추가됨

### Web 클라이언트 ID:
- [ ] "승인된 리디렉션 URI"에 `frontend://` 추가됨
- [ ] 변경사항 저장됨

### app.json:
- [ ] `scheme: "frontend"` 설정 확인

## 참고

- Android 클라이언트는 리디렉션 URI를 사용하지 않습니다
- Web 클라이언트에 리디렉션 URI를 추가하면 Android 앱의 커스텀 URI 스킴 리디렉션이 작동합니다
- 변경사항이 적용되는 데 몇 분이 걸릴 수 있습니다
