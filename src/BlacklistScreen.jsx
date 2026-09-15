import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api.js";

const LOGO_URL =
	"https://storage.yandexcloud.net/promto-user-static-sites-prod/design-assets/909022946/8c7e6951-480b-46d6-8680-2024c7503c12/8f62e6d4-fe4e-433f-b1fa-8360fa65021d-logo.png";

const recentProfiles = [
	{ id: 1, name: "Иван", gender: "male" },
	{ id: 2, name: "Иван", gender: "male" },
	{ id: 3, name: "Павел", gender: "male" },
	{ id: 4, name: "Сидор", gender: "male" },
	{ id: 5, name: "Трофим", gender: "male" },
];

const blacklistProfiles = [
	{
		id: 1,
		name: "Марин Марин",
		gender: "Мужской",
		age: 37,
		status: "В браке",
		origin: "Производитель",
	},
	{
		id: 2,
		name: "Иван Петров",
		gender: "Мужской",
		age: 42,
		status: "В браке",
		origin: "Производитель",
	},
	{
		id: 3,
		name: "Сергей Козлов",
		gender: "Мужской",
		age: 35,
		status: "В браке",
		origin: "Производитель",
	},
];

export default function BlacklistScreen() {
	const navigate = useNavigate();
	const [blacklist, setBlacklist] = useState(blacklistProfiles);

	const loadBlacklist = useCallback(async () => {
		try {
			const data = await api.myBlacklist();
			if (Array.isArray(data)) {
				setBlacklist(
					data.map((b) => ({
						id: b.id,
						name: b.name || "Без имени",
						age: b.age ?? "—",
						gender: b.gender || "—",
						status:
							b.reason && b.reason !== "—"
								? `Причина: ${b.reason}`
								: "В чёрном списке",
						origin: b.location || "—",
					})),
				);
			}
		} catch {
			/* сервер недоступен — оставляем локальный список */
		}
	}, []);

	useEffect(() => {
		loadBlacklist();
	}, [loadBlacklist]);

	const removeFromBlacklist = async (id) => {
		try {
			await api.removeFromBlacklist(id);
			await loadBlacklist();
		} catch {
			setBlacklist((prev) => prev.filter((p) => p.id !== id));
		}
	};

	return (
		<div
			style={{
				minHeight: "100vh",
				backgroundColor: "#3A3A3A",
				fontFamily: "Inter, system-ui, sans-serif",
				paddingBottom: 120,
			}}
		>
			{/* Header */}
			<div
				style={{
					backgroundColor: "#3A3A3A",
					padding: "12px 16px",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
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
					<svg width="24" height="24" viewBox="0 0 24 24" fill="white">
						<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
					</svg>
				</button>
				<button
					style={{
						backgroundColor: "transparent",
						border: "none",
						cursor: "pointer",
						padding: 8,
					}}
				>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="white">
						<path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
					</svg>
				</button>
				<img src={LOGO_URL} alt="Logo" style={{ width: 80, height: "auto" }} />
				<button
					onClick={() => navigate("/user-profile")}
					style={{
						backgroundColor: "transparent",
						border: "none",
						cursor: "pointer",
						padding: 8,
					}}
				>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="white">
						<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
					</svg>
				</button>
				<button
					onClick={() => navigate("/menu")}
					style={{
						backgroundColor: "transparent",
						border: "none",
						cursor: "pointer",
						padding: 8,
					}}
				>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="white">
						<path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
					</svg>
				</button>
			</div>

			{/* Recent Section */}
			<div style={{ padding: "20px" }}>
				<h2
					style={{
						fontSize: 18,
						fontWeight: 600,
						color: "#FFFFFF",
						margin: "0 0 16px",
					}}
				>
					Недавние
				</h2>
				<div
					style={{
						display: "flex",
						gap: 16,
						overflowX: "auto",
						paddingBottom: 8,
					}}
				>
					{recentProfiles.map((profile) => (
						<div
							key={profile.id}
							style={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								minWidth: 70,
							}}
						>
							<div
								style={{
									width: 60,
									height: 60,
									borderRadius: "50%",
									background: "linear-gradient(135deg, #5B8DB8, #7BA7CC)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									overflow: "hidden",
								}}
							>
								<svg width="36" height="36" viewBox="0 0 24 24" fill="white">
									<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
								</svg>
							</div>
							<span
								style={{
									fontSize: 12,
									color: "#FFFFFF",
									marginTop: 8,
								}}
							>
								{profile.name}
							</span>
						</div>
					))}
				</div>
			</div>

			{/* Blacklist Section */}
			<div style={{ padding: "0 20px 20px" }}>
				<h2
					style={{
						fontSize: 18,
						fontWeight: 600,
						color: "#FFFFFF",
						margin: "0 0 16px",
					}}
				>
					Черный список
				</h2>
				<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
					{blacklist.map((profile) => (
						<div
							key={profile.id}
							style={{
								backgroundColor: "rgba(255, 255, 255, 0.1)",
								border: "2px solid #F5C542",
								borderRadius: 16,
								padding: 16,
								display: "flex",
								gap: 16,
								alignItems: "flex-start",
							}}
						>
							<div
								style={{
									width: 60,
									height: 60,
									borderRadius: "50%",
									background: "linear-gradient(135deg, #5B8DB8, #7BA7CC)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									overflow: "hidden",
									flexShrink: 0,
								}}
							>
								<svg width="36" height="36" viewBox="0 0 24 24" fill="white">
									<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
								</svg>
							</div>
							<div style={{ flex: 1 }}>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										marginBottom: 8,
									}}
								>
									<h3
										style={{
											fontSize: 16,
											fontWeight: 600,
											color: "#FFFFFF",
											margin: 0,
										}}
									>
										{profile.name}
									</h3>
									<button
										onClick={() => removeFromBlacklist(profile.id)}
										style={{
											backgroundColor: "transparent",
											border: "none",
											color: "#F5C542",
											cursor: "pointer",
											fontSize: 12,
											padding: 0,
										}}
									>
										Удалить
									</button>
								</div>
								<div
									style={{
										display: "grid",
										gridTemplateColumns: "80px 1fr",
										gap: "4px 8px",
									}}
								>
									<span style={{ fontSize: 13, color: "#B0B0B0" }}>Пол</span>
									<span style={{ fontSize: 13, color: "#FFFFFF" }}>
										{profile.gender}
									</span>
									<span style={{ fontSize: 13, color: "#B0B0B0" }}>
										Возраст
									</span>
									<span style={{ fontSize: 13, color: "#FFFFFF" }}>
										{profile.age} лет
									</span>
									<span style={{ fontSize: 13, color: "#B0B0B0" }}>Статус</span>
									<span style={{ fontSize: 13, color: "#FFFFFF" }}>
										{profile.status}
									</span>
									<span style={{ fontSize: 13, color: "#B0B0B0" }}>
										Происхождение
									</span>
									<span style={{ fontSize: 13, color: "#FFFFFF" }}>
										{profile.origin}
									</span>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
