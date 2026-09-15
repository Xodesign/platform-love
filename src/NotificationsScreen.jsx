import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api.js";

const LOGO_URL =
	"https://storage.yandexcloud.net/promto-user-static-sites-prod/design-assets/909022946/8c7e6951-480b-46d6-8680-2024c7503c12/8f62e6d4-fe4e-433f-b1fa-8360fa65021d-logo.png";

// Демо-уведомления
const DEMO_NOTIFICATIONS = [
	{
		id: 1,
		type: "like",
		title: "Новая симпатия!",
		message: "Мария оценила вашу анкету",
		icon: "❤️",
		time: "только что",
		read: false,
		photo:
			"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
		action: "/fans",
	},
	{
		id: 2,
		type: "match",
		title: "Взаимная симпатия!",
		message: "Вы и Ольга понравились друг другу!",
		icon: "💕",
		time: "5 мин назад",
		read: false,
		photo:
			"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
		action: "/messages",
	},
	{
		id: 3,
		type: "message",
		title: "Новое сообщение",
		message: "Алексей: Привет! Как дела?",
		icon: "💬",
		time: "15 мин назад",
		read: false,
		photo:
			"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
		action: "/messages/1",
	},
	{
		id: 4,
		type: "visit",
		title: "Вашу анкету посмотрели",
		message: "Сергей просмотрел вашу анкету",
		icon: "👀",
		time: "час назад",
		read: true,
		photo:
			"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
		action: "/profile",
	},
	{
		id: 5,
		type: "gift",
		title: "Подарок!",
		message: "Наталья отправила вам виртуальный подарок 🌹",
		icon: "🎁",
		time: "2 часа назад",
		read: true,
		photo:
			"https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop",
		action: "/fans",
	},
	{
		id: 6,
		type: "match",
		title: "Взаимная симпатия!",
		message: "Вы и Павел понравились друг другу!",
		icon: "💕",
		time: "3 часа назад",
		read: true,
		photo:
			"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
		action: "/messages",
	},
	{
		id: 7,
		type: "system",
		title: "Обновление приложения",
		message: "Доступна новая версия с улучшениями",
		icon: "⚡",
		time: "вчера",
		read: true,
		photo: null,
		action: null,
	},
	{
		id: 8,
		type: "like",
		title: "Новая симпатия!",
		message: "Екатерина оценила вашу анкету",
		icon: "❤️",
		time: "2 дня назад",
		read: true,
		photo:
			"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop",
		action: "/fans",
	},
];

