import "dotenv/config";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import multer from "multer";
import fs from "node:fs";

// Роуты
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import swipesRoutes from "./routes/swipes.js";
import matchesRoutes from "./routes/matches.js";
import messagesRoutes from "./routes/messages.js";
import subscriptionsRoutes from "./routes/subscriptions.js";
import filtersRoutes from "./routes/filters.js";
import adminRoutes from "./routes/admin.js";
import socialRoutes from "./routes/social.js";
import db from "./db/database.js";
import { authenticateToken, requirePin } from "./middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
	cors({
		origin: [
			"http://localhost:5173",
			"http://localhost:5175",
			"http://localhost:4173",
			"exp://localhost:19000",
		],
		credentials: true,
	}),
);
app.use(express.json());

// Разрешены только картинки. Иначе можно залить .html/.svg с JS —
// express.static отдаст его как text/html с того же origin, что даст
// stored XSS и доступ к токенам из localStorage.
const ALLOWED_MIME = new Set([
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/gif",
]);

// Магические байты — двойная проверка: Content-Type подделать легко,
// а переименованный в .png HTML так и останется HTML по содержимому.
const MAGIC = {
	"image/jpeg": Buffer.from([0xff, 0xd8, 0xff]),
	"image/png": Buffer.from([0x89, 0x50, 0x4e, 0x47]),
	"image/gif": Buffer.from("GIF87a"),
	"image/webp": Buffer.from("RIFF"),
};

const fileFilter = (_req, file, cb) => {
	if (!ALLOWED_MIME.has(file.mimetype)) {
		const err = new Error("ONLY_IMAGES_ALLOWED");
		err.code = "ONLY_IMAGES_ALLOWED";
		return cb(err);
	}
	cb(null, true);
};

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		cb(null, join(__dirname, "../uploads"));
	},
	filename: (_req, file, cb) => {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		// Берём только имя файла, без каталогов и без расширения: расширение
		// выставим по настоящему типу из магических байтов, а не из поля клиента.
		const base =
			(file.originalname || "photo")
				.replace(/.*[\\/]/, "")
				.replace(/\.[^.]+$/, "")
				.replace(/[^A-Za-z0-9_-]+/g, "-")
				.slice(0, 40) || "photo";
		const extByMime = {
			"image/jpeg": "jpg",
			"image/png": "png",
			"image/webp": "webp",
			"image/gif": "gif",
		}[file.mimetype];
		cb(null, `${uniqueSuffix}-${base}.${extByMime}`);
	},
});
const upload = multer({
	storage,
	fileFilter,
	limits: { fileSize: 5 * 1024 * 1024 },
}); // 5MB

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/swipes", swipesRoutes);
app.use("/api/matches", matchesRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);
app.use("/api/filters", filtersRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", socialRoutes);

// Загрузка фото профиля (с привязкой к пользователю)
// requirePin — как и у остальных мутирующих эндпоинтов: иначе парольный
// токен (без подтверждённого PIN) обходил бы PIN-гейт через загрузку фото.
app.post(
	"/api/upload/photo",
	authenticateToken,
	requirePin,
	upload.single("photo"),
	(req, res) => {
		if (!req.file) {
			return res.status(400).json({ error: "Файл не загружен" });
		}

		// Поверка по сигнатуре: если байты не совпадают с заявленным типом —
		// файл не картинка, отклоняем и не сохраняем.
		const buf = Buffer.alloc(12);
		const fh = fs.openSync(req.file.path, "r");
		fs.readSync(fh, buf, 0, 12, 0);
		fs.closeSync(fh);
		const sig = MAGIC[req.file.mimetype];
		if (
			!sig ||
			buf.subarray(0, sig.length).toString("latin1") !== sig.toString("latin1")
		) {
			fs.unlinkSync(req.file.path);
			return res.status(400).json({ error: "Файл не является изображением" });
		}

		const userId = req.user.id;
		const photoUrl = `/uploads/${req.file.filename}`;

		try {
			// Достаём текущие фото и добавляем новое
			const user = db
				.prepare("SELECT photos FROM users WHERE id = ?")
				.get(userId);
			const currentPhotos = JSON.parse(user?.photos || "[]");
			const updatedPhotos = [...currentPhotos, photoUrl];

			db.prepare(
				"UPDATE users SET photos = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
			).run(JSON.stringify(updatedPhotos), userId);

			res.json({
				url: photoUrl,
				filename: req.file.filename,
				photos: updatedPhotos,
			});
		} catch (error) {
			console.error("Photo upload save error:", error);
			res.status(500).json({ error: "Ошибка сохранения фото" });
		}
	},
);

// Статика для загруженных файлов. nosniff + явный тип по расширению —
// даже если сюда каким-то образом попадёт не-картинка, браузер не выполнит
// её как HTML/JS (защита в глубину к уже отсечённой на загрузке проверке).
app.use(
	"/uploads",
	express.static(join(__dirname, "../uploads"), {
		setHeaders: (res) => {
			res.setHeader("X-Content-Type-Options", "nosniff");
			res.setHeader("Content-Security-Policy", "default-src 'none'");
		},
	}),
);

// Health check
app.get("/api/health", (_req, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
	res.status(404).json({ error: "Endpoint не найден" });
});

// Error handler
app.use((err, _req, res, _next) => {
	if (err && err.code === "ONLY_IMAGES_ALLOWED") {
		return res
			.status(400)
			.json({
				error: "Можно загружать только изображения (jpg, png, webp, gif)",
			});
	}
	if (err && err.code === "LIMIT_FILE_SIZE") {
		return res
			.status(400)
			.json({ error: "Файл слишком большой (максимум 5 МБ)" });
	}
	console.error("Server error:", err);
	res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

app.listen(PORT, () => {
	console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🚀 Platform Love API Server                           ║
║                                                          ║
║   Running on: http://localhost:${PORT}                     ║
║                                                          ║
║   Endpoints:                                             ║
║   • POST   /api/auth/register                            ║
║   • POST   /api/auth/login                               ║
║   • GET    /api/auth/me                                  ║
║   • GET    /api/users/:id                               ║
║   • PUT    /api/users/:id                               ║
║   • GET    /api/swipes/candidates                       ║
║   • POST   /api/swipes                                  ║
║   • GET    /api/matches                                 ║
║   • GET    /api/matches/:id                             ║
║   • GET    /api/messages/match/:matchId                 ║
║   • POST   /api/messages                                ║
║   • GET    /api/subscriptions/current                   ║
║   • POST   /api/subscriptions                           ║
║   • GET    /api/filters/candidates                       ║
║   • GET    /api/filters/settings                        ║
║   • PUT    /api/filters/settings                        ║
║   • GET    /api/filters/answers                        ║
║   • POST   /api/filters/answers                        ║
║   • GET    /api/health                                   ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});
