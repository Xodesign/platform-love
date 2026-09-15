import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api.js";

const LOGO_URL =
	"https://storage.yandexcloud.net/promto-user-static-sites-prod/design-assets/909022946/8c7e6951-480b-46d6-8680-2024c7503c12/8f62e6d4-fe4e-433f-b1fa-8360fa65021d-logo.png";

const stories = [
	{ id: 1, name: "Анна", viewed: true },
	{ id: 2, name: "Игорь", viewed: false },
	{ id: 3, name: "Елена", viewed: false },
	{ id: 4, name: "Дмитрий", viewed: true },
	{ id: 5, name: "Мария", viewed: false },
	{ id: 6, name: "Ольга", viewed: false },
	{ id: 7, name: "Алексей", viewed: false },
];

const DEMO_FEED = [
	{
		id: 1,
		name: "Игорь",
		age: 41,
		location: "Москва",
		distance: "10км",
		status: "family",
		hobbies: ["спорт", "путешествия", "автомобили"],
		zodiac: "Лев",
		height: 178,
		online: true,
		photos: 5,
	},
	{
		id: 2,
		name: "Анна",
		age: 28,
		location: "Санкт-Петербург",
		distance: "5км",
		status: "friendship",
		hobbies: ["йога", "книги", "кино"],
		zodiac: "Рыбы",
		height: 165,
		online: true,
		photos: 3,
	},
	{
		id: 3,
		name: "Дмитрий",
		age: 35,
		location: "Москва",
		distance: "15км",
		status: "trips",
		hobbies: ["горные лыжи", "походы", "фотография"],
		zodiac: "Стрелец",
		height: 182,
		online: false,
		photos: 8,
	},
	{
		id: 4,
		name: "Елена",
		age: 32,
		location: "Москва",
		distance: "3км",
		status: "meetings",
		hobbies: ["фитнес", "танцы", "путешествия"],
		zodiac: "Дева",
		height: 170,
		online: true,
		photos: 12,
	},
	{
		id: 5,
		name: "Алексей",
		age: 38,
		location: "Москва",
		distance: "8км",
		status: "family",
		hobbies: ["гольф", "автомобили", "книги"],
		zodiac: "Телец",
		height: 185,
		online: true,
		photos: 4,
	},
	{
		id: 6,
		name: "Мария",
		age: 26,
		location: "Подольск",
		distance: "12км",
		status: "friendship",
		hobbies: ["кулинария", "йога", "живопись"],
		zodiac: "Близнецы",
		height: 168,
		online: false,
		photos: 6,
	},
];

