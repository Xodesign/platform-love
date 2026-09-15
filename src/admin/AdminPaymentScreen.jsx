import { useState, useEffect, useCallback } from "react";
import api from "../api.js";

const initialSubscriptions = [
	{
		id: 1,
		name: "Basic",
		description: "Бесплатный тариф для знакомств",
		price: 0,
		period: "forever",
		features: ["3 супер-лайка в день", "20 свайпов в день", "Базовые фильтры"],
		isActive: true,
		color: "#8E8E8E",
		subscribers: 1247,
		revenue: 0,
	},
	{
		id: 2,
		name: "Premium",
		description: "Популярный выбор для серьёзных отношений",
		price: 399,
		oldPrice: 499,
		period: "month",
		features: [
			"Безлимитные лайки",
			"Видеть кто тебя лайкнул",
			"1 буст в месяц",
			"Без рекламы",
			"5 супер-лайков в день",
		],
		isActive: true,
		color: "#7B5EA7",
		subscribers: 423,
		revenue: 168777,
	},
	{
		id: 3,
		name: "Premium+",
		description: "Максимум возможностей для поиска пары",
		price: 699,
		period: "month",
		features: [
			"Все функции Premium",
			"5 бустов в месяц",
			"Приоритет в поиске",
			"Расширенные фильтры",
			"10 супер-лайков в день",
			"Невидимый режим",
		],
		isActive: true,
		color: "#F5C542",
		subscribers: 156,
		revenue: 109044,
	},
	{
		id: 4,
		name: "Love Bundle",
		description: "Всё включено + доставка цветов",
		price: 1499,
		period: "month",
		features: [
			"Все функции Premium+",
			"Доставка цветов со скидкой 20%",
			"Персональный менеджер",
			"VIP-поддержка 24/7",
			"Розы в подарок каждую неделю",
		],
		isActive: true,
		color: "#FF6B6B",
		subscribers: 34,
		revenue: 50966,
	},
];

const deliveryPricing = [
	{
		id: 1,
		name: "Букет до 5 км",
		price: 300,
		description: "Доставка в пределах 5 км от флористического салона",
	},
	{
		id: 2,
		name: "Букет 5-15 км",
		price: 500,
		description: "Доставка от 5 до 15 км",
	},
	{
		id: 3,
		name: "Букет 15-30 км",
		price: 800,
		description: "Доставка от 15 до 30 км",
	},
	{
		id: 4,
		name: "Срочная доставка",
		price: 500,
		description: "Доставка в течение 2 часов (+50% к стоимости букета)",
	},
];

const paymentMethods = [
	{
		id: "card",
		name: "Банковская карта",
		icon: "💳",
		commission: 2.5,
		isActive: true,
	},
	{
		id: "sbp",
		name: "СБП (Система быстрых платежей)",
		icon: "📱",
		commission: 0.5,
		isActive: true,
	},
	{
		id: "yookassa",
		name: "ЮKassa",
		icon: "🟡",
		commission: 3.5,
		isActive: true,
	},
	{
		id: "sberpay",
		name: "SberPay",
		icon: "🟢",
		commission: 1.5,
		isActive: true,
	},
];

const recentTransactions = [
	{
		id: "TXN-001",
		user: "Анна Иванова",
		amount: 399,
		type: "subscription",
		status: "success",
		date: "26.06.2026 14:32",
	},
	{
		id: "TXN-002",
		user: "Сергей Козлов",
		amount: 7500,
		type: "order",
		status: "success",
		date: "26.06.2026 13:15",
	},
	{
		id: "TXN-003",
		user: "Мария Петрова",
		amount: 1499,
		type: "subscription",
		status: "success",
		date: "26.06.2026 12:45",
	},
	{
		id: "TXN-004",
		user: "Дмитрий Орлов",
		amount: 5000,
		type: "order",
		status: "pending",
		date: "26.06.2026 11:20",
	},
	{
		id: "TXN-005",
		user: "Елена Смирнова",
		amount: 699,
		type: "subscription",
		status: "success",
		date: "26.06.2026 10:05",
	},
];

