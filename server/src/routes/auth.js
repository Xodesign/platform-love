import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import db from "../db/database.js";
import { authenticateToken, generateToken } from "../middleware/auth.js";
import { sendEmail, emailTemplates } from "../utils/email.js";

const router = Router();

// Войти можно и по логину, и по почте. Почту нормализуем к нижнему регистру —
// ровно так же, как сохраняем при регистрации
const identifier = (value) => {
	const v = (value || "").trim();
	return v.includes("@") ? v.toLowerCase() : v;
};

// ============================================
// РЕГИСТРАЦИЯ (login + email + password)
// ============================================

router.post("/register", async (req, res) => {
	try {
		const { login, email, password, name } = req.body;

		if (!login || !password || !name) {
			return res.status(400).json({ error: "Логин, пароль и имя обязательны" });
		}

		// Почта обязательна: через неё восстанавливают доступ, когда забыли PIN
		const normalizedEmail = (email || "").trim().toLowerCase();
		if (!normalizedEmail) {
			return res.status(400).json({
				error: "Укажите email — на него придёт код восстановления доступа",
			});
		}
		if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(normalizedEmail)) {
			return res.status(400).json({ error: "Похоже, в email опечатка" });
		}

		if (login.length < 3) {
			return res.status(400).json({ error: "Логин минимум 3 символа" });
		}

		if (!/^[a-zA-Z0-9_]+$/.test(login)) {
			return res
				.status(400)
				.json({ error: "Логин может содержать только латиницу, цифры и _" });
		}

		if (password.length < 6) {
			return res.status(400).json({ error: "Пароль минимум 6 символов" });
		}

		// Проверяем что логин не занят
		const existingLogin = db
			.prepare("SELECT id FROM users WHERE login = ?")
			.get(login);
		if (existingLogin) {
			return res.status(400).json({ error: "Логин уже занят" });
		}

		// Проверяем email на занятость
		const existingEmail = db
			.prepare("SELECT id FROM users WHERE email = ?")
			.get(normalizedEmail);
		if (existingEmail) {
			return res.status(400).json({ error: "Такой email уже зарегистрирован" });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const userId = uuidv4();

		// Создаём пользователя БЕЗ PIN - он будет установлен позже
		db.prepare(`
      INSERT INTO users (id, login, email, password, name)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, login, normalizedEmail, hashedPassword, name);

		const token = generateToken(userId);

		// Отправляем email приветствия
		sendEmail({
			to: normalizedEmail,
			...emailTemplates.welcome(name),
		}).catch((err) => console.error("Welcome email error:", err));

		res.status(201).json({
			success: true,
			token,
			userId,
			requiresPin: true,
			user: { id: userId, login, email: normalizedEmail, name, hasPin: false },
		});
	} catch (error) {
		console.error("Register error:", error);
		res.status(500).json({ error: "Ошибка при регистрации" });
	}
});

// ============================================
// ПРОВЕРКА ЛОГИНА (доступность)
// ============================================

router.post("/check-login", (req, res) => {
	try {
		const { login } = req.body;
		if (!login) {
			return res.status(400).json({ error: "Логин обязателен" });
		}
		const existing = db
			.prepare("SELECT id FROM users WHERE login = ?")
			.get(login);
		res.json({ available: !existing });
	} catch (error) {
		res.status(500).json({ error: "Ошибка проверки" });
	}
});

// ============================================
// УСТАНОВКА PIN КОДА
// ============================================

router.post("/set-pin", authenticateToken, async (req, res) => {
	try {
		const { pin } = req.body;
		const userId = req.user.id;

		if (!pin || !/^\d{4}$/.test(pin)) {
			return res.status(400).json({ error: "PIN должен быть 4 цифры" });
		}

		// Хешируем PIN так же, как пароль (bcrypt) — иначе он лежит в БД в открытом виде
		const hashedPin = await bcrypt.hash(pin, 10);
		db.prepare("UPDATE users SET pin_code = ? WHERE id = ?").run(
			hashedPin,
			userId,
		);

		// Клиент решает, куда вести дальше: анкета заполнена или нет
		const me = db.prepare("SELECT age FROM users WHERE id = ?").get(userId);

		res.json({
			success: true,
			message: "PIN установлен",
			hasPin: true,
			hasProfile: !!me?.age,
		});
	} catch (error) {
		console.error("Set PIN error:", error);
		res.status(500).json({ error: "Ошибка при установке PIN" });
	}
});

// ============================================
// ВХОД ПО LOGIN + ПАРОЛЬ
// ============================================

router.post("/login", async (req, res) => {
	try {
		const { login, password } = req.body;

		if (!login || !password) {
			return res.status(400).json({ error: "Логин и пароль обязательны" });
		}

		// Ищем по логину или email
		const id = identifier(login);
		const user = db
			.prepare("SELECT * FROM users WHERE login = ? OR email = ?")
			.get(id, id);

		if (!user) {
			return res.status(401).json({ error: "Неверный логин или пароль" });
		}

		const validPassword = await bcrypt.compare(password, user.password);

		if (!validPassword) {
			return res.status(401).json({ error: "Неверный логин или пароль" });
		}

		const token = generateToken(user.id);

		res.json({
			token,
			user: {
				id: user.id,
				login: user.login,
				email: user.email,
				name: user.name,
				hasPin: !!user.pin_code,
				hasProfile: !!user.age,
			},
		});
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ error: "Ошибка при входе" });
	}
});

// ============================================
// ВХОД ПО PIN (после успешного входа по логину)
// ============================================

router.post("/login-pin", async (req, res) => {
	try {
		const { login, pin } = req.body;

		if (!login || !pin) {
			return res.status(400).json({ error: "Логин и PIN обязательны" });
		}

		if (!/^\d{4}$/.test(pin)) {
			return res.status(400).json({ error: "PIN должен быть 4 цифры" });
		}

		const id = identifier(login);
		const user = db
			.prepare("SELECT * FROM users WHERE login = ? OR email = ?")
			.get(id, id);

		if (!user) {
			return res.status(401).json({ error: "Пользователь не найден" });
		}

		if (!user.pin_code) {
			return res.status(401).json({ error: "PIN не установлен" });
		}

		// PIN хранится в виде bcrypt-хеша — сравниваем через bcrypt.compare
		const validPin = await bcrypt.compare(pin, user.pin_code);
		if (!validPin) {
			return res.status(401).json({ error: "Неверный PIN" });
		}

		const token = generateToken(user.id);

		res.json({
			success: true,
			token,
			user: {
				id: user.id,
				login: user.login,
				email: user.email,
				name: user.name,
				hasProfile: !!user.age,
			},
		});
	} catch (error) {
		console.error("PIN login error:", error);
		res.status(500).json({ error: "Ошибка при входе" });
	}
});

// ============================================
// СБРОС ПАРОЛЯ - ПО ЛОГИНУ (отправляет на email)
// ============================================

router.post("/forgot-password", async (req, res) => {
	try {
		const { login } = req.body;

		if (!login) {
			return res.status(400).json({ error: "Логин обязателен" });
		}

		// Ищем пользователя по логину или почте
		const id = identifier(login);
		const user = db
			.prepare("SELECT * FROM users WHERE login = ? OR email = ?")
			.get(id, id);

		if (!user) {
			// Не говорим что пользователя нет - для безопасности
			return res.json({
				success: true,
				message: "Если логин существует и привязан email, код отправлен",
			});
		}

		if (!user.email) {
			return res.status(400).json({
				error:
					"К аккаунту не привязана почта. Войдите по логину и паролю, добавьте email в Настройках → Электронная почта — после этого восстановление станет доступно.",
			});
		}

		// Генерируем код
		const code = Math.floor(100000 + Math.random() * 900000).toString();
		const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

		// Удаляем старые коды
		db.prepare("DELETE FROM password_reset_codes WHERE email = ?").run(
			user.email,
		);

		// Сохраняем новый код
		db.prepare(`
      INSERT INTO password_reset_codes (id, email, code, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), user.email, code, expiresAt);

		// Отправляем email с предупреждением про спам
		const mail = await sendEmail({
			to: user.email,
			...emailTemplates.accessRecovery(user.name, code),
		});
		if (mail && mail.success === false) {
			// Наружу не выбрасываем: пользователю всегда один и тот же ответ,
			// чтобы нельзя было проверить существование аккаунта
			console.error("Recovery email failed:", mail.error);
		}

		res.json({
			success: true,
			message:
				"Код отправлен на привязанный email. Проверьте папку 'Спам' если не видите письмо.",
		});
	} catch (error) {
		console.error("Forgot password error:", error);
		res.status(500).json({ error: "Ошибка при отправке кода" });
	}
});

