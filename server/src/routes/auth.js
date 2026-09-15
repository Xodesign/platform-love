import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import db from "../db/database.js";
import { authenticateToken, generateToken } from "../middleware/auth.js";
import { sendEmail, emailTemplates } from "../utils/email.js";

const router = Router();

// ============================================
// РЕГИСТРАЦИЯ (login + email + password)
// ============================================

router.post("/register", async (req, res) => {
	try {
		const { login, email, password, name } = req.body;

		if (!login || !password || !name) {
			return res.status(400).json({ error: "Логин, пароль и имя обязательны" });
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

		// Проверяем email если он указан
		if (email) {
			const existingEmail = db
				.prepare("SELECT id FROM users WHERE email = ?")
				.get(email);
			if (existingEmail) {
				return res.status(400).json({ error: "Email уже зарегистрирован" });
			}
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const userId = uuidv4();

		// Создаём пользователя БЕЗ PIN - он будет установлен позже
		db.prepare(`
      INSERT INTO users (id, login, email, password, name)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, login, email || null, hashedPassword, name);

		const token = generateToken(userId);

		// Отправляем email приветствия (только если email указан)
		if (email) {
			sendEmail({
				to: email,
				...emailTemplates.welcome(name),
			}).catch((err) => console.error("Welcome email error:", err));
		}

		res.status(201).json({
			success: true,
			token,
			userId,
			requiresPin: true,
			user: { id: userId, login, email, name },
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

		res.json({ success: true, message: "PIN установлен" });
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
		const user = db
			.prepare("SELECT * FROM users WHERE login = ? OR email = ?")
			.get(login, login);

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

		const user = db
			.prepare("SELECT * FROM users WHERE login = ? OR email = ?")
			.get(login, login);

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
// ВХОД ПО СМС: ОТПРАВКА И ПРОВЕРКА КОДА
// ============================================

const normalizePhone = (p) => String(p || "").replace(/\D/g, "");
const PHONE_SQL = `REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'(',''),')',''),'+','')`;
const CODE_PHONE_SQL = `REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'+','')`;
const MAX_ATTEMPTS = 5;

router.post("/send-code", (req, res) => {
	try {
		const digits = normalizePhone(req.body?.phone);
		if (digits.length < 10) {
			return res.status(400).json({ error: "Некорректный номер телефона" });
		}

		// Инвалидируем предыдущие активные кода этого номера
		db.prepare(
			`UPDATE verification_codes SET verified = 1 WHERE ${CODE_PHONE_SQL} = ? AND verified = 0`,
		).run(digits);

		const code = String(Math.floor(1000 + Math.random() * 9000));
		const now = new Date();
		db.prepare(
			`INSERT INTO verification_codes (id, phone, code, attempts, expires_at, verified, created_at)
		     VALUES (?,?,?,?,?,?,?)`,
		).run(
			uuidv4(),
			digits,
			code,
			0,
			new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
			0,
			now.toISOString(),
		);

		// Отправка SMS — зона ответственности провайдера (SMS.Io, Twilio и т.п.).
		// В не-продакшене возвращаем код в ответе, чтобы флоу можно было проверить.
		const debug_code = process.env.NODE_ENV === "production" ? undefined : code;

		res.json({ success: true, message: "Код отправлен", debug_code });
	} catch (error) {
		console.error("Send code error:", error);
		res.status(500).json({ error: "Ошибка отправки кода" });
	}
});

router.post("/verify-code", (req, res) => {
	try {
		const digits = normalizePhone(req.body?.phone);
		const submitted = String(req.body?.code || "").trim();

		if (!digits || !submitted) {
			return res.status(400).json({ error: "Нужны номер и код" });
		}

		const row = db
			.prepare(
				`SELECT * FROM verification_codes WHERE ${CODE_PHONE_SQL} = ? AND verified = 0 ORDER BY rowid DESC LIMIT 1`,
			)
			.get(digits);

		if (!row) {
			return res.status(400).json({ error: "Код не запрашивался" });
		}
		if (row.attempts >= MAX_ATTEMPTS) {
			db.prepare("UPDATE verification_codes SET verified = 1 WHERE id = ?").run(
				row.id,
			);
			return res
				.status(400)
				.json({ error: "Слишком много попыток. Запросите новый код" });
		}
		if (new Date(row.expires_at) < new Date()) {
			return res.status(400).json({ error: "Код истёк, запросите новый" });
		}
		if (row.code !== submitted) {
			db.prepare(
				"UPDATE verification_codes SET attempts = attempts + 1 WHERE id = ?",
			).run(row.id);
			return res.status(400).json({ error: "Неверный код" });
		}

		db.prepare("UPDATE verification_codes SET verified = 1 WHERE id = ?").run(
			row.id,
		);

		let user = db
			.prepare(`SELECT * FROM users WHERE ${PHONE_SQL} = ?`)
			.get(digits);
		let isNew = false;

		if (!user) {
			const id = uuidv4();
			db.prepare(
				`INSERT INTO users (id, phone, name, login, created_at)
			     VALUES (?,?,?,?,?)`,
			).run(
				id,
				req.body.phone,
				"Пользователь",
				`user${digits.slice(-6)}`,
				new Date().toISOString(),
			);
			user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
			isNew = true;
		}

		const token = generateToken(user.id);

		res.json({
			token,
			user: {
				id: user.id,
				login: user.login,
				email: user.email,
				name: user.name,
				phone: user.phone,
				hasPin: !!user.pin_code,
				hasProfile: !!user.age,
				is_new: isNew,
			},
		});
	} catch (error) {
		console.error("Verify code error:", error);
		res.status(500).json({ error: "Ошибка проверки кода" });
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

		// Ищем пользователя по логину
		const user = db.prepare("SELECT * FROM users WHERE login = ?").get(login);

		if (!user) {
			// Не говорим что пользователя нет - для безопасности
			return res.json({
				success: true,
				message: "Если логин существует и привязан email, код отправлен",
			});
		}

		if (!user.email) {
			return res.status(400).json({
				error: "У этого аккаунта не привязан email. Обратитесь в поддержку.",
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
		await sendEmail({
			to: user.email,
			...emailTemplates.passwordReset(user.name, code),
		});

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
		const { login, code, newPassword } = req.body;

		if (!login || !code || !newPassword) {
			return res.status(400).json({ error: "Все поля обязательны" });
		}

		if (newPassword.length < 6) {
			return res.status(400).json({ error: "Пароль минимум 6 символов" });
		}

		// Ищем пользователя по логину
		const user = db.prepare("SELECT * FROM users WHERE login = ?").get(login);
		if (!user || !user.email) {
			return res.status(400).json({ error: "Пользователь не найден" });
		}

		// Ищем код
		const resetRecord = db
			.prepare(`
      SELECT * FROM password_reset_codes 
      WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime('now')
    `)
			.get(user.email, code);

		if (!resetRecord) {
			return res.status(400).json({ error: "Неверный или просроченный код" });
		}

		// Меняем пароль
		const hashedPassword = await bcrypt.hash(newPassword, 10);
		db.prepare("UPDATE users SET password = ? WHERE id = ?").run(
			hashedPassword,
			user.id,
		);

		// Помечаем код как использованный
		db.prepare("UPDATE password_reset_codes SET used = 1 WHERE id = ?").run(
			resetRecord.id,
		);

		res.json({ success: true, message: "Пароль изменён" });
	} catch (error) {
		console.error("Reset password error:", error);
		res.status(500).json({ error: "Ошибка при сбросе пароля" });
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
