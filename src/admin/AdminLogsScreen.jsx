import { useState, useEffect, useCallback } from "react";
import api from "../api.js";

const initialLogs = [
	{
		id: 1,
		admin: "Администратор",
		action: "block_user",
		target: "Иван Петров",
		details: "Заблокирован за спам",
		timestamp: "26.06.2026 14:32",
		ip: "192.168.1.1",
	},
	{
		id: 2,
		admin: "Администратор",
		action: "approve_profile",
		target: "Мария Сидорова",
		details: "Анкета одобрена",
		timestamp: "26.06.2026 14:28",
		ip: "192.168.1.1",
	},
	{
		id: 3,
		admin: "Модератор",
		action: "send_message",
		target: "Пользователь #456",
		details: "Ответ на обращение в поддержку",
		timestamp: "26.06.2026 13:45",
		ip: "192.168.1.2",
	},
	{
		id: 4,
		admin: "Администратор",
		action: "change_price",
		target: "Подписка Premium",
		details: "Цена изменена с 299₽ на 399₽",
		timestamp: "26.06.2026 12:00",
		ip: "192.168.1.1",
	},
	{
		id: 5,
		admin: "Администратор",
		action: "create_backup",
		target: "database.sqlite",
		details: "Создан бэкап",
		timestamp: "26.06.2026 10:00",
		ip: "192.168.1.1",
	},
	{
		id: 6,
		admin: "Модератор",
		action: "reject_complaint",
		target: "Жалоба #12",
		details: "Жалоба отклонена как необоснованная",
		timestamp: "25.06.2026 18:30",
		ip: "192.168.1.2",
	},
	{
		id: 7,
		admin: "Администратор",
		action: "add_admin",
		target: "Новый Модератор",
		details: "Добавлен новый администратор",
		timestamp: "25.06.2026 15:00",
		ip: "192.168.1.1",
	},
];

const actionLabels = {
	block_user: { label: "Блокировка", color: "#FF6B6B", icon: "🚫" },
	unblock_user: { label: "Разблокировка", color: "#4CAF50", icon: "✅" },
	approve_profile: { label: "Одобрение", color: "#4CAF50", icon: "✓" },
	reject_profile: { label: "Отклонение", color: "#FF6B6B", icon: "✗" },
	send_message: { label: "Сообщение", color: "#5B8DB8", icon: "💬" },
	change_price: { label: "Изменение цены", color: "#F5C542", icon: "💰" },
	create_backup: { label: "Бэкап", color: "#7B5EA7", icon: "💾" },
	restore_backup: { label: "Восстановление", color: "#7B5EA7", icon: "🔄" },
	add_admin: { label: "Добавлен админ", color: "#7B5EA7", icon: "👤+" },
	remove_admin: { label: "Удалён админ", color: "#8E8E8E", icon: "👤-" },
	resolve_complaint: { label: "Жалоба решена", color: "#4CAF50", icon: "✓" },
	reject_complaint: { label: "Жалоба отклонена", color: "#8E8E8E", icon: "✗" },
};

