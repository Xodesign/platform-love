# Развертывание Platform Love на VPS

## Информация о сервере

- **IP:** `5.101.152.161`
- **Домен:** `platformlove.com`
- **Путь на сервере:** `/var/www/platformlove.com`
- **Backend порт:** `3001`
- **Frontend порт:** `80` (nginx)

## Подготовка (уже сделано)

✅ Frontend build готов в `dist/`
✅ Backend готов
✅ Nginx конфиг создан: `deploy/nginx-platformlove.conf`
✅ Systemd сервис создан: `deploy/platformlove-backend.service`

## Шаг 1: Загрузить файлы на VPS

Подключись к VPS по SSH:
```bash
ssh root@5.101.152.161
```

Создай папку для приложения:
```bash
mkdir -p /var/www/platformlove.com
```

Локально (в отдельном терминале) загрузи файлы:
```bash
# Frontend build + backend
scp -r /home/user/platform-love-app/dist root@5.101.152.161:/var/www/platformlove.com/
scp -r /home/user/platform-love-app/server root@5.101.152.161:/var/www/platformlove.com/
scp /home/user/platform-love-app/package.json root@5.101.152.161:/var/www/platformlove.com/
scp -r /home/user/platform-love-app/src root@5.101.152.161:/var/www/platformlove.com/
scp -r /home/user/platform-love-app/public root@5.101.152.161:/var/www/platformlove.com/
scp /home/user/platform-love-app/vite.config.js root@5.101.152.161:/var/www/platformlove.com/

# .env с реальными данными
scp /home/user/platform-love-app/server/.env root@5.101.152.161:/var/www/platformlove.com/server/

# Конфиги
scp /home/user/platform-love-app/deploy/nginx-platformlove.conf root@5.101.152.161:/etc/nginx/sites-available/platformlove.com
scp /home/user/platform-love-app/deploy/platformlove-backend.service root@5.101.152.161:/etc/systemd/system/
```

## Шаг 2: Установить зависимости на VPS

```bash
ssh root@5.101.152.161
cd /var/www/platformlove.com
npm install
cd server
npm install
```

## Шаг 3: Инициализировать БД

```bash
cd /var/www/platformlove.com/server
node src/db/init.js
```

## Шаг 4: Запустить nginx

```bash
ln -sf /etc/nginx/sites-available/platformlove.com /etc/nginx/sites-enabled/platformlove.com
nginx -t
systemctl reload nginx
```

## Шаг 5: Запустить backend как systemd сервис

```bash
systemctl daemon-reload
systemctl enable platformlove-backend
systemctl start platformlove-backend
systemctl status platformlove-backend
```

## Шаг 6: SSL сертификат (Let's Encrypt)

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d platformlove.com -d www.platformlove.com
```

## Проверка

Открой https://platformlove.com — должно работать.

## Автозапуск

Backend работает через systemd — автоматически запускается при перезагрузке VPS.

## Логи

```bash
# Backend логи
journalctl -u platformlove-backend -f

# Nginx логи
tail -f /var/log/nginx/error.log
```
