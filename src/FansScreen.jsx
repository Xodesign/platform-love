import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api.js";

const LOGO_URL =
	"https://storage.yandexcloud.net/promto-user-static-sites-prod/design-assets/909022946/8c7e6951-480b-46d6-8680-2024c7503c12/8f62e6d4-fe4e-433f-b1fa-8360fa65021d-logo.png";

// Демо-данные поклонников
const DEMO_FANS = [
	{
		id: 1,
		name: "Мария",
		age: 26,
		city: "Москва",
		photo:
			"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop",
		time: "только что",
		mutual: true,
		likesYou: true,
	},
	{
		id: 2,
		name: "Алексей",
		age: 32,
		city: "Санкт-Петербург",
		photo:
			"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop",
		time: "5 мин назад",
		mutual: false,
		likesYou: true,
	},
	{
		id: 3,
		name: "Ольга",
		age: 28,
		city: "Москва",
		photo:
			"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop",
		time: "час назад",
		mutual: true,
		likesYou: true,
	},
	{
		id: 4,
		name: "Сергей",
		age: 35,
		city: "Екатеринбург",
		photo:
			"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop",
		time: "2 часа назад",
		mutual: false,
		likesYou: true,
	},
	{
		id: 5,
		name: "Наталья",
		age: 29,
		city: "Москва",
		photo:
			"https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=300&fit=crop",
		time: "вчера",
		mutual: false,
		likesYou: true,
	},
	{
		id: 6,
		name: "Павел",
		age: 31,
		city: "Новосибирск",
		photo:
			"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop",
		time: "2 дня назад",
		mutual: true,
		likesYou: true,
	},
	{
		id: 7,
		name: "Екатерина",
		age: 27,
		city: "Казань",
		photo:
			"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=300&fit=crop",
		time: "3 дня назад",
		mutual: false,
		likesYou: true,
	},
	{
		id: 8,
		name: "Дмитрий",
		age: 38,
		city: "Москва",
		photo:
			"https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop",
		time: "неделю назад",
		mutual: false,
		likesYou: true,
	},
];

