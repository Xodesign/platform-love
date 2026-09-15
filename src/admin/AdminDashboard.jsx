import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";

const statsCards = [
	{
		id: "users_today",
		label: "Новых за сегодня",
		value: 12,
		icon: "👥",
		color: "#7B5EA7",
		change: "+23% к вчера",
		positive: true,
	},
	{
		id: "orders_today",
		label: "Заказов за сегодня",
		value: 5,
		icon: "🌸",
		color: "#4CAF50",
		change: "+2 к вчера",
		positive: true,
	},
	{
		id: "complaints_pending",
		label: "Новых жалоб",
		value: 3,
		icon: "🚨",
		color: "#FF6B6B",
		change: "Требуют внимания",
		positive: false,
	},
	{
		id: "income_today",
		label: "Доход за сегодня",
		value: "12 500 ₽",
		icon: "💰",
		color: "#F5C542",
		change: "+3 000 ₽ к вчера",
		positive: true,
	},
];

const recentActivity = [
	{
		id: 1,
		type: "user",
		text: "Новый пользователь: Анна Смирнова",
		time: "2 мин назад",
		icon: "👤",
	},
	{
		id: 2,
		type: "order",
		text: "Заказ #124 от Сергея К. — 5 000 ₽",
		time: "5 мин назад",
		icon: "🌸",
	},
	{
		id: 3,
		type: "complaint",
		text: "Новая жалоба на пользователя Ивана П.",
		time: "12 мин назад",
		icon: "🚨",
	},
	{
		id: 4,
		type: "support",
		text: "Новое обращение в поддержку",
		time: "15 мин назад",
		icon: "💬",
	},
	{
		id: 5,
		type: "order",
		text: "Заказ #123 выполнен",
		time: "30 мин назад",
		icon: "✓",
	},
	{
		id: 6,
		type: "user",
		text: "Пользователь заблокирован: Алексей В.",
		time: "1 час назад",
		icon: "🚫",
	},
];

const pendingItems = [
	{
		type: "support",
		count: 2,
		label: "Неотвеченные обращения",
		color: "#5B8DB8",
	},
	{
		type: "complaints",
		count: 3,
		label: "Нерассмотренные жалобы",
		color: "#FF6B6B",
	},
	{ type: "moderation", count: 5, label: "На модерации", color: "#F5C542" },
	{ type: "orders", count: 1, label: "Новые заказы", color: "#4CAF50" },
];

