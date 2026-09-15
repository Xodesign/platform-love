import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";

const initialBlacklist = [
	{
		id: 1,
		name: "Иван Петров",
		email: "ivan@example.com",
		reason: "Рассылка спама",
		blockedBy: "Администратор",
		blockedAt: "25.06.2026",
		until: "Навсегда",
	},
	{
		id: 2,
		name: "Мария Сидорова",
		email: "maria@example.com",
		reason: "Оскорбление пользователей",
		blockedBy: "Администратор",
		blockedAt: "20.06.2026",
		until: "01.08.2026",
	},
	{
		id: 3,
		name: "Алексей Волков",
		email: "alex@example.com",
		reason: "Фейковый профиль",
		blockedBy: "Администратор",
		blockedAt: "15.06.2026",
		until: "Навсегда",
	},
];

export default function AdminBlacklistScreen() {
	const navigate = useNavigate();
	const [blacklist, setBlacklist] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");

	const load = useCallback(async () => {
		try {
			setBlacklist(await api.adminBlacklist());
		} catch {
			setBlacklist(initialBlacklist);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);
	const [showAddModal, setShowAddModal] = useState(false);
	const [newBlock, setNewBlock] = useState({
		name: "",
		email: "",
		reason: "",
		until: "Навсегда",
	});

	const filteredBlacklist = blacklist.filter(
		(item) =>
			item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.reason.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const unblock = async (id) => {
		if (window.confirm("Разблокировать этого пользователя?")) {
			await api.adminUnblock(id);
			load();
		}
	};

	const addToBlacklist = async () => {
		if (!newBlock.name || !newBlock.email || !newBlock.reason) {
			alert("Заполните все обязательные поля");
			return;
		}

		await api.adminBlock({
			email: newBlock.email,
			reason: newBlock.reason,
			until: newBlock.until,
		});
		setNewBlock({ name: "", email: "", reason: "", until: "Навсегда" });
		setShowAddModal(false);
		load();
	};

	const isPermanent = (until) => until === "Навсегда";

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
					Чёрный список
				</h3>
				<button
					onClick={() => setShowAddModal(true)}
					style={{
						padding: "10px 20px",
						borderRadius: 10,
						backgroundColor: "#FF6B6B",
						border: "none",
						color: "white",
						fontSize: 14,
						fontWeight: 500,
						cursor: "pointer",
					}}
				>
					+ Добавить в чёрный список
				</button>
			</div>

			{/* Search */}
			<div
				style={{
					backgroundColor: "white",
					borderRadius: 12,
					padding: 16,
					marginBottom: 16,
					boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
				}}
			>
				<div style={{ position: "relative" }}>
					<input
						type="text"
						placeholder="Поиск по имени, email или причине..."
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
			</div>

			{/* Stats */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
					gap: 12,
					marginBottom: 24,
				}}
			>
				<div
					style={{
						backgroundColor: "#FFEBEB",
						borderRadius: 12,
						padding: 16,
						textAlign: "center",
					}}
				>
					<div style={{ fontSize: 24, fontWeight: 700, color: "#FF6B6B" }}>
						{blacklist.length}
					</div>
					<div style={{ fontSize: 12, color: "#8E8E8E" }}>
						Всего заблокировано
					</div>
				</div>
				<div
					style={{
						backgroundColor: "#FFF9E6",
						borderRadius: 12,
						padding: 16,
						textAlign: "center",
					}}
				>
					<div style={{ fontSize: 24, fontWeight: 700, color: "#F5C542" }}>
						{blacklist.filter((b) => !isPermanent(b.until)).length}
					</div>
					<div style={{ fontSize: 12, color: "#8E8E8E" }}>Временно</div>
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
						{blacklist.filter((b) => isPermanent(b.until)).length}
					</div>
					<div style={{ fontSize: 12, color: "#8E8E8E" }}>Навсегда</div>
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
							<th style={thStyle}>Пользователь</th>
							<th style={thStyle}>Причина</th>
							<th style={thStyle}>Заблокирован</th>
							<th style={thStyle}>До</th>
							<th style={thStyle}>Действия</th>
						</tr>
					</thead>
					<tbody>
						{filteredBlacklist.map((item) => (
							<tr key={item.id} style={{ borderBottom: "1px solid #F0F0F0" }}>
								<td style={tdStyle}>
									<div
										style={{ display: "flex", alignItems: "center", gap: 12 }}
									>
										<div
											style={{
												width: 40,
												height: 40,
												borderRadius: "50%",
												backgroundColor: "#FF6B6B",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												color: "white",
												fontWeight: 600,
											}}
										>
											{item.name.charAt(0)}
										</div>
										<div>
											<div style={{ fontWeight: 600, color: "#1A1A1A" }}>
												{item.name}
											</div>
											<div style={{ fontSize: 12, color: "#8E8E8E" }}>
												{item.email}
											</div>
										</div>
									</div>
								</td>
								<td style={tdStyle}>
									<span
										style={{
											padding: "4px 10px",
											borderRadius: 8,
											backgroundColor: "#FFEBEB",
											color: "#FF6B6B",
											fontSize: 13,
										}}
									>
										{item.reason}
									</span>
								</td>
								<td style={tdStyle}>
									<div style={{ fontSize: 13 }}>{item.blockedAt}</div>
									<div style={{ fontSize: 11, color: "#8E8E8E" }}>
										{item.blockedBy}
									</div>
								</td>
								<td style={tdStyle}>
									<span
										style={{
											padding: "4px 10px",
											borderRadius: 8,
											backgroundColor: isPermanent(item.until)
												? "#FFEBEB"
												: "#E8F5E9",
											color: isPermanent(item.until) ? "#FF6B6B" : "#4CAF50",
											fontSize: 13,
										}}
									>
										{item.until}
									</span>
								</td>
								<td style={tdStyle}>
									<button
										onClick={() => navigate(`/admin/chat/${item.id}`)}
										style={actionBtnStyle("#5B8DB8")}
									>
										Написать
									</button>
									<button
										onClick={() => unblock(item.id)}
										style={{
											...actionBtnStyle("#4CAF50"),
											marginLeft: 8,
										}}
									>
										Разблокировать
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				{filteredBlacklist.length === 0 && (
					<div
						style={{
							padding: 40,
							textAlign: "center",
							color: "#8E8E8E",
						}}
					>
						Пользователи не найдены
					</div>
				)}
			</div>

			{/* Mobile Cards */}
			<div className="mobile-cards" style={{ display: "none", gap: 12 }}>
				{filteredBlacklist.map((item) => (
					<div
						key={item.id}
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
								alignItems: "center",
								gap: 12,
								marginBottom: 12,
							}}
						>
							<div
								style={{
									width: 48,
									height: 48,
									borderRadius: "50%",
									backgroundColor: "#FF6B6B",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									color: "white",
									fontSize: 18,
									fontWeight: 600,
								}}
							>
								{item.name.charAt(0)}
							</div>
							<div style={{ flex: 1 }}>
								<div style={{ fontWeight: 600, color: "#1A1A1A" }}>
									{item.name}
								</div>
								<div style={{ fontSize: 12, color: "#8E8E8E" }}>
									{item.email}
								</div>
							</div>
						</div>
						<div style={{ marginBottom: 12 }}>
							<span style={{ fontSize: 12, color: "#8E8E8E" }}>Причина: </span>
							<span
								style={{
									padding: "2px 8px",
									borderRadius: 6,
									backgroundColor: "#FFEBEB",
									color: "#FF6B6B",
									fontSize: 12,
								}}
							>
								{item.reason}
							</span>
						</div>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								fontSize: 12,
								color: "#8E8E8E",
								marginBottom: 12,
							}}
						>
							<span>Заблокирован: {item.blockedAt}</span>
							<span>До: {item.until}</span>
						</div>
						<div style={{ display: "flex", gap: 8 }}>
							<button
								onClick={() => navigate(`/admin/chat/${item.id}`)}
								style={actionBtnStyle("#5B8DB8")}
							>
								Написать
							</button>
							<button
								onClick={() => unblock(item.id)}
								style={actionBtnStyle("#4CAF50")}
							>
								Разблокировать
							</button>
						</div>
					</div>
				))}
			</div>

			{/* Add Modal */}
			{showAddModal && (
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
						zIndex: 1000,
						padding: 16,
					}}
					onClick={() => setShowAddModal(false)}
				>
					<div
						style={{
							backgroundColor: "white",
							borderRadius: 16,
							padding: 24,
							width: "100%",
							maxWidth: 400,
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<h4
							style={{
								fontSize: 18,
								fontWeight: 600,
								color: "#1A1A1A",
								margin: "0 0 20px",
							}}
						>
							Добавить в чёрный список
						</h4>
						<div style={{ marginBottom: 16 }}>
							<label
								style={{
									fontSize: 13,
									color: "#8E8E8E",
									marginBottom: 6,
									display: "block",
								}}
							>
								Имя пользователя *
							</label>
							<input
								type="text"
								value={newBlock.name}
								onChange={(e) =>
									setNewBlock({ ...newBlock, name: e.target.value })
								}
								style={inputStyle}
							/>
						</div>
						<div style={{ marginBottom: 16 }}>
							<label
								style={{
									fontSize: 13,
									color: "#8E8E8E",
									marginBottom: 6,
									display: "block",
								}}
							>
								Email *
							</label>
							<input
								type="email"
								value={newBlock.email}
								onChange={(e) =>
									setNewBlock({ ...newBlock, email: e.target.value })
								}
								style={inputStyle}
							/>
						</div>
						<div style={{ marginBottom: 16 }}>
							<label
								style={{
									fontSize: 13,
									color: "#8E8E8E",
									marginBottom: 6,
									display: "block",
								}}
							>
								Причина блокировки *
							</label>
							<select
								value={newBlock.reason}
								onChange={(e) =>
									setNewBlock({ ...newBlock, reason: e.target.value })
								}
								style={inputStyle}
							>
								<option value="">Выберите причину</option>
								<option value="Спам">Спам</option>
								<option value="Оскорбление пользователей">
									Оскорбление пользователей
								</option>
								<option value="Фейковый профиль">Фейковый профиль</option>
								<option value="Нецензурная лексика">Нецензурная лексика</option>
								<option value="Мошенничество">Мошенничество</option>
								<option value="Другое">Другое</option>
							</select>
						</div>
						<div style={{ marginBottom: 24 }}>
							<label
								style={{
									fontSize: 13,
									color: "#8E8E8E",
									marginBottom: 6,
									display: "block",
								}}
							>
								Заблокировать до
							</label>
							<select
								value={newBlock.until}
								onChange={(e) =>
									setNewBlock({ ...newBlock, until: e.target.value })
								}
								style={inputStyle}
							>
								<option value="Навсегда">Навсегда</option>
								<option value="7 дней">7 дней</option>
								<option value="30 дней">30 дней</option>
								<option value="90 дней">90 дней</option>
							</select>
						</div>
						<div style={{ display: "flex", gap: 12 }}>
							<button
								onClick={() => setShowAddModal(false)}
								style={{
									flex: 1,
									padding: "12px",
									borderRadius: 10,
									backgroundColor: "#F5F5F7",
									border: "none",
									color: "#8E8E8E",
									fontSize: 14,
									cursor: "pointer",
								}}
							>
								Отмена
							</button>
							<button
								onClick={addToBlacklist}
								style={{
									flex: 1,
									padding: "12px",
									borderRadius: 10,
									backgroundColor: "#FF6B6B",
									border: "none",
									color: "white",
									fontSize: 14,
									fontWeight: 500,
									cursor: "pointer",
								}}
							>
								Заблокировать
							</button>
						</div>
					</div>
				</div>
			)}

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

const actionBtnStyle = (color) => ({
	padding: "6px 12px",
	borderRadius: 6,
	backgroundColor: `${color}15`,
	border: `1px solid ${color}`,
	color: color,
	fontSize: 12,
	cursor: "pointer",
});

const inputStyle = {
	width: "100%",
	padding: "12px",
	borderRadius: 8,
	border: "1px solid #E0E0E0",
	fontSize: 14,
	outline: "none",
	boxSizing: "border-box",
};
