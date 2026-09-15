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
		db.prepare(
			"DELETE FROM email_change_codes WHERE user_id IN (SELECT id FROM users WHERE login LIKE 'smoke%')",
		).run();
		db.prepare(
			"DELETE FROM password_reset_codes WHERE email LIKE 'smoke%@example.invalid' OR email LIKE 'smoke%-new@example.invalid' OR email LIKE 'smokeb%@example.invalid'",
		).run();
		db.prepare("DELETE FROM users WHERE login LIKE 'smoke%'").run();
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

	// Токен после входа по PIN и id тестового аккаунта — нужны для проверок почты
	const token2 = newOk.data?.token;
	const userId = db
		.prepare("SELECT id FROM users WHERE login = ?")
		.get(login).id;

	// 16. SMS-эндпоинты удалены: они позволяли заходить в обход обязательной почты
	const sms1 = await post("/api/auth/send-code", { phone: "+79000000000" });
	const sms2 = await post("/api/auth/verify-code", {
		phone: "+79000000000",
		code: "1234",
	});
	check(
		"SMS-эндпоинты больше не существуют → 404",
		sms1.status === 404 && sms2.status === 404,
		`send-code=${sms1.status} verify-code=${sms2.status}`,
	);

	// 17. Привязка почты: кривой формат и «уже привязана»
	let e1 = await post("/api/auth/email/request", { email: "не-почта" }, token2);
	check(
		"email/request: кривой формат → 400",
		e1.status === 400,
		`${e1.status} ${e1.data?.error || ""}`,
	);
	e1 = await post("/api/auth/email/request", { email }, token2);
	check(
		"email/request: уже привязана → 400",
		e1.status === 400 && /уже привязана/i.test(e1.data?.error || ""),
		`${e1.status} ${e1.data?.error || ""}`,
	);

	// 18. Чужую почту занять нельзя
	const other = `smokeb${Date.now().toString().slice(-6)}`;
	const otherEmail = `${other}@example.invalid`;
	const otherPassword = crypto.randomBytes(8).toString("hex");
	const reg2 = await post("/api/auth/register", {
		login: other,
		email: otherEmail,
		password: otherPassword,
		name: "Второй",
	});
	check(
		"второй тестовый аккаунт создан",
		reg2.status === 201,
		`${reg2.status}`,
	);
	e1 = await post("/api/auth/email/request", { email: otherEmail }, token2);
	check(
		"email/request: чужая почта → 400",
		e1.status === 400 && /занят/i.test(e1.data?.error || ""),
		`${e1.status} ${e1.data?.error || ""}`,
	);

	// 19. Нормальный запрос кода: письмо реально не ждём, код берём из БД
	const newEmail = `${login}-new@example.invalid`;
	e1 = await post("/api/auth/email/request", { email: newEmail }, token2);
	const mailCode = db
		.prepare(
			"SELECT code FROM email_change_codes WHERE user_id = ? ORDER BY rowid DESC LIMIT 1",
		)
		.get(userId);
	check(
		"email/request → 200 + код в БД",
		e1.status === 200 && /^[0-9]{6}$/.test(String(mailCode?.code || "")),
		`${e1.status} delivered=${e1.data?.delivered}`,
	);

	// 20. Неверный код не привязывает почту
	let c1 = await post(
		"/api/auth/email/confirm",
		{ email: newEmail, code: "000000" },
		token2,
	);
	const stillOld = db
		.prepare("SELECT email FROM users WHERE id = ?")
		.get(userId).email;
	check(
		"email/confirm: неверный код → 400 и почта не изменилась",
		c1.status === 400 && stillOld === email,
		`${c1.status} email=${stillOld}`,
	);

	// 21. Просроченный код не принимается (проверка срока сравнивает ISO-строки)
	db.prepare(
		"UPDATE email_change_codes SET expires_at = ? WHERE user_id = ?",
	).run(new Date(Date.now() - 60000).toISOString(), userId);
	c1 = await post(
		"/api/auth/email/confirm",
		{ email: newEmail, code: mailCode?.code },
		token2,
	);
	check(
		"email/confirm: просроченный код → 400",
		c1.status === 400,
		`${c1.status} ${c1.data?.error || ""}`,
	);

	// 22. Свежий код привязывает почту, и /me показывает новую
	await post("/api/auth/email/request", { email: newEmail }, token2);
	const fresh = db
		.prepare(
			"SELECT code FROM email_change_codes WHERE user_id = ? ORDER BY rowid DESC LIMIT 1",
		)
		.get(userId);
	c1 = await post(
		"/api/auth/email/confirm",
		{ email: newEmail, code: fresh?.code },
		token2,
	);
	const meAfter = await fetch(`${BASE}/api/auth/me`, {
		headers: { Authorization: `Bearer ${token2}` },
	});
	const meAfterData = await meAfter.json().catch(() => null);
	check(
		"email/confirm → почта привязана и видна в /me",
		c1.status === 200 && meAfterData?.email === newEmail,
		`${c1.status} me=${meAfterData?.email}`,
	);

	// 23. Повторно использовать тот же код нельзя
	c1 = await post(
		"/api/auth/email/confirm",
		{ email: `${login}-again@example.invalid`, code: fresh?.code },
		token2,
	);
	check(
		"email/confirm: одноразовость кода",
		c1.status === 400,
		`${c1.status} ${c1.data?.error || ""}`,
	);

	// 24. Восстановление теперь уходит на НОВУЮ почту (главная цель привязки)
	await post("/api/auth/forgot-password", { login });
	const reset2 = db
		.prepare(
			"SELECT code FROM password_reset_codes WHERE email = ? ORDER BY rowid DESC LIMIT 1",
		)
		.get(newEmail);
	check(
		"forgot-password после смены почты → код на новый адрес",
		!!reset2?.code,
		`код ${reset2 ? "найден" : "не найден"}`,
	);

	// 25. И просроченный код восстановления тоже отклоняется
	db.prepare(
		"UPDATE password_reset_codes SET expires_at = ? WHERE email = ?",
	).run(new Date(Date.now() - 60000).toISOString(), newEmail);
	const expiredReset = await post("/api/auth/reset-password", {
		login,
		code: reset2?.code,
		pin: "0000",
	});
	check(
		"reset-password: просроченный код → 400",
		expiredReset.status === 400,
		`${expiredReset.status} ${expiredReset.data?.error || ""}`,
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