// ============================================
// СБРОС ПАРОЛЯ - ПОДТВЕРЖДЕНИЕ КОДА
// ============================================

router.post("/reset-password", async (req, res) => {
	try {
		const { login, code, newPassword, pin } = req.body;

		if (!login || !code) {
			return res.status(400).json({ error: "Логин и код обязательны" });
		}

		if (newPassword && newPassword.length < 6) {
			return res.status(400).json({ error: "Пароль минимум 6 символов" });
		}
		if (pin && !/^\d{4}$/.test(pin)) {
			return res.status(400).json({ error: "PIN должен быть 4 цифры" });
		}
		if (!newPassword && !pin) {
			return res
				.status(400)
				.json({ error: "Укажите новый пароль и/или новый PIN" });
		}

		// Ищем пользователя по логину или почте
		const id = identifier(login);
		const user = db
			.prepare("SELECT * FROM users WHERE login = ? OR email = ?")
			.get(id, id);
		if (!user || !user.email) {
			return res.status(400).json({ error: "Пользователь не найден" });
		}

		// Ищем код. Сравнение идёт в одном формате (ISO), иначе строка вида
		// "2026-09-15T04:31:00.000Z" всегда оказывается «больше» результата
		// datetime('now') = "2026-09-15 04:59:00" из-за разделения T/пробелом,
		// и код переживал свои 15 минут до самой полуночи.
		const resetRecord = db
			.prepare(`
      SELECT * FROM password_reset_codes 
      WHERE email = ? AND code = ? AND used = 0 AND expires_at > ?
      ORDER BY rowid DESC LIMIT 1
    `)
			.get(user.email, code, new Date().toISOString());

		if (!resetRecord) {
			return res.status(400).json({ error: "Неверный или просроченный код" });
		}

		// Применяем то, что попросили сменить
		if (newPassword) {
			const hashedPassword = await bcrypt.hash(newPassword, 10);
			db.prepare("UPDATE users SET password = ? WHERE id = ?").run(
				hashedPassword,
				user.id,
			);
		}
		if (pin) {
			const hashedPin = await bcrypt.hash(pin, 10);
			db.prepare("UPDATE users SET pin_code = ? WHERE id = ?").run(
				hashedPin,
				user.id,
			);
		}

		// Помечаем код как использованный
		db.prepare("UPDATE password_reset_codes SET used = 1 WHERE id = ?").run(
			resetRecord.id,
		);

		res.json({
			success: true,
			message:
				newPassword && pin
					? "Пароль и PIN обновлены"
					: newPassword
						? "Пароль изменён"
						: "PIN изменён",
			passwordChanged: !!newPassword,
			pinChanged: !!pin,
		});
	} catch (error) {
		console.error("Reset password error:", error);
		res.status(500).json({ error: "Ошибка при сбросе пароля" });
	}
});

