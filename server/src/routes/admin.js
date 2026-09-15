import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import db from "../db/database.js";
import { generateAdminToken, requireAdmin } from "../middleware/auth.js";

const router = Router();
const uid = () => randomUUID();

const fmtDate = (iso) => {
	if (!iso) return "—";
	const d = new Date(iso.replace(" ", "T"));
	if (isNaN(d)) return iso;
	return d.toLocaleDateString("ru-RU", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
};
const fmtDateTime = (iso) => {
	if (!iso) return "—";
	const d = new Date(iso.replace(" ", "T"));
	if (isNaN(d)) return iso;
	return `${d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })} ${d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
};
const fmtTime = (iso) => {
	if (!iso) return "—";
	const d = new Date(iso.replace(" ", "T"));
	if (isNaN(d)) return iso;
	return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
};

function log(adminName, action, target, details, ip) {
	db.prepare(
		`INSERT INTO admin_logs (id, admin, action, target, details, timestamp, ip) VALUES (?,?,?,?,?,?,?)`,
	).run(
		uid(),
		adminName,
		action,
		target || "—",
		details || "",
		fmtDateTime(new Date().toISOString()),
		ip || "—",
	);
}

const photoCount = (photos) => {
	try {
		return JSON.parse(photos || "[]").length;
	} catch {
		return 0;
	}
};
const likesReceived = (userId) =>
	db
		.prepare(
			`SELECT COUNT(*) n FROM swipes WHERE target_user_id=? AND direction='like'`,
		)
		.get(userId).n;

function userRow(u) {
	return {
		id: u.id,
		name: u.name,
		email: u.email,
		phone: u.phone,
		status: u.status || "active",
		sociotype: u.sociotype || "—",
		approved: !!u.approved,
		isAdmin: !!u.is_admin,
		isPremium: !!u.is_premium,
		registrationDate: fmtDate(u.created_at),
		lastSeen: fmtDateTime(u.last_seen),
		photos: photoCount(u.photos),
		likesReceived: likesReceived(u.id),
	};
}

// ---------- Auth ----------
router.post("/login", (req, res) => {
	const { email, password } = req.body || {};
	const admin = db.prepare("SELECT * FROM admins WHERE email = ?").get(email);
	if (!admin || !bcrypt.compareSync(password || "", admin.password)) {
		return res.status(401).json({ error: "Неверный email или пароль" });
	}
	db.prepare(
		"UPDATE admins SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?",
	).run(admin.id);
	log(admin.name, "Вход в систему", "—", "Успешная авторизация", req.ip);
	res.json({
		token: generateAdminToken(admin.id),
		admin: {
			id: admin.id,
			name: admin.name,
			email: admin.email,
			role: admin.role,
		},
	});
});

router.use(requireAdmin); // всё ниже — только для админов

router.get("/me", (req, res) => res.json({ admin: req.admin }));

// ---------- Dashboard ----------
router.get("/stats", (_req, res) => {
	const today = new Date().toISOString().slice(0, 10);
	const newToday = db
		.prepare("SELECT COUNT(*) n FROM users WHERE date(created_at)=?")
		.get(today).n;
	const totalUsers = db.prepare("SELECT COUNT(*) n FROM users").get().n;
	const matches = db.prepare("SELECT COUNT(*) n FROM matches").get().n;
	const orders = db.prepare("SELECT COUNT(*) n FROM orders").get().n;
	const revenue = db
		.prepare(
			"SELECT COALESCE(SUM(amount),0) s FROM transactions WHERE status='success'",
		)
		.get().s;
	const openSupport = db
		.prepare("SELECT COUNT(*) n FROM support_tickets WHERE status='open'")
		.get().n;
	const pendingMod = db
		.prepare("SELECT COUNT(*) n FROM users WHERE approved=0")
		.get().n;
	const newComplaints = db
		.prepare("SELECT COUNT(*) n FROM complaints WHERE status='new'")
		.get().n;

	const stats = [
		{
			id: "users_today",
			label: "Новых за сегодня",
			value: newToday,
			icon: "👥",
			color: "#7B5EA7",
			change: "",
			positive: true,
		},
		{
			id: "total_users",
			label: "Всего пользователей",
			value: totalUsers,
			icon: "💜",
			color: "#5B8DB8",
			change: "",
			positive: true,
		},
		{
			id: "matches",
			label: "Мэтчей",
			value: matches,
			icon: "❤️",
			color: "#E77C8E",
			change: "",
			positive: true,
		},
		{
			id: "orders",
			label: "Заказов доставки",
			value: orders,
			icon: "🌸",
			color: "#8FBF7A",
			change: "",
			positive: true,
		},
		{
			id: "revenue",
			label: "Выручка, ₽",
			value: revenue,
			icon: "💰",
			color: "#D9A441",
			change: "",
			positive: true,
		},
	];
	const activity = db
		.prepare(
			"SELECT admin, action, target, timestamp FROM admin_logs ORDER BY rowid DESC LIMIT 6",
		)
		.all()
		.map((l, i) => ({
			id: i + 1,
			type: "admin",
			text: `${l.action}: ${l.target}`,
			time: l.timestamp,
			icon: "🛠️",
		}));
	const pending = [
		{
			type: "support",
			count: openSupport,
			label: "Неотвеченные обращения",
			color: "#5B8DB8",
		},
		{
			type: "moderation",
			count: pendingMod,
			label: "Анкеты на модерации",
			color: "#7B5EA7",
		},
		{
			type: "complaints",
			count: newComplaints,
			label: "Новые жалобы",
			color: "#E77C8E",
		},
	];
	res.json({ stats, activity, pending });
});

// ---------- Users ----------
router.get("/users", (_req, res) => {
	res.json(
		db
			.prepare("SELECT * FROM users ORDER BY created_at DESC")
			.all()
			.map(userRow),
	);
});

router.get("/users/:id", (req, res) => {
	const u = db.prepare("SELECT * FROM users WHERE id=?").get(req.params.id);
	if (!u) return res.status(404).json({ error: "Пользователь не найден" });
	res.json({
		id: u.id,
		name: u.name,
		email: u.email,
		phone: u.phone,
		age: u.age,
		city: u.location,
		sociotype: u.sociotype || "—",
		status: u.status || "active",
		approved: !!u.approved,
		registeredAt: fmtDate(u.created_at),
		bio: u.bio,
		gender: u.gender,
		photos: JSON.parse(u.photos || "[]"),
		likesReceived: likesReceived(u.id),
		isPremium: !!u.is_premium,
	});
});

router.put("/users/:id", (req, res) => {
	const u = db.prepare("SELECT * FROM users WHERE id=?").get(req.params.id);
	if (!u) return res.status(404).json({ error: "Пользователь не найден" });
	const { status, approved, isPremium, isAdmin } = req.body || {};
	db.prepare(
		`UPDATE users SET status=?, approved=?, is_premium=?, is_admin=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
	).run(
		status ?? u.status,
		approved === undefined ? u.approved : approved ? 1 : 0,
		isPremium === undefined ? u.is_premium : isPremium ? 1 : 0,
		isAdmin === undefined ? u.is_admin : isAdmin ? 1 : 0,
		u.id,
	);
	log(
		req.admin.name,
		"Изменение пользователя",
		u.name,
		`status=${status ?? u.status}, approved=${approved ?? u.approved}`,
		req.ip,
	);
	res.json(userRow(db.prepare("SELECT * FROM users WHERE id=?").get(u.id)));
});

