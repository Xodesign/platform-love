import { useNavigate } from "react-router-dom";

export default function AdminProfileScreen() {
	const navigate = useNavigate();

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
				Профиль администратора
			</h3>

			<div
				style={{
					backgroundColor: "white",
					borderRadius: 12,
					padding: 32,
					maxWidth: 500,
					boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
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
						А
					</div>
					<div>
						<h2 style={{ margin: "0 0 4px", fontSize: 22, color: "#1A1A1A" }}>
							Администратор
						</h2>
						<p style={{ margin: 0, color: "#8E8E8E" }}>admin@platformlove.ru</p>
					</div>
				</div>

				<div
					style={{
						display: "grid",
						gridTemplateColumns: "1fr",
						gap: 16,
						marginBottom: 32,
					}}
				>
					<InfoRow label="Роль" value="Главный администратор" />
					<InfoRow label="Статус" value="Активен" />
					<InfoRow label="Доступ к сообщениям" value="Без подписки" />
					<InfoRow label="Дата создания" value="01.01.2026" />
				</div>

				<button
					onClick={() => navigate("/admin/login")}
					style={{
						width: "100%",
						padding: "14px",
						borderRadius: 10,
						backgroundColor: "#7B5EA7",
						border: "none",
						color: "white",
						fontSize: 15,
						fontWeight: 600,
						cursor: "pointer",
					}}
				>
					Выйти из профиля
				</button>
			</div>
		</div>
	);
}

function InfoRow({ label, value }) {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "space-between",
				paddingBottom: 12,
				borderBottom: "1px solid #F0F0F0",
			}}
		>
			<span style={{ fontSize: 14, color: "#8E8E8E" }}>{label}</span>
			<span style={{ fontSize: 14, color: "#1A1A1A", fontWeight: 500 }}>
				{value}
			</span>
		</div>
	);
}
