# Деплой PlatformLove

## Куда деплоим (актуально на 2026-09-15)

| Параметр | Значение |
| --- | --- |
| VPS | **id 7924729**, hostname `cv7924729.novalocal` |
| IP | `80.78.244.136` |
| Домен | `platformlove.com` |
| Боевой каталог | `/var/www/platformlove.com` |
| Backend | systemd `platformlove-backend.service` → `127.0.0.1:3001` |
| Frontend | nginx `root /var/www/platformlove.com/dist` |
| БД | `/var/www/platformlove.com/server/database.sqlite` (SQLite, живые пользователи) |
| Загрузки | `/var/www/platformlove.com/server/uploads/` |
| Бэкапы | `/root/backups/` |

⚠️ **Старый адрес `5.101.152.161` (BeGet, хост `gagarin7`) больше не используется.**
В скриптах и инструкциях до 15 сентября был прописан именно он — деплой на него
уходил в пустоту. Ключ SSH туда не подходит.

⚠️ **Раньше на сервере было две копии приложения**: `/var/www/platformlove.com`
(к ней шёл nginx) и `/var/www/platform-love` (сервис на `:3000`, снаружи недоступен,
0 пользователей). Вторая отключена и переименована в
`/var/www/platform-love.DISABLED-2026-09-15`. Теперь боевая копия одна.

## Одна команда

```bash
bash deploy/deploy.sh
```

Что делает скрипт:

1. проверяет, что рабочее дерево git чистое;
2. собирает frontend **локально** (на VPS ~1 ГБ RAM — сборка там его валит);
3. бэкапит боевую БД и текущий код в `/root/backups/db_<ts>.sqlite`, `code_<ts>.tar.gz`;
4. выкладывает `dist/`, `server/src/`, `server/package.json`, `server/scripts/create-admin.js`;
5. применяет идемпотентную миграцию схемы;
6. перезапускает сервис;
7. проверяет здоровье изнутри (`127.0.0.1:3001/api/health`) и снаружи (`https://platformlove.com/api/health`),
   наличие онбординг-ассетов и новых маршрутов;
8. **если проверка провалилась — автоматически откатывает код и БД из бэкапа**.

Флаги:

```bash
bash deploy/deploy.sh --skip-build    # выложить уже собранный dist
bash deploy/deploy.sh --push          # после успешного деплоя сделать git push
bash deploy/deploy.sh --no-git-check  # разрешить деплой с незакоммиченными правками
```

## Чего деплой сознательно не делает

- **Не запускает `server/scripts/seed.js`.** Он начинается с `DELETE FROM` по таблицам
  и на боевой базе уничтожил бы реальных пользователей. Сид — только для локальной разработки.
- **Не трогает** `server/.env`, `server/database.sqlite`, `server/uploads/`.
- Не настраивает TLS: сертификат для `platformlove.com` уже выдан certbot'ом, nginx слушает 80/443.

## Администратор

На боевом сервере админ заводится скриптом, а не сидом:

```bash
ssh root@80.78.244.136
cd /var/www/platformlove.com/server
node scripts/create-admin.js admin@example.ru '<пароль от 8 символов>' 'Имя'
```

Скрипт работает только с таблицей `admins` и безопасен для боевой БД: повторный запуск
с тем же email обновляет пароль, а не создаёт дубль.

## Безопасность

Файл `deploy/expect_deploy.exp` содержал **root-пароль сервера открытым текстом**
и был в репозитории GitHub. Удалён из кода и из репозитория 15.09.2026, `*.exp`
добавлены в `.gitignore`. Пароль на сервере **нужно сменить**, потому что он
оставался в истории git-коммитов. Доступ к серверу дальше — только по SSH-ключу
(`~/.ssh/id_rsa`), который скрипт использует через `BatchMode`.

Никогда не коммитьте: `.env`, `server/.env`, `*.sqlite`, `uploads/`, `*.apk`,
ключи `id_rsa`/`*.pem` — всё это уже закрыто в `.gitignore`.

## Ручная диагностика

```bash
ssh root@80.78.244.136
systemctl status platformlove-backend.service
journalctl -u platformlove-backend.service -n 50 --no-pager
ss -ltnp | grep -E ':80|:443|:3001'
ls -la /root/backups
nginx -T | grep -E 'root|proxy_pass|server_name'
```

Откат вручную:

```bash
cd /var/www/platformlove.com
tar xzf /root/backups/code_<ts>.tar.gz -C /var/www/platformlove.com
cp /root/backups/db_<ts>.sqlite server/database.sqlite
rm -f server/database.sqlite-wal server/database.sqlite-shm
systemctl restart platformlove-backend.service
```
