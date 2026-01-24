# Google OAuth 커스텀 URI 스킴 오류 해결

## 문제
- "Custom URI scheme is not enabled for your Android client" 오류
- Web 클라이언트 ID에 `frontend://`를 추가하려고 하면 "도메인이 포함되어야 합니다" 오류

## 원인
Google Cloud Console의 Web 클라이언트 ID는 HTTP/HTTPS URL만 허용합니다. 커스텀 URI 스킴(`frontend://`)은 허용되지 않습니다.

## 해결 방법

### 방법 1: Android 클라이언트 ID만 사용 (권장)

Expo의 `expo-auth-session`은 Android에서 `androidClientId`만 제공하면 리디렉션을 자동으로 처리합니다. 하지만 "Custom URI scheme is not enabled" 오류가 발생한다면, 다음을 확인하세요:

1. **Android 클라이언트 ID 설정 확인:**
   - 패키지 이름: `com.idog.googlelogin` ✅
   - SHA-1 인증서 지문: 추가됨 ✅

2. **app.json의 scheme 확인:**
   ```json
   {
     "expo": {
       "scheme": "frontend"
     }
   }
   ```

3. **코드에서 Web 클라이언트 ID 제거 (선택사항):**
   Android만 사용하는 경우, `webClientId`를 제공하지 않아도 됩니다. 하지만 제공해도 문제없습니다.

### 방법 2: Web 클라이언트 ID에 올바른 형식 추가

Expo Go를 사용하는 경우, Web 클라이언트 ID에 다음 형식으로 리디렉션 URI를 추가할 수 있습니다:

```
https://auth.expo.io/@your-expo-username/your-app-slug
```

하지만 EAS 빌드(standalone 앱)를 사용하는 경우 이 방법은 작동하지 않을 수 있습니다.

### 방법 3: redirectUri 명시적으로 설정

코드에서 `redirectUri`를 명시적으로 설정할 수 있습니다:

```typescript
const [request, response, promptAsync] = Google.useAuthRequest({
  webClientId: webClientId,
  androidClientId: androidClientId,
  iosClientId: iosClientId,
  redirectUri: Platform.OS === 'android' ? `${scheme}://` : undefined,
});
```

하지만 이것도 "Custom URI scheme is not enabled" 오류를 해결하지 못할 수 있습니다.

## 실제 해결 방법

"Custom URI scheme is not enabled" 오류는 **Google Cloud Console에서 Android 클라이언트 ID의 설정이 완전하지 않을 때** 발생합니다.

### 확인 사항:

1. **Android 클라이언트 ID가 올바르게 생성되었는지 확인:**
   - Google Cloud Console > API 및 서비스 > 사용자 인증 정보
   - Android OAuth 클라이언트 ID 클릭
   - 패키지 이름이 정확히 `com.idog.googlelogin`인지 확인
   - SHA-1 인증서 지문이 추가되어 있는지 확인

2. **새 Android 클라이언트 ID 생성 (필요시):**
   - 기존 클라이언트 ID 삭제
   - 새로 생성:
     - 애플리케이션 유형: **Android**
     - 패키지 이름: `com.idog.googlelogin`
     - SHA-1 인증서 지문: (개발용은 선택사항, 프로덕션은 Google Play가 자동 관리)

3. **EAS Secrets 업데이트:**
   ```bash
   eas secret:delete --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
   eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "새로운-클라이언트-ID"
   ```

4. **새 빌드 생성:**
   ```bash
   eas build --platform android --profile production
   ```

## 참고

- Android 클라이언트 ID는 리디렉션 URI를 사용하지 않습니다
- 커스텀 URI 스킴은 Android 앱의 `AndroidManifest.xml`에 자동으로 등록됩니다
- "Custom URI scheme is not enabled" 오류는 보통 클라이언트 ID 설정 문제입니다

## 체크리스트

- [ ] Android 클라이언트 ID의 패키지 이름이 `com.idog.googlelogin`인지 확인
- [ ] SHA-1 인증서 지문이 추가되어 있는지 확인 (개발용)
- [ ] `app.json`의 `scheme`이 `"frontend"`인지 확인
- [ ] EAS Secrets에 올바른 Android 클라이언트 ID가 설정되어 있는지 확인
- [ ] 새 빌드 생성 및 테스트
