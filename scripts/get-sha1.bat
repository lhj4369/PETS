@echo off
REM SHA-1 인증서 지문 얻기 스크립트 (Windows 배치 파일)

echo === SHA-1 인증서 지문 얻기 ===
echo.

REM JDK 경로 찾기
set KEYTOOL_PATH=

REM Program Files에서 JDK 찾기
for /d %%i in ("C:\Program Files\Java\jdk*") do (
    if exist "%%i\bin\keytool.exe" (
        set KEYTOOL_PATH=%%i\bin\keytool.exe
        goto :found
    )
)

REM Program Files (x86)에서 JDK 찾기
for /d %%i in ("C:\Program Files (x86)\Java\jdk*") do (
    if exist "%%i\bin\keytool.exe" (
        set KEYTOOL_PATH=%%i\bin\keytool.exe
        goto :found
    )
)

REM JAVA_HOME에서 찾기
if defined JAVA_HOME (
    if exist "%JAVA_HOME%\bin\keytool.exe" (
        set KEYTOOL_PATH=%JAVA_HOME%\bin\keytool.exe
        goto :found
    )
)

echo ❌ keytool을 찾을 수 없습니다.
echo.
echo 해결 방법:
echo 1. JDK를 설치하세요: https://www.oracle.com/java/technologies/downloads/
echo 2. 또는 Android Studio의 JDK를 사용하세요
echo    (일반적으로: C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe)
echo.
pause
exit /b 1

:found
echo ✅ keytool 경로: %KEYTOOL_PATH%
echo.

REM Android 디버그 키스토어 경로
set DEBUG_KEYSTORE=%USERPROFILE%\.android\debug.keystore

if not exist "%DEBUG_KEYSTORE%" (
    echo ⚠️  디버그 키스토어를 찾을 수 없습니다: %DEBUG_KEYSTORE%
    echo.
    echo 디버그 키스토어를 생성하려면 Android Studio를 실행하거나 다음 명령어를 실행하세요:
    echo   keytool -genkey -v -keystore %DEBUG_KEYSTORE% -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android
    echo.
    echo 또는 EAS가 관리하는 프로덕션 키스토어의 SHA-1을 얻으려면:
    echo   eas credentials
    echo.
    pause
    exit /b 1
)

echo 디버그 키스토어에서 SHA-1 가져오는 중...
echo.

REM SHA-1 가져오기
"%KEYTOOL_PATH%" -list -v -keystore "%DEBUG_KEYSTORE%" -alias androiddebugkey -storepass android -keypass android | findstr "SHA1:"

echo.
echo === 프로덕션 키스토어 (EAS 관리) ===
echo 프로덕션 빌드의 SHA-1을 얻으려면 다음 명령어를 실행하세요:
echo   eas credentials
echo 그리고 Android ^> Keystore를 선택하여 정보를 확인하세요.
echo.
pause
