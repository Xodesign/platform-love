import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api.js";

const COVER_URL =
	"https://storage.yandexcloud.net/promto-user-static-sites-prod/design-assets/909022946/8c7e6951-480b-46d6-8680-2024c7503c12/8c3316f7-df61-4d16-8d50-f599e5854813-Group_36.png";

const DEFAULT_PROFILE = {
	name: "Александр",
	city: "Москва",
	goals: "family",
	familyStatus: "single",
	religion: "christianity",
	sociotype: "analyst",
	citizenship: "russian",
	profession: "IT-специалист",
	training: "incomplete_higher",
	bodyType: "athletic",
	health: "good",
	covid: "vaccinated",
	tattoos: "few",
	smoking: "never",
	alcohol: "occasionally",
	chronotype: "owl",
	vacation: "mountains",
	children: "none",
	housing: "rent",
	transport: "car",
	income: "high",
	height: "182",
	weight: "78",
	eyeColor: "brown",
	hairColor: "brown",
	zodiac: "leo",
	hobbies: "Программирование, спорт, путешествия",
	food: ["meat", "vegetables", "fruits"],
	drinks: ["coffee", "tea"],
	pets: ["dog"],
	flowers: ["roses"],
};

const OPTION_LABELS = {
	goals: {
		family: "Семья и отношения",
		friendship: "Дружба и общение",
		meetings: "Встречи и секс",
		trips: "Совместные поездки",
		companions: "Поиск единомышленников",
		help: "Нужна помощь",
	},
	familyStatus: {
		single: "Холост / Не замужем",
		widowed: "Вдовец / Вдова",
		married_separate: "В браке, вместе не живём",
		married_together: "В браке, живём вместе",
	},
	religion: {
		christianity: "Христианство",
		islam: "Ислам",
		buddhism: "Буддизм",
		judaism: "Иудаизм",
		paganism: "Язычество",
		atheist: "Атеизм",
	},
	sociotype: {
		analyst: "Аналитик",
		intuitive: "Интуитивный",
		social: "Социальный",
		practical: "Практик",
		creative: "Креативный",
		logical: "Логик",
	},
	citizenship: {
		russian: "Россия",
		ukrainian: "Украина",
		belarusian: "Беларусь",
		kazakh: "Казахстан",
		other: "Другое",
	},
	training: {
		secondary: "Среднее",
		vocational: "Среднее специальное",
		incomplete_higher: "Незаконченное высшее",
		bachelor: "Бакалавриат",
		specialist: "Специалитет",
		magistracy: "Магистратура",
		aspirantura: "Аспирантура",
	},
	bodyType: {
		skinny: "Худощавое",
		athletic: "Спортивное",
		average: "Среднее",
		heavyset: "Плотное",
		overweight: "Полное",
	},
	health: {
		excellent: "Отличное",
		good: "Хорошее",
		normal: "Нормальное",
		fair: "Удовлетворительное",
		poor: "Плохое",
	},
	covid: {
		vaccinated: "Вакцинирован(а)",
		had_covid: "Болел(а) COVID",
		no: "Нет",
	},
	tattoos: {
		none: "Нет",
		few: "Мало",
		many: "Много",
	},
	smoking: {
		never: "Не курю",
		occasionally: "Изредка",
		sometimes: "Иногда",
		regularly: "Регулярно",
		trying_quit: "Пытаюсь бросить",
	},
	alcohol: {
		never: "Не пью",
		occasionally: "Пью по праздникам",
		sometimes: "Пью иногда",
		regularly: "Пью регулярно",
		no_answer: "Не отвечу",
	},
	chronotype: {
		lark: "Жаворонок",
		owl: "Сова",
		mixed: "Смешанный",
	},
	vacation: {
		sea: "Море",
		mountains: "Горы",
		nature: "Природа",
		city: "Город",
		home: "Дом",
		family: "Семья",
	},
	children: {
		none: "Нет",
		has_children: "Есть дети",
		raised: "Воспитываю",
	},
	housing: {
		own: "Своё",
		rent: "Аренда",
		parents: "У родителей",
		dorm: "Общежитие",
	},
	transport: {
		none: "Нет",
		car: "Автомобиль",
		motorcycle: "Мотоцикл",
		bicycle: "Велосипед",
	},
	income: {
		no_income: "Нет дохода",
		low: "До 30 000 ₽",
		medium: "30 000 - 100 000 ₽",
		high: "100 000 - 300 000 ₽",
		very_high: "Более 300 000 ₽",
	},
	eyeColor: {
		blue: "Голубые",
		gray: "Серые",
		green: "Зелёные",
		brown: "Карие",
		black: "Чёрные",
	},
	hairColor: {
		blonde: "Блондин",
		brown: "Брюнет",
		black: "Черноволосый",
		red: "Рыжий",
		gray: "Седой",
		bald: "Лысый",
	},
	zodiac: {
		aries: "Овен ♈",
		taurus: "Телец ♉",
		gemini: "Близнецы ♊",
		cancer: "Рак ♋",
		leo: "Лев ♌",
		virgo: "Дева ♍",
		libra: "Весы ♎",
		scorpio: "Скорпион ♏",
		sagittarius: "Стрелец ♐",
		capricorn: "Козерог ♑",
		aquarius: "Водолей ♒",
		pisces: "Рыбы ♓",
	},
	food: {
		meat: "Мясо",
		fish: "Рыба",
		chicken: "Курица",
		vegetables: "Овощи",
		fruits: "Фрукты",
		cereals: "Крупы",
		dairy: "Молочные продукты",
		bakery: "Выпечка",
		sweets: "Сладости",
		fast_food: "Фастфуд",
		oriental: "Восточная кухня",
		italian: "Итальянская кухня",
		japanese: "Японская кухня",
		no_preference: "Без предпочтений",
	},
	drinks: {
		tea: "Чай",
		coffee: "Кофе",
		juice: "Соки",
		water: "Вода",
		soda: "Газировка",
		beer: "Пиво",
		wine: "Вино",
		cocktails: "Коктейли",
		vodka: "Водка",
		whiskey: "Виски",
		champagne: "Шампанское",
		no_alcohol: "Не пью алкоголь",
	},
	pets: {
		cat: "Кошка",
		dog: "Собака",
		bird: "Птица",
		fish: "Рыбки",
		hamster: "Хомяк",
		reptile: "Рептилия",
		none: "Нет домашних животных",
	},
	flowers: {
		roses: "Розы",
		tulips: "Тюльпаны",
		lilies: "Лилия",
		orchids: "Орхидеи",
		sunflowers: "Подсолнухи",
		chrysanthemums: "Хризантемы",
		daisies: "Ромашки",
		peonies: "Пионы",
		none: "Не нравятся цветы",
	},
};

