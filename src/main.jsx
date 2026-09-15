import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Service worker нужен только в собранном приложении. В разработке он
// перехватывал запросы и отдавал устаревший index.html — правки «не применялись»,
// а экран становился пустым.
if (import.meta.env.PROD) {
	if ("serviceWorker" in navigator) {
		window.addEventListener("load", () => {
			navigator.serviceWorker.register("/sw.js").catch(() => {
				// Браузер без SW или недоступное хранилище — приложение работает и так
			});
		});
	}
} else if ("serviceWorker" in navigator) {
	// Само-лечение: снимаем SW и вычищаем кэши, оставшиеся от старой версии
	navigator.serviceWorker
		.getRegistrations()
		.then((regs) => regs.forEach((reg) => reg.unregister()))
		.catch(() => undefined);

	if (window.caches) {
		caches
			.keys()
			.then((names) => names.forEach((name) => caches.delete(name)))
			.catch(() => undefined);
	}
}

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
