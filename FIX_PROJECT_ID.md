# 프로젝트 ID 권한 오류 해결

## 문제
프로젝트 ID `29635f77-1c47-4420-9041-e8392363caa3`가 현재 계정(`kachu0514`)에 연결되지 않아 권한 오류가 발생했습니다.

## 해결 방법

### 1단계: 프로젝트 ID 제거 완료 ✅
- `app.json`에서 `projectId` 제거됨
- `frontend/app.json`에서 `projectId` 제거됨

### 2단계: 새 프로젝트 생성

터미널에서 다음 명령어를 실행하세요:

```bash
eas init
```

프롬프트가 나타나면:
- `Would you like to create a project for @kachu0514/pets?` → **Y** 입력
- 새 프로젝트 ID가 자동으로 생성되어 `app.json`에 추가됩니다

### 3단계: 확인

```bash
# 프로젝트 정보 확인
eas project:info

# 또는 빌드 실행 (프로젝트 ID가 없으면 자동 생성)
eas build --platform android --profile production
```

## 대안: 빌드 시 자동 생성

`eas init`을 실행하지 않아도, 첫 빌드 시 프로젝트 ID가 자동으로 생성됩니다:

```bash
eas build --platform android --profile production
```

빌드 시작 전에:
- 새 프로젝트 생성 여부를 묻습니다
- **Y** 입력하면 현재 계정으로 새 프로젝트가 생성됩니다

## 주의사항

1. **프로젝트 ID 제거 완료**
   - 이제 `app.json`에 `projectId`가 없습니다
   - `eas init` 또는 첫 빌드 시 자동 생성됩니다

2. **현재 계정 확인**
   - 로그인된 계정: `kachu0514`
   - 새 프로젝트는 이 계정으로 생성됩니다

3. **EAS Secrets**
   - 프로젝트가 생성된 후 다시 설정해야 합니다

## 다음 단계

1. **`eas init` 실행** (권장)
   ```bash
   eas init
   ```

2. **또는 첫 빌드 실행**
   ```bash
   eas build --platform android --profile production
   ```

두 방법 모두 현재 계정(`kachu0514`)으로 새 프로젝트를 생성합니다.
