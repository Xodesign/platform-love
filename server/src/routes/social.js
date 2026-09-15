import { Router } from "express";
import { randomUUID } from "node:crypto";
import db from "../db/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();
const uid = () => randomUUID();

function relTime(iso) {
	if (!iso) return "";
	const d = new Date(iso.replace(" ", "T"));
	const diff = Date.now() - d.getTime();
	const m = Math.floor(diff / 60000);
	if (m < 1) return "только что";
	if (m < 60) return `${m} мин назад`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h} ч назад`;
	const days = Math.floor(h / 24);
	if (days === 1) return "вчера";
	if (days < 7) return `${days} дн назад`;
	return d.toLocaleDateString("ru-RU");
}

const publicUser = (u) => ({
	id: u.id,
	name: u.name,
	age: u.age,
	photos: JSON.parse(u.photos || "[]"),
	bio: u.bio,
	location: u.location,
	sociotype: u.sociotype,
});

// Входящие лайки (кто лайкнул меня)
router.get("/likes/incoming", authenticateToken, (req, res) => {
	const me = req.user.id;
	const rows = db
		.prepare(
			`SELECT s.*, u.name, u.age, u.photos, u.bio, u.location
       FROM swipes s JOIN users u ON u.id = s.user_id
       WHERE s.target_user_id = ? AND s.direction = 'like'
       ORDER BY s.created_at DESC`,
		)
		.all(me);
	const result = rows.map((r) => {
		const match = db
			.prepare(
				`SELECT id FROM matches WHERE (user1_id=? AND user2_id=?) OR (user1_id=? AND user2_id=?)`,
			)
			.get(me, r.user_id, r.user_id, me);
		return { ...publicUser(r), time: relTime(r.created_at), mutual: !!match };
	});
	res.json(result);
});

// Уведомления
router.get("/notifications", authenticateToken, (req, res) => {
	res.json(
		db
			.prepare(
				"SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC",
			)
			.all(req.user.id)
			.map((n) => ({ ...n, time: relTime(n.created_at) })),
	);
});
router.post("/notifications/read", authenticateToken, (req, res) => {
	db.prepare("UPDATE notifications SET is_read=1 WHERE user_id=?").run(
		req.user.id,
	);
	res.json({ ok: true });
});

// Чёрный список пользователя
router.get("/blacklist", authenticateToken, (req, res) => {
	res.json(
		db
			.prepare(
				`SELECT b.id, b.reason, b.created_at, u.id AS user_id, u.name, u.age, u.photos
       FROM blocked_users b JOIN users u ON u.id = b.blocked_id WHERE b.owner_id=?`,
			)
			.all(req.user.id)
			.map((b) => ({
				id: b.user_id,
				name: b.name,
				age: b.age,
				photos: JSON.parse(b.photos || "[]"),
				reason: b.reason,
			})),
	);
});
router.post("/blacklist", authenticateToken, (req, res) => {
	const { userId, reason } = req.body || {};
	if (!userId) return res.status(400).json({ error: "userId обязателен" });
	db.prepare(
		"INSERT OR IGNORE INTO blocked_users (id, owner_id, blocked_id, reason) VALUES (?,?,?,?)",
	).run(uid(), req.user.id, userId, reason || "—");
	res.json({ ok: true });
});
router.delete("/blacklist/:userId", authenticateToken, (req, res) => {
	db.prepare("DELETE FROM blocked_users WHERE owner_id=? AND blocked_id=?").run(
		req.user.id,
		req.params.userId,
	);
	res.json({ ok: true });
});

// Посты (стена / лента)
const postRow = (p, me) => {
	const u = db
		.prepare("SELECT id,name,age,photos FROM users WHERE id=?")
		.get(p.user_id);
	const likes = db
		.prepare("SELECT COUNT(*) n FROM post_likes WHERE post_id=?")
		.get(p.id).n;
	const likedByMe = !!db
		.prepare("SELECT id FROM post_likes WHERE post_id=? AND user_id=?")
		.get(p.id, me);
	return {
		id: p.id,
		userId: p.user_id,
		name: u?.name,
		age: u?.age,
		photos: JSON.parse(u?.photos || "[]"),
		text: p.text,
		image: p.image,
		likes,
		likedByMe,
		time: relTime(p.created_at),
	};
};
router.get("/posts", authenticateToken, (req, res) => {
	res.json(
		db
			.prepare("SELECT * FROM posts ORDER BY created_at DESC")
			.all()
			.map((p) => postRow(p, req.user.id)),
	);
});
router.get("/posts/mine", authenticateToken, (req, res) => {
	res.json(
		db
			.prepare("SELECT * FROM posts WHERE user_id=? ORDER BY created_at DESC")
			.all(req.user.id)
			.map((p) => postRow(p, req.user.id)),
	);
});
router.post("/posts", authenticateToken, (req, res) => {
	const text = req.body?.text;
	if (!text) return res.status(400).json({ error: "Пустой пост" });
	const id = uid();
	db.prepare("INSERT INTO posts (id, user_id, text) VALUES (?,?,?)").run(
		id,
		req.user.id,
		text,
	);
	res.json(
		postRow(db.prepare("SELECT * FROM posts WHERE id=?").get(id), req.user.id),
	);
});
router.post("/posts/:id/like", authenticateToken, (req, res) => {
	const existing = db
		.prepare("SELECT id FROM post_likes WHERE post_id=? AND user_id=?")
		.get(req.params.id, req.user.id);
	if (existing)
		db.prepare("DELETE FROM post_likes WHERE id=?").run(existing.id);
	else
		db.prepare(
			"INSERT INTO post_likes (id, post_id, user_id) VALUES (?,?,?)",
		).run(uid(), req.params.id, req.user.id);
	res.json(
		postRow(
			db.prepare("SELECT * FROM posts WHERE id=?").get(req.params.id),
			req.user.id,
		),
	);
});

// Публичные тарифы
router.get("/subscriptions/plans", (req, res) => {
	const row = db
		.prepare("SELECT value FROM payment_settings WHERE key='plans'")
		.get();
	try {
		res.json(row ? JSON.parse(row.value) : []);
	} catch {
		res.json([]);
	}
});

export default router;
