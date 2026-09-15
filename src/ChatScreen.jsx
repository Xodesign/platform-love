import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "./api.js";

const LOGO_URL =
	"https://storage.yandexcloud.net/promto-user-static-sites-prod/design-assets/909022946/8c7e6951-480b-46d6-8680-2024c7503c12/8f62e6d4-fe4e-433f-b1fa-8360fa65021d-logo.png";

const TEMPLATE_MESSAGE = "Привет, хочу с тобой познакомиться!";

const EMOJIS = ["😂", "😡", "😮", "❤️", "💋", "👍", "👎", "✋"];

export default function ChatScreen() {
	const navigate = useNavigate();
	const { id: matchId } = useParams();
	const messagesEndRef = useRef(null);
	const pollRef = useRef(null);

	const [showMenu, setShowMenu] = useState(false);
	const [showEmoji, setShowEmoji] = useState(false);
	const [message, setMessage] = useState("");
	const [messages, setMessages] = useState([]);
	const [match, setMatch] = useState(null);
	const [hasSubscription, setHasSubscription] = useState(false);
	const [showNoSubscriptionAlert, setShowNoSubscriptionAlert] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [otherUserId, setOtherUserId] = useState(null);

	// Загружаем мэтч + сообщения + статус подписки при монтировании
	useEffect(() => {
		loadInitialData();
		return () => {
			if (pollRef.current) clearInterval(pollRef.current);
		};
	}, [matchId]);

	// Автоскролл при изменении сообщений
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const loadInitialData = async () => {
		try {
			setLoading(true);
			setError("");
			// Параллельно: мэтч, сообщения, подписка
			const [matchData, messagesData, subData] = await Promise.all([
				api.getMatch(matchId),
				api.getMessages(matchId),
				api.getSubscription().catch(() => ({ active: false })),
			]);
			setMatch(matchData);
			setMessages(messagesData || []);
			setHasSubscription(subData?.active || false);
			setOtherUserId(matchData?.other_user_id || null);

			// Поллинг новых сообщений каждые 5 секунд
			pollRef.current = setInterval(() => {
				api
					.getMessages(matchId)
					.then((data) => {
						setMessages(data || []);
					})
					.catch(() => {});
			}, 5000);
		} catch (err) {
			console.error("Chat load error:", err);
			setError(err.message || "Ошибка загрузки чата");
		} finally {
			setLoading(false);
		}
	};

	const sendMessage = async (text) => {
		const trimmed = text?.trim();
		if (!trimmed) return;

		try {
			await api.sendMessage(matchId, trimmed);
			setMessage("");
			// Перезагружаем сообщения сразу, чтобы видеть своё
			const updated = await api.getMessages(matchId);
			setMessages(updated || []);
		} catch (err) {
			console.error("Send error:", err);
		}
	};

	const sendTemplate = () => {
		sendMessage(TEMPLATE_MESSAGE);
	};

	const handleSend = () => {
		if (!hasSubscription) {
			setShowNoSubscriptionAlert(true);
			return;
		}
		sendMessage(message);
	};

	const handleDeleteMatch = async () => {
		if (!window.confirm("Удалить переписку? Это действие нельзя отменить."))
			return;
		try {
			await api.deleteMatch(matchId);
			navigate("/messages");
		} catch (err) {
			console.error("Delete match error:", err);
		}
		setShowMenu(false);
	};

	if (loading) {
		return (
			<div
				style={{
					height: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					color: "#8E8E8E",
				}}
			>
				Загрузка...
			</div>
		);
	}

	if (error) {
		return (
			<div
				style={{
					height: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flexDirection: "column",
					gap: 16,
					padding: 20,
				}}
			>
				<p style={{ color: "#FF6B6B" }}>{error}</p>
				<button
					onClick={() => navigate("/messages")}
					style={{
						padding: "12px 24px",
						backgroundColor: "#7B5EA7",
						color: "white",
						border: "none",
						borderRadius: 8,
						cursor: "pointer",
					}}
				>
					Назад к сообщениям
				</button>
			</div>
		);
	}

	const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
	const contactName = match?.other_user_name || "Собеседник";
	const contactPhotos = match?.other_user_photos || [];

	return (
		<div
			style={{
				minHeight: "100vh",
				backgroundColor: "#F5F5F5",
				fontFamily: "Inter, system-ui, sans-serif",
				paddingBottom: 180,
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
				<img src={LOGO_URL} alt="Logo" style={{ width: 80, height: "auto" }} />
				<button
					onClick={() => setShowMenu(!showMenu)}
					style={{
						backgroundColor: "transparent",
						border: "none",
						cursor: "pointer",
						padding: 8,
					}}
				>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="#1A1A1A">
						<path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
					</svg>
				</button>
			</div>

			{/* Menu Dropdown */}
			{showMenu && (
				<div
					style={{
						backgroundColor: "white",
						position: "absolute",
						top: 60,
						right: 16,
						borderRadius: 12,
						boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
						zIndex: 20,
						overflow: "hidden",
						width: 200,
					}}
				>
					<button
						onClick={handleDeleteMatch}
						style={{
							width: "100%",
							padding: "14px 16px",
							backgroundColor: "transparent",
							border: "none",
							display: "flex",
							alignItems: "center",
							gap: 12,
							cursor: "pointer",
							color: "#FF4444",
							fontSize: 14,
						}}
					>
						<span style={{ fontSize: 18 }}>🗑️</span>
						Удалить переписку
					</button>
				</div>
			)}

			{/* Contact Info */}
			<div
				style={{
					padding: 16,
					backgroundColor: "white",
					borderBottom: "1px solid #F0F0F0",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
					<div style={{ position: "relative" }}>
						{contactPhotos.length > 0 ? (
							<img
								src={contactPhotos[0]}
								alt={contactName}
								style={{
									width: 50,
									height: 50,
									borderRadius: "50%",
									objectFit: "cover",
								}}
							/>
						) : (
							<div
								style={{
									width: 50,
									height: 50,
									borderRadius: "50%",
									backgroundColor: "#E8E8E8",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<svg width="26" height="26" viewBox="0 0 24 24" fill="#AAAAAA">
									<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
								</svg>
							</div>
						)}
					</div>
					<div style={{ flex: 1 }}>
						<h3
							style={{
								fontSize: 16,
								fontWeight: 600,
								color: "#1A1A1A",
								margin: 0,
							}}
						>
							{contactName}
						</h3>
						{hasSubscription ? (
							<p
								style={{
									fontSize: 12,
									color: "#4CAF50",
									margin: "2px 0 0",
								}}
							>
								✓ Premium — без ограничений
							</p>
						) : (
							<p
								style={{
									fontSize: 12,
									color: "#8E8E8E",
									margin: "2px 0 0",
								}}
							>
								Бесплатный режим
							</p>
						)}
					</div>
				</div>
			</div>

			{/* Messages */}
			<div style={{ padding: 16, minHeight: 300 }}>
				{messages.length === 0 && (
					<div style={{ textAlign: "center", padding: 40, color: "#8E8E8E" }}>
						<p style={{ fontSize: 14 }}>Диалог только начался 👋</p>
						<button
							onClick={sendTemplate}
							style={{
								marginTop: 16,
								padding: "12px 24px",
								backgroundColor: "#7B5EA7",
								color: "white",
								border: "none",
								borderRadius: 24,
								fontSize: 14,
								fontWeight: 600,
								cursor: "pointer",
							}}
						>
							Отправить шаблон
						</button>
					</div>
				)}

				{messages.map((msg) => {
					const isMine = msg.sender_id === currentUser.id;
					return (
						<div
							key={msg.id}
							style={{
								display: "flex",
								justifyContent: isMine ? "flex-end" : "flex-start",
								marginBottom: 12,
							}}
						>
							<div
								style={{
									maxWidth: "75%",
									padding: "12px 16px",
									borderRadius: isMine
										? "20px 20px 4px 20px"
										: "20px 20px 20px 4px",
									backgroundColor: isMine ? "#7B5EA7" : "white",
									color: isMine ? "white" : "#1A1A1A",
									boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
								}}
							>
								<p style={{ margin: 0, fontSize: 14, lineHeight: 1.4 }}>
									{msg.text}
								</p>
								<span
									style={{
										fontSize: 10,
										color: isMine ? "rgba(255,255,255,0.7)" : "#8E8E8E",
										marginTop: 4,
										display: "block",
									}}
								>
									{new Date(
										msg.created_at.replace(" ", "T") + "Z",
									).toLocaleTimeString("ru-RU", {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</span>
							</div>
						</div>
					);
				})}
				<div ref={messagesEndRef} />
			</div>

			{/* No Subscription Alert */}
			{showNoSubscriptionAlert && (
				<div
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: "rgba(0,0,0,0.5)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 100,
						padding: 20,
					}}
				>
					<div
						style={{
							backgroundColor: "white",
							borderRadius: 20,
							padding: 24,
							width: "100%",
							maxWidth: 320,
							textAlign: "center",
						}}
					>
						<p
							style={{
								fontSize: 16,
								fontWeight: 600,
								color: "#1A1A1A",
								margin: "0 0 12px",
							}}
						>
							🚫 Для общения нужна подписка
						</p>
						<p
							style={{
								fontSize: 14,
								color: "#8E8E8E",
								margin: "0 0 20px",
							}}
						>
							Чтобы писать — купите Клубную подписку
						</p>
						<div style={{ display: "flex", gap: 12 }}>
							<button
								onClick={() => setShowNoSubscriptionAlert(false)}
								style={{
									flex: 1,
									padding: "14px 16px",
									borderRadius: 12,
									border: "1px solid #E8E8E8",
									backgroundColor: "white",
									fontSize: 14,
									fontWeight: 600,
									color: "#8E8E8E",
									cursor: "pointer",
								}}
							>
								Отмена
							</button>
							<button
								onClick={() => navigate("/subscription")}
								style={{
									flex: 1,
									padding: "14px 16px",
									borderRadius: 12,
									border: "none",
									backgroundColor: "#7B5EA7",
									fontSize: 14,
									fontWeight: 600,
									color: "white",
									cursor: "pointer",
								}}
							>
								Оформить
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Emoji Panel */}
			{showEmoji && (
				<div
					style={{
						position: "fixed",
						bottom: 160,
						left: 16,
						right: 16,
						backgroundColor: "white",
						borderRadius: 16,
						padding: 16,
						boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
						zIndex: 50,
					}}
				>
					<div
						style={{
							display: "flex",
							flexWrap: "wrap",
							gap: 12,
							justifyContent: "center",
						}}
					>
						{EMOJIS.map((emoji, index) => (
							<button
								key={index}
								onClick={() => {
									setMessage((prev) => prev + emoji);
									setShowEmoji(false);
								}}
								style={{
									width: 48,
									height: 48,
									borderRadius: 12,
									backgroundColor: "#F5F5F5",
									border: "none",
									fontSize: 24,
									cursor: "pointer",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								{emoji}
							</button>
						))}
					</div>
				</div>
			)}

			{/* Input Bar */}
			<div
				style={{
					position: "fixed",
					bottom: 80,
					left: 0,
					right: 0,
					backgroundColor: "white",
					padding: "12px 16px",
					boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
					display: "flex",
					alignItems: "center",
					gap: 12,
				}}
			>
				{hasSubscription && (
					<button
						onClick={() => setShowEmoji(!showEmoji)}
						style={{
							width: 44,
							height: 44,
							borderRadius: "50%",
							backgroundColor: showEmoji ? "#F3E8FF" : "#F5F5F5",
							border: "none",
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: 20,
						}}
					>
						😊
					</button>
				)}

				<input
					type="text"
					placeholder="Сообщение..."
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && handleSend()}
					style={{
						flex: 1,
						padding: "12px 16px",
						backgroundColor: "#F5F5F5",
						border: "1px solid #E8E8E8",
						borderRadius: 25,
						fontSize: 14,
						color: "#1A1A1A",
						outline: "none",
					}}
				/>
				<button
					onClick={handleSend}
					disabled={!message.trim()}
					style={{
						width: 44,
						height: 44,
						borderRadius: "50%",
						backgroundColor: message.trim() ? "#7B5EA7" : "#CCCCCC",
						border: "none",
						cursor: message.trim() ? "pointer" : "not-allowed",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="white">
						<path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
					</svg>
				</button>
			</div>
		</div>
	);
}
