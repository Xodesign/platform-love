import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api.js";

const LOGO_URL =
	"https://storage.yandexcloud.net/promto-user-static-sites-prod/design-assets/909022946/8c7e6951-480b-46d6-8680-2024c7503c12/8f62e6d4-fe4e-433f-b1fa-8360fa65021d-logo.png";

export default function SettingsScreen() {
	const navigate = useNavigate();
	const [toggles, setToggles] = useState({
		freeze: false,
		messages: false,
		codeWord: true,
		deleteProfile: false,
	});
	const [userId, setUserId] = useState(null);
	// null = ещё не спросили, "" = почта не привязана
	const [email, setEmail] = useState(null);

	// Загружаем текущее состояние is_frozen с сервера при mount
	useEffect(() => {
		const stored = localStorage.getItem("user");
		if (!stored) return;
		try {
			const user = JSON.parse(stored);
			setUserId(user.id);
			setEmail(user.email || "");
			api
				.getUser(user.id)
				.then((u) => {
					setToggles((prev) => ({ ...prev, freeze: !!u.is_frozen }));
				})
				.catch(() => {});
			// Почту берём из auth/me: GET /users/:id отдаёт анкету, а не учётные
			// данные, и email там можно подделать в чужой карточке
			api
				.getMe()
				.then((u) => setEmail(u.email || ""))
				.catch(() => {});
		} catch {}
	}, []);

	const toggleSetting = (key) => {
		const newValue = !toggles[key];
		setToggles((prev) => ({
			...prev,
			[key]: newValue,
		}));
		// Заморозку сохраняем на сервере
		if (key === "freeze" && userId) {
			api
				.updateUser(userId, { is_frozen: newValue })
				.catch((err) => console.error("Freeze toggle error:", err));
		}
	};

	return (
		<div
			style={{
				minHeight: "100vh",
				backgroundColor: "#F5F5F5",
				fontFamily: "Inter, system-ui, sans-serif",
				paddingBottom: 120,
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
					onClick={() => navigate("/settings")}
					style={{
						backgroundColor: "transparent",
						border: "none",
						cursor: "pointer",
						padding: 8,
					}}
				>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="#1A1A1A">
						<path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
					</svg>
				</button>
			</div>

			{/* Settings Content */}
			<div style={{ padding: 20 }}>
				{/* Без почты доступ не восстановить — напоминаем только если её нет */}
				{email === "" && (
					<div
						onClick={() => navigate("/email")}
						style={{
							backgroundColor: "#FFF4E5",
							borderRadius: 16,
							padding: "14px 16px",
							marginBottom: 16,
							cursor: "pointer",
						}}
					>
						<p style={{ margin: 0, fontSize: 13, color: "#8A5A00" }}>
							К аккаунту не привязана почта. Добавьте её — иначе при забытом PIN
							мы не сможем вернуть доступ.
						</p>
					</div>
				)}

				{/* Toggle Label */}
				<p
					style={{
						fontSize: 12,
						color: "#8E8E8E",
						margin: "0 0 12px",
					}}
				>
					Выкл./Вкл.
				</p>

				{/* Settings List */}
				<div
					style={{
						backgroundColor: "white",
						borderRadius: 16,
						overflow: "hidden",
						boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
					}}
				>
					{/* Использовать заморозку */}
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							padding: "16px 20px",
							borderBottom: "1px solid #F0F0F0",
						}}
					>
						<span style={{ fontSize: 15, color: "#1A1A1A" }}>
							Использовать заморозку
						</span>
						<button
							onClick={() => toggleSetting("freeze")}
							style={{
								width: 50,
								height: 28,
								borderRadius: 14,
								backgroundColor: toggles.freeze ? "#7B5EA7" : "#E0E0E0",
								border: "none",
								cursor: "pointer",
								position: "relative",
								transition: "background-color 0.2s",
							}}
						>
							<div
								style={{
									width: 22,
									height: 22,
									borderRadius: "50%",
									backgroundColor: "white",
									position: "absolute",
									top: 3,
									left: toggles.freeze ? 25 : 3,
									transition: "left 0.2s",
									boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
								}}
							/>
						</button>
					</div>

					{/* Электронные сообщения */}
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							padding: "16px 20px",
							borderBottom: "1px solid #F0F0F0",
						}}
					>
						<span style={{ fontSize: 15, color: "#1A1A1A" }}>
							Электронные сообщения
						</span>
						<button
							onClick={() => toggleSetting("messages")}
							style={{
								width: 50,
								height: 28,
								borderRadius: 14,
								backgroundColor: toggles.messages ? "#7B5EA7" : "#E0E0E0",
								border: "none",
								cursor: "pointer",
								position: "relative",
								transition: "background-color 0.2s",
							}}
						>
							<div
								style={{
									width: 22,
									height: 22,
									borderRadius: "50%",
									backgroundColor: "white",
									position: "absolute",
									top: 3,
									left: toggles.messages ? 25 : 3,
									transition: "left 0.2s",
									boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
								}}
							/>
						</button>
					</div>

					{/* Сменить кодовое слово */}
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							padding: "16px 20px",
							borderBottom: "1px solid #F0F0F0",
						}}
					>
						<span style={{ fontSize: 15, color: "#1A1A1A" }}>
							Сменить кодовое слово
						</span>
						<button
							onClick={() => toggleSetting("codeWord")}
							style={{
								width: 50,
								height: 28,
								borderRadius: 14,
								backgroundColor: toggles.codeWord ? "#7B5EA7" : "#E0E0E0",
								border: "none",
								cursor: "pointer",
								position: "relative",
								transition: "background-color 0.2s",
							}}
						>
							<div
								style={{
									width: 22,
									height: 22,
									borderRadius: "50%",
									backgroundColor: "white",
									position: "absolute",
									top: 3,
									left: toggles.codeWord ? 25 : 3,
									transition: "left 0.2s",
									boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
								}}
							/>
						</button>
					</div>

					{/* Почта: посмотреть, добавить или сменить */}
					<div
						onClick={() => navigate("/email")}
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							padding: "16px 20px",
							borderBottom: "1px solid #F0F0F0",
							cursor: "pointer",
						}}
					>
						<div>
							<span style={{ fontSize: 15, color: "#1A1A1A" }}>
								Электронная почта
							</span>
							<p
								style={{
									fontSize: 12,
									color: email === null || email ? "#8E8E8E" : "#E53935",
									margin: "2px 0 0",
									wordBreak: "break-all",
								}}
							>
								{email === null ? "…" : email ? email : "не привязана"}
							</p>
						</div>
						<span style={{ fontSize: 18, color: "#8E8E8E" }}>›</span>
					</div>

					{/* Смена PIN — тот же экран, что и при первом входе */}
					<div
						onClick={() => navigate("/set-pin")}
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							padding: "16px 20px",
							cursor: "pointer",
						}}
					>
						<span style={{ fontSize: 15, color: "#1A1A1A" }}>
							Сменить PIN-код
						</span>
						<span style={{ fontSize: 18, color: "#8E8E8E" }}>›</span>
					</div>

					{/* Удалить анкету */}
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							padding: "16px 20px",
						}}
					>
						<span style={{ fontSize: 15, color: "#FF4444" }}>
							Удалить анкету
						</span>
						<button
							onClick={() => toggleSetting("deleteProfile")}
							style={{
								width: 50,
								height: 28,
								borderRadius: 14,
								backgroundColor: toggles.deleteProfile ? "#FF4444" : "#E0E0E0",
								border: "none",
								cursor: "pointer",
								position: "relative",
								transition: "background-color 0.2s",
							}}
						>
							<div
								style={{
									width: 22,
									height: 22,
									borderRadius: "50%",
									backgroundColor: "white",
									position: "absolute",
									top: 3,
									left: toggles.deleteProfile ? 25 : 3,
									transition: "left 0.2s",
									boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
								}}
							/>
						</button>
					</div>
				</div>

				{/* Club Subscription Button */}
				<button
					onClick={() => navigate("/subscription")}
					style={{
						width: "100%",
						marginTop: 24,
						padding: "16px",
						borderRadius: 12,
						backgroundColor: "#7B5EA7",
						border: "none",
						fontSize: 14,
						fontWeight: 600,
						color: "white",
						cursor: "pointer",
					}}
				>
					Клубная карта
				</button>

				{/* Exit Button */}
				<button
					onClick={async () => {
						await api.logout();
						localStorage.removeItem("user");
						navigate("/");
					}}
					style={{
						width: "100%",
						marginTop: 16,
						padding: "16px",
						borderRadius: 12,
						backgroundColor: "#7B5EA7",
						border: "none",
						fontSize: 16,
						fontWeight: 600,
						color: "white",
						cursor: "pointer",
						boxShadow: "0 4px 12px rgba(123, 94, 167, 0.3)",
					}}
				>
					Выйти
				</button>
			</div>
		</div>
	);
}