router.delete("/users/:id", (req, res) => {
	const u = db.prepare("SELECT * FROM users WHERE id=?").get(req.params.id);
	if (!u) return res.status(404).json({ error: "Пользователь не найден" });
	db.prepare("DELETE FROM users WHERE id=?").run(u.id);
	log(req.admin.name, "Удаление пользователя", u.name, "", req.ip);
	res.json({ ok: true });
});

// ---------- Moderation ----------
router.get("/moderation", (_req, res) => {
	res.json(
		db
			.prepare("SELECT * FROM users WHERE approved=0 ORDER BY created_at DESC")
			.all()
			.map((u) => ({
				id: u.id,
				name: u.name,
				age: u.age,
				photos: JSON.parse(u.photos || "[]"),
				sociotype: u.sociotype || "—",
				bio: u.bio || "",
				submittedAt: fmtDate(u.created_at),
				hasInappropriate: false,
				hasInappropriatePhotos: false,
			})),
	);
});

router.put("/moderation/:id", (req, res) => {
	const u = db.prepare("SELECT * FROM users WHERE id=?").get(req.params.id);
	if (!u) return res.status(404).json({ error: "Профиль не найден" });
	const approve = !!req.body?.approve;
	db.prepare("UPDATE users SET approved=?, status=? WHERE id=?").run(
		approve ? 1 : 0,
		approve ? "active" : "rejected",
		u.id,
	);
	log(
		req.admin.name,
		approve ? "Одобрение анкеты" : "Отклонение анкеты",
		u.name,
		"",
		req.ip,
	);
	res.json({ ok: true, approved: approve });
});

