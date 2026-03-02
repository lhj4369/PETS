# EAS Build 경로 오류 해결 가이드 (PETS-2)

## 문제
```
ENOENT: no such file or directory, open '/home/expo/workingdir/build/frontend/android/gradlew'
```

## 해결 완료
1. ✅ `gradlew` 파일 생성 완료 (`expo prebuild` 실행)
2. ✅ `frontend/android/gradlew` 파일 확인됨

## 중요 사항

### 빌드 실행 위치
**반드시 `frontend` 폴더에서 EAS Build를 실행하세요:**

```bash
cd C:\Projects\PETS-2\frontend
eas build --platform android --profile preview
```

### Git 커밋 확인
`gradlew` 파일이 Git에 커밋되어 있는지 확인하세요:

```bash
cd C:\Projects\PETS-2
git status
git add frontend/android/gradlew frontend/android/gradlew.bat
git commit -m "Add gradlew files for EAS Build"
git push
```

### 프로젝트 구조
```
PETS-2/
├── backend/          (제외됨 - .easignore)
├── frontend/         ← 실제 Expo 프로젝트 (여기서 빌드 실행)
│   ├── app.json
│   ├── package.json
│   ├── eas.json
│   └── android/
│       ├── gradlew   ← 필수 파일
│       └── ...
├── app.json          (루트 - 무시됨)
└── eas.json          (루트 - 무시됨)
```

## 참고
- EAS Build는 `app.json`이 있는 디렉토리를 프로젝트 루트로 인식합니다
- `frontend/app.json`이 실제 프로젝트 설정입니다
- 루트의 `app.json`과 `eas.json`은 무시됩니다
