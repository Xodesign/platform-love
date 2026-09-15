import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";

const initialOrders = [
	{
		id: 1,
		customer: "Анна Иванова",
		customerId: 101,
		recipient: "Мария Петрова",
		bouquet: "Розы и пионы",
		budget: 5000,
		status: "new",
		date: "26.06.2026",
		time: "14:30",
		deliveryAddress: "ул. Ленина, 15",
		phone: "+7 999 123-45-67",
		paymentMethod: "Карта",
		isPaid: true,
	},
	{
		id: 2,
		customer: "Сергей Козлов",
		customerId: 102,
		recipient: "Елена Смирнова",
		bouquet: "Орхидеи",
		budget: 8500,
		status: "in_progress",
		date: "26.06.2026",
		time: "11:15",
		deliveryAddress: "ул. Пушкина, 22",
		phone: "+7 999 234-56-78",
		paymentMethod: "Карта",
		isPaid: true,
	},
	{
		id: 3,
		customer: "Дмитрий Орлов",
		customerId: 103,
		recipient: "Ольга Волкова",
		bouquet: "Тюльпаны",
		budget: 3200,
		status: "rejected",
		date: "25.06.2026",
		time: "16:45",
		deliveryAddress: "ул. Чехова, 8",
		phone: "+7 999 345-67-89",
		paymentMethod: "Наличные",
		isPaid: false,
	},
	{
		id: 4,
		customer: "Алексей Соколов",
		customerId: 104,
		recipient: "Наталья Козлова",
		bouquet: "Смешанный букет",
		budget: 7200,
		status: "completed",
		date: "24.06.2026",
		time: "10:00",
		deliveryAddress: "ул. Гоголя, 5",
		phone: "+7 999 456-78-90",
		paymentMethod: "Карта",
		isPaid: true,
	},
];

const statusLabels = {
	new: { label: "Новый", color: "#F5C542", bg: "#FFF9E6" },
	in_progress: { label: "В работе", color: "#5B8DB8", bg: "#E8F4FF" },
	rejected: { label: "Отклонён", color: "#FF6B6B", bg: "#FFEBEB" },
	completed: { label: "Выполнен", color: "#4CAF50", bg: "#E8F5E9" },
};