// ============================================
// ПРИВЯЗКА / СМЕНА EMAIL
// ============================================
// Почта — единственный канал восстановления доступа. Ранние аккаунты
// регистривались без неё, и их владельцы не могли ничего восстановить.
// Добавить или сменить email можно только подтверждением на новом адресе,
// иначе доступ к чужому аккаунту передаётся простой сменой поля.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const EMAIL_CODE_TTL_MIN = 15;
const EMAIL_CODE_MAX_ATTEMPTS = 5;

router.post("/email/request", authenticateToken, async (req, res) => {
	try {
		const email = (req.body?.email || "").trim().toLowerCase();
		const userId = req.user.id;

		if (!email) {
			return res.status(400).json({ error: "Укажите email" });
		}
		if (!EMAIL_RE.test(email)) {
			return res.status(400).json({ error: "Похоже, в email опечатка" });
		}

		const user = db
			.prepare("SELECT id, name, email FROM users WHERE id = ?")
			.get(userId);
		if (!user) {
			return res.status(404).json({ error: "Пользователь не найден" });
		}
		if (user.email === email) {
			return res
				.status(400)
				.json({ error: "Эта почта уже привязана к аккаунту" });
		}
		const taken = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
		if (taken) {
			return res
				.status(400)
				.json({ error: "Такой email уже занят другим аккаунтом" });
		}

		const code = Math.floor(100000 + Math.random() * 900000).toString();
		const expiresAt = new Date(
			Date.now() + EMAIL_CODE_TTL_MIN * 60 * 1000,
		).toISOString();

		// Новый запрос делает прежние коды этого пользователя недействительными
		db.prepare(
			"UPDATE email_change_codes SET used = 1 WHERE user_id = ? AND used = 0",
		).run(userId);
		db.prepare(
			`INSERT INTO email_change_codes (id, user_id, email, code, expires_at)
		     VALUES (?, ?, ?, ?, ?)`,
		).run(uuidv4(), userId, email, code, expiresAt);

		const mail = await sendEmail({
			to: email,
			...emailTemplates.verification(user.name, code),
		});
		const delivered = !(mail && mail.success === false);
		if (!delivered) {
			console.error("Email change send failed:", mail.error);
		}

		// Код не отдаём наружу нигде, кроме логов сервера. Если доставка
		// сбойнула, пользователь видит это, но шаг ввода кода не блокируем:
		// письмо иногда приходит позже, а код живёт свои 15 минут.
		res.json({
			success: true,
			delivered,
			email,
			message: delivered
				? `Код отправлен на ${email}`
				: `Почтовый сервер не принял письмо на ${email}. Проверьте адрес и запросите код ещё раз.`,
		});
	} catch (error) {
		console.error("Email request error:", error);
		res.status(500).json({ error: "Ошибка при отправке кода" });
	}
});

