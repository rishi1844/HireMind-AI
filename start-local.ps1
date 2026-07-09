# ============================================================
# START-LOCAL.PS1 — Vita AI Local Development Starter
# ============================================================
# Run karo: .\start-local.ps1
# ============================================================

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKEND = Join-Path $ROOT "backend-node"
$FRONTEND = Join-Path $ROOT "frontend"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   VITA AI -- Local Development Server" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Backend env
Write-Host "[1/3] Backend env set kar raha hoon (localhost)..." -ForegroundColor Yellow

$backendEnvSrc  = Join-Path $BACKEND ".env.localhost"
$backendEnvDest = Join-Path $BACKEND ".env"

if (Test-Path $backendEnvSrc) {
    Copy-Item -Path $backendEnvSrc -Destination $backendEnvDest -Force
    Write-Host "      .env.localhost -> .env (backend) OK" -ForegroundColor Green
} else {
    Write-Host "      WARNING: .env.localhost nahi mila, purana .env use hoga" -ForegroundColor Red
}

# Step 2: Frontend env
Write-Host "[2/3] Frontend env set kar raha hoon (localhost)..." -ForegroundColor Yellow

$frontendEnvSrc  = Join-Path $FRONTEND ".env.localhost"
$frontendEnvDest = Join-Path $FRONTEND ".env.local"

if (Test-Path $frontendEnvSrc) {
    Copy-Item -Path $frontendEnvSrc -Destination $frontendEnvDest -Force
    Write-Host "      .env.localhost -> .env.local (frontend) OK" -ForegroundColor Green
} else {
    Write-Host "      WARNING: .env.localhost nahi mila, purana .env.local use hoga" -ForegroundColor Red
}

# Step 3: Servers start karo
Write-Host "[3/3] Servers start kar raha hoon..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Backend  --> http://localhost:5000" -ForegroundColor Magenta
Write-Host "  Frontend --> http://localhost:3000" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Dono band karne ke liye windows band karo" -ForegroundColor Gray
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Backend ko alag window mein start karo
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BACKEND'; Write-Host 'BACKEND STARTING...' -ForegroundColor Cyan; npm run dev" -WindowStyle Normal

# Thodi der ruko phir frontend start karo
Start-Sleep -Seconds 2

# Frontend ko alag window mein start karo
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$FRONTEND'; Write-Host 'FRONTEND STARTING...' -ForegroundColor Magenta; npm run dev" -WindowStyle Normal

Write-Host "Dono windows open ho gayi hain!" -ForegroundColor Green
Write-Host "Browser mein kholo: http://localhost:3000" -ForegroundColor Green
Write-Host ""
