// Идемпотентная миграция: добавляет таблицы и колонки, нужные админке и соц. функциям.
import db from "./database.js";

function hasColumn(table, column) {
	const cols = db.prepare(`PRAGMA table_info(${table})`).all();
	return cols.some((c) => c.name === column);
}

function hasTable(name) {
	return !!db
		.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
		.get(name);
}

export function migrate() {
	// --- Колонки users ---
	const userCols = {
		approved: "INTEGER DEFAULT 1",
		is_admin: "INTEGER DEFAULT 0",
		status: "TEXT DEFAULT 'active'",
		sociotype: "TEXT",
		last_seen: "TEXT",
		blocked_reason: "TEXT",
		blocked_until: "TEXT",
		latitude: "REAL",
		longitude: "REAL",
		is_frozen: "INTEGER DEFAULT 0",
	};
	for (const [col, def] of Object.entries(userCols)) {
		if (!hasColumn("users", col)) {
			db.exec(`ALTER TABLE users ADD COLUMN ${col} ${def}`);
		}
	}

	// --- Колонки users, нужные авторизации по PIN и восстановлению по почте ---
	// Раньше про них знал только init.js (он создаёт новую БД), а migrate.js
	// применялся к боевой — то есть на свежем восстановлении из старого бэкапа
	// регистрация падала бы на отсутствующих колонках.
	if (!hasColumn("users", "email")) {
		db.exec("ALTER TABLE users ADD COLUMN email TEXT");
		// UNIQUE в ALTER TABLE нельзя, но автоиндекс от CREATE TABLE здесь тоже
		// нет — завводим отдельный. NULL в уникальном индексе SQLite не
		// конфликтует, поэтому старые аккаунты без почты не мешают.
		db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)");
	}
	if (!hasColumn("users", "pin_code")) {
		db.exec("ALTER TABLE users ADD COLUMN pin_code TEXT");
	}

	// --- password_reset_codes (восстановление доступа по почте) ---
	if (!hasTable("password_reset_codes")) {
		db.exec(`CREATE TABLE password_reset_codes (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      attempts INTEGER DEFAULT 0,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
	}

	// --- email_change_codes (привязка/смена почты в кабинете) ---
	if (!hasTable("email_change_codes")) {
		db.exec(`CREATE TABLE email_change_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      attempts INTEGER DEFAULT 0,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
	}

	// --- verification_codes ---
	// Таблица SMS-верификации: вход по СМС убран из кода 15.09, поэтому для
	// новых баз она больше не создаётся. В существующих оставляем как есть —
	// дропать таблицу на проде нечем крыть, а места она не занимает.

	// --- admins ---
	if (!hasTable("admins")) {
		db.exec(`CREATE TABLE admins (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login_at TEXT
    )`);
	}

	// --- admin_logs ---
	if (!hasTable("admin_logs")) {
		db.exec(`CREATE TABLE admin_logs (
      id TEXT PRIMARY KEY,
      admin TEXT NOT NULL,
      action TEXT NOT NULL,
      target TEXT,
      details TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      ip TEXT
    )`);
	}

	// --- orders (доставка цветов/подарков) ---
	if (!hasTable("orders")) {
		db.exec(`CREATE TABLE orders (
      id TEXT PRIMARY KEY,
      customer TEXT NOT NULL,
      customer_id TEXT,
      recipient TEXT NOT NULL,
      bouquet TEXT NOT NULL,
      budget INTEGER NOT NULL,
      status TEXT DEFAULT 'new',
      date TEXT,
      time TEXT,
      delivery_address TEXT,
      phone TEXT,
      payment_method TEXT,
      is_paid INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
	}

	// --- complaints ---
	if (!hasTable("complaints")) {
		db.exec(`CREATE TABLE complaints (
      id TEXT PRIMARY KEY,
      reported_user TEXT NOT NULL,
      complainant TEXT NOT NULL,
      reason TEXT NOT NULL,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'new',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
	}

	// --- support tickets + messages ---
	if (!hasTable("support_tickets")) {
		db.exec(`CREATE TABLE support_tickets (
      id TEXT PRIMARY KEY,
      user_name TEXT NOT NULL,
      user_id TEXT,
      subject TEXT NOT NULL,
      status TEXT DEFAULT 'open',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
	}
	if (!hasTable("support_messages")) {
		db.exec(`CREATE TABLE support_messages (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES support_tickets(id)
    )`);
	}

	// --- blocked users (чёрный список пользователя) ---
	if (!hasTable("blocked_users")) {
		db.exec(`CREATE TABLE blocked_users (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      blocked_id TEXT NOT NULL,
      reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(owner_id, blocked_id)
    )`);
	}

	// --- notifications ---
	if (!hasTable("notifications")) {
		db.exec(`CREATE TABLE notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      text TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
	}

	// --- posts (стена / лента) ---
	if (!hasTable("posts")) {
		db.exec(`CREATE TABLE posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      text TEXT NOT NULL,
      image TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
	}
	if (!hasTable("post_likes")) {
		db.exec(`CREATE TABLE post_likes (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, user_id)
    )`);
	}

	// --- payment settings (тарифы, зоны доставки, способы оплаты) ---
	if (!hasTable("payment_settings")) {
		db.exec(`CREATE TABLE payment_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`);
	}

	// --- delivery zones ---
	if (!hasTable("delivery_zones")) {
		db.exec(`CREATE TABLE delivery_zones (
      id TEXT PRIMARY KEY,
      zone TEXT NOT NULL,
      price INTEGER NOT NULL,
      eta TEXT
    )`);
	}

	// --- transactions (история платежей) ---
	if (!hasTable("transactions")) {
		db.exec(`CREATE TABLE transactions (
      id TEXT PRIMARY KEY,
      user_name TEXT NOT NULL,
      amount INTEGER NOT NULL,
      method TEXT,
      type TEXT DEFAULT 'subscription',
      status TEXT DEFAULT 'success',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
	}

	console.log("✔ migrate: schema up-to-date");
}

if (import.meta.url === `file://${process.argv[1]}`) {
	migrate();
}