export default function AdminDashboard() {
	const navigate = useNavigate();
	const [stats, setStats] = useState(statsCards);
	const [activity, setActivity] = useState(recentActivity);
	const [pending, setPending] = useState(pendingItems);

	// Загрузка реальных данных с сервера
	useEffect(() => {
		const fetchStats = async () => {
			try {
				const data = await api.adminStats();
				if (Array.isArray(data.stats) && data.stats.length)
					setStats(data.stats);
				if (Array.isArray(data.activity)) setActivity(data.activity);
				if (Array.isArray(data.pending)) setPending(data.pending);
			} catch (err) {
				console.log("Stats API not available, using mock data");
			}
		};

		fetchStats();
	}, []);

	const getActivityIcon = (type) => {
		const icons = {
			user: "👤",
			order: "🌸",
			complaint: "🚨",
			support: "💬",
		};
		return icons[type] || "📌";
	};

	return (
		<div>
			{/* Header */}
			<div style={{ marginBottom: 24 }}>
				<h3
					style={{
						fontSize: 24,
						fontWeight: 700,
						color: "#1A1A1A",
						margin: "0 0 4px",
					}}
				>
					Добро пожаловать, Администратор
				</h3>
				<p style={{ fontSize: 14, color: "#8E8E8E", margin: 0 }}>
					{new Date().toLocaleDateString("ru-RU", {
						weekday: "long",
						day: "numeric",
						month: "long",
					})}
				</p>
			</div>

			{/* Stats Cards */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
					gap: 16,
					marginBottom: 32,
				}}
			>
				{stats.map((stat) => (
					<div
						key={stat.id}
						style={{
							backgroundColor: "white",
							borderRadius: 16,
							padding: 20,
							boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
							borderLeft: `4px solid ${stat.color}`,
						}}
					>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "flex-start",
								marginBottom: 12,
							}}
						>
							<span style={{ fontSize: 32 }}>{stat.icon}</span>
							<span
								style={{
									fontSize: 11,
									padding: "4px 8px",
									borderRadius: 8,
									backgroundColor: stat.positive ? "#E8F5E9" : "#FFEBEB",
									color: stat.positive ? "#4CAF50" : "#FF6B6B",
									fontWeight: 500,
								}}
							>
								{stat.change}
							</span>
						</div>
						<div
							style={{
								fontSize: 28,
								fontWeight: 700,
								color: "#1A1A1A",
								marginBottom: 4,
							}}
						>
							{stat.value}
						</div>
						<div style={{ fontSize: 13, color: "#8E8E8E" }}>{stat.label}</div>
					</div>
				))}
			</div>

			{/* Two Column Layout */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
					gap: 24,
				}}
			>
				{/* Pending Actions */}
				<div
					style={{
						backgroundColor: "white",
						borderRadius: 16,
						padding: 24,
						boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
					}}
				>
					<h4
						style={{
							fontSize: 16,
							fontWeight: 600,
							color: "#1A1A1A",
							margin: "0 0 16px",
						}}
					>
						⚡ Требуют внимания
					</h4>
					<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
						{pending.map((item) => (
							<div
								key={item.type}
								onClick={() =>
									navigate(
										`/admin/${item.type === "support" ? "support" : item.type === "complaints" ? "complaints" : item.type === "moderation" ? "moderation" : "orders"}`,
									)
								}
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									padding: "12px 16px",
									backgroundColor: `${item.color}10`,
									borderRadius: 10,
									cursor: "pointer",
									transition: "all 0.2s",
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.backgroundColor = `${item.color}20`;
									e.currentTarget.style.transform = "translateX(4px)";
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.backgroundColor = `${item.color}10`;
									e.currentTarget.style.transform = "translateX(0)";
								}}
							>
								<span style={{ fontSize: 14, color: "#1A1A1A" }}>
									{item.label}
								</span>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: 8,
									}}
								>
									<span
										style={{
											fontSize: 14,
											fontWeight: 600,
											color: item.color,
											backgroundColor: "white",
											padding: "4px 10px",
											borderRadius: 8,
										}}
									>
										{item.count}
									</span>
									<span style={{ color: "#8E8E8E", fontSize: 14 }}>→</span>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Recent Activity */}
				<div
					style={{
						backgroundColor: "white",
						borderRadius: 16,
						padding: 24,
						boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
					}}
				>
					<h4
						style={{
							fontSize: 16,
							fontWeight: 600,
							color: "#1A1A1A",
							margin: "0 0 16px",
						}}
					>
						📋 Последние действия
					</h4>
					<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
						{activity.map((item) => (
							<div
								key={item.id}
								style={{
									display: "flex",
									gap: 12,
									padding: "10px 0",
									borderBottom: "1px solid #F0F0F0",
								}}
							>
								<div
									style={{
										width: 32,
										height: 32,
										borderRadius: "50%",
										backgroundColor: "#F5F5F7",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										fontSize: 14,
										flexShrink: 0,
									}}
								>
									{item.icon || getActivityIcon(item.type)}
								</div>
								<div style={{ flex: 1, minWidth: 0 }}>
									<p
										style={{
											fontSize: 13,
											color: "#1A1A1A",
											margin: "0 0 2px",
										}}
									>
										{item.text}
									</p>
									<p style={{ fontSize: 11, color: "#8E8E8E", margin: 0 }}>
										{item.time}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Quick Actions */}
			<div
				style={{
					marginTop: 24,
					backgroundColor: "white",
					borderRadius: 16,
					padding: 24,
					boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
				}}
			>
				<h4
					style={{
						fontSize: 16,
						fontWeight: 600,
						color: "#1A1A1A",
						margin: "0 0 16px",
					}}
				>
					⚡ Быстрые действия
				</h4>
				<div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
					<button
						onClick={() => navigate("/admin/users")}
						style={{
							padding: "10px 20px",
							borderRadius: 10,
							backgroundColor: "#F3E8FF",
							border: "none",
							color: "#7B5EA7",
							fontSize: 14,
							fontWeight: 500,
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							gap: 8,
						}}
					>
						👥 Все пользователи
					</button>
					<button
						onClick={() => navigate("/admin/orders")}
						style={{
							padding: "10px 20px",
							borderRadius: 10,
							backgroundColor: "#E8F5E9",
							border: "none",
							color: "#4CAF50",
							fontSize: 14,
							fontWeight: 500,
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							gap: 8,
						}}
					>
						🌸 Все заказы
					</button>
					<button
						onClick={() => navigate("/admin/blacklist")}
						style={{
							padding: "10px 20px",
							borderRadius: 10,
							backgroundColor: "#FFEBEB",
							border: "none",
							color: "#FF6B6B",
							fontSize: 14,
							fontWeight: 500,
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							gap: 8,
						}}
					>
						🚫 Чёрный список
					</button>
					<button
						onClick={() => navigate("/admin/logs")}
						style={{
							padding: "10px 20px",
							borderRadius: 10,
							backgroundColor: "#E8F4FF",
							border: "none",
							color: "#5B8DB8",
							fontSize: 14,
							fontWeight: 500,
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							gap: 8,
						}}
					>
						📝 Логи действий
					</button>
					<button
						onClick={() => navigate("/admin/backups")}
						style={{
							padding: "10px 20px",
							borderRadius: 10,
							backgroundColor: "#FFF9E6",
							border: "none",
							color: "#F5C542",
							fontSize: 14,
							fontWeight: 500,
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							gap: 8,
						}}
					>
						💾 Бэкапы
					</button>
				</div>
			</div>
		</div>
	);
}
