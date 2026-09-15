const API_URL = "/api";

class ApiService {
	// Токены намеренно не кэшируются в полях: вход/выход меняют localStorage
	// без перезагрузки SPA, и любое чтение устаревшего поля отправляло бы
	// запросы анонимно. Единственный источник истины — геттеры ниже.
	get authToken() {
		return localStorage.getItem("token");
	}

	get authAdminToken() {
		return localStorage.getItem("admin_token");
	}

	setToken(token) {
		if (token) {
			localStorage.setItem("token", token);
		} else {
			localStorage.removeItem("token");
		}
	}

	async request(endpoint, options = {}) {
		const headers = {
			"Content-Type": "application/json",
			...options.headers,
		};

		const token = this.authToken;
		if (token) {
			headers["Authorization"] = `Bearer ${token}`;
		}

		const response = await fetch(`${API_URL}${endpoint}`, {
			...options,
			headers,
		});

		const data = await response.json();

		if (!response.ok) {
			const error = new Error(data.error || "Произошла ошибка");
			error.status = response.status;
			error.code = data.code || null;
			// 428 — не сломанная сессия, а «нужен второй фактор». Сообщаем приложению:
			// оно уводит пользователя на экран PIN и после подтверждения повторяет
			// запрос уже с новым токеном. Без этого любой ответ сервера выглядел бы
			// как «что-то пошло не так».
			if (response.status === 428) {
				window.dispatchEvent(new CustomEvent("pin-required"));
			}
			throw error;
		}

		return data;
	}

	// ---- PIN как второй фактор ----

	// Подтвердить доступ существующим PIN (после 428), ничего не меняя
	async verifyPin(pin) {
		const data = await this.request("/auth/verify-pin", {
			method: "POST",
			body: JSON.stringify({ pin }),
		});
		if (data.token) this.setToken(data.token);
		return data;
	}

	// Установить новый PIN или сменить существующий (тогда нужен oldPin)
	async setPin(pin, oldPin) {
		const data = await this.request("/auth/set-pin", {
			method: "POST",
			body: JSON.stringify({ pin, oldPin }),
		});
		// Сервер отдаёт токен с подтверждённым PIN: с ним защищённые эндпоинты
		// открываются сразу, без перелогина
		if (data.token) this.setToken(data.token);
		return data;
	}

	async changePassword(currentPassword, newPassword) {
		return this.request("/auth/change-password", {
			method: "POST",
			body: JSON.stringify({ currentPassword, newPassword }),
		});
	}

	// Auth
	async register(userData) {
		const data = await this.request("/auth/register", {
			method: "POST",
			body: JSON.stringify(userData),
		});
		this.setToken(data.token);
		return data;
	}

	async login(loginIdentifier, password) {
		// loginIdentifier может быть логином или email — backend поддерживает оба
		const data = await this.request("/auth/login", {
			method: "POST",
			body: JSON.stringify({ login: loginIdentifier, password }),
		});
		this.setToken(data.token);
		return data;
	}

	async getMe() {
		return this.request("/auth/me");
	}

	// ---- Admin ----
	setAdminToken(token) {
		if (token) localStorage.setItem("admin_token", token);
		else localStorage.removeItem("admin_token");
	}

	async adminRequest(endpoint, options = {}) {
		const headers = { "Content-Type": "application/json", ...options.headers };
		const adminToken = this.authAdminToken;
		if (adminToken) headers["Authorization"] = `Bearer ${adminToken}`;
		const response = await fetch(`${API_URL}/admin${endpoint}`, {
			...options,
			headers,
		});
		const data = await response.json();
		if (!response.ok) throw new Error(data.error || "Произошла ошибка");
		return data;
	}

	async adminLogin(email, password) {
		const data = await this.adminRequest("/login", {
			method: "POST",
			body: JSON.stringify({ email, password }),
		});
		this.setAdminToken(data.token);
		return data;
	}

	// Проверка живой сессии админа — нужно для guards, токен из localStorage
	// сам по себе ничего не доказывает.
	adminMe() {
		return this.adminRequest("/me");
	}

	adminLogout() {
		this.setAdminToken(null);
	}

