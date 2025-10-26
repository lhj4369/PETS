@echo off
chcp 65001
echo React Native Expo 앱 실행 중...
cd /d "%~dp0frontend"
echo 현재 디렉토리: %CD%
echo 의존성 확인 중...
npm install
echo Expo 개발 서버 시작 중...
npm start
pause

