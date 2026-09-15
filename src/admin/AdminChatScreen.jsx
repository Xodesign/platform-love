import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api.js";

const initialMessages = [
	{
		id: 1,
		sender: "user",
		text: "Здравствуйте, у меня вопрос по оплате",
		time: "10:30",
	},
	{
		id: 2,
		sender: "admin",
		text: "Здравствуйте! Опишите, пожалуйста, возникшую проблему.",
		time: "10:32",
	},
];

export default function AdminChatScreen() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [messages, setMessages] = useState([]);
	const [inputText, setInputText] = useState("");
	const fileInputRef = useRef(null);

	const load = useCallback(async () => {
		try {
			const data = await api.adminSupportMessages(id);
			setMessages(data.messages || []);
		} catch {
			setMessages(initialMessages);
		}
	}, [id]);

	useEffect(() => {
		load();
	}, [load]);

	const sendMessage = async () => {
		if (!inputText.trim()) return;
		await api.adminSendSupport(id, inputText);
		setInputText("");
		load();
	};

	const handleImageUpload = (e) => {
		const file = e.target.files[0];
		if (file) {
			const url = URL.createObjectURL(file);
			setMessages((prev) => [
				...prev,
				{
					id: Date.now(),
					sender: "admin",
					image: url,
					time: new Date().toLocaleTimeString("ru-RU", {
						hour: "2-digit",
						minute: "2-digit",
					}),
				},
			]);
		}
	};

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "calc(100vh - 140px)",
			}}
		>
			{/* Header */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: 20,
				}}
			>
				<div>
					<button
						onClick={() => navigate("/admin/support")}
						style={{
							backgroundColor: "transparent",
							border: "none",
							color: "#7B5EA7",
							cursor: "pointer",
							fontSize: 14,
							padding: 0,
							marginBottom: 8,
						}}
					>
						← Назад
					</button>
					<h3
						style={{
							fontSize: 20,
							fontWeight: 600,
							color: "#1A1A1A",
							margin: 0,
						}}
					>
						Чат с пользователем #{id}
					</h3>
				</div>
				<button
					onClick={() => navigate(`/admin/users/${id}`)}
					style={{
						padding: "8px 16px",
						borderRadius: 8,
						backgroundColor: "#F3E8FF",
						border: "none",
						color: "#7B5EA7",
						fontSize: 13,
						cursor: "pointer",
					}}
				>
					Карточка пользователя
				</button>
			</div>

			{/* Messages */}
			<div
				style={{
					flex: 1,
					backgroundColor: "white",
					borderRadius: 12,
					padding: 20,
					overflowY: "auto",
					boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
					marginBottom: 16,
				}}
			>
				{messages.map((msg) => (
					<div
						key={msg.id}
						style={{
							display: "flex",
							justifyContent:
								msg.sender === "admin" ? "flex-end" : "flex-start",
							marginBottom: 12,
						}}
					>
						<div
							style={{
								maxWidth: "70%",
								padding: "12px 16px",
								borderRadius: 16,
								backgroundColor: msg.sender === "admin" ? "#7B5EA7" : "#F0F0F0",
								color: msg.sender === "admin" ? "white" : "#1A1A1A",
								borderBottomRightRadius: msg.sender === "admin" ? 4 : 16,
								borderBottomLeftRadius: msg.sender === "admin" ? 16 : 4,
							}}
						>
							{msg.image && (
								<img
									src={msg.image}
									alt="uploaded"
									style={{
										maxWidth: 200,
										borderRadius: 8,
										marginBottom: msg.text ? 8 : 0,
									}}
								/>
							)}
							{msg.text && (
								<p style={{ margin: 0, fontSize: 14 }}>{msg.text}</p>
							)}
							<span
								style={{
									fontSize: 11,
									color:
										msg.sender === "admin"
											? "rgba(255,255,255,0.7)"
											: "#8E8E8E",
									display: "block",
									marginTop: 4,
									textAlign: "right",
								}}
							>
								{msg.time}
							</span>
						</div>
					</div>
				))}
			</div>

			{/* Input */}
			<div
				style={{
					display: "flex",
					gap: 12,
					alignItems: "center",
					backgroundColor: "white",
					padding: 16,
					borderRadius: 12,
					boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
				}}
			>
				<input
					type="file"
					accept="image/*"
					ref={fileInputRef}
					onChange={handleImageUpload}
					style={{ display: "none" }}
				/>
				<button
					onClick={() => fileInputRef.current?.click()}
					style={{
						width: 40,
						height: 40,
						borderRadius: "50%",
						backgroundColor: "#F3E8FF",
						border: "none",
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						fontSize: 18,
					}}
				>
					📎
				</button>
				<input
					type="text"
					value={inputText}
					onChange={(e) => setInputText(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && sendMessage()}
					placeholder="Введите сообщение..."
					style={{
						flex: 1,
						padding: "12px 16px",
						borderRadius: 24,
						border: "1px solid #E0E0E0",
						fontSize: 14,
						outline: "none",
					}}
				/>
				<button
					onClick={sendMessage}
					style={{
						padding: "12px 24px",
						borderRadius: 24,
						backgroundColor: "#7B5EA7",
						border: "none",
						color: "white",
						fontSize: 14,
						fontWeight: 600,
						cursor: "pointer",
					}}
				>
					Отправить
				</button>
			</div>
		</div>
	);
}
