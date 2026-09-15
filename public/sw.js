// Service worker PlatformLove.
//
// Прежняя версия кэшировала index.html по принципу «сначала кэш» и содержала
// захардкоженные имена бандлов прошлой сборки (/assets/index-B__-65Ln.js).
// Из-за этого после деплоя браузер отдавал пользователям СТАРЫЙ index.html,
// который ссылался на уже несуществующие файлы, и приложение показывало
// пустой экран вместо обновлённой версии.
//
// Правила новой версии:
//   · навигация и index.html — всегда сеть, кэш только как офлайн-запас;
//   · /assets/* — имена содержат хэш содержимого, поэтому кэш безопасен;
//   · /api и /uploads — в кэш не попадают никогда: это данные конкретных
//     пользователей, отдавать их из кэша нельзя;
//   · при активации удаляются все кэши с другим именем и делается clients.claim(),
//     чтобы новая версия вступила в силу сразу, а не через сутки.

const CACHE_NAME = "platform-love-v2";
const SHELL_URLS = ["/", "/index.html", "/manifest.json", "/favicon.svg", "/icon.png"];

const putInCache = (request, response) => {
	if (!response || response.status !== 200 || response.type !== "basic") {
		return Promise.resolve();
	}
	return caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
};

self.addEventListener("install", (event) => {
	// addAll не используем: отсутствие одного файла не должно ломать установку SW
	event.waitUntil(
		Promise.all(
			SHELL_URLS.map((url) =>
				fetch(url)
					.then((res) => putInCache(new Request(url), res))
					.catch(() => undefined),
			),
		).then(() => self.skipWaiting()),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		(async () => {
			const names = await caches.keys();
			await Promise.all(
				names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)),
			);
			await self.clients.claim();
		})(),
	);
});

self.addEventListener("fetch", (event) => {
	const { request } = event;

	if (request.method !== "GET") return;

	let url;
	try {
		url = new URL(request.url);
	} catch {
		return;
	}

	// Чужие домены (шрифты Google, unsplash, CDN картинок) не перехватываем
	if (url.origin !== self.location.origin) return;

	// Данные пользователей и загрузки — только в сеть
	if (url.pathname.startsWith("/api") || url.pathname.startsWith("/uploads")) return;

	// Переходы по адресам: пробуем сеть, при офлайне отдаём оболочку из кэша
	if (request.mode === "navigate") {
		event.respondWith(
			fetch(request)
				.then((response) => {
					if (response.status === 200) {
						caches
							.open(CACHE_NAME)
							.then((cache) => cache.put("/index.html", response.clone()))
							.catch(() => undefined);
					}
					return response;
				})
				.catch(() =>
					caches
						.match("/index.html")
						.then((hit) => hit || caches.match("/"))
						.then((hit) => hit || Response.error()),
				),
		);
		return;
	}

	// Хэшированные ассеты: кэш, потом сеть (устареть не могут — имя = содержимое)
	if (url.pathname.startsWith("/assets/")) {
		event.respondWith(
			caches.match(request).then(
				(hit) =>
					hit ||
					fetch(request)
						.then((response) => {
							putInCache(request, response);
							return response;
						})
						.catch(() => Response.error()),
			),
		);
		return;
	}

	// Остальное (онбординг, иконки): сеть, кэш как запас при проблемах со связью
	event.respondWith(
		fetch(request)
			.then((response) => {
				putInCache(request, response);
				return response;
			})
			.catch(() => caches.match(request).then((hit) => hit || Response.error())),
	);
});
