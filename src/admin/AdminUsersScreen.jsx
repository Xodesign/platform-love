import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";

const initialUsers = [
	{
		id: 1,
		name: "Анна Иванова",
		email: "anna@mail.ru",
		phone: "+7 999 111-11-11",
		status: "active",
		sociotype: "Есенин",
		approved: true,
		isAdmin: false,
		isPremium: true,
		registrationDate: "15.01.2024",
		lastSeen: "26.06.2026 14:30",
		photos: 3,
		likesReceived: 42,
	},
	{
		id: 2,
		name: "Сергей Козлов",
		email: "sergey@mail.ru",
		phone: "+7 999 222-22-22",
		status: "pending",
		sociotype: "Джек Лондон",
		approved: false,
		isAdmin: false,
		isPremium: false,
		registrationDate: "20.06.2026",
		lastSeen: "26.06.2026 10:00",
		photos: 5,
		likesReceived: 0,
	},
	{
		id: 3,
		name: "Мария Петрова",
		email: "maria@mail.ru",
		phone: "+7 999 333-33-33",
		status: "blocked",
		sociotype: "Достоевский",
		approved: true,
		isAdmin: false,
		isPremium: false,
		registrationDate: "10.03.2024",
		lastSeen: "25.06.2026 18:00",
		photos: 4,
		likesReceived: 156,
	},
	{
		id: 4,
		name: "Администратор",
		email: "admin@platformlove.ru",
		phone: "+7 999 000-00-00",
		status: "active",
		sociotype: null,
		approved: true,
		isAdmin: true,
		isPremium: true,
		registrationDate: "01.01.2024",
		lastSeen: "26.06.2026 14:45",
		photos: 1,
		likesReceived: 0,
	},
	{
		id: 5,
		name: "Елена Смирнова",
		email: "elena@mail.ru",
		phone: "+7 999 444-44-44",
		status: "active",
		sociotype: "Дюма",
		approved: true,
		isAdmin: false,
		isPremium: true,
		registrationDate: "05.02.2024",
		lastSeen: "26.06.2026 12:00",
		photos: 6,
		likesReceived: 89,
	},
];

const statusLabels = {
	active: { label: "Активен", color: "#4CAF50", bg: "#E8F5E9" },
	pending: { label: "На проверке", color: "#F5C542", bg: "#FFF9E6" },
	blocked: { label: "Заблокирован", color: "#FF6B6B", bg: "#FFEBEB" },
};

