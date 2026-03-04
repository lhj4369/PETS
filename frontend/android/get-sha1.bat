@echo off
REM SHA-1 인증서 지문 확인 배치 파일
REM 사용법: get-sha1.bat

set KEYTOOL_PATH=C:\Program Files\Java\jdk-25\bin\keytool.exe
set KEYSTORE_PATH=%~dp0app\debug.keystore

if not exist "%KEYTOOL_PATH%" (
    echo keytool을 찾을 수 없습니다. JDK가 설치되어 있는지 확인하세요.
    echo.
    echo 다음 경로에서 keytool을 찾는 중...
    
    REM 다른 가능한 경로들 확인
    if exist "C:\Program Files\Java\jdk-25\bin\keytool.exe" (
        set KEYTOOL_PATH=C:\Program Files\Java\jdk-25\bin\keytool.exe
    ) else if exist "%JAVA_HOME%\bin\keytool.exe" (
        set KEYTOOL_PATH=%JAVA_HOME%\bin\keytool.exe
    ) else (
        echo keytool을 찾을 수 없습니다. 수동으로 경로를 지정하세요.
        pause
        exit /b 1
    )
)

if not exist "%KEYSTORE_PATH%" (
    echo debug.keystore 파일을 찾을 수 없습니다: %KEYSTORE_PATH%
    pause
    exit /b 1
)

echo.
echo SHA-1 인증서 지문 확인 중...
echo ============================================================
echo.

"%KEYTOOL_PATH%" -list -v -keystore "%KEYSTORE_PATH%" -alias androiddebugkey -storepass android -keypass android | findstr "SHA1:"

echo.
echo ============================================================
echo.
echo 위의 SHA-1 지문을 Google Cloud Console의 API 키 제한 설정에 추가하세요.
echo 패키지 이름: com.petstraining.app
echo.
pause