// ---------- Blacklist ----------
router.get("/blacklist", (_req, res) => {
	res.json(
		db
			.prepare(
				"SELECT * FROM users WHERE status='blocked' ORDER BY updated_at DESC",
			)
			.all()
			.map((u) => ({
				id: u.id,
				name: u.name,
				email: u.email,
				reason: u.blocked_reason || "—",
				blockedBy: "Администратор",
				blockedAt: fmtDate(u.updated_at),
				until: u.blocked_until || "бессрочно",
			})),
	);
});

router.post("/blacklist", (req, res) => {
	const { userId, email, reason, until } = req.body || {};
	const u = userId
		? db.prepare("SELECT * FROM users WHERE id=?").get(userId)
		: db.prepare("SELECT * FROM users WHERE email=?").get(email);
	if (!u) return res.status(404).json({ error: "Пользователь не найден" });
	db.prepare(
		"UPDATE users SET status='blocked', blocked_reason=?, blocked_until=? WHERE id=?",
	).run(reason || "—", until || "бессрочно", u.id);
	log(req.admin.name, "Блокировка", u.name, reason || "", req.ip);
	res.json({ ok: true });
});

router.delete("/blacklist/:id", (req, res) => {
	const u = db.prepare("SELECT * FROM users WHERE id=?").get(req.params.id);
	if (!u) return res.status(404).json({ error: "Пользователь не найден" });
	db.prepare(
		"UPDATE users SET status='active', blocked_reason=NULL, blocked_until=NULL WHERE id=?",
	).run(u.id);
	log(req.admin.name, "Разблокировка", u.name, "", req.ip);
	res.json({ ok: true });
});

// ---------- Orders ----------
const orderRow = (o) => ({
	id: o.id,
	customer: o.customer,
	customerId: o.customer_id,
	recipient: o.recipient,
	bouquet: o.bouquet,
	budget: o.budget,
	status: o.status,
	date: o.date,
	time: o.time,
	deliveryAddress: o.delivery_address,
	phone: o.phone,
	paymentMethod: o.payment_method,
	isPaid: !!o.is_paid,
});
router.get("/orders", (_req, res) =>
	res.json(
		db.prepare("SELECT * FROM orders ORDER BY rowid DESC").all().map(orderRow),
	),
);

router.get("/orders/:id", (req, res) => {
	const o = db.prepare("SELECT * FROM orders WHERE id=?").get(req.params.id);
	if (!o) return res.status(404).json({ error: "Заказ не найден" });
	res.json({
		id: o.id,
		customer: o.customer,
		recipient: o.recipient,
		customerPhone: o.phone,
		recipientPhone: o.phone,
		bouquet: o.bouquet,
		budget: `${o.budget} ₽`,
		cardText: "С любовью и заботой!",
		wishes: "Предпочтения по оформлению уточняются",
		address: o.delivery_address,
		status: o.status,
	});
});

