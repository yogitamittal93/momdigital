# stop-all.ps1 — Kill all MomDigital dev services in one shot

Write-Host "`n🛑 Stopping MomDigital services..." -ForegroundColor Yellow

# 1. Kill Next.js dev server (port 3000)
$web = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($web) { Stop-Process -Id $web -Force -ErrorAction SilentlyContinue; Write-Host "  ✅ Web (Next.js :3000) stopped" -ForegroundColor Green }
else { Write-Host "  ⚪ Web (Next.js :3000) was not running" }

# 2. Kill NestJS API (port 3001)
$api = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($api) { Stop-Process -Id $api -Force -ErrorAction SilentlyContinue; Write-Host "  ✅ API (NestJS :3001) stopped" -ForegroundColor Green }
else { Write-Host "  ⚪ API (NestJS :3001) was not running" }

# 3. Kill ML/Python service (port 5000)
$ml = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($ml) { Stop-Process -Id $ml -Force -ErrorAction SilentlyContinue; Write-Host "  ✅ ML Service (Python :5000) stopped" -ForegroundColor Green }
else { Write-Host "  ⚪ ML Service (Python :5000) was not running" }

# 4. Close Android Emulator gracefully (qemu process)
$emu = Get-Process -Name "qemu-system-x86_64" -ErrorAction SilentlyContinue
if ($emu) { $emu | Stop-Process -Force; Write-Host "  ✅ Android Emulator stopped" -ForegroundColor Green }
else { Write-Host "  ⚪ Android Emulator was not running" }

# 5. Close Android Studio
$studio = Get-Process -Name "studio64" -ErrorAction SilentlyContinue
if ($studio) { $studio | Stop-Process -Force; Write-Host "  ✅ Android Studio closed" -ForegroundColor Green }
else { Write-Host "  ⚪ Android Studio was not running" }

# 6. Kill any leftover Node processes spawned by this project
Get-Process -Name "node" -ErrorAction SilentlyContinue | ForEach-Object {
  $cmdline = (Get-WmiObject Win32_Process -Filter "ProcessId=$($_.Id)").CommandLine
  if ($cmdline -like "*momdigital*") {
    Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
  }
}
Write-Host "  ✅ Leftover Node processes cleaned" -ForegroundColor Green

Write-Host "`n✨ All done! Safe to shut down." -ForegroundColor Cyan
