import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SwipeFilters from "./SwipeFilters";
import api from "./api.js";

const LOGO_URL =
	"https://storage.yandexcloud.net/promto-user-static-sites-prod/design-assets/909022946/8c7e6951-480b-46d6-8680-2024c7503c12/8f62e6d4-fe4e-433f-b1fa-8360fa65021d-logo.png";

export default function SwipeScreen() {
	const navigate = useNavigate();
	const [showFilters, setShowFilters] = useState(false);
	const [offsetX, setOffsetX] = useState(0);
	const [isDragging, setIsDragging] = useState(false);
	const [candidates, setCandidates] = useState([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [showMatchModal, setShowMatchModal] = useState(false);
	const [matchedUser, setMatchedUser] = useState(null);
	const cardRef = useRef(null);
	const startXRef = useRef(0);

	// Загружаем реальных кандидатов с бэкенда при монтировании
	useEffect(() => {
		loadCandidates();
	}, []);

	const loadCandidates = async () => {
		try {
			setLoading(true);
			setError("");
			const data = await api.getCandidates();
			setCandidates(data || []);
			setCurrentIndex(0);
		} catch (err) {
			console.error("Load candidates error:", err);
			setError(err.message || "Ошибка загрузки кандидатов");
		} finally {
			setLoading(false);
		}
	};

	const currentProfile = candidates[currentIndex];

	const handleSwipe = async (direction) => {
		if (!currentProfile) return;

		// Анимация ухода
		setOffsetX(direction === "right" ? 500 : -500);

		try {
			const result = await api.swipe(currentProfile.id, direction);
			// Если мэтч — показываем модалку
			if (result?.match?.matched) {
				setMatchedUser(currentProfile);
				setShowMatchModal(true);
			}
		} catch (err) {
			console.error("Swipe error:", err);
		}

		setTimeout(() => {
			setCurrentIndex((prev) => prev + 1);
			setOffsetX(0);
		}, 300);
	};

	const handleTouchStart = (e) => {
		setIsDragging(true);
		startXRef.current = e.touches[0].clientX;
	};

	const handleTouchMove = (e) => {
		if (!isDragging) return;
		const currentX = e.touches[0].clientX;
		const diff = currentX - startXRef.current;
		setOffsetX(diff);
	};

	const handleTouchEnd = () => {
		setIsDragging(false);
		if (offsetX > 100) {
			handleSwipe("right");
		} else if (offsetX < -100) {
			handleSwipe("left");
		} else {
			setOffsetX(0);
		}
	};

	const reloadAfterFilters = () => {
		setShowFilters(false);
		loadCandidates();
	};

	const goToMessages = () => {
		setShowMatchModal(false);
		navigate("/messages");
	};

	const continueSwiping = () => {
		setShowMatchModal(false);
	};

	return (
		<>
			<div
				style={{
					minHeight: "100vh",
					backgroundColor: "#F5F5F5",
					fontFamily: "Inter, system-ui, sans-serif",
					position: "relative",
				}}
			>
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
						onClick={() => navigate("/menu")}
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
					<img
						src={LOGO_URL}
						alt="Logo"
						style={{ width: 125, height: "auto" }}
					/>
					<div style={{ display: "flex", gap: 4 }}>
						<button
							onClick={() => setShowFilters(true)}
							style={{
								backgroundColor: "transparent",
								border: "none",
								cursor: "pointer",
								padding: 8,
							}}
						>
							<svg width="40" height="40" viewBox="0 0 24 24" fill="#8E8E8E">
								<path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
							</svg>
						</button>
						<button
							onClick={() => navigate("/menu")}
							style={{
								backgroundColor: "transparent",
								border: "none",
								cursor: "pointer",
								padding: 8,
							}}
						>
							<svg width="40" height="40" viewBox="0 0 24 24" fill="#8E8E8E">
								<path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
							</svg>
						</button>
					</div>
				</div>

				{loading && (
					<div
						style={{
							padding: 40,
							textAlign: "center",
							color: "#8E8E8E",
						}}
					>
						Загрузка кандидатов...
					</div>
				)}

				{error && !loading && (
					<div
						style={{
							padding: 40,
							textAlign: "center",
							color: "#FF6B6B",
						}}
					>
						<p>{error}</p>
						<button
							onClick={loadCandidates}
							style={{
								marginTop: 16,
								padding: "12px 24px",
								backgroundColor: "#7B5EA7",
								color: "white",
								border: "none",
								borderRadius: 8,
								cursor: "pointer",
							}}
						>
							Попробовать снова
						</button>
					</div>
				)}

				{!loading && !error && currentProfile && (
					<>
						<div
							style={{
								padding: "12px 20px",
								display: "flex",
								alignItems: "center",
								gap: 8,
							}}
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="#7B5EA7">
								<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
							</svg>
							<span style={{ fontSize: 14, color: "#1A1A1A", fontWeight: 500 }}>
								{currentProfile.distance_km != null
									? `${currentProfile.distance_km} км от вас`
									: "Рядом"}
							</span>
							{currentProfile.compatibility > 0 && (
								<span
									style={{
										fontSize: 14,
										color: "#7B5EA7",
										fontWeight: 500,
									}}
								>
									• совместимость {currentProfile.compatibility}
								</span>
							)}
						</div>

						{/* Profile Card */}
						<div style={{ padding: "0 16px", position: "relative" }}>
							<div
								ref={cardRef}
								onTouchStart={handleTouchStart}
								onTouchMove={handleTouchMove}
								onTouchEnd={handleTouchEnd}
								style={{
									borderRadius: 24,
									overflow: "hidden",
									boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
									position: "relative",
									backgroundColor: "white",
									transform: `translateX(${offsetX}px) rotate(${offsetX * 0.05}deg)`,
									transition: isDragging ? "none" : "transform 0.3s ease-out",
								}}
							>
								{/* Swipe indicators */}
								{offsetX > 50 && (
									<div
										style={{
											position: "absolute",
											top: 20,
											left: 20,
											zIndex: 10,
											backgroundColor: "rgba(74, 175, 80, 0.15)",
											color: "rgba(74, 175, 80, 0.9)",
											padding: "8px 16px",
											borderRadius: 8,
											fontWeight: "bold",
											fontSize: 18,
											border: "2px solid rgba(74, 175, 80, 0.4)",
											backdropFilter: "blur(4px)",
										}}
									>
										❤️ ЛАЙК
									</div>
								)}
								{offsetX < -50 && (
									<div
										style={{
											position: "absolute",
											top: 20,
											right: 20,
											zIndex: 10,
											backgroundColor: "rgba(255, 82, 82, 0.15)",
											color: "rgba(255, 82, 82, 0.9)",
											padding: "8px 16px",
											borderRadius: 8,
											fontWeight: "bold",
											fontSize: 18,
											border: "2px solid rgba(255, 82, 82, 0.4)",
											backdropFilter: "blur(4px)",
										}}
									>
										✕ ПРОПУСК
									</div>
								)}

								<div
									style={{
										width: "100%",
										aspectRatio: "3/4",
										background:
											"linear-gradient(135deg, #E8E8E8 0%, #D0D0D0 100%)",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										position: "relative",
									}}
								>
									{currentProfile.photos && currentProfile.photos.length > 0 ? (
										<img
											src={currentProfile.photos[0]}
											alt={currentProfile.name}
											style={{
												width: "100%",
												height: "100%",
												objectFit: "cover",
											}}
										/>
									) : (
										<svg
											width="120"
											height="120"
											viewBox="0 0 24 24"
											fill="#AAAAAA"
										>
											<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
										</svg>
									)}
								</div>

								<div
									style={{
										position: "absolute",
										bottom: 0,
										left: 0,
										right: 0,
										padding: 20,
										background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
									}}
								>
									<h2
										style={{
											fontSize: 28,
											fontWeight: 700,
											color: "white",
											margin: 0,
										}}
									>
										{currentProfile.name}, {currentProfile.age}
									</h2>
									{currentProfile.bio && (
										<p
											style={{
												fontSize: 14,
												color: "rgba(255,255,255,0.8)",
												margin: "4px 0 0",
											}}
										>
											{currentProfile.bio}
										</p>
									)}
								</div>
							</div>
						</div>

						{/* Action buttons */}
						<div
							style={{
								padding: "20px",
								display: "flex",
								justifyContent: "center",
								gap: 24,
							}}
						>
							<button
								onClick={() => handleSwipe("left")}
								style={{
									width: 60,
									height: 60,
									borderRadius: "50%",
									backgroundColor: "white",
									border: "2px solid #E0E0E0",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									cursor: "pointer",
									fontSize: 24,
								}}
							>
								✕
							</button>
							<button
								onClick={() => handleSwipe("right")}
								style={{
									width: 60,
									height: 60,
									borderRadius: "50%",
									backgroundColor: "rgba(255, 107, 107, 0.1)",
									border: "2px solid rgba(255, 107, 107, 0.5)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									cursor: "pointer",
									fontSize: 24,
								}}
							>
								❤️
							</button>
						</div>

						{/* Stats */}
						<div
							style={{
								padding: "8px 20px",
								display: "flex",
								justifyContent: "center",
								gap: 24,
							}}
						>
							<span style={{ fontSize: 12, color: "#8E8E8E" }}>
								{currentIndex + 1} из {candidates.length}
							</span>
						</div>
					</>
				)}

				{/* Нет больше кандидатов */}
				{!loading &&
					!error &&
					currentIndex >= candidates.length &&
					candidates.length > 0 && (
						<div
							style={{
								padding: 40,
								textAlign: "center",
								color: "#8E8E8E",
							}}
						>
							<p style={{ fontSize: 16 }}>Вы просмотрели всех кандидатов 👀</p>
							<button
								onClick={loadCandidates}
								style={{
									marginTop: 16,
									padding: "12px 24px",
									backgroundColor: "#7B5EA7",
									color: "white",
									border: "none",
									borderRadius: 12,
									fontSize: 14,
									fontWeight: 600,
									cursor: "pointer",
								}}
							>
								Обновить
							</button>
						</div>
					)}

				{/* Нет кандидатов вообще */}
				{!loading && !error && candidates.length === 0 && (
					<div
						style={{
							padding: 40,
							textAlign: "center",
							color: "#8E8E8E",
						}}
					>
						<p style={{ fontSize: 16 }}>Нет подходящих кандидатов</p>
						<p style={{ fontSize: 12, marginTop: 8 }}>
							Попробуйте расширить фильтры
						</p>
						<button
							onClick={() => setShowFilters(true)}
							style={{
								marginTop: 16,
								padding: "12px 24px",
								backgroundColor: "#7B5EA7",
								color: "white",
								border: "none",
								borderRadius: 12,
								fontSize: 14,
								fontWeight: 600,
								cursor: "pointer",
							}}
						>
							Открыть фильтры
						</button>
					</div>
				)}
			</div>

			{/* Match Modal */}
			{showMatchModal && matchedUser && (
				<div
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background:
							"linear-gradient(135deg, rgba(155, 123, 184, 0.95), rgba(204, 122, 139, 0.95))",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						zIndex: 1000,
						padding: 20,
					}}
				>
					<h1
						style={{
							fontSize: 28,
							fontWeight: 700,
							color: "white",
							margin: "0 0 16px",
							textAlign: "center",
						}}
					>
						💕 Это мэтч!
					</h1>
					<p
						style={{
							fontSize: 16,
							color: "white",
							margin: "0 0 32px",
							textAlign: "center",
						}}
					>
						Вы понравились {matchedUser.name}
					</p>
					{matchedUser.photos && matchedUser.photos.length > 0 ? (
						<img
							src={matchedUser.photos[0]}
							alt={matchedUser.name}
							style={{
								width: 200,
								height: 200,
								borderRadius: 20,
								objectFit: "cover",
								marginBottom: 32,
								border: "4px solid white",
							}}
						/>
					) : (
						<div
							style={{
								width: 200,
								height: 200,
								borderRadius: 20,
								backgroundColor: "rgba(255,255,255,0.3)",
								marginBottom: 32,
							}}
						/>
					)}
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							gap: 12,
							width: "100%",
							maxWidth: 280,
						}}
					>
						<button
							onClick={goToMessages}
							style={{
								padding: "16px 32px",
								borderRadius: 30,
								backgroundColor: "white",
								border: "none",
								fontSize: 16,
								fontWeight: 600,
								color: "#7B5EA7",
								cursor: "pointer",
							}}
						>
							Написать
						</button>
						<button
							onClick={continueSwiping}
							style={{
								padding: "16px 32px",
								borderRadius: 30,
								backgroundColor: "transparent",
								border: "2px solid white",
								fontSize: 16,
								fontWeight: 600,
								color: "white",
								cursor: "pointer",
							}}
						>
							Продолжить
						</button>
					</div>
				</div>
			)}

			<SwipeFilters isOpen={showFilters} onClose={reloadAfterFilters} />
		</>
	);
}
