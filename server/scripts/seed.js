// Сид демо-данных Platform Love. Идемпотентен: полностью пересоздаёт демо-набор.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import db from "../src/db/database.js";
import { migrate } from "../src/db/migrate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS = path.join(__dirname, "../uploads");

const uid = () => randomUUID();
const PASS = "demo1234";
const hash = bcrypt.hashSync(PASS, 8);
const ADMIN_PASS = "admin123";

function avatar(slug, name, from, to) {
	const initials = name
		.split(" ")
		.map((w) => w[0])
		.slice(0, 2)
		.join("");
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/>
  </linearGradient></defs>
  <rect width="400" height="400" fill="url(#g)"/>
  <text x="200" y="230" font-family="Arial, sans-serif" font-size="140" fill="#ffffff" text-anchor="middle" font-weight="bold">${initials}</text>
</svg>`;
	const file = `avatar-${slug}.svg`;
	fs.writeFileSync(path.join(UPLOADS, file), svg);
	return `/uploads/${file}`;
}

function wipe() {
	const tables = [
		"post_likes",
		"posts",
		"notifications",
		"blocked_users",
		"support_messages",
		"support_tickets",
		"complaints",
		"orders",
		"transactions",
		"admin_logs",
		"admins",
		"messages",
		"matches",
		"swipes",
		"subscriptions",
		"search_settings",
		"user_answers",
		"users",
		"delivery_zones",
	];
	db.exec("PRAGMA foreign_keys=OFF");
	for (const t of tables) db.exec(`DELETE FROM ${t}`);
	db.exec("DELETE FROM payment_settings");
	db.exec("PRAGMA foreign_keys=ON");
}

const PEOPLE = [
	{
		slug: "anna",
		name: "Анна Иванова",
		age: 26,
		gender: "female",
		looking: "male",
		city: "Москва",
		socio: "Есенин",
		bio: "Люблю кофе, книги и долгие прогулки по центру.",
		c: ["#f6a5c0", "#b06ab3"],
	},
	{
		slug: "maria",
		name: "Мария Петрова",
		age: 24,
		gender: "female",
		looking: "male",
		city: "Москва",
		socio: "Дюма",
		bio: "Фотограф. Ищу того, кто не боится камеры.",
		c: ["#fbc2eb", "#a6c1ee"],
	},
	{
		slug: "elena",
		name: "Елена Смирнова",
		age: 29,
		gender: "female",
		looking: "male",
		city: "Химки",
		socio: "Гексли",
		bio: "Йога, веган-кафе и путешествия автостопом.",
		c: ["#fdcbf1", "#e6dee9"],
	},
	{
		slug: "olga",
		name: "Ольга Волкова",
		age: 31,
		gender: "female",
		looking: "male",
		city: "Москва",
		socio: "Бальзак",
		bio: "Архитектор. Ценю тишину и хороший джаз.",
		c: ["#a1c4fd", "#c2e9fb"],
	},
	{
		slug: "sergey",
		name: "Сергей Козлов",
		age: 28,
		gender: "male",
		looking: "female",
		city: "Москва",
		socio: "Джек Лондон",
		bio: "Разработчик, бегаю по утрам, играю на гитаре.",
		c: ["#89f7fe", "#66a6ff"],
	},
	{
		slug: "dmitry",
		name: "Дмитрий Орлов",
		age: 33,
		gender: "male",
		looking: "female",
		city: "Мытищи",
		socio: "Штирлиц",
		bio: "Предприниматель. Люблю горы и сноуборд.",
		c: ["#4facfe", "#00f2fe"],
	},
	{
		slug: "ivan",
		name: "Иван Соколов",
		age: 27,
		gender: "male",
		looking: "female",
		city: "Москва",
		socio: "Габен",
		bio: "Инженер. Собираю велосипеды и винил.",
		c: ["#43e97b", "#38f9d7"],
	},
	{
		slug: "pavel",
		name: "Павел Морозов",
		age: 35,
		gender: "male",
		looking: "female",
		city: "Королёв",
		socio: "Жуков",
		bio: "Врач. Верю в честность и чувство юмора.",
		c: ["#fa709a", "#fee140"],
	},
	{
		slug: "katya",
		name: "Екатерина Лебедева",
		age: 25,
		gender: "female",
		looking: "male",
		city: "Москва",
		socio: "Робеспьер",
		bio: "Дизайнер интерьеров. Обожаю рынки и антиквариат.",
		c: ["#f093fb", "#f5576c"],
	},
	{
		slug: "andrey",
		name: "Андрей Новиков",
		age: 30,
		gender: "male",
		looking: "female",
		city: "Балашиха",
		socio: "Максим",
		bio: "Маркетолог. Настолки, квизы и крафтовое пиво.",
		c: ["#5ee7df", "#b490ca"],
	},
];

const COORDS = {
	Москва: [55.75, 37.62],
	Химки: [55.89, 37.43],
	Мытищи: [55.91, 37.73],
	Королёв: [55.92, 37.85],
	Балашиха: [55.81, 37.96],
};

function seed() {
	migrate();
	wipe();
	fs.mkdirSync(UPLOADS, { recursive: true });

	const users = PEOPLE.map((p, i) => {
		const id = uid();
		const photo = avatar(p.slug, p.name, p.c[0], p.c[1]);
		const [lat, lon] = COORDS[p.city] || [55.75, 37.62];
		db.prepare(
			`INSERT INTO users (id, login, email, phone, password, name, age, bio, gender, looking_for, location, photos, settings, is_premium, approved, is_admin, status, sociotype, last_seen, created_at, latitude, longitude, is_frozen)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
		).run(
			id,
			p.slug,
			`${p.slug}@demo.love`,
			`+7 9${10 + i} 000-0${i}-0${i}`,
			hash,
			p.name,
			p.age,
			p.bio,
			p.gender,
			p.looking,
			p.city,
			JSON.stringify([photo]),
			"{}",
			i % 3 === 0 ? 1 : 0,
			p.slug === "sergey" ? 0 : 1, // один профиль ждёт модерации
			0,
			"active",
			p.socio,
			new Date(Date.now() - i * 3600e3).toISOString(),
			new Date(Date.now() - (30 - i) * 86400e3).toISOString(),
			lat,
			lon,
			0,
		);
		db.prepare(
			`INSERT INTO search_settings (id, user_id, min_age, max_age, max_distance, looking_for) VALUES (?,?,?,?,?,?)`,
		).run(uid(), id, 20, 40, 50, p.looking);
		return { ...p, id, photo };
	});

	const by = (slug) => users.find((u) => u.slug === slug);

	// Ответы на вопросы фильтров
	const answers = [
		["smoking", "no"],
		["kids", "no"],
		["pets", "yes"],
	];
	for (const u of users) {
		for (const [q, a] of answers) {
			db.prepare(
				`INSERT INTO user_answers (id, user_id, question_key, answer_value) VALUES (?,?,?,?)`,
			).run(uid(), u.id, q, a);
		}
	}

	// Свайпы + мэтчи + сообщения
	const pairs = [
		["sergey", "anna"],
		["dmitry", "maria"],
		["ivan", "elena"],
		["pavel", "olga"],
		["andrey", "katya"],
	];
	const matches = [];
	for (const [a, b] of pairs) {
		const ua = by(a);
		const ub = by(b);
		db.prepare(
			`INSERT INTO swipes (id, user_id, target_user_id, direction) VALUES (?,?,?,?)`,
		).run(uid(), ua.id, ub.id, "like");
		db.prepare(
			`INSERT INTO swipes (id, user_id, target_user_id, direction) VALUES (?,?,?,?)`,
		).run(uid(), ub.id, ua.id, "like");
		const mid = uid();
		db.prepare(
			`INSERT INTO matches (id, user1_id, user2_id) VALUES (?,?,?)`,
		).run(mid, ua.id, ub.id);
		matches.push({ id: mid, a: ua, b: ub });
	}
	// Односторонние лайки (входящие для anna/sergey)
	db.prepare(
		`INSERT INTO swipes (id,user_id,target_user_id,direction) VALUES (?,?,?,?)`,
	).run(uid(), by("ivan").id, by("anna").id, "like");
	db.prepare(
		`INSERT INTO swipes (id,user_id,target_user_id,direction) VALUES (?,?,?,?)`,
	).run(uid(), by("pavel").id, by("anna").id, "like");
	db.prepare(
		`INSERT INTO swipes (id,user_id,target_user_id,direction) VALUES (?,?,?,?)`,
	).run(uid(), by("katya").id, by("sergey").id, "like");

	// Сообщения в мэтчах
	const convo = [
		[
			"Привет! Как твои выходные?",
			"Привет! Отлично, ездили за город. А у тебя?",
		],
		[
			"Увидел твой профиль и не смог пройти мимо 😊",
			"Спасибо! Взаимно, у тебя классные фото.",
		],
	];
	for (const m of matches) {
		convo.forEach(([t1, t2], i) => {
			db.prepare(
				`INSERT INTO messages (id, match_id, sender_id, text, is_read) VALUES (?,?,?,?,?)`,
			).run(uid(), m.id, m.a.id, t1, 1);
			db.prepare(
				`INSERT INTO messages (id, match_id, sender_id, text, is_read) VALUES (?,?,?,?,?)`,
			).run(uid(), m.id, m.b.id, t2, i === convo.length - 1 ? 0 : 1);
		});
	}

	// Подписки
	for (const slug of ["anna", "dmitry", "olga"]) {
		db.prepare(
			`INSERT INTO subscriptions (id, user_id, plan, status, expires_at) VALUES (?,?,?,?,?)`,
		).run(
			uid(),
			by(slug).id,
			slug === "dmitry" ? "premium_plus" : "premium",
			"active",
			new Date(Date.now() + 30 * 86400e3).toISOString(),
		);
	}

	// Уведомления
	for (const u of users.slice(0, 4)) {
		db.prepare(
			`INSERT INTO notifications (id, user_id, type, text, is_read) VALUES (?,?,?,?,?)`,
		).run(uid(), u.id, "like", "Вам поставили лайк ❤️", 0);
		db.prepare(
			`INSERT INTO notifications (id, user_id, type, text, is_read) VALUES (?,?,?,?,?)`,
		).run(uid(), u.id, "match", "У вас новый мэтч! Начните общение.", 0);
	}

	// Посты (стена/лента)
	const posts = [
		["anna", "Утро начинается не с кофе, а с пробежки по набережной 🏃‍♀️"],
		[
			"sergey",
			"Собрал новую полку для винила. Осталось найти время послушать.",
		],
		[
			"maria",
			"Съёмка на закате — лучшее, что случалось со мной на этой неделе.",
		],
		["dmitry", "Горы зовут. Кто со мной в феврале?"],
	];
	for (const [slug, text] of posts) {
		const pid = uid();
		db.prepare(`INSERT INTO posts (id, user_id, text) VALUES (?,?,?)`).run(
			pid,
			by(slug).id,
			text,
		);
		db.prepare(
			`INSERT INTO post_likes (id, post_id, user_id) VALUES (?,?,?)`,
		).run(uid(), pid, by("anna").id);
	}

	// Чёрный список пользователя anna
	db.prepare(
		`INSERT INTO blocked_users (id, owner_id, blocked_id, reason) VALUES (?,?,?,?)`,
	).run(uid(), by("anna").id, by("pavel").id, "Спам");

	// --- Админ-домен ---
	db.prepare(
		`INSERT INTO admins (id, email, password, name, role) VALUES (?,?,?,?,?)`,
	).run(
		uid(),
		"admin@platformlove.ru",
		bcrypt.hashSync(ADMIN_PASS, 8),
		"Главный админ",
		"owner",
	);

	const orders = [
		[
			"Анна Иванова",
			by("anna").id,
			"Мария Петрова",
			"Розы и пионы",
			5000,
			"new",
			"13.09.2026",
			"14:30",
			"ул. Ленина, 15",
			"+7 999 123-45-67",
			"Карта",
			1,
		],
		[
			"Сергей Козлов",
			by("sergey").id,
			"Елена Смирнова",
			"Орхидеи",
			8500,
			"in_progress",
			"13.09.2026",
			"11:15",
			"ул. Пушкина, 22",
			"+7 999 234-56-78",
			"СБП",
			1,
		],
		[
			"Дмитрий Орлов",
			by("dmitry").id,
			"Ольга Волкова",
			"Тюльпаны",
			3200,
			"rejected",
			"12.09.2026",
			"16:45",
			"ул. Чехова, 8",
			"+7 999 345-67-89",
			"Карта",
			0,
		],
		[
			"Иван Соколов",
			by("ivan").id,
			"Анна Иванова",
			"Пионы",
			4200,
			"delivered",
			"11.09.2026",
			"10:00",
			"ул. Гагарина, 3",
			"+7 999 456-78-90",
			"ЮKassa",
			1,
		],
	];
	for (const o of orders) {
		db.prepare(
			`INSERT INTO orders (id, customer, customer_id, recipient, bouquet, budget, status, date, time, delivery_address, phone, payment_method, is_paid) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
		).run(uid(), ...o);
	}

	const complaints = [
		[
			"Сергей Козлов",
			"Анна Иванова",
			"Грубое поведение в чате",
			"12.09.2026",
			"new",
		],
		[
			"Павел Морозов",
			"Елена Смирнова",
			"Подозрение на фейковый профиль",
			"11.09.2026",
			"in_review",
		],
		[
			"Иван Соколов",
			"Дмитрий Орлов",
			"Спам и реклама",
			"10.09.2026",
			"resolved",
		],
	];
	for (const c of complaints) {
		db.prepare(
			`INSERT INTO complaints (id, reported_user, complainant, reason, date, status) VALUES (?,?,?,?,?,?)`,
		).run(uid(), ...c);
	}

	const tickets = [
		[
			"Анна Иванова",
			by("anna").id,
			"Не приходит код подтверждения",
			"open",
			"Здравствуйте! Не могу войти, код не приходит.",
		],
		[
			"Дмитрий Орлов",
			by("dmitry").id,
			"Вопрос по подписке Premium+",
			"answered",
			"Хочу уточнить, входит ли доставка в Premium+?",
		],
		[
			"Мария Петрова",
			by("maria").id,
			"Как удалить аккаунт?",
			"closed",
			"Подскажите, как полностью удалить профиль?",
		],
	];
	for (const t of tickets) {
		const tid = uid();
		db.prepare(
			`INSERT INTO support_tickets (id, user_name, user_id, subject, status) VALUES (?,?,?,?,?)`,
		).run(tid, t[0], t[1], t[2], t[3]);
		db.prepare(
			`INSERT INTO support_messages (id, ticket_id, sender, text) VALUES (?,?,?,?)`,
		).run(uid(), tid, "user", t[4]);
		if (t[3] !== "open") {
			db.prepare(
				`INSERT INTO support_messages (id, ticket_id, sender, text) VALUES (?,?,?,?)`,
			).run(
				uid(),
				tid,
				"admin",
				"Спасибо за обращение! Мы уже разбираемся с вашим вопросом.",
			);
		}
	}

	const logs = [
		[
			"Главный админ",
			"Вход в систему",
			"—",
			"Успешная авторизация",
			"13.09.2026 09:12",
			"192.168.0.10",
		],
		[
			"Главный админ",
			"Одобрение анкеты",
			"Елена Смирнова",
			"Профиль прошёл модерацию",
			"12.09.2026 18:40",
			"192.168.0.10",
		],
		[
			"Главный админ",
			"Блокировка",
			"Павел Морозов",
			"Заблокирован на 7 дней",
			"12.09.2026 15:02",
			"192.168.0.10",
		],
	];
	for (const l of logs) {
		db.prepare(
			`INSERT INTO admin_logs (id, admin, action, target, details, timestamp, ip) VALUES (?,?,?,?,?,?,?)`,
		).run(uid(), ...l);
	}

	// Тарифы / зоны / способы оплаты / транзакции
	const set = (k, v) =>
		db
			.prepare(`INSERT INTO payment_settings (key, value) VALUES (?,?)`)
			.run(k, JSON.stringify(v));
	set("plans", [
		{
			id: "basic",
			name: "Basic",
			price: 0,
			period: "мес",
			features: ["10 лайков в день", "Базовые фильтры"],
		},
		{
			id: "premium",
			name: "Premium",
			price: 399,
			period: "мес",
			features: ["Безлимит лайков", "Кто лайкнул вас", "Расширенные фильтры"],
		},
		{
			id: "premium_plus",
			name: "Premium+",
			price: 699,
			period: "мес",
			features: [
				"Всё из Premium",
				"Приоритет в выдаче",
				"1 доставка цветов в месяц",
			],
		},
		{
			id: "love_bundle",
			name: "Love Bundle",
			price: 1499,
			period: "мес",
			features: [
				"Всё из Premium+",
				"Персональный подбор",
				"3 доставки в месяц",
			],
		},
	]);
	set("payment_methods", ["Банковская карта", "СБП", "ЮKassa", "SberPay"]);
	for (const z of [
		["Центр", 350, "1–2 часа"],
		["Внутри МКАД", 500, "2–4 часа"],
		["Область", 900, "4–8 часов"],
	]) {
		db.prepare(
			`INSERT INTO delivery_zones (id, zone, price, eta) VALUES (?,?,?,?)`,
		).run(uid(), ...z);
	}
	for (const t of [
		["Анна Иванова", 399, "Карта", "subscription", "success"],
		["Дмитрий Орлов", 699, "СБП", "subscription", "success"],
		["Ольга Волкова", 399, "ЮKassa", "subscription", "success"],
		["Сергей Козлов", 5000, "Карта", "order", "success"],
	]) {
		db.prepare(
			`INSERT INTO transactions (id, user_name, amount, method, type, status) VALUES (?,?,?,?,?,?)`,
		).run(uid(), ...t);
	}

	console.log(
		`✔ seed: users=${users.length} matches=${matches.length} orders=${orders.length}`,
	);
}

seed();