export default function FansScreen() {
	const navigate = useNavigate();
	const [fans, setFans] = useState([]);
	const [filter, setFilter] = useState("all"); // all, mutual, new
	const [loading, setLoading] = useState(true);
	const [failedImages, setFailedImages] = useState({});

	const handleImageError = (id) => {
		setFailedImages((prev) => ({ ...prev, [id]: true }));
	};

	useEffect(() => {
		loadFans();
	}, []);

	const loadFans = async () => {
		setLoading(true);
		try {
			const data = await api.incomingLikes();
			if (Array.isArray(data) && data.length) {
				setFans(
					data.map((x) => ({
						id: x.id,
						name: x.name,
						age: x.age,
						city: x.location,
						photo: x.photos?.[0],
						time: x.time,
						timestamp: Date.now(),
						likesYou: true,
						mutual: x.mutual,
					})),
				);
			} else {
				setFans(DEMO_FANS);
			}
		} catch {
			setFans(DEMO_FANS);
		}
		setLoading(false);
	};

	const toggleLike = (fanId) => {
		const updatedFans = fans.map((fan) => {
			if (fan.id === fanId) {
				const newMutual = !fan.mutual;
				// Сохраняем в историю свайпов
				const swipedProfiles = JSON.parse(
					localStorage.getItem("swipedProfiles") || "[]",
				);
				const newSwipe = {
					userId: fan.id,
					name: fan.name,
					direction: newMutual ? "right" : "left",
					timestamp: new Date().toISOString(),
				};
				localStorage.setItem(
					"swipedProfiles",
					JSON.stringify([...swipedProfiles, newSwipe]),
				);
				return { ...fan, mutual: newMutual };
			}
			return fan;
		});
		setFans(updatedFans);
		localStorage.setItem("fans", JSON.stringify(updatedFans));
	};

	const filteredFans = fans.filter((fan) => {
		if (filter === "mutual") return fan.mutual;
		if (filter === "new") {
			const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
			return new Date(fan.timestamp || Date.now()).getTime() > dayAgo;
		}
		return true;
	});

	const mutualCount = fans.filter((f) => f.mutual).length;
	const newCount = fans.filter((f) => {
		const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
		return new Date(f.timestamp || Date.now()).getTime() > dayAgo;
	}).length;

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
				<div style={{ width: 40 }} />
			</div>

			<div style={{ padding: "16px" }}>
				{/* Title */}
				<h1
					style={{
						fontSize: 24,
						fontWeight: 700,
						color: "#1A1A1A",
						margin: "0 0 4px",
					}}
				>
					Поклонники
				</h1>
				<p style={{ fontSize: 14, color: "#8E8E8E", margin: "0 0 16px" }}>
					Люди, которые оценили вашу анкету
				</p>

				{/* Stats */}
				<div
					style={{
						display: "flex",
						gap: 12,
						marginBottom: 16,
					}}
				>
					<div
						style={{
							flex: 1,
							backgroundColor: "white",
							borderRadius: 12,
							padding: "12px 16px",
							textAlign: "center",
							boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
						}}
					>
						<div
							style={{
								fontSize: 24,
								fontWeight: 700,
								color: "#7B5EA7",
							}}
						>
							{fans.length}
						</div>
						<div style={{ fontSize: 12, color: "#8E8E8E" }}>Всего</div>
					</div>
					<div
						style={{
							flex: 1,
							backgroundColor: "#F3E8FF",
							borderRadius: 12,
							padding: "12px 16px",
							textAlign: "center",
						}}
					>
						<div
							style={{
								fontSize: 24,
								fontWeight: 700,
								color: "#7B5EA7",
							}}
						>
							{mutualCount}
						</div>
						<div style={{ fontSize: 12, color: "#8E8E8E" }}>Взаимно ❤️</div>
					</div>
					<div
						style={{
							flex: 1,
							backgroundColor: "white",
							borderRadius: 12,
							padding: "12px 16px",
							textAlign: "center",
							boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
						}}
					>
						<div
							style={{
								fontSize: 24,
								fontWeight: 700,
								color: "#5B8DB8",
							}}
						>
							{newCount}
						</div>
						<div style={{ fontSize: 12, color: "#8E8E8E" }}>Новых</div>
					</div>
				</div>

				{/* Filter Tabs */}
				<div
					style={{
						display: "flex",
						gap: 8,
						marginBottom: 16,
						overflowX: "auto",
						paddingBottom: 4,
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
							whiteSpace: "nowrap",
						}}
					>
						Все ({fans.length})
					</button>
					<button
						onClick={() => setFilter("mutual")}
						style={{
							padding: "8px 16px",
							borderRadius: 20,
							border: "none",
							backgroundColor: filter === "mutual" ? "#7B5EA7" : "#F0F0F0",
							color: filter === "mutual" ? "white" : "#1A1A1A",
							fontSize: 14,
							fontWeight: 500,
							cursor: "pointer",
							whiteSpace: "nowrap",
						}}
					>
						❤️ Взаимные ({mutualCount})
					</button>
					<button
						onClick={() => setFilter("new")}
						style={{
							padding: "8px 16px",
							borderRadius: 20,
							border: "none",
							backgroundColor: filter === "new" ? "#7B5EA7" : "#F0F0F0",
							color: filter === "new" ? "white" : "#1A1A1A",
							fontSize: 14,
							fontWeight: 500,
							cursor: "pointer",
							whiteSpace: "nowrap",
						}}
					>
						🆕 Новые ({newCount})
					</button>
				</div>

				{/* Fans Grid */}
				{loading ? (
					<div style={{ textAlign: "center", padding: 40, color: "#8E8E8E" }}>
						Загрузка...
					</div>
				) : filteredFans.length === 0 ? (
					<div
						style={{
							textAlign: "center",
							padding: 40,
							color: "#8E8E8E",
						}}
					>
						<div style={{ fontSize: 48, marginBottom: 16 }}>💔</div>
						<p style={{ fontSize: 16, margin: 0 }}>
							{filter === "mutual"
								? "Пока нет взаимных симпатий"
								: filter === "new"
									? "За последние сутки никто не оценил"
									: "Поклонников пока нет"}
						</p>
						<p style={{ fontSize: 14, marginTop: 8 }}>
							Продолжайте общение в чатах!
						</p>
					</div>
				) : (
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: 12,
						}}
					>
						{filteredFans.map((fan) => (
							<div
								key={fan.id}
								style={{
									backgroundColor: "white",
									borderRadius: 16,
									padding: 12,
									boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
									textAlign: "center",
									position: "relative",
								}}
							>
								{/* Badges */}
								<div
									style={{
										position: "absolute",
										top: 8,
										left: 8,
										right: 8,
										display: "flex",
										justifyContent: "space-between",
									}}
								>
									{fan.mutual && (
										<div
											style={{
												backgroundColor: "#7B5EA7",
												color: "white",
												padding: "2px 8px",
												borderRadius: 10,
												fontSize: 10,
											}}
										>
											❤️ Взаимно
										</div>
									)}
									{fan.likesYou && !fan.mutual && (
										<div
											style={{
												backgroundColor: "#5B8DB8",
												color: "white",
												padding: "2px 8px",
												borderRadius: 10,
												fontSize: 10,
											}}
										>
											Нравитесь
										</div>
									)}
								</div>

								{/* Avatar */}
								<div
									style={{
										width: "100%",
										aspectRatio: "1",
										borderRadius: 12,
										backgroundColor: "#E8E8E8",
										marginBottom: 12,
										overflow: "hidden",
									}}
								>
									{failedImages[fan.id] ? (
										<div
											style={{
												width: "100%",
												height: "100%",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												backgroundColor: "#E8E8E8",
											}}
										>
											<svg
												width="60"
												height="60"
												viewBox="0 0 24 24"
												fill="#AAAAAA"
											>
												<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
											</svg>
										</div>
									) : (
										<img
											src={fan.photo}
											alt={fan.name}
											style={{
												width: "100%",
												height: "100%",
												objectFit: "cover",
											}}
											onError={() => handleImageError(fan.id)}
										/>
									)}
								</div>

								{/* Name & Info */}
								<p
									style={{
										fontSize: 16,
										fontWeight: 600,
										color: "#1A1A1A",
										margin: 0,
									}}
								>
									{fan.name}, {fan.age}
								</p>
								<p
									style={{
										fontSize: 12,
										color: "#8E8E8E",
										margin: "4px 0 4px",
									}}
								>
									📍 {fan.city}
								</p>
								<p
									style={{
										fontSize: 11,
										color: "#AAAAAA",
										margin: "0 0 8px",
									}}
								>
									⏰ {fan.time}
								</p>

								{/* Action Buttons */}
								<div style={{ display: "flex", gap: 6 }}>
									<button
										onClick={() => toggleLike(fan.id)}
										style={{
											flex: 1,
											padding: "8px 12px",
											borderRadius: 20,
											border: fan.mutual ? "none" : "2px solid #7B5EA7",
											backgroundColor: fan.mutual ? "#7B5EA7" : "transparent",
											color: fan.mutual ? "white" : "#7B5EA7",
											fontSize: 13,
											fontWeight: 500,
											cursor: "pointer",
										}}
									>
										{fan.mutual ? "❤️ Лайкнуто" : "🤍 Лайкнуть"}
									</button>
									<button
										onClick={() => navigate(`/chat/${fan.id}`)}
										style={{
											flex: 1,
											padding: "8px 12px",
											borderRadius: 20,
											border: "none",
											backgroundColor: "#5B8DB8",
											color: "white",
											fontSize: 13,
											fontWeight: 500,
											cursor: "pointer",
										}}
									>
										💬 Чат
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
