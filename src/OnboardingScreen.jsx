import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// Слайды первого запуска. Картинки лежат в public/onboarding/
const SLIDES = [
	{
		id: "flowers",
		image: "/onboarding/1-flowers.jpg",
		title: "Дарите девушкам цветы!",
		text: "Одно дело дарить картинку с цветами, другое дело живой настоящий букет, который растопит любое сердце",
	},
	{
		id: "love",
		image: "/onboarding/2-love.jpg",
		title: "Найди своё",
		text: "Любовь или дружба, романтика или бизнес… здесь каждый найдет, что искал",
	},
	{
		id: "friends",
		image: "/onboarding/3-friends.jpg",
		title: "Найди единомышленников",
		text: "Применяя нашу систему поиска, Вы легко найдете друга по интересам, который возможно живет в соседнем доме",
	},
	{
		id: "wedding",
		image: "/onboarding/4-wedding.jpg",
		title: "Заветные женихи и невесты",
		text: "Только у нас! Вы найдете их по золотой короне 👑 Поспешите, чтобы не упустить свою судьбу",
	},
];

export const ONBOARDING_KEY = "onboarding_done";

export function isOnboardingDone() {
	try {
		return localStorage.getItem(ONBOARDING_KEY) === "1";
	} catch {
		return true;
	}
}

export function finishOnboarding() {
	try {
		localStorage.setItem(ONBOARDING_KEY, "1");
	} catch {
		// localStorage может быть недоступен — не блокируем вход
	}
}

export default function OnboardingScreen({ onFinish }) {
	const navigate = useNavigate();
	const [index, setIndex] = useState(0);
	const scrollRef = useRef(null);
	const touchStartX = useRef(0);

	const last = index === SLIDES.length - 1;

	const goTo = useCallback((i) => {
		const clamped = Math.max(0, Math.min(SLIDES.length - 1, i));
		setIndex(clamped);
		const el = scrollRef.current;
		if (el) el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
	}, []);

	const complete = useCallback(() => {
		finishOnboarding();
		// На «/» онбординг рендерит RootGate, и navigate("/") в тот же адрес
		// экран не перерисовывает: «Пропустить» жмёшь, а форма входа так и не
		// появляется. Поэтому, когда родитель дал колбэк, зовём его, а
		// navigate остаётся для явного маршрута /onboarding.
		if (onFinish) {
			onFinish();
			return;
		}
		navigate("/", { replace: true });
	}, [navigate, onFinish]);

	// Клавиатура (десктоп/превью)
	useEffect(() => {
		const onKey = (e) => {
			if (e.key === "ArrowRight") goTo(index + 1);
			if (e.key === "ArrowLeft") goTo(index - 1);
			if (e.key === "Enter" && last) complete();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [index, last, goTo, complete]);

	const handleScroll = () => {
		const el = scrollRef.current;
		if (!el) return;
		const next = Math.round(el.scrollLeft / el.clientWidth);
		if (next !== index) setIndex(next);
	};

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				backgroundColor: "#FFFFFF",
				fontFamily: "Inter, system-ui, sans-serif",
				overflow: "hidden",
			}}
		>
			{/* Прокручиваемые слайды */}
			<div
				ref={scrollRef}
				onScroll={handleScroll}
				onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
				style={{
					display: "flex",
					height: "100%",
					overflowX: "auto",
					overflowY: "hidden",
					scrollSnapType: "x mandatory",
					scrollbarWidth: "none",
					WebkitOverflowScrolling: "touch",
				}}
			>
				{SLIDES.map((slide) => (
					<div
						key={slide.id}
						style={{
							flex: "0 0 100%",
							width: "100%",
							height: "100%",
							scrollSnapAlign: "start",
							position: "relative",
							display: "flex",
							flexDirection: "column",
						}}
					>
						{/* Фото занимает верхнюю часть экрана */}
						<div
							style={{ position: "relative", flex: "1 1 auto", minHeight: 0 }}
						>
							<img
								src={slide.image}
								alt={slide.title}
								draggable={false}
								style={{
									position: "absolute",
									inset: 0,
									width: "100%",
									height: "100%",
									objectFit: "cover",
									objectPosition: "center top",
								}}
							/>
							{/* Мягкое затухание фото в белую подпись */}
							<div
								style={{
									position: "absolute",
									left: 0,
									right: 0,
									bottom: 0,
									height: 150,
									background:
										"linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.75) 55%, #FFFFFF 100%)",
									pointerEvents: "none",
								}}
							/>
						</div>

						{/* Текстовый блок */}
						<div
							style={{
								flex: "0 0 auto",
								backgroundColor: "#FFFFFF",
								padding: "18px 22px 96px",
							}}
						>
							<h2
								style={{
									margin: "0 0 10px",
									fontSize: 24,
									lineHeight: 1.25,
									fontWeight: 800,
									color: "#1A1A1A",
								}}
							>
								{slide.title}
							</h2>
							<p
								style={{
									margin: 0,
									fontSize: 17,
									lineHeight: 1.45,
									color: "#4A4A4A",
								}}
							>
								{slide.text}
							</p>
						</div>
					</div>
				))}
			</div>

			{/* Пропустить */}
			{!last && (
				<button
					onClick={complete}
					style={{
						position: "absolute",
						top: "calc(env(safe-area-inset-top, 0px) + 18px)",
						right: 20,
						padding: "8px 14px",
						backgroundColor: "rgba(255,255,255,0.82)",
						color: "#1A1A1A",
						border: "none",
						borderRadius: 999,
						fontSize: 14,
						fontWeight: 600,
						cursor: "pointer",
						backdropFilter: "blur(6px)",
						boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
					}}
				>
					Пропустить
				</button>
			)}

			{/* Точки */}
			<div
				style={{
					position: "absolute",
					left: 0,
					right: 0,
					bottom: "calc(env(safe-area-inset-bottom, 0px) + 34px)",
					display: "flex",
					justifyContent: "center",
					gap: 8,
					pointerEvents: "none",
				}}
			>
				{SLIDES.map((s, i) => (
					<span
						key={s.id}
						style={{
							width: i === index ? 22 : 8,
							height: 8,
							borderRadius: 999,
							backgroundColor: i === index ? "#7B5EA7" : "rgba(0,0,0,0.22)",
							transition: "all 0.25s ease",
						}}
					/>
				))}
			</div>

			{/* Стрелка вперёд / начать */}
			<button
				onClick={() => (last ? complete() : goTo(index + 1))}
				aria-label={last ? "Начать" : "Далее"}
				style={{
					position: "absolute",
					right: 22,
					bottom: "calc(env(safe-area-inset-bottom, 0px) + 22px)",
					width: 60,
					height: 60,
					borderRadius: "50%",
					border: "none",
					backgroundColor: "#7B5EA7",
					color: "white",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					cursor: "pointer",
					boxShadow: "0 6px 18px rgba(123,94,167,0.42)",
				}}
			>
				{last ? (
					<span style={{ fontSize: 14, fontWeight: 700 }}>Старт</span>
				) : (
					<svg width="26" height="26" viewBox="0 0 24 24" fill="none">
						<path
							d="M5 12h13M13 6l6 6-6 6"
							stroke="white"
							strokeWidth="2.4"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				)}
			</button>
		</div>
	);
}
