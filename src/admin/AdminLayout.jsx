import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

const navItems = [
	{ path: "/admin/support", label: "Поддержка", icon: "💬", badge: 2 },
	{ path: "/admin/orders", label: "Заказы", icon: "🌸", badge: 5 },
	{
		path: "/admin/payment",
		label: "ОПЛАТА",
		icon: "💰",
		badge: null,
		highlight: true,
	},
	{ path: "/admin/complaints", label: "Жалобы", icon: "🚨", badge: 3 },
	{ path: "/admin/moderation", label: "Модерация", icon: "✓", badge: 5 },
	{ path: "/admin/users", label: "Пользователи", icon: "👥" },
	{ path: "/admin/blacklist", label: "Чёрный список", icon: "🚫" },
	{ path: "/admin/logs", label: "Логи", icon: "📝" },
	{ path: "/admin/settings", label: "Настройки", icon: "⚙️" },
];

const bottomNavItems = [
	{ path: "/admin", label: "Дашборд", icon: "📊" },
	{ path: "/admin/support", label: "Поддержка", icon: "💬" },
	{ path: "/admin/orders", label: "Заказы", icon: "🌸" },
	{ path: "/admin/users", label: "Люди", icon: "👥" },
	{ path: "/admin/settings", label: "Настройки", icon: "⚙️" },
];

