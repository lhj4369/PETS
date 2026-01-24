# Get SHA-1 Certificate Fingerprint Script

Write-Host "=== Getting SHA-1 Certificate Fingerprint ===" -ForegroundColor Cyan

# Find JDK path
$jdkPaths = @(
    "C:\Program Files\Java\jdk*\bin\keytool.exe",
    "C:\Program Files (x86)\Java\jdk*\bin\keytool.exe",
    "$env:JAVA_HOME\bin\keytool.exe"
)

$keytoolPath = $null
foreach ($path in $jdkPaths) {
    $found = Get-ChildItem $path -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $keytoolPath = $found.FullName
        break
    }
}

if (-not $keytoolPath) {
    Write-Host "ERROR: keytool not found." -ForegroundColor Red
    Write-Host ""
    Write-Host "Solution:" -ForegroundColor Yellow
    Write-Host "1. Install JDK: https://www.oracle.com/java/technologies/downloads/"
    Write-Host "2. Or use Android Studio's JDK"
    Write-Host "   (Usually: C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe)"
    exit 1
}

Write-Host "SUCCESS: keytool path: $keytoolPath" -ForegroundColor Green
Write-Host ""

# Android debug keystore path
$debugKeystore = "$env:USERPROFILE\.android\debug.keystore"

if (-not (Test-Path $debugKeystore)) {
    Write-Host "WARNING: Debug keystore not found: $debugKeystore" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To create debug keystore, run Android Studio or execute:"
    Write-Host "  keytool -genkey -v -keystore $debugKeystore -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android"
    Write-Host ""
    Write-Host "Or to get production keystore SHA-1 (managed by EAS):"
    Write-Host "  eas credentials"
    exit 1
}

Write-Host "Getting SHA-1 from debug keystore..." -ForegroundColor Cyan
Write-Host ""

# Get SHA-1
$output = & $keytoolPath -list -v -keystore $debugKeystore -alias androiddebugkey -storepass android -keypass android 2>&1
$sha1Line = $output | Select-String "SHA1:"

if ($sha1Line) {
    $sha1 = ($sha1Line -split "SHA1:")[1].Trim()
    Write-Host "SUCCESS: SHA-1 Certificate Fingerprint:" -ForegroundColor Green
    Write-Host $sha1 -ForegroundColor White
    Write-Host ""
    Write-Host "Add this value to Google Cloud Console Android OAuth Client ID." -ForegroundColor Yellow
    Write-Host "https://console.cloud.google.com/apis/credentials" -ForegroundColor Cyan
} else {
    Write-Host "ERROR: Could not extract SHA-1 from keystore." -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Production Keystore (EAS Managed) ===" -ForegroundColor Cyan
Write-Host "To get production build SHA-1, run:"
Write-Host "  eas credentials" -ForegroundColor White
Write-Host "Then select Android > Keystore to view information." -ForegroundColor Yellow