	adminStats() {
		return this.adminRequest("/stats");
	}
	adminUsers() {
		return this.adminRequest("/users");
	}
	adminUser(id) {
		return this.adminRequest(`/users/${id}`);
	}
	adminUpdateUser(id, data) {
		return this.adminRequest(`/users/${id}`, {
			method: "PUT",
			body: JSON.stringify(data),
		});
	}
	adminDeleteUser(id) {
		return this.adminRequest(`/users/${id}`, { method: "DELETE" });
	}
	adminModeration() {
		return this.adminRequest("/moderation");
	}
	adminModerate(id, approve) {
		return this.adminRequest(`/moderation/${id}`, {
			method: "PUT",
			body: JSON.stringify({ approve }),
		});
	}
	adminBlacklist() {
		return this.adminRequest("/blacklist");
	}
	adminBlock(payload) {
		return this.adminRequest("/blacklist", {
			method: "POST",
			body: JSON.stringify(payload),
		});
	}
	adminUnblock(id) {
		return this.adminRequest(`/blacklist/${id}`, { method: "DELETE" });
	}
	adminOrders() {
		return this.adminRequest("/orders");
	}
	adminOrder(id) {
		return this.adminRequest(`/orders/${id}`);
	}
	adminUpdateOrder(id, status) {
		return this.adminRequest(`/orders/${id}`, {
			method: "PUT",
			body: JSON.stringify({ status }),
		});
	}
	adminComplaints() {
		return this.adminRequest("/complaints");
	}
	adminUpdateComplaint(id, status) {
		return this.adminRequest(`/complaints/${id}`, {
			method: "PUT",
			body: JSON.stringify({ status }),
		});
	}
	adminSupport() {
		return this.adminRequest("/support");
	}
	adminSupportMessages(id) {
		return this.adminRequest(`/support/${id}`);
	}
	adminSendSupport(id, text) {
		return this.adminRequest(`/support/${id}/messages`, {
			method: "POST",
			body: JSON.stringify({ text }),
		});
	}
	adminLogs() {
		return this.adminRequest("/logs");
	}
	adminPayment() {
		return this.adminRequest("/payment");
	}
	adminUpdatePlan(key, data) {
		return this.adminRequest(`/payment/subscriptions/${key}`, {
			method: "PUT",
			body: JSON.stringify(data),
		});
	}
	adminUpdateDelivery(id, price) {
		return this.adminRequest(`/payment/delivery/${id}`, {
			method: "PUT",
			body: JSON.stringify({ price }),
		});
	}
	adminSettings() {
		return this.adminRequest("/settings");
	}
	adminAddAdmin(data) {
		return this.adminRequest("/settings/admins", {
			method: "POST",
			body: JSON.stringify(data),
		});
	}
	adminDeleteAdmin(id) {
		return this.adminRequest(`/settings/admins/${id}`, { method: "DELETE" });
	}

	// ---- Social ----
	incomingLikes() {
		return this.request("/likes/incoming");
	}
	getNotifications() {
		return this.request("/notifications");
	}
	markNotificationsRead() {
		return this.request("/notifications/read", { method: "POST" });
	}
	myBlacklist() {
		return this.request("/blacklist");
	}
	addToBlacklist(userId, reason) {
		return this.request("/blacklist", {
			method: "POST",
			body: JSON.stringify({ userId, reason }),
		});
	}
	removeFromBlacklist(userId) {
		return this.request(`/blacklist/${userId}`, { method: "DELETE" });
	}
	getPosts() {
		return this.request("/posts");
	}
	getMyPosts() {
		return this.request("/posts/mine");
	}
	createPost(text) {
		return this.request("/posts", {
			method: "POST",
			body: JSON.stringify({ text }),
		});
	}
	togglePostLike(id) {
		return this.request(`/posts/${id}/like`, { method: "POST" });
	}
	getPlans() {
		return this.request("/subscriptions/plans");
	}

	async logout() {
		try {
			await this.request("/auth/logout", { method: "POST" });
		} catch {
			// Игнорируем ошибку — токен всё равно удаляем локально
		}
		this.setToken(null);
	}

	// Users
	async getUser(userId) {
		return this.request(`/users/${userId}`);
	}

	async updateUser(userId, data) {
		return this.request(`/users/${userId}`, {
			method: "PUT",
			body: JSON.stringify(data),
		});
	}

	// Swipes
	// Ответы анкеты — серверный источник истины для совместимости
	getAnswers() {
		return this.request("/filters/answers");
	}

	saveAnswers(answers) {
		return this.request("/filters/answers", {
			method: "POST",
			body: JSON.stringify({ answers }),
		});
	}

	async getCandidates() {
		return this.request("/filters/candidates");
	}

	async swipe(targetUserId, direction) {
		return this.request("/swipes", {
			method: "POST",
			body: JSON.stringify({ target_user_id: targetUserId, direction }),
		});
	}

	async getSwipesHistory() {
		return this.request("/swipes/history");
	}

	// Matches
	async getMatches() {
		return this.request("/matches");
	}

	async getMatch(matchId) {
		return this.request(`/matches/${matchId}`);
	}

	async deleteMatch(matchId) {
		return this.request(`/matches/${matchId}`, { method: "DELETE" });
	}

	// Messages
	async getMessages(matchId) {
		return this.request(`/messages/match/${matchId}`);
	}

	async sendMessage(matchId, text) {
		return this.request("/messages", {
			method: "POST",
			body: JSON.stringify({ match_id: matchId, text }),
		});
	}

	async getUnreadCount() {
		return this.request("/messages/unread/count");
	}

	// Subscriptions
	async getSubscription() {
		return this.request("/subscriptions/current");
	}

	async subscribe(plan) {
		return this.request("/subscriptions", {
			method: "POST",
			body: JSON.stringify({ plan }),
		});
	}

	async cancelSubscription() {
		return this.request("/subscriptions/cancel", { method: "DELETE" });
	}

	// Photos
	async uploadPhoto(file) {
		const formData = new FormData();
		formData.append("photo", file);

		const response = await fetch(`${API_URL}/upload/photo`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${this.authToken}`,
			},
			body: formData,
		});

		const data = await response.json();
		if (!response.ok) {
			throw new Error(data.error || "Ошибка загрузки фото");
		}
		return data;
	}
}

export const api = new ApiService();
export default api;