export default function AdminLayout() {
	const navigate = useNavigate();
	const [sidebarOpen, setSidebarOpen] = useState(false);

	const handleLogout = () => {
		navigate("/admin/login");
	};

	const handleBackToApp = () => {
		navigate("/menu");
	};

	const closeSidebar = () => {
		setSidebarOpen(false);
	};

	return (
		<div
			style={{ fontFamily: "Inter, system-ui, sans-serif", minHeight: "100vh" }}
		>
			{/* Mobile Header */}
			<div
				style={{
					display: "none",
					backgroundColor: "#2D2D3A",
					padding: "12px 16px",
					position: "sticky",
					top: 0,
					zIndex: 100,
				}}
				className="mobile-header"
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<button
						onClick={() => setSidebarOpen(!sidebarOpen)}
						style={{
							backgroundColor: "transparent",
							border: "none",
							color: "white",
							cursor: "pointer",
							padding: 8,
						}}
					>
						<svg width="24" height="24" viewBox="0 0 24 24" fill="white">
							<path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
						</svg>
					</button>
					<span style={{ color: "white", fontWeight: 600, fontSize: 16 }}>
						Admin
					</span>
					<button
						onClick={handleBackToApp}
						style={{
							backgroundColor: "transparent",
							border: "none",
							color: "white",
							cursor: "pointer",
							fontSize: 12,
							padding: 8,
						}}
					>
						← В приложение
					</button>
				</div>
			</div>

			{/* Desktop Sidebar */}
			<div
				style={{
					width: 260,
					backgroundColor: "#2D2D3A",
					color: "white",
					display: "flex",
					flexDirection: "column",
					padding: "24px 0",
					position: "fixed",
					top: 0,
					bottom: 0,
					left: 0,
					zIndex: 50,
				}}
				className="desktop-sidebar"
			>
				<div style={{ padding: "0 24px 32px" }}>
					<h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
						Platform Love
					</h1>
					<p style={{ fontSize: 12, color: "#9B7BB8", margin: "4px 0 0" }}>
						Администрирование
					</p>
				</div>

				<nav style={{ flex: 1, overflowY: "auto" }}>
					<div
						style={{
							padding: "0 24px 8px",
							fontSize: 11,
							color: "#6B6B6B",
							textTransform: "uppercase",
							letterSpacing: 1,
						}}
					>
						Основное
					</div>
					{navItems.slice(0, 5).map((item) => (
						<NavLink
							key={item.path}
							to={item.path}
							style={({ isActive }) => ({
								display: "flex",
								alignItems: "center",
								gap: 12,
								padding: "12px 24px",
								color: isActive
									? "white"
									: item.highlight
										? "#4CAF50"
										: "#B0B0B0",
								backgroundColor: isActive
									? "#7B5EA7"
									: item.highlight
										? "rgba(76, 175, 80, 0.15)"
										: "transparent",
								textDecoration: "none",
								fontSize: 14,
								fontWeight: item.highlight ? 700 : 400,
								transition: "all 0.2s",
							})}
						>
							<span style={{ fontSize: 16 }}>{item.icon}</span>
							<span>{item.label}</span>
							{item.badge && (
								<span
									style={{
										marginLeft: "auto",
										padding: "2px 8px",
										borderRadius: 10,
										backgroundColor: "#FF6B6B",
										color: "white",
										fontSize: 11,
										fontWeight: 600,
									}}
								>
									{item.badge}
								</span>
							)}
						</NavLink>
					))}
					<div
						style={{
							padding: "16px 24px 8px",
							fontSize: 11,
							color: "#6B6B6B",
							textTransform: "uppercase",
							letterSpacing: 1,
						}}
					>
						Управление
					</div>
					{navItems.slice(5).map((item) => (
						<NavLink
							key={item.path}
							to={item.path}
							style={({ isActive }) => ({
								display: "flex",
								alignItems: "center",
								gap: 12,
								padding: "12px 24px",
								color: isActive ? "white" : "#B0B0B0",
								backgroundColor: isActive ? "#7B5EA7" : "transparent",
								textDecoration: "none",
								fontSize: 14,
								transition: "all 0.2s",
							})}
						>
							<span style={{ fontSize: 16 }}>{item.icon}</span>
							<span>{item.label}</span>
						</NavLink>
					))}
				</nav>

				<div style={{ padding: "0 24px" }}>
					<button
						onClick={handleLogout}
						style={{
							width: "100%",
							padding: "12px",
							borderRadius: 8,
							backgroundColor: "transparent",
							border: "1px solid #7B5EA7",
							color: "white",
							cursor: "pointer",
							fontSize: 14,
						}}
					>
						Выйти
					</button>
				</div>
			</div>

			{/* Mobile Sidebar Overlay */}
			{sidebarOpen && (
				<div
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: "rgba(0,0,0,0.5)",
						zIndex: 200,
					}}
					onClick={closeSidebar}
				>
					<div
						style={{
							width: 280,
							height: "100%",
							backgroundColor: "#2D2D3A",
							padding: "24px 0",
							animation: "slideIn 0.2s ease-out",
						}}
						onClick={(e) => e.stopPropagation()}
					>
						<style>
							{`
								@keyframes slideIn {
									from { transform: translateX(-100%); }
									to { transform: translateX(0); }
								}
								@media (max-width: 768px) {
									.desktop-sidebar { display: none !important; }
									.mobile-header { display: flex !important; }
									.mobile-content { margin-left: 0 !important; padding: 0 !important; }
									.mobile-nav { display: flex !important; }
								}
							`}
						</style>
						<div
							style={{
								padding: "0 24px 24px",
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<div>
								<h1
									style={{
										fontSize: 18,
										fontWeight: 700,
										margin: 0,
										color: "white",
									}}
								>
									Platform Love
								</h1>
								<p
									style={{ fontSize: 11, color: "#9B7BB8", margin: "4px 0 0" }}
								>
									Администрирование
								</p>
							</div>
							<button
								onClick={closeSidebar}
								style={{
									backgroundColor: "transparent",
									border: "none",
									color: "white",
									cursor: "pointer",
									padding: 8,
								}}
							>
								<svg width="24" height="24" viewBox="0 0 24 24" fill="white">
									<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
								</svg>
							</button>
						</div>

						<nav>
							{navItems.map((item) => (
								<NavLink
									key={item.path}
									to={item.path}
									onClick={closeSidebar}
									style={({ isActive }) => ({
										display: "flex",
										alignItems: "center",
										gap: 12,
										padding: "14px 24px",
										color: isActive ? "white" : "#B0B0B0",
										backgroundColor: isActive ? "#7B5EA7" : "transparent",
										textDecoration: "none",
										fontSize: 15,
									})}
								>
									<span style={{ fontSize: 18 }}>{item.icon}</span>
									<span>{item.label}</span>
									{item.badge && (
										<span
											style={{
												marginLeft: "auto",
												padding: "2px 8px",
												borderRadius: 10,
												backgroundColor: "#FF6B6B",
												color: "white",
												fontSize: 11,
												fontWeight: 600,
											}}
										>
											{item.badge}
										</span>
									)}
								</NavLink>
							))}
						</nav>
					</div>
				</div>
			)}

			{/* Main Content */}
			<div
				className="mobile-content"
				style={{
					marginLeft: 260,
					flex: 1,
					backgroundColor: "#F5F5F7",
					minHeight: "100vh",
				}}
			>
				{/* Desktop Header */}
				<div
					style={{
						backgroundColor: "white",
						padding: "16px 32px",
						boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
					className="desktop-header"
				>
					<h2
						style={{
							fontSize: 20,
							fontWeight: 600,
							color: "#1A1A1A",
							margin: 0,
						}}
					>
						Панель управления
					</h2>
					<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
						<button
							onClick={handleBackToApp}
							style={{
								padding: "8px 16px",
								backgroundColor: "#7B5EA7",
								color: "white",
								border: "none",
								borderRadius: 8,
								cursor: "pointer",
								fontSize: 14,
								fontWeight: 500,
							}}
						>
							← В приложение
						</button>
						<div
							style={{
								width: 36,
								height: 36,
								borderRadius: "50%",
								backgroundColor: "#7B5EA7",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								color: "white",
								fontWeight: 600,
							}}
						>
							А
						</div>
						<span style={{ fontSize: 14, color: "#1A1A1A" }}>
							Администратор
						</span>
					</div>
				</div>

				{/* Content */}
				<div style={{ padding: 32 }} className="mobile-content-inner">
					<Outlet />
				</div>
			</div>

			{/* Mobile Bottom Navigation */}
			<div
				className="mobile-nav"
				style={{
					display: "none",
					position: "fixed",
					bottom: 0,
					left: 0,
					right: 0,
					backgroundColor: "white",
					borderTop: "1px solid #E0E0E0",
					padding: "8px 0",
					zIndex: 50,
				}}
			>
				<div style={{ display: "flex", justifyContent: "space-around" }}>
					{bottomNavItems.map((item) => (
						<NavLink
							key={item.path}
							to={item.path}
							end={item.path === "/admin"}
							style={({ isActive }) => ({
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								padding: "6px 8px",
								color: isActive ? "#7B5EA7" : "#8E8E8E",
								textDecoration: "none",
								fontSize: 10,
								minWidth: 60,
							})}
						>
							<span style={{ fontSize: 24 }}>{item.icon}</span>
							<span style={{ marginTop: 2 }}>{item.label}</span>
						</NavLink>
					))}
				</div>
			</div>

			<style>
				{`
					@media (max-width: 768px) {
						.desktop-sidebar { display: none !important; }
						.mobile-header { display: flex !important; }
						.mobile-content { margin-left: 0 !important; padding: 0 !important; }
						.mobile-content-inner { padding: 16px !important; padding-bottom: 80px !important; }
						.mobile-nav { display: flex !important; }
						.desktop-header { display: none !important; }
					}
				`}
			</style>
		</div>
	);
}
