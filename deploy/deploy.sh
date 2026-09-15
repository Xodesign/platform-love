#!/bin/bash
# Скрипт развертывания Platform Love на VPS
# Использование: bash deploy.sh

set -e

VPS_HOST="5.101.152.161"
VPS_USER="root" # или другой пользователь с sudo
APP_DIR="/var/www/platformlove.com"

echo "🚀 Развертывание Platform Love на $VPS_HOST"

# 1. Загружаем файлы
echo "📦 Загружаем файлы..."
rsync -avz --delete \
	--exclude='node_modules' \
	--exclude='.env' \
	--exclude='*.db' \
	--exclude='uploads/' \
	--exclude='dist/' \
	/home/user/platform-love-app/ $VPS_USER@$VPS_HOST:$APP_DIR/

# 2. Загружаем production .env (если есть)
if [ -f /home/user/platform-love-app/server/.env ]; then
	echo "🔐 Загружаем .env..."
	scp /home/user/platform-love-app/server/.env $VPS_USER@$VPS_HOST:$APP_DIR/server/.env
fi

# 3. Установка зависимостей и сборка на VPS
echo "📥 Устанавливаем зависимости..."
ssh $VPS_USER@$VPS_HOST <<EOF
  set -e
  cd $APP_DIR
  npm install --production
  cd server
  npm install --production

  # Сборка frontend
  cd ..
  npm install
  npx vite build

  # Инициализация БД (если нужно)
  cd server
  node src/db/init.js

  # Копируем nginx конфиг и systemd сервис
  if [ -f $APP_DIR/deploy/nginx-platformlove.conf ]; then
    cp $APP_DIR/deploy/nginx-platformlove.conf /etc/nginx/sites-available/platformlove.com
    ln -sf /etc/nginx/sites-available/platformlove.com /etc/nginx/sites-enabled/platformlove.com
    nginx -t
    systemctl reload nginx
  fi

  if [ -f $APP_DIR/deploy/platformlove-backend.service ]; then
    cp $APP_DIR/deploy/platformlove-backend.service /etc/systemd/system/
    systemctl daemon-reload
    systemctl enable platformlove-backend
    systemctl restart platformlove-backend
  fi

  echo "✅ Развертывание завершено!"
EOF

echo ""
echo "✅ Готово! Проверь https://platformlove.com"