export default function AdminUsersScreen() {
	const navigate = useNavigate();
	const [users, setUsers] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("");

	const load = useCallback(async () => {
		try {
			setUsers(await api.adminUsers());
		} catch {
			setUsers(initialUsers);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	// Фильтрация
	const filteredUsers = users.filter((user) => {
		const matchesSearch =
			user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.phone.includes(searchQuery) ||
			user.id.toString().includes(searchQuery);

		const matchesStatus = !statusFilter || user.status === statusFilter;

		return matchesSearch && matchesStatus;
	});

	// Статистика
	const stats = {
		total: users.length,
		active: users.filter((u) => u.status === "active").length,
		pending: users.filter((u) => u.status === "pending").length,
		blocked: users.filter((u) => u.status === "blocked").length,
		premium: users.filter((u) => u.isPremium).length,
	};

	const toggleBlock = async (id) => {
		const u = users.find((x) => x.id === id);
		const next = u?.status === "blocked" ? "active" : "blocked";
		if (next === "blocked")
			await api.adminBlock({
				userId: id,
				reason: "Заблокирован администратором",
			});
		else await api.adminUnblock(id);
		load();
	};

	const approveUser = async (id) => {
		await api.adminUpdateUser(id, { status: "active", approved: true });
		load();
	};

	const makeAdmin = async (id) => {
		if (window.confirm("Сделать этого пользователя администратором?")) {
			await api.adminUpdateUser(id, { isAdmin: true });
			load();
		}
	};

	const removeAdmin = async (id) => {
		if (window.confirm("Убрать права администратора?")) {
			await api.adminUpdateUser(id, { isAdmin: false });
			load();
		}
	};

	return (
		<div>
			{/* Header */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 24,
					flexWrap: "wrap",
					gap: 12,
				}}
			>
				<h3
					style={{ fontSize: 20, fontWeight: 600, color: "#1A1A1A", margin: 0 }}
				>
					Пользователи приложения
				</h3>
			</div>

			{/* Stats */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
					gap: 12,
					marginBottom: 24,
				}}
			>
				<div
					style={{
						backgroundColor: "white",
						borderRadius: 12,
						padding: 16,
						textAlign: "center",
						boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
					}}
				>
					<div style={{ fontSize: 28, fontWeight: 700, color: "#1A1A1A" }}>
						{stats.total}
					</div>
					<div style={{ fontSize: 12, color: "#8E8E8E" }}>Всего</div>
				</div>
				<div
					style={{
						backgroundColor: "#E8F5E9",
						borderRadius: 12,
						padding: 16,
						textAlign: "center",
					}}
				>
					<div style={{ fontSize: 28, fontWeight: 700, color: "#4CAF50" }}>
						{stats.active}
					</div>
					<div style={{ fontSize: 12, color: "#8E8E8E" }}>Активных</div>
				</div>
				<div
					style={{
						backgroundColor: "#FFF9E6",
						borderRadius: 12,
						padding: 16,
						textAlign: "center",
					}}
				>
					<div style={{ fontSize: 28, fontWeight: 700, color: "#F5C542" }}>
						{stats.pending}
					</div>
					<div style={{ fontSize: 12, color: "#8E8E8E" }}>На проверке</div>
				</div>
				<div
					style={{
						backgroundColor: "#FFEBEB",
						borderRadius: 12,
						padding: 16,
						textAlign: "center",
					}}
				>
					<div style={{ fontSize: 28, fontWeight: 700, color: "#FF6B6B" }}>
						{stats.blocked}
					</div>
					<div style={{ fontSize: 12, color: "#8E8E8E" }}>Заблокировано</div>
				</div>
				<div
					style={{
						backgroundColor: "#F3E8FF",
						borderRadius: 12,
						padding: 16,
						textAlign: "center",
					}}
				>
					<div style={{ fontSize: 28, fontWeight: 700, color: "#7B5EA7" }}>
						{stats.premium}
					</div>
					<div style={{ fontSize: 12, color: "#8E8E8E" }}>Premium</div>
				</div>
			</div>

			{/* Filters */}
			<div
				style={{
					backgroundColor: "white",
					borderRadius: 12,
					padding: 16,
					marginBottom: 16,
					boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
				}}
			>
				<div
					style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}
				>
					<div style={{ position: "relative" }}>
						<input
							type="text"
							placeholder="Поиск по имени, email, телефону или ID..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							style={{
								width: "100%",
								padding: "12px 16px 12px 44px",
								borderRadius: 10,
								border: "1px solid #E0E0E0",
								fontSize: 14,
								outline: "none",
								boxSizing: "border-box",
							}}
						/>
						<span
							style={{
								position: "absolute",
								left: 16,
								top: "50%",
								transform: "translateY(-50%)",
								fontSize: 18,
							}}
						>
							🔍
						</span>
					</div>
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						style={{
							padding: "12px 16px",
							borderRadius: 10,
							border: "1px solid #E0E0E0",
							fontSize: 14,
							outline: "none",
							backgroundColor: "white",
							minWidth: 150,
						}}
					>
						<option value="">Все статусы</option>
						<option value="active">🟢 Активные</option>
						<option value="pending">🟡 На проверке</option>
						<option value="blocked">🔴 Заблокированные</option>
					</select>
				</div>
			</div>

			{/* Desktop Table */}
			<div
				className="desktop-table"
				style={{
					backgroundColor: "white",
					borderRadius: 12,
					overflow: "hidden",
					boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
				}}
			>
				<table style={{ width: "100%", borderCollapse: "collapse" }}>
					<thead>
						<tr style={{ backgroundColor: "#F5F5F7" }}>
							<th style={thStyle}>ID</th>
							<th style={thStyle}>Пользователь</th>
							<th style={thStyle}>Контакты</th>
							<th style={thStyle}>Социотип</th>
							<th style={thStyle}>Статус</th>
							<th style={thStyle}>Регистрация</th>
							<th style={thStyle}>Действия</th>
						</tr>
					</thead>
					<tbody>
						{filteredUsers.map((user) => (
							<tr
								key={user.id}
								style={{ borderBottom: "1px solid #F0F0F0", cursor: "pointer" }}
								onClick={() => navigate(`/admin/users/${user.id}`)}
							>
								<td style={tdStyle}>#{user.id}</td>
								<td style={tdStyle}>
									<div
										style={{ display: "flex", alignItems: "center", gap: 12 }}
									>
										<div
											style={{
												width: 40,
												height: 40,
												borderRadius: "50%",
												backgroundColor: "#7B5EA7",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												color: "white",
												fontWeight: 600,
												position: "relative",
											}}
										>
											{user.name.charAt(0)}
											{user.isPremium && (
												<span
													style={{
														position: "absolute",
														bottom: -2,
														right: -2,
														width: 16,
														height: 16,
														borderRadius: "50%",
														backgroundColor: "#F5C542",
														fontSize: 10,
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
													}}
												>
													💎
												</span>
											)}
										</div>
										<div>
											<div style={{ fontWeight: 600 }}>
												{user.name}
												{user.isAdmin && (
													<span
														style={{
															marginLeft: 8,
															padding: "2px 6px",
															borderRadius: 4,
															backgroundColor: "#F3E8FF",
															color: "#7B5EA7",
															fontSize: 10,
															fontWeight: 500,
														}}
													>
														ADMIN
													</span>
												)}
											</div>
											<div style={{ fontSize: 11, color: "#8E8E8E" }}>
												❤️ {user.likesReceived} лайков
											</div>
										</div>
									</div>
								</td>
								<td style={tdStyle}>
									<div style={{ fontSize: 13 }}>{user.email}</div>
									<div style={{ fontSize: 11, color: "#8E8E8E" }}>
										{user.phone}
									</div>
								</td>
								<td style={tdStyle}>
									{user.sociotype ? (
										<span
											style={{
												padding: "4px 10px",
												borderRadius: 12,
												backgroundColor: user.approved ? "#E8F5E9" : "#FFF9E6",
												color: user.approved ? "#4CAF50" : "#F5C542",
												fontSize: 12,
											}}
										>
											{user.approved ? "✓ " : ""}
											{user.sociotype}
										</span>
									) : (
										<span style={{ color: "#8E8E8E", fontSize: 13 }}>—</span>
									)}
								</td>
								<td style={tdStyle}>
									<span
										style={{
											padding: "4px 10px",
											borderRadius: 12,
											fontSize: 12,
											fontWeight: 500,
											backgroundColor: statusLabels[user.status].bg,
											color: statusLabels[user.status].color,
										}}
									>
										{statusLabels[user.status].label}
									</span>
								</td>
								<td style={tdStyle}>
									<div style={{ fontSize: 13 }}>{user.registrationDate}</div>
									<div style={{ fontSize: 11, color: "#8E8E8E" }}>
										Был: {user.lastSeen}
									</div>
								</td>
								<td style={tdStyle}>
									<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
										{user.status === "pending" && (
											<button
												onClick={(e) => {
													e.stopPropagation();
													approveUser(user.id);
												}}
												style={actionBtnStyle("#4CAF50")}
											>
												✓
											</button>
										)}
										<button
											onClick={(e) => {
												e.stopPropagation();
												navigate(`/admin/chat/${user.id}`);
											}}
											style={actionBtnStyle("#5B8DB8")}
										>
											💬
										</button>
										{!user.isAdmin ? (
											<button
												onClick={(e) => {
													e.stopPropagation();
													makeAdmin(user.id);
												}}
												style={actionBtnStyle("#7B5EA7")}
											>
												👑
											</button>
										) : (
											<button
												onClick={(e) => {
													e.stopPropagation();
													removeAdmin(user.id);
												}}
												style={actionBtnStyle("#8E8E8E")}
											>
												-
											</button>
										)}
										<button
											onClick={(e) => {
												e.stopPropagation();
												toggleBlock(user.id);
											}}
											style={actionBtnStyle(
												user.status === "blocked" ? "#4CAF50" : "#FF6B6B",
											)}
										>
											{user.status === "blocked" ? "✓" : "🚫"}
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				{filteredUsers.length === 0 && (
					<div style={{ padding: 40, textAlign: "center", color: "#8E8E8E" }}>
						Пользователи не найдены
					</div>
				)}
			</div>

			{/* Mobile Cards */}
			<div className="mobile-cards" style={{ display: "none", gap: 12 }}>
				{filteredUsers.map((user) => (
					<div
						key={user.id}
						style={{
							backgroundColor: "white",
							borderRadius: 12,
							padding: 16,
							boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
						}}
					>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: 12,
								marginBottom: 12,
							}}
						>
							<div
								style={{
									width: 48,
									height: 48,
									borderRadius: "50%",
									backgroundColor: "#7B5EA7",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									color: "white",
									fontSize: 18,
									fontWeight: 600,
								}}
							>
								{user.name.charAt(0)}
							</div>
							<div style={{ flex: 1 }}>
								<div style={{ fontWeight: 600, color: "#1A1A1A" }}>
									{user.name}
								</div>
								<div style={{ fontSize: 12, color: "#8E8E8E" }}>
									{user.email}
								</div>
							</div>
							<span
								style={{
									padding: "4px 10px",
									borderRadius: 12,
									fontSize: 11,
									backgroundColor: statusLabels[user.status].bg,
									color: statusLabels[user.status].color,
								}}
							>
								{statusLabels[user.status].label}
							</span>
						</div>
						{user.sociotype && (
							<div style={{ marginBottom: 12 }}>
								<span style={{ fontSize: 12, color: "#8E8E8E" }}>
									Социотип:{" "}
								</span>
								<span
									style={{
										padding: "2px 8px",
										borderRadius: 8,
										fontSize: 12,
										backgroundColor: user.approved ? "#E8F5E9" : "#FFF9E6",
										color: user.approved ? "#4CAF50" : "#F5C542",
									}}
								>
									{user.sociotype}
								</span>
							</div>
						)}
						<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
							<button
								onClick={() => navigate(`/admin/users/${user.id}`)}
								style={actionBtnStyle("#7B5EA7")}
							>
								Профиль
							</button>
							<button
								onClick={() => navigate(`/admin/chat/${user.id}`)}
								style={actionBtnStyle("#5B8DB8")}
							>
								Написать
							</button>
							{user.status === "pending" && (
								<button
									onClick={() => approveUser(user.id)}
									style={actionBtnStyle("#4CAF50")}
								>
									Подтвердить
								</button>
							)}
							<button
								onClick={() => toggleBlock(user.id)}
								style={actionBtnStyle(
									user.status === "blocked" ? "#4CAF50" : "#FF6B6B",
								)}
							>
								{user.status === "blocked" ? "Разблокировать" : "Заблокировать"}
							</button>
						</div>
					</div>
				))}
			</div>

			<style>{`
        @media (max-width: 768px) {
          .desktop-table { display: none !important; }
          .mobile-cards { display: flex !important; flex-direction: column !important; }
        }
      `}</style>
		</div>
	);
}

const thStyle = {
	padding: "14px 16px",
	textAlign: "left",
	fontSize: 13,
	fontWeight: 600,
	color: "#8E8E8E",
};

const tdStyle = {
	padding: "14px 16px",
	fontSize: 14,
	color: "#1A1A1A",
	verticalAlign: "middle",
};

const actionBtnStyle = (color) => ({
	padding: "6px 10px",
	borderRadius: 6,
	backgroundColor: `${color}15`,
	border: `1px solid ${color}`,
	color: color,
	fontSize: 12,
	cursor: "pointer",
});
