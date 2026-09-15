import { useState, useEffect, useCallback } from "react";
import api from "../api.js";

const initialAdmins = [
	{
		id: 1,
		name: "Администратор",
		email: "admin@platformlove.ru",
		role: "super_admin",
		createdAt: "01.01.2024",
		lastActive: "26.06.2026 14:30",
		isActive: true,
	},
	{
		id: 2,
		name: "Модератор",
		email: "moderator@platformlove.ru",
		role: "moderator",
		createdAt: "15.03.2024",
		lastActive: "26.06.2026 12:00",
		isActive: true,
	},
	{
		id: 3,
		name: "Поддержка",
		email: "support@platformlove.ru",
		role: "support",
		createdAt: "20.05.2024",
		lastActive: "25.06.2026 18:00",
		isActive: true,
	},
];

const initialBackups = [
	{
		id: 1,
		name: "backup_2026-06-26_10-00.sqlite",
		size: "2.4 MB",
		createdAt: "26.06.2026 10:00",
		type: "auto",
	},
	{
		id: 2,
		name: "backup_2026-06-25_10-00.sqlite",
		size: "2.3 MB",
		createdAt: "25.06.2026 10:00",
		type: "auto",
	},
	{
		id: 3,
		name: "backup_2026-06-24_10-00.sqlite",
		size: "2.3 MB",
		createdAt: "24.06.2026 10:00",
		type: "auto",
	},
	{
		id: 4,
		name: "backup_before_update.sqlite",
		size: "2.2 MB",
		createdAt: "20.06.2026 18:00",
		type: "manual",
	},
];

const roleLabels = {
	super_admin: { label: "Главный админ", color: "#7B5EA7", icon: "👑" },
	moderator: { label: "Модератор", color: "#5B8DB8", icon: "🛡️" },
	support: { label: "Поддержка", color: "#4CAF50", icon: "💬" },
};

