import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api.js";

export default function AdminUserDetailScreen() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [user, setUser] = useState({ id });

	useEffect(() => {
		api
			.adminUser(id)
			.then(setUser)
			.catch(() => {});
	}, [id]);

	return (
		<div>
			<div style={{ marginBottom: 24 }}>
				<button
					onClick={() => navigate("/admin/users")}
					style={{
						backgroundColor: "transparent",
						border: "none",
						color: "#7B5EA7",
						cursor: "pointer",
						fontSize: 14,
						padding: 0,
						marginBottom: 12,
					}}
				>
					← Назад к пользователям
				</button>
				<h3
					style={{ fontSize: 22, fontWeight: 600, color: "#1A1A1A", margin: 0 }}
				>
					Профиль пользователя
				</h3>
			</div>

			<div
				style={{
					backgroundColor: "white",
					borderRadius: 12,
					padding: 32,
					boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
					maxWidth: 600,
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 20,
						marginBottom: 32,
					}}
				>
					<div
						style={{
							width: 80,
							height: 80,
							borderRadius: "50%",
							backgroundColor: "#7B5EA7",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							color: "white",
							fontSize: 28,
							fontWeight: 700,
						}}
					>
						{user.name.charAt(0)}
					</div>
					<div>
						<h2 style={{ margin: "0 0 4px", fontSize: 22, color: "#1A1A1A" }}>
							{user.name}
						</h2>
						<p style={{ margin: 0, color: "#8E8E8E" }}>{user.email}</p>
					</div>
				</div>

				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(2, 1fr)",
						gap: "16px 24px",
						marginBottom: 32,
					}}
				>
					<InfoRow label="Телефон" value={user.phone} />
					<InfoRow label="Возраст" value={`${user.age} лет`} />
					<InfoRow label="Город" value={user.city} />
					<InfoRow label="Социотип" value={user.sociotype} />
					<InfoRow
						label="Статус"
						value={user.status === "active" ? "Активен" : "Заблокирован"}
					/>
					<InfoRow label="Дата регистрации" value={user.registeredAt} />
				</div>

				<div style={{ display: "flex", gap: 12 }}>
					<button
						onClick={() => navigate(`/admin/chat/${user.id}`)}
						style={{
							padding: "12px 24px",
							borderRadius: 8,
							backgroundColor: "#7B5EA7",
							border: "none",
							color: "white",
							fontSize: 14,
							fontWeight: 600,
							cursor: "pointer",
						}}
					>
						Написать сообщение
					</button>
					<button
						style={{
							padding: "12px 24px",
							borderRadius: 8,
							backgroundColor: "white",
							border: "2px solid #FF6B6B",
							color: "#FF6B6B",
							fontSize: 14,
							fontWeight: 600,
							cursor: "pointer",
						}}
					>
						Заблокировать
					</button>
				</div>
			</div>
		</div>
	);
}

function InfoRow({ label, value }) {
	return (
		<div>
			<p style={{ fontSize: 12, color: "#8E8E8E", margin: "0 0 4px" }}>
				{label}
			</p>
			<p style={{ fontSize: 15, color: "#1A1A1A", margin: 0 }}>{value}</p>
		</div>
	);
}
