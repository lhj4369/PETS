# EAS Build 설정 완료 (PETS-2)

## 완료된 작업
1. ✅ `gradlew` 파일 생성 (`expo prebuild` 실행)
2. ✅ `.gitignore`에서 `gradlew` 제외 항목 제거
3. ✅ `gradlew` 및 `gradlew.bat` 파일 Git에 추가

## 다음 단계

### 1. 변경사항 커밋 및 푸시

```bash
cd C:\Projects\PETS-2
git add .gitignore frontend/android/gradlew frontend/android/gradlew.bat
git commit -m "Add gradlew files for EAS Build"
git push
```

### 2. 빌드 실행

**중요**: 반드시 `frontend` 폴더에서 빌드를 실행하세요:

```bash
cd C:\Projects\PETS-2\frontend
eas build --platform android --profile preview
```

## 문제 해결

### 만약 여전히 오류가 발생한다면:

1. **Git 저장소 확인**: `gradlew` 파일이 원격 저장소에 푸시되었는지 확인
   ```bash
   git ls-remote origin main
   ```

2. **빌드 위치 확인**: 항상 `frontend` 폴더에서 빌드 실행
   ```bash
   cd C:\Projects\PETS-2\frontend
   pwd  # 또는 Windows에서는: cd
   ```

3. **EAS 프로젝트 확인**: 올바른 프로젝트 ID가 설정되어 있는지 확인
   ```bash
   cat frontend/app.json | grep projectId
   ```

## 참고사항

- EAS Build는 Git 저장소를 클론할 때 저장소 루트를 기준으로 합니다
- `app.json`이 있는 디렉토리(`frontend`)를 프로젝트 루트로 인식합니다
- `gradlew` 파일은 Android 빌드에 필수이므로 Git에 포함되어야 합니다
