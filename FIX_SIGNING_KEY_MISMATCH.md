# Google Play 서명 키 불일치 해결 방법

## 문제
"기존 사용자가 새롭게 추가된 App Bundle로 업그레이드하지 못하므로 이 버전은 출시할 수 없습니다"

**원인**: 새 Expo 계정으로 전환하면서 새 keystore가 생성되어, 기존 Google Play Console 앱과 서명이 일치하지 않습니다.

## 해결 방법

### 방법 1: 원래 계정의 Keystore를 새 프로젝트에 업로드 (권장) ✅

기존 사용자가 업그레이드할 수 있도록 원래 keystore를 사용해야 합니다.

#### 1단계: 원래 계정으로 로그인

```bash
# 현재 계정에서 로그아웃
eas logout

# 원래 계정으로 로그인
eas login
# 원래 계정 이메일/비밀번호 입력
```

#### 2단계: 원래 프로젝트로 전환

```bash
# 원래 프로젝트 ID로 app.json 수정
# 또는 원래 계정의 프로젝트로 이동
```

`app.json`에서 원래 프로젝트 ID로 변경:
```json
"extra": {
  "eas": {
    "projectId": "b52779a1-0ec1-4e86-a16c-84f0c5cb6b2e"
  }
}
```

#### 3단계: Keystore 다운로드

```bash
eas credentials
```

선택 순서:
1. **Android** 선택
2. **production** 선택 (Google Play Console 업로드용)
3. **Keystore** 선택
4. **Download** 선택
5. Keystore 파일과 비밀번호 저장 (안전한 곳에 보관)

#### 4단계: 새 계정으로 전환

```bash
# 원래 계정에서 로그아웃
eas logout

# 새 계정으로 로그인
eas login
# 새 계정 (kachu123) 이메일/비밀번호 입력
```

#### 5단계: 새 프로젝트에 Keystore 업로드

**중요**: 먼저 `app.json`을 새 프로젝트 ID로 변경하거나 새 프로젝트를 생성해야 합니다.

**5-1. 새 프로젝트 생성 (프로젝트 ID가 없는 경우)**

```bash
# app.json에서 projectId 제거 후
eas init
# "Would you like to create a project for @kachu123/pets?" → Y 입력
```

또는 프로젝트 ID 없이 첫 빌드 시 자동 생성:

```bash
# app.json에서 projectId 제거
eas build --platform android --profile production
# 새 프로젝트 생성 여부 묻는 프롬프트 → Y 입력
# 빌드는 취소해도 됨 (프로젝트만 생성)
```

**5-2. app.json을 새 프로젝트 ID로 변경**

`app.json`에서:
```json
"extra": {
  "eas": {
    "projectId": "29635f77-1c47-4420-9041-e8392363caa3"  // 새 프로젝트 ID
  }
}
```

**5-3. Keystore 업로드**

```bash
eas credentials
```

선택 순서:
1. **Android** 선택
2. **production** 선택 (Google Play Console 업로드용)
   - `development`: 개발용 (테스트 빌드)
   - `preview`: 미리보기용 (내부 배포)
   - **`production`**: 프로덕션용 (Google Play Console 업로드) ✅
3. **Keystore** 선택
4. **Set up a new keystore** 선택 (새 프로젝트이므로)
   - 다음 메뉴에서 **Upload existing keystore** 또는 **Use existing keystore** 선택
5. 다운로드한 keystore 파일과 비밀번호 입력

**참고**: 
- 새 프로젝트에는 keystore가 없으므로 "Set up a new keystore"를 선택합니다
- 이미 keystore가 있다면 "Change default keystore"를 선택할 수 있습니다

**주의**: `app.json`에 원래 프로젝트 ID(`b52779a1-0ec1-4e86-a16c-84f0c5cb6b2e`)가 설정되어 있으면 권한 오류가 발생합니다. 반드시 새 프로젝트 ID로 변경하거나 프로젝트 ID를 제거한 후 새 프로젝트를 생성하세요.

#### 6단계: 빌드 및 업로드

```bash
eas build --platform android --profile production
eas submit --platform android
```

### 방법 2: 원래 계정으로 빌드 (간단)

원래 계정으로 돌아가서 빌드하는 것이 가장 간단합니다.

#### 1단계: 원래 계정으로 로그인

```bash
eas logout
eas login
# 원래 계정 이메일/비밀번호 입력
```

#### 2단계: 원래 프로젝트 ID로 변경

`app.json`에서:
```json
"extra": {
  "eas": {
    "projectId": "b52779a1-0ec1-4e86-a16c-84f0c5cb6b2e"
  }
}
```

#### 3단계: 빌드 및 업로드

```bash
eas build --platform android --profile production
eas submit --platform android
```

### 방법 3: Google Play App Signing 사용 (고급)

Google Play Console에서 "App Signing by Google Play"를 사용 중이라면:

1. **Google Play Console** → **앱 서명** 확인
2. **업로드 키 인증서** 확인
3. 새 keystore의 업로드 키를 Google Play Console에 등록

**주의**: 이 방법은 복잡하고, Google Play Console 설정에 따라 다를 수 있습니다.

## 현재 상황

- **현재 계정**: `kachu123`
- **현재 프로젝트 ID**: `29635f77-1c47-4420-9041-e8392363caa3` (새 프로젝트)
- **원래 프로젝트 ID**: `b52779a1-0ec1-4e86-a16c-84f0c5cb6b2e` (원래 계정)
- **문제**: 새 프로젝트는 새 keystore를 사용하므로 기존 앱과 서명 불일치

## 권장 해결 순서

1. **원래 계정으로 로그인**
2. **원래 프로젝트 ID로 변경**
3. **빌드 및 업로드**

또는

1. **원래 계정에서 keystore 다운로드**
2. **새 계정으로 전환**
3. **새 프로젝트에 keystore 업로드**
4. **빌드 및 업로드**

## 주의사항

1. **Keystore는 매우 중요합니다**
   - 분실하면 앱 업데이트 불가능
   - 안전한 곳에 백업 보관
   - 비밀번호도 별도로 안전하게 보관

2. **서명 키 불일치 시**
   - 기존 사용자는 업데이트 불가
   - 새 앱으로 등록해야 함
   - 기존 사용자는 새 앱 설치 필요

3. **원래 계정 접근 불가 시**
   - 원래 계정 복구 시도
   - 또는 새 앱으로 등록 (기존 사용자 영향 있음)

## 다음 단계

1. **원래 계정 정보 확인**
   - 이메일 주소
   - 비밀번호
   - 계정 접근 가능 여부

2. **원래 계정으로 로그인 시도**
   ```bash
   eas logout
   eas login
   ```

3. **원래 프로젝트로 전환 또는 keystore 다운로드**

가장 간단한 방법은 **원래 계정으로 돌아가서 빌드**하는 것입니다.
