# SHA-1 인증서 지문 확인 스크립트
# 사용법: .\get-sha1.ps1

$keytoolPath = "C:\Program Files\Java\jdk-25\bin\keytool.exe"
$keystorePath = Join-Path $PSScriptRoot "app\debug.keystore"

if (-not (Test-Path $keytoolPath)) {
    Write-Host "keytool을 찾을 수 없습니다. JDK가 설치되어 있는지 확인하세요." -ForegroundColor Red
    Write-Host "다음 경로에서 keytool을 찾는 중..." -ForegroundColor Yellow
    
    # 다른 가능한 경로들 확인
    $possiblePaths = @(
        "C:\Program Files\Java\jdk-*\bin\keytool.exe",
        "C:\Program Files (x86)\Java\jdk-*\bin\keytool.exe",
        "$env:JAVA_HOME\bin\keytool.exe"
    )
    
    $found = $false
    foreach ($path in $possiblePaths) {
        $resolved = Resolve-Path $path -ErrorAction SilentlyContinue
        if ($resolved) {
            $keytoolPath = $resolved[0].Path
            $found = $true
            Write-Host "발견: $keytoolPath" -ForegroundColor Green
            break
        }
    }
    
    if (-not $found) {
        Write-Host "keytool을 찾을 수 없습니다. 수동으로 경로를 지정하세요." -ForegroundColor Red
        exit 1
    }
}

if (-not (Test-Path $keystorePath)) {
    Write-Host "debug.keystore 파일을 찾을 수 없습니다: $keystorePath" -ForegroundColor Red
    exit 1
}

Write-Host "`nSHA-1 인증서 지문 확인 중...`n" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

& $keytoolPath -list -v -keystore $keystorePath -alias androiddebugkey -storepass android -keypass android | Select-String "SHA1:"

Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "`n위의 SHA-1 지문을 Google Cloud Console의 API 키 제한 설정에 추가하세요." -ForegroundColor Yellow
Write-Host "패키지 이름: com.petstraining.app" -ForegroundColor Yellow
