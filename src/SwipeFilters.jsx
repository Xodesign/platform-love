import { useState } from "react";
import api from "./api.js";
// SwipeFilters — модалка фильтров свайпа. Сохраняет настройки на бэкенд.

const LOGO_URL =
	"https://storage.yandexcloud.net/promto-user-static-sites-prod/design-assets/909022946/8c7e6951-480b-46d6-8680-2024c7503c12/8f62e6d4-fe4e-433f-b1fa-8360fa65021d-logo.png";

export default function SwipeFilters({ isOpen, onClose }) {
	const [gender, setGender] = useState("all");
	const [region, setRegion] = useState("");
	const [hobbies, setHobbies] = useState("");
	const [zavidnaya, setZavidnaya] = useState(false);
	const [withPhoto, setWithPhoto] = useState(true);
	const [heightMin, setHeightMin] = useState(160);
	const [heightMax, setHeightMax] = useState(190);
	const [ageMin, setAgeMin] = useState(18);
	const [ageMax, setAgeMax] = useState(60);
	const [weightMin, setWeightMin] = useState(45);
	const [weightMax, setWeightMax] = useState(100);
	const [radius, setRadius] = useState(24);
	const [question1, setQuestion1] = useState("");
	const [question2, setQuestion2] = useState("");

	const questionOptions = [
		{ value: "", label: "Выберите..." },
		{ value: "q1_1", label: "Какой тип отношений предпочитаете?" },
		{ value: "q1_2", label: "Как относитесь к детям?" },
		{ value: "q1_3", label: "Важна ли внешность?" },
		{ value: "q1_4", label: "Курите?" },
	];

	const question2Options = [
		{ value: "", label: "Выберите..." },
		{ value: "q2_1", label: "Какое у вас образование?" },
		{ value: "q2_2", label: "Есть ли автомобиль?" },
		{ value: "q2_3", label: "Как часто занимаетесь спортом?" },
		{ value: "q2_4", label: "Предпочитаемый тип отдыха?" },
	];

	if (!isOpen) return null;

	const handleApplyFilters = async () => {
		try {
			await api.request("/filters/settings", {
				method: "PUT",
				body: JSON.stringify({
					min_age: ageMin,
					max_age: ageMax,
					looking_for: gender === "all" ? null : gender,
					max_distance: radius,
					filters: {
						with_photo: withPhoto,
						height_min: heightMin,
						height_max: heightMax,
						weight_min: weightMin,
						weight_max: weightMax,
					},
				}),
			});
		} catch (err) {
			console.error("Ошибка сохранения фильтров:", err);
		}
		onClose();
	};

	return (
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundColor: "#F5F5F5",
				zIndex: 1000,
				overflow: "auto",
				fontFamily: "Inter, system-ui, sans-serif",
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
					onClick={onClose}
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
				<img src={LOGO_URL} alt="Logo" style={{ width: 100, height: "auto" }} />
				<div style={{ width: 40 }} />
			</div>

			<div style={{ maxWidth: 375, margin: "0 auto", padding: "20px 16px" }}>
				<h1
					style={{
						fontSize: 20,
						fontWeight: 700,
						color: "#1A1A1A",
						margin: "0 0 20px",
						textAlign: "center",
					}}
				>
					Фильтр поиска
				</h1>

				{/* Gender Selection */}
				<div style={{ marginBottom: 24 }}>
					<span
						style={{
							fontSize: 14,
							color: "#8E8E8E",
							marginBottom: 8,
							display: "block",
						}}
					>
						Ищу
					</span>
					<div style={{ display: "flex", gap: 8 }}>
						{[
							{ value: "male", label: "Мужчину" },
							{ value: "female", label: "Женщину" },
							{ value: "all", label: "Все" },
						].map((option) => (
							<button
								key={option.value}
								onClick={() => setGender(option.value)}
								style={{
									flex: 1,
									padding: "12px 8px",
									borderRadius: 12,
									fontSize: 13,
									fontWeight: 500,
									border: "none",
									cursor: "pointer",
									backgroundColor:
										gender === option.value
											? "linear-gradient(135deg, #7B5EA7 0%, #9B7EC7 100%)"
											: "white",
									color: gender === option.value ? "white" : "#8E8E8E",
									transition: "all 0.2s",
								}}
							>
								{option.label}
							</button>
						))}
					</div>
				</div>

				{/* Region */}
				<div style={{ marginBottom: 16 }}>
					<label
						style={{
							fontSize: 14,
							color: "#8E8E8E",
							marginBottom: 8,
							display: "block",
						}}
					>
						Область
					</label>
					<input
						type="text"
						value={region}
						onChange={(e) => setRegion(e.target.value)}
						placeholder="Введите область"
						style={{
							width: "100%",
							padding: "12px 16px",
							backgroundColor: "white",
							border: "1px solid #E8E8E8",
							borderRadius: 12,
							fontSize: 15,
							color: "#1A1A1A",
							outline: "none",
						}}
					/>
				</div>

				{/* Hobbies */}
				<div style={{ marginBottom: 16 }}>
					<label
						style={{
							fontSize: 14,
							color: "#8E8E8E",
							marginBottom: 8,
							display: "block",
						}}
					>
						Хобби
					</label>
					<input
						type="text"
						value={hobbies}
						onChange={(e) => setHobbies(e.target.value)}
						placeholder="Введите хобби"
						style={{
							width: "100%",
							padding: "12px 16px",
							backgroundColor: "white",
							border: "1px solid #E8E8E8",
							borderRadius: 12,
							fontSize: 15,
							color: "#1A1A1A",
							outline: "none",
						}}
					/>
				</div>

				{/* Zavidnaya Checkbox */}
				<div style={{ marginBottom: 20 }}>
					<label
						style={{
							display: "flex",
							alignItems: "center",
							gap: 12,
							cursor: "pointer",
							padding: "12px 16px",
							backgroundColor: "white",
							borderRadius: 12,
						}}
					>
						<div
							onClick={() => setZavidnaya(!zavidnaya)}
							style={{
								width: 24,
								height: 24,
								borderRadius: 6,
								border: `2px solid ${zavidnaya ? "#7B5EA7" : "#CCCCCC"}`,
								backgroundColor: zavidnaya ? "#7B5EA7" : "transparent",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							{zavidnaya && (
								<svg width="14" height="14" viewBox="0 0 24 24" fill="white">
									<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
								</svg>
							)}
						</div>
						<span style={{ fontSize: 15, color: "#1A1A1A" }}>
							Завидная невеста
						</span>
					</label>
				</div>

				{/* Height Range */}
				<div style={{ marginBottom: 16 }}>
					<label
						style={{
							fontSize: 14,
							color: "#8E8E8E",
							marginBottom: 8,
							display: "block",
						}}
					>
						Рост
					</label>
					<div style={{ display: "flex", gap: 12, alignItems: "center" }}>
						<input
							type="number"
							value={heightMin}
							onChange={(e) => setHeightMin(Number(e.target.value))}
							style={{
								flex: 1,
								padding: "12px 16px",
								backgroundColor: "white",
								border: "1px solid #E8E8E8",
								borderRadius: 12,
								fontSize: 15,
								color: "#1A1A1A",
								outline: "none",
								textAlign: "center",
							}}
						/>
						<span style={{ color: "#8E8E8E" }}>—</span>
						<input
							type="number"
							value={heightMax}
							onChange={(e) => setHeightMax(Number(e.target.value))}
							style={{
								flex: 1,
								padding: "12px 16px",
								backgroundColor: "white",
								border: "1px solid #E8E8E8",
								borderRadius: 12,
								fontSize: 15,
								color: "#1A1A1A",
								outline: "none",
								textAlign: "center",
							}}
						/>
						<span style={{ color: "#8E8E8E", fontSize: 14 }}>см</span>
					</div>
				</div>

				{/* Age Range */}
				<div style={{ marginBottom: 16 }}>
					<label
						style={{
							fontSize: 14,
							color: "#8E8E8E",
							marginBottom: 8,
							display: "block",
						}}
					>
						Возраст
					</label>
					<div style={{ display: "flex", gap: 12, alignItems: "center" }}>
						<input
							type="number"
							value={ageMin}
							onChange={(e) => setAgeMin(Number(e.target.value))}
							style={{
								flex: 1,
								padding: "12px 16px",
								backgroundColor: "white",
								border: "1px solid #E8E8E8",
								borderRadius: 12,
								fontSize: 15,
								color: "#1A1A1A",
								outline: "none",
								textAlign: "center",
							}}
						/>
						<span style={{ color: "#8E8E8E" }}>—</span>
						<input
							type="number"
							value={ageMax}
							onChange={(e) => setAgeMax(Number(e.target.value))}
							style={{
								flex: 1,
								padding: "12px 16px",
								backgroundColor: "white",
								border: "1px solid #E8E8E8",
								borderRadius: 12,
								fontSize: 15,
								color: "#1A1A1A",
								outline: "none",
								textAlign: "center",
							}}
						/>
						<span style={{ color: "#8E8E8E", fontSize: 14 }}>лет</span>
					</div>
				</div>

				{/* Weight Range */}
				<div style={{ marginBottom: 16 }}>
					<label
						style={{
							fontSize: 14,
							color: "#8E8E8E",
							marginBottom: 8,
							display: "block",
						}}
					>
						Вес
					</label>
					<div style={{ display: "flex", gap: 12, alignItems: "center" }}>
						<input
							type="number"
							value={weightMin}
							onChange={(e) => setWeightMin(Number(e.target.value))}
							style={{
								flex: 1,
								padding: "12px 16px",
								backgroundColor: "white",
								border: "1px solid #E8E8E8",
								borderRadius: 12,
								fontSize: 15,
								color: "#1A1A1A",
								outline: "none",
								textAlign: "center",
							}}
						/>
						<span style={{ color: "#8E8E8E" }}>—</span>
						<input
							type="number"
							value={weightMax}
							onChange={(e) => setWeightMax(Number(e.target.value))}
							style={{
								flex: 1,
								padding: "12px 16px",
								backgroundColor: "white",
								border: "1px solid #E8E8E8",
								borderRadius: 12,
								fontSize: 15,
								color: "#1A1A1A",
								outline: "none",
								textAlign: "center",
							}}
						/>
						<span style={{ color: "#8E8E8E", fontSize: 14 }}>кг</span>
					</div>
				</div>

				{/* Question 1 */}
				<div style={{ marginBottom: 16 }}>
					<label
						style={{
							fontSize: 14,
							color: "#8E8E8E",
							marginBottom: 8,
							display: "block",
						}}
					>
						Вопрос 1
					</label>
					<select
						value={question1}
						onChange={(e) => setQuestion1(e.target.value)}
						style={{
							width: "100%",
							padding: "12px 16px",
							backgroundColor: "white",
							border: "1px solid #E8E8E8",
							borderRadius: 12,
							fontSize: 15,
							color: question1 ? "#1A1A1A" : "#8E8E8E",
							outline: "none",
							cursor: "pointer",
						}}
					>
						{questionOptions.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
				</div>

				{/* Question 2 */}
				<div style={{ marginBottom: 16 }}>
					<label
						style={{
							fontSize: 14,
							color: "#8E8E8E",
							marginBottom: 8,
							display: "block",
						}}
					>
						Вопрос 2
					</label>
					<select
						value={question2}
						onChange={(e) => setQuestion2(e.target.value)}
						style={{
							width: "100%",
							padding: "12px 16px",
							backgroundColor: "white",
							border: "1px solid #E8E8E8",
							borderRadius: 12,
							fontSize: 15,
							color: question2 ? "#1A1A1A" : "#8E8E8E",
							outline: "none",
							cursor: "pointer",
						}}
					>
						{question2Options.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
				</div>

				{/* With Photo Checkbox */}
				<div style={{ marginBottom: 24 }}>
					<label
						style={{
							display: "flex",
							alignItems: "center",
							gap: 12,
							cursor: "pointer",
							padding: "12px 16px",
							backgroundColor: "white",
							borderRadius: 12,
						}}
					>
						<div
							onClick={() => setWithPhoto(!withPhoto)}
							style={{
								width: 24,
								height: 24,
								borderRadius: 12,
								border: `2px solid ${withPhoto ? "#7B5EA7" : "#CCCCCC"}`,
								backgroundColor: withPhoto ? "#7B5EA7" : "transparent",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							{withPhoto && (
								<svg width="14" height="14" viewBox="0 0 24 24" fill="white">
									<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
								</svg>
							)}
						</div>
						<span style={{ fontSize: 15, color: "#1A1A1A" }}>
							Анкета только с фото
						</span>
					</label>
				</div>

				{/* Radius Slider */}
				<div style={{ marginBottom: 24 }}>
					<label
						style={{
							fontSize: 14,
							color: "#8E8E8E",
							marginBottom: 12,
							display: "block",
						}}
					>
						Радиус поиска
					</label>
					<div style={{ padding: "0 4px" }}>
						<input
							type="range"
							min="1"
							max="100"
							value={radius}
							onChange={(e) => setRadius(Number(e.target.value))}
							style={{
								width: "100%",
								height: 8,
								borderRadius: 4,
								appearance: "none",
								background: `linear-gradient(to right, #7B5EA7 0%, #7B5EA7 ${radius}%, #E8E8E8 ${radius}%, #E8E8E8 100%)`,
								outline: "none",
							}}
						/>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								marginTop: 8,
							}}
						>
							<span style={{ fontSize: 12, color: "#8E8E8E" }}>1 км</span>
							<span style={{ fontSize: 16, fontWeight: 600, color: "#7B5EA7" }}>
								{radius} км
							</span>
							<span style={{ fontSize: 12, color: "#8E8E8E" }}>100 км</span>
						</div>
					</div>
				</div>

				{/* Continue Button */}
				<button
					onClick={handleApplyFilters}
					style={{
						width: "100%",
						padding: "16px",
						backgroundColor: "#7B5EA7",
						color: "white",
						borderRadius: 12,
						fontSize: 16,
						fontWeight: 600,
						border: "none",
						cursor: "pointer",
						boxShadow: "0 4px 12px rgba(123, 94, 167, 0.3)",
					}}
				>
					Продолжить
				</button>

				<div style={{ height: 40 }} />
			</div>
		</div>
	);
}