export default function AdminPaymentScreen() {
	const [subscriptions, setSubscriptions] = useState([]);
	const [deliveryPrices, setDeliveryPrices] = useState([]);
	const [tab, setTab] = useState("subscriptions");

	const load = useCallback(async () => {
		try {
			const data = await api.adminPayment();
			setSubscriptions(data.subscriptions || []);
			setDeliveryPrices(data.delivery || []);
		} catch {
			setSubscriptions(initialSubscriptions);
			setDeliveryPrices(deliveryPricing);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);
	const [editingPrice, setEditingPrice] = useState(null);
	const [tempPrice, setTempPrice] = useState("");
	const [saveMessage, setSaveMessage] = useState(false);

	// Статистика
	const stats = {
		totalRevenue: subscriptions.reduce((sum, s) => sum + s.revenue, 0),
		monthRevenue: 328787,
		subscribers: subscriptions.reduce((sum, s) => sum + s.subscribers, 0),
		conversion: "3.2%",
		avgOrderValue: 4250,
	};

	const handleEditPrice = (id, currentPrice) => {
		setEditingPrice(id);
		setTempPrice(currentPrice.toString());
	};

	const handleSavePrice = async (type, id) => {
		const newPrice = parseInt(tempPrice) || 0;

		if (type === "subscription") {
			const sub = subscriptions.find((s) => s.id === id);
			if (sub) await api.adminUpdatePlan(sub.key, { price: newPrice });
		} else {
			await api.adminUpdateDelivery(id, newPrice);
		}

		setEditingPrice(null);
		setSaveMessage(true);
		setTimeout(() => setSaveMessage(false), 3000);
		load();
	};

	const toggleSubscription = async (id) => {
		const sub = subscriptions.find((s) => s.id === id);
		if (sub) await api.adminUpdatePlan(sub.key, { isActive: !sub.isActive });
		load();
	};

	const togglePaymentMethod = (id) => {
		// Тут была бы логика переключения
	};

	const formatPrice = (price) => {
		return new Intl.NumberFormat("ru-RU").format(price) + " ₽";
	};

	const tabs = [
		{
			id: "subscriptions",
			label: "💎 Подписки",
			count: subscriptions.filter((s) => s.isActive).length,
		},
		{ id: "delivery", label: "🚚 Доставка", count: deliveryPricing.length },
		{
			id: "methods",
			label: "💳 Способы оплаты",
			count: paymentMethods.filter((m) => m.isActive).length,
		},
		{
			id: "transactions",
			label: "📊 Транзакции",
			count: recentTransactions.length,
		},
	];

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
					gap: 16,
				}}
			>
				<h3
					style={{ fontSize: 24, fontWeight: 700, color: "#1A1A1A", margin: 0 }}
				>
					💰 Оплата и тарифы
				</h3>
				{saveMessage && (
					<div
						style={{
							padding: "8px 16px",
							borderRadius: 8,
							backgroundColor: "#E8F5E9",
							color: "#4CAF50",
							fontSize: 14,
							fontWeight: 500,
							animation: "fadeIn 0.3s",
						}}
					>
						✓ Цена сохранена
					</div>
				)}
			</div>

			{/* Stats Cards */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
					gap: 16,
					marginBottom: 24,
				}}
			>
				<div
					style={{
						backgroundColor: "#E8F5E9",
						borderRadius: 16,
						padding: 20,
						borderLeft: "4px solid #4CAF50",
					}}
				>
					<div style={{ fontSize: 32, fontWeight: 700, color: "#4CAF50" }}>
						{formatPrice(stats.totalRevenue)}
					</div>
					<div style={{ fontSize: 13, color: "#8E8E8E", marginTop: 4 }}>
						Общий доход
					</div>
				</div>
				<div
					style={{
						backgroundColor: "#F3E8FF",
						borderRadius: 16,
						padding: 20,
						borderLeft: "4px solid #7B5EA7",
					}}
				>
					<div style={{ fontSize: 32, fontWeight: 700, color: "#7B5EA7" }}>
						{formatPrice(stats.monthRevenue)}
					</div>
					<div style={{ fontSize: 13, color: "#8E8E8E", marginTop: 4 }}>
						За этот месяц
					</div>
				</div>
				<div
					style={{
						backgroundColor: "#E8F4FF",
						borderRadius: 16,
						padding: 20,
						borderLeft: "4px solid #5B8DB8",
					}}
				>
					<div style={{ fontSize: 32, fontWeight: 700, color: "#5B8DB8" }}>
						{stats.subscribers.toLocaleString()}
					</div>
					<div style={{ fontSize: 13, color: "#8E8E8E", marginTop: 4 }}>
						Подписчиков
					</div>
				</div>
				<div
					style={{
						backgroundColor: "#FFF9E6",
						borderRadius: 16,
						padding: 20,
						borderLeft: "4px solid #F5C542",
					}}
				>
					<div style={{ fontSize: 32, fontWeight: 700, color: "#F5C542" }}>
						{stats.avgOrderValue.toLocaleString()} ₽
					</div>
					<div style={{ fontSize: 13, color: "#8E8E8E", marginTop: 4 }}>
						Средний заказ
					</div>
				</div>
			</div>

			{/* Tabs */}
			<div
				style={{
					display: "flex",
					gap: 8,
					marginBottom: 24,
					flexWrap: "wrap",
					borderBottom: "2px solid #F0F0F0",
					paddingBottom: 12,
				}}
			>
				{tabs.map((t) => (
					<button
						key={t.id}
						onClick={() => setTab(t.id)}
						style={{
							padding: "12px 20px",
							borderRadius: 10,
							border: "none",
							fontSize: 14,
							cursor: "pointer",
							backgroundColor: tab === t.id ? "#7B5EA7" : "transparent",
							color: tab === t.id ? "white" : "#8E8E8E",
							fontWeight: tab === t.id ? 600 : 400,
							transition: "all 0.2s",
						}}
					>
						{t.label}
					</button>
				))}
			</div>

			{/* Subscriptions Tab */}
			{tab === "subscriptions" && (
				<div>
					<p style={{ fontSize: 14, color: "#8E8E8E", marginBottom: 24 }}>
						Нажмите на цену, чтобы изменить её. Изменения вступят в силу
						немедленно.
					</p>
					<div style={{ display: "grid", gap: 20 }}>
						{subscriptions.map((sub) => (
							<div
								key={sub.id}
								style={{
									backgroundColor: "white",
									borderRadius: 20,
									padding: 24,
									boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
									borderLeft: `6px solid ${sub.color}`,
									opacity: sub.isActive ? 1 : 0.5,
								}}
							>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "flex-start",
										flexWrap: "wrap",
										gap: 16,
									}}
								>
									<div style={{ flex: 1, minWidth: 200 }}>
										<div
											style={{
												display: "flex",
												alignItems: "center",
												gap: 12,
												marginBottom: 8,
											}}
										>
											<h4
												style={{
													fontSize: 22,
													fontWeight: 700,
													color: "#1A1A1A",
													margin: 0,
												}}
											>
												{sub.name}
											</h4>
											<span
												style={{
													padding: "4px 12px",
													borderRadius: 20,
													backgroundColor: sub.isActive ? "#E8F5E9" : "#FFEBEB",
													color: sub.isActive ? "#4CAF50" : "#FF6B6B",
													fontSize: 12,
													fontWeight: 500,
												}}
											>
												{sub.isActive ? "Активен" : "Отключён"}
											</span>
										</div>
										<p
											style={{
												fontSize: 14,
												color: "#8E8E8E",
												margin: "0 0 16px",
											}}
										>
											{sub.description}
										</p>

										{/* Features */}
										<div
											style={{
												display: "flex",
												flexWrap: "wrap",
												gap: 8,
												marginBottom: 16,
											}}
										>
											{sub.features.map((feature, i) => (
												<span
													key={i}
													style={{
														padding: "6px 12px",
														borderRadius: 8,
														backgroundColor: "#F5F5F7",
														color: "#8E8E8E",
														fontSize: 13,
													}}
												>
													✓ {feature}
												</span>
											))}
										</div>

										{/* Stats */}
										<div style={{ display: "flex", gap: 24 }}>
											<div>
												<div
													style={{
														fontSize: 20,
														fontWeight: 700,
														color: "#1A1A1A",
													}}
												>
													{sub.subscribers.toLocaleString()}
												</div>
												<div style={{ fontSize: 12, color: "#8E8E8E" }}>
													подписчиков
												</div>
											</div>
											<div>
												<div
													style={{
														fontSize: 20,
														fontWeight: 700,
														color: "#4CAF50",
													}}
												>
													{formatPrice(sub.revenue)}
												</div>
												<div style={{ fontSize: 12, color: "#8E8E8E" }}>
													доход
												</div>
											</div>
										</div>
									</div>

									{/* Price Editor */}
									<div style={{ textAlign: "right" }}>
										{sub.oldPrice && (
											<div
												style={{
													fontSize: 16,
													color: "#8E8E8E",
													textDecoration: "line-through",
													marginBottom: 4,
												}}
											>
												{formatPrice(sub.oldPrice)}
											</div>
										)}
										{editingPrice === sub.id ? (
											<div
												style={{
													display: "flex",
													alignItems: "center",
													gap: 8,
												}}
											>
												<input
													type="number"
													value={tempPrice}
													onChange={(e) => setTempPrice(e.target.value)}
													style={{
														width: 100,
														padding: "10px 12px",
														borderRadius: 8,
														border: "2px solid #7B5EA7",
														fontSize: 20,
														fontWeight: 700,
														textAlign: "center",
														outline: "none",
													}}
													autoFocus
												/>
												<span style={{ fontSize: 16, color: "#8E8E8E" }}>
													₽
												</span>
												<button
													onClick={() =>
														handleSavePrice("subscription", sub.id)
													}
													style={{
														padding: "10px 16px",
														borderRadius: 8,
														backgroundColor: "#4CAF50",
														border: "none",
														color: "white",
														fontSize: 14,
														cursor: "pointer",
													}}
												>
													✓
												</button>
												<button
													onClick={() => setEditingPrice(null)}
													style={{
														padding: "10px",
														borderRadius: 8,
														backgroundColor: "#FFEBEB",
														border: "none",
														color: "#FF6B6B",
														fontSize: 14,
														cursor: "pointer",
													}}
												>
													✗
												</button>
											</div>
										) : (
											<div
												onClick={() =>
													sub.price > 0 && handleEditPrice(sub.id, sub.price)
												}
												style={{
													cursor: sub.price > 0 ? "pointer" : "default",
													padding: "8px 16px",
													borderRadius: 12,
													backgroundColor:
														sub.price > 0 ? `${sub.color}15` : "transparent",
													border:
														sub.price > 0 ? `2px dashed ${sub.color}` : "none",
													transition: "all 0.2s",
												}}
											>
												<div
													style={{
														fontSize: 32,
														fontWeight: 800,
														color: sub.color,
													}}
												>
													{sub.price === 0
														? "БЕСПЛАТНО"
														: formatPrice(sub.price)}
												</div>
												{sub.price > 0 && (
													<div
														style={{
															fontSize: 12,
															color: "#8E8E8E",
															marginTop: 4,
														}}
													>
														кликните для изменения
													</div>
												)}
											</div>
										)}
										<div
											style={{ fontSize: 12, color: "#8E8E8E", marginTop: 8 }}
										>
											{sub.period === "forever" ? "навсегда" : "в месяц"}
										</div>
									</div>
								</div>

								{/* Toggle */}
								<div
									style={{
										marginTop: 16,
										paddingTop: 16,
										borderTop: "1px solid #F0F0F0",
									}}
								>
									<label
										style={{
											display: "flex",
											alignItems: "center",
											gap: 12,
											cursor: "pointer",
										}}
									>
										<input
											type="checkbox"
											checked={sub.isActive}
											onChange={() => toggleSubscription(sub.id)}
											style={{ width: 22, height: 22, cursor: "pointer" }}
										/>
										<span style={{ fontSize: 14, color: "#1A1A1A" }}>
											Показывать пользователям
										</span>
									</label>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Delivery Tab */}
			{tab === "delivery" && (
				<div>
					<p style={{ fontSize: 14, color: "#8E8E8E", marginBottom: 24 }}>
						Настройте стоимость доставки букетов и подарков.
					</p>
					<div
						style={{
							backgroundColor: "white",
							borderRadius: 16,
							overflow: "hidden",
							boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
						}}
					>
						{deliveryPrices.map((item, i) => (
							<div
								key={item.id}
								style={{
									padding: 20,
									borderBottom:
										i < deliveryPrices.length - 1
											? "1px solid #F0F0F0"
											: "none",
								}}
							>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										flexWrap: "wrap",
										gap: 16,
									}}
								>
									<div style={{ flex: 1, minWidth: 200 }}>
										<h4
											style={{
												fontSize: 16,
												fontWeight: 600,
												color: "#1A1A1A",
												margin: "0 0 4px",
											}}
										>
											{item.name}
										</h4>
										<p style={{ fontSize: 13, color: "#8E8E8E", margin: 0 }}>
											{item.description}
										</p>
									</div>
									<div
										style={{ display: "flex", alignItems: "center", gap: 8 }}
									>
										{editingPrice === `delivery_${item.id}` ? (
											<>
												<input
													type="number"
													value={tempPrice}
													onChange={(e) => setTempPrice(e.target.value)}
													style={{
														width: 100,
														padding: "10px 12px",
														borderRadius: 8,
														border: "2px solid #7B5EA7",
														fontSize: 18,
														fontWeight: 700,
														textAlign: "center",
														outline: "none",
													}}
													autoFocus
												/>
												<span style={{ fontSize: 16, color: "#8E8E8E" }}>
													₽
												</span>
												<button
													onClick={() => handleSavePrice("delivery", item.id)}
													style={{
														padding: "10px 16px",
														borderRadius: 8,
														backgroundColor: "#4CAF50",
														border: "none",
														color: "white",
														fontSize: 14,
														cursor: "pointer",
													}}
												>
													✓
												</button>
											</>
										) : (
											<>
												<div
													onClick={() =>
														handleEditPrice(`delivery_${item.id}`, item.price)
													}
													style={{
														padding: "8px 16px",
														borderRadius: 8,
														backgroundColor: "#F3E8FF",
														cursor: "pointer",
													}}
												>
													<span
														style={{
															fontSize: 20,
															fontWeight: 700,
															color: "#7B5EA7",
														}}
													>
														{formatPrice(item.price)}
													</span>
												</div>
												<button
													onClick={() =>
														handleEditPrice(`delivery_${item.id}`, item.price)
													}
													style={{
														padding: "8px 12px",
														borderRadius: 8,
														backgroundColor: "#FFF9E6",
														border: "none",
														cursor: "pointer",
														fontSize: 16,
													}}
												>
													✏️
												</button>
											</>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Payment Methods Tab */}
			{tab === "methods" && (
				<div>
					<p style={{ fontSize: 14, color: "#8E8E8E", marginBottom: 24 }}>
						Управление способами оплаты и комиссиями платформы.
					</p>
					<div
						style={{
							backgroundColor: "white",
							borderRadius: 16,
							overflow: "hidden",
							boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
						}}
					>
						{paymentMethods.map((method, i) => (
							<div
								key={method.id}
								style={{
									padding: 20,
									borderBottom:
										i < paymentMethods.length - 1
											? "1px solid #F0F0F0"
											: "none",
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									flexWrap: "wrap",
									gap: 16,
								}}
							>
								<div style={{ display: "flex", alignItems: "center", gap: 16 }}>
									<div
										style={{
											width: 48,
											height: 48,
											borderRadius: 12,
											backgroundColor: "#F5F5F7",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											fontSize: 24,
										}}
									>
										{method.icon}
									</div>
									<div>
										<h4
											style={{
												fontSize: 16,
												fontWeight: 600,
												color: "#1A1A1A",
												margin: "0 0 4px",
											}}
										>
											{method.name}
										</h4>
										<p style={{ fontSize: 13, color: "#8E8E8E", margin: 0 }}>
											Комиссия платформы: {method.commission}%
										</p>
									</div>
								</div>
								<label
									style={{ display: "flex", alignItems: "center", gap: 12 }}
								>
									<span style={{ fontSize: 13, color: "#8E8E8E" }}>
										{method.isActive ? "Включён" : "Отключён"}
									</span>
									<input
										type="checkbox"
										checked={method.isActive}
										onChange={() => togglePaymentMethod(method.id)}
										style={{ width: 24, height: 24, cursor: "pointer" }}
									/>
								</label>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Transactions Tab */}
			{tab === "transactions" && (
				<div>
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
						<p style={{ fontSize: 14, color: "#8E8E8E", margin: 0 }}>
							Последние транзакции пользователей.
						</p>
						<button
							style={{
								padding: "10px 20px",
								borderRadius: 10,
								backgroundColor: "#4CAF50",
								border: "none",
								color: "white",
								fontSize: 14,
								cursor: "pointer",
							}}
						>
							📥 Экспорт в CSV
						</button>
					</div>
					<div
						style={{
							backgroundColor: "white",
							borderRadius: 16,
							overflow: "hidden",
							boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
						}}
					>
						<table style={{ width: "100%", borderCollapse: "collapse" }}>
							<thead>
								<tr style={{ backgroundColor: "#F5F5F7" }}>
									<th style={thStyle}>ID</th>
									<th style={thStyle}>Пользователь</th>
									<th style={thStyle}>Тип</th>
									<th style={thStyle}>Сумма</th>
									<th style={thStyle}>Статус</th>
									<th style={thStyle}>Дата</th>
								</tr>
							</thead>
							<tbody>
								{recentTransactions.map((tx) => (
									<tr key={tx.id} style={{ borderBottom: "1px solid #F0F0F0" }}>
										<td style={tdStyle}>{tx.id}</td>
										<td style={tdStyle}>{tx.user}</td>
										<td style={tdStyle}>
											<span
												style={{
													padding: "4px 10px",
													borderRadius: 8,
													fontSize: 12,
													backgroundColor:
														tx.type === "subscription" ? "#F3E8FF" : "#E8F5E9",
													color:
														tx.type === "subscription" ? "#7B5EA7" : "#4CAF50",
												}}
											>
												{tx.type === "subscription"
													? "💎 Подписка"
													: "🌸 Заказ"}
											</span>
										</td>
										<td
											style={{ ...tdStyle, fontWeight: 600, color: "#4CAF50" }}
										>
											{formatPrice(tx.amount)}
										</td>
										<td style={tdStyle}>
											<span
												style={{
													padding: "4px 10px",
													borderRadius: 8,
													fontSize: 12,
													backgroundColor:
														tx.status === "success" ? "#E8F5E9" : "#FFF9E6",
													color:
														tx.status === "success" ? "#4CAF50" : "#F5C542",
												}}
											>
												{tx.status === "success" ? "✓ Успешно" : "⏳ Ожидает"}
											</span>
										</td>
										<td style={tdStyle}>{tx.date}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}

			<style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
		</div>
	);
}

const thStyle = {
	padding: "16px 20px",
	textAlign: "left",
	fontSize: 13,
	fontWeight: 600,
	color: "#8E8E8E",
};

const tdStyle = {
	padding: "16px 20px",
	fontSize: 14,
	color: "#1A1A1A",
	verticalAlign: "middle",
};
