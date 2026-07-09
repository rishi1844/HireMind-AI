#!/bin/bash
# ==============================================
# HireMind AI — Start Both Apps with PM2
# Run this AFTER uploading files to server
# ==============================================

echo "🔧 Installing dependencies & starting apps..."

# ── Backend ──
echo "📦 Installing backend dependencies..."
cd /var/www/html/vita/backend
npm install --production

echo "🔄 Generating Prisma client & running migrations..."
npx prisma generate
npx prisma migrate deploy

echo "🚀 Starting backend with PM2..."
pm2 delete vita-backend 2>/dev/null || true
pm2 start server.js --name vita-backend --env production

# ── Frontend ──
echo "📦 Installing frontend dependencies..."
cd /var/www/html/vita/frontend
npm install --production

echo "🚀 Starting frontend with PM2..."
pm2 delete vita-frontend 2>/dev/null || true
pm2 start npm --name vita-frontend -- start -- -p 3000

# ── Save PM2 process list & enable startup ──
pm2 save
pm2 startup

echo ""
echo "✅ Both apps are running!"
echo "   Frontend → http://65.1.63.43:3000"
echo "   Backend  → http://65.1.63.43:5000"
echo ""
echo "📊 Check status: pm2 status"
echo "📋 View logs:    pm2 logs"
