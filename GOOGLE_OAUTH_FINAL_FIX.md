# Google OAuth "Custom URI scheme is not enabled" 최종 해결 방법

## 현재 상황
- Android 클라이언트 ID 설정 완료 ✅
- 패키지 이름: `com.idog.googlelogin` ✅
- SHA-1 인증서 지문 추가됨 ✅
- `app.json`의 `scheme: "frontend"` 설정됨 ✅
- 하지만 여전히 "Custom URI scheme is not enabled" 오류 발생 ❌

## 추가 확인 사항

### 1. 코드 수정 완료
코드에 `redirectUri`를 명시적으로 추가했습니다:
```typescript
const [request, response, promptAsync] = Google.useAuthRequest({
  webClientId: webClientId,
  androidClientId: androidClientId,
  iosClientId: iosClientId,
  redirectUri: Platform.OS === 'android' ? 'frontend://' : undefined,
});
```

### 2. Google Cloud Console 재확인

**중요:** Android 클라이언트 ID가 올바르게 생성되었는지 다시 확인하세요:

1. **Google Cloud Console 접속**
   https://console.cloud.google.com/apis/credentials

2. **Android OAuth 클라이언트 ID 확인**
   - 클라이언트 ID 클릭
   - **패키지 이름**이 정확히 `com.idog.googlelogin`인지 확인 (대소문자 구분)
   - **SHA-1 인증서 지문**이 추가되어 있는지 확인

3. **클라이언트 ID 값 확인**
   - 클라이언트 ID 형식: `123456789-abc...xyz.apps.googleusercontent.com`
   - EAS Secrets에 저장된 값과 일치하는지 확인

### 3. EAS Secrets 재확인

```bash
eas secret:list
```

Android 클라이언트 ID가 올바르게 설정되어 있는지 확인하세요.

### 4. 새 빌드 생성

코드를 수정했으므로 **반드시 새 빌드를 생성**해야 합니다:

```bash
eas build --platform android --profile production
```

### 5. 디버깅 로그 확인

앱 실행 후 개발자 콘솔에서 다음을 확인하세요:
- Android Client ID가 올바르게 로드되는지
- 실제로 사용되는 클라이언트 ID 값

## 추가 해결 방법

### 방법 1: Android 클라이언트 ID 재생성

기존 클라이언트 ID를 삭제하고 새로 생성:

1. Google Cloud Console에서 기존 Android 클라이언트 ID 삭제
2. 새로 생성:
   - 애플리케이션 유형: **Android**
   - 패키지 이름: `com.idog.googlelogin` (정확히 일치)
   - SHA-1 인증서 지문: (개발용은 선택사항)
3. EAS Secrets 업데이트:
   ```bash
   eas secret:delete --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
   eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "새로운-클라이언트-ID"
   ```
4. 새 빌드 생성

### 방법 2: expo-auth-session 버전 확인

`package.json`에서 `expo-auth-session` 버전 확인:
```json
{
  "dependencies": {
    "expo-auth-session": "~7.0.9"
  }
}
```

최신 버전으로 업데이트:
```bash
npx expo install expo-auth-session
```

### 방법 3: AndroidManifest.xml 확인

빌드된 APK/AAB의 `AndroidManifest.xml`에 커스텀 URI 스킴이 등록되어 있는지 확인:

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="frontend" />
</intent-filter>
```

이것은 `app.json`의 `scheme` 설정으로 자동 생성되어야 합니다.

## 체크리스트

- [ ] 코드에 `redirectUri` 추가됨 ✅
- [ ] Google Cloud Console에서 Android 클라이언트 ID 확인
- [ ] 패키지 이름이 정확히 `com.idog.googlelogin`인지 확인
- [ ] SHA-1 인증서 지문이 추가되어 있는지 확인
- [ ] EAS Secrets에 올바른 클라이언트 ID가 설정되어 있는지 확인
- [ ] 새 빌드 생성
- [ ] 디버깅 로그 확인

## 참고

"Custom URI scheme is not enabled" 오류는 보통 다음 중 하나의 문제입니다:
1. Android 클라이언트 ID가 올바르게 설정되지 않음
2. 패키지 이름이 일치하지 않음
3. 빌드 시 환경 변수가 제대로 주입되지 않음
4. `expo-auth-session`이 커스텀 URI 스킴을 인식하지 못함

코드 수정 후 새 빌드를 생성하고 테스트해보세요.