router.post("/email/confirm", authenticateToken, (req, res) => {
	try {
		const email = (req.body?.email || "").trim().toLowerCase();
		const code = String(req.body?.code || "").trim();
		const userId = req.user.id;

		if (!email || !code) {
			return res.status(400).json({ error: "Нужны email и код" });
		}

		const record = db
			.prepare(
				`SELECT * FROM email_change_codes
		         WHERE user_id = ? AND email = ? AND used = 0 AND expires_at > ?
		         ORDER BY rowid DESC LIMIT 1`,
			)
			.get(userId, email, new Date().toISOString());

		if (!record) {
			return res
				.status(400)
				.json({ error: "Код истёк или его не было. Запросите новый." });
		}
		if (record.attempts >= EMAIL_CODE_MAX_ATTEMPTS) {
			db.prepare("UPDATE email_change_codes SET used = 1 WHERE id = ?").run(
				record.id,
			);
			return res
				.status(400)
				.json({ error: "Слишком много попыток. Запросите новый код." });
		}
		if (record.code !== code) {
			db.prepare(
				"UPDATE email_change_codes SET attempts = attempts + 1 WHERE id = ?",
			).run(record.id);
			return res.status(400).json({ error: "Неверный код" });
		}

		// За время ожидания адрес мог занять кто-то другой
		const taken = db
			.prepare("SELECT id FROM users WHERE email = ? AND id <> ?")
			.get(email, userId);
		if (taken) {
			return res
				.status(400)
				.json({ error: "Такой email уже занят другим аккаунтом" });
		}

		db.prepare(
			"UPDATE users SET email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
		).run(email, userId);
		db.prepare("UPDATE email_change_codes SET used = 1 WHERE id = ?").run(
			record.id,
		);

		const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
		res.json({
			success: true,
			message: "Почта привязана — теперь доступ можно восстановить",
			user: {
				id: user.id,
				login: user.login,
				email: user.email,
				name: user.name,
				hasPin: !!user.pin_code,
				hasProfile: !!user.age,
			},
		});
	} catch (error) {
		console.error("Email confirm error:", error);
		res.status(500).json({ error: "Ошибка при подтверждении почты" });
	}
});