export default function AdminOrdersScreen() {
	const navigate = useNavigate();
	const [orders, setOrders] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");

	const load = useCallback(async () => {
		try {
			setOrders(await api.adminOrders());
		} catch {
			setOrders(initialOrders);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);
	const [statusFilter, setStatusFilter] = useState("");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");

	// Фильтрация
	const filteredOrders = orders.filter((order) => {
		const matchesSearch =
			order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
			order.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
			order.bouquet.toLowerCase().includes(searchQuery.toLowerCase()) ||
			order.id.toString().includes(searchQuery);

		const matchesStatus = !statusFilter || order.status === statusFilter;

		return matchesSearch && matchesStatus;
	});

	// Статистика
	const stats = {
		total: orders.length,
		new: orders.filter((o) => o.status === "new").length,
		inProgress: orders.filter((o) => o.status === "in_progress").length,
		completed: orders.filter((o) => o.status === "completed").length,
		totalIncome: orders
			.filter((o) => o.isPaid)
			.reduce((sum, o) => sum + o.budget, 0),
	};

	const formatPrice = (price) => {
		return new Intl.NumberFormat("ru-RU").format(price) + " ₽";
	};

	return (
		<div>
			{/* Header */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 24,
					flexWrap: "wrap",
					gap: 12,
				}}
			>
				<h3
					style={{ fontSize: 20, fontWeight: 600, color: "#1A1A1A", margin: 0 }}
				>
					Заказы на доставку цветов
				</h3>
				<button
					style={{
						padding: "10px 16px",
						borderRadius: 10,
						backgroundColor: "#4CAF50",
						border: "none",
						color: "white",
						fontSize: 14,
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						gap: 8,
					}}
				>
					📊 Экспорт в Excel
				</button>
			</div>

			{/* Stats Cards */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
					gap: 12,
					marginBottom: 24,
				}}
			>
				<div
					style={{
						backgroundColor: "#FFF9E6",
						borderRadius: 12,
						padding: 16,
						textAlign: "center",
					}}
				>
					<div style={{ fontSize: 28, fontWeight: 700, color: "#F5C542" }}>
						{stats.new}
					</div>
					<div style={{ fontSize: 12, color: "#8E8E8E" }}>Новые</div>
				</div>
				<div
					style={{
						backgroundColor: "#E8F4FF",
						borderRadius: 12,
						padding: 16,
						textAlign: "center",
					}}
				>
					<div style={{ fontSize: 28, fontWeight: 700, color: "#5B8DB8" }}>
						{stats.inProgress}
					</div>
					<div style={{ fontSize: 12, color: "#8E8E8E" }}>В работе</div>
				</div>
				<div
					style={{
						backgroundColor: "#E8F5E9",
						borderRadius: 12,
						padding: 16,
						textAlign: "center",
					}}
				>
					<div style={{ fontSize: 28, fontWeight: 700, color: "#4CAF50" }}>
						{stats.completed}
					</div>
					<div style={{ fontSize: 12, color: "#8E8E8E" }}>Выполнено</div>
				</div>
				<div
					style={{
						backgroundColor: "#F3E8FF",
						borderRadius: 12,
						padding: 16,
						textAlign: "center",
					}}
				>
					<div style={{ fontSize: 24, fontWeight: 700, color: "#7B5EA7" }}>
						{formatPrice(stats.totalIncome)}
					</div>
					<div style={{ fontSize: 12, color: "#8E8E8E" }}>Оплачено</div>
				</div>
			</div>

			{/* Filters */}
			<div
				style={{
					backgroundColor: "white",
					borderRadius: 12,
					padding: 16,
					marginBottom: 16,
					boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
				}}
			>
				<div
					style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}
				>
					<div style={{ position: "relative" }}>
						<input
							type="text"
							placeholder="Поиск по заказчику, получателю, букету или ID..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							style={{
								width: "100%",
								padding: "12px 16px 12px 44px",
								borderRadius: 10,
								border: "1px solid #E0E0E0",
								fontSize: 14,
								outline: "none",
								boxSizing: "border-box",
							}}
						/>
						<span
							style={{
								position: "absolute",
								left: 16,
								top: "50%",
								transform: "translateY(-50%)",
								fontSize: 18,
							}}
						>
							🔍
						</span>
					</div>
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value)}
						style={{
							padding: "12px 16px",
							borderRadius: 10,
							border: "1px solid #E0E0E0",
							fontSize: 14,
							outline: "none",
							backgroundColor: "white",
							minWidth: 150,
						}}
					>
						<option value="">Все статусы</option>
						<option value="new">🟡 Новые</option>
						<option value="in_progress">🔵 В работе</option>
						<option value="completed">🟢 Выполнено</option>
						<option value="rejected">🔴 Отклонено</option>
					</select>
				</div>
			</div>

			{/* Desktop Table */}
			<div
				className="desktop-table"
				style={{
					backgroundColor: "white",
					borderRadius: 12,
					overflow: "hidden",
					boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
				}}
			>
				<table style={{ width: "100%", borderCollapse: "collapse" }}>
					<thead>
						<tr style={{ backgroundColor: "#F5F5F7" }}>
							<th style={thStyle}>#</th>
							<th style={thStyle}>Заказчик</th>
							<th style={thStyle}>Получатель</th>
							<th style={thStyle}>Букет</th>
							<th style={thStyle}>Сумма</th>
							<th style={thStyle}>Дата</th>
							<th style={thStyle}>Статус</th>
							<th style={thStyle}>Опл.</th>
							<th style={thStyle}>Действия</th>
						</tr>
					</thead>
					<tbody>
						{filteredOrders.map((order) => (
							<tr
								key={order.id}
								style={{ borderBottom: "1px solid #F0F0F0", cursor: "pointer" }}
								onClick={() => navigate(`/admin/orders/${order.id}`)}
							>
								<td style={tdStyle}>#{order.id}</td>
								<td style={tdStyle}>
									<div>
										<div style={{ fontWeight: 500 }}>{order.customer}</div>
										<div style={{ fontSize: 11, color: "#8E8E8E" }}>
											{order.phone}
										</div>
									</div>
								</td>
								<td style={tdStyle}>
									<div>
										<div>{order.recipient}</div>
										<div style={{ fontSize: 11, color: "#8E8E8E" }}>
											{order.deliveryAddress}
										</div>
									</div>
								</td>
								<td style={tdStyle}>{order.bouquet}</td>
								<td style={{ ...tdStyle, fontWeight: 600, color: "#7B5EA7" }}>
									{formatPrice(order.budget)}
								</td>
								<td style={tdStyle}>
									<div>{order.date}</div>
									<div style={{ fontSize: 11, color: "#8E8E8E" }}>
										{order.time}
									</div>
								</td>
								<td style={tdStyle}>
									<span
										style={{
											padding: "4px 10px",
											borderRadius: 12,
											fontSize: 12,
											fontWeight: 500,
											backgroundColor: statusLabels[order.status].bg,
											color: statusLabels[order.status].color,
										}}
									>
										{statusLabels[order.status].label}
									</span>
								</td>
								<td style={tdStyle}>
									<span
										style={{
											padding: "4px 8px",
											borderRadius: 6,
											fontSize: 11,
											fontWeight: 500,
											backgroundColor: order.isPaid ? "#E8F5E9" : "#FFEBEB",
											color: order.isPaid ? "#4CAF50" : "#FF6B6B",
										}}
									>
										{order.isPaid ? "✓" : "✗"}
									</span>
								</td>
								<td style={tdStyle}>
									<button
										onClick={(e) => {
											e.stopPropagation();
											navigate(`/admin/orders/${order.id}`);
										}}
										style={{
											padding: "6px 12px",
											borderRadius: 6,
											backgroundColor: "#F3E8FF",
											border: "none",
											color: "#7B5EA7",
											fontSize: 13,
											cursor: "pointer",
										}}
									>
										Открыть
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				{filteredOrders.length === 0 && (
					<div style={{ padding: 40, textAlign: "center", color: "#8E8E8E" }}>
						Заказы не найдены
					</div>
				)}
			</div>

			{/* Mobile Cards */}
			<div className="mobile-cards" style={{ display: "none", gap: 12 }}>
				{filteredOrders.map((order) => (
					<div
						key={order.id}
						onClick={() => navigate(`/admin/orders/${order.id}`)}
						style={{
							backgroundColor: "white",
							borderRadius: 12,
							padding: 16,
							boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
							cursor: "pointer",
						}}
					>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								marginBottom: 12,
							}}
						>
							<span style={{ fontWeight: 700, color: "#1A1A1A" }}>
								#{order.id}
							</span>
							<span
								style={{
									padding: "4px 10px",
									borderRadius: 12,
									fontSize: 12,
									backgroundColor: statusLabels[order.status].bg,
									color: statusLabels[order.status].color,
								}}
							>
								{statusLabels[order.status].label}
							</span>
						</div>
						<div style={{ fontSize: 14, marginBottom: 4 }}>
							<strong>От:</strong> {order.customer}
						</div>
						<div style={{ fontSize: 14, marginBottom: 4 }}>
							<strong>Кому:</strong> {order.recipient}
						</div>
						<div style={{ fontSize: 14, marginBottom: 4 }}>
							<strong>Букет:</strong> {order.bouquet}
						</div>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								marginTop: 12,
							}}
						>
							<span style={{ fontSize: 18, fontWeight: 700, color: "#7B5EA7" }}>
								{formatPrice(order.budget)}
							</span>
							<span style={{ fontSize: 12, color: "#8E8E8E" }}>
								{order.date}
							</span>
						</div>
					</div>
				))}
			</div>

			<style>{`
        @media (max-width: 768px) {
          .desktop-table { display: none !important; }
          .mobile-cards { display: flex !important; flex-direction: column !important; }
        }
      `}</style>
		</div>
	);
}

const thStyle = {
	padding: "14px 16px",
	textAlign: "left",
	fontSize: 13,
	fontWeight: 600,
	color: "#8E8E8E",
};

const tdStyle = {
	padding: "14px 16px",
	fontSize: 14,
	color: "#1A1A1A",
	verticalAlign: "middle",
};
