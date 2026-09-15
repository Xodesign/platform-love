import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";

const initialChats = [
	{
		id: 1,
		user: "Анна Иванова",
		lastMessage: "Здравствуйте, у меня вопрос по оплате",
		unread: 2,
		time: "10:30",
	},
	{
		id: 2,
		user: "Сергей Козлов",
		lastMessage: "Не могу загрузить фото",
		unread: 0,
		time: "09:15",
	},
	{
		id: 3,
		user: "Мария Петрова",
		lastMessage: "Спасибо за помощь!",
		unread: 1,
		time: "Вчера",
	},
];

export default function AdminSupportScreen() {
	const navigate = useNavigate();
	const [chats, setChats] = useState([]);

	const load = useCallback(async () => {
		try {
			setChats(await api.adminSupport());
		} catch {
			setChats(initialChats);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	return (
		<div>
			<h3
				style={{
					fontSize: 20,
					fontWeight: 600,
					color: "#1A1A1A",
					margin: "0 0 24px",
				}}
			>
				Чаты поддержки
			</h3>

			<div
				style={{
					backgroundColor: "white",
					borderRadius: 12,
					overflow: "hidden",
					boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
				}}
			>
				{chats.map((chat, index) => (
					<div
						key={chat.id}
						onClick={() => navigate(`/admin/chat/${chat.id}`)}
						style={{
							display: "flex",
							alignItems: "center",
							gap: 16,
							padding: "16px 20px",
							borderBottom:
								index < chats.length - 1 ? "1px solid #F0F0F0" : "none",
							cursor: "pointer",
							transition: "background-color 0.2s",
						}}
						onMouseEnter={(e) =>
							(e.currentTarget.style.backgroundColor = "#F9F9FB")
						}
						onMouseLeave={(e) =>
							(e.currentTarget.style.backgroundColor = "white")
						}
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
								flexShrink: 0,
							}}
						>
							{chat.user.charAt(0)}
						</div>
						<div style={{ flex: 1, minWidth: 0 }}>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									marginBottom: 4,
								}}
							>
								<span
									style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A" }}
								>
									{chat.user}
								</span>
								<span style={{ fontSize: 12, color: "#8E8E8E" }}>
									{chat.time}
								</span>
							</div>
							<p
								style={{
									fontSize: 14,
									color: "#8E8E8E",
									margin: 0,
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
								}}
							>
								{chat.lastMessage}
							</p>
						</div>
						{chat.unread > 0 && (
							<div
								style={{
									width: 22,
									height: 22,
									borderRadius: "50%",
									backgroundColor: "#FF6B6B",
									color: "white",
									fontSize: 12,
									fontWeight: 600,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									flexShrink: 0,
								}}
							>
								{chat.unread}
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
