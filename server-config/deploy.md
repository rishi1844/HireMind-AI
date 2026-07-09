# Vita AI — Deploy Commands

## Frontend
cd /var/www/html/vita/frontend
npm run build
pm2 restart vita-frontend

## Backend
cd /var/www/html/vita/backend
pm2 restart vita-backend

## Apache Config Update
cat > /etc/apache2/sites-available/vita.genixpay.com.conf << 'EOF'
... config paste karo ...
EOF
apache2ctl configtest
systemctl restart apache2

## PM2 Save
pm2 save