import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api.js";

const LOGO_URL =
	"https://storage.yandexcloud.net/promto-user-static-sites-prod/design-assets/909022946/8c7e6951-480b-46d6-8680-2024c7503c12/8f62e6d4-fe4e-433f-b1fa-8360fa65021d-logo.png";

const recentFriendsDemo = [
	{ id: 1, name: "Петя" },
	{ id: 2, name: "Федя" },
	{ id: 3, name: "Пиав" },
	{ id: 4, name: "С.х." },
	{ id: 5, name: "ntropi" },
	{ id: 6, name: "Анна" },
	{ id: 7, name: "Игорь" },
];

const recommendationsDemo = [
	{
		id: 1,
		name: "Петя Петров",
		location: "г. Москва",
		age: 46,
		zodiac: "Стрелец",
		profession: "Предприниматель",
		online: true,
	},
	{
		id: 2,
		name: "Семён Семёнов",
		location: "г. Москва",
		age: 44,
		zodiac: "Водолей",
		profession: "Инженер",
		online: false,
	},
	{
		id: 3,
		name: "Федя Федотов",
		location: "г. Москва",
		age: 41,
		zodiac: "Лев",
		profession: "Врач",
		online: true,
	},
	{
		id: 4,
		name: "Паша Пашов",
		location: "г. Москва",
		age: 39,
		zodiac: "Телец",
		profession: "Юрист",
		online: false,
	},
	{
		id: 5,
		name: "Дмитрий Иванов",
		location: "г. Санкт-Петербург",
		age: 37,
		zodiac: "Близнецы",
		profession: "Менеджер",
		online: true,
	},
];

export default function FriendsScreen() {
	const navigate = useNavigate();
	const [likedProfiles, setLikedProfiles] = useState({});
	const [recentFriends, setRecentFriends] = useState(recentFriendsDemo);
	const [recommendations, setRecommendations] = useState(recommendationsDemo);

	useEffect(() => {
		api
			.getMatches()
			.then((m) => {
				if (Array.isArray(m) && m.length) {
					setRecentFriends(
						m.map((x) => ({
							id: x.other_user_id,
							name: x.other_user_name,
							photo: x.other_user_photos?.[0],
						})),
					);
				}
			})
			.catch(() => {});
		api
			.getCandidates()
			.then((c) => {
				if (Array.isArray(c) && c.length) {
					setRecommendations(
						c.map((x) => ({
							id: x.id,
							name: x.name,
							age: x.age,
							location: x.location,
							profession: x.bio || "",
							zodiac: "",
							online: true,
							photos: x.photos,
						})),
					);
				}
			})
			.catch(() => {});
	}, []);

	const toggleLike = (id) => {
		setLikedProfiles((prev) => ({
			...prev,
			[id]: !prev[id],
		}));
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
				<img src={LOGO_URL} alt="Logo" style={{ width: 100, height: "auto" }} />
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
						<path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
					</svg>
				</button>
			</div>

			{/* Recent Section */}
			<div style={{ padding: "16px 0 8px" }}>
				<h2
					style={{
						fontSize: 16,
						fontWeight: 600,
						color: "#1A1A1A",
						margin: "0 0 12px",
						padding: "0 16px",
					}}
				>
					Недавние
				</h2>
				<div
					style={{
						display: "flex",
						gap: 12,
						padding: "0 16px",
						overflowX: "auto",
						scrollbarWidth: "none",
						msOverflowStyle: "none",
					}}
				>
					{recentFriends.map((friend) => (
						<div
							key={friend.id}
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								gap: 6,
								minWidth: 64,
								cursor: "pointer",
							}}
						>
							<div
								style={{
									width: 64,
									height: 64,
									borderRadius: "50%",
									backgroundColor: "#E8E8E8",
									border: "2px solid #E8E8E8",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<svg width="32" height="32" viewBox="0 0 24 24" fill="#AAAAAA">
									<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
								</svg>
							</div>
							<span
								style={{
									fontSize: 11,
									color: "#1A1A1A",
									textAlign: "center",
									maxWidth: 60,
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
							>
								{friend.name}
							</span>
						</div>
					))}
				</div>
			</div>

			{/* Recommendations Section */}
			<div style={{ padding: "8px 16px 16px" }}>
				<h2
					style={{
						fontSize: 16,
						fontWeight: 600,
						color: "#1A1A1A",
						margin: "0 0 12px",
					}}
				>
					Рекомендации
				</h2>

				<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
					{recommendations.map((profile) => (
						<div
							key={profile.id}
							style={{
								backgroundColor: "white",
								borderRadius: 16,
								padding: 16,
								display: "flex",
								alignItems: "center",
								gap: 12,
								boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
								border: "1px solid #E8E8E8",
							}}
						>
							{/* Avatar */}
							<div
								style={{
									width: 60,
									height: 60,
									borderRadius: "50%",
									backgroundColor: "#E8E8E8",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									flexShrink: 0,
								}}
							>
								<svg width="30" height="30" viewBox="0 0 24 24" fill="#AAAAAA">
									<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
								</svg>
							</div>

							{/* Info */}
							<div style={{ flex: 1, minWidth: 0 }}>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: 6,
										marginBottom: 4,
									}}
								>
									<h3
										style={{
											fontSize: 16,
											fontWeight: 700,
											color: "#1A1A1A",
											margin: 0,
										}}
									>
										{profile.name}
									</h3>
									{profile.online && (
										<span
											style={{
												width: 8,
												height: 8,
												borderRadius: "50%",
												backgroundColor: "#4CAF50",
											}}
										/>
									)}
								</div>
								<p style={{ fontSize: 13, color: "#8E8E8E", margin: "2px 0" }}>
									{profile.location}
								</p>
								<p style={{ fontSize: 13, color: "#8E8E8E", margin: "2px 0" }}>
									{profile.age} лет
								</p>
								<p
									style={{
										fontSize: 13,
										color: "#7B5EA7",
										margin: "2px 0",
										fontWeight: 500,
									}}
								>
									{profile.zodiac}
								</p>
								<p style={{ fontSize: 13, color: "#1A1A1A", margin: "2px 0" }}>
									{profile.profession}
								</p>
							</div>

							{/* Action Icons */}
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: 8,
									flexShrink: 0,
								}}
							>
								<button
									onClick={() => navigate("/messages")}
									style={{
										width: 36,
										height: 36,
										borderRadius: "50%",
										backgroundColor: "#F5F5F5",
										border: "none",
										cursor: "pointer",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<svg
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="#1A1A1A"
									>
										<path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6v-2h14v2zm0-3H6V9h14v2zm0-3H6V6h14v2z" />
									</svg>
								</button>
								<button
									onClick={() => toggleLike(profile.id)}
									style={{
										width: 36,
										height: 36,
										borderRadius: "50%",
										backgroundColor: likedProfiles[profile.id]
											? "#FF6B6B"
											: "#F5F5F5",
										border: "none",
										cursor: "pointer",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<svg
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill={likedProfiles[profile.id] ? "white" : "#1A1A1A"}
									>
										<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
									</svg>
								</button>
								<button
									style={{
										width: 36,
										height: 36,
										borderRadius: "50%",
										backgroundColor: "#F5F5F5",
										border: "none",
										cursor: "pointer",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<svg
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="#1A1A1A"
									>
										<path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h16v6z" />
									</svg>
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
