# React Native Expo 웹 앱 실행 스크립트
Write-Host "React Native Expo 웹 앱 실행 중..." -ForegroundColor Green

# 프로젝트 디렉토리로 이동
Set-Location -Path "frontend"

Write-Host "현재 디렉토리: $(Get-Location)" -ForegroundColor Yellow

# 의존성 설치
Write-Host "의존성 확인 중..." -ForegroundColor Cyan
npm install

# 웹 서버 시작
Write-Host "웹 서버 시작 중..." -ForegroundColor Cyan
Write-Host "브라우저에서 http://localhost:8081 을 열어주세요" -ForegroundColor Red
npm run web

