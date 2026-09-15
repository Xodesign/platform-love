import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api.js";

const LOGO_URL =
	"https://storage.yandexcloud.net/promto-user-static-sites-prod/design-assets/909022946/8c7e6951-480b-46d6-8680-2024c7503c12/8f62e6d4-fe4e-433f-b1fa-8360fa65021d-logo.png";

const DEMO_LIKES = [
	{ id: 1, name: "Мария", age: 26, time: "только что", mutual: true },
	{ id: 2, name: "Алексей", age: 38, time: "5 мин назад", mutual: false },
];

export default function LikesScreen() {
	const navigate = useNavigate();
	const [sentLikes, setSentLikes] = useState({});
	const [likes, setLikes] = useState(DEMO_LIKES);

	useEffect(() => {
		api
			.incomingLikes()
			.then((data) => {
				if (Array.isArray(data) && data.length) {
					setLikes(
						data.map((x) => ({
							id: x.id,
							name: x.name,
							age: x.age,
							time: x.time,
							mutual: x.mutual,
							photos: x.photos,
						})),
					);
				}
			})
			.catch(() => {});
	}, []);

	const toggleLike = (id) => {
		setSentLikes((prev) => ({
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
						margin: "0 0 8px",
					}}
				>
					Симпатии
				</h1>
				<p style={{ fontSize: 14, color: "#8E8E8E", margin: "0 0 20px" }}>
					Люди, которые оценили вашу анкету
				</p>

				<div
					style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
				>
					{likes.map((like) => (
						<div
							key={like.id}
							style={{
								backgroundColor: "white",
								borderRadius: 16,
								padding: 12,
								boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
								textAlign: "center",
								position: "relative",
							}}
						>
							{like.mutual && (
								<div
									style={{
										position: "absolute",
										top: 8,
										right: 8,
										backgroundColor: "#7B5EA7",
										color: "white",
										padding: "2px 8px",
										borderRadius: 10,
										fontSize: 10,
									}}
								>
									Взаимно
								</div>
							)}
							<div
								style={{
									width: "100%",
									aspectRatio: "1",
									borderRadius: 12,
									backgroundColor: "#E8E8E8",
									marginBottom: 12,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<svg width="60" height="60" viewBox="0 0 24 24" fill="#AAAAAA">
									<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
								</svg>
							</div>
							<p
								style={{
									fontSize: 16,
									fontWeight: 600,
									color: "#1A1A1A",
									margin: 0,
								}}
							>
								{like.name}, {like.age}
							</p>
							<p
								style={{ fontSize: 12, color: "#8E8E8E", margin: "4px 0 8px" }}
							>
								{like.time}
							</p>
							<button
								onClick={() => toggleLike(like.id)}
								style={{
									width: "100%",
									padding: "8px 12px",
									borderRadius: 20,
									border: sentLikes[like.id] ? "none" : "2px solid #7B5EA7",
									backgroundColor: sentLikes[like.id]
										? "#7B5EA7"
										: "transparent",
									color: sentLikes[like.id] ? "white" : "#7B5EA7",
									fontSize: 14,
									fontWeight: 500,
									cursor: "pointer",
								}}
							>
								{sentLikes[like.id] ? "❤️ Отправлено" : "❤️ Лайкнуть"}
							</button>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
