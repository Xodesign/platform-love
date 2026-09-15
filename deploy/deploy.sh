#!/usr/bin/env bash
# ============================================================
#  Деплой PlatformLove на VPS (id 7924729 / platformlove.com)
#
#  Что делает:
#    1. проверяет, что весь код закоммичен в git
#    2. собирает frontend ЗДЕСЬ (на VPS всего ~1 ГБ RAM — сборка там убьёт сервер)
#    3. делает бэкап боевой БД и текущего кода в /root/backups
#    4. выкладывает dist + server/src + server/package.json + create-admin.js
#    5. применяет идемпотентную миграцию схемы
#    6. перезапускает systemd-сервис и проверяет здоровье изнутри и снаружи
#    7. при любой ошибке проверки — откатывает код и БД из бэкапа
#
#  Чего он НЕ делает намеренно:
#    - НЕ запускает scripts/seed.js (он делает DELETE FROM и стёр бы живых пользователей)
#    - НЕ трогает server/.env, server/database.sqlite и server/uploads/
#
#  Использование:
#    bash deploy/deploy.sh                # полный цикл
#    bash deploy/deploy.sh --skip-build   # выложить уже собранный dist
#    bash deploy/deploy.sh --no-git-check # не требовать чистого git (не рекомендуется)
#    bash deploy/deploy.sh --push         # после успешного деплоя сделать git push
# ============================================================
set -euo pipefail

# ---------- настройки (можно переопределить переменными окружения) ----------
VPS_HOST="${VPS_HOST:-80.78.244.136}" # VPS id 7924729, он же cv7924729
VPS_USER="${VPS_USER:-root}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_rsa}"
APP_DIR="${APP_DIR:-/var/www/platformlove.com}" # боевой каталог: его отдаёт nginx и его читает :3001
SERVICE="${SERVICE:-platformlove-backend.service}"
DOMAIN="${DOMAIN:-platformlove.com}"
API_PORT="${API_PORT:-3001}"

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TS="$(date -u +%Y-%m-%d_%H-%M-%S)"
BACKUP_DIR="/root/backups"
PAYLOAD="/tmp/platformlove_payload_${TS}.tgz"
REMOTE_PAYLOAD="${BACKUP_DIR}/platformlove_payload_${TS}.tgz"

SKIP_BUILD=0
GIT_CHECK=1
DO_PUSH=0
for arg in "$@"; do
	case "$arg" in
	--skip-build) SKIP_BUILD=1 ;;
	--no-git-check) GIT_CHECK=0 ;;
	--push) DO_PUSH=1 ;;
	*)
		echo "Неизвестный флаг: $arg" >&2
		exit 2
		;;
	esac
done

step() { printf '\n\033[1;35m▶ %s\033[0m\n' "$1"; }
ok() { printf '  \033[1;32m✔\033[0m %s\n' "$1"; }
warn() { printf '  \033[1;33m!\033[0m %s\n' "$1"; }
die() {
	printf '\n  \033[1;31m✘ %s\033[0m\n' "$1" >&2
	exit 1
}

SSH_BASE=(ssh -i "$SSH_KEY" -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15)
SCP_BASE=(scp -i "$SSH_KEY" -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15)
RSH() { "${SSH_BASE[@]}" "$VPS_USER@$VPS_HOST" "$@"; }

# Откат кода и БД из бэкапа текущего запуска
rollback() {
	warn "Проверка не пройдена — откатываю код и БД из бэкапа ${TS}"
	RSH "set -e; cd ${APP_DIR}; rm -rf dist server/src; \
tar xzf ${BACKUP_DIR}/code_${TS}.tar.gz -C ${APP_DIR}; \
cp -f ${BACKUP_DIR}/db_${TS}.sqlite ${APP_DIR}/server/database.sqlite; \
rm -f ${APP_DIR}/server/database.sqlite-wal ${APP_DIR}/server/database.sqlite-shm; \
systemctl restart ${SERVICE}; sleep 3; echo '  ↩ откат выполнен'" || warn "Откат нужно выполнить вручную (бэкапы в ${BACKUP_DIR})"
}

