import { useNavigate } from "react-router-dom";

export default function MatchScreen() {
	const navigate = useNavigate();

	return (
		<div
			style={{
				minHeight: "100vh",
				background:
					"linear-gradient(135deg, #9B7BB8 0%, #E8A4B8 50%, #F5D0D0 100%)",
				fontFamily: "Inter, system-ui, sans-serif",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				padding: 20,
				position: "relative",
				overflow: "hidden",
			}}
		>
			{/* Animated Floating Hearts Background */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					pointerEvents: "none",
					overflow: "hidden",
				}}
			>
				{[
					{ size: 24, top: "8%", left: "5%", delay: "0s", duration: "4s" },
					{ size: 18, top: "15%", left: "85%", delay: "0.5s", duration: "5s" },
					{ size: 30, top: "25%", left: "15%", delay: "1s", duration: "6s" },
					{
						size: 20,
						top: "35%",
						left: "75%",
						delay: "0.3s",
						duration: "4.5s",
					},
					{ size: 16, top: "45%", left: "8%", delay: "0.8s", duration: "5.5s" },
					{ size: 22, top: "55%", left: "88%", delay: "1.2s", duration: "4s" },
					{ size: 28, top: "65%", left: "25%", delay: "0.2s", duration: "5s" },
					{ size: 14, top: "75%", left: "70%", delay: "0.7s", duration: "6s" },
					{
						size: 26,
						top: "85%",
						left: "40%",
						delay: "1.5s",
						duration: "4.5s",
					},
					{
						size: 20,
						top: "12%",
						left: "55%",
						delay: "0.4s",
						duration: "5.2s",
					},
					{ size: 18, top: "50%", left: "3%", delay: "0.9s", duration: "4.8s" },
					{
						size: 24,
						top: "70%",
						left: "92%",
						delay: "1.1s",
						duration: "5.5s",
					},
					{
						size: 16,
						top: "30%",
						left: "45%",
						delay: "0.6s",
						duration: "6.2s",
					},
					{
						size: 22,
						top: "80%",
						left: "60%",
						delay: "1.3s",
						duration: "4.2s",
					},
					{
						size: 28,
						top: "20%",
						left: "35%",
						delay: "0.1s",
						duration: "5.8s",
					},
				].map((heart, index) => (
					<div
						key={index}
						style={{
							position: "absolute",
							top: heart.top,
							left: heart.left,
							animation: `floatHeart ${heart.duration} ease-in-out infinite`,
							animationDelay: heart.delay,
						}}
					>
						<svg
							viewBox="0 0 24 24"
							fill="rgba(255, 255, 255, 0.4)"
							width={heart.size}
							height={heart.size}
						>
							<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
						</svg>
					</div>
				))}
			</div>

			{/* CSS Keyframes */}
			<style>
				{`
					@keyframes floatHeart {
						0%, 100% {
							transform: translateY(0) rotate(0deg);
							opacity: 0.3;
						}
						25% {
							transform: translateY(-15px) rotate(5deg);
							opacity: 0.5;
						}
						50% {
							transform: translateY(-25px) rotate(0deg);
							opacity: 0.4;
						}
						75% {
							transform: translateY(-10px) rotate(-5deg);
							opacity: 0.5;
						}
					}
					@keyframes pulseScale {
						0%, 100% {
							transform: translate(-50%, -50%) scale(1);
						}
						50% {
							transform: translate(-50%, -50%) scale(1.1);
						}
					}
					@keyframes fadeInUp {
						from {
							opacity: 0;
							transform: translateY(30px);
						}
						to {
							opacity: 1;
							transform: translateY(0);
						}
					}
					@keyframes slideInLeft {
						from {
							opacity: 0;
							transform: translateX(-100px) rotate(-15deg);
						}
						to {
							opacity: 1;
							transform: translateX(0) rotate(-8deg);
						}
					}
					@keyframes slideInRight {
						from {
							opacity: 0;
							transform: translateX(100px) rotate(15deg);
						}
						to {
							opacity: 1;
							transform: translateX(0) rotate(8deg);
						}
					}
				`}
			</style>

			{/* Content */}
			<div
				style={{
					textAlign: "center",
					zIndex: 1,
				}}
			>
				{/* Title */}
				<h1
					style={{
						fontSize: 24,
						fontWeight: 700,
						color: "#1A1A1A",
						margin: "0 0 40px",
						textShadow: "0 2px 4px rgba(255,255,255,0.3)",
						animation: "fadeInUp 0.8s ease-out",
					}}
				>
					Поздравляем, у Вас образовалась пара!
				</h1>

				{/* Overlapping Profile Pictures */}
				<div
					style={{
						position: "relative",
						width: 200,
						height: 120,
						margin: "0 auto 50px",
					}}
				>
					{/* Left Profile */}
					<div
						style={{
							position: "absolute",
							left: 0,
							bottom: 0,
							width: 120,
							height: 120,
							borderRadius: 20,
							background: "linear-gradient(135deg, #F5D0D0, #E8C0C0)",
							boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
							transform: "rotate(-8deg)",
							overflow: "hidden",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							animation: "slideInLeft 0.8s ease-out",
						}}
					>
						<svg width="60" height="60" viewBox="0 0 24 24" fill="#CC7A8B">
							<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
						</svg>
					</div>

					{/* Center Heart */}
					<div
						style={{
							position: "absolute",
							left: "50%",
							top: "50%",
							transform: "translate(-50%, -50%)",
							zIndex: 10,
							animation: "pulseScale 1.5s ease-in-out infinite",
						}}
					>
						<div
							style={{
								width: 50,
								height: 50,
								borderRadius: "50%",
								backgroundColor: "white",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
							}}
						>
							<svg width="30" height="30" viewBox="0 0 24 24" fill="#FF6B6B">
								<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
							</svg>
						</div>
					</div>

					{/* Right Profile */}
					<div
						style={{
							position: "absolute",
							right: 0,
							bottom: 0,
							width: 120,
							height: 120,
							borderRadius: 20,
							background: "linear-gradient(135deg, #D0E8F5, #B8D4E8)",
							boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
							transform: "rotate(8deg)",
							overflow: "hidden",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							animation: "slideInRight 0.8s ease-out",
						}}
					>
						<svg width="60" height="60" viewBox="0 0 24 24" fill="#5B8DB8">
							<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
						</svg>
					</div>
				</div>

				{/* Buttons */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: 16,
						width: "100%",
						maxWidth: 280,
						margin: "0 auto",
						animation: "fadeInUp 0.8s ease-out 0.3s backwards",
					}}
				>
					{/* Continue Search Button */}
					<button
						onClick={() => navigate("/swipe")}
						style={{
							padding: "16px 32px",
							borderRadius: 30,
							backgroundColor: "rgba(255,255,255,0.8)",
							border: "2px solid #9B7BB8",
							fontSize: 16,
							fontWeight: 600,
							color: "#7B5EA7",
							cursor: "pointer",
							transition: "all 0.2s",
						}}
					>
						Продолжить поиск
					</button>

					{/* Start Communication Button */}
					<button
						onClick={() => navigate("/messages")}
						style={{
							padding: "16px 32px",
							borderRadius: 30,
							background: "linear-gradient(135deg, #CC7A8B, #9B7BB8)",
							border: "none",
							fontSize: 16,
							fontWeight: 600,
							color: "white",
							cursor: "pointer",
							boxShadow: "0 4px 16px rgba(155, 123, 184, 0.4)",
							transition: "all 0.2s",
						}}
					>
						Начать общение
					</button>
				</div>
			</div>
		</div>
	);
}
