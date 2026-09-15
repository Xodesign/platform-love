import "dotenv/config";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import multer from "multer";

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
import { authenticateToken } from "./middleware/auth.js";

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

// Настройка загрузки файлов
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, join(__dirname, "../uploads"));
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, uniqueSuffix + "-" + file.originalname);
	},
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

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
app.post(
	"/api/upload/photo",
	authenticateToken,
	upload.single("photo"),
	(req, res) => {
		if (!req.file) {
			return res.status(400).json({ error: "Файл не загружен" });
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

// Статика для загруженных файлов
app.use("/uploads", express.static(join(__dirname, "../uploads")));

// Health check
app.get("/api/health", (req, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({ error: "Endpoint не найден" });
});

// Error handler
app.use((err, req, res, next) => {
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
