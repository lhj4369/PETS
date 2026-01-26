# EAS Build Keystore 위치

## 중요 정보

EAS Build에서 생성된 **프로덕션 keystore**는 **EAS 서버에 안전하게 저장**됩니다. 로컬에는 저장되지 않습니다.

## Keystore 위치

### 1. EAS 서버 (프로덕션 keystore)
- **위치**: EAS 서버에 암호화되어 저장
- **접근 방법**: `eas credentials` 명령어 사용
- **다운로드**: 가능하지만 권장하지 않음 (보안상 위험)

### 2. 로컬 (디버그 keystore만)
- **위치**: `frontend/android/app/debug.keystore`
- **용도**: 개발/디버그 빌드용
- **프로덕션 빌드**: 사용하지 않음

## Keystore 확인 및 관리

### Keystore 정보 확인
```bash
eas credentials
```

이 명령어로 다음을 확인할 수 있습니다:
- Android keystore 상태
- iOS 인증서 상태
- 다운로드 옵션 (권장하지 않음)

### Keystore 다운로드 (비권장)
```bash
eas credentials
# Android 선택 → Keystore 선택 → Download
```

**주의**: 
- Keystore를 다운로드하면 보안 위험이 있습니다
- 분실 시 앱 업데이트가 불가능합니다
- 가능하면 EAS 서버에 그대로 두는 것이 안전합니다

## 새 프로젝트로 전환 시

새 Expo 계정으로 프로젝트를 전환하면:
- **기존 keystore**: 원래 계정의 EAS 서버에 남아있음
- **새 keystore**: 새 프로젝트에서 자동 생성됨
- **Google Play Console**: 같은 패키지 이름이면 기존 앱과 연결됨

### 문제 발생 시

만약 Google Play Console에 업로드할 때 서명 오류가 발생하면:

1. **기존 keystore 다운로드** (원래 계정 필요)
   ```bash
   # 원래 계정으로 로그인
   eas logout
   eas login  # 원래 계정
   eas credentials  # keystore 다운로드
   ```

2. **새 프로젝트에 업로드** (새 계정)
   ```bash
   # 새 계정으로 로그인
   eas logout
   eas login  # 새 계정
   eas credentials  # keystore 업로드
   ```

3. **또는 새 keystore 사용**
   - 새 keystore로 새 앱으로 등록
   - 기존 사용자는 업데이트 불가 (새 앱 설치 필요)

## 권장 사항

1. **Keystore는 EAS 서버에 그대로 두기**
   - 가장 안전한 방법
   - 분실 위험 없음

2. **백업이 필요하면**
   - EAS 대시보드에서 다운로드
   - 안전한 곳에 암호화하여 보관
   - 비밀번호는 별도로 안전하게 보관

3. **새 프로젝트 사용 시**
   - 새 keystore가 자동 생성됨
   - Google Play Console에 새 앱으로 등록하거나
   - 기존 keystore를 새 프로젝트에 업로드

## 현재 프로젝트 상태

- **로컬 디버그 keystore**: `frontend/android/app/debug.keystore` ✅
- **프로덕션 keystore**: EAS 서버에 저장됨 (원래 계정)
- **새 프로젝트 ID**: `29635f77-1c47-4420-9041-e8392363caa3`
- **새 프로젝트 keystore**: 첫 빌드 시 자동 생성됨

## 다음 단계

1. **새 프로젝트로 빌드**: 새 keystore 자동 생성
2. **기존 앱 업데이트 필요 시**: 원래 계정에서 keystore 다운로드 후 새 프로젝트에 업로드
3. **새 앱으로 등록**: 새 keystore 사용 가능