const MULTI_SELECT_FIELDS = ["food", "drinks", "pets", "flowers"];

const SELECT_OPTIONS = {
	goals: Object.entries(OPTION_LABELS.goals).map(([value, label]) => ({
		value,
		label,
	})),
	familyStatus: Object.entries(OPTION_LABELS.familyStatus).map(
		([value, label]) => ({ value, label }),
	),
	religion: Object.entries(OPTION_LABELS.religion).map(([value, label]) => ({
		value,
		label,
	})),
	sociotype: Object.entries(OPTION_LABELS.sociotype).map(([value, label]) => ({
		value,
		label,
	})),
	citizenship: Object.entries(OPTION_LABELS.citizenship).map(
		([value, label]) => ({ value, label }),
	),
	training: Object.entries(OPTION_LABELS.training).map(([value, label]) => ({
		value,
		label,
	})),
	bodyType: Object.entries(OPTION_LABELS.bodyType).map(([value, label]) => ({
		value,
		label,
	})),
	health: Object.entries(OPTION_LABELS.health).map(([value, label]) => ({
		value,
		label,
	})),
	covid: Object.entries(OPTION_LABELS.covid).map(([value, label]) => ({
		value,
		label,
	})),
	tattoos: Object.entries(OPTION_LABELS.tattoos).map(([value, label]) => ({
		value,
		label,
	})),
	smoking: Object.entries(OPTION_LABELS.smoking).map(([value, label]) => ({
		value,
		label,
	})),
	alcohol: Object.entries(OPTION_LABELS.alcohol).map(([value, label]) => ({
		value,
		label,
	})),
	chronotype: Object.entries(OPTION_LABELS.chronotype).map(
		([value, label]) => ({ value, label }),
	),
	vacation: Object.entries(OPTION_LABELS.vacation).map(([value, label]) => ({
		value,
		label,
	})),
	children: Object.entries(OPTION_LABELS.children).map(([value, label]) => ({
		value,
		label,
	})),
	housing: Object.entries(OPTION_LABELS.housing).map(([value, label]) => ({
		value,
		label,
	})),
	transport: Object.entries(OPTION_LABELS.transport).map(([value, label]) => ({
		value,
		label,
	})),
	income: Object.entries(OPTION_LABELS.income).map(([value, label]) => ({
		value,
		label,
	})),
	eyeColor: Object.entries(OPTION_LABELS.eyeColor).map(([value, label]) => ({
		value,
		label,
	})),
	hairColor: Object.entries(OPTION_LABELS.hairColor).map(([value, label]) => ({
		value,
		label,
	})),
	zodiac: Object.entries(OPTION_LABELS.zodiac).map(([value, label]) => ({
		value,
		label,
	})),
	food: Object.entries(OPTION_LABELS.food).map(([value, label]) => ({
		value,
		label,
	})),
	drinks: Object.entries(OPTION_LABELS.drinks).map(([value, label]) => ({
		value,
		label,
	})),
	pets: Object.entries(OPTION_LABELS.pets).map(([value, label]) => ({
		value,
		label,
	})),
	flowers: Object.entries(OPTION_LABELS.flowers).map(([value, label]) => ({
		value,
		label,
	})),
};

function getLabel(field, value) {
	if (MULTI_SELECT_FIELDS.includes(field) && Array.isArray(value)) {
		return value.map((v) => OPTION_LABELS[field]?.[v] || v).join(", ");
	}
	return OPTION_LABELS[field]?.[value] || value || "";
}

const PROFILE_FIELDS = [
	{ key: "goals", label: "Цель на сайте" },
	{ key: "familyStatus", label: "Семейный статус" },
	{ key: "religion", label: "Религия" },
	{ key: "sociotype", label: "Социотип" },
	{ key: "citizenship", label: "Гражданство" },
	{ key: "profession", label: "Профессия" },
	{ key: "training", label: "Образование" },
	{ key: "bodyType", label: "Телосложение" },
	{ key: "health", label: "Здоровье" },
	{ key: "covid", label: "COVID" },
	{ key: "tattoos", label: "Тату" },
	{ key: "smoking", label: "Курение" },
	{ key: "alcohol", label: "Алкоголь" },
	{ key: "chronotype", label: "Хронотип" },
	{ key: "vacation", label: "Отпуск" },
	{ key: "children", label: "Дети" },
	{ key: "housing", label: "Жильё" },
	{ key: "transport", label: "Транспорт" },
	{ key: "income", label: "Доход" },
	{ key: "height", label: "Рост" },
	{ key: "weight", label: "Вес" },
	{ key: "eyeColor", label: "Цвет глаз" },
	{ key: "hairColor", label: "Цвет волос" },
	{ key: "zodiac", label: "Знак зодиака" },
	{ key: "hobbies", label: "Хобби" },
	{ key: "food", label: "Любимая еда" },
	{ key: "drinks", label: "Напитки" },
	{ key: "pets", label: "Домашние животные" },
	{ key: "flowers", label: "Любимые цветы" },
];

