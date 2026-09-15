// Миграция: перевести существующие plaintext PIN в bcrypt-хеши.
// После этого endpoint POST /api/auth/login-pin начнёт сравнивать через bcrypt.compare.

import bcrypt from "bcryptjs";
import Database from "better-sqlite3";

const db = new Database("./database.sqlite");

// Берём всех пользователей с PIN
const rows = db
	.prepare("SELECT id, pin_code FROM users WHERE pin_code IS NOT NULL")
	.all();

// Определяем, какие из них уже хеши (bcrypt-хеши начинаются с $2a$, $2b$ или $2y$)
let updated = 0;
let skipped = 0;
for (const row of rows) {
	const isHashed = /^\$2[aby]\$/.test(row.pin_code);
	if (isHashed) {
		skipped++;
		continue;
	}
	// Plaintext PIN — хешируем и сохраняем
	const hashed = await bcrypt.hash(row.pin_code, 10);
	db.prepare("UPDATE users SET pin_code = ? WHERE id = ?").run(hashed, row.id);
	updated++;
}

console.log(
	`Updated: ${updated}, Already hashed: ${skipped}, Total: ${rows.length}`,
);
db.close();
