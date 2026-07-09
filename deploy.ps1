# ============================================================
# DEPLOY.PS1 — Vita AI Production Deployment Script
# ============================================================
# Yeh script code ko production server pe push karta hai
#
# Requirements:
#   - OpenSSH installed hona chahiye (Windows 10/11 mein built-in)
#   - SSH private key: ~/.ssh/id_rsa (ya neeche path change karo)
#
# Run karo: .\deploy.ps1
# Sirf backend deploy: .\deploy.ps1 -Target backend
# Sirf frontend deploy: .\deploy.ps1 -Target frontend
# ============================================================

param(
    [ValidateSet("all", "backend", "frontend")]
    [string]$Target = "all"
)

# ──────────────────────────────────────────────────────────────
# ⚙️  CONFIGURATION — Yahan apne server details daalein
# ──────────────────────────────────────────────────────────────
$SERVER_USER = "ubuntu"                              # Server username
$SERVER_IP   = "65.1.63.43"                         # Server IP
$SSH_KEY     = "$env:USERPROFILE\.ssh\id_rsa"        # SSH private key path
$SERVER_BACKEND_PATH  = "/var/www/html/vita/backend"
$SERVER_FRONTEND_PATH = "/var/www/html/vita/frontend"
# ──────────────────────────────────────────────────────────────

$ROOT     = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKEND  = Join-Path $ROOT "backend-node"
$FRONTEND = Join-Path $ROOT "frontend"
$SSH_HOST = "${SERVER_USER}@${SERVER_IP}"

function Write-Step($num, $msg) {
    Write-Host ""
    Write-Host "[$num] $msg" -ForegroundColor Yellow
}

function Run-SSH($cmd) {
    ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SSH_HOST $cmd
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   VITA AI — Production Deployment" -ForegroundColor Cyan
Write-Host "   Target: $Target" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# ── BACKEND DEPLOY ────────────────────────────────────────────
if ($Target -eq "all" -or $Target -eq "backend") {
    Write-Step "1" "Backend deploy kar raha hoon..."

    # Production .env restore karo (agar localhost env active tha)
    $prodEnv     = Join-Path $BACKEND ".env.production"
    $currentEnv  = Join-Path $BACKEND ".env"

    if (Test-Path $prodEnv) {
        Copy-Item -Path $prodEnv -Destination $currentEnv -Force
        Write-Host "     .env.production → .env ✓" -ForegroundColor Green
    } else {
        Write-Host "     .env.production nahi mila — current .env use hoga" -ForegroundColor Gray
    }

    Write-Host "     Files upload kar raha hoon (rsync)..." -ForegroundColor Gray

    # Exclude karo: node_modules, .env.localhost, logs
    $excludes = "--exclude=node_modules --exclude=.env.localhost --exclude=logs --exclude='*.log'"
    $rsyncCmd = "rsync -avz --progress -e 'ssh -i $SSH_KEY -o StrictHostKeyChecking=no' $excludes '$BACKEND/' '${SSH_HOST}:${SERVER_BACKEND_PATH}/'"

    Invoke-Expression $rsyncCmd

    if ($LASTEXITCODE -ne 0) {
        # rsync na ho to scp try karo
        Write-Host "     rsync fail — SCP se try kar raha hoon..." -ForegroundColor Yellow
        Write-Host "     NOTE: Pehle npm install server pe karna hoga" -ForegroundColor Gray
        scp -i $SSH_KEY -r "$BACKEND/src" "${SSH_HOST}:${SERVER_BACKEND_PATH}/"
        scp -i $SSH_KEY "$BACKEND/server.js" "$BACKEND/package.json" "$BACKEND/.env" "${SSH_HOST}:${SERVER_BACKEND_PATH}/"
    }

    Write-Step "2" "Backend server pe restart kar raha hoon..."
    Run-SSH "cd $SERVER_BACKEND_PATH && npm install --production && pm2 restart vita-backend || pm2 start server.js --name vita-backend"
    Run-SSH "pm2 save"

    Write-Host "     Backend restart ho gaya ✓" -ForegroundColor Green
}

# ── FRONTEND DEPLOY ───────────────────────────────────────────
if ($Target -eq "all" -or $Target -eq "frontend") {
    Write-Step "3" "Frontend deploy kar raha hoon..."

    # Production frontend env restore karo
    $prodFrontendEnv = Join-Path $FRONTEND ".env.production"
    $currentFrontendEnv = Join-Path $FRONTEND ".env.local"

    if (Test-Path $prodFrontendEnv) {
        Copy-Item -Path $prodFrontendEnv -Destination $currentFrontendEnv -Force
        Write-Host "     .env.production → .env.local ✓" -ForegroundColor Green
    } else {
        Write-Host "     .env.production nahi mila — current .env.local use hoga" -ForegroundColor Gray
    }

    Write-Host "     Frontend build kar raha hoon (Next.js)..." -ForegroundColor Gray
    Push-Location $FRONTEND
    npm run build
    Pop-Location

    if ($LASTEXITCODE -ne 0) {
        Write-Host "     ERROR: Frontend build fail ho gayi!" -ForegroundColor Red
        exit 1
    }

    Write-Host "     Files server pe upload kar raha hoon..." -ForegroundColor Gray

    # .next build folder aur public files upload karo
    $excludes = "--exclude=node_modules --exclude=.env.localhost --exclude=.env.local"
    $rsyncCmd = "rsync -avz --progress -e 'ssh -i $SSH_KEY -o StrictHostKeyChecking=no' $excludes '$FRONTEND/' '${SSH_HOST}:${SERVER_FRONTEND_PATH}/'"
    Invoke-Expression $rsyncCmd

    if ($LASTEXITCODE -ne 0) {
        Write-Host "     rsync fail — SCP se try kar raha hoon..." -ForegroundColor Yellow
        scp -i $SSH_KEY -r "$FRONTEND/.next" "$FRONTEND/public" "$FRONTEND/package.json" "${SSH_HOST}:${SERVER_FRONTEND_PATH}/"
    }

    Write-Step "4" "Frontend server pe restart kar raha hoon..."
    Run-SSH "cd $SERVER_FRONTEND_PATH && npm install --production && pm2 restart vita-frontend || pm2 start npm --name vita-frontend -- start -- -p 3000"
    Run-SSH "pm2 save"

    Write-Host "     Frontend restart ho gaya ✓" -ForegroundColor Green
}

# ── DONE ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "  Site: https://vita.genixpay.com" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server status check karne ke liye:" -ForegroundColor Gray
Write-Host "  ssh -i $SSH_KEY ${SSH_HOST} 'pm2 status'" -ForegroundColor White
Write-Host ""
