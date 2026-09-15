import { Router } from "express";
import db from "../db/database.js";
import { authenticateToken, requirePin } from "../middleware/auth.js";

const router = Router();

// Получить все мэтчи текущего пользователя
router.get("/", authenticateToken, requirePin, (req, res) => {
	try {
		const userId = req.user.id;

		const matches = db
			.prepare(`
      SELECT m.*,
        CASE WHEN m.user1_id = ? THEN m.user2_id ELSE m.user1_id END as other_user_id,
        u.name as other_user_name,
        u.photos as other_user_photos,
        (
          SELECT text FROM messages
          WHERE match_id = m.id
          ORDER BY created_at DESC, id DESC LIMIT 1
        ) as last_message,
        (
          SELECT COUNT(*) FROM messages
          WHERE match_id = m.id AND sender_id != ? AND is_read = 0
        ) as unread_count
      FROM matches m
      JOIN users u ON u.id = CASE WHEN m.user1_id = ? THEN m.user2_id ELSE m.user1_id END
      WHERE m.user1_id = ? OR m.user2_id = ?
      ORDER BY m.created_at DESC
    `)
			.all(userId, userId, userId, userId, userId);

		const formatted = matches.map((m) => ({
			...m,
			other_user_photos: JSON.parse(m.other_user_photos || "[]"),
		}));

		res.json(formatted);
	} catch (error) {
		console.error("Get matches error:", error);
		res.status(500).json({ error: "Ошибка при получении мэтчей" });
	}
});

// Получить конкретный мэтч
router.get("/:id", authenticateToken, requirePin, (req, res) => {
	try {
		const userId = req.user.id;
		const matchId = req.params.id;

		const match = db
			.prepare(`
      SELECT m.*,
        CASE WHEN m.user1_id = ? THEN m.user2_id ELSE m.user1_id END as other_user_id,
        u.name as other_user_name,
        u.photos as other_user_photos,
        u.is_premium as other_user_premium
      FROM matches m
      JOIN users u ON u.id = CASE WHEN m.user1_id = ? THEN m.user2_id ELSE m.user1_id END
      WHERE m.id = ? AND (m.user1_id = ? OR m.user2_id = ?)
    `)
			.get(userId, userId, matchId, userId, userId);

		if (!match) {
			return res.status(404).json({ error: "Мэтч не найден" });
		}

		res.json({
			...match,
			other_user_photos: JSON.parse(match.other_user_photos || "[]"),
		});
	} catch (error) {
		console.error("Get match error:", error);
		res.status(500).json({ error: "Ошибка при получении мэтча" });
	}
});

// Удалить мэтч
router.delete("/:id", authenticateToken, requirePin, (req, res) => {
	try {
		const userId = req.user.id;
		const matchId = req.params.id;

		const match = db
			.prepare(
				"SELECT id FROM matches WHERE id = ? AND (user1_id = ? OR user2_id = ?)",
			)
			.get(matchId, userId, userId);

		if (!match) {
			return res.status(404).json({ error: "Мэтч не найден" });
		}

		// Удаляем сообщения и мэтч
		db.prepare("DELETE FROM messages WHERE match_id = ?").run(matchId);
		db.prepare("DELETE FROM matches WHERE id = ?").run(matchId);

		res.json({ success: true });
	} catch (error) {
		console.error("Delete match error:", error);
		res.status(500).json({ error: "Ошибка при удалении мэтча" });
	}
});

export default router;