export default function AdminLogsScreen() {
	const [logs, setLogs] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");

	const load = useCallback(async () => {
		try {
			setLogs(await api.adminLogs());
		} catch {
			setLogs(initialLogs);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);
	const [filterAction, setFilterAction] = useState("");
	const [filterAdmin, setFilterAdmin] = useState("");
	const [dateFrom, setDateFrom] = useState("");
	const [dateTo, setDateTo] = useState("");

	const filteredLogs = logs.filter((log) => {
		const matchesSearch =
			log.admin.toLowerCase().includes(searchQuery.toLowerCase()) ||
			log.target.toLowerCase().includes(searchQuery.toLowerCase()) ||
			log.details.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesAction = !filterAction || log.action === filterAction;
		const matchesAdmin = !filterAdmin || log.admin === filterAdmin;

		return matchesSearch && matchesAction && matchesAdmin;
	});

	const uniqueAdmins = [...new Set(logs.map((l) => l.admin))];

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
					style={{ fontSize: 20, fontWeight: 600, color: "#1A1A1A", margin: 0 }}
				>
					Логи действий
				</h3>
				<button
					style={{
						padding: "10px 20px",
						borderRadius: 10,
						backgroundColor: "#4CAF50",
						border: "none",
						color: "white",
						fontSize: 14,
						fontWeight: 500,
						cursor: "pointer",
					}}
				>
					📥 Экспорт в CSV
				</button>
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
					style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
				>
					{/* Search */}
					<div style={{ position: "relative", gridColumn: "1 / -1" }}>
						<input
							type="text"
							placeholder="Поиск по админу, цели или описанию..."
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

					{/* Action Filter */}
					<select
						value={filterAction}
						onChange={(e) => setFilterAction(e.target.value)}
						style={{
							padding: "12px",
							borderRadius: 10,
							border: "1px solid #E0E0E0",
							fontSize: 14,
							outline: "none",
							backgroundColor: "white",
						}}
					>
						<option value="">Все действия</option>
						{Object.entries(actionLabels).map(([key, val]) => (
							<option key={key} value={key}>
								{val.icon} {val.label}
							</option>
						))}
					</select>

					{/* Admin Filter */}
					<select
						value={filterAdmin}
						onChange={(e) => setFilterAdmin(e.target.value)}
						style={{
							padding: "12px",
							borderRadius: 10,
							border: "1px solid #E0E0E0",
							fontSize: 14,
							outline: "none",
							backgroundColor: "white",
						}}
					>
						<option value="">Все админы</option>
						{uniqueAdmins.map((admin) => (
							<option key={admin} value={admin}>
								{admin}
							</option>
						))}
					</select>

					{/* Date From */}
					<input
						type="date"
						value={dateFrom}
						onChange={(e) => setDateFrom(e.target.value)}
						style={{
							padding: "12px",
							borderRadius: 10,
							border: "1px solid #E0E0E0",
							fontSize: 14,
							outline: "none",
						}}
					/>

					{/* Date To */}
					<input
						type="date"
						value={dateTo}
						onChange={(e) => setDateTo(e.target.value)}
						style={{
							padding: "12px",
							borderRadius: 10,
							border: "1px solid #E0E0E0",
							fontSize: 14,
							outline: "none",
						}}
					/>
				</div>
			</div>

			{/* Stats */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
					gap: 12,
					marginBottom: 24,
				}}
			>
				<div
					style={{
						backgroundColor: "white",
						borderRadius: 12,
						padding: 16,
						textAlign: "center",
						boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
					}}
				>
					<div style={{ fontSize: 24, fontWeight: 700, color: "#1A1A1A" }}>
						{logs.length}
					</div>
					<div style={{ fontSize: 12, color: "#8E8E8E" }}>Всего записей</div>
				</div>
				<div
					style={{
						backgroundColor: "#E8F5E9",
						borderRadius: 12,
						padding: 16,
						textAlign: "center",
					}}
				>
					<div style={{ fontSize: 24, fontWeight: 700, color: "#4CAF50" }}>
						{
							logs.filter(
								(l) =>
									l.action.includes("approve") ||
									l.action.includes("unblock") ||
									l.action.includes("resolve"),
							).length
						}
					</div>
					<div style={{ fontSize: 12, color: "#8E8E8E" }}>Одобрений</div>
				</div>
				<div
					style={{
						backgroundColor: "#FFEBEB",
						borderRadius: 12,
						padding: 16,
						textAlign: "center",
					}}
				>
					<div style={{ fontSize: 24, fontWeight: 700, color: "#FF6B6B" }}>
						{
							logs.filter(
								(l) =>
									l.action.includes("block") || l.action.includes("reject"),
							).length
						}
					</div>
					<div style={{ fontSize: 12, color: "#8E8E8E" }}>Ограничений</div>
				</div>
				<div
					style={{
						backgroundColor: "#E8F4FF",
						borderRadius: 12,
						padding: 16,
						textAlign: "center",
					}}
				>
					<div style={{ fontSize: 24, fontWeight: 700, color: "#5B8DB8" }}>
						{logs.filter((l) => l.action === "send_message").length}
					</div>
					<div style={{ fontSize: 12, color: "#8E8E8E" }}>Сообщений</div>
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
							<th style={thStyle}>Время</th>
							<th style={thStyle}>Администратор</th>
							<th style={thStyle}>Действие</th>
							<th style={thStyle}>Цель</th>
							<th style={thStyle}>Детали</th>
							<th style={thStyle}>IP</th>
						</tr>
					</thead>
					<tbody>
						{filteredLogs.map((log) => {
							const action = actionLabels[log.action] || {
								label: log.action,
								color: "#8E8E8E",
								icon: "📌",
							};
							return (
								<tr key={log.id} style={{ borderBottom: "1px solid #F0F0F0" }}>
									<td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
										{log.timestamp}
									</td>
									<td style={tdStyle}>
										<div
											style={{
												display: "flex",
												alignItems: "center",
												gap: 8,
											}}
										>
											<div
												style={{
													width: 28,
													height: 28,
													borderRadius: "50%",
													backgroundColor: "#7B5EA7",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													color: "white",
													fontSize: 12,
													fontWeight: 600,
												}}
											>
												{log.admin.charAt(0)}
											</div>
											<span style={{ fontWeight: 500 }}>{log.admin}</span>
										</div>
									</td>
									<td style={tdStyle}>
										<span
											style={{
												padding: "4px 10px",
												borderRadius: 8,
												fontSize: 12,
												backgroundColor: `${action.color}15`,
												color: action.color,
												whiteSpace: "nowrap",
											}}
										>
											{action.icon} {action.label}
										</span>
									</td>
									<td style={tdStyle}>{log.target}</td>
									<td style={{ ...tdStyle, color: "#8E8E8E" }}>
										{log.details}
									</td>
									<td
										style={{
											...tdStyle,
											fontFamily: "monospace",
											fontSize: 12,
										}}
									>
										{log.ip}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
				{filteredLogs.length === 0 && (
					<div style={{ padding: 40, textAlign: "center", color: "#8E8E8E" }}>
						Записи не найдены
					</div>
				)}
			</div>

			{/* Mobile Cards */}
			<div className="mobile-cards" style={{ display: "none", gap: 12 }}>
				{filteredLogs.map((log) => {
					const action = actionLabels[log.action] || {
						label: log.action,
						color: "#8E8E8E",
						icon: "📌",
					};
					return (
						<div
							key={log.id}
							style={{
								backgroundColor: "white",
								borderRadius: 12,
								padding: 16,
								boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
							}}
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									marginBottom: 8,
								}}
							>
								<span
									style={{
										padding: "4px 10px",
										borderRadius: 8,
										fontSize: 12,
										backgroundColor: `${action.color}15`,
										color: action.color,
									}}
								>
									{action.icon} {action.label}
								</span>
								<span style={{ fontSize: 12, color: "#8E8E8E" }}>
									{log.timestamp}
								</span>
							</div>
							<div style={{ fontSize: 14, marginBottom: 4 }}>
								<strong>{log.admin}</strong> → {log.target}
							</div>
							<div style={{ fontSize: 12, color: "#8E8E8E" }}>
								{log.details}
							</div>
							<div
								style={{
									marginTop: 8,
									fontSize: 11,
									color: "#8E8E8E",
									fontFamily: "monospace",
								}}
							>
								IP: {log.ip}
							</div>
						</div>
					);
				})}
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
