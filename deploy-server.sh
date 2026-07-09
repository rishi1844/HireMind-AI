#!/bin/bash
# ==============================================
# HireMind AI — Server Deployment Script
# Server: 65.1.63.43
# Run this script via SSH on the server
# ==============================================

echo "🚀 Starting HireMind AI deployment..."

# ── 1. Install Node.js 20.x (if not installed) ──
if ! command -v node &> /dev/null; then
  echo "📦 Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "✅ Node: $(node -v) | npm: $(npm -v)"

# ── 2. Install PM2 globally (if not installed) ──
if ! command -v pm2 &> /dev/null; then
  echo "📦 Installing PM2..."
  sudo npm install -g pm2
fi
echo "✅ PM2: $(pm2 -v)"

# ── 3. Create app directories ──
sudo mkdir -p /var/www/html/vita/frontend
sudo mkdir -p /var/www/html/vita/backend

# ── 4. Set permissions ──
sudo chown -R $USER:$USER /var/www/html/vita

echo "✅ Directories ready"
echo ""
echo "📋 NEXT STEPS:"
echo "  1. Upload frontend folder contents to: /var/www/html/vita/frontend/"
echo "  2. Upload backend-node folder contents to: /var/www/html/vita/backend/"
echo "  3. Then run: bash /var/www/html/vita/start-apps.sh"
