# Google OAuth 리디렉션 URI 설정 가이드

## 오류 메시지
```
Custom URI scheme is not enabled for your Android client.
400 오류: invalid_request
```

## 원인
Google Cloud Console의 Android OAuth 클라이언트 ID에 리디렉션 URI가 설정되지 않았습니다.

## 해결 방법

### 1. Google Cloud Console 접속
https://console.cloud.google.com/apis/credentials

### 2. Android OAuth 클라이언트 ID 편집
1. **OAuth 2.0 클라이언트 ID** 목록에서 Android 클라이언트 찾기
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

## 추가 리디렉션 URI (선택사항)

개발 환경에서 Expo Go를 사용하는 경우, 다음 URI도 추가할 수 있습니다:

```
exp://
```

하지만 프로덕션 빌드에서는 `frontend://`만 필요합니다.

## 확인 사항

### app.json 설정 확인
현재 `app.json`의 `scheme` 값:
```json
{
  "expo": {
    "scheme": "frontend"
  }
}
```

이 값과 Google Cloud Console의 리디렉션 URI가 일치해야 합니다.

## 전체 설정 체크리스트

- [ ] Google Cloud Console에서 Android OAuth 클라이언트 ID 선택
- [ ] "승인된 리디렉션 URI" 섹션에 `frontend://` 추가
- [ ] 패키지 이름이 `com.idog.googlelogin`인지 확인
- [ ] SHA-1 인증서 지문이 추가되어 있는지 확인 (개발용)
- [ ] 변경사항 저장
- [ ] 새 빌드 생성 및 테스트

## 참고

- 리디렉션 URI는 정확히 일치해야 합니다 (대소문자 구분)
- 여러 URI를 추가할 수 있습니다 (각 줄에 하나씩)
- 변경사항이 적용되는 데 몇 분이 걸릴 수 있습니다