export default function AdminSettingsScreen() {
	const [tab, setTab] = useState("admins");
	const [admins, setAdmins] = useState([]);

	const load = useCallback(async () => {
		try {
			const data = await api.adminSettings();
			setAdmins(data.admins || []);
		} catch {
			setAdmins(initialAdmins);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);
	const [backups] = useState(initialBackups);
	const [showAddAdmin, setShowAddAdmin] = useState(false);
	const [newAdmin, setNewAdmin] = useState({
		name: "",
		email: "",
		role: "moderator",
	});

	// Автопродление подписки
	const [autoRenewal, setAutoRenewal] = useState({
		enabled: true,
		gracePeriodDays: 3,
		reminderDays: [7, 3, 1],
		autoChargeEnabled: true,
		graceChargeEnabled: true,
	});
	const [showClubCardModal, setShowClubCardModal] = useState(false);

	const addAdmin = async () => {
		if (!newAdmin.name || !newAdmin.email) {
			alert("Заполните все обязательные поля");
			return;
		}
		await api.adminAddAdmin({
			...newAdmin,
			password: newAdmin.password || "admin123",
		});
		setNewAdmin({ name: "", email: "", role: "moderator" });
		setShowAddAdmin(false);
		load();
	};

	const removeAdmin = async (id) => {
		if (window.confirm("Удалить этого администратора?")) {
			await api.adminDeleteAdmin(id);
			load();
		}
	};

	const createBackup = () => {
		alert("Создание резервной копии...");
	};

	const restoreBackup = (_id) => {
		if (
			window.confirm(
				"Восстановить эту резервную копию? Текущие данные будут заменены.",
			)
		) {
			alert("Восстановление запущено...");
		}
	};

	const handleAutoRenewalToggle = (enabled) => {
		setAutoRenewal((prev) => ({ ...prev, enabled }));
		if (enabled) {
			setShowClubCardModal(true);
		}
	};

	const tabs = [
		{ id: "admins", label: "👑 Администраторы", count: admins.length },
		{ id: "auto_renew", label: "🔄 Автопродление", count: null },
		{ id: "backups", label: "💾 Бэкапы", count: backups.length },
	];

	return (
		<div>
			{/* Header */}
			<h3
				style={{
					fontSize: 20,
					fontWeight: 600,
					color: "#1A1A1A",
					margin: "0 0 24px",
				}}
			>
				Настройки
			</h3>

			{/* Tabs */}
			<div
				style={{
					display: "flex",
					gap: 8,
					marginBottom: 24,
					flexWrap: "wrap",
				}}
			>
				{tabs.map((t) => (
					<button
						key={t.id}
						onClick={() => setTab(t.id)}
						style={{
							padding: "10px 20px",
							borderRadius: 10,
							border: "none",
							fontSize: 14,
							cursor: "pointer",
							backgroundColor: tab === t.id ? "#7B5EA7" : "#F5F5F7",
							color: tab === t.id ? "white" : "#8E8E8E",
							fontWeight: tab === t.id ? 600 : 400,
						}}
					>
						{t.label}
						{t.count !== null && (
							<span
								style={{
									marginLeft: 8,
									padding: "2px 8px",
									borderRadius: 10,
									backgroundColor:
										tab === t.id ? "rgba(255,255,255,0.2)" : "#E0E0E0",
									fontSize: 12,
								}}
							>
								{t.count}
							</span>
						)}
					</button>
				))}
			</div>

			{/* Admins Tab */}
			{tab === "admins" && (
				<div>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: 16,
						}}
					>
						<h4
							style={{
								fontSize: 16,
								fontWeight: 600,
								color: "#1A1A1A",
								margin: 0,
							}}
						>
							Управление администраторами
						</h4>
						<button
							onClick={() => setShowAddAdmin(true)}
							style={{
								padding: "10px 20px",
								borderRadius: 10,
								backgroundColor: "#7B5EA7",
								border: "none",
								color: "white",
								fontSize: 14,
								cursor: "pointer",
							}}
						>
							+ Добавить админа
						</button>
					</div>

					<div
						style={{
							backgroundColor: "white",
							borderRadius: 12,
							overflow: "hidden",
							boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
						}}
					>
						{admins.map((admin, i) => {
							const role = roleLabels[admin.role];
							return (
								<div
									key={admin.id}
									style={{
										padding: 16,
										borderBottom:
											i < admins.length - 1 ? "1px solid #F0F0F0" : "none",
										display: "flex",
										alignItems: "center",
										gap: 16,
										flexWrap: "wrap",
									}}
								>
									<div
										style={{
											width: 48,
											height: 48,
											borderRadius: "50%",
											backgroundColor: role.color,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											color: "white",
											fontSize: 18,
										}}
									>
										{admin.name.charAt(0)}
									</div>
									<div style={{ flex: 1, minWidth: 200 }}>
										<div style={{ fontWeight: 600, color: "#1A1A1A" }}>
											{admin.name}
										</div>
										<div style={{ fontSize: 13, color: "#8E8E8E" }}>
											{admin.email}
										</div>
										<div
											style={{ fontSize: 12, color: "#8E8E8E", marginTop: 4 }}
										>
											Последняя активность: {admin.lastActive}
										</div>
									</div>
									<span
										style={{
											padding: "4px 10px",
											borderRadius: 8,
											backgroundColor: `${role.color}15`,
											color: role.color,
											fontSize: 12,
											fontWeight: 500,
										}}
									>
										{role.icon} {role.label}
									</span>
									<span style={{ fontSize: 12, color: "#8E8E8E" }}>
										Создан: {admin.createdAt}
									</span>
									{admin.role !== "super_admin" && (
										<button
											onClick={() => removeAdmin(admin.id)}
											style={{
												padding: "8px 12px",
												borderRadius: 8,
												backgroundColor: "#FFEBEB",
												border: "none",
												color: "#FF6B6B",
												fontSize: 12,
												cursor: "pointer",
											}}
										>
											Удалить
										</button>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Автопродление Tab */}
			{tab === "auto_renew" && (
				<div>
					<h4
						style={{
							fontSize: 16,
							fontWeight: 600,
							color: "#1A1A1A",
							margin: "0 0 8px",
						}}
					>
						Автопродление подписки
					</h4>
					<p style={{ fontSize: 14, color: "#8E8E8E", margin: "0 0 24px" }}>
						Управление автоматическим продлением подписок и клубной картой
					</p>

					{/* Toggle Card */}
					<div
						style={{
							backgroundColor: "white",
							borderRadius: 16,
							padding: 24,
							boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
							marginBottom: 20,
						}}
					>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<div>
								<h5
									style={{
										fontSize: 18,
										fontWeight: 600,
										color: "#1A1A1A",
										margin: "0 0 4px",
									}}
								>
									🔄 Автопродление подписки
								</h5>
								<p style={{ fontSize: 14, color: "#8E8E8E", margin: 0 }}>
									Автоматически продлевает подписку пользователям
								</p>
							</div>
							<label style={{ cursor: "pointer", position: "relative" }}>
								<input
									type="checkbox"
									checked={autoRenewal.enabled}
									onChange={(e) => handleAutoRenewalToggle(e.target.checked)}
									style={{ opacity: 0, position: "absolute" }}
								/>
								<div
									style={{
										width: 56,
										height: 32,
										borderRadius: 16,
										backgroundColor: autoRenewal.enabled
											? "#4CAF50"
											: "#E0E0E0",
										position: "relative",
										transition: "all 0.3s",
									}}
								>
									<div
										style={{
											width: 28,
											height: 28,
											borderRadius: "50%",
											backgroundColor: "white",
											position: "absolute",
											top: 2,
											left: autoRenewal.enabled ? 26 : 2,
											transition: "all 0.3s",
											boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
										}}
									/>
								</div>
							</label>
						</div>

						{autoRenewal.enabled && (
							<>
								<div
									style={{
										marginTop: 20,
										padding: 16,
										backgroundColor: "#F5F5F7",
										borderRadius: 12,
									}}
								>
									<div
										style={{ display: "flex", alignItems: "center", gap: 12 }}
									>
										<div
											style={{
												width: 48,
												height: 48,
												borderRadius: 12,
												backgroundColor: "#F5C542",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												fontSize: 24,
											}}
										>
											🏆
										</div>
										<div style={{ flex: 1 }}>
											<h6
												style={{
													fontSize: 16,
													fontWeight: 600,
													color: "#1A1A1A",
													margin: "0 0 2px",
												}}
											>
												Клубная карта
											</h6>
											<p style={{ fontSize: 13, color: "#8E8E8E", margin: 0 }}>
												Активирована для всех Premium подписок
											</p>
										</div>
										<button
											onClick={() => setShowClubCardModal(true)}
											style={{
												padding: "8px 16px",
												borderRadius: 8,
												backgroundColor: "#7B5EA7",
												border: "none",
												color: "white",
												fontSize: 13,
												cursor: "pointer",
											}}
										>
											Настроить
										</button>
									</div>
								</div>

								{/* Quick Stats */}
								<div
									style={{
										display: "grid",
										gridTemplateColumns: "repeat(3, 1fr)",
										gap: 12,
										marginTop: 20,
									}}
								>
									<div
										style={{
											textAlign: "center",
											padding: 16,
											backgroundColor: "#F5F5F7",
											borderRadius: 12,
										}}
									>
										<div
											style={{
												fontSize: 24,
												fontWeight: 700,
												color: "#4CAF50",
											}}
										>
											423
										</div>
										<div style={{ fontSize: 12, color: "#8E8E8E" }}>
											Активных
										</div>
									</div>
									<div
										style={{
											textAlign: "center",
											padding: 16,
											backgroundColor: "#F5F5F7",
											borderRadius: 12,
										}}
									>
										<div
											style={{
												fontSize: 24,
												fontWeight: 700,
												color: "#7B5EA7",
											}}
										>
											15
										</div>
										<div style={{ fontSize: 12, color: "#8E8E8E" }}>
											Истекло
										</div>
									</div>
									<div
										style={{
											textAlign: "center",
											padding: 16,
											backgroundColor: "#F5F5F7",
											borderRadius: 12,
										}}
									>
										<div
											style={{
												fontSize: 24,
												fontWeight: 700,
												color: "#F5C542",
											}}
										>
											89%
										</div>
										<div style={{ fontSize: 12, color: "#8E8E8E" }}>
											Продлевают
										</div>
									</div>
								</div>
							</>
						)}
					</div>

					{/* Настройки автопродления */}
					{autoRenewal.enabled && (
						<div
							style={{
								backgroundColor: "white",
								borderRadius: 16,
								padding: 24,
								boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
							}}
						>
							<h5
								style={{
									fontSize: 16,
									fontWeight: 600,
									color: "#1A1A1A",
									margin: "0 0 16px",
								}}
							>
								Параметры автопродления
							</h5>

							{[
								{
									key: "gracePeriodDays",
									label: "Льготный период",
									description:
										"Дней после истечения срока, когда подписка ещё активна",
									value: autoRenewal.gracePeriodDays,
									suffix: "дней",
								},
								{
									key: "autoChargeEnabled",
									label: "Автосписание",
									description: "Автоматически списывать средства при продлении",
									isToggle: true,
									value: autoRenewal.autoChargeEnabled,
								},
								{
									key: "graceChargeEnabled",
									label: "Списание в льготный период",
									description: "Пытаться списать средства в льготный период",
									isToggle: true,
									value: autoRenewal.graceChargeEnabled,
								},
							].map((item) => (
								<div
									key={item.key}
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										padding: "16px 0",
										borderBottom: "1px solid #F0F0F0",
									}}
								>
									<div>
										<div
											style={{
												fontSize: 14,
												fontWeight: 500,
												color: "#1A1A1A",
											}}
										>
											{item.label}
										</div>
										<div style={{ fontSize: 12, color: "#8E8E8E" }}>
											{item.description}
										</div>
									</div>
									{item.isToggle ? (
										<label style={{ cursor: "pointer" }}>
											<input
												type="checkbox"
												checked={item.value}
												onChange={() =>
													setAutoRenewal((prev) => ({
														...prev,
														[item.key]: !prev[item.key],
													}))
												}
												style={{ opacity: 0, position: "absolute" }}
											/>
											<div
												style={{
													width: 48,
													height: 28,
													borderRadius: 14,
													backgroundColor: item.value ? "#4CAF50" : "#E0E0E0",
													position: "relative",
													transition: "all 0.3s",
												}}
											>
												<div
													style={{
														width: 24,
														height: 24,
														borderRadius: "50%",
														backgroundColor: "white",
														position: "absolute",
														top: 2,
														left: item.value ? 22 : 2,
														transition: "all 0.3s",
													}}
												/>
											</div>
										</label>
									) : (
										<div
											style={{ display: "flex", alignItems: "center", gap: 8 }}
										>
											<button
												onClick={() =>
													setAutoRenewal((prev) => ({
														...prev,
														[item.key]: Math.max(0, prev[item.key] - 1),
													}))
												}
												style={{
													width: 32,
													height: 32,
													borderRadius: 8,
													backgroundColor: "#F5F5F7",
													border: "none",
													fontSize: 18,
													cursor: "pointer",
												}}
											>
												-
											</button>
											<span
												style={{
													minWidth: 40,
													textAlign: "center",
													fontWeight: 600,
												}}
											>
												{item.value}
											</span>
											<button
												onClick={() =>
													setAutoRenewal((prev) => ({
														...prev,
														[item.key]: prev[item.key] + 1,
													}))
												}
												style={{
													width: 32,
													height: 32,
													borderRadius: 8,
													backgroundColor: "#F5F5F7",
													border: "none",
													fontSize: 18,
													cursor: "pointer",
												}}
											>
												+
											</button>
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Backups Tab */}
			{tab === "backups" && (
				<div>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: 16,
							flexWrap: "wrap",
							gap: 16,
						}}
					>
						<div>
							<h4
								style={{
									fontSize: 16,
									fontWeight: 600,
									color: "#1A1A1A",
									margin: "0 0 4px",
								}}
							>
								Резервные копии
							</h4>
							<p style={{ fontSize: 13, color: "#8E8E8E", margin: 0 }}>
								Автоматические бэкапы создаются каждый день в 10:00
							</p>
						</div>
						<button
							onClick={createBackup}
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
							💾 Создать сейчас
						</button>
					</div>

					<div
						style={{
							backgroundColor: "white",
							borderRadius: 12,
							overflow: "hidden",
							boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
						}}
					>
						{backups.map((backup, i) => (
							<div
								key={backup.id}
								style={{
									padding: 16,
									borderBottom:
										i < backups.length - 1 ? "1px solid #F0F0F0" : "none",
									display: "flex",
									alignItems: "center",
									gap: 16,
									flexWrap: "wrap",
								}}
							>
								<div
									style={{
										width: 48,
										height: 48,
										borderRadius: 10,
										backgroundColor:
											backup.type === "auto" ? "#FFF9E6" : "#E8F4FF",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										fontSize: 20,
									}}
								>
									💾
								</div>
								<div style={{ flex: 1, minWidth: 200 }}>
									<div
										style={{
											fontWeight: 500,
											color: "#1A1A1A",
											fontFamily: "monospace",
											fontSize: 13,
										}}
									>
										{backup.name}
									</div>
									<div style={{ fontSize: 12, color: "#8E8E8E", marginTop: 2 }}>
										{backup.createdAt} • {backup.size}
									</div>
								</div>
								<span
									style={{
										padding: "4px 8px",
										borderRadius: 6,
										backgroundColor:
											backup.type === "auto" ? "#FFF9E6" : "#E8F4FF",
										color: backup.type === "auto" ? "#F5C542" : "#5B8DB8",
										fontSize: 11,
									}}
								>
									{backup.type === "auto" ? "Авто" : "Ручной"}
								</span>
								<button
									onClick={() => restoreBackup(backup.id)}
									style={{
										padding: "8px 12px",
										borderRadius: 8,
										backgroundColor: "#F3E8FF",
										border: "none",
										color: "#7B5EA7",
										fontSize: 12,
										cursor: "pointer",
									}}
								>
									🔄 Восстановить
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Add Admin Modal */}
			{showAddAdmin && (
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
					onClick={() => setShowAddAdmin(false)}
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
							Добавить администратора
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
								Имя *
							</label>
							<input
								type="text"
								value={newAdmin.name}
								onChange={(e) =>
									setNewAdmin({ ...newAdmin, name: e.target.value })
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
								value={newAdmin.email}
								onChange={(e) =>
									setNewAdmin({ ...newAdmin, email: e.target.value })
								}
								style={inputStyle}
							/>
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
								Роль *
							</label>
							<select
								value={newAdmin.role}
								onChange={(e) =>
									setNewAdmin({ ...newAdmin, role: e.target.value })
								}
								style={inputStyle}
							>
								<option value="moderator">🛡️ Модератор</option>
								<option value="support">💬 Поддержка</option>
							</select>
						</div>
						<div style={{ display: "flex", gap: 12 }}>
							<button
								onClick={() => setShowAddAdmin(false)}
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
								onClick={addAdmin}
								style={{
									flex: 1,
									padding: "12px",
									borderRadius: 10,
									backgroundColor: "#7B5EA7",
									border: "none",
									color: "white",
									fontSize: 14,
									fontWeight: 500,
									cursor: "pointer",
								}}
							>
								Добавить
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Club Card Modal */}
			{showClubCardModal && (
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
					onClick={() => setShowClubCardModal(false)}
				>
					<div
						style={{
							backgroundColor: "white",
							borderRadius: 20,
							padding: 24,
							width: "100%",
							maxWidth: 480,
							maxHeight: "90vh",
							overflow: "auto",
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: 20,
							}}
						>
							<h4
								style={{
									fontSize: 20,
									fontWeight: 700,
									color: "#1A1A1A",
									margin: 0,
								}}
							>
								🏆 Настройка клубной карты
							</h4>
							<button
								onClick={() => setShowClubCardModal(false)}
								style={{
									width: 36,
									height: 36,
									borderRadius: "50%",
									backgroundColor: "#F5F5F7",
									border: "none",
									fontSize: 18,
									cursor: "pointer",
								}}
							>
								✕
							</button>
						</div>

						<p style={{ fontSize: 14, color: "#8E8E8E", margin: "0 0 20px" }}>
							Клубная карта — это VIP-статус, который активируется при покупке
							Premium подписки. Здесь вы можете настроить параметры клубной
							карты.
						</p>

						{/* Club Card Preview */}
						<div
							style={{
								background: "linear-gradient(135deg, #7B5EA7 0%, #B8A8D0 100%)",
								borderRadius: 16,
								padding: 24,
								marginBottom: 20,
								color: "white",
							}}
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									marginBottom: 20,
								}}
							>
								<span style={{ fontSize: 14, fontWeight: 500 }}>
									PLATFORM LOVE
								</span>
								<span style={{ fontSize: 28 }}>🏆</span>
							</div>
							<div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
								Club Member
							</div>
							<div style={{ fontSize: 12, opacity: 0.8 }}>
								Номер карты: ****-****-****-2024
							</div>
						</div>

						{/* Club Card Settings */}
						<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
							{[
								{
									label: "Бесплатная доставка",
									enabled: true,
									description: "Бесплатная доставка цветов для клубных членов",
								},
								{
									label: "Розы в подарок",
									enabled: true,
									description: "1 букет роз еженедельно",
								},
								{
									label: "Персональный менеджер",
									enabled: true,
									description: "Выделенный менеджер поддержки 24/7",
								},
								{
									label: "VIP-поиск",
									enabled: true,
									description: "Приоритетное размещение в поиске",
								},
								{
									label: "Эксклюзивные мероприятия",
									enabled: false,
									description: "Приглашения на закрытые мероприятия",
								},
							].map((benefit, i) => (
								<div
									key={i}
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										padding: 12,
										backgroundColor: "#F5F5F7",
										borderRadius: 12,
									}}
								>
									<div>
										<div
											style={{
												fontSize: 14,
												fontWeight: 500,
												color: "#1A1A1A",
											}}
										>
											{benefit.label}
										</div>
										<div style={{ fontSize: 12, color: "#8E8E8E" }}>
											{benefit.description}
										</div>
									</div>
									<label style={{ cursor: "pointer" }}>
										<input
											type="checkbox"
											checked={benefit.enabled}
											style={{ opacity: 0, position: "absolute" }}
										/>
										<div
											style={{
												width: 48,
												height: 28,
												borderRadius: 14,
												backgroundColor: benefit.enabled
													? "#4CAF50"
													: "#E0E0E0",
												position: "relative",
												transition: "all 0.3s",
											}}
										>
											<div
												style={{
													width: 24,
													height: 24,
													borderRadius: "50%",
													backgroundColor: "white",
													position: "absolute",
													top: 2,
													left: benefit.enabled ? 22 : 2,
													transition: "all 0.3s",
												}}
											/>
										</div>
									</label>
								</div>
							))}
						</div>

						{/* Actions */}
						<div style={{ display: "flex", gap: 12, marginTop: 24 }}>
							<button
								onClick={() => setShowClubCardModal(false)}
								style={{
									flex: 1,
									padding: "14px",
									borderRadius: 12,
									backgroundColor: "#F5F5F7",
									border: "none",
									color: "#8E8E8E",
									fontSize: 14,
									fontWeight: 500,
									cursor: "pointer",
								}}
							>
								Отмена
							</button>
							<button
								onClick={() => {
									alert("Настройки сохранены!");
									setShowClubCardModal(false);
								}}
								style={{
									flex: 1,
									padding: "14px",
									borderRadius: 12,
									backgroundColor: "#7B5EA7",
									border: "none",
									color: "white",
									fontSize: 14,
									fontWeight: 600,
									cursor: "pointer",
								}}
							>
								Сохранить
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

const inputStyle = {
	width: "100%",
	padding: "12px",
	borderRadius: 8,
	border: "1px solid #E0E0E0",
	fontSize: 14,
	outline: "none",
	boxSizing: "border-box",
};
