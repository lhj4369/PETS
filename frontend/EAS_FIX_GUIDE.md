# EAS Build 권한 오류 해결 가이드

## 문제
```
Entity not authorized: AppEntity[8f18a4d0-dc60-49e5-8eab-d914f366852c]
```

## 해결 방법

### 1. 현재 상태 확인
```bash
cd C:\Projects\PETS-main\frontend
eas whoami
eas project:info
```

### 2. 프로젝트 ID 확인
`app.json` 파일의 `extra.eas.projectId`가 올바른지 확인:
- 올바른 ID: `68245d6c-4c3c-440f-b3b0-2bef343b9c12`
- 잘못된 ID: `8f18a4d0-dc60-49e5-8eab-d914f366852c` (제거됨)

### 3. 프로젝트 재연결 (필요한 경우)
```bash
# 프로젝트 ID를 명시적으로 설정
eas project:init --id 68245d6c-4c3c-440f-b3b0-2bef343b9c12
```

### 4. EAS CLI 재로그인 (필요한 경우)
```bash
eas logout
eas login
```

### 5. 캐시 클리어 (필요한 경우)
```bash
# .expo 폴더 삭제 (선택사항)
Remove-Item -Recurse -Force .expo
```

### 6. 빌드 실행
```bash
eas build --platform android --profile preview
```

## 현재 설정

### app.json
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "68245d6c-4c3c-440f-b3b0-2bef343b9c12"
      }
    }
  }
}
```

### 계정 정보
- 사용자: `kachu0514`
- 프로젝트: `@kachu0514/frontend`
- 프로젝트 ID: `68245d6c-4c3c-440f-b3b0-2bef343b9c12`

## 추가 참고사항

- 빌드 크레딧이 100% 사용된 경우 추가 빌드는 유료로 청구될 수 있습니다
- Android Keystore가 없는 경우 대화형 프롬프트에서 생성해야 합니다
- `--non-interactive` 플래그를 사용하면 자동으로 기본값을 사용합니다
