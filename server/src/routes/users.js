import { Router } from "express";
import db from "../db/database.js";
import { authenticateToken, requirePin } from "../middleware/auth.js";

const router = Router();

// Получить профиль пользователя
router.get("/:id", authenticateToken, requirePin, (req, res) => {
	try {
		const user = db
			.prepare("SELECT * FROM users WHERE id = ?")
			.get(req.params.id);
		if (!user) {
			return res.status(404).json({ error: "Пользователь не найден" });
		}

		res.json({
			id: user.id,
			name: user.name,
			age: user.age,
			bio: user.bio,
			gender: user.gender,
			location: user.location,
			photos: JSON.parse(user.photos || "[]"),
			// settings нужен фронту, чтобы доставать оттуда обложку профиля
			settings: JSON.parse(user.settings || "{}"),
			latitude: user.latitude,
			longitude: user.longitude,
			is_premium: user.is_premium,
			created_at: user.created_at,
		});
	} catch (error) {
		console.error("Get user error:", error);
		res.status(500).json({ error: "Ошибка при получении профиля" });
	}
});

// Обновить профиль
router.put("/:id", authenticateToken, requirePin, (req, res) => {
	try {
		if (req.user.id !== req.params.id) {
			return res.status(403).json({ error: "Нет доступа" });
		}

		const {
			name,
			age,
			bio,
			gender,
			looking_for,
			location,
			photos,
			settings,
			latitude,
			longitude,
			is_frozen,
		} = req.body;

		const updates = [];
		const values = [];

		if (name !== undefined) {
			updates.push("name = ?");
			values.push(name);
		}
		if (age !== undefined) {
			updates.push("age = ?");
			values.push(age);
		}
		if (bio !== undefined) {
			updates.push("bio = ?");
			values.push(bio);
		}
		if (gender !== undefined) {
			updates.push("gender = ?");
			values.push(gender);
		}
		if (looking_for !== undefined) {
			updates.push("looking_for = ?");
			values.push(looking_for);
		}
		if (location !== undefined) {
			updates.push("location = ?");
			values.push(location);
		}
		if (photos !== undefined) {
			updates.push("photos = ?");
			values.push(JSON.stringify(photos));
		}
		if (settings !== undefined) {
			updates.push("settings = ?");
			values.push(JSON.stringify(settings));
		}
		if (latitude !== undefined) {
			updates.push("latitude = ?");
			values.push(latitude);
		}
		if (longitude !== undefined) {
			updates.push("longitude = ?");
			values.push(longitude);
		}
		if (is_frozen !== undefined) {
			updates.push("is_frozen = ?");
			values.push(is_frozen ? 1 : 0);
		}

		if (updates.length === 0) {
			return res.status(400).json({ error: "Нечего обновлять" });
		}

		updates.push("updated_at = CURRENT_TIMESTAMP");
		values.push(req.params.id);

		db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(
			...values,
		);

		const user = db
			.prepare("SELECT * FROM users WHERE id = ?")
			.get(req.params.id);

		res.json({
			id: user.id,
			name: user.name,
			age: user.age,
			bio: user.bio,
			gender: user.gender,
			looking_for: user.looking_for,
			location: user.location,
			photos: JSON.parse(user.photos || "[]"),
			settings: JSON.parse(user.settings || "{}"),
			is_premium: user.is_premium,
		});
	} catch (error) {
		console.error("Update user error:", error);
		res.status(500).json({ error: "Ошибка при обновлении профиля" });
	}
});

export default router;
