$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "ireal-service"
$frontend = Join-Path $root "ireal_demo"

Write-Host "Launching backend (Nest)..." -ForegroundColor Cyan
Start-Process -WorkingDirectory $backend -FilePath "npm" -ArgumentList "run", "start:dev"

Write-Host "Launching frontend (Next)..." -ForegroundColor Cyan
Start-Process -WorkingDirectory $frontend -FilePath "npm" -ArgumentList "run", "dev"

Write-Host "Started backend and frontend. Check the two new terminals for logs." -ForegroundColor Green
