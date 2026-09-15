import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api.js";

export default function AdminOrderDetailScreen() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [order, setOrder] = useState({ id, status: "new" });

	useEffect(() => {
		api
			.adminOrder(id)
			.then(setOrder)
			.catch(() => {});
	}, [id]);

	const handleAccept = async () => {
		const updated = await api.adminUpdateOrder(id, "in_progress");
		setOrder((prev) => ({ ...prev, ...updated, status: "in_progress" }));
		alert("Заявка принята в работу");
	};

	const handleReject = async () => {
		await api.adminUpdateOrder(id, "rejected");
		setOrder((prev) => ({ ...prev, status: "rejected" }));
		alert("Заявка отклонена. Средства возвращены заказчику.");
	};

	return (
		<div>
			<div style={{ marginBottom: 24 }}>
				<button
					onClick={() => navigate("/admin/orders")}
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
					← Назад к заказам
				</button>
				<h3
					style={{ fontSize: 22, fontWeight: 600, color: "#1A1A1A", margin: 0 }}
				>
					Заказ #{id}
				</h3>
			</div>

			<div
				style={{
					backgroundColor: "white",
					borderRadius: 12,
					padding: 24,
					boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
				}}
			>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(2, 1fr)",
						gap: 24,
					}}
				>
					<InfoBlock title="Профиль заказчика">
						<InfoRow label="Имя" value={order.customer} />
						<InfoRow label="Телефон" value={order.customerPhone} />
					</InfoBlock>

					<InfoBlock title="Профиль получателя">
						<InfoRow label="Имя" value={order.recipient} />
						<InfoRow label="Телефон" value={order.recipientPhone} />
						<InfoRow label="Адрес доставки" value={order.address} />
					</InfoBlock>

					<InfoBlock title="Информация по букету">
						<InfoRow label="Букет" value={order.bouquet} />
						<InfoRow label="Бюджет" value={order.budget} />
					</InfoBlock>

					<InfoBlock title="Пожелания">
						<InfoRow label="Текст открытки" value={order.cardText} />
						<InfoRow label="Пожелания" value={order.wishes} />
					</InfoBlock>
				</div>

				{order.status === "new" && (
					<div style={{ display: "flex", gap: 12, marginTop: 32 }}>
						<button
							onClick={handleAccept}
							style={{
								padding: "14px 32px",
								borderRadius: 10,
								backgroundColor: "#4CAF50",
								border: "none",
								color: "white",
								fontSize: 15,
								fontWeight: 600,
								cursor: "pointer",
							}}
						>
							Принять в работу
						</button>
						<button
							onClick={handleReject}
							style={{
								padding: "14px 32px",
								borderRadius: 10,
								backgroundColor: "white",
								border: "2px solid #FF6B6B",
								color: "#FF6B6B",
								fontSize: 15,
								fontWeight: 600,
								cursor: "pointer",
							}}
						>
							Отклонить заявку
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

function InfoBlock({ title, children }) {
	return (
		<div>
			<h4
				style={{
					fontSize: 14,
					fontWeight: 600,
					color: "#7B5EA7",
					margin: "0 0 12px",
				}}
			>
				{title}
			</h4>
			{children}
		</div>
	);
}

function InfoRow({ label, value }) {
	return (
		<div style={{ marginBottom: 10 }}>
			<p style={{ fontSize: 12, color: "#8E8E8E", margin: "0 0 2px" }}>
				{label}
			</p>
			<p style={{ fontSize: 15, color: "#1A1A1A", margin: 0 }}>{value}</p>
		</div>
	);
}
