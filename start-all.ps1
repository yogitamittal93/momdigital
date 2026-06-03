# Start Matrny — ML service, API, and Web (separate windows)
$root = $PSScriptRoot

Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd '$root\ml_service'; .\venv\Scripts\Activate.ps1; python main.py"
)

Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd '$root\api'; npm run start:dev"
)

Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd '$root\web'; npm run dev"
)

Write-Host "All three services starting..."
Write-Host "ML Service: http://localhost:5000"
Write-Host "API:        http://localhost:3001/api"
Write-Host "Web:        http://localhost:3000"
