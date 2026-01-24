# Google OAuth 2.0 정책 위반 오류 해결

## 오류 메시지
```
You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy for keeping apps secure.
오류 400: invalid_request
요청 세부정보: redirect_uri=frontend://
```

## 문제 원인

Android 앱에서 커스텀 URI 스킴(`frontend://`)을 `redirectUri`로 명시적으로 설정하면 Google OAuth 2.0 정책을 위반합니다.

Google은 보안상의 이유로 Android 앱에서 커스텀 URI 스킴을 직접 사용하는 것을 허용하지 않습니다. 대신:
- Android 클라이언트 ID는 **패키지 이름**과 **SHA-1 인증서 지문**만 사용합니다
- `expo-auth-session`이 자동으로 올바른 리디렉션을 처리합니다

## 해결 방법

### 1. 코드 수정 완료 ✅

`redirectUri`를 제거했습니다:
```typescript
// ❌ 잘못된 방법 (정책 위반)
const [request, response, promptAsync] = Google.useAuthRequest({
  webClientId: webClientId,
  androidClientId: androidClientId,
  iosClientId: iosClientId,
  redirectUri: Platform.OS === 'android' ? 'frontend://' : undefined, // ❌
});

// ✅ 올바른 방법
const [request, response, promptAsync] = Google.useAuthRequest({
  webClientId: webClientId,
  androidClientId: androidClientId,
  iosClientId: iosClientId,
  // redirectUri를 설정하지 않음 - expo-auth-session이 자동 처리
});
```

### 2. Google Cloud Console 확인

Android OAuth 클라이언트 ID 설정 확인:
1. **패키지 이름**: `com.idog.googlelogin` (정확히 일치)
2. **SHA-1 인증서 지문**: EAS 빌드용 키스토어의 SHA-1이 추가되어 있는지 확인

**중요**: Android 클라이언트 ID에는 "승인된 리디렉션 URI" 필드가 **없습니다**. 이것은 정상입니다.

### 3. 새 빌드 생성

코드를 수정했으므로 **반드시 새 빌드를 생성**해야 합니다:

```bash
eas build --platform android --profile production
```

## Android OAuth 동작 방식

Android 앱에서 Google OAuth는 다음과 같이 동작합니다:

1. **패키지 이름 확인**: Google이 앱의 패키지 이름(`com.idog.googlelogin`)을 확인합니다
2. **SHA-1 인증서 확인**: 앱이 서명된 인증서의 SHA-1 지문을 확인합니다
3. **자동 리디렉션**: 인증 성공 후 Google이 자동으로 앱으로 리디렉션합니다
4. **커스텀 URI 스킴**: `app.json`의 `scheme: "frontend"` 설정으로 앱이 리디렉션을 받습니다

**커스텀 URI 스킴(`frontend://`)은 Google Cloud Console에 추가할 필요가 없습니다.**

## 체크리스트

- [x] 코드에서 `redirectUri` 제거 완료 ✅
- [ ] Google Cloud Console에서 Android 클라이언트 ID 확인
  - [ ] 패키지 이름: `com.idog.googlelogin`
  - [ ] SHA-1 인증서 지문 추가됨
- [ ] 새 빌드 생성
- [ ] 테스트

## 참고

- Android OAuth 클라이언트는 **리디렉션 URI를 사용하지 않습니다**
- `expo-auth-session`이 자동으로 올바른 리디렉션을 처리합니다
- `app.json`의 `scheme: "frontend"`는 앱 내부에서만 사용됩니다 (Google Cloud Console에 추가할 필요 없음)

새 빌드를 생성하고 테스트해보세요!
