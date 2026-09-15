import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";

const LOGO_URL =
	"https://storage.yandexcloud.net/promto-user-static-sites-prod/design-assets/909022946/8c7e6951-480b-46d6-8680-2024c7503c12/8f62e6d4-fe4e-433f-b1fa-8360fa65021d-logo.png";

const ADMIN_PIN_KEY = "platform_love_admin_pin";

// PIN — второй фактор «на этом устройстве», а не способ входа вместо сервера.
// Храним только отпечаток (SHA-256), чтобы код нельзя было прочитать из localStorage.
async function hashPin(value) {
	if (!globalThis.crypto?.subtle) return null;
	const digest = await globalThis.crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(value),
	);
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

const isPinStored = () => /^[a-f0-9]{64}$/.test(localStorage.getItem(ADMIN_PIN_KEY) || "");

export default function AdminLoginScreen() {
	const navigate = useNavigate();
	const [step, setStep] = useState("credentials"); // credentials, create_pin, enter_pin
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [pin, setPin] = useState(["", "", "", ""]);
	const [error, setError] = useState("");
	const [attempts, setAttempts] = useState(0);
	// PIN принимается только после того, как сервер подтвердил email/пароль в этой сессии
	const [credentialsVerified, setCredentialsVerified] = useState(false);
	const pinInputRefs = useRef([]);

	// Старый формат хранил PIN открытым текстом — убираем, попросим создать заново
	useEffect(() => {
		const saved = localStorage.getItem(ADMIN_PIN_KEY);
		if (saved && !/^[a-f0-9]{64}$/.test(saved)) {
			localStorage.removeItem(ADMIN_PIN_KEY);
		}
	}, []);

	const handleLogin = async (e) => {
		e.preventDefault();
		setError("");

		if (!email || !password) {
			setError("Заполните все поля");
			return;
		}

		try {
			await api.adminLogin(email, password);
		} catch (err) {
			setCredentialsVerified(false);
			setError(err.message || "Неверный email или пароль");
			return;
		}

		// Сервер выпустил токен — теперь можно требовать и локальный PIN
		setCredentialsVerified(true);

		if (isPinStored()) {
			// PIN уже установлен - переходим к его вводу
			setStep("enter_pin");
			setPassword("");
		} else {
			// PIN не установлен - создаём
			setStep("create_pin");
			setPassword("");
		}
	};

	const handlePinInput = (index, value) => {
		if (value.length > 1) {
			// Вставка нескольких символов
			const digits = value
				.replace(/\D/g, "")
				.slice(0, 4 - index)
				.split("");
			const newPin = [...pin];
			digits.forEach((digit, i) => {
				if (index + i < 4) {
					newPin[index + i] = digit;
				}
			});
			setPin(newPin);
			// Фокус на последний заполненный или следующий
			const nextIndex = Math.min(index + digits.length, 3);
			pinInputRefs.current[nextIndex]?.focus();
		} else if (/^\d$/.test(value) || value === "") {
			const newPin = [...pin];
			newPin[index] = value;
			setPin(newPin);

			// Автофокус на следующее поле
			if (value && index < 3) {
				pinInputRefs.current[index + 1]?.focus();
			}
		}
	};

	const handlePinKeyDown = (index, e) => {
		if (e.key === "Backspace" && !pin[index] && index > 0) {
			pinInputRefs.current[index - 1]?.focus();
		}
	};

	const handleCreatePin = async () => {
		const pinValue = pin.join("");
		if (pinValue.length !== 4) {
			setError("Введите 4 цифры");
			return;
		}
		if (pinValue[0] === "0") {
			setError("PIN не может начинаться с 0");
			return;
		}

		const hash = await hashPin(pinValue);
		// В небезопасном контексте crypto.subtle недоступен — тогда PIN не сохраняем,
		// вход всё равно возможен по email/паролю
		if (hash) localStorage.setItem(ADMIN_PIN_KEY, hash);

		// Переходим в админку
		navigate("/admin");
	};

	const handleEnterPin = async () => {
		if (!credentialsVerified) {
			setStep("credentials");
			setError("Сначала подтвердите email и пароль");
			return;
		}

		const pinValue = pin.join("");
		const savedHash = localStorage.getItem(ADMIN_PIN_KEY);

		if (pinValue.length !== 4) {
			setError("Введите 4 цифры");
			return;
		}

		const hash = await hashPin(pinValue);

		if (hash && hash === savedHash) {
			setAttempts(0);
			setPin(["", "", "", ""]);
			navigate("/admin");
		} else {
			const newAttempts = attempts + 1;
			setAttempts(newAttempts);
			setPin(["", "", "", ""]);

			if (newAttempts >= 3) {
				// Слишком много попыток - требуем снова ввести email/password
				setStep("credentials");
				setCredentialsVerified(false);
				setPin(["", "", "", ""]);
				setAttempts(0);
				setError("Слишком много попыток. Войдите снова.");
			} else {
				setError(`Неверный PIN. Осталось попыток: ${3 - newAttempts}`);
			}
		}
	};

	const resetPin = () => {
		localStorage.removeItem(ADMIN_PIN_KEY);
		setPin(["", "", "", ""]);
		setStep("credentials");
		setEmail("");
		setPassword("");
		setError("");
		setAttempts(0);
		setCredentialsVerified(false);
	};

	// Ввод credentials
	if (step === "credentials") {
		return (
			<div
				style={{
					minHeight: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#2D2D3A",
					fontFamily: "Inter, system-ui, sans-serif",
					padding: 20,
				}}
			>
				<div
					style={{
						width: "100%",
						maxWidth: 420,
						backgroundColor: "white",
						borderRadius: 20,
						padding: 40,
						boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
					}}
				>
					<div style={{ textAlign: "center", marginBottom: 32 }}>
						<img
							src={LOGO_URL}
							alt="Logo"
							style={{ width: 120, marginBottom: 16 }}
						/>
						<h1
							style={{
								fontSize: 24,
								fontWeight: 700,
								color: "#1A1A1A",
								margin: "0 0 8px",
							}}
						>
							Platform Love
						</h1>
						<p style={{ fontSize: 14, color: "#8E8E8E", margin: 0 }}>
							Административная панель
						</p>
					</div>

					{error && <div style={errorStyle}>{error}</div>}

					<form onSubmit={handleLogin}>
						<div style={{ marginBottom: 16 }}>
							<label
								style={{
									display: "block",
									fontSize: 13,
									fontWeight: 500,
									color: "#1A1A1A",
									marginBottom: 6,
								}}
							>
								Email
							</label>
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="admin@platformlove.ru"
								style={inputStyle}
							/>
						</div>

						<div style={{ marginBottom: 24 }}>
							<label
								style={{
									display: "block",
									fontSize: 13,
									fontWeight: 500,
									color: "#1A1A1A",
									marginBottom: 6,
								}}
							>
								Пароль
							</label>
							<input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Введите пароль"
								style={inputStyle}
							/>
						</div>

						<button type="submit" style={primaryButton}>
							Войти
						</button>
					</form>

					{isPinStored() && (
						<button
							onClick={resetPin}
							style={{
								width: "100%",
								padding: "14px",
								marginTop: 16,
								borderRadius: 10,
								backgroundColor: "#F5F5F7",
								border: "none",
								color: "#8E8E8E",
								fontSize: 14,
								cursor: "pointer",
							}}
						>
							🔑 Сбросить PIN на этом устройстве
						</button>
					)}
				</div>
			</div>
		);
	}

	// Создание PIN
	if (step === "create_pin") {
		const isComplete = pin.every((d) => d !== "");

		return (
			<div
				style={{
					minHeight: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#2D2D3A",
					fontFamily: "Inter, system-ui, sans-serif",
					padding: 20,
				}}
			>
				<div
					style={{
						width: "100%",
						maxWidth: 420,
						backgroundColor: "white",
						borderRadius: 20,
						padding: 40,
						boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
					}}
				>
					<div style={{ textAlign: "center", marginBottom: 32 }}>
						<div
							style={{
								width: 80,
								height: 80,
								borderRadius: "50%",
								backgroundColor: "#F3E8FF",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: 36,
								margin: "0 auto 16px",
							}}
						>
							🔐
						</div>
						<h1
							style={{
								fontSize: 22,
								fontWeight: 700,
								color: "#1A1A1A",
								margin: "0 0 8px",
							}}
						>
							Создайте PIN-код
						</h1>
						<p style={{ fontSize: 14, color: "#8E8E8E", margin: 0 }}>
							Введите 4 цифры для быстрого входа
						</p>
					</div>

					{error && <div style={errorStyle}>{error}</div>}

					{/* PIN Input */}
					<div
						style={{
							display: "flex",
							justifyContent: "center",
							gap: 12,
							marginBottom: 32,
						}}
					>
						{pin.map((digit, index) => (
							<input
								key={index}
								ref={(el) => (pinInputRefs.current[index] = el)}
								type="password"
								inputMode="numeric"
								maxLength={4}
								value={digit}
								onChange={(e) => handlePinInput(index, e.target.value)}
								onKeyDown={(e) => handlePinKeyDown(index, e)}
								style={{
									width: 60,
									height: 70,
									borderRadius: 12,
									border: `2px solid ${digit ? "#7B5EA7" : "#E0E0E0"}`,
									fontSize: 28,
									fontWeight: 700,
									textAlign: "center",
									outline: "none",
									transition: "all 0.2s",
								}}
							/>
						))}
					</div>

					<button
						onClick={handleCreatePin}
						disabled={!isComplete}
						style={{
							...primaryButton,
							opacity: isComplete ? 1 : 0.5,
							cursor: isComplete ? "pointer" : "not-allowed",
						}}
					>
						Подтвердить
					</button>

					<p
						style={{
							fontSize: 12,
							color: "#8E8E8E",
							textAlign: "center",
							marginTop: 20,
						}}
					>
						Используйте PIN для быстрого входа в следующий раз
					</p>
				</div>
			</div>
		);
	}

	// Ввод PIN
	if (step === "enter_pin") {
		const isComplete = pin.every((d) => d !== "");

		return (
			<div
				style={{
					minHeight: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#2D2D3A",
					fontFamily: "Inter, system-ui, sans-serif",
					padding: 20,
				}}
			>
				<div
					style={{
						width: "100%",
						maxWidth: 420,
						backgroundColor: "white",
						borderRadius: 20,
						padding: 40,
						boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
					}}
				>
					<div style={{ textAlign: "center", marginBottom: 32 }}>
						<div
							style={{
								width: 80,
								height: 80,
								borderRadius: "50%",
								backgroundColor: "#E8F5E9",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: 36,
								margin: "0 auto 16px",
							}}
						>
							👋
						</div>
						<h1
							style={{
								fontSize: 22,
								fontWeight: 700,
								color: "#1A1A1A",
								margin: "0 0 8px",
							}}
						>
							С возвращением!
						</h1>
						<p style={{ fontSize: 14, color: "#8E8E8E", margin: 0 }}>
							Введите PIN-код для входа
						</p>
					</div>

					{error && (
						<div
							style={{
								...errorStyle,
								backgroundColor: "#FFEBEB",
								color: "#FF6B6B",
							}}
						>
							{error}
						</div>
					)}

					{/* PIN Input */}
					<div
						style={{
							display: "flex",
							justifyContent: "center",
							gap: 12,
							marginBottom: 24,
						}}
					>
						{pin.map((digit, index) => (
							<input
								key={index}
								ref={(el) => (pinInputRefs.current[index] = el)}
								type="password"
								inputMode="numeric"
								maxLength={4}
								value={digit}
								onChange={(e) => handlePinInput(index, e.target.value)}
								onKeyDown={(e) => handlePinKeyDown(index, e)}
								onKeyUp={(e) => {
									if (e.key === "Enter" && isComplete) {
										handleEnterPin();
									}
								}}
								style={{
									width: 60,
									height: 70,
									borderRadius: 12,
									border: `2px solid ${digit ? "#7B5EA7" : "#E0E0E0"}`,
									fontSize: 28,
									fontWeight: 700,
									textAlign: "center",
									outline: "none",
									transition: "all 0.2s",
								}}
							/>
						))}
					</div>

					<button
						onClick={handleEnterPin}
						disabled={!isComplete}
						style={{
							...primaryButton,
							opacity: isComplete ? 1 : 0.5,
							cursor: isComplete ? "pointer" : "not-allowed",
						}}
					>
						Войти
					</button>

					<button
						onClick={resetPin}
						style={{
							width: "100%",
							padding: "14px",
							marginTop: 12,
							borderRadius: 10,
							backgroundColor: "transparent",
							border: "none",
							color: "#8E8E8E",
							fontSize: 14,
							cursor: "pointer",
						}}
					>
						Войти по email и паролю
					</button>
				</div>
			</div>
		);
	}
}

const inputStyle = {
	width: "100%",
	padding: "14px 16px",
	borderRadius: 10,
	border: "1px solid #E0E0E0",
	fontSize: 15,
	outline: "none",
	boxSizing: "border-box",
};

const primaryButton = {
	width: "100%",
	padding: "16px",
	borderRadius: 10,
	backgroundColor: "#7B5EA7",
	border: "none",
	color: "white",
	fontSize: 16,
	fontWeight: 600,
	cursor: "pointer",
	transition: "all 0.2s",
};

const errorStyle = {
	padding: "12px 16px",
	borderRadius: 10,
	backgroundColor: "#FFF9E6",
	color: "#F5C542",
	fontSize: 14,
	marginBottom: 20,
	textAlign: "center",
};