cd "$PROJECT_DIR"

# ---------- 0. доступность сервера ----------
step "0/6. Проверка доступа к VPS $VPS_HOST"
[ -f "$SSH_KEY" ] || die "Нет ключа $SSH_KEY. Задай SSH_KEY=/path/to/key"
RSH "echo ok" >/dev/null 2>&1 || die "SSH не проходит. Ключ должен быть добавлен на сервер."
ok "SSH работает"

# ---------- 1. git hygiene ----------
step "1/6. Состояние git"
if [ "$GIT_CHECK" = "1" ]; then
	if git rev-parse --git-dir >/dev/null 2>&1; then
		if [ -n "$(git status --porcelain)" ]; then
			git status --short | head -10
			die "Есть незакоммиченные изменения. Сначала: git add -A && git commit. (или --no-git-check)"
		fi
		ok "Рабочее дерево чистое: $(git log --oneline -1)"
	else
		die "Каталог не является git-репозиторием."
	fi
else
	warn "Проверка git пропущена (--no-git-check)"
fi

# ---------- 2. сборка ----------
step "2/6. Сборка frontend"
if [ "$SKIP_BUILD" = "1" ] && [ -d dist ]; then
	warn "Сборка пропущена, использую существующий dist/"
else
	command -v npm >/dev/null 2>&1 || die "npm не найден"
	NODE_OPTIONS='--max-old-space-size=512' npm run build >/tmp/deploy_build_${TS}.log 2>&1 ||
		{
			tail -20 /tmp/deploy_build_${TS}.log
			die "Сборка упала (лог: /tmp/deploy_build_${TS}.log)"
		}
	[ -d dist ] || die "После сборки нет dist/"
	ok "dist собран ($(du -sh dist | cut -f1))"
fi
# онбординг обязан быть в сборке — иначе на проде снова вылезет HTML-fallback
[ -f dist/onboarding/1-flowers.jpg ] || die "В dist нет онбординг-картинок — сборка неполная"
ok "Онбординг-ассеты в сборке на месте"

# ---------- 3. бэкап ----------
step "3/6. Бэкап боевой БД и кода"
RSH "mkdir -p ${BACKUP_DIR} && cd ${APP_DIR}/server && \
node -e 'const D=require(\"better-sqlite3\");const s=D(\"database.sqlite\",{readonly:true});s.backup(\"${BACKUP_DIR}/db_${TS}.sqlite\").then(()=>{s.close();console.log(\"  ✔ БД: db_${TS}.sqlite\")}).catch(e=>{console.error(e.message);process.exit(1)})'" ||
	die "Не удалось забэкапить БД"
RSH "cd ${APP_DIR} && tar czf ${BACKUP_DIR}/code_${TS}.tar.gz dist server/src server/package.json 2>/dev/null && \
echo '  ✔ код: code_${TS}.tar.gz'" || die "Не удалось забэкапить код"

# ---------- 4. выкладка ----------
step "4/6. Выкладка кода"
tar czf "$PAYLOAD" dist server/src server/package.json server/scripts/create-admin.js ||
	die "Не удалось собрать архив"
ok "Архив: $(du -h "$PAYLOAD" | cut -f1)"
"${SCP_BASE[@]}" -q "$PAYLOAD" "$VPS_USER@$VPS_HOST:$REMOTE_PAYLOAD" || die "scp не прошёл"
rm -f "$PAYLOAD"
ok "Архив доставлен на сервер"

RSH "set -e; cd ${APP_DIR}; rm -rf dist server/src; \
tar xzf ${REMOTE_PAYLOAD} -C ${APP_DIR}; \
echo '  ✔ код развёрнут'; \
cd server; \
node -e 'import(\"./src/db/migrate.js\").then(m=>{m.migrate();console.log(\"  ✔ миграция схемы применена\")}).catch(e=>{console.error(\"миграция: \"+e.message);process.exit(1)})'" ||
	die "Выкладка или миграция завершились ошибкой"

