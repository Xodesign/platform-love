import jwt from "jsonwebtoken";
import db from "../db/database.js";

// В продакшене JWT_SECRET обязан быть задан в env: без него токены
// подписываются публично известным ключом, и любой может подделать JWT
// (включая роль админа). В dev-режиме фолбэк допустим, но прод должен падать.
const JWT_SECRET = process.env.JWT_SECRET || "platform-love-secret-key-2024";
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
	console.error(
		"\nFATAL: JWT_SECRET не задан в продакшене — запуск невозможен.\n",
	);
	process.exit(1);
}

export function authenticateToken(req, res, next) {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

	if (!token) {
		return res.status(401).json({ error: "Токен не предоставлен" });
	}

	jwt.verify(token, JWT_SECRET, (err, decoded) => {
		if (err) {
			return res.status(403).json({ error: "Недействительный токен" });
		}

		// Проверяем, что пользователь существует
		const user = db
			.prepare("SELECT id FROM users WHERE id = ?")
			.get(decoded.userId);
		if (!user) {
			return res.status(404).json({ error: "Пользователь не найден" });
		}

		req.user = {
			id: decoded.userId,
			// Старые токены (выданные до появления PIN-гейта) признака не имеют —
			// они считаются неподтверждёнными, и сервер попросит подтвердить доступ
			pinVerified: decoded.pinVerified === true,
		};
		next();
	});
}

/**
 * PIN — второй фактор. Раньше барьер жил только на клиенте: токен из
 * /api/auth/login выдавался сразу после пароля и давал полный доступ к API,
 * так что украденный пароль был равен угнанному аккаунту, а экран PIN можно
 * было обойти простым запросом.
 *
 * 428 Precondition Required — не ошибка авторизации, а «докажи второй шаг»:
 * клиент по этому коду уводит пользователя на экран PIN и не показывает «сессию
 * истёк». Именно поэтому код отдельный от 401/403.
 */
export function requirePin(req, res, next) {
	if (!req.user) {
		return res.status(401).json({ error: "Токен не предоставлен" });
	}
	if (!req.user.pinVerified) {
		return res.status(428).json({
			error: "Подтвердите доступ: введите PIN-код",
			code: "pin_required",
		});
	}
	next();
}

export function generateToken(userId, { pinVerified = false } = {}) {
	return jwt.sign({ userId, pinVerified }, JWT_SECRET, { expiresIn: "7d" });
}

// Токен администратора (role: admin)
export function generateAdminToken(adminId) {
	return jwt.sign({ adminId, role: "admin" }, JWT_SECRET, { expiresIn: "12h" });
}

export function requireAdmin(req, res, next) {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];
	if (!token) return res.status(401).json({ error: "Токен не предоставлен" });

	jwt.verify(token, JWT_SECRET, (err, decoded) => {
		if (err || decoded.role !== "admin") {
			return res.status(403).json({ error: "Требуются права администратора" });
		}
		const admin = db
			.prepare("SELECT id, email, name, role FROM admins WHERE id = ?")
			.get(decoded.adminId);
		if (!admin)
			return res.status(404).json({ error: "Администратор не найден" });
		req.admin = admin;
		next();
	});
}