// ============================================
// ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ
// ============================================

router.get("/me", authenticateToken, (req, res) => {
	try {
		const user = db
			.prepare("SELECT * FROM users WHERE id = ?")
			.get(req.user.id);

		if (!user) {
			return res.status(404).json({ error: "Пользователь не найден" });
		}

		res.json({
			id: user.id,
			login: user.login,
			email: user.email,
			name: user.name,
			hasPin: !!user.pin_code,
			hasProfile: !!user.age,
		});
	} catch (error) {
		console.error("Me error:", error);
		res.status(500).json({ error: "Ошибка" });
	}
});

// ============================================
// LOGOUT
// ============================================
// JWT stateless — реальная инвалидация требует blacklist, но для
// текущего использования клиент сам удаляет токен через api.setToken(null).
// Endpoint добавлен, чтобы не отдавать 404 на POST /api/auth/logout.

router.post("/logout", authenticateToken, (_req, res) => {
	try {
		// Заглушка для будущего blacklist / refresh-token механизма
		res.json({ success: true, message: "Logged out" });
	} catch (error) {
		console.error("Logout error:", error);
		res.status(500).json({ error: "Ошибка при выходе" });
	}
});

// ============================================
// YANDEX OAUTH
// ============================================

router.post("/yandex/callback", async (req, res) => {
	try {
		const { code } = req.body;

		if (!code) {
			return res.status(400).json({ error: "Код не получен" });
		}

		const clientId = process.env.VITE_YANDEX_CLIENT_ID;
		const clientSecret = process.env.VITE_YANDEX_CLIENT_SECRET;

		const tokenResponse = await fetch("https://oauth.yandex.ru/token", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				grant_type: "authorization_code",
				code,
				client_id: clientId,
				client_secret: clientSecret,
			}),
		});

		const tokenData = await tokenResponse.json();

		if (!tokenData.access_token) {
			return res.status(400).json({ error: "Ошибка получения токена" });
		}

		const userResponse = await fetch("https://login.yandex.ru/info", {
			headers: { Authorization: `Bearer ${tokenData.access_token}` },
		});

		const yandexUser = await userResponse.json();

		let user = db
			.prepare("SELECT * FROM users WHERE email = ?")
			.get(yandexUser.default_email);

		if (!user) {
			const userId = uuidv4();
			const login = `yandex_${yandexUser.default_email.split("@")[0]}_${Date.now().toString(36)}`;
			db.prepare(`
        INSERT INTO users (id, login, email, name, photos)
        VALUES (?, ?, ?, ?, ?)
      `).run(
				userId,
				login,
				yandexUser.default_email,
				yandexUser.display_name || "Пользователь",
				"[]",
			);

			user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
		}

		const token = generateToken(user.id);

		res.json({
			token,
			user: {
				id: user.id,
				login: user.login,
				email: user.email,
				name: user.name,
				hasPin: !!user.pin_code,
				source: "yandex",
			},
		});
	} catch (error) {
		console.error("Yandex OAuth error:", error);
		res.status(500).json({ error: "Ошибка авторизации через Яндекс" });
	}
});

export default router;
