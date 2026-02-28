# EAS Build 경로 오류 해결 가이드

## 문제
```
package.json does not exist in /home/expo/workingdir/build/pets-main/frontend
```

## 원인
EAS Build가 Git 저장소 루트(`PETS-main`)를 기준으로 빌드를 시작하는데, 실제 Expo 프로젝트는 `frontend` 폴더 안에 있습니다.

## 해결 방법

### 방법 1: frontend 폴더에서 직접 빌드 (권장)

**중요**: EAS Build를 실행할 때 반드시 `frontend` 폴더에서 실행하세요.

```bash
cd C:\Projects\PETS-main\frontend
eas build --platform android --profile preview
```

### 방법 2: Git 저장소 구조 확인

EAS Build는 Git 저장소를 클론할 때 저장소 루트를 기준으로 합니다. 
`app.json`이 `frontend` 폴더에 있으면, EAS Build가 자동으로 찾아야 하지만 경로 문제가 발생할 수 있습니다.

### 방법 3: .gitignore 확인

`.gitignore` 파일이 `frontend` 폴더를 제외하고 있지 않은지 확인하세요.

### 방법 4: 빌드 설정 확인

`eas.json` 파일이 `frontend` 폴더에 있는지 확인하세요.

## 현재 프로젝트 구조

```
PETS-main/
├── backend/
├── frontend/          ← 실제 Expo 프로젝트
│   ├── app.json
│   ├── package.json
│   ├── eas.json
│   └── ...
├── package.json
└── README.md
```

## 빌드 실행 명령어

```bash
# 반드시 frontend 폴더에서 실행
cd C:\Projects\PETS-main\frontend
eas build --platform android --profile preview
```

## 참고사항

- EAS Build는 `app.json`이 있는 디렉토리를 프로젝트 루트로 인식합니다
- Git 저장소를 사용하는 경우, 저장소 루트와 프로젝트 루트가 다를 수 있습니다
- 항상 `app.json`이 있는 폴더에서 빌드를 실행하는 것이 가장 안전합니다