export default function NotificationsScreen() {
	const navigate = useNavigate();
	const [notifications, setNotifications] = useState([]);
	const [filter, setFilter] = useState("all"); // all, unread
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadNotifications();
	}, []);

	const ICONS = {
		like: "❤️",
		match: "💜",
		message: "💬",
		order: "🌸",
		system: "🔔",
	};
	const TITLES = {
		like: "Новый лайк",
		match: "Новый мэтч",
		message: "Сообщение",
		order: "Заказ",
		system: "Уведомление",
	};

	const loadNotifications = async () => {
		setLoading(true);
		try {
			const data = await api.getNotifications();
			if (Array.isArray(data) && data.length) {
				setNotifications(
					data.map((n) => ({
						id: n.id,
						type: n.type,
						title: TITLES[n.type] || "Уведомление",
						message: n.text,
						photo: null,
						icon: ICONS[n.type] || "🔔",
						time: n.time,
						read: !!n.is_read,
						action: n.type,
					})),
				);
			} else {
				setNotifications(DEMO_NOTIFICATIONS);
			}
		} catch {
			setNotifications(DEMO_NOTIFICATIONS);
		}
		setLoading(false);
	};

	const markAsRead = (id) => {
		const updated = notifications.map((n) =>
			n.id === id ? { ...n, read: true } : n,
		);
		setNotifications(updated);
		localStorage.setItem("notifications", JSON.stringify(updated));
	};

	const markAllAsRead = () => {
		const updated = notifications.map((n) => ({ ...n, read: true }));
		setNotifications(updated);
		localStorage.setItem("notifications", JSON.stringify(updated));
	};

	const deleteNotification = (id) => {
		const updated = notifications.filter((n) => n.id !== id);
		setNotifications(updated);
		localStorage.setItem("notifications", JSON.stringify(updated));
	};

	const handleNotificationClick = (notification) => {
		markAsRead(notification.id);
		if (notification.action) {
			navigate(notification.action);
		}
	};

	const filteredNotifications = notifications.filter((n) => {
		if (filter === "unread") return !n.read;
		return true;
	});

	const unreadCount = notifications.filter((n) => !n.read).length;

	const getTypeColor = (type) => {
		switch (type) {
			case "like":
				return "#FF6B6B";
			case "match":
				return "#7B5EA7";
			case "message":
				return "#5B8DB8";
			case "visit":
				return "#8E8E8E";
			case "gift":
				return "#FF9500";
			case "system":
				return "#34C759";
			default:
				return "#7B5EA7";
		}
	};

	const formatTime = (time) => {
		if (time === "только что") return "только что";
		if (time.includes("мин")) return time;
		if (time.includes("час")) return time;
		if (time === "вчера") return "вчера";
		if (time.includes("день")) return time;
		return time;
	};

	return (
		<div
			style={{
				minHeight: "100vh",
				backgroundColor: "#F5F5F5",
				fontFamily: "Inter, system-ui, sans-serif",
				paddingBottom: 100,
			}}
		>
			{/* Header */}
			<div
				style={{
					backgroundColor: "white",
					padding: "12px 16px",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
					position: "sticky",
					top: 0,
					zIndex: 10,
				}}
			>
				<button
					onClick={() => navigate("/menu")}
					style={{
						backgroundColor: "transparent",
						border: "none",
						cursor: "pointer",
						padding: 8,
					}}
				>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="#1A1A1A">
						<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
					</svg>
				</button>
				<img src={LOGO_URL} alt="Logo" style={{ width: 100, height: "auto" }} />
				{unreadCount > 0 && (
					<button
						onClick={markAllAsRead}
						style={{
							backgroundColor: "transparent",
							border: "none",
							cursor: "pointer",
							color: "#5B8DB8",
							fontSize: 12,
							fontWeight: 500,
						}}
					>
						Прочитать все
					</button>
				)}
			</div>

			<div style={{ padding: "16px" }}>
				{/* Title */}
				<h1
					style={{
						fontSize: 24,
						fontWeight: 700,
						color: "#1A1A1A",
						margin: "0 0 4px",
						display: "flex",
						alignItems: "center",
						gap: 10,
					}}
				>
					События
					{unreadCount > 0 && (
						<span
							style={{
								backgroundColor: "#FF6B6B",
								color: "white",
								fontSize: 14,
								fontWeight: 600,
								padding: "2px 10px",
								borderRadius: 12,
							}}
						>
							{unreadCount}
						</span>
					)}
				</h1>
				<p style={{ fontSize: 14, color: "#8E8E8E", margin: "0 0 16px" }}>
					Уведомления и активность
				</p>

				{/* Filter Tabs */}
				<div
					style={{
						display: "flex",
						gap: 8,
						marginBottom: 16,
					}}
				>
					<button
						onClick={() => setFilter("all")}
						style={{
							padding: "8px 16px",
							borderRadius: 20,
							border: "none",
							backgroundColor: filter === "all" ? "#7B5EA7" : "#F0F0F0",
							color: filter === "all" ? "white" : "#1A1A1A",
							fontSize: 14,
							fontWeight: 500,
							cursor: "pointer",
						}}
					>
						Все ({notifications.length})
					</button>
					<button
						onClick={() => setFilter("unread")}
						style={{
							padding: "8px 16px",
							borderRadius: 20,
							border: "none",
							backgroundColor: filter === "unread" ? "#7B5EA7" : "#F0F0F0",
							color: filter === "unread" ? "white" : "#1A1A1A",
							fontSize: 14,
							fontWeight: 500,
							cursor: "pointer",
						}}
					>
						🆕 Новые ({unreadCount})
					</button>
				</div>

				{/* Notifications List */}
				{loading ? (
					<div style={{ textAlign: "center", padding: 40, color: "#8E8E8E" }}>
						Загрузка...
					</div>
				) : filteredNotifications.length === 0 ? (
					<div
						style={{
							textAlign: "center",
							padding: 60,
							color: "#8E8E8E",
						}}
					>
						<div style={{ fontSize: 64, marginBottom: 16 }}>🔔</div>
						<p style={{ fontSize: 16, margin: 0 }}>
							{filter === "unread"
								? "Нет новых уведомлений"
								: "Событий пока нет"}
						</p>
						<p style={{ fontSize: 14, marginTop: 8 }}>
							Здесь будут отображаться симпатии, сообщения и другая активность
						</p>
					</div>
				) : (
					<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
						{filteredNotifications.map((notification) => (
							<div
								key={notification.id}
								onClick={() => handleNotificationClick(notification)}
								style={{
									backgroundColor: notification.read ? "white" : "#F8F5FF",
									borderRadius: 16,
									padding: 14,
									display: "flex",
									alignItems: "center",
									gap: 12,
									cursor: notification.action ? "pointer" : "default",
									boxShadow: notification.read
										? "0 2px 8px rgba(0,0,0,0.05)"
										: "0 2px 12px rgba(123,94,167,0.15)",
									position: "relative",
								}}
							>
								{/* Unread indicator */}
								{!notification.read && (
									<div
										style={{
											position: "absolute",
											left: 4,
											top: "50%",
											transform: "translateY(-50%)",
											width: 8,
											height: 8,
											borderRadius: "50%",
											backgroundColor: "#7B5EA7",
										}}
									/>
								)}

								{/* Icon/Avatar */}
								{notification.photo ? (
									<div
										style={{
											width: 50,
											height: 50,
											borderRadius: "50%",
											overflow: "hidden",
											flexShrink: 0,
											border: `3px solid ${getTypeColor(notification.type)}`,
										}}
									>
										<img
											src={notification.photo}
											alt=""
											style={{
												width: "100%",
												height: "100%",
												objectFit: "cover",
											}}
											onError={(e) => {
												e.target.style.display = "none";
											}}
										/>
									</div>
								) : (
									<div
										style={{
											width: 50,
											height: 50,
											borderRadius: 12,
											backgroundColor: getTypeColor(notification.type),
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											fontSize: 24,
											flexShrink: 0,
										}}
									>
										{notification.icon}
									</div>
								)}

								{/* Content */}
								<div style={{ flex: 1, minWidth: 0 }}>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "flex-start",
										}}
									>
										<h3
											style={{
												fontSize: 15,
												fontWeight: notification.read ? 600 : 700,
												color: "#1A1A1A",
												margin: 0,
												flex: 1,
											}}
										>
											{notification.title}
										</h3>
										<span
											style={{
												fontSize: 11,
												color: "#8E8E8E",
												whiteSpace: "nowrap",
												marginLeft: 8,
											}}
										>
											{formatTime(notification.time)}
										</span>
									</div>
									<p
										style={{
											fontSize: 13,
											color: "#8E8E8E",
											margin: "4px 0 0",
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
									>
										{notification.message}
									</p>
								</div>

								{/* Delete button */}
								<button
									onClick={(e) => {
										e.stopPropagation();
										deleteNotification(notification.id);
									}}
									style={{
										width: 32,
										height: 32,
										borderRadius: "50%",
										backgroundColor: "transparent",
										border: "none",
										cursor: "pointer",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										color: "#AAAAAA",
										fontSize: 18,
										flexShrink: 0,
									}}
								>
									✕
								</button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
