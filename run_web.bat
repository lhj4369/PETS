@echo off
chcp 65001
echo React Native Expo 웹 앱 실행 중...
cd /d "%~dp0frontend"
echo 현재 디렉토리: %CD%
echo 의존성 확인 중...
npm install
echo 웹 서버 시작 중...
echo 브라우저에서 http://localhost:8081 을 열어주세요
npm run web
pause

