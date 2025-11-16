# WSL2 포트 포워딩 스크립트 (Windows PowerShell에서 실행)
# 관리자 권한으로 실행해야 합니다

$port = 4000
$wslIP = (wsl hostname -I).Trim()

# 기존 규칙 제거
netsh interface portproxy delete v4tov4 listenport=$port listenaddress=0.0.0.0

# 새 규칙 추가
netsh interface portproxy add v4tov4 listenport=$port listenaddress=0.0.0.0 connectport=$port connectaddress=$wslIP

# 방화벽 규칙 추가
netsh advfirewall firewall delete rule name="WSL2 Port $port" > $null
netsh advfirewall firewall add rule name="WSL2 Port $port" dir=in action=allow protocol=TCP localport=$port

Write-Host "포트 포워딩 설정 완료!"
Write-Host "WSL IP: $wslIP"
Write-Host "로컬 접속: http://localhost:$port"
Write-Host "네트워크 접속: http://$(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*'} | Select-Object -First 1 -ExpandProperty IPAddress):$port"
