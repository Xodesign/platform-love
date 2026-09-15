import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api.js";

const LOGO_URL =
	"https://storage.yandexcloud.net/promto-user-static-sites-prod/design-assets/909022946/8c7e6951-480b-46d6-8680-2024c7503c12/8f62e6d4-fe4e-433f-b1fa-8360fa65021d-logo.png";

const DEMO_WALL = [
	{
		id: 1,
		author: "Анна",
		avatar: null,
		time: "2 часа назад",
		text: "Отличная погода сегодня! Кто хочет прогуляться по парку? 🌸",
		likes: 24,
		comments: 5,
	},
	{
		id: 2,
		author: "Игорь",
		avatar: null,
		time: "4 часа назад",
		text: "Наконец-то закончил ремонт в квартире! Теперь у меня есть отдельный кабинет для работы.",
		likes: 45,
		comments: 12,
	},
	{
		id: 3,
		author: "Дмитрий",
		avatar: null,
		time: "6 часов назад",
		text: "Ищу компанию для похода в горы на следующих выходных. Есть желающие? ⛰️",
		likes: 18,
		comments: 8,
	},
	{
		id: 4,
		author: "Елена",
		avatar: null,
		time: "вчера",
		text: "Учусь готовить итальянскую пасту. Получается недурно! 🍝",
		likes: 67,
		comments: 15,
	},
];

export default function WallScreen() {
	const navigate = useNavigate();
	const [likedPosts, setLikedPosts] = useState({});
	const [wallPosts, setWallPosts] = useState(DEMO_WALL);

	useEffect(() => {
		api
			.getMyPosts()
			.then((posts) => {
				if (Array.isArray(posts) && posts.length) {
					setWallPosts(
						posts.map((p) => ({
							id: p.id,
							author: p.name,
							avatar: p.photos?.[0] || null,
							time: p.time,
							text: p.text,
							likes: p.likes,
							comments: 0,
						})),
					);
				}
			})
			.catch(() => {});
	}, []);

	const toggleLike = (postId) => {
		setLikedPosts((prev) => ({
			...prev,
			[postId]: !prev[postId],
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
				<h1
					style={{
						fontSize: 24,
						fontWeight: 700,
						color: "#1A1A1A",
						margin: "0 0 16px",
					}}
				>
					Стена
				</h1>

				{wallPosts.map((post) => (
					<div
						key={post.id}
						style={{
							backgroundColor: "white",
							borderRadius: 16,
							padding: 16,
							marginBottom: 16,
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
									backgroundColor: "#E8E8E8",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<svg width="24" height="24" viewBox="0 0 24 24" fill="#AAAAAA">
									<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
								</svg>
							</div>
							<div>
								<p
									style={{
										fontSize: 16,
										fontWeight: 600,
										color: "#1A1A1A",
										margin: 0,
									}}
								>
									{post.author}
								</p>
								<p style={{ fontSize: 12, color: "#8E8E8E", margin: 0 }}>
									{post.time}
								</p>
							</div>
						</div>

						<p
							style={{
								fontSize: 14,
								color: "#1A1A1A",
								lineHeight: 1.6,
								margin: "0 0 12px",
							}}
						>
							{post.text}
						</p>

						<div
							style={{
								display: "flex",
								gap: 16,
								borderTop: "1px solid #F0F0F0",
								paddingTop: 12,
							}}
						>
							<button
								onClick={() => toggleLike(post.id)}
								style={{
									display: "flex",
									alignItems: "center",
									gap: 6,
									backgroundColor: "transparent",
									border: "none",
									cursor: "pointer",
									color: likedPosts[post.id] ? "#FF6B6B" : "#8E8E8E",
									fontSize: 14,
								}}
							>
								<span style={{ fontSize: 18 }}>
									{likedPosts[post.id] ? "❤️" : "🤍"}
								</span>
								<span>{post.likes + (likedPosts[post.id] ? 1 : 0)}</span>
							</button>
							<button
								style={{
									display: "flex",
									alignItems: "center",
									gap: 6,
									backgroundColor: "transparent",
									border: "none",
									cursor: "pointer",
									color: "#8E8E8E",
									fontSize: 14,
								}}
							>
								💬 {post.comments}
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
