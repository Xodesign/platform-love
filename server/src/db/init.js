import db from "./database.js";

console.log("🔧 Инициализация базы данных...\n");

// Безопасное добавление колонки (если её ещё нет)
function safeAddColumn(table, column, definition) {
	try {
		db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
		console.log(`   ✅ Колонка ${column} добавлена`);
	} catch (e) {
		// Колонка уже существует - игнорируем
	}
}

// Пользователи
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    login TEXT,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    password TEXT,
    name TEXT NOT NULL,
    age INTEGER,
    bio TEXT,
    gender TEXT,
    looking_for TEXT,
    location TEXT,
    photos TEXT DEFAULT '[]',
    settings TEXT DEFAULT '{}',
    is_premium INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Добавляем колонки если их ещё нет
safeAddColumn("users", "login", "TEXT");
safeAddColumn("users", "pin_code", "TEXT");
safeAddColumn("users", "latitude", "REAL");
safeAddColumn("users", "longitude", "REAL");
safeAddColumn("users", "is_frozen", "INTEGER DEFAULT 0");

// Индекс для уникальности login
db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_login ON users(login);
`);

// Свайпы
db.exec(`
  CREATE TABLE IF NOT EXISTS swipes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    target_user_id TEXT NOT NULL,
    direction TEXT NOT NULL CHECK(direction IN ('like', 'dislike')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (target_user_id) REFERENCES users(id),
    UNIQUE(user_id, target_user_id)
  )
`);

// Мэтчи
db.exec(`
  CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    user1_id TEXT NOT NULL,
    user2_id TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id),
    FOREIGN KEY (user2_id) REFERENCES users(id),
    UNIQUE(user1_id, user2_id)
  )
`);

// Сообщения
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    match_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    text TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
  )
`);

// Подписки
db.exec(`
  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    plan TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    expires_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Индексы для производительности
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_swipes_user ON swipes(user_id);
  CREATE INDEX IF NOT EXISTS idx_matches_users ON matches(user1_id, user2_id);
  CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id);
`);

// Коды подтверждения нового email (привязка/смена почты в кабинете).
// SMS-верификация телефонов из этой схемы убрана 15.09: вход по СМС больше
// не используется, а verify-code позволял создавать аккаунты без email.

// Коды сброса пароля
db.exec(`
  CREATE TABLE IF NOT EXISTS password_reset_codes (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Коды смены email
db.exec(`
  CREATE TABLE IF NOT EXISTS email_change_codes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Ответы пользователя на вопросы анкеты
db.exec(`
  CREATE TABLE IF NOT EXISTS user_answers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    question_key TEXT NOT NULL,
    answer_value TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, question_key)
  )
`);

// Настройки поиска пользователя
db.exec(`
  CREATE TABLE IF NOT EXISTS search_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    min_age INTEGER DEFAULT 18,
    max_age INTEGER DEFAULT 60,
    max_distance INTEGER DEFAULT 100,
    looking_for TEXT DEFAULT 'female',
    filters TEXT DEFAULT '{}',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

console.log("✅ Таблицы созданы:");
console.log("   - users");
console.log("   - swipes");
console.log("   - matches");
console.log("   - messages");
console.log("   - subscriptions");
console.log("   - password_reset_codes");
console.log("   - email_change_codes");
console.log("   - user_answers");
console.log("   - search_settings\n");

console.log("✅ База данных готова!\n");