// Пресеты обложек
const COVER_PRESETS = [
	"https://storage.yandexcloud.net/promto-user-static-sites-prod/design-assets/909022946/8c7e6951-480b-46d6-8680-2024c7503c12/8c3316f7-df61-4d16-8d50-f599e5854813-Group_36.png",
	"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop",
	"https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=400&fit=crop",
	"https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=400&fit=crop",
	"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop",
	"https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=400&fit=crop",
];

export default function UserProfileScreen() {
	const navigate = useNavigate();
	const [profile, setProfile] = useState({});
	const [gallery, setGallery] = useState([]);
	const [cover, setCover] = useState(COVER_URL);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
	const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
	const [_editForm, setEditForm] = useState({});
	const [currentField, setCurrentField] = useState(null);
	const [currentFieldLabel, setCurrentFieldLabel] = useState("");
	const fileInputRef = useRef(null);
	const coverInputRef = useRef(null);
	const photoInputRef = useRef(null);

	// id пользователя с сервера — нужен, чтобы писать профиль обратно
	const userIdRef = useRef(null);

	// Загрузка данных профиля
	useEffect(() => {
		loadProfile();
	}, []);

	const readLocalProfile = () => {
		const parse = (key, fallback) => {
			try {
				const raw = localStorage.getItem(key);
				return raw ? JSON.parse(raw) : fallback;
			} catch {
				return fallback;
			}
		};
		return {
			questionnaire: parse("userProfile", {}),
			basic: parse("basicProfile", {}),
			gallery: parse("userGallery", []),
			cover: localStorage.getItem("userCover") || COVER_URL,
		};
	};

	const mergeProfile = (local, server = {}, answers = {}) => {
		const merged = { ...DEFAULT_PROFILE };
		for (const [key, value] of Object.entries(local.questionnaire)) {
			if (value) merged[key] = value;
		}
		for (const [key, value] of Object.entries(local.basic)) {
			if (value) merged[key] = value;
		}
		// Серверные ответы анкеты важнее локального кэша: они видны другим людям
		for (const [key, value] of Object.entries(answers)) {
			if (value) merged[key] = value;
		}
		if (server.name) merged.name = server.name;
		if (server.location) merged.city = server.location;
		return merged;
	};

	const loadProfile = async () => {
		const local = readLocalProfile();
		const localMerged = mergeProfile(local);
		setProfile(localMerged);
		setEditForm(localMerged);
		setGallery(local.gallery);
		setCover(local.cover);

		try {
			const me = await api.getMe();
			userIdRef.current = me.id;
			const [serverProfile, answers] = await Promise.all([
				api.getUser(me.id),
				api.getAnswers().catch(() => ({})),
			]);

			const merged = mergeProfile(local, serverProfile, answers || {});
			setProfile(merged);
			setEditForm(merged);

			const photos = Array.isArray(serverProfile.photos)
				? serverProfile.photos
				: [];
			if (photos.length > 0) setGallery(photos);
			if (serverProfile.settings?.cover) setCover(serverProfile.settings.cover);
		} catch (err) {
			// Сервер недоступен — остаёмся на локальном кэше, экран не падает
			console.error("Профиль с сервера не загрузился:", err);
		}
	};

	const saveProfile = (data) => {
		localStorage.setItem(
			"basicProfile",
			JSON.stringify({
				name: data.name,
				city: data.city,
			}),
		);
		localStorage.setItem("userProfile", JSON.stringify(data));
		setProfile(data);
		setIsEditModalOpen(false);

		// Синхронизируем ответы анкеты с сервером, чтобы совместимость работала
		const answerKeys = [
			"goals",
			"familyStatus",
			"religion",
			"sociotype",
			"citizenship",
			"profession",
			"training",
			"bodyType",
			"health",
			"covid",
			"tattoos",
			"smoking",
			"alcohol",
			"chronotype",
			"vacation",
			"children",
			"housing",
			"transport",
			"income",
			"height",
			"weight",
			"eyeColor",
			"hairColor",
			"zodiac",
			"hobbies",
			"food",
			"drinks",
			"pets",
			"flowers",
		];
		const answers = {};
		for (const key of answerKeys) {
			if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
				answers[key] = data[key];
			}
		}
		if (Object.keys(answers).length > 0) {
			api
				.saveAnswers(answers)
				.catch((err) => console.error("Answers sync error:", err));
		}

		// Имя и город тоже должны жить на сервере —
		// иначе в свайпах другим показывается старая запись из базы
		if (userIdRef.current) {
			api
				.updateUser(userIdRef.current, {
					name: data.name,
					location: data.city,
				})
				.catch((err) => console.error("Profile sync error:", err));
		}
	};

	const saveGallery = (newGallery, sync = true) => {
		localStorage.setItem("userGallery", JSON.stringify(newGallery));
		setGallery(newGallery);
		if (sync && userIdRef.current) {
			api
				.updateUser(userIdRef.current, { photos: newGallery })
				.catch((err) => console.error("Gallery sync error:", err));
		}
	};

	const saveCover = (newCover) => {
		localStorage.setItem("userCover", newCover);
		setCover(newCover);
		setIsCoverModalOpen(false);
		if (userIdRef.current) {
			api
				.updateUser(userIdRef.current, { settings: { cover: newCover } })
				.catch((err) => console.error("Cover sync error:", err));
		}
	};

	// Обработка загрузки фото профиля (аватар = первое фото в списке)
	const handleAvatarUpload = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		try {
			// Backend сам дописывает фото в users.photos и возвращает полный список
			const res = await api.uploadPhoto(file);
			const photos = Array.isArray(res.photos) ? res.photos : [res.url];
			const ordered = [res.url, ...photos.filter((p) => p !== res.url)];
			saveGallery(ordered);
		} catch (err) {
			console.error("Ошибка загрузки фото:", err);
		}
	};

	// Обработка загрузки обложки
	const handleCoverUpload = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		try {
			const res = await api.uploadPhoto(file);
			// Обложка не должна дублироваться в галерее
			saveGallery(gallery.filter((p) => p !== res.url));
			saveCover(res.url);
		} catch (err) {
			console.error("Ошибка загрузки обложки:", err);
		}
	};

	// Обработка загрузки фото в галерею
	const handlePhotoUpload = async (e) => {
		const files = Array.from(e.target.files || []);
		if (files.length === 0) return;

		try {
			let photos = gallery;
			for (const file of files) {
				const res = await api.uploadPhoto(file);
				photos =
					Array.isArray(res.photos) && res.photos.length > 0
						? res.photos
						: [...photos, res.url];
			}
			saveGallery(photos.slice(0, 12));
			setIsPhotoModalOpen(false);
		} catch (err) {
			console.error("Ошибка загрузки фото:", err);
		}
	};

	// Удаление фото из галереи
	const removePhoto = (index) => {
		const newGallery = gallery.filter((_, i) => i !== index);
		saveGallery(newGallery);
	};

	// Открытие поля для редактирования
	const openFieldEdit = (fieldKey, label) => {
		setCurrentField(fieldKey);
		setCurrentFieldLabel(label);
		setEditForm({ ...profile });
		setIsEditModalOpen(true);
	};

	// Обновление поля
	const updateField = (key, value) => {
		setProfile((prev) => ({ ...prev, [key]: value }));
	};

	// Сохранение всех изменений
	const handleSaveProfile = () => {
		saveProfile(profile);
		setIsEditModalOpen(false);
	};

	// Редактор для одиночного выбора
	const SingleSelectEditor = () => {
		const options = SELECT_OPTIONS[currentField] || [];
		const currentValue = profile[currentField];

		return (
			<div style={{ padding: 16 }}>
				<h3 style={{ margin: "0 0 16px", fontSize: 18, color: "#1A1A1A" }}>
					{currentFieldLabel}
				</h3>
				<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
					{options.map((opt) => (
						<button
							key={opt.value}
							onClick={() => updateField(currentField, opt.value)}
							style={{
								padding: "14px 16px",
								borderRadius: 10,
								border:
									currentValue === opt.value
										? "2px solid #7B5EA7"
										: "2px solid #E0E0E0",
								backgroundColor:
									currentValue === opt.value ? "#F3E8FF" : "white",
								color: currentValue === opt.value ? "#7B5EA7" : "#1A1A1A",
								fontSize: 15,
								cursor: "pointer",
								textAlign: "left",
								fontWeight: currentValue === opt.value ? 600 : 400,
							}}
						>
							{opt.label}
						</button>
					))}
				</div>
			</div>
		);
	};

	// Редактор для текстовых полей
	const TextEditor = () => {
		const currentValue = profile[currentField] || "";

		if (currentField === "height" || currentField === "weight") {
			return (
				<div style={{ padding: 16 }}>
					<h3 style={{ margin: "0 0 16px", fontSize: 18, color: "#1A1A1A" }}>
						{currentFieldLabel}
					</h3>
					<input
						type="number"
						value={currentValue}
						onChange={(e) => updateField(currentField, e.target.value)}
						placeholder="Введите значение"
						style={{
							width: "100%",
							padding: "14px 16px",
							borderRadius: 10,
							border: "2px solid #E0E0E0",
							fontSize: 16,
							boxSizing: "border-box",
						}}
					/>
				</div>
			);
		}

		return (
			<div style={{ padding: 16 }}>
				<h3 style={{ margin: "0 0 16px", fontSize: 18, color: "#1A1A1A" }}>
					{currentFieldLabel}
				</h3>
				<textarea
					value={currentValue}
					onChange={(e) => updateField(currentField, e.target.value)}
					placeholder="Введите текст"
					rows={3}
					style={{
						width: "100%",
						padding: "14px 16px",
						borderRadius: 10,
						border: "2px solid #E0E0E0",
						fontSize: 16,
						fontFamily: "inherit",
						resize: "vertical",
						boxSizing: "border-box",
					}}
				/>
			</div>
		);
	};

	// Редактор для мультивыбора (чекбоксы)
	const MultiSelectEditor = () => {
		const options = SELECT_OPTIONS[currentField] || [];
		const currentValue = profile[currentField] || [];
		const isMulti = Array.isArray(currentValue);

		const toggleOption = (value) => {
			if (isMulti) {
				if (currentValue.includes(value)) {
					updateField(
						currentField,
						currentValue.filter((v) => v !== value),
					);
				} else {
					updateField(currentField, [...currentValue, value]);
				}
			} else {
				updateField(currentField, value);
			}
		};

		const isSelected = (value) => {
			if (isMulti) {
				return currentValue.includes(value);
			}
			return currentValue === value;
		};

		return (
			<div style={{ padding: 16 }}>
				<h3 style={{ margin: "0 0 16px", fontSize: 18, color: "#1A1A1A" }}>
					{currentFieldLabel}
				</h3>
				<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
					{options.map((opt) => (
						<button
							key={opt.value}
							onClick={() => toggleOption(opt.value)}
							style={{
								padding: "10px 16px",
								borderRadius: 20,
								border: isSelected(opt.value)
									? "2px solid #7B5EA7"
									: "2px solid #E0E0E0",
								backgroundColor: isSelected(opt.value) ? "#F3E8FF" : "white",
								color: isSelected(opt.value) ? "#7B5EA7" : "#1A1A1A",
								fontSize: 14,
								cursor: "pointer",
								fontWeight: isSelected(opt.value) ? 600 : 400,
							}}
						>
							{opt.label}
						</button>
					))}
				</div>
			</div>
		);
	};

	// Редактор основной информации
	const BasicInfoEditor = () => (
		<div style={{ padding: 16 }}>
			<h3 style={{ margin: "0 0 16px", fontSize: 18, color: "#1A1A1A" }}>
				Основная информация
			</h3>

			<label
				style={{
					fontSize: 14,
					color: "#8E8E8E",
					marginBottom: 6,
					display: "block",
				}}
			>
				Имя
			</label>
			<input
				type="text"
				value={profile.name || ""}
				onChange={(e) => updateField("name", e.target.value)}
				style={{
					width: "100%",
					padding: "14px 16px",
					borderRadius: 10,
					border: "2px solid #E0E0E0",
					fontSize: 16,
					marginBottom: 16,
					boxSizing: "border-box",
				}}
			/>

			<label
				style={{
					fontSize: 14,
					color: "#8E8E8E",
					marginBottom: 6,
					display: "block",
				}}
			>
				Город
			</label>
			<input
				type="text"
				value={profile.city || ""}
				onChange={(e) => updateField("city", e.target.value)}
				style={{
					width: "100%",
					padding: "14px 16px",
					borderRadius: 10,
					border: "2px solid #E0E0E0",
					fontSize: 16,
					boxSizing: "border-box",
				}}
			/>
		</div>
	);

	// Модальное окно выбора типа редактирования
	const EditCategoryModal = ({ onClose }) => {
		const categories = [
			{
				title: "Основная информация",
				icon: "👤",
				fields: [
					{ key: "name", label: "Имя", component: "basic" },
					{ key: "city", label: "Город", component: "basic" },
				],
			},
			{
				title: "Внешность",
				icon: "✨",
				fields: [
					{ key: "height", label: "Рост", component: "text" },
					{ key: "weight", label: "Вес", component: "text" },
					{ key: "eyeColor", label: "Цвет глаз", component: "single" },
					{ key: "hairColor", label: "Цвет волос", component: "single" },
					{ key: "bodyType", label: "Телосложение", component: "single" },
				],
			},
			{
				title: "Обо мне",
				icon: "📝",
				fields: [
					{ key: "profession", label: "Профессия", component: "text" },
					{ key: "training", label: "Образование", component: "single" },
					{ key: "hobbies", label: "Хобби", component: "text" },
					{ key: "zodiac", label: "Знак зодиака", component: "single" },
				],
			},
			{
				title: "Образ жизни",
				icon: "🌿",
				fields: [
					{ key: "health", label: "Здоровье", component: "single" },
					{ key: "smoking", label: "Курение", component: "single" },
					{ key: "alcohol", label: "Алкоголь", component: "single" },
					{ key: "chronotype", label: "Хронотип", component: "single" },
					{ key: "vacation", label: "Отпуск", component: "single" },
					{ key: "food", label: "Любимая еда", component: "multi" },
					{ key: "drinks", label: "Напитки", component: "multi" },
				],
			},
			{
				title: "Отношения",
				icon: "💕",
				fields: [
					{ key: "goals", label: "Цель на сайте", component: "single" },
					{
						key: "familyStatus",
						label: "Семейный статус",
						component: "single",
					},
					{ key: "children", label: "Дети", component: "single" },
				],
			},
			{
				title: "Другое",
				icon: "📋",
				fields: [
					{ key: "religion", label: "Религия", component: "single" },
					{ key: "sociotype", label: "Социотип", component: "single" },
					{ key: "citizenship", label: "Гражданство", component: "single" },
					{ key: "housing", label: "Жильё", component: "single" },
					{ key: "transport", label: "Транспорт", component: "single" },
					{ key: "income", label: "Доход", component: "single" },
					{ key: "tattoos", label: "Тату", component: "single" },
					{ key: "covid", label: "COVID", component: "single" },
					{ key: "pets", label: "Домашние животные", component: "multi" },
					{ key: "flowers", label: "Любимые цветы", component: "multi" },
				],
			},
		];

		return (
			<div style={modalOverlayStyle}>
				<div style={modalContentStyle}>
					<div style={modalHeaderStyle}>
						<h2 style={{ margin: 0, fontSize: 20 }}>Редактирование профиля</h2>
						<button onClick={onClose} style={closeButtonStyle}>
							✕
						</button>
					</div>
					<div style={{ maxHeight: "70vh", overflowY: "auto", padding: 16 }}>
						{categories.map((cat) => (
							<div key={cat.title} style={{ marginBottom: 20 }}>
								<h3
									style={{
										fontSize: 16,
										color: "#7B5EA7",
										marginBottom: 10,
										display: "flex",
										alignItems: "center",
										gap: 8,
									}}
								>
									<span>{cat.icon}</span> {cat.title}
								</h3>
								<div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
									{cat.fields.map((field) => (
										<button
											key={field.key}
											onClick={() => {
												setCurrentField(field.key);
												setCurrentFieldLabel(field.label);
												setIsEditModalOpen(true);
											}}
											style={{
												padding: "8px 14px",
												borderRadius: 20,
												border: "1px solid #E0E0E0",
												backgroundColor: "#F8F8F8",
												color: "#1A1A1A",
												fontSize: 13,
												cursor: "pointer",
											}}
										>
											{field.label}
										</button>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	};

	// Модальное окно редактирования поля
	const FieldEditModal = ({ onClose }) => {
		const renderEditor = () => {
			if (currentField === "name" || currentField === "city") {
				return <BasicInfoEditor />;
			}
			if (MULTI_SELECT_FIELDS.includes(currentField)) {
				return <MultiSelectEditor />;
			}
			if (SELECT_OPTIONS[currentField]) {
				return <SingleSelectEditor />;
			}
			return <TextEditor />;
		};

		return (
			<div style={modalOverlayStyle}>
				<div style={modalContentStyle}>
					<div style={modalHeaderStyle}>
						<button
							onClick={() => setIsEditModalOpen(false)}
							style={{
								...closeButtonStyle,
								background: "transparent",
								color: "#8E8E8E",
							}}
						>
							← Назад
						</button>
						<button onClick={onClose} style={closeButtonStyle}>
							✕
						</button>
					</div>
					{renderEditor()}
					<div style={{ padding: 16, borderTop: "1px solid #E0E0E0" }}>
						<button
							onClick={handleSaveProfile}
							style={{
								width: "100%",
								padding: "14px",
								borderRadius: 10,
								border: "none",
								backgroundColor: "#7B5EA7",
								color: "white",
								fontSize: 16,
								fontWeight: 600,
								cursor: "pointer",
							}}
						>
							Сохранить
						</button>
					</div>
				</div>
			</div>
		);
	};

	// Модальное окно выбора обложки
	const CoverModal = ({ onClose }) => (
		<div style={modalOverlayStyle}>
			<div style={modalContentStyle}>
				<div style={modalHeaderStyle}>
					<h2 style={{ margin: 0, fontSize: 20 }}>Сменить обложку</h2>
					<button onClick={onClose} style={closeButtonStyle}>
						✕
					</button>
				</div>
				<div style={{ padding: 16 }}>
					<h3 style={{ fontSize: 14, color: "#8E8E8E", marginBottom: 12 }}>
						Загрузить своё фото
					</h3>
					<input
						ref={coverInputRef}
						type="file"
						accept="image/*"
						onChange={handleCoverUpload}
						style={{ display: "none" }}
					/>
					<button
						onClick={() => coverInputRef.current?.click()}
						style={{
							width: "100%",
							padding: "14px",
							borderRadius: 10,
							border: "2px dashed #7B5EA7",
							backgroundColor: "#F8F5FF",
							color: "#7B5EA7",
							fontSize: 15,
							cursor: "pointer",
							marginBottom: 20,
						}}
					>
						📷 Выбрать файл
					</button>

					<h3 style={{ fontSize: 14, color: "#8E8E8E", marginBottom: 12 }}>
						Готовые варианты
					</h3>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(2, 1fr)",
							gap: 10,
						}}
					>
						{COVER_PRESETS.map((preset, idx) => (
							<div
								key={idx}
								onClick={() => saveCover(preset)}
								style={{
									aspectRatio: "16/9",
									borderRadius: 10,
									overflow: "hidden",
									cursor: "pointer",
									border:
										cover === preset
											? "3px solid #7B5EA7"
											: "2px solid #E0E0E0",
								}}
							>
								<img
									src={preset}
									alt={`Вариант ${idx + 1}`}
									style={{ width: "100%", height: "100%", objectFit: "cover" }}
								/>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);

	// Модальное окно управления галереей
	const PhotoModal = ({ onClose }) => (
		<div style={modalOverlayStyle}>
			<div style={modalContentStyle}>
				<div style={modalHeaderStyle}>
					<h2 style={{ margin: 0, fontSize: 20 }}>Управление фотографиями</h2>
					<button onClick={onClose} style={closeButtonStyle}>
						✕
					</button>
				</div>
				<div style={{ padding: 16 }}>
					<input
						ref={photoInputRef}
						type="file"
						accept="image/*"
						multiple
						onChange={handlePhotoUpload}
						style={{ display: "none" }}
					/>
					<button
						onClick={() => photoInputRef.current?.click()}
						style={{
							width: "100%",
							padding: "14px",
							borderRadius: 10,
							border: "2px dashed #7B5EA7",
							backgroundColor: "#F8F5FF",
							color: "#7B5EA7",
							fontSize: 15,
							cursor: "pointer",
							marginBottom: 20,
						}}
					>
						📷 Добавить фотографии
					</button>

					<h3 style={{ fontSize: 14, color: "#8E8E8E", marginBottom: 12 }}>
						Ваши фотографии ({gallery.length}/12)
					</h3>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(3, 1fr)",
							gap: 8,
						}}
					>
						{gallery.map((photo, idx) => (
							<div
								key={idx}
								style={{
									aspectRatio: "1/1",
									borderRadius: 10,
									overflow: "hidden",
									position: "relative",
									border: idx === 0 ? "3px solid #7B5EA7" : "1px solid #E0E0E0",
								}}
							>
								<img
									src={photo}
									alt={`Фото ${idx + 1}`}
									style={{ width: "100%", height: "100%", objectFit: "cover" }}
								/>
								{idx === 0 && (
									<div
										style={{
											position: "absolute",
											bottom: 4,
											left: "50%",
											transform: "translateX(-50%)",
											backgroundColor: "#7B5EA7",
											color: "white",
											fontSize: 10,
											padding: "2px 6px",
											borderRadius: 10,
										}}
									>
										Главное
									</div>
								)}
								<button
									onClick={() => removePhoto(idx)}
									style={{
										position: "absolute",
										top: 4,
										right: 4,
										width: 24,
										height: 24,
										borderRadius: "50%",
										backgroundColor: "rgba(0,0,0,0.6)",
										color: "white",
										border: "none",
										cursor: "pointer",
										fontSize: 14,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									✕
								</button>
							</div>
						))}
						{gallery.length < 12 && (
							<div
								onClick={() => photoInputRef.current?.click()}
								style={{
									aspectRatio: "1/1",
									borderRadius: 10,
									border: "2px dashed #E0E0E0",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									cursor: "pointer",
									color: "#8E8E8E",
									fontSize: 24,
								}}
							>
								+
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);

	// Стили модальных окон
	const modalOverlayStyle = {
		position: "fixed",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(0,0,0,0.5)",
		display: "flex",
		alignItems: "flex-end",
		zIndex: 1000,
	};

	const modalContentStyle = {
		backgroundColor: "white",
		borderRadius: "20px 20px 0 0",
		width: "100%",
		maxWidth: 500,
		maxHeight: "90vh",
		overflow: "hidden",
	};

	const modalHeaderStyle = {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		padding: "16px 20px",
		borderBottom: "1px solid #E0E0E0",
	};

	const closeButtonStyle = {
		width: 32,
		height: 32,
		borderRadius: "50%",
		backgroundColor: "#F0F0F0",
		border: "none",
		cursor: "pointer",
		fontSize: 16,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
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
			{/* Header / Cover */}
			<div
				style={{
					position: "relative",
					height: 180,
					backgroundImage: `url(${cover})`,
					backgroundSize: "cover",
					backgroundPosition: "center",
				}}
			>
				<div
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: "linear-gradient(transparent 50%, rgba(0,0,0,0.4))",
					}}
				/>

				<div
					style={{
						position: "absolute",
						top: 12,
						left: 12,
						right: 12,
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						zIndex: 2,
					}}
				>
					<button
						onClick={() => navigate(-1)}
						style={{
							width: 40,
							height: 40,
							borderRadius: "50%",
							backgroundColor: "rgba(255,255,255,0.9)",
							border: "none",
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<svg width="24" height="24" viewBox="0 0 24 24" fill="#5B8DB8">
							<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
						</svg>
					</button>

					<div style={{ display: "flex", gap: 8 }}>
						<button
							onClick={() => setIsCoverModalOpen(true)}
							style={{
								display: "flex",
								alignItems: "center",
								gap: 6,
								padding: "8px 12px",
								borderRadius: 20,
								backgroundColor: "rgba(255,255,255,0.9)",
								border: "none",
								cursor: "pointer",
								color: "#5B8DB8",
								fontSize: 13,
								fontWeight: 500,
							}}
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="#5B8DB8">
								<path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
							</svg>
							Обложка
						</button>
						<button
							onClick={() => setIsPhotoModalOpen(true)}
							style={{
								display: "flex",
								alignItems: "center",
								gap: 6,
								padding: "8px 12px",
								borderRadius: 20,
								backgroundColor: "rgba(255,255,255,0.9)",
								border: "none",
								cursor: "pointer",
								color: "#5B8DB8",
								fontSize: 13,
								fontWeight: 500,
							}}
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="#5B8DB8">
								<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
							</svg>
							Фото
						</button>
					</div>
				</div>
			</div>

			{/* Profile Info */}
			<div
				style={{
					position: "relative",
					marginTop: -60,
					padding: "0 20px",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				{/* Avatar */}
				<div
					style={{
						width: 120,
						height: 120,
						borderRadius: "50%",
						backgroundColor: "#E8E8E8",
						border: "4px solid white",
						boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
						overflow: "hidden",
						cursor: "pointer",
						position: "relative",
					}}
					onClick={() => fileInputRef.current?.click()}
				>
					{gallery.length > 0 ? (
						<img
							src={gallery[0]}
							alt="Profile"
							style={{ width: "100%", height: "100%", objectFit: "cover" }}
						/>
					) : (
						<div
							style={{
								width: "100%",
								height: "100%",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								backgroundColor: "#E8E8E8",
							}}
						>
							<svg width="48" height="48" viewBox="0 0 24 24" fill="#AAAAAA">
								<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
							</svg>
						</div>
					)}
					<div
						style={{
							position: "absolute",
							bottom: 0,
							left: 0,
							right: 0,
							backgroundColor: "rgba(0,0,0,0.5)",
							color: "white",
							fontSize: 11,
							textAlign: "center",
							padding: "4px 0",
						}}
					>
						Изменить
					</div>
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						onChange={handleAvatarUpload}
						style={{ display: "none" }}
					/>
				</div>

				{/* Name Box */}
				<div
					style={{
						backgroundColor: "white",
						borderRadius: 12,
						padding: "10px 24px",
						marginTop: 12,
						boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
						display: "flex",
						alignItems: "center",
						gap: 8,
					}}
				>
					<h1
						style={{
							fontSize: 20,
							fontWeight: 700,
							color: "#1A1A1A",
							margin: 0,
							textAlign: "center",
						}}
					>
						{profile.name || "Имя не указано"}
					</h1>
				</div>

				{/* Location */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 6,
						marginTop: 8,
					}}
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="#7B5EA7">
						<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
					</svg>
					<span style={{ fontSize: 14, color: "#1A1A1A" }}>
						{profile.city || "Город не указан"}
					</span>
				</div>
			</div>

			{/* Photo Gallery */}
			<div style={{ padding: "20px 16px 0" }}>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: 12,
					}}
				>
					<h3 style={{ margin: 0, fontSize: 16, color: "#1A1A1A" }}>
						Мои фотографии
					</h3>
					<span style={{ fontSize: 12, color: "#8E8E8E" }}>
						{gallery.length}/12
					</span>
				</div>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(4, 1fr)",
						gap: 8,
					}}
				>
					{gallery.slice(0, 8).map((photo, index) => (
						<div
							key={index}
							style={{
								aspectRatio: "1/1",
								backgroundColor: "#E0E0E0",
								borderRadius: 12,
								overflow: "hidden",
								cursor: "pointer",
								position: "relative",
							}}
							onClick={() => setIsPhotoModalOpen(true)}
						>
							<img
								src={photo}
								alt={`Photo ${index + 1}`}
								style={{ width: "100%", height: "100%", objectFit: "cover" }}
							/>
						</div>
					))}
					{gallery.length < 8 && (
						<div
							onClick={() => setIsPhotoModalOpen(true)}
							style={{
								aspectRatio: "1/1",
								backgroundColor: "#F0F0F0",
								borderRadius: 12,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								cursor: "pointer",
								border: "2px dashed #D0D0D0",
							}}
						>
							<svg width="24" height="24" viewBox="0 0 24 24" fill="#8E8E8E">
								<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
							</svg>
						</div>
					)}
				</div>
			</div>

			{/* Profile Details Section */}
			<div style={{ padding: "20px 16px" }}>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: 16,
					}}
				>
					<h2
						style={{
							fontSize: 18,
							fontWeight: 700,
							color: "#1A1A1A",
							margin: 0,
						}}
					>
						О себе
					</h2>
					<button
						onClick={() => setIsEditModalOpen("categories")}
						style={{
							display: "flex",
							alignItems: "center",
							gap: 6,
							padding: "8px 16px",
							borderRadius: 20,
							backgroundColor: "#7B5EA7",
							border: "none",
							cursor: "pointer",
							color: "white",
							fontSize: 13,
							fontWeight: 500,
						}}
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="white">
							<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
						</svg>
						Редактировать
					</button>
				</div>

				<div
					style={{
						display: "flex",
						flexWrap: "wrap",
						gap: 10,
						padding: "0 4px",
					}}
				>
					{PROFILE_FIELDS.map((field) => {
						const value = profile[field.key];
						if (!value || (Array.isArray(value) && value.length === 0)) {
							return null;
						}

						return (
							<div
								key={field.key}
								onClick={() => openFieldEdit(field.key, field.label)}
								style={{
									backgroundColor: "#F3E8FF",
									borderRadius: 25,
									padding: "10px 16px",
									border: "1px solid #7B5EA7",
									display: "flex",
									alignItems: "center",
									gap: 8,
									cursor: "pointer",
									transition: "transform 0.1s",
								}}
								onMouseDown={(e) =>
									(e.currentTarget.style.transform = "scale(0.97)")
								}
								onMouseUp={(e) =>
									(e.currentTarget.style.transform = "scale(1)")
								}
							>
								<span
									style={{
										fontSize: 12,
										color: "#8E8E8E",
									}}
								>
									{field.label}:
								</span>
								<span
									style={{
										fontSize: 13,
										color: "#1A1A1A",
										fontWeight: 600,
									}}
								>
									{getLabel(field.key, value)}
								</span>
							</div>
						);
					})}
				</div>
			</div>

			{/* Ad Banner */}
			<div style={{ padding: "0 16px 20px" }}>
				<div
					style={{
						backgroundColor: "#3A3A3A",
						borderRadius: 16,
						padding: "40px 20px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<span
						style={{
							fontSize: 24,
							fontWeight: 700,
							color: "#FF4444",
							letterSpacing: 2,
						}}
					>
						РЕКЛАМА
					</span>
				</div>
			</div>

			{/* Модальные окна */}
			{isEditModalOpen === "categories" && (
				<EditCategoryModal onClose={() => setIsEditModalOpen(false)} />
			)}
			{isEditModalOpen === true && currentField && (
				<FieldEditModal
					onClose={() => {
						setIsEditModalOpen(false);
						setCurrentField(null);
					}}
				/>
			)}
			{isCoverModalOpen && (
				<CoverModal onClose={() => setIsCoverModalOpen(false)} />
			)}
			{isPhotoModalOpen && (
				<PhotoModal onClose={() => setIsPhotoModalOpen(false)} />
			)}
		</div>
	);
}
