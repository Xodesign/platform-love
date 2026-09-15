import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Путь к БД берётся из DATABASE_PATH (для прода, репетиций и тестов),
// иначе — локальный файл разработки.
const dbPath =
	process.env.DATABASE_PATH || join(__dirname, "../../database.sqlite");

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

export default db;
