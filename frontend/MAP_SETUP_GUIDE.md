# 지도 기능 설정 가이드

운동 시작 전에 GPS 지도를 표시하기 위해 필요한 설정입니다.

## 1. react-native-maps 패키지 설치

```bash
cd frontend
npx expo install react-native-maps
```

## 2. Google Maps API 키 설정

### 2.1 Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 프로젝트 선택 또는 새 프로젝트 생성
3. **API 및 서비스 > 라이브러리**로 이동
4. 다음 API를 활성화:
   - **Maps SDK for Android**
   - **Maps SDK for iOS**

### 2.2 API 키 생성

1. **API 및 서비스 > 사용자 인증 정보**로 이동
2. **+ 사용자 인증 정보 만들기 > API 키** 클릭
3. 생성된 API 키를 복사

### 2.3 API 키 제한 설정 (권장)

보안을 위해 API 키에 제한을 설정하는 것을 권장합니다:

1. 생성한 API 키를 클릭하여 편집
2. **애플리케이션 제한사항**:
   - Android: Android 앱 추가 (패키지 이름: `com.idog.googlelogin`, SHA-1 인증서 지문)
   - iOS: iOS 번들 ID 추가 (번들 ID: `com.idog.googlelogin`)
3. **API 제한사항**:
   - **Maps SDK for Android** 선택
   - **Maps SDK for iOS** 선택

### 2.4 app.json에 API 키 추가

`app.json` 파일에 다음 설정을 추가:

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_ANDROID_API_KEY"
        }
      }
    },
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_IOS_API_KEY"
      }
    }
  }
}
```

**참고**: Android와 iOS는 동일한 API 키를 사용할 수 있지만, 제한 설정이 다를 수 있습니다.

## 3. Android SHA-1 인증서 지문 확인

### 개발 빌드 (Expo Go 사용 시)

Expo Go를 사용하는 경우, Expo의 기본 인증서를 사용합니다. SHA-1 지문은 Expo 문서를 참조하세요.

### 프로덕션 빌드 (EAS Build)

EAS Build를 사용하는 경우:

```bash
eas credentials
```

명령어로 인증서 정보를 확인할 수 있습니다.

### 로컬 빌드

로컬에서 빌드하는 경우:

**Windows (PowerShell)**:
```powershell
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**macOS/Linux**:
```bash
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

출력된 SHA-1 지문을 Google Cloud Console의 API 키 제한 설정에 추가합니다.

## 4. 테스트

설정이 완료되면:

1. 앱을 다시 빌드 (네이티브 설정 변경이므로)
2. 유산소 모드 선택
3. "운동 시작" 버튼 클릭
4. 지도 모달이 표시되는지 확인
5. 현재 위치가 지도에 표시되는지 확인
6. "시작하기" 버튼 클릭 시 타이머가 시작되는지 확인

## 5. 문제 해결

### 지도가 표시되지 않는 경우

1. **API 키 확인**: `app.json`에 올바른 API 키가 설정되어 있는지 확인
2. **API 활성화 확인**: Google Cloud Console에서 Maps SDK가 활성화되어 있는지 확인
3. **제한 설정 확인**: API 키 제한 설정이 올바른지 확인 (특히 SHA-1 지문)
4. **빌드 확인**: 네이티브 설정 변경 후 앱을 다시 빌드했는지 확인

### 위치 권한 오류

- Android: `AndroidManifest.xml`에 위치 권한이 있는지 확인
- iOS: `app.json`의 `infoPlist`에 위치 권한 설명이 있는지 확인

### 빌드 오류

`react-native-maps`는 네이티브 모듈이므로, 개발 빌드를 다시 생성해야 합니다:

```bash
npx expo prebuild --clean
npx expo run:android
# 또는
npx expo run:ios
```

## 6. 참고 자료

- [react-native-maps 문서](https://github.com/react-native-maps/react-native-maps)
- [Expo Maps 설정](https://docs.expo.dev/versions/latest/sdk/map-view/)
- [Google Maps API 가이드](https://developers.google.com/maps/documentation)