router.put("/orders/:id", (req, res) => {
	const o = db.prepare("SELECT * FROM orders WHERE id=?").get(req.params.id);
	if (!o) return res.status(404).json({ error: "Заказ не найден" });
	const status = req.body?.status ?? o.status;
	db.prepare("UPDATE orders SET status=? WHERE id=?").run(status, o.id);
	log(req.admin.name, "Смена статуса заказа", o.bouquet, status, req.ip);
	res.json(orderRow(db.prepare("SELECT * FROM orders WHERE id=?").get(o.id)));
});

// ---------- Complaints ----------
router.get("/complaints", (_req, res) =>
	res.json(
		db
			.prepare("SELECT * FROM complaints ORDER BY rowid DESC")
			.all()
			.map((c) => ({
				id: c.id,
				reportedUser: c.reported_user,
				complainant: c.complainant,
				reason: c.reason,
				date: c.date,
				status: c.status,
			})),
	),
);
router.put("/complaints/:id", (req, res) => {
	const c = db
		.prepare("SELECT * FROM complaints WHERE id=?")
		.get(req.params.id);
	if (!c) return res.status(404).json({ error: "Жалоба не найдена" });
	db.prepare("UPDATE complaints SET status=? WHERE id=?").run(
		req.body?.status ?? c.status,
		c.id,
	);
	log(
		req.admin.name,
		"Обработка жалобы",
		c.reported_user,
		req.body?.status,
		req.ip,
	);
	res.json({ ok: true });
});

// ---------- Support ----------
router.get("/support", (_req, res) => {
	res.json(
		db
			.prepare("SELECT * FROM support_tickets ORDER BY updated_at DESC")
			.all()
			.map((t) => {
				const last = db
					.prepare(
						"SELECT text, created_at FROM support_messages WHERE ticket_id=? ORDER BY rowid DESC LIMIT 1",
					)
					.get(t.id);
				const unread = db
					.prepare(
						"SELECT COUNT(*) n FROM support_messages WHERE ticket_id=? AND sender='user'",
					)
					.get(t.id).n;
				return {
					id: t.id,
					user: t.user_name,
					lastMessage: last?.text || t.subject,
					unread: t.status === "open" ? unread : 0,
					time: fmtTime(last?.created_at || t.created_at),
					status: t.status,
					subject: t.subject,
				};
			}),
	);
});
router.get("/support/:id", (req, res) => {
	const t = db
		.prepare("SELECT * FROM support_tickets WHERE id=?")
		.get(req.params.id);
	if (!t) return res.status(404).json({ error: "Обращение не найдено" });
	const messages = db
		.prepare("SELECT * FROM support_messages WHERE ticket_id=? ORDER BY rowid")
		.all(t.id)
		.map((m) => ({
			id: m.id,
			sender: m.sender,
			text: m.text,
			time: fmtTime(m.created_at),
		}));
	res.json({ ticket: t, messages });
});
router.post("/support/:id/messages", (req, res) => {
	const t = db
		.prepare("SELECT * FROM support_tickets WHERE id=?")
		.get(req.params.id);
	if (!t) return res.status(404).json({ error: "Обращение не найдено" });
	const text = req.body?.text;
	if (!text) return res.status(400).json({ error: "Пустое сообщение" });
	db.prepare(
		"INSERT INTO support_messages (id, ticket_id, sender, text) VALUES (?,?,?,?)",
	).run(uid(), t.id, "admin", text);
	db.prepare(
		"UPDATE support_tickets SET status='answered', updated_at=CURRENT_TIMESTAMP WHERE id=?",
	).run(t.id);
	log(
		req.admin.name,
		"Ответ в поддержку",
		t.user_name,
		text.slice(0, 40),
		req.ip,
	);
	res.json({ ok: true });
});

// ---------- Logs ----------
router.get("/logs", (_req, res) =>
	res.json(
		db
			.prepare("SELECT * FROM admin_logs ORDER BY rowid DESC LIMIT 200")
			.all()
			.map((l) => ({
				id: l.id,
				admin: l.admin,
				action: l.action,
				target: l.target,
				details: l.details,
				timestamp: l.timestamp,
				ip: l.ip,
			})),
	),
);