export default function FeedScreen() {
	const navigate = useNavigate();
	const [likedProfiles, setLikedProfiles] = useState({});
	const [feedProfiles, setFeedProfiles] = useState(DEMO_FEED);

	useEffect(() => {
		api
			.getPosts()
			.then((posts) => {
				if (Array.isArray(posts) && posts.length) {
					setFeedProfiles(
						posts.map((p) => ({
							id: p.id,
							name: p.name,
							age: p.age,
							location: p.location || "",
							distance: "1 км",
							online: true,
							photos: p.photos,
							text: p.text,
							likes: p.likes,
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
				<button
					onClick={() => navigate("/swipe")}
					style={{
						backgroundColor: "transparent",
						border: "none",
						cursor: "pointer",
						padding: 8,
						color: "#7B5EA7",
						fontSize: 12,
						fontWeight: 500,
					}}
				>
					Свайп
				</button>
			</div>

			{/* Stories Horizontal Scroll */}
			<div
				style={{
					backgroundColor: "white",
					padding: "12px 0",
					borderBottom: "1px solid #F0F0F0",
				}}
			>
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
					{stories.map((story) => (
						<div
							key={story.id}
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								gap: 6,
								minWidth: 60,
								cursor: "pointer",
							}}
						>
							<div
								style={{
									width: 64,
									height: 64,
									borderRadius: "50%",
									padding: 2,
									background: story.viewed
										? "linear-gradient(135deg, #E0E0E0, #BDBDBD)"
										: "linear-gradient(135deg, #7B5EA7, #B8A8D0)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<div
									style={{
										width: "100%",
										height: "100%",
										borderRadius: "50%",
										backgroundColor: "#E8E8E8",
										border: "3px solid white",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<svg
										width="28"
										height="28"
										viewBox="0 0 24 24"
										fill="#AAAAAA"
									>
										<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
									</svg>
								</div>
							</div>
							<span
								style={{ fontSize: 11, color: "#1A1A1A", textAlign: "center" }}
							>
								{story.name}
							</span>
						</div>
					))}
				</div>
			</div>

			{/* Filter Tabs */}
			<div
				style={{
					backgroundColor: "white",
					padding: "8px 16px",
					display: "flex",
					gap: 8,
					overflowX: "auto",
					scrollbarWidth: "none",
				}}
			>
				{["Все", "Онлайн", "Друзья", "Рядом", "Знакомства"].map((tab, i) => (
					<button
						key={i}
						style={{
							padding: "8px 16px",
							borderRadius: 20,
							border: "none",
							backgroundColor: i === 0 ? "#7B5EA7" : "#F5F5F5",
							color: i === 0 ? "white" : "#1A1A1A",
							fontSize: 13,
							fontWeight: 500,
							cursor: "pointer",
							whiteSpace: "nowrap",
						}}
					>
						{tab}
					</button>
				))}
			</div>

			{/* Profile Grid */}
			<div style={{ padding: 12 }}>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						gap: 12,
					}}
				>
					{feedProfiles.map((profile) => (
						<div
							key={profile.id}
							style={{
								backgroundColor: "white",
								borderRadius: 16,
								overflow: "hidden",
								boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
								position: "relative",
							}}
						>
							{/* Photo */}
							<div
								style={{
									width: "100%",
									aspectRatio: "1/1",
									background:
										"linear-gradient(135deg, #E8E8E8 0%, #D0D0D0 100%)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									position: "relative",
								}}
							>
								<svg width="60" height="60" viewBox="0 0 24 24" fill="#AAAAAA">
									<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
								</svg>

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
									<span
										style={{
											backgroundColor: profile.online
												? "#4CAF50"
												: "rgba(0,0,0,0.5)",
											color: "white",
											padding: "2px 8px",
											borderRadius: 10,
											fontSize: 10,
											fontWeight: 500,
										}}
									>
										{profile.online ? "онлайн" : ""}
									</span>
									<span
										style={{
											backgroundColor: "rgba(0,0,0,0.5)",
											color: "white",
											padding: "2px 8px",
											borderRadius: 10,
											fontSize: 10,
										}}
									>
										📷 {profile.photos}
									</span>
								</div>

								{/* Like Button */}
								<button
									onClick={() => toggleLike(profile.id)}
									style={{
										position: "absolute",
										bottom: 8,
										right: 8,
										width: 32,
										height: 32,
										borderRadius: "50%",
										backgroundColor: likedProfiles[profile.id]
											? "#FF6B6B"
											: "rgba(255,255,255,0.9)",
										border: "none",
										cursor: "pointer",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
									}}
								>
									<span style={{ fontSize: 16 }}>
										{likedProfiles[profile.id] ? "❤️" : "🤍"}
									</span>
								</button>
							</div>

							{/* Info */}
							<div style={{ padding: "10px 12px" }}>
								<h3
									style={{
										fontSize: 14,
										fontWeight: 600,
										color: "#1A1A1A",
										margin: 0,
									}}
								>
									{profile.name}, {profile.age}
								</h3>
								<p
									style={{ fontSize: 11, color: "#8E8E8E", margin: "2px 0 0" }}
								>
									{profile.location} • {profile.distance}
								</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
