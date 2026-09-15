import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api.js";

const LOGO_URL =
	"https://storage.yandexcloud.net/promto-user-static-sites-prod/design-assets/909022946/8c7e6951-480b-46d6-8680-2024c7503c12/8f62e6d4-fe4e-433f-b1fa-8360fa65021d-logo.png";

export default function MessagesScreen() {
	const navigate = useNavigate();
	const [matches, setMatches] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		loadMatches();
	}, []);

	const loadMatches = async () => {
		try {
			const data = await api.getMatches();
			setMatches(data || []);
		} catch (err) {
			console.error("Load matches error:", err);
		} finally {
			setLoading(false);
		}
	};

	const filteredMatches = matches.filter((m) =>
		(m.other_user_name || "").toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const formatTime = (iso) => {
		if (!iso) return "";
		const d = new Date(iso.replace(" ", "T") + "Z");
		const now = new Date();
		const diffMs = now - d;
		const diffDays = Math.floor(diffMs / 86400000);
		if (diffDays === 0) {
			return d.toLocaleTimeString("ru-RU", {
				hour: "2-digit",
				minute: "2-digit",
			});
		}
		if (diffDays === 1) return "вчера";
		if (diffDays < 7) return `${diffDays} дн назад`;
		return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
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
				<button
					onClick={loadMatches}
					style={{
						backgroundColor: "transparent",
						border: "none",
						cursor: "pointer",
						padding: 8,
					}}
					title="Обновить"
				>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="#1A1A1A">
						<path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
					</svg>
				</button>
			</div>

			{/* Search */}
			<div style={{ padding: "16px" }}>
				<div
					style={{
						backgroundColor: "white",
						borderRadius: 12,
						padding: "12px 16px",
						display: "flex",
						alignItems: "center",
						gap: 12,
						boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
					}}
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="#8E8E8E">
						<path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
					</svg>
					<input
						type="text"
						placeholder="Поиск чатов..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						style={{
							flex: 1,
							border: "none",
							backgroundColor: "transparent",
							fontSize: 15,
							color: "#1A1A1A",
							outline: "none",
						}}
					/>
				</div>
			</div>

			{/* Chat List */}
			<div style={{ padding: "0 16px" }}>
				<h2
					style={{
						fontSize: 14,
						color: "#8E8E8E",
						margin: "0 0 12px",
						fontWeight: 500,
					}}
				>
					Сообщения ({matches.length})
				</h2>

				{loading && (
					<p style={{ textAlign: "center", color: "#8E8E8E", padding: 40 }}>
						Загрузка...
					</p>
				)}

				{!loading && filteredMatches.length === 0 && (
					<div
						style={{
							textAlign: "center",
							padding: 40,
							color: "#8E8E8E",
						}}
					>
						<p style={{ fontSize: 14 }}>Нет диалогов</p>
						<p style={{ fontSize: 12, marginTop: 8 }}>
							Свайпайте и находите совпадения!
						</p>
					</div>
				)}

				{filteredMatches.map((chat) => (
					<div
						key={chat.id}
						onClick={() => navigate(`/chat/${chat.id}`)}
						style={{
							backgroundColor: "white",
							borderRadius: 16,
							padding: 16,
							marginBottom: 12,
							display: "flex",
							alignItems: "center",
							gap: 12,
							cursor: "pointer",
							boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
						}}
					>
						<div style={{ position: "relative" }}>
							{chat.other_user_photos && chat.other_user_photos.length > 0 ? (
								<img
									src={chat.other_user_photos[0]}
									alt={chat.other_user_name}
									style={{
										width: 56,
										height: 56,
										borderRadius: "50%",
										objectFit: "cover",
									}}
								/>
							) : (
								<div
									style={{
										width: 56,
										height: 56,
										borderRadius: "50%",
										backgroundColor: "#E8E8E8",
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
							)}
						</div>
						<div style={{ flex: 1, minWidth: 0 }}>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
								}}
							>
								<p
									style={{
										fontSize: 16,
										fontWeight: 600,
										color: "#1A1A1A",
										margin: 0,
									}}
								>
									{chat.other_user_name || "Без имени"}
								</p>
								<p style={{ fontSize: 12, color: "#8E8E8E", margin: 0 }}>
									{formatTime(chat.created_at)}
								</p>
							</div>
							<p
								style={{
									fontSize: 14,
									color: chat.unread_count > 0 ? "#1A1A1A" : "#8E8E8E",
									fontWeight: chat.unread_count > 0 ? 500 : 400,
									margin: "4px 0 0",
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
								}}
							>
								{chat.last_message || "Нет сообщений"}
							</p>
						</div>
						{chat.unread_count > 0 && (
							<div
								style={{
									backgroundColor: "#7B5EA7",
									color: "white",
									borderRadius: "50%",
									width: 24,
									height: 24,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontSize: 12,
									fontWeight: 600,
								}}
							>
								{chat.unread_count}
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
