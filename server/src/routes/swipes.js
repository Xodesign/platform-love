import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db/database.js";
import { authenticateToken, requirePin } from "../middleware/auth.js";

const router = Router();

// Получить кандидатов для свайпов
router.get("/candidates", authenticateToken, requirePin, (req, res) => {
	try {
		const userId = req.user.id;
		const { limit = 20 } = req.query;

		// Получаем текущего пользователя для фильтрации
		const currentUser = db
			.prepare("SELECT * FROM users WHERE id = ?")
			.get(userId);
		if (!currentUser) {
			return res.status(404).json({ error: "Пользователь не найден" });
		}

		// Находим пользователей, которых ещё не свайпали
		// и которые подходят под критерии поиска
		const candidates = db
			.prepare(
				`
      SELECT id, name, age, bio, gender, location, photos
      FROM users
      WHERE id != ?
        AND id NOT IN (
          SELECT target_user_id FROM swipes WHERE user_id = ?
        )
        AND gender = ?
      LIMIT ?
    `,
			)
			.all(userId, userId, currentUser.looking_for, parseInt(limit));

		const formatted = candidates.map((u) => ({
			...u,
			photos: JSON.parse(u.photos || "[]"),
		}));

		res.json(formatted);
	} catch (error) {
		console.error("Get candidates error:", error);
		res.status(500).json({ error: "Ошибка при получении кандидатов" });
	}
});

// Сделать свайп
router.post("/", authenticateToken, requirePin, (req, res) => {
	try {
		const { target_user_id, direction } = req.body;
		const userId = req.user.id;

		if (!target_user_id || !direction) {
			return res
				.status(400)
				.json({ error: "target_user_id и direction обязательны" });
		}

		if (!["like", "dislike"].includes(direction)) {
			return res
				.status(400)
				.json({ error: 'direction должен быть "like" или "dislike"' });
		}

		// Проверяем, что целевой пользователь существует
		const targetUser = db
			.prepare("SELECT id FROM users WHERE id = ?")
			.get(target_user_id);
		if (!targetUser) {
			return res.status(404).json({ error: "Пользователь не найден" });
		}

		// Вся цепочка «свайп → взаимность → мэтч → уведомления» — в одной транзакции.
		// Без неё при параллельных запросах свайп мог записаться, а мэтч — нет,
		// либо мэтч и уведомления создались бы дважды.
		const recordSwipe = db.transaction(() => {
			const existingSwipe = db
				.prepare(
					"SELECT id FROM swipes WHERE user_id = ? AND target_user_id = ?",
				)
				.get(userId, target_user_id);
			if (existingSwipe) return { conflict: true };

			const swipeId = uuidv4();
			db.prepare(
				`
        INSERT INTO swipes (id, user_id, target_user_id, direction)
        VALUES (?, ?, ?, ?)
      `,
			).run(swipeId, userId, target_user_id, direction);

			if (direction !== "like") return { swipeId, match: null };

			const mutualLike = db
				.prepare(
					`
        SELECT id FROM swipes
        WHERE user_id = ? AND target_user_id = ? AND direction = 'like'
      `,
				)
				.get(target_user_id, userId);
			if (!mutualLike) return { swipeId, match: null };

			// Ключи пары приводим к одному порядку: UNIQUE(user1_id, user2_id)
			// без этого допускает и (A,B), и (B,A) — два мэтча на одну пару.
			const [u1, u2] = [userId, target_user_id].sort();
			const matchId = uuidv4();
			const inserted = db
				.prepare(
					`
          INSERT OR IGNORE INTO matches (id, user1_id, user2_id)
          VALUES (?, ?, ?)
        `,
				)
				.run(matchId, u1, u2);

			if (inserted.changes === 0) {
				// Мэтч уже был — повторные уведомления не шлём.
				const existing = db
					.prepare("SELECT id FROM matches WHERE user1_id = ? AND user2_id = ?")
					.get(u1, u2);
				return { swipeId, match: { id: existing.id, matched: true } };
			}

			// Уведомляем обоих о совпадении — иначе мэтч виден только в /matches,
			// а на экране уведомлений (и в счётчике) ничего не появляется.
			const notify = db.prepare(`
          INSERT INTO notifications (id, user_id, type, text, is_read)
          VALUES (?, ?, 'match', ?, 0)
        `);
			const swiperName =
				db.prepare("SELECT name FROM users WHERE id = ?").get(userId)?.name ||
				"Пользователь";
			const targetName =
				db.prepare("SELECT name FROM users WHERE id = ?").get(target_user_id)
					?.name || "Пользователь";
			notify.run(
				uuidv4(),
				target_user_id,
				`У вас новый мэтч с ${swiperName}! Напишите первым.`,
			);
			notify.run(
				uuidv4(),
				userId,
				`У вас новый мэтч с ${targetName}! Напишите первым.`,
			);

			return { swipeId, match: { id: matchId, matched: true } };
		});

		const out = recordSwipe();
		if (out.conflict)
			return res
				.status(400)
				.json({ error: "Вы уже свайпали этого пользователя" });

		res.status(201).json({ id: out.swipeId, direction, match: out.match });
	} catch (error) {
		// Гонка между процессами: UNIQUE(user_id, target_user_id) ловит повторный
		// свайп раньше, чем его успеет проверить SELECT выше.
		if (String(error?.message).includes("UNIQUE constraint failed: swipes")) {
			return res
				.status(400)
				.json({ error: "Вы уже свайпали этого пользователя" });
		}
		console.error("Swipe error:", error);
		res.status(500).json({ error: "Ошибка при свайпе" });
	}
});

// Получить историю свайпов текущего пользователя
router.get("/history", authenticateToken, requirePin, (req, res) => {
	try {
		const userId = req.user.id;

		const swipes = db
			.prepare(
				`
      SELECT s.*, u.name as target_name, u.photos as target_photos
      FROM swipes s
      JOIN users u ON s.target_user_id = u.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
      LIMIT 100
    `,
			)
			.all(userId);

		const formatted = swipes.map((s) => ({
			...s,
			target_photos: JSON.parse(s.target_photos || "[]"),
		}));

		res.json(formatted);
	} catch (error) {
		console.error("Get swipes history error:", error);
		res.status(500).json({ error: "Ошибка при получении истории" });
	}
});

export default router;
