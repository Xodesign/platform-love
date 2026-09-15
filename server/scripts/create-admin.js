// Создаёт администратора или обновляет его пароль.
// Безопасен для боевой БД: работает только с таблицей admins, не трогает users.
//
// Использование:
//   node scripts/create-admin.js <email> <пароль> [имя]
// Путь к БД задаётся переменной DATABASE_PATH (иначе — локальный database.sqlite).
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import db from "../src/db/database.js";

const [email, password, name = "Администратор"] = process.argv.slice(2);

if (!email || !email.includes("@")) {
	console.error(
		"Укажи email: node scripts/create-admin.js admin@example.ru <пароль> [имя]",
	);
	process.exit(1);
}
if (!password || password.length < 8) {
	console.error("Пароль обязателен и должен быть не короче 8 символов.");
	process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
const existing = db.prepare("SELECT id FROM admins WHERE email = ?").get(email);

if (existing) {
	db.prepare(
		"UPDATE admins SET password = ?, name = COALESCE(?, name) WHERE id = ?",
	).run(hash, name, existing.id);
	console.log(`✔ Пароль администратора ${email} обновлён (id=${existing.id})`);
} else {
	const id = randomUUID();
	db.prepare(
		`INSERT INTO admins (id, email, password, name, role, created_at)
		 VALUES (?,?,?,?,?,?)`,
	).run(id, email, hash, name, "owner", new Date().toISOString());
	console.log(`✔ Администратор ${email} создан (id=${id}, роль owner)`);
}

console.log(
	`   админов в базе теперь: ${db.prepare("SELECT count(*) c FROM admins").get().c}`,
);