// ---------- Payment ----------
const getSetting = (key, fallback) => {
	const row = db
		.prepare("SELECT value FROM payment_settings WHERE key=?")
		.get(key);
	try {
		return row ? JSON.parse(row.value) : fallback;
	} catch {
		return fallback;
	}
};
router.get("/payment", (_req, res) => {
	const plans = getSetting("plans", []);
	const colors = {
		basic: "#8E8E8E",
		premium: "#7B5EA7",
		premium_plus: "#5B8DB8",
		love_bundle: "#D9A441",
	};
	const subs = plans.map((p, i) => {
		const subscribers = db
			.prepare(
				"SELECT COUNT(*) n FROM subscriptions WHERE plan=? AND status='active'",
			)
			.get(p.id).n;
		return {
			id: i + 1,
			key: p.id,
			name: p.name,
			description: p.features?.[0] || "",
			price: p.price,
			period: p.period,
			features: p.features,
			isActive: p.isActive !== false,
			color: colors[p.id] || "#7B5EA7",
			subscribers,
			revenue: p.price * subscribers,
		};
	});
	const delivery = db
		.prepare("SELECT * FROM delivery_zones")
		.all()
		.map((z, i) => ({
			id: i + 1,
			key: z.id,
			name: z.zone,
			price: z.price,
			description: `Доставка: ${z.eta || "—"}`,
		}));
	res.json({
		subscriptions: subs,
		delivery,
		methods: getSetting("payment_methods", []),
		transactions: db
			.prepare("SELECT * FROM transactions ORDER BY rowid DESC")
			.all(),
	});
});
router.put("/payment/subscriptions/:key", (req, res) => {
	const plans = getSetting("plans", []);
	const p = plans.find((x) => x.id === req.params.key);
	if (!p) return res.status(404).json({ error: "Тариф не найден" });
	if (req.body?.price !== undefined) p.price = Number(req.body.price);
	if (req.body?.name !== undefined) p.name = req.body.name;
	if (req.body?.isActive !== undefined) p.isActive = !!req.body.isActive;
	db.prepare(
		"INSERT INTO payment_settings (key,value) VALUES ('plans',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
	).run(JSON.stringify(plans));
	log(req.admin.name, "Изменение тарифа", p.name, `price=${p.price}`, req.ip);
	res.json({ ok: true });
});
router.put("/payment/delivery/:id", (req, res) => {
	const z = db
		.prepare("SELECT * FROM delivery_zones WHERE id=?")
		.get(req.params.id);
	if (!z) return res.status(404).json({ error: "Зона не найдена" });
	db.prepare("UPDATE delivery_zones SET price=? WHERE id=?").run(
		Number(req.body?.price ?? z.price),
		z.id,
	);
	log(
		req.admin.name,
		"Изменение цены доставки",
		z.zone,
		`price=${req.body?.price}`,
		req.ip,
	);
	res.json({ ok: true });
});

// ---------- Settings (admins / backups) ----------
router.get("/settings", (_req, res) => {
	const admins = db
		.prepare("SELECT * FROM admins")
		.all()
		.map((a) => ({
			id: a.id,
			name: a.name,
			email: a.email,
			role: a.role,
			createdAt: fmtDate(a.created_at),
			lastActive: fmtDateTime(a.last_login_at),
			isActive: true,
		}));
	res.json({ admins, backups: [] });
});
router.post("/settings/admins", (req, res) => {
	const { name, email, password, role } = req.body || {};
	if (!email || !password)
		return res.status(400).json({ error: "Email и пароль обязательны" });
	try {
		db.prepare(
			"INSERT INTO admins (id,email,password,name,role) VALUES (?,?,?,?,?)",
		).run(
			uid(),
			email,
			bcrypt.hashSync(password, 8),
			name || email,
			role || "admin",
		);
	} catch {
		return res
			.status(409)
			.json({ error: "Админ с таким email уже существует" });
	}
	log(req.admin.name, "Создание админа", email, "", req.ip);
	res.json({ ok: true });
});
router.delete("/settings/admins/:id", (req, res) => {
	db.prepare("DELETE FROM admins WHERE id=?").run(req.params.id);
	log(req.admin.name, "Удаление админа", req.params.id, "", req.ip);
	res.json({ ok: true });
});

export default router;
