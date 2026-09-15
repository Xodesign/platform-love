import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api.js";

const LOGO_URL =
	"https://storage.yandexcloud.net/promto-user-static-sites-prod/design-assets/909022946/8c7e6951-480b-46d6-8680-2024c7503c12/8f62e6d4-fe4e-433f-b1fa-8360fa65021d-logo.png";

export default function MainMenuScreen() {
	const navigate = useNavigate();
	// Почта — единственный канал возврата доступа. Аккаунты, созданные до
	// обязательной почты, сами о ней не узнают: напоминаем при входе в меню
	const [showEmailNudge, setShowEmailNudge] = useState(false);

	useEffect(() => {
		let alive = true;
		// Спрашиваем сервер, а не читаем localStorage: почту могли привязать
		// с другого устройства
		api
			.getMe()
			.then((u) => {
				if (alive) setShowEmailNudge(!u?.email);
			})
			.catch(() => {});
		return () => {
			alive = false;
		};
	}, []);

	// Функция открытия Яндекс Игр с автовходом
	const openYandexGames = async () => {
		const gamesUrl = "https://yandex.ru/games/";

		// Если пользователь авторизован, передаём данные в URL
		if (api.token) {
			try {
				const user = await api.getMe();
				const params = new URLSearchParams({
					source: "platform_love",
					user_id: user.id,
					user_name: user.name || "",
					user_email: user.email || "",
				});
				// Открываем с параметрами авторизации
				window.open(`${gamesUrl}?${params.toString()}`, "_blank");
			} catch (e) {
				// Если не удалось получить данные, открываем просто
				window.open(gamesUrl, "_blank");
			}
		} else {
			window.open(gamesUrl, "_blank");
		}
	};

	const menuItems = [
		{
			icon: "profile",
			label: "Мой профиль",
			path: "/user-profile",
			color: "#7B5EA7",
		},
		{ icon: "friends", label: "Друзья", path: "/friends", color: "#7B5EA7" },
		{ icon: "chats", label: "Чаты", path: "/messages", color: "#7B5EA7" },
		{ icon: "fans", label: "Поклонники", path: "/fans", color: "#7B5EA7" },
		{
			icon: "events",
			label: "События",
			path: "/notifications",
			color: "#7B5EA7",
		},
		{
			icon: "blacklist",
			label: "Чёрный список",
			path: "/blacklist",
			color: "#7B5EA7",
		},
		{
			icon: "yandex_games",
			label: "Игры",
			action: openYandexGames,
			color: "#FC3F1D",
		},
		{
			icon: "settings",
			label: "Настройки",
			path: "/settings",
			color: "#7B5EA7",
		},
		{ icon: "help", label: "Помощь", path: "#", color: "#7B5EA7" },
		{
			icon: "board",
			label: "Доска объявлений",
			path: "#",
			color: "#AAAAAA",
			soon: true,
		},
		{
			icon: "marketplace",
			label: "Маркетплейс",
			path: "#",
			color: "#AAAAAA",
			soon: true,
		},
		{ icon: "exit", label: "Выход", path: "/", color: "#FF6B6B" },
	];

	const icons = {
		profile: (
			<svg width="64" height="64" viewBox="0 0 24 24" fill="white">
				<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
			</svg>
		),
		friends: (
			<svg width="64" height="64" viewBox="0 0 24 24" fill="white">
				<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
			</svg>
		),
		chats: (
			<svg width="64" height="64" viewBox="0 0 24 24" fill="white">
				<path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
			</svg>
		),
		fans: (
			<svg width="64" height="64" viewBox="0 0 24 24" fill="white">
				<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
			</svg>
		),
		events: (
			<svg width="64" height="64" viewBox="0 0 24 24" fill="white">
				<path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
			</svg>
		),
		blacklist: (
			<svg width="64" height="64" viewBox="0 0 24 24" fill="white">
				<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z" />
			</svg>
		),
		games: (
			<svg width="64" height="64" viewBox="0 0 24 24" fill="white">
				<path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
			</svg>
		),
		settings: (
			<svg width="64" height="64" viewBox="0 0 24 24" fill="white">
				<path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
			</svg>
		),
		help: (
			<svg width="64" height="64" viewBox="0 0 24 24" fill="white">
				<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
			</svg>
		),
		board: (
			<svg width="64" height="64" viewBox="0 0 24 24" fill="white">
				<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
			</svg>
		),
		marketplace: (
			<svg width="64" height="64" viewBox="0 0 24 24" fill="white">
				<path d="M18.36 9l.6 3H5.04l.6-3h12.72M20 4H4v2h16V4zm0 3H4l-1 5v2h1v6h10v-6h4v6h2v-6h1v-2l-1-5zM6 18v-4h6v4H6z" />
			</svg>
		),
		yandex_games: (
			<svg width="64" height="64" viewBox="0 0 24 24" fill="white">
				<circle
					cx="12"
					cy="12"
					r="10"
					stroke="white"
					strokeWidth="1.5"
					fill="none"
				/>
				<polygon points="10,8 10,16 16,12" fill="white" />
			</svg>
		),
		admin: (
			<svg width="64" height="64" viewBox="0 0 24 24" fill="white">
				<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
			</svg>
		),
		exit: (
			<svg width="64" height="64" viewBox="0 0 24 24" fill="white">
				<path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
			</svg>
		),
	};

	const navIcons = {
		swipe: (
			<svg width="40" height="40" viewBox="0 0 24 24" fill="#1A1A1A">
				<path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" />
			</svg>
		),
		wall: (
			<svg width="40" height="40" viewBox="0 0 24 24" fill="#1A1A1A">
				<path d="M4 4h4v4H4V4zm0 6h4v4H4v-4zm0 6h4v4H4v-4zm6-12h4v4h-4V4zm0 6h4v4h-4v-4zm0 6h4v4h-4v-4zm6-12h4v4h-4V4zm0 6h4v4h-4v-4zm0 6h4v4h-4v-4z" />
			</svg>
		),
		match: (
			<svg width="40" height="40" viewBox="0 0 24 24" fill="#1A1A1A">
				<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
			</svg>
		),
		likes: (
			<svg width="40" height="40" viewBox="0 0 24 24" fill="#1A1A1A">
				<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
			</svg>
		),
		feed: (
			<svg width="40" height="40" viewBox="0 0 24 24" fill="#1A1A1A">
				<path d="M4 4h4v4H4V4zm0 6h4v4H4v-4zm0 6h4v4H4v-4zm6-12h4v4h-4V4zm0 6h4v4h-4v-4zm0 6h4v4h-4v-4zm6-12h4v4h-4V4zm0 6h4v4h-4v-4zm0 6h4v4h-4v-4z" />
			</svg>
		),
		messages: (
			<svg width="40" height="40" viewBox="0 0 24 24" fill="#1A1A1A">
				<path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
			</svg>
		),
		menu: (
			<svg width="40" height="40" viewBox="0 0 24 24" fill="#1A1A1A">
				<path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
			</svg>
		),
	};

	const bottomNav = [
		{ icon: "swipe", label: "Свайп", path: "/swipe" },
		{ icon: "feed", label: "Лента", path: "/feed" },
		{ icon: "likes", label: "Симпатии", path: "/likes" },
		{ icon: "messages", label: "Сообщения", path: "/messages" },
		{ icon: "menu", label: "Меню", path: "/menu" },
	];

	return (
		<div
			style={{
				minHeight: "100vh",
				backgroundColor: "#F5F5F5",
				fontFamily: "Inter, system-ui, sans-serif",
				paddingBottom: 80,
				overflow: "visible",
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
				}}
			>
				<button
					onClick={() => navigate(-1)}
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
				<div style={{ display: "flex", alignItems: "center", gap: 4 }}>
					<img
						src={LOGO_URL}
						alt="Logo"
						style={{ width: 125, height: "auto" }}
					/>
				</div>
				<button
					onClick={() => navigate("/settings")}
					style={{
						backgroundColor: "transparent",
						border: "none",
						cursor: "pointer",
						padding: 8,
					}}
				>
					<svg width="40" height="40" viewBox="0 0 24 24" fill="#8E8E8E">
						<path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
					</svg>
				</button>
			</div>

			{showEmailNudge && (
				<div
					style={{
						margin: "12px 16px 0",
						padding: "14px 16px",
						backgroundColor: "#FFF8E1",
						border: "1px solid #FFE082",
						borderRadius: 12,
						display: "flex",
						alignItems: "center",
						gap: 12,
					}}
				>
					<div style={{ flex: 1 }}>
						<p
							style={{
								margin: 0,
								fontSize: 14,
								fontWeight: 600,
								color: "#8A5A00",
							}}
						>
							К аккаунту не привязана почта
						</p>
						<p style={{ margin: "4px 0 0", fontSize: 13, color: "#8A5A00" }}>
							Добавьте — иначе при забытом PIN мы не сможем вернуть доступ.
						</p>
					</div>
					<button
						onClick={() => navigate("/email")}
						style={{
							border: "none",
							backgroundColor: "#7B5EA7",
							color: "white",
							fontSize: 13,
							fontWeight: 600,
							padding: "8px 12px",
							borderRadius: 8,
							cursor: "pointer",
							whiteSpace: "nowrap",
						}}
					>
						Привязать
					</button>
					<button
						onClick={() => setShowEmailNudge(false)}
						aria-label="Закрыть"
						style={{
							border: "none",
							background: "none",
							color: "#8A5A00",
							fontSize: 20,
							lineHeight: 1,
							cursor: "pointer",
							padding: 4,
						}}
					>
						×
					</button>
				</div>
			)}

			{/* Title */}
			<div style={{ padding: "20px 20px 12px" }}>
				<h1
					style={{ fontSize: 24, fontWeight: 700, color: "#1A1A1A", margin: 0 }}
				>
					Главное меню
				</h1>
			</div>

			{/* Menu Grid - 3 columns, 4 rows */}
			<div
				style={{
					padding: "0 16px",
					display: "grid",
					gridTemplateColumns: "repeat(3, 1fr)",
					gap: 16,
				}}
			>
				{menuItems.map((item, index) => (
					<div
						key={index}
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
						}}
					>
						<button
							onClick={() => {
								if (item.action) {
									item.action();
								} else if (item.path && item.path !== "#") {
									navigate(item.path);
								}
							}}
							style={{
								width: 64,
								height: 64,
								backgroundColor: item.color,
								borderRadius: 16,
								border: "none",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								cursor: item.soon ? "default" : "pointer",
								opacity: item.soon ? 0.6 : 1,
								boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
							}}
						>
							{icons[item.icon]}
						</button>
						<span
							style={{
								fontSize: 10,
								color: "#1A1A1A",
								marginTop: 6,
								textAlign: "center",
								lineHeight: 1.2,
							}}
						>
							{item.label}
						</span>
						{item.soon && (
							<span style={{ fontSize: 9, color: "#FF6B6B", marginTop: 2 }}>
								скоро
							</span>
						)}
					</div>
				))}
			</div>

			{/* Telegram Link */}
			<a
				href="https://t.me/+yHVBEBGEmOk2ZjQy"
				target="_blank"
				rel="noopener noreferrer"
				style={{
					padding: "24px 20px",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					textDecoration: "none",
				}}
			>
				<div
					style={{
						backgroundColor: "white",
						padding: 16,
						borderRadius: 16,
						boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						width: 120,
						height: 120,
					}}
				>
					<svg width="60" height="60" viewBox="0 0 24 24" fill="#0088cc">
						<path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
					</svg>
				</div>
				<span
					style={{
						fontSize: 14,
						color: "#0088cc",
						marginTop: 12,
						fontWeight: 500,
					}}
				>
					Мы в Telegram
				</span>
			</a>

			{/* Bottom Navigation */}
			<div
				style={{
					position: "fixed",
					bottom: -10,
					left: -50,
					right: -50,
					zIndex: 999,
				}}
			>
				<img
					src="https://storage.yandexcloud.net/promto-user-static-sites-prod/design-assets/909022946/8c7e6951-480b-46d6-8680-2024c7503c12/8c3316f7-df61-4d16-8d50-f599e5854813-Group_36.png"
					alt="Navigation"
					style={{
						width: "100%",
						height: "auto",
						display: "block",
					}}
				/>
				<div
					style={{
						position: "absolute",
						bottom: 25,
						left: 60,
						right: 60,
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					{bottomNav.map((item, index) => (
						<button
							key={index}
							onClick={() => navigate(item.path)}
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								padding: "2px 4px",
								backgroundColor: "transparent",
								border: "none",
								cursor: "pointer",
							}}
						>
							{navIcons[item.icon]}
							<span
								style={{
									fontSize: 14,
									color: "#1A1A1A",
									marginTop: 2,
								}}
							>
								{item.label}
							</span>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