# ---------- 5. unit, права, перезапуск ----------
step "5/6. Systemd unit, права и перезапуск сервиса"
# Unit синхронизируется при каждом деплое: раньше его никто не обновлял, и на сервере
# остался вариант с User=root, хотя в репозитории давно был www-data.
"${SCP_BASE[@]}" -q "$PROJECT_DIR/deploy/platformlove-backend.service" "$VPS_USER@$VPS_HOST:/tmp/platformlove-unit.${TS}" ||
	die "не удалось загрузить unit-файл"
RSH "set -e; \
if ! cmp -s /tmp/platformlove-unit.${TS} /etc/systemd/system/${SERVICE}; then \
  cp /etc/systemd/system/${SERVICE} ${BACKUP_DIR}/${SERVICE}.${TS}.bak 2>/dev/null || true; \
  mv /tmp/platformlove-unit.${TS} /etc/systemd/system/${SERVICE}; \
  systemctl daemon-reload; \
  echo '  ✔ unit обновлён (бывший — в ${BACKUP_DIR})'; \
else rm -f /tmp/platformlove-unit.${TS}; echo '  ✔ unit актуален'; fi; \
chown -R www-data:www-data ${APP_DIR}/server; \
chmod 600 ${APP_DIR}/server/.env 2>/dev/null || true; \
echo '  ✔ server/ принадлежит www-data, .env — 600'" ||
	die "Не удалось применить unit/права"
RSH "set -e; systemctl restart ${SERVICE}; sleep 4; \
systemctl is-active --quiet ${SERVICE} && echo '  ✔ сервис active' || { journalctl -u ${SERVICE} -n 15 --no-pager; exit 1; }" ||
	{
		rollback
		die "Сервис не поднялся — откат выполнен, детали в journalctl -u ${SERVICE}"
	}

# ---------- 6. проверки ----------
step "6/6. Проверка здоровья"

if ! RSH "node -e 'fetch(\"http://127.0.0.1:${API_PORT}/api/health\").then(r=>r.json()).then(j=>{if(j.status!==\"ok\")process.exit(1)}).catch(()=>process.exit(1))'"; then
	rollback
	die "Бэкенд не отвечает локально на сервере — откат выполнен"
fi
ok "Бэкенд внутри сервера: /api/health ok"

EXT=$(curl -sS --max-time 15 "https://${DOMAIN}/api/health" 2>/dev/null || true)
case "$EXT" in *'"ok"'*) ok "Снаружи: https://${DOMAIN}/api/health ok" ;; *)
	rollback
	die "Снаружи /api/health не отвечает — откат выполнен"
	;;
esac

CT=$(curl -sSI --max-time 15 "https://${DOMAIN}/onboarding/1-flowers.jpg" | tr -d '\r' | awk -F': ' 'tolower($1)=="content-type"{print $2}')
if [ "$CT" = "image/jpeg" ]; then
	ok "Фронтенд отдаёт онбординг как картинку"
else
	warn "Онбординг отдаётся как '$CT' (ожидался image/jpeg) — возможно, nginx кэширует старый dist"
fi

# маршруты, которых до этого на проде не было
for p in /api/admin/login /api/likes/incoming /api/blacklist /api/notifications /api/posts; do
	CODE=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "https://${DOMAIN}${p}" 2>/dev/null || echo 000)
	case "$CODE" in
	401 | 400 | 200 | 405) ok "${p} доступен (HTTP ${CODE})" ;;
	404) warn "${p} → 404: маршрут не поднят" ;;
	*) warn "${p} → HTTP ${CODE}" ;;
	esac
done

if [ "$DO_PUSH" = "1" ] && git rev-parse --git-dir >/dev/null 2>&1; then
	step "git push"
	git push origin HEAD 2>&1 | tail -2 || warn "git push не прошёл"
fi

printf '\n\033[1;32mГотово.\033[0m Версия: %s | Бэкапы: %s/{db,code}_%s\n' \
	"$(git log --oneline -1 2>/dev/null || echo 'без git')" "$BACKUP_DIR" "$TS"
