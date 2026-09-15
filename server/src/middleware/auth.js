import jwt from "jsonwebtoken";
import db from "../db/database.js";

const JWT_SECRET = process.env.JWT_SECRET || "platform-love-secret-key-2024";

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

		req.user = { id: decoded.userId };
		next();
	});
}

export function generateToken(userId) {
	return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
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
