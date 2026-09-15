// Смоук-тест флоу «логин+пароль → обязательный PIN → вход по PIN → восстановление по почте».
// Запуск: node server/scripts/smoke-auth-pin.mjs [base_url]
// Тестовые аккаунты (login LIKE 'smoke%') удаляются в конце.
import crypto from "crypto";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const BASE = process.argv[2] || "http://127.0.0.1:3001";
const HERE = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || join(HERE, "..", "database.sqlite");
const db = new Database(dbPath);

const results = [];
const login = `smoke${Date.now().toString().slice(-7)}`;
const email = `${login}@example.invalid`;
// Пароль тестовой учётки генерируем на ходу — в репозитории он не лежит
const password = crypto.randomBytes(8).toString("hex");
const PIN = "4321";
const PIN2 = "1122";

const check = (name, ok, detail = "") => {
	results.push({ name, ok, detail });
	console.log(`${ok ? "✔" : "✘"} ${name}${detail ? ` — ${detail}` : ""}`);
};

const post = async (path, body, token) => {
	const res = await fetch(`${BASE}${path}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify(body),
	});
	let data = null;
	try {
		data = await res.json();
	} catch {
		/* пустое тело */
	}
	return { status: res.status, data };
};

const cleanup = () => {
	try {
		db.prepare("DELETE FROM password_reset_codes WHERE email = ?").run(email);
		db.prepare("DELETE FROM users WHERE login = ?").run(login);
	} catch (e) {
		console.error("cleanup:", e.message);
	}
};

try {
	// 1. Регистрация без почты должна отклоняться
	let r = await post("/api/auth/register", { login, password, name: "Тест" });
	check(
		"регистрация без email → 400",
		r.status === 400 && /email/i.test(r.data?.error || ""),
		`${r.status} ${r.data?.error || ""}`,
	);

	// 2. Регистрация с почтой → токен и требует PIN
	r = await post("/api/auth/register", {
		login,
		email,
		password,
		name: "Тест",
	});
	const token = r.data?.token;
	check(
		"регистрация с email → 201 + requiresPin",
		r.status === 201 &&
			r.data?.requiresPin === true &&
			r.data?.user?.hasPin === false,
		`${r.status} requiresPin=${r.data?.requiresPin}`,
	);

	// 3. Вход по логину+паролю до установки PIN: hasPin false
	r = await post("/api/auth/login", { login, password });
	check(
		"login+password до PIN → hasPin=false",
		r.status === 200 && r.data?.user?.hasPin === false,
		`${r.status} hasPin=${r.data?.user?.hasPin}`,
	);

	// 4. Вход по логину с Email вместо логина
	r = await post("/api/auth/login", { login: email, password });
	check(
		"вход по email вместо логина работает",
		r.status === 200 && r.data?.user?.login === login,
		`${r.status}`,
	);

	// 5.PIN должен быть ровно 4 цифры
	r = await post("/api/auth/set-pin", { pin: "12" }, token);
	check(
		"кривой PIN → 400",
		r.status === 400,
		`${r.status} ${r.data?.error || ""}`,
	);

	// 6. Установка PIN
	r = await post("/api/auth/set-pin", { pin: PIN }, token);
	check(
		"set-pin → hasPin=true",
		r.status === 200 && r.data?.hasPin === true,
		`${r.status}`,
	);

	// 7. PIN в базе лежит хешем, не открытым текстом
	const row = db
		.prepare("SELECT pin_code FROM users WHERE login = ?")
		.get(login);
	check(
		"PIN в БД не открытым текстом",
		!!row?.pin_code && row.pin_code !== PIN && row.pin_code.startsWith("$2"),
		String(row?.pin_code || "").slice(0, 7),
	);

	// 8. Теперь login+password сообщает, что PIN есть
	r = await post("/api/auth/login", { login, password });
	check(
		"login+password после PIN → hasPin=true",
		r.status === 200 && r.data?.user?.hasPin === true,
		`${r.status}`,
	);

	// 9. Неверный PIN отклоняется
	r = await post("/api/auth/login-pin", { login, pin: "9999" });
	check(
		"неверный PIN → 401",
		r.status === 401,
		`${r.status} ${r.data?.error || ""}`,
	);

	// 10. Верный PIN выдаёт токен
	r = await post("/api/auth/login-pin", { login, pin: PIN });
	check(
		"верный PIN → токен",
		r.status === 200 && !!r.data?.token,
		`${r.status}`,
	);

	// 11. Забыли PIN → код на почту (код берём из БД, письмо реально не ждём)
	r = await post("/api/auth/forgot-password", { login });
	const reset = db
		.prepare(
			"SELECT code FROM password_reset_codes WHERE email = ? ORDER BY rowid DESC LIMIT 1",
		)
		.get(email);
	check(
		"forgot-password → код в БД по email",
		r.status === 200 && !!reset?.code,
		`${r.status} code_len=${String(reset?.code || "").length}`,
	);

	// 12. Сброс по коду: только новый PIN
	r = await post("/api/auth/reset-password", {
		login,
		code: reset?.code,
		pin: PIN2,
	});
	check(
		"reset-password(PIN) → pinChanged",
		r.status === 200 &&
			r.data?.pinChanged === true &&
			r.data?.passwordChanged === false,
		`${r.status} ${r.data?.message || r.data?.error || ""}`,
	);

	// 13. Старый PIN уже не проходит, новый проходит
	await post("/api/auth/login-pin", { login, pin: PIN });
	const oldOk = await post("/api/auth/login-pin", { login, pin: PIN });
	const newOk = await post("/api/auth/login-pin", { login, pin: PIN2 });
	check(
		"после сброса работает только новый PIN",
		oldOk.status === 401 && newOk.status === 200,
		`old=${oldOk.status} new=${newOk.status}`,
	);

	// 14. Повторное использование кода запрещено
	r = await post("/api/auth/reset-password", {
		login,
		code: reset?.code,
		pin: "0000",
	});
	check(
		"одноразовость кода",
		r.status === 400,
		`${r.status} ${r.data?.error || ""}`,
	);

	// 15. /me по токену
	const me = await fetch(`${BASE}/api/auth/me`, {
		headers: { Authorization: `Bearer ${newOk.data?.token}` },
	});
	const meData = await me.json().catch(() => null);
	check(
		"/me возвращает hasPin=true",
		me.status === 200 && meData?.hasPin === true,
		`${me.status}`,
	);

	// 16. SMS-эндпоинты всё ещё доступны (наследие)
	const sms = await post("/api/auth/send-code", { phone: "+79000000000" });
	check(
		"SMS-эндпоинты живы (наследие)",
		sms.status === 200,
		`${sms.status} debug_code=${sms.data?.debug_code ? "есть" : "нет"}`,
	);
} catch (e) {
	check("исключение в тесте", false, e.message);
} finally {
	cleanup();
}

const failed = results.filter((r) => !r.ok);
console.log(
	`\nИТОГ: ${results.length - failed.length}/${results.length} passed`,
);
process.exit(failed.length ? 1 : 0);
