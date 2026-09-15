import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/database.js";
import { authenticateToken } from "../middleware/auth.js";
import { answersMatch } from "../utils/answerAliases.js";

const router = Router();

// Haversine — расстояние между двумя точками в километрах
function haversineKm(lat1, lon1, lat2, lon2) {
	const toRad = (d) => (d * Math.PI) / 180;
	const R = 6371; // радиус Земли в км
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============================================
// ОТВЕТЫ НА ВОПРОСЫ АНКЕТЫ
// ============================================

// Сохранить ответы пользователя
router.post("/answers", authenticateToken, (req, res) => {
	try {
		const userId = req.user.id;
		const { answers } = req.body;

		if (!answers || typeof answers !== "object") {
			return res.status(400).json({ error: "answers обязателен" });
		}

		// Удаляем старые ответы и сохраняем новые
		const deleteStmt = db.prepare("DELETE FROM user_answers WHERE user_id = ?");
		const insertStmt = db.prepare(`
      INSERT INTO user_answers (id, user_id, question_key, answer_value)
      VALUES (?, ?, ?, ?)
    `);

		const transaction = db.transaction(() => {
			deleteStmt.run(userId);

			for (const [key, value] of Object.entries(answers)) {
				if (value !== undefined && value !== null && value !== "") {
					insertStmt.run(uuidv4(), userId, key, String(value));
				}
			}
		});

		transaction();

		res.json({ success: true, message: "Ответы сохранены" });
	} catch (error) {
		console.error("Save answers error:", error);
		res.status(500).json({ error: "Ошибка при сохранении ответов" });
	}
});

// Получить ответы пользователя
router.get("/answers", authenticateToken, (req, res) => {
	try {
		const userId = req.user.id;

		const answers = db
			.prepare(
				"SELECT question_key, answer_value FROM user_answers WHERE user_id = ?",
			)
			.all(userId);

		const formatted = {};
		answers.forEach((a) => {
			formatted[a.question_key] = a.answer_value;
		});

		res.json(formatted);
	} catch (error) {
		console.error("Get answers error:", error);
		res.status(500).json({ error: "Ошибка при получении ответов" });
	}
});

// ============================================
// НАСТРОЙКИ ПОИСКА
// ============================================

// Получить настройки поиска
router.get("/settings", authenticateToken, (req, res) => {
	try {
		const userId = req.user.id;

		let settings = db
			.prepare("SELECT * FROM search_settings WHERE user_id = ?")
			.get(userId);

		if (!settings) {
			// Создаём настройки по умолчанию на основе профиля пользователя
			const currentUser = db
				.prepare("SELECT looking_for FROM users WHERE id = ?")
				.get(userId);
			const id = uuidv4();
			const defaultGender = currentUser?.looking_for || "female";
			db.prepare(`
        INSERT INTO search_settings (id, user_id, looking_for)
        VALUES (?, ?, ?)
      `).run(id, userId, defaultGender);

			settings = db
				.prepare("SELECT * FROM search_settings WHERE user_id = ?")
				.get(userId);
		}

		res.json({
			min_age: settings.min_age,
			max_age: settings.max_age,
			max_distance: settings.max_distance,
			looking_for: settings.looking_for,
			filters: JSON.parse(settings.filters || "{}"),
		});
	} catch (error) {
		console.error("Get search settings error:", error);
		res.status(500).json({ error: "Ошибка при получении настроек" });
	}
});

// Обновить настройки поиска
router.put("/settings", authenticateToken, (req, res) => {
	try {
		const userId = req.user.id;
		const { min_age, max_age, max_distance, looking_for, filters } = req.body;

		// Проверяем существование
		const exists = db
			.prepare("SELECT id FROM search_settings WHERE user_id = ?")
			.get(userId);

		if (exists) {
			db.prepare(`
        UPDATE search_settings 
        SET min_age = COALESCE(?, min_age),
            max_age = COALESCE(?, max_age),
            max_distance = COALESCE(?, max_distance),
            looking_for = COALESCE(?, looking_for),
            filters = COALESCE(?, filters),
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(
				min_age,
				max_age,
				max_distance,
				looking_for,
				filters ? JSON.stringify(filters) : null,
				userId,
			);
		} else {
			const id = uuidv4();
			db.prepare(`
        INSERT INTO search_settings (id, user_id, min_age, max_age, max_distance, looking_for, filters)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
				id,
				userId,
				min_age || 18,
				max_age || 60,
				max_distance || 100,
				looking_for || "female",
				filters ? JSON.stringify(filters) : "{}",
			);
		}

		res.json({ success: true, message: "Настройки обновлены" });
	} catch (error) {
		console.error("Update search settings error:", error);
		res.status(500).json({ error: "Ошибка при обновлении настроек" });
	}
});

// ============================================
// КАНДИДАТЫ С УМНЫМ ПОДБОРОМ
// ============================================

// Получить кандидатов с фильтрами и совместимостью
router.get("/candidates", authenticateToken, (req, res) => {
	try {
		const userId = req.user.id;
		const { limit = 20 } = req.query;

		// Получаем текущего пользователя
		const currentUser = db
			.prepare("SELECT * FROM users WHERE id = ?")
			.get(userId);
		if (!currentUser) {
			return res.status(404).json({ error: "Пользователь не найден" });
		}

		// Получаем настройки поиска
		const settings = db
			.prepare("SELECT * FROM search_settings WHERE user_id = ?")
			.get(userId);

		const minAge = settings?.min_age || 18;
		const maxAge = settings?.max_age || 60;
		const searchGender =
			settings?.looking_for || currentUser.looking_for || "female";

		// Получаем ответы текущего пользователя для расчёта совместимости
		const userAnswers = db
			.prepare(
				"SELECT question_key, answer_value FROM user_answers WHERE user_id = ?",
			)
			.all(userId);

		// ID пользователей, которых уже свайпали
		const swipedUsers = db
			.prepare("SELECT target_user_id FROM swipes WHERE user_id = ?")
			.all(userId);
		const swipedIds = swipedUsers.map((s) => s.target_user_id);
		const swipedPlaceholders =
			swipedIds.length > 0
				? `AND id NOT IN (${swipedIds.map(() => "?").join(",")})`
				: "";
		const swipedParams = swipedIds.length > 0 ? swipedIds : [];

		// Базовый запрос кандидатов (без скоринга — посчитаем отдельно)
		const baseCandidates = db
			.prepare(`
      SELECT id, name, age, bio, gender, location, photos, latitude, longitude
      FROM users
      WHERE id != ?
        AND age BETWEEN ? AND ?
        AND gender = ?
        AND is_frozen = 0
        ${swipedPlaceholders}
      LIMIT ?
    `)
			.all(
				userId,
				minAge,
				maxAge,
				searchGender,
				...swipedParams,
				parseInt(limit),
			);

		if (baseCandidates.length === 0) {
			return res.json([]);
		}

		// Гео-фильтрация (Haversine, в JS — SQLite без расширений)
		const maxDistance = settings?.max_distance || 100; // км
		const filteredByDistance = baseCandidates.filter((c) => {
			// Если у обоих пользователей есть координаты — проверяем дистанцию
			if (
				currentUser.latitude != null &&
				currentUser.longitude != null &&
				c.latitude != null &&
				c.longitude != null
			) {
				const distanceKm = haversineKm(
					currentUser.latitude,
					currentUser.longitude,
					c.latitude,
					c.longitude,
				);
				return distanceKm <= maxDistance;
			}
			// Если координат нет — пропускаем (не блокируем по гео)
			return true;
		});

		if (filteredByDistance.length === 0) {
			return res.json([]);
		}

		// Кастомные фильтры из JSON-поля filters
		let customFilters = {};
		try {
			customFilters = JSON.parse(settings?.filters || "{}");
		} catch (_e) {
			customFilters = {};
		}

		// with_photo — только кандидаты, у которых есть хотя бы одно фото
		const filteredByCustom = filteredByDistance.filter((c) => {
			if (customFilters.with_photo) {
				const photos = JSON.parse(c.photos || "[]");
				if (photos.length === 0) return false;
			}
			return true;
		});

		if (filteredByCustom.length === 0) {
			return res.json([]);
		}

		const candidateIds = filteredByCustom.map((c) => c.id);
		const idPlaceholders = candidateIds.map(() => "?").join(",");

		// Совместимость по ответам анкеты: question_key → значение или массив
		const userAnswerMap = new Map();
		for (const a of userAnswers) {
			userAnswerMap.set(a.question_key, a.answer_value);
		}

		// Пары ответов кандидатов — для подсчёта совпадений
		const candidateAnswers = db
			.prepare(
				`SELECT user_id, question_key, answer_value FROM user_answers WHERE user_id IN (${idPlaceholders})`,
			)
			.all(...candidateIds);

		const compatibilityByUser = new Map();
		for (const ans of candidateAnswers) {
			// Поддержка мультиселектов: answer_value хранится как JSON-строка массива
			let otherValue = ans.answer_value;
			if (typeof otherValue === "string" && otherValue.startsWith("[")) {
				try {
					otherValue = JSON.parse(otherValue);
				} catch {
					// не массив — оставляем как есть
				}
			}
			const myValue = userAnswerMap.get(ans.question_key);
			if (answersMatch(ans.question_key, myValue, otherValue)) {
				compatibilityByUser.set(
					ans.user_id,
					(compatibilityByUser.get(ans.user_id) || 0) + 1,
				);
			}
		}

		// Популярность: сколько лайков получил кандидат
		const popularityRows = db
			.prepare(
				`SELECT target_user_id, COUNT(*) AS likes FROM swipes
       WHERE target_user_id IN (${idPlaceholders}) AND direction = 'like'
       GROUP BY target_user_id`,
			)
			.all(...candidateIds);
		const popularityByUser = new Map(
			popularityRows.map((r) => [r.target_user_id, r.likes]),
		);

		// Скоринг и сортировка
		const candidates = filteredByCustom
			.map((u) => ({
				...u,
				compatibility_score: compatibilityByUser.get(u.id) || 0,
				likes_received: popularityByUser.get(u.id) || 0,
				distance_km:
					currentUser.latitude != null &&
					currentUser.longitude != null &&
					u.latitude != null &&
					u.longitude != null
						? Math.round(
								haversineKm(
									currentUser.latitude,
									currentUser.longitude,
									u.latitude,
									u.longitude,
								) * 10,
							) / 10
						: null,
			}))
			.sort((a, b) => {
				if (b.compatibility_score !== a.compatibility_score) {
					return b.compatibility_score - a.compatibility_score;
				}
				if (b.likes_received !== a.likes_received) {
					return b.likes_received - a.likes_received;
				}
				return Math.random() - 0.5;
			});

		// Форматируем результат
		const formatted = candidates.map((u) => ({
			id: u.id,
			name: u.name,
			age: u.age,
			bio: u.bio,
			gender: u.gender,
			location: u.location,
			photos: JSON.parse(u.photos || "[]"),
			compatibility: u.compatibility_score || 0,
			popularity: u.likes_received || 0,
			distance_km: u.distance_km,
		}));

		res.json(formatted);
	} catch (error) {
		console.error("Get candidates error:", error);
		res.status(500).json({ error: "Ошибка при получении кандидатов" });
	}
});

export default router;
