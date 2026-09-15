import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api.js";

const LOGO_URL =
	"https://storage.yandexcloud.net/promto-user-static-sites-prod/design-assets/909022946/8c7e6951-480b-46d6-8680-2024c7503c12/8f62e6d4-fe4e-433f-b1fa-8360fa65021d-logo.png";

const periods = [
	{ id: 1, months: 3, price: "240.00" },
	{ id: 2, months: 6, price: "380.00" },
	{ id: 3, months: 12, price: "610.00" },
];

const paymentMethods = [
	{ id: 1, name: "СБП", subtitle: "система быстрых платежей", icon: "sbp" },
	{ id: 2, name: "MIR Pay", subtitle: "", icon: "mir" },
	{ id: 3, name: "BANK", subtitle: "", icon: "bank" },
];

export default function SubscriptionScreen() {
	const navigate = useNavigate();
	const [selectedPeriod, setSelectedPeriod] = useState(2);
	const [selectedPayment, setSelectedPayment] = useState(2);

	const handlePay = async () => {
		try {
			await api.subscribe("premium");
			alert("Оплата успешно выполнена!");
		} catch {
			alert("Не удалось оформить подписку");
		}
		navigate("/menu");
	};

	return (
		<div
			style={{
				minHeight: "100vh",
				backgroundColor: "#F5F5F5",
				fontFamily: "Inter, system-ui, sans-serif",
				paddingBottom: 120,
			}}
		>
			{/* Header */}
			<div
				style={{
					backgroundColor: "white",
					padding: "12px 16px",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
					position: "sticky",
					top: 0,
					zIndex: 10,
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
					<svg width="24" height="24" viewBox="0 0 24 24" fill="#1A1A1A">
						<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
					</svg>
				</button>
				<img src={LOGO_URL} alt="Logo" style={{ width: 80, height: "auto" }} />
				<button
					onClick={() => navigate("/settings")}
					style={{
						backgroundColor: "transparent",
						border: "none",
						cursor: "pointer",
						padding: 8,
					}}
				>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="#1A1A1A">
						<path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
					</svg>
				</button>
			</div>

			{/* Title */}
			<div style={{ padding: "20px 20px 0" }}>
				<h1
					style={{
						fontSize: 20,
						fontWeight: 700,
						color: "#1A1A1A",
						margin: 0,
					}}
				>
					Автопродление клубной карты
				</h1>
			</div>

			{/* Period Selection */}
			<div style={{ padding: "20px" }}>
				<h2
					style={{
						fontSize: 14,
						fontWeight: 600,
						color: "#8E8E8E",
						margin: "0 0 12px",
					}}
				>
					Выберите период
				</h2>

				<div
					style={{
						backgroundColor: "white",
						borderRadius: 16,
						overflow: "hidden",
						boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
					}}
				>
					{periods.map((period, index) => (
						<div
							key={period.id}
							onClick={() => setSelectedPeriod(period.id)}
							style={{
								display: "flex",
								alignItems: "center",
								padding: "16px 20px",
								borderBottom:
									index < periods.length - 1 ? "1px solid #F0F0F0" : "none",
								cursor: "pointer",
							}}
						>
							<div
								style={{
									width: 24,
									height: 24,
									borderRadius: "50%",
									border: `2px solid ${selectedPeriod === period.id ? "#7B5EA7" : "#E0E0E0"}`,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									marginRight: 16,
								}}
							>
								{selectedPeriod === period.id && (
									<div
										style={{
											width: 12,
											height: 12,
											borderRadius: "50%",
											backgroundColor: "#7B5EA7",
										}}
									/>
								)}
							</div>
							<span
								style={{
									flex: 1,
									fontSize: 15,
									color: "#1A1A1A",
								}}
							>
								{period.months}{" "}
								{period.months === 1
									? "месяц"
									: period.months < 5
										? "месяца"
										: "месяцев"}
							</span>
							<span
								style={{
									fontSize: 15,
									fontWeight: 600,
									color: "#1A1A1A",
								}}
							>
								{period.price} ₽
							</span>
						</div>
					))}
				</div>
			</div>

			{/* Payment Method Selection */}
			<div style={{ padding: "0 20px" }}>
				<h2
					style={{
						fontSize: 14,
						fontWeight: 600,
						color: "#8E8E8E",
						margin: "0 0 12px",
					}}
				>
					Выберите способ оплаты
				</h2>

				<div
					style={{
						backgroundColor: "white",
						borderRadius: 16,
						overflow: "hidden",
						boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
					}}
				>
					{paymentMethods.map((method, index) => (
						<div
							key={method.id}
							onClick={() => setSelectedPayment(method.id)}
							style={{
								display: "flex",
								alignItems: "center",
								padding: "16px 20px",
								borderBottom:
									index < paymentMethods.length - 1
										? "1px solid #F0F0F0"
										: "none",
								border:
									selectedPayment === 3 && method.id === 3
										? "2px solid #5B8DB8"
										: "none",
								borderRadius: selectedPayment === 3 && method.id === 3 ? 16 : 0,
								cursor: "pointer",
							}}
						>
							<div
								style={{
									width: 24,
									height: 24,
									borderRadius: "50%",
									border: `2px solid ${selectedPayment === method.id ? "#7B5EA7" : "#E0E0E0"}`,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									marginRight: 16,
								}}
							>
								{selectedPayment === method.id && (
									<div
										style={{
											width: 12,
											height: 12,
											borderRadius: "50%",
											backgroundColor: "#7B5EA7",
										}}
									/>
								)}
							</div>

							{/* Payment Icon */}
							<div
								style={{
									width: 40,
									height: 28,
									borderRadius: 6,
									backgroundColor: "#F5F5F5",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									marginRight: 12,
								}}
							>
								{method.icon === "sbp" && (
									<svg
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="#7B5EA7"
									>
										<circle
											cx="12"
											cy="12"
											r="10"
											fill="none"
											stroke="#7B5EA7"
											strokeWidth="2"
										/>
										<text
											x="12"
											y="16"
											textAnchor="middle"
											fontSize="10"
											fill="#7B5EA7"
										>
											₽
										</text>
									</svg>
								)}
								{method.icon === "mir" && (
									<svg
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="#7B5EA7"
									>
										<rect width="24" height="24" rx="4" fill="#7B5EA7" />
										<text
											x="12"
											y="16"
											textAnchor="middle"
											fontSize="8"
											fill="white"
										>
											MIR
										</text>
									</svg>
								)}
								{method.icon === "bank" && (
									<svg
										width="24"
										height="24"
										viewBox="0 0 24 24"
										fill="#5B8DB8"
									>
										<rect
											x="2"
											y="6"
											width="20"
											height="12"
											rx="2"
											fill="none"
											stroke="#5B8DB8"
											strokeWidth="2"
										/>
										<line
											x1="12"
											y1="6"
											x2="12"
											y2="18"
											stroke="#5B8DB8"
											strokeWidth="2"
										/>
									</svg>
								)}
							</div>

							<span
								style={{
									flex: 1,
									fontSize: 15,
									color: "#1A1A1A",
								}}
							>
								{method.name}
							</span>
							{method.subtitle && (
								<span
									style={{
										fontSize: 11,
										color: "#8E8E8E",
										marginRight: 8,
									}}
								>
									{method.subtitle}
								</span>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Total */}
			<div style={{ padding: "24px 20px" }}>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: 16,
					}}
				>
					<span style={{ fontSize: 14, color: "#8E8E8E" }}>К оплате:</span>
					<span style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A" }}>
						{periods.find((p) => p.id === selectedPeriod)?.price} ₽
					</span>
				</div>

				<button
					onClick={handlePay}
					style={{
						width: "100%",
						padding: "16px",
						borderRadius: 12,
						backgroundColor: "#7B5EA7",
						border: "none",
						fontSize: 16,
						fontWeight: 600,
						color: "white",
						cursor: "pointer",
						boxShadow: "0 4px 12px rgba(123, 94, 167, 0.3)",
					}}
				>
					Оплатить
				</button>
			</div>
		</div>
	);
}
