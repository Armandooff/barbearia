$base = Split-Path -Parent $PSScriptRoot
$apiPath = Join-Path $base "barbearia-api"
$clientPath = Join-Path $base "barbearia-agendamento"
$adminPath = Join-Path $base "barbearia-admin"

Write-Host "Backend iniciando em http://127.0.0.1:3001"
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory $apiPath

Start-Sleep -Seconds 2

Write-Host "Painel admin iniciando..."
Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory $adminPath

Start-Sleep -Seconds 2

Write-Host "Frontend (cliente) iniciando..."
Set-Location $clientPath
npm run dev