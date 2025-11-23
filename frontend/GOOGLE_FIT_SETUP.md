# Google Fit API 설정 가이드

## OAuth 동의 화면 설정 (필수)

### 1. Google Cloud Console 접속
- https://console.cloud.google.com/ 접속
- 프로젝트 선택

### 2. OAuth 동의 화면 설정
1. **API 및 서비스** → **OAuth 동의 화면** 이동
2. **사용자 유형 선택**:
   - **외부**: 일반 사용자도 사용 가능 (검토 필요)
   - **내부**: 같은 조직 내 사용자만 사용 가능 (검토 불필요, 권장)

### 3. 앱 정보 입력
- **앱 이름**: PETS (또는 원하는 이름)
- **사용자 지원 이메일**: 본인 이메일
- **앱 로고**: 선택사항
- **앱 도메인**: 선택사항
- **개발자 연락처 정보**: 본인 이메일

### 4. 범위(Scopes) 추가
**범위 추가** 버튼 클릭 후 다음 스코프들을 추가:

```
https://www.googleapis.com/auth/fitness.activity.read
https://www.googleapis.com/auth/fitness.activity.write
https://www.googleapis.com/auth/fitness.body.read
https://www.googleapis.com/auth/fitness.body.write
https://www.googleapis.com/auth/fitness.location.read
https://www.googleapis.com/auth/fitness.location.write
```

또는 **Google Fit API**를 검색하여 추가

### 5. 테스트 사용자 추가 (중요!)
**테스트 사용자** 섹션에서:
1. **+ ADD USERS** 클릭
2. 사용할 Google 계정 이메일 추가 (예: `alsdn6777@gmail.com`)
3. **저장** 클릭

### 6. 게시 상태 확인
- **테스트 중**: 테스트 사용자만 사용 가능 (개발 중 권장)
- **프로덕션**: 모든 사용자 사용 가능 (Google 검토 필요)

## 리디렉션 URI 설정

### 웹 클라이언트 ID 설정
1. **API 및 서비스** → **사용자 인증 정보** 이동
2. **웹 클라이언트 ID** 클릭
3. **승인된 리디렉션 URI**에 다음 추가:

```
https://auth.expo.io/@anonymous/frontend
exp://localhost:8081
exp://127.0.0.1:8081
frontend://
http://localhost:8081
http://localhost:19006
```

## 문제 해결

### "액세스 차단됨" 오류 (403: access_denied)
**원인**: OAuth 동의 화면이 설정되지 않았거나 테스트 사용자가 등록되지 않음

**해결 방법**:
1. OAuth 동의 화면에서 **테스트 사용자**로 본인 이메일 추가
2. **사용자 유형**을 **내부**로 설정 (조직이 없는 경우 **외부** 선택 후 테스트 사용자 추가)
3. 저장 후 몇 분 대기 후 다시 시도

### "redirect_uri_mismatch" 오류 (400)
**원인**: 리디렉션 URI가 Google Cloud Console에 등록되지 않음

**해결 방법**:
1. 웹 클라이언트 ID의 **승인된 리디렉션 URI**에 필요한 URI 추가
2. 저장 후 다시 시도

### Fitness API 활성화 확인
1. **API 및 서비스** → **라이브러리** 이동
2. "Fitness API" 검색
3. **Fitness API** 클릭 후 **사용 설정** 확인

## 빠른 체크리스트

- [ ] OAuth 동의 화면 설정 완료
- [ ] 테스트 사용자 이메일 추가
- [ ] Fitness API 스코프 추가
- [ ] Fitness API 활성화
- [ ] 리디렉션 URI 설정
- [ ] 웹/Android/iOS 클라이언트 ID 생성

## 참고
- 테스트 사용자는 최대 100명까지 추가 가능
- 프로덕션 배포 시 Google 검토 필요 (1-2주 소요)
- 개발 중에는 "테스트 중" 상태로 사용 권장

