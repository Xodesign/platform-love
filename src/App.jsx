import {
	useState,
	useRef,
	useEffect,
	createContext,
	useContext,
	lazy,
	Suspense,
} from "react";
import {
	BrowserRouter,
	Routes,
	Route,
	Navigate,
	Outlet,
	useNavigate,
	useLocation,
} from "react-router-dom";
import OnboardingScreen, { isOnboardingDone } from "./OnboardingScreen";
import MainMenuScreen from "./MainMenuScreen";
import SwipeScreen from "./SwipeScreen";
import WallScreen from "./WallScreen";
import MatchScreen from "./MatchScreen";
import LikesScreen from "./LikesScreen";
import MessagesScreen from "./MessagesScreen";
import FeedScreen from "./FeedScreen";
import FriendsScreen from "./FriendsScreen";
import FansScreen from "./FansScreen";
import NotificationsScreen from "./NotificationsScreen";
import UserProfileScreen from "./UserProfileScreen";
import ChatScreen from "./ChatScreen";
import SettingsScreen from "./SettingsScreen";
import SubscriptionScreen from "./SubscriptionScreen";
import BlacklistScreen from "./BlacklistScreen";
// Админку грузим отдельными чанками: обычному пользователю она не нужна
// в первом бандле, а на телефоне это заметная экономия трафика и памяти.
const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const AdminLoginScreen = lazy(() => import("./admin/AdminLoginScreen"));
const AdminOrdersScreen = lazy(() => import("./admin/AdminOrdersScreen"));
const AdminOrderDetailScreen = lazy(
	() => import("./admin/AdminOrderDetailScreen"),
);
const AdminUsersScreen = lazy(() => import("./admin/AdminUsersScreen"));
const AdminUserDetailScreen = lazy(
	() => import("./admin/AdminUserDetailScreen"),
);
const AdminSupportScreen = lazy(() => import("./admin/AdminSupportScreen"));
const AdminChatScreen = lazy(() => import("./admin/AdminChatScreen"));
const AdminComplaintsScreen = lazy(
	() => import("./admin/AdminComplaintsScreen"),
);
const AdminProfileScreen = lazy(() => import("./admin/AdminProfileScreen"));
const AdminDashboard = lazy(() => import("./admin/AdminDashboard"));
const AdminBlacklistScreen = lazy(() => import("./admin/AdminBlacklistScreen"));
const AdminModerationScreen = lazy(
	() => import("./admin/AdminModerationScreen"),
);
const AdminLogsScreen = lazy(() => import("./admin/AdminLogsScreen"));
const AdminSettingsScreen = lazy(() => import("./admin/AdminSettingsScreen"));
const AdminPaymentScreen = lazy(() => import("./admin/AdminPaymentScreen"));

const LOGO_URL =
	"https://storage.yandexcloud.net/promto-user-static-sites-prod/design-assets/909022946/8c7e6951-480b-46d6-8680-2024c7503c12/8f62e6d4-fe4e-433f-b1fa-8360fa65021d-logo.png";

// Theme colors - soft pastel
const colors = {
	male: { bg: "#E8F4FF", text: "#5B8DB8", icon: "#7BA7CC" },
	female: { bg: "#FFF0F3", text: "#CC7A8B", icon: "#D4929F" },
	default: { bg: "white", text: "#8E8E8E", icon: "#7B5EA7" },
};

// Gender Context
const GenderContext = createContext("male");

// Multi-Select Component (for checkboxes)
function MultiSelect({ label, options, value, onChange, required }) {
	const { gender } = useContext(GenderContext);

	const toggleOption = (optionValue) => {
		const currentValues = value || [];
		if (currentValues.includes(optionValue)) {
			onChange(currentValues.filter((v) => v !== optionValue));
		} else {
			onChange([...currentValues, optionValue]);
		}
	};

	const getDisplayText = () => {
		if (!value || value.length === 0) return "Выберите...";
		if (value.length === 1) {
			const option = options.find((o) => o.value === value[0]);
			return option ? option.label : value[0];
		}
		return `Выбрано: ${value.length}`;
	};

	return (
		<div style={{ marginBottom: 16 }}>
			<label
				style={{
					fontSize: 14,
					color: "#8E8E8E",
					display: "flex",
					alignItems: "center",
					gap: 6,
					marginBottom: 8,
				}}
			>
				{label}
				{required && <span style={{ color: "#FF6B6B" }}>*</span>}
			</label>
			<div
				style={{
					backgroundColor:
						gender === "male"
							? colors.male.bg
							: gender === "female"
								? colors.female.bg
								: "white",
					borderRadius: 12,
					padding: "12px 16px",
				}}
			>
				<span
					style={{
						fontSize: 15,
						color: value?.length > 0 ? "#1A1A1A" : "#8E8E8E",
					}}
				>
					{getDisplayText()}
				</span>
				<div
					style={{
						marginTop: 12,
						display: "flex",
						flexDirection: "column",
						gap: 10,
					}}
				>
					{options.map((option) => {
						const isChecked = value?.includes(option.value);
						return (
							<label
								key={option.value}
								style={{
									display: "flex",
									alignItems: "center",
									gap: 10,
									cursor: "pointer",
								}}
							>
								<div
									style={{
										width: 22,
										height: 22,
										borderRadius: 6,
										border: `2px solid ${isChecked ? (gender === "male" ? colors.male.text : gender === "female" ? colors.female.text : "#7B5EA7") : "#CCCCCC"}`,
										backgroundColor: isChecked
											? gender === "male"
												? colors.male.text
												: gender === "female"
													? colors.female.text
													: "#7B5EA7"
											: "transparent",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										transition: "all 0.2s",
									}}
								>
									{isChecked && (
										<svg
											width="14"
											height="14"
											viewBox="0 0 24 24"
											fill="white"
										>
											<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
										</svg>
									)}
								</div>
								<input
									type="checkbox"
									checked={isChecked}
									onChange={() => toggleOption(option.value)}
									style={{ display: "none" }}
								/>
								<span style={{ fontSize: 14, color: "#1A1A1A" }}>
									{option.label}
								</span>
							</label>
						);
					})}
				</div>
			</div>
		</div>
	);
}

// Dropdown Component
function Dropdown({ label, options, value, onChange, required }) {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef(null);
	const { gender } = useContext(GenderContext);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const selectedOption = options.find((opt) => opt.value === value);

	return (
		<div ref={dropdownRef} style={{ position: "relative", marginBottom: 16 }}>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<label
					style={{
						fontSize: 14,
						color: "#8E8E8E",
						display: "flex",
						alignItems: "center",
						gap: 6,
					}}
				>
					{label}
					{required && <span style={{ color: "#FF6B6B" }}>*</span>}
				</label>
			</div>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				style={{
					width: "100%",
					padding: "14px 16px",
					marginTop: 8,
					backgroundColor:
						gender === "male"
							? colors.male.bg
							: gender === "female"
								? colors.female.bg
								: "white",
					border: `1px solid ${isOpen ? (gender === "male" ? colors.male.text : gender === "female" ? colors.female.text : "#7B5EA7") : "#E8E8E8"}`,
					borderRadius: 12,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					cursor: "pointer",
					transition: "all 0.2s",
				}}
			>
				<span
					style={{
						fontSize: 15,
						color: selectedOption ? "#1A1A1A" : "#8E8E8E",
					}}
				>
					{selectedOption ? selectedOption.label : "Выберите..."}
				</span>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill={
						gender === "male"
							? colors.male.text
							: gender === "female"
								? colors.female.text
								: "#8E8E8E"
					}
					style={{
						transform: isOpen ? "rotate(180deg)" : "rotate(0)",
						transition: "transform 0.2s",
					}}
				>
					<path d="M7 10l5 5 5-5z" />
				</svg>
			</button>
			{isOpen && (
				<div
					style={{
						position: "absolute",
						top: "100%",
						left: 0,
						right: 0,
						backgroundColor: "white",
						border: "1px solid #E8E8E8",
						borderRadius: 12,
						marginTop: 4,
						maxHeight: 200,
						overflowY: "auto",
						zIndex: 100,
						boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
					}}
				>
					{options.map((option) => (
						<div
							key={option.value}
							onClick={() => {
								onChange(option.value);
								setIsOpen(false);
							}}
							style={{
								padding: "12px 16px",
								cursor: "pointer",
								backgroundColor:
									value === option.value ? "#F5F5F5" : "transparent",
								color: "#1A1A1A",
								fontSize: 15,
								borderBottom: "1px solid #F0F0F0",
							}}
							onMouseEnter={(e) => (e.target.style.backgroundColor = "#F0F0F5")}
							onMouseLeave={(e) =>
								(e.target.style.backgroundColor =
									value === option.value ? "#F5F5F5" : "transparent")
							}
						>
							{option.label}
						</div>
					))}
				</div>
			)}
		</div>
	);
}

// Text Input Component
function TextInput({ label, value, onChange, placeholder, required }) {
	const { gender } = useContext(GenderContext);
	return (
		<div style={{ marginBottom: 16 }}>
			<label
				style={{
					fontSize: 14,
					color: "#8E8E8E",
					display: "flex",
					alignItems: "center",
					gap: 6,
				}}
			>
				{label}
				{required && <span style={{ color: "#FF6B6B" }}>*</span>}
			</label>
			<input
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				style={{
					width: "100%",
					padding: "14px 16px",
					marginTop: 8,
					backgroundColor:
						gender === "male"
							? colors.male.bg
							: gender === "female"
								? colors.female.bg
								: "white",
					border: "1px solid #E8E8E8",
					borderRadius: 12,
					fontSize: 15,
					color: "#1A1A1A",
					outline: "none",
					transition: "border-color 0.2s",
				}}
				onFocus={(e) => (e.target.style.borderColor = "#7B5EA7")}
				onBlur={(e) => (e.target.style.borderColor = "#E8E8E8")}
			/>
		</div>
	);
}

// Progress Bar Component
function ProgressBar({ current, total }) {
	const percentage = Math.round((current / total) * 100);
	return (
		<div style={{ marginBottom: 20 }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 8,
				}}
			>
				<span style={{ fontSize: 13, color: "#8E8E8E" }}>
					Анкета заполнена на {percentage}%
				</span>
			</div>
			<div
				style={{
					width: "100%",
					height: 8,
					backgroundColor: "#E8E8E8",
					borderRadius: 4,
					overflow: "hidden",
				}}
			>
				<div
					style={{
						width: `${percentage}%`,
						height: "100%",
						background: "linear-gradient(90deg, #7B5EA7, #B8A8D0)",
						borderRadius: 4,
						transition: "width 0.3s",
					}}
				/>
			</div>
		</div>
	);
}

// Question Screen
function QuestionScreen() {
	const navigate = useNavigate();
	const [currentStep, setCurrentStep] = useState(0);

	const totalQuestions = 100;

	const [answers, setAnswers] = useState({
		familyStatus: "",
		religion: "",
		sociotype: "",
		citizenship: "",
		profession: "",
		training: "",
		bodyType: "",
		health: "",
		covid: "",
		tattoos: "",
		smoking: "",
		alcohol: "",
		chronotype: "",
		flowers: [],
		hobbies: "",
		food: [],
		drinks: [],
		vacation: "",
		pets: [],
		zodiac: "",
		appearance: "",
		education: "",
		children: "",
		housing: "",
		transport: "",
		income: "",
		nationality: "",
		height: "",
		weight: "",
		eyeColor: "",
		hairColor: "",
		goals: "",
	});

	const handleAnswer = (question, value) => {
		setAnswers((prev) => ({ ...prev, [question]: value }));
	};

	const questions = [
		{
			key: "goals",
			component: Dropdown,
			props: {
				label: "Ваши цели",
				required: true,
				options: [
					{ value: "family", label: "Семья и отношения" },
					{ value: "friendship", label: "Дружба и общение" },
					{ value: "meetings", label: "Встречи и секс" },
					{ value: "trips", label: "Совместные поездки" },
					{ value: "companions", label: "Поиск единомышленников" },
					{ value: "help", label: "Нужна помощь" },
				],
			},
		},
		{
			key: "familyStatus",
			component: Dropdown,
			props: {
				label: "Семейный статус",
				required: true,
				options: [
					{ value: "single", label: "Холост / Не замужем" },
					{ value: "widowed", label: "Вдовец / Вдова" },
					{ value: "married_separate", label: "В браке, вместе не живём" },
					{ value: "married_together", label: "В браке, живём вместе" },
				],
			},
		},
		{
			key: "religion",
			component: Dropdown,
			props: {
				label: "Религия",
				required: true,
				options: [
					{ value: "christianity", label: "Христианство" },
					{ value: "islam", label: "Ислам" },
					{ value: "buddhism", label: "Буддизм" },
					{ value: "judaism", label: "Иудаизм" },
					{ value: "paganism", label: "Язычество" },
					{ value: "atheist", label: "Атеизм" },
				],
			},
		},
		{
			key: "sociotype",
			component: Dropdown,
			props: {
				label: "Социотип",
				required: false,
				options: [
					{ value: "analyst", label: "Аналитик" },
					{ value: "humanist", label: "Гуманист" },
					{ value: "inspector", label: "Инспектор" },
					{ value: "seeker", label: "Искатель" },
					{ value: "critic", label: "Критик" },
					{ value: "lyric", label: "Лирик" },
					{ value: "marshal", label: "Маршал" },
					{ value: "master", label: "Мастер" },
					{ value: "mentor", label: "Наставник" },
					{ value: "politician", label: "Политик" },
					{ value: "mediator", label: "Посредник" },
					{ value: "entrepreneur", label: "Предприниматель" },
					{ value: "advisor", label: "Советчик" },
					{ value: "manager", label: "Управитель" },
					{ value: "keeper", label: "Хранитель" },
					{ value: "enthusiast", label: "Энтузиаст" },
					{ value: "unknown", label: "Я не знаю свой социотип" },
				],
			},
		},
		{
			key: "citizenship",
			component: Dropdown,
			props: {
				label: "Гражданство",
				required: true,
				options: [
					{ value: "russia", label: "Гражданин России" },
					{ value: "cis", label: "Гражданин стран СНГ" },
					{ value: "ussr", label: "Гражданин СССР" },
					{ value: "foreigner", label: "Иностранец" },
					{ value: "alive", label: "Живой Человек" },
				],
			},
		},
		{
			key: "profession",
			component: TextInput,
			props: { label: "Профессия", placeholder: "Введите вашу профессию" },
		},
		{
			key: "training",
			component: Dropdown,
			props: {
				label: "Тренировки",
				required: true,
				options: [
					{ value: "often", label: "Часто" },
					{ value: "rarely", label: "Редко" },
					{ value: "sometimes", label: "Иногда" },
					{ value: "no_time", label: "Нет времени" },
				],
			},
		},
		{
			key: "bodyType",
			component: Dropdown,
			props: {
				label: "Телосложение",
				required: true,
				options: [
					{ value: "slim", label: "Худощавое" },
					{ value: "normal", label: "Обычное" },
					{ value: "athletic", label: "Спортивное" },
					{ value: "muscular", label: "Мускулистое" },
					{ value: "dense", label: "Плотное" },
					{ value: "full", label: "Полное" },
				],
			},
		},
		{
			key: "health",
			component: Dropdown,
			props: {
				label: "Состояние здоровья",
				required: true,
				options: [
					{ value: "excellent", label: "Отличное" },
					{ value: "good", label: "Хорошее" },
					{ value: "average", label: "Среднее" },
					{ value: "problems", label: "Есть проблемы" },
					{ value: "disabled", label: "Инвалид" },
				],
			},
		},
		{
			key: "smoking",
			component: Dropdown,
			props: {
				label: "Курение",
				required: true,
				options: [
					{ value: "no", label: "Не курю" },
					{ value: "rarely", label: "Редко" },
					{ value: "quitting", label: "Бросаю" },
					{ value: "yes", label: "Курю" },
				],
			},
		},
		{
			key: "alcohol",
			component: Dropdown,
			props: {
				label: "Алкоголь",
				required: true,
				options: [
					{ value: "no", label: "Не пью" },
					{ value: "rarely", label: "Пью редко" },
					{ value: "sometimes", label: "Иногда в компании" },
					{ value: "often", label: "Не против выпить" },
				],
			},
		},
		{
			key: "chronotype",
			component: Dropdown,
			props: {
				label: "Хронотип",
				required: true,
				options: [
					{ value: "owl", label: "Сова" },
					{ value: "lark", label: "Жаворонок" },
					{ value: "dove", label: "Голубь" },
				],
			},
		},
		{
			key: "food",
			component: MultiSelect,
			props: {
				label: "Предпочтения в еде",
				required: false,
				options: [
					{ value: "seafood", label: "Морепродукты" },
					{ value: "meat", label: "Мясо" },
					{ value: "poultry", label: "Птица" },
					{ value: "vegetables", label: "Зелень и овощи" },
					{ value: "fruits", label: "Фрукты" },
					{ value: "dairy", label: "Молочные продукты" },
					{ value: "grains", label: "Каши и злаки" },
					{ value: "raw", label: "Сыроедение" },
					{ value: "vegetarian", label: "Вегетарианство" },
					{ value: "vegan", label: "Веганство" },
					{ value: "pescatarian", label: "Пескетарианство" },
					{ value: "halal", label: "Халяль" },
					{ value: "kosher", label: "Кошерная еда" },
					{ value: "all", label: "Ем всё" },
				],
			},
		},
		{
			key: "drinks",
			component: MultiSelect,
			props: {
				label: "Предпочтения в спиртном",
				required: false,
				options: [
					{ value: "champagne", label: "Шампанское" },
					{ value: "wine_white", label: "Вино белое" },
					{ value: "wine_red", label: "Вино красное" },
					{ value: "wine_rose", label: "Вино розовое" },
					{ value: "sparkling", label: "Игристое" },
					{ value: "liquor", label: "Ликеры" },
					{ value: "vodka", label: "Водка" },
					{ value: "cognac", label: "Коньяк" },
					{ value: "whiskey", label: "Виски" },
					{ value: "absinthe", label: "Абсент" },
					{ value: "rum", label: "Ром" },
					{ value: "tequila", label: "Текила" },
					{ value: "brandy", label: "Бренди" },
					{ value: "armagnac", label: "Арманьяк" },
					{ value: "calvados", label: "Кальвадос" },
					{ value: "sake", label: "Саке" },
					{ value: "vermouth", label: "Вермут" },
					{ value: "martini", label: "Мартини" },
					{ value: "moonshine", label: "Самогон" },
					{ value: "beer", label: "Пиво" },
					{ value: "cocktails", label: "Коктейли" },
					{ value: "sober", label: "Трезвенник" },
				],
			},
		},
		{
			key: "vacation",
			component: Dropdown,
			props: {
				label: "Предпочтения в отдыхе",
				required: false,
				options: [
					{ value: "family", label: "Отдых с семьёй" },
					{ value: "sea", label: "Отдых на море" },
					{ value: "nature", label: "Прогулка на природе" },
					{ value: "sleep", label: "Сон" },
					{ value: "housework", label: "Домашние хлопоты" },
					{ value: "dacha", label: "Дача" },
					{ value: "movies", label: "Просмотр фильмов" },
					{ value: "hunting", label: "Охота" },
					{ value: "fishing", label: "Рыбалка" },
					{ value: "shopping", label: "Шопинг" },
				],
			},
		},
		{
			key: "pets",
			component: MultiSelect,
			props: {
				label: "Мои питомцы",
				required: true,
				options: [
					{ value: "cat", label: "Кошка" },
					{ value: "dog", label: "Собака" },
					{ value: "reptile", label: "Рептилия" },
					{ value: "birds", label: "Птицы" },
					{ value: "fish", label: "Рыбки" },
					{ value: "hamster", label: "Хомяк" },
					{ value: "guinea_pig", label: "Морская свинка" },
					{ value: "rabbit", label: "Кролик" },
					{ value: "turtle", label: "Черепаха" },
					{ value: "other", label: "Другое" },
					{ value: "allergy", label: "Аллергия на животных" },
					{ value: "none", label: "Нет питомцев" },
				],
			},
		},
		{
			key: "appearance",
			component: Dropdown,
			props: {
				label: "Внешность",
				required: false,
				options: [
					{ value: "european", label: "Европейская" },
					{ value: "asian", label: "Азиатская" },
					{ value: "caucasian", label: "Кавказская" },
					{ value: "indian", label: "Индийская" },
					{ value: "african", label: "Африканская" },
					{ value: "mixed", label: "Смешанная" },
				],
			},
		},
		{
			key: "education",
			component: Dropdown,
			props: {
				label: "Образование",
				required: true,
				options: [
					{ value: "incomplete_secondary", label: "Неполное среднее" },
					{ value: "secondary", label: "Среднее" },
					{ value: "specialized", label: "Среднее специальное" },
					{ value: "incomplete_higher", label: "Неполное высшее" },
					{ value: "higher", label: "Высшее" },
					{ value: "two_higher", label: "Два высших" },
					{ value: "degree", label: "Учёная степень" },
				],
			},
		},
		{
			key: "children",
			component: Dropdown,
			props: {
				label: "Дети",
				required: true,
				options: [
					{ value: "no", label: "Нет детей" },
					{ value: "no_want", label: "Нет детей, но хочу" },
					{ value: "yes_together", label: "Есть дети, живём вместе" },
					{ value: "yes_separate", label: "Есть дети, живут отдельно" },
				],
			},
		},
		{
			key: "housing",
			component: Dropdown,
			props: {
				label: "Проживаю",
				required: true,
				options: [
					{ value: "own", label: "Своя квартира" },
					{ value: "rent", label: "Снимаю" },
					{ value: "parents", label: "Живу с родителями" },
				],
			},
		},
		{
			key: "transport",
			component: Dropdown,
			props: {
				label: "Личный транспорт",
				required: true,
				options: [
					{ value: "car", label: "Есть машина" },
					{ value: "no_car", label: "Нет машины" },
					{ value: "carsharing", label: "Каршеринг" },
				],
			},
		},
		{
			key: "income",
			component: Dropdown,
			props: {
				label: "Доход",
				required: true,
				options: [
					{ value: "student", label: "Студент" },
					{ value: "unstable", label: "Непостоянный" },
					{ value: "stable", label: "Постоянный" },
					{ value: "average", label: "Средний" },
					{ value: "high", label: "Высокий" },
				],
			},
		},
		// Вакцина от Covid
		{
			key: "covid",
			component: Dropdown,
			props: {
				label: "Вакцина от Covid",
				required: true,
				options: [
					{ value: "once", label: "Привит один раз" },
					{ value: "several", label: "Привит несколько раз" },
					{ value: "not", label: "Не прививался" },
				],
			},
		},
		// Татуировки
		{
			key: "tattoos",
			component: Dropdown,
			props: {
				label: "Татуировки",
				required: true,
				options: [
					{ value: "many", label: "Есть и много" },
					{ value: "few", label: "Немного" },
					{ value: "one", label: "Одна тату" },
					{ value: "none", label: "Нет тату" },
				],
			},
		},
		// Цветы
		{
			key: "flowers",
			component: MultiSelect,
			props: {
				label: "Какие нравятся цветы?",
				required: false,
				options: [
					{ value: "anemones", label: "Анемоны" },
					{ value: "gerberas", label: "Герберы" },
					{ value: "carnations", label: "Гвоздики" },
					{ value: "hydrangeas", label: "Гортензии" },
					{ value: "irises", label: "Ирисы" },
					{ value: "calla", label: "Каллы" },
					{ value: "lilies", label: "Лилии" },
					{ value: "orchids", label: "Орхидеи" },
					{ value: "peonies", label: "Пионы" },
					{ value: "mimosa", label: "Мимоза" },
					{ value: "ranunculus", label: "Ранункулус" },
					{ value: "roses", label: "Розы" },
					{ value: "tulips", label: "Тюльпаны" },
					{ value: "sunflowers", label: "Подсолнухи" },
					{ value: "daisies", label: "Ромашки" },
					{ value: "chrysanthemums", label: "Хризантемы" },
					{ value: "dahlias", label: "Георгины" },
					{ value: "asters", label: "Астры" },
					{ value: "lavender", label: "Лаванда" },
					{ value: "lilacs", label: "Сирень" },
					{ value: "gladiolus", label: "Гладиолусы" },
					{ value: "violets", label: "Фиалки" },
					{ value: "daffodils", label: "Нарциссы" },
					{ value: "hyacinths", label: "Гиацинты" },
					{ value: "allergy", label: "Аллергия на цветы" },
					{ value: "other", label: "Другое" },
				],
			},
		},
		// Хобби
		{
			key: "hobbies",
			component: TextInput,
			props: {
				label: "Хобби, увлечения",
				placeholder: "Введите через запятую: рисование, спорт...",
			},
		},
		// Рост
		{
			key: "height",
			component: TextInput,
			props: {
				label: "Рост (см)",
				placeholder: "Например: 175",
			},
		},
		// Вес
		{
			key: "weight",
			component: TextInput,
			props: {
				label: "Вес (кг)",
				placeholder: "Например: 70",
			},
		},
		// Цвет глаз
		{
			key: "eyeColor",
			component: Dropdown,
			props: {
				label: "Цвет глаз",
				required: true,
				options: [
					{ value: "blue", label: "Синий" },
					{ value: "gray", label: "Серый" },
					{ value: "green", label: "Зелёный" },
					{ value: "amber", label: "Янтарный" },
					{ value: "swamp", label: "Болотный" },
					{ value: "brown", label: "Карий" },
					{ value: "black", label: "Чёрный" },
					{ value: "mixed", label: "Смешанный" },
				],
			},
		},
		// Цвет волос
		{
			key: "hairColor",
			component: Dropdown,
			props: {
				label: "Цвет волос",
				required: true,
				options: [
					{ value: "brunette", label: "Брюнет / Брюнетка" },
					{ value: "blond", label: "Блондин / Блондинка" },
					{ value: "chestnut", label: "Шатен / Шатенка" },
					{ value: "brown", label: "Русый / Русская" },
					{ value: "red", label: "Рыжий / Рыжая" },
					{ value: "gray", label: "Седой / Серая" },
				],
			},
		},
		// Национальность
		{
			key: "nationality",
			component: TextInput,
			props: {
				label: "Национальность",
				placeholder: "Введите национальность",
			},
		},
	];

	const visibleQuestions = questions.slice(
		currentStep * totalQuestions,
		(currentStep + 1) * totalQuestions,
	);
	const answeredCount = Object.values(answers).filter(
		(v) => v !== "" && !(Array.isArray(v) && v.length === 0),
	).length;
	const progressPercentage = Math.round(
		(answeredCount / questions.length) * 100,
	);

	const handleNext = () => {
		if (currentStep < Math.ceil(questions.length / totalQuestions) - 1) {
			setCurrentStep((prev) => prev + 1);
		} else {
			// Сохраняем ответы в localStorage и отправляем на сервер
			localStorage.setItem("userProfile", JSON.stringify(answers));
			// Отправляем на сервер, чтобы другие пользователи могли видеть совместимость
			const token = localStorage.getItem("token");
			if (token) {
				fetch("/api/filters/answers", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ answers }),
				}).catch((err) => console.error("Answers save error:", err));
			}
			navigate("/menu");
		}
	};

	const handlePrev = () => {
		if (currentStep > 0) {
			setCurrentStep((prev) => prev - 1);
		} else {
			navigate("/profile");
		}
	};

	return (
		<div
			style={{
				minHeight: "100vh",
				backgroundColor: "#F5F5F5",
				fontFamily: "Inter, system-ui, sans-serif",
			}}
		>
			{/* Header */}
			<div
				style={{
					backgroundColor: "white",
					padding: "16px 20px",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
				}}
			>
				<button
					onClick={handlePrev}
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

			{/* Content */}
			<div style={{ maxWidth: 375, margin: "0 auto", padding: "24px 20px" }}>
				{/* Progress */}
				<ProgressBar current={progressPercentage} total={100} />

				{/* Description */}
				<div
					style={{
						backgroundColor: "white",
						borderRadius: 16,
						padding: 16,
						marginBottom: 20,
						boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
					}}
				>
					<p
						style={{
							fontSize: 14,
							color: "#1A1A1A",
							lineHeight: 1.6,
							margin: 0,
						}}
					>
						Выберите один или несколько вариантов для заполнения анкеты. Поля
						отмеченные <span style={{ color: "#FF6B6B" }}>*</span> обязательны
						для заполнения. После заполнения алгоритм предложит вам подходящего
						человека.
					</p>
				</div>

				{/* Questions */}
				<div
					style={{
						backgroundColor: "white",
						borderRadius: 16,
						padding: 20,
						boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
					}}
				>
					{visibleQuestions.map((question) => {
						const Component = question.component;
						return (
							<Component
								key={question.key}
								{...question.props}
								value={answers[question.key]}
								onChange={(value) => handleAnswer(question.key, value)}
							/>
						);
					})}
				</div>

				{/* Navigation */}
				<div style={{ display: "flex", gap: 12, marginTop: 20 }}>
					{currentStep > 0 && (
						<button
							onClick={handlePrev}
							style={{
								flex: 1,
								padding: "16px",
								backgroundColor: "white",
								color: "#7B5EA7",
								border: "2px solid #7B5EA7",
								borderRadius: 12,
								fontSize: 15,
								fontWeight: 600,
								cursor: "pointer",
							}}
						>
							Назад
						</button>
					)}
					<button
						onClick={handleNext}
						style={{
							flex: 2,
							padding: "16px",
							backgroundColor: "#7B5EA7",
							color: "white",
							border: "none",
							borderRadius: 12,
							fontSize: 15,
							fontWeight: 600,
							cursor: "pointer",
							boxShadow: "0 4px 12px rgba(123, 94, 167, 0.3)",
						}}
					>
						{currentStep < Math.ceil(questions.length / totalQuestions) - 1
							? "Далее"
							: "Сохранить"}
					</button>
				</div>

				{/* Step indicator */}
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						gap: 8,
						marginTop: 16,
					}}
				>
					{Array.from({
						length: Math.ceil(questions.length / totalQuestions),
					}).map((_, i) => (
						<div
							key={i}
							style={{
								width: 8,
								height: 8,
								borderRadius: "50%",
								backgroundColor: i === currentStep ? "#7B5EA7" : "#E8E8E8",
							}}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

// Login Screen
function LoginScreen() {
	// Если на этом устройстве уже входили по PIN — начинаем сразу с PIN
	const [login, setLogin] = useState(
		() => localStorage.getItem("pin_login") || "",
	);
	const [password, setPassword] = useState("");
	const [pin, setPin] = useState("");
	const [step, setStep] = useState(() =>
		localStorage.getItem("pin_login") ? 2 : 1,
	); // 1: пароль, 2: PIN
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const navigate = useNavigate();

	// Шаг 1: Вход по логину + пароль
	const handlePasswordLogin = async (e) => {
		e.preventDefault();
		if (!login || !password) {
			setError("Введите логин и пароль");
			return;
		}

		setLoading(true);
		setError("");

		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ login, password }),
			});

			const data = await response.json();

			if (response.ok) {
				// Если PIN установлен - показываем поле для PIN
				if (data.user.hasPin) {
					localStorage.setItem("pin_login", data.user.login || login);
					setStep(2);
					setPassword("");
				} else {
					// PIN обязателен: без него доступ к аккаунту не выпускаем
					localStorage.setItem("token", data.token);
					localStorage.setItem("user", JSON.stringify(data.user));
					navigate("/set-pin");
				}
			} else {
				setError(data.error || "Ошибка при входе");
			}
		} catch (err) {
			setError("Не удалось войти. Попробуйте снова.");
		} finally {
			setLoading(false);
		}
	};

	// Шаг 2: Ввод PIN
	const handlePinLogin = async (e) => {
		e.preventDefault();
		if (!pin || pin.length !== 4) {
			setError("Введите 4 цифры PIN");
			return;
		}

		setLoading(true);
		setError("");

		try {
			const response = await fetch("/api/auth/login-pin", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ login, pin }),
			});

			const data = await response.json();

			if (response.ok) {
				localStorage.setItem("token", data.token);
				localStorage.setItem("user", JSON.stringify(data.user));
				localStorage.setItem("pin_login", data.user.login || login);
				navigate(data.user.hasProfile ? "/menu" : "/profile");
			} else {
				setError(data.error || "Неверный PIN");
			}
		} catch (err) {
			setError("Ошибка входа");
		} finally {
			setLoading(false);
		}
	};

	const handlePinChange = (value) => {
		const digits = value.replace(/\D/g, "").slice(0, 4);
		setPin(digits);
		setError("");
	};

	return (
		<div
			style={{
				minHeight: "100vh",
				backgroundColor: "#F5F5F5",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: "16px",
				fontFamily: "Inter, system-ui, sans-serif",
			}}
		>
			<div
				style={{
					width: "100%",
					maxWidth: 375,
					padding: "64px 24px 24px",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				<img
					src={LOGO_URL}
					alt="Logo"
					style={{ width: 200, height: "auto", marginBottom: 8 }}
				/>
				<h2
					style={{
						fontSize: 18,
						fontWeight: 600,
						color: "#1A1A1A",
						margin: "24px 0 24px",
						textAlign: "center",
					}}
				>
					{step === 1 ? "Вход в аккаунт" : "Введите PIN-код"}
				</h2>

				{/* Шаг 1: Логин + Пароль */}
				{step === 1 && (
					<form onSubmit={handlePasswordLogin} style={{ width: "100%" }}>
						<input
							type="text"
							placeholder="Логин"
							value={login}
							onChange={(e) => {
								setLogin(e.target.value);
								setError("");
							}}
							autoComplete="username"
							style={{
								width: "100%",
								padding: "14px 16px",
								border: "2px solid #E0E0E0",
								borderRadius: 12,
								backgroundColor: "white",
								fontSize: 16,
								color: "#1A1A1A",
								outline: "none",
								marginBottom: 12,
							}}
						/>
						<input
							type="password"
							placeholder="Пароль"
							value={password}
							onChange={(e) => {
								setPassword(e.target.value);
								setError("");
							}}
							autoComplete="current-password"
							style={{
								width: "100%",
								padding: "14px 16px",
								border: error ? "2px solid #E53935" : "2px solid #E0E0E0",
								borderRadius: 12,
								backgroundColor: "white",
								fontSize: 16,
								color: "#1A1A1A",
								outline: "none",
								marginBottom: 16,
							}}
						/>
						{error && (
							<p
								style={{
									color: "#E53935",
									fontSize: 13,
									textAlign: "center",
									marginBottom: 12,
								}}
							>
								{error}
							</p>
						)}
						<button
							type="submit"
							disabled={loading}
							style={{
								width: "100%",
								padding: "16px",
								backgroundColor: loading ? "#A89BC7" : "#7B5EA7",
								color: "white",
								borderRadius: 12,
								fontSize: 16,
								fontWeight: 600,
								border: "none",
								cursor: loading ? "not-allowed" : "pointer",
								boxShadow: "0 4px 12px rgba(123, 94, 167, 0.3)",
							}}
						>
							{loading ? "Вход..." : "Войти"}
						</button>
					</form>
				)}

				{/* Шаг 2: PIN */}
				{step === 2 && (
					<form onSubmit={handlePinLogin} style={{ width: "100%" }}>
						<p
							style={{
								fontSize: 14,
								color: "#8E8E8E",
								marginBottom: 16,
								textAlign: "center",
							}}
						>
							Введите PIN-код для {login}
						</p>
						<input
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							placeholder="____"
							value={pin}
							onChange={(e) => handlePinChange(e.target.value)}
							maxLength={4}
							autoFocus
							style={{
								width: "100%",
								padding: "16px",
								border: error ? "2px solid #E53935" : "2px solid #E0E0E0",
								borderRadius: 12,
								backgroundColor: "white",
								fontSize: 28,
								letterSpacing: "20px",
								textAlign: "center",
								color: "#1A1A1A",
								outline: "none",
								marginBottom: 16,
							}}
						/>
						{error && (
							<p
								style={{
									color: "#E53935",
									fontSize: 13,
									textAlign: "center",
									marginBottom: 12,
								}}
							>
								{error}
							</p>
						)}
						<button
							type="submit"
							disabled={loading || pin.length !== 4}
							style={{
								width: "100%",
								padding: "16px",
								backgroundColor:
									loading || pin.length !== 4 ? "#A89BC7" : "#7B5EA7",
								color: "white",
								borderRadius: 12,
								fontSize: 16,
								fontWeight: 600,
								border: "none",
								cursor: loading || pin.length !== 4 ? "not-allowed" : "pointer",
								boxShadow: "0 4px 12px rgba(123, 94, 167, 0.3)",
							}}
						>
							{loading ? "Вход..." : "Войти"}
						</button>
						<button
							type="button"
							onClick={() => {
								setStep(1);
								setPin("");
								setError("");
							}}
							style={{
								width: "100%",
								padding: "12px",
								marginTop: 12,
								backgroundColor: "transparent",
								color: "#8E8E8E",
								border: "none",
								fontSize: 14,
								cursor: "pointer",
							}}
						>
							← Назад
						</button>
					</form>
				)}

				<p
					style={{
						textAlign: "center",
						marginTop: 24,
						fontSize: 14,
						color: "#8E8E8E",
					}}
				>
					Нет аккаунта?{" "}
					<span
						onClick={() => navigate("/register")}
						style={{ color: "#7B5EA7", fontWeight: 600, cursor: "pointer" }}
					>
						Зарегистрироваться
					</span>
				</p>
				<p
					style={{
						textAlign: "center",
						marginTop: 12,
						fontSize: 14,
						color: "#8E8E8E",
					}}
				>
					Забыли PIN или пароль?{" "}
					<span
						onClick={() => navigate("/forgot-password")}
						style={{ color: "#7B5EA7", fontWeight: 600, cursor: "pointer" }}
					>
						Восстановить
					</span>
				</p>
			</div>
		</div>
	);
}

// ============================================
// FORGOT PASSWORD SCREEN
// ============================================
function ForgotPasswordScreen() {
	const [step, setStep] = useState(1); // 1: login, 2: code, 3: new password
	const [login, setLogin] = useState("");
	const [code, setCode] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [newPin, setNewPin] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const navigate = useNavigate();

	const handleSendCode = async (e) => {
		e.preventDefault();
		if (!login) {
			setError("Введите логин");
			return;
		}
		setLoading(true);
		setError("");
		try {
			const response = await fetch("/api/auth/forgot-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ login }),
			});
			const data = await response.json();
			if (response.ok) {
				setStep(2);
				setSuccess("Код отправлен на привязанный email");
			} else {
				setError(data.error);
			}
		} catch (err) {
			setError("Ошибка отправки");
		} finally {
			setLoading(false);
		}
	};

	const handleResetPassword = async (e) => {
		e.preventDefault();
		// Можно вернуть только пароль, только PIN или сразу оба
		if (!newPassword && !newPin) {
			setError("Заполните хотя бы одно поле: пароль или PIN");
			return;
		}
		if (newPassword) {
			if (newPassword.length < 6) {
				setError("Пароль минимум 6 символов");
				return;
			}
			if (newPassword !== confirmPassword) {
				setError("Пароли не совпадают");
				return;
			}
		}
		if (newPin && !/^\d{4}$/.test(newPin)) {
			setError("PIN — ровно 4 цифры");
			return;
		}
		setLoading(true);
		setError("");
		try {
			const response = await fetch("/api/auth/reset-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					login,
					code,
					newPassword: newPassword || undefined,
					pin: newPin || undefined,
				}),
			});
			const data = await response.json();
			if (response.ok) {
				setSuccess(data.message || "Готово");
				setTimeout(() => navigate("/"), 2000);
			} else {
				setError(data.error);
			}
		} catch (err) {
			setError("Ошибка");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			style={{
				minHeight: "100vh",
				backgroundColor: "#F5F5F5",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: "16px",
				fontFamily: "Inter, system-ui, sans-serif",
			}}
		>
			<div
				style={{
					width: "100%",
					maxWidth: 375,
					padding: "64px 24px 24px",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				<img
					src={LOGO_URL}
					alt="Logo"
					style={{ width: 200, height: "auto", marginBottom: 8 }}
				/>
				<h2 style={{ fontSize: 20, fontWeight: 600, margin: "24px 0 16px" }}>
					Восстановление доступа
				</h2>
				{step === 1 && (
					<form onSubmit={handleSendCode} style={{ width: "100%" }}>
						<input
							type="text"
							placeholder="Ваш логин"
							value={login}
							onChange={(e) => setLogin(e.target.value)}
							style={{
								width: "100%",
								padding: "14px 16px",
								border: "2px solid #E0E0E0",
								borderRadius: 12,
								backgroundColor: "white",
								fontSize: 16,
								outline: "none",
								marginBottom: 16,
							}}
						/>
						<p
							style={{
								fontSize: 12,
								color: "#FF9800",
								marginBottom: 12,
								padding: 8,
								backgroundColor: "#FFF3E0",
								borderRadius: 8,
							}}
						>
							⚠️ Код будет отправлен на email. Письмо может попасть в папку
							"Спам" - проверьте её.
						</p>
						{error && (
							<p style={{ color: "#E53935", fontSize: 13, marginBottom: 12 }}>
								{error}
							</p>
						)}
						{success && (
							<p style={{ color: "#4CAF50", fontSize: 13, marginBottom: 12 }}>
								{success}
							</p>
						)}
						<button
							type="submit"
							disabled={loading}
							style={{
								width: "100%",
								padding: "16px",
								backgroundColor: loading ? "#A89BC7" : "#7B5EA7",
								color: "white",
								borderRadius: 12,
								fontSize: 16,
								border: "none",
								cursor: "pointer",
							}}
						>
							{loading ? "Отправка..." : "Получить код"}
						</button>
					</form>
				)}
				{step === 2 && (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							setStep(3);
						}}
						style={{ width: "100%" }}
					>
						<p style={{ fontSize: 14, color: "#8E8E8E", marginBottom: 12 }}>
							Введите код из email
						</p>
						<input
							type="text"
							placeholder="Код"
							value={code}
							onChange={(e) => setCode(e.target.value)}
							maxLength={6}
							style={{
								width: "100%",
								padding: "14px 16px",
								border: "2px solid #E0E0E0",
								borderRadius: 12,
								backgroundColor: "white",
								fontSize: 18,
								textAlign: "center",
								letterSpacing: "4px",
								outline: "none",
								marginBottom: 16,
							}}
						/>
						<button
							type="submit"
							style={{
								width: "100%",
								padding: "16px",
								backgroundColor: "#7B5EA7",
								color: "white",
								borderRadius: 12,
								fontSize: 16,
								border: "none",
								cursor: "pointer",
							}}
						>
							Далее
						</button>
					</form>
				)}
				{step === 3 && (
					<form onSubmit={handleResetPassword} style={{ width: "100%" }}>
						<p style={{ fontSize: 14, color: "#8E8E8E", marginBottom: 12 }}>
							Заполните то, что хотите вернуть: пароль, PIN или оба сразу.
						</p>
						<input
							type="password"
							placeholder="Новый пароль (не обязательно)"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							style={{
								width: "100%",
								padding: "14px 16px",
								border: "2px solid #E0E0E0",
								borderRadius: 12,
								backgroundColor: "white",
								fontSize: 16,
								outline: "none",
								marginBottom: 12,
							}}
						/>
						<input
							type="password"
							placeholder="Повторите пароль"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							style={{
								width: "100%",
								padding: "14px 16px",
								border: "2px solid #E0E0E0",
								borderRadius: 12,
								backgroundColor: "white",
								fontSize: 16,
								outline: "none",
								marginBottom: 12,
							}}
						/>
						<input
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							placeholder="Новый PIN — 4 цифры"
							value={newPin}
							onChange={(e) =>
								setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))
							}
							maxLength={4}
							style={{
								width: "100%",
								padding: "14px 16px",
								border: error ? "2px solid #E53935" : "2px solid #E0E0E0",
								borderRadius: 12,
								backgroundColor: "white",
								fontSize: 16,
								letterSpacing: "6px",
								outline: "none",
								marginBottom: 12,
							}}
						/>
						{error && (
							<p style={{ color: "#E53935", fontSize: 13, marginBottom: 12 }}>
								{error}
							</p>
						)}
						{success && (
							<p style={{ color: "#4CAF50", fontSize: 13, marginBottom: 12 }}>
								{success}
							</p>
						)}
						<button
							type="submit"
							disabled={loading}
							style={{
								width: "100%",
								padding: "16px",
								backgroundColor: loading ? "#A89BC7" : "#7B5EA7",
								color: "white",
								borderRadius: 12,
								fontSize: 16,
								border: "none",
								cursor: "pointer",
							}}
						>
							{loading ? "Сохранение..." : "Сохранить"}
						</button>
					</form>
				)}
				<p
					style={{
						textAlign: "center",
						marginTop: 24,
						fontSize: 14,
						color: "#8E8E8E",
					}}
				>
					Вспомнили доступ?{" "}
					<span
						onClick={() => navigate("/")}
						style={{ color: "#7B5EA7", fontWeight: 600, cursor: "pointer" }}
					>
						Войти
					</span>
				</p>
			</div>
		</div>
	);
}

// ============================================
// SET PIN SCREEN
// ============================================
function SetPinScreen() {
	const [pin, setPin] = useState("");
	const [confirmPin, setConfirmPin] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const navigate = useNavigate();

	const handlePinChange = (setter) => (value) => {
		const digits = value.replace(/\D/g, "").slice(0, 4);
		setter(digits);
		setError("");
	};

	const handleSetPin = async (e) => {
		e.preventDefault();
		if (!/^\d{4}$/.test(pin) || pin.length !== 4) {
			setError("Введите 4 цифры");
			return;
		}
		if (pin !== confirmPin) {
			setError("PIN-коды не совпадают");
			return;
		}
		setLoading(true);
		setError("");
		try {
			const token = localStorage.getItem("token");
			const response = await fetch("/api/auth/set-pin", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ pin }),
			});
			const data = await response.json();
			if (response.ok) {
				// Запоминаем логин: в следующий раз приложение сразу попросит PIN
				const me = JSON.parse(localStorage.getItem("user") || "{}");
				if (me.login) localStorage.setItem("pin_login", me.login);
				// Отмечаем у себя, что PIN больше не ждём
				me.hasPin = true;
				if (typeof data.hasProfile === "boolean")
					me.hasProfile = data.hasProfile;
				localStorage.setItem("user", JSON.stringify(me));
				const hasProfile =
					typeof data.hasProfile === "boolean"
						? data.hasProfile
						: !!me.hasProfile;
				navigate(hasProfile ? "/menu" : "/profile");
			} else {
				setError(data.error || "Ошибка");
			}
		} catch (err) {
			setError("Ошибка сохранения");
		} finally {
			setLoading(false);
		}
	};

	// Выход с экрана установки PIN: сессия сбрасывается, аккаунт остаётся
	const handleExit = async () => {
		const token = localStorage.getItem("token");
		try {
			await fetch("/api/auth/logout", {
				method: "POST",
				headers: { Authorization: `Bearer ${token}` },
			});
		} catch {
			// Сервер недоступен — локальную сессию всё равно снимаем
		}
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		localStorage.removeItem("pin_login");
		navigate("/", { replace: true });
	};

	return (
		<div
			style={{
				minHeight: "100vh",
				backgroundColor: "#F5F5F5",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: "16px",
				fontFamily: "Inter, system-ui, sans-serif",
			}}
		>
			<div
				style={{
					width: "100%",
					maxWidth: 375,
					padding: "64px 24px 24px",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				<img
					src={LOGO_URL}
					alt="Logo"
					style={{ width: 200, height: "auto", marginBottom: 8 }}
				/>
				<h2 style={{ fontSize: 20, fontWeight: 600, margin: "24px 0 8px" }}>
					Создайте PIN-код
				</h2>
				<p
					style={{
						fontSize: 14,
						color: "#8E8E8E",
						marginBottom: 24,
						textAlign: "center",
					}}
				>
					4 цифры — с ними вы и будете входить. Забыли? Восстанавливаете почтой,
					которую указали при регистрации.
				</p>
				<form onSubmit={handleSetPin} style={{ width: "100%" }}>
					<div style={{ marginBottom: 16 }}>
						<p style={{ fontSize: 14, color: "#8E8E8E", marginBottom: 8 }}>
							PIN-код
						</p>
						<input
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							placeholder="____"
							value={pin}
							onChange={(e) => handlePinChange(setPin)(e.target.value)}
							maxLength={4}
							style={{
								width: "100%",
								padding: "16px",
								border: "2px solid #E0E0E0",
								borderRadius: 12,
								backgroundColor: "white",
								fontSize: 28,
								letterSpacing: "20px",
								textAlign: "center",
								outline: "none",
							}}
						/>
					</div>
					<div style={{ marginBottom: 24 }}>
						<p style={{ fontSize: 14, color: "#8E8E8E", marginBottom: 8 }}>
							Подтвердите PIN
						</p>
						<input
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							placeholder="____"
							value={confirmPin}
							onChange={(e) => handlePinChange(setConfirmPin)(e.target.value)}
							maxLength={4}
							style={{
								width: "100%",
								padding: "16px",
								border: error ? "2px solid #E53935" : "2px solid #E0E0E0",
								borderRadius: 12,
								backgroundColor: "white",
								fontSize: 28,
								letterSpacing: "20px",
								textAlign: "center",
								outline: "none",
							}}
						/>
					</div>
					{error && (
						<p
							style={{
								color: "#E53935",
								fontSize: 13,
								textAlign: "center",
								marginBottom: 12,
							}}
						>
							{error}
						</p>
					)}
					<button
						type="submit"
						disabled={loading || pin.length !== 4 || confirmPin.length !== 4}
						style={{
							width: "100%",
							padding: "16px",
							backgroundColor:
								loading || pin.length !== 4 || confirmPin.length !== 4
									? "#A89BC7"
									: "#7B5EA7",
							color: "white",
							borderRadius: 12,
							fontSize: 16,
							fontWeight: 600,
							border: "none",
							cursor: "pointer",
							boxShadow: "0 4px 12px rgba(123, 94, 167, 0.3)",
						}}
					>
						{loading ? "Сохранение..." : "Сохранить PIN"}
					</button>
				</form>
				{/* Без PIN внутрь не пускаем, но и в ловушке держать не должны */}
				<button
					onClick={handleExit}
					style={{
						marginTop: 16,
						background: "none",
						border: "none",
						color: "#7B5EA7",
						fontSize: 14,
						textDecoration: "underline",
						cursor: "pointer",
					}}
				>
					Передумали? Выйти и войти позже
				</button>
			</div>
		</div>
	);
}

// Привязка или смена email. Почта — единственный канал возврата доступа,
// поэтому её можно поставить только подтверждением на новом адресе.
function EmailScreen() {
	const navigate = useNavigate();
	const [step, setStep] = useState("email"); // "email" → "code"
	const [current, setCurrent] = useState(
		() => JSON.parse(localStorage.getItem("user") || "{}").email || "",
	);
	const [email, setEmail] = useState("");
	const [target, setTarget] = useState("");
	const [code, setCode] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");

	useEffect(() => {
		// localStorage мог устареть — сверяемся с сервером (в этом файле
		// запросы идут через fetch, общей api-обёртки здесь не используют)
		const token = localStorage.getItem("token");
		fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
			.then((r) => (r.ok ? r.json() : null))
			.then((u) => {
				if (u) setCurrent(u.email || "");
			})
			.catch(() => {});
	}, []);

	const post = async (path, body) => {
		const token = localStorage.getItem("token");
		const response = await fetch(`/api/auth/${path}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(body),
		});
		const data = await response.json();
		if (!response.ok) throw new Error(data.error || "Не получилось");
		return data;
	};

	const sendCode = async () => {
		setLoading(true);
		setError("");
		setNotice("");
		try {
			const data = await post("email/request", { email: email.trim() });
			setTarget(data.email);
			// Доставка могла отвалиться (неверный адрес, спам-фильтр) — код при
			// этом живёт свои 15 минут, поэтому шаг ввода не блокируем
			setNotice(
				data.delivered === false
					? `${data.message} Письмо иногда приходит позже.`
					: "",
			);
			setStep("code");
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const confirmCode = async (e) => {
		e.preventDefault();
		if (!/^\d{6}$/.test(code)) {
			setError("Введите 6 цифр из письма");
			return;
		}
		setLoading(true);
		setError("");
		try {
			const data = await post("email/confirm", { email: target, code });
			const me = JSON.parse(localStorage.getItem("user") || "{}");
			localStorage.setItem("user", JSON.stringify({ ...me, ...data.user }));
			navigate("/settings", { replace: true });
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const inputStyle = {
		width: "100%",
		padding: "16px",
		border: error ? "2px solid #E53935" : "2px solid #E0E0E0",
		borderRadius: 12,
		backgroundColor: "white",
		fontSize: 16,
		outline: "none",
	};

	return (
		<div
			style={{
				minHeight: "100vh",
				backgroundColor: "#F5F5F5",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: "16px",
				fontFamily: "Inter, system-ui, sans-serif",
			}}
		>
			<div
				style={{
					width: "100%",
					maxWidth: 375,
					padding: "64px 24px 24px",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				<img
					src={LOGO_URL}
					alt="Logo"
					style={{ width: 200, height: "auto", marginBottom: 8 }}
				/>
				<h2 style={{ fontSize: 20, fontWeight: 600, margin: "24px 0 8px" }}>
					{step === "email" ? "Электронная почта" : "Подтвердите код"}
				</h2>
				<p
					style={{
						fontSize: 14,
						color: "#8E8E8E",
						marginBottom: 24,
						textAlign: "center",
					}}
				>
					{current
						? `Сейчас привязана ${current}. Новая почта придёт сюда.`
						: "Почта не привязана. Без неё не получится восстановить доступ, если вы забудете PIN."}
				</p>

				{step === "email" ? (
					<div style={{ width: "100%" }}>
						<input
							type="email"
							placeholder="you@example.com"
							value={email}
							onChange={(e) => {
								setEmail(e.target.value);
								setError("");
							}}
							style={inputStyle}
						/>
						{error && (
							<p
								style={{
									color: "#E53935",
									fontSize: 13,
									textAlign: "center",
									margin: "12px 0 0",
								}}
							>
								{error}
							</p>
						)}
						<button
							onClick={sendCode}
							disabled={loading || email.trim().length < 5}
							style={{
								width: "100%",
								marginTop: 16,
								padding: "16px",
								backgroundColor:
									loading || email.trim().length < 5 ? "#A89BC7" : "#7B5EA7",
								color: "white",
								borderRadius: 12,
								fontSize: 16,
								fontWeight: 600,
								border: "none",
								cursor: "pointer",
								boxShadow: "0 4px 12px rgba(123, 94, 167, 0.3)",
							}}
						>
							{loading ? "Отправка..." : "Отправить код"}
						</button>
					</div>
				) : (
					<form onSubmit={confirmCode} style={{ width: "100%" }}>
						<p
							style={{
								fontSize: 13,
								color: "#8E8E8E",
								textAlign: "center",
								margin: "0 0 12px",
							}}
						>
							Код отправлен на {target}. Проверьте и папку «Спам».
						</p>
						{notice && (
							<div
								style={{
									backgroundColor: "#FFF4E5",
									borderRadius: 12,
									padding: "12px 16px",
									marginBottom: 12,
								}}
							>
								<p style={{ margin: 0, fontSize: 13, color: "#8A5A00" }}>
									{notice}
								</p>
							</div>
						)}
						<input
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							maxLength={6}
							placeholder="______"
							value={code}
							onChange={(e) => {
								setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
								setError("");
							}}
							style={{
								...inputStyle,
								fontSize: 28,
								letterSpacing: "16px",
								textAlign: "center",
							}}
						/>
						{error && (
							<p
								style={{
									color: "#E53935",
									fontSize: 13,
									textAlign: "center",
									margin: "12px 0 0",
								}}
							>
								{error}
							</p>
						)}
						<button
							type="submit"
							disabled={loading || code.length !== 6}
							style={{
								width: "100%",
								marginTop: 16,
								padding: "16px",
								backgroundColor:
									loading || code.length !== 6 ? "#A89BC7" : "#7B5EA7",
								color: "white",
								borderRadius: 12,
								fontSize: 16,
								fontWeight: 600,
								border: "none",
								cursor: "pointer",
								boxShadow: "0 4px 12px rgba(123, 94, 167, 0.3)",
							}}
						>
							{loading ? "Проверка..." : "Подтвердить"}
						</button>
						<button
							type="button"
							onClick={() => {
								setStep("email");
								setCode("");
								setError("");
								setNotice("");
							}}
							style={{
								width: "100%",
								marginTop: 16,
								background: "none",
								border: "none",
								color: "#7B5EA7",
								fontSize: 14,
								textDecoration: "underline",
								cursor: "pointer",
							}}
						>
							Изменить адрес / отправить ещё раз
						</button>
					</form>
				)}

				<button
					onClick={() => navigate(-1)}
					style={{
						marginTop: 24,
						background: "none",
						border: "none",
						color: "#8E8E8E",
						fontSize: 14,
						cursor: "pointer",
					}}
				>
					← Назад
				</button>
			</div>
		</div>
	);
}

// Yandex OAuth Callback
function YandexCallback() {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const handleCallback = async () => {
			const params = new URLSearchParams(window.location.search);
			const code = params.get("code");
			const errorParam = params.get("error");

			if (errorParam) {
				setError("Авторизация отклонена");
				setLoading(false);
				return;
			}

			if (!code) {
				setError("Код авторизации не получен");
				setLoading(false);
				return;
			}

			try {
				// Отправляем код на сервер для обмена на токен
				const response = await fetch("/api/auth/yandex/callback", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ code }),
				});

				if (response.ok) {
					const data = await response.json();
					// Сохраняем токен и перенаправляем
					localStorage.setItem("token", data.token);
					navigate("/menu");
				} else {
					setError("Ошибка авторизации");
				}
			} catch (err) {
				// Если сервер недоступен, используем demo-режим
				localStorage.setItem("token", "yandex_demo_token");
				localStorage.setItem(
					"user",
					JSON.stringify({
						id: "yandex_user",
						name: "Пользователь",
						source: "yandex",
					}),
				);
				navigate("/menu");
			}
		};

		handleCallback();
	}, [navigate]);

	if (loading) {
		return (
			<div
				style={{
					height: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flexDirection: "column",
					gap: 16,
				}}
			>
				<div
					style={{
						width: 48,
						height: 48,
						borderRadius: "50%",
						border: "4px solid #E0E0E0",
						borderTopColor: "#7B5EA7",
						animation: "spin 1s linear infinite",
					}}
				/>
				<p style={{ color: "#8E8E8E" }}>Авторизация через Яндекс...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div
				style={{
					height: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					flexDirection: "column",
					gap: 16,
					padding: 20,
				}}
			>
				<p style={{ color: "#FF6B6B", fontSize: 16 }}>{error}</p>
				<button
					onClick={() => navigate("/")}
					style={{
						padding: "12px 24px",
						backgroundColor: "#7B5EA7",
						color: "white",
						border: "none",
						borderRadius: 8,
						cursor: "pointer",
					}}
				>
					На главную
				</button>
			</div>
		);
	}

	return null;
}

// ============================================
// REGISTER SCREEN
// ============================================
function RegisterScreen() {
	const [name, setName] = useState("");
	const [login, setLogin] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const navigate = useNavigate();

	const handleRegister = async (e) => {
		e.preventDefault();

		if (!name.trim()) {
			setError("Введите имя");
			return;
		}
		if (!login || login.length < 3) {
			setError("Логин минимум 3 символа (латиница, цифры, _)");
			return;
		}
		if (!/^[a-zA-Z0-9_]+$/.test(login)) {
			setError("Логин может содержать только латиницу, цифры и _");
			return;
		}
		const trimmedEmail = email.trim();
		if (!trimmedEmail) {
			setError("Без почты аккаунт не создать: на неё восстанавливают доступ");
			return;
		}
		if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(trimmedEmail)) {
			setError("Похоже, в почте опечатка");
			return;
		}
		if (password.length < 6) {
			setError("Пароль должен быть минимум 6 символов");
			return;
		}
		if (password !== confirmPassword) {
			setError("Пароли не совпадают");
			return;
		}

		setLoading(true);
		setError("");

		try {
			const response = await fetch("/api/auth/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					login,
					email: trimmedEmail,
					password,
					name,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				localStorage.setItem("token", data.token);
				localStorage.setItem("user", JSON.stringify(data.user));
				// Сначала PIN, потом анкета
				navigate(data.requiresPin === false ? "/profile" : "/set-pin");
			} else {
				setError(data.error || "Ошибка при регистрации");
			}
		} catch (err) {
			setError("Не удалось зарегистрироваться. Попробуйте снова.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div
			style={{
				minHeight: "100vh",
				backgroundColor: "#F5F5F5",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: "16px",
				fontFamily: "Inter, system-ui, sans-serif",
			}}
		>
			<div
				style={{
					width: "100%",
					maxWidth: 375,
					padding: "64px 24px 24px",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				<img
					src={LOGO_URL}
					alt="Logo"
					style={{ width: 200, height: "auto", marginBottom: 8 }}
				/>
				<h2
					style={{
						fontSize: 22,
						fontWeight: 700,
						color: "#1A1A1A",
						margin: "32px 0 24px",
						textAlign: "center",
					}}
				>
					Создайте аккаунт
				</h2>
				<form onSubmit={handleRegister} style={{ width: "100%" }}>
					<div style={{ marginBottom: 16 }}>
						<input
							type="text"
							placeholder="Ваше имя"
							value={name}
							onChange={(e) => setName(e.target.value)}
							style={{
								width: "100%",
								padding: "14px 16px",
								border: "2px solid #E0E0E0",
								borderRadius: 12,
								fontSize: 16,
								backgroundColor: "white",
								outline: "none",
							}}
						/>
					</div>
					<div style={{ marginBottom: 16 }}>
						<input
							type="text"
							placeholder="Логин (латиница, цифры)"
							value={login}
							onChange={(e) => setLogin(e.target.value.toLowerCase())}
							style={{
								width: "100%",
								padding: "14px 16px",
								border: "2px solid #E0E0E0",
								borderRadius: 12,
								fontSize: 16,
								backgroundColor: "white",
								outline: "none",
							}}
						/>
					</div>
					<div style={{ marginBottom: 16 }}>
						<input
							type="email"
							placeholder="Email (обязательно)"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							style={{
								width: "100%",
								padding: "14px 16px",
								border: "2px solid #E0E0E0",
								borderRadius: 12,
								fontSize: 16,
								backgroundColor: "white",
								outline: "none",
							}}
						/>
						<p
							style={{
								fontSize: 12,
								color: "#8E8E8E",
								margin: "6px 2px 0",
							}}
						>
							На него вернём доступ, если забудете PIN
						</p>
					</div>
					<div style={{ marginBottom: 16 }}>
						<input
							type="password"
							placeholder="Пароль (мин. 6 символов)"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							style={{
								width: "100%",
								padding: "14px 16px",
								border: "2px solid #E0E0E0",
								borderRadius: 12,
								fontSize: 16,
								backgroundColor: "white",
								outline: "none",
							}}
						/>
					</div>
					<div style={{ marginBottom: 24 }}>
						<input
							type="password"
							placeholder="Повторите пароль"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							style={{
								width: "100%",
								padding: "14px 16px",
								border: error.includes("совпадают")
									? "2px solid #E53935"
									: "2px solid #E0E0E0",
								borderRadius: 12,
								fontSize: 16,
								backgroundColor: "white",
								outline: "none",
							}}
						/>
					</div>

					{error && (
						<p
							style={{
								color: "#E53935",
								fontSize: 14,
								textAlign: "center",
								marginBottom: 16,
							}}
						>
							{error}
						</p>
					)}

					<button
						type="submit"
						disabled={loading}
						style={{
							width: "100%",
							padding: "16px",
							backgroundColor: loading ? "#A89BC7" : "#7B5EA7",
							color: "white",
							borderRadius: 12,
							fontSize: 16,
							fontWeight: 600,
							border: "none",
							cursor: loading ? "not-allowed" : "pointer",
							boxShadow: "0 4px 12px rgba(123, 94, 167, 0.3)",
						}}
					>
						{loading ? "Регистрация..." : "Создать аккаунт"}
					</button>
				</form>

				<p
					style={{
						textAlign: "center",
						marginTop: 24,
						fontSize: 14,
						color: "#8E8E8E",
					}}
				>
					Уже есть аккаунт?{" "}
					<span
						onClick={() => navigate("/")}
						style={{ color: "#7B5EA7", fontWeight: 600, cursor: "pointer" }}
					>
						Войти
					</span>
				</p>
			</div>
		</div>
	);
}

// Profile Screen
function ProfileScreen() {
	const { gender, setGender } = useContext(GenderContext);
	const navigate = useNavigate();
	const [name, setName] = useState("Александр");
	const [city, setCity] = useState("Москва");
	const [metro, setMetro] = useState("Красные Ворота");
	const [birthdate, setBirthdate] = useState("15.03.1995");
	// Почта приходит с сервера. Раньше здесь лежало демо-значение
	// alex@mail.ru: любой пользователь видел чужой адрес и думал, что почта
	// привязана, хотя никуда она не сохранялась и восстановить доступ было
	// нельзя. Теперь поле только показывает реальный привязанный email.
	const [email, setEmail] = useState(null);

	useEffect(() => {
		const cached = JSON.parse(localStorage.getItem("user") || "{}");
		setEmail(cached.email || "");
		const token = localStorage.getItem("token");
		fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
			.then((r) => (r.ok ? r.json() : null))
			.then((u) => {
				if (u) setEmail(u.email || "");
			})
			.catch(() => {});
	}, []);

	const handleContinue = () => {
		// Сохраняем базовые данные профиля отдельно
		const basicProfile = {
			name,
			city,
			metro,
			birthdate,
			email: email || "",
		};
		localStorage.setItem("basicProfile", JSON.stringify(basicProfile));
		navigate("/questions");
	};

	return (
		<div
			style={{
				minHeight: "100vh",
				backgroundColor: "#F5F5F5",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				padding: "16px",
				fontFamily: "Inter, system-ui, sans-serif",
			}}
		>
			<div
				style={{
					width: "100%",
					maxWidth: 375,
					backgroundColor: "#F5F5F5",
					padding: "48px 24px 24px",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "center",
						marginBottom: 8,
					}}
				>
					<img
						src={LOGO_URL}
						alt="Logo"
						style={{ width: 120, height: "auto" }}
					/>
				</div>

				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						marginTop: 24,
						marginBottom: 24,
					}}
				>
					<button
						style={{
							width: 120,
							height: 120,
							borderRadius: 20,
							backgroundColor:
								gender === "male"
									? colors.male.bg
									: gender === "female"
										? colors.female.bg
										: "white",
							border: `2px dashed ${gender === "male" ? colors.male.icon : gender === "female" ? colors.female.icon : "#CCCCCC"}`,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							cursor: "pointer",
							transition: "all 0.2s",
						}}
					>
						<svg
							width="40"
							height="40"
							viewBox="0 0 24 24"
							fill={
								gender === "male"
									? colors.male.icon
									: gender === "female"
										? colors.female.icon
										: "#8E8E8E"
							}
						>
							<path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
						</svg>
					</button>
					<span style={{ fontSize: 14, color: "#8E8E8E", marginTop: 8 }}>
						Фото
					</span>
				</div>

				<div style={{ marginBottom: 20 }}>
					<span
						style={{
							fontSize: 14,
							color: "#8E8E8E",
							marginBottom: 8,
							display: "block",
						}}
					>
						Пол
					</span>
					<div style={{ display: "flex", gap: 8 }}>
						<button
							onClick={() => setGender("male")}
							style={{
								flex: 1,
								padding: "12px 16px",
								borderRadius: 12,
								fontSize: 14,
								fontWeight: 500,
								border: "none",
								cursor: "pointer",
								backgroundColor: gender === "male" ? colors.male.bg : "white",
								color: gender === "male" ? colors.male.text : "#8E8E8E",
								transition: "all 0.2s",
							}}
						>
							Мужской
						</button>
						<button
							onClick={() => setGender("female")}
							style={{
								flex: 1,
								padding: "12px 16px",
								borderRadius: 12,
								fontSize: 14,
								fontWeight: 500,
								border: "none",
								cursor: "pointer",
								backgroundColor:
									gender === "female" ? colors.female.bg : "white",
								color: gender === "female" ? colors.female.text : "#8E8E8E",
								transition: "all 0.2s",
							}}
						>
							Женский
						</button>
					</div>
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							backgroundColor:
								gender === "male"
									? colors.male.bg
									: gender === "female"
										? colors.female.bg
										: "white",
							borderRadius: 12,
							padding: "12px 16px",
							gap: 12,
							transition: "all 0.2s",
						}}
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill={
								gender === "male"
									? colors.male.icon
									: gender === "female"
										? colors.female.icon
										: "#7B5EA7"
							}
						>
							<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
						</svg>
						<input
							type="text"
							placeholder="Имя/Никнейм"
							value={name}
							onChange={(e) => setName(e.target.value)}
							style={{
								flex: 1,
								border: "none",
								backgroundColor: "transparent",
								fontSize: 16,
								color: "#1A1A1A",
								outline: "none",
							}}
						/>
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							backgroundColor:
								gender === "male"
									? colors.male.bg
									: gender === "female"
										? colors.female.bg
										: "white",
							borderRadius: 12,
							padding: "12px 16px",
							gap: 12,
							transition: "all 0.2s",
						}}
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill={
								gender === "male"
									? colors.male.icon
									: gender === "female"
										? colors.female.icon
										: "#7B5EA7"
							}
						>
							<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
						</svg>
						<input
							type="text"
							placeholder="Место проживания"
							value={city}
							onChange={(e) => setCity(e.target.value)}
							style={{
								flex: 1,
								border: "none",
								backgroundColor: "transparent",
								fontSize: 16,
								color: "#1A1A1A",
								outline: "none",
							}}
						/>
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							backgroundColor:
								gender === "male"
									? colors.male.bg
									: gender === "female"
										? colors.female.bg
										: "white",
							borderRadius: 12,
							padding: "12px 16px",
							gap: 12,
							transition: "all 0.2s",
						}}
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke={
								gender === "male"
									? colors.male.icon
									: gender === "female"
										? colors.female.icon
										: "#7B5EA7"
							}
							strokeWidth="2"
						>
							<circle cx="12" cy="12" r="10" />
							<text
								x="12"
								y="16"
								textAnchor="middle"
								fontSize="12"
								fontWeight="bold"
								fill={
									gender === "male"
										? colors.male.icon
										: gender === "female"
											? colors.female.icon
											: "#7B5EA7"
								}
								stroke="none"
							>
								M
							</text>
						</svg>
						<input
							type="text"
							placeholder="Станция метро"
							value={metro}
							onChange={(e) => setMetro(e.target.value)}
							style={{
								flex: 1,
								border: "none",
								backgroundColor: "transparent",
								fontSize: 16,
								color: "#1A1A1A",
								outline: "none",
							}}
						/>
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							backgroundColor:
								gender === "male"
									? colors.male.bg
									: gender === "female"
										? colors.female.bg
										: "white",
							borderRadius: 12,
							padding: "12px 16px",
							gap: 12,
							transition: "all 0.2s",
						}}
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill={
								gender === "male"
									? colors.male.icon
									: gender === "female"
										? colors.female.icon
										: "#7B5EA7"
							}
						>
							<path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" />
						</svg>
						<input
							type="text"
							placeholder="Дата рождения"
							value={birthdate}
							onChange={(e) => setBirthdate(e.target.value)}
							style={{
								flex: 1,
								border: "none",
								backgroundColor: "transparent",
								fontSize: 16,
								color: "#1A1A1A",
								outline: "none",
							}}
						/>
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							backgroundColor:
								gender === "male"
									? colors.male.bg
									: gender === "female"
										? colors.female.bg
										: "white",
							borderRadius: 12,
							padding: "12px 16px",
							gap: 12,
							transition: "all 0.2s",
						}}
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill={
								gender === "male"
									? colors.male.icon
									: gender === "female"
										? colors.female.icon
										: "#7B5EA7"
							}
						>
							<path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
						</svg>
						<span
							style={{
								flex: 1,
								fontSize: 16,
								color: email ? "#1A1A1A" : "#E53935",
								wordBreak: "break-all",
							}}
						>
							{email === null ? "…" : email || "почта не привязана"}
						</span>
						{/* Менять почту можно только с подтверждением — экран /email */}
						<button
							type="button"
							onClick={() => navigate("/email")}
							style={{
								border: "none",
								background: "none",
								color: "#7B5EA7",
								fontSize: 13,
								fontWeight: 600,
								cursor: "pointer",
								textDecoration: "underline",
								whiteSpace: "nowrap",
								padding: 0,
							}}
						>
							{email ? "сменить" : "привязать"}
						</button>
					</div>
				</div>

				<div style={{ flex: 1, minHeight: 24 }} />

				<button
					onClick={handleContinue}
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
						transition: "all 0.2s",
					}}
				>
					Заполнить анкету
				</button>

				<div style={{ height: 24 }} />
			</div>
		</div>
	);
}

// Защита авторизованных экранов: без токена — обратно на вход
function RouteFallback() {
	return (
		<div
			style={{
				minHeight: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "#1A1A23",
				color: "#fff",
				fontFamily: "Inter, system-ui, sans-serif",
				fontSize: 15,
			}}
		>
			Загрузка…
		</div>
	);
}

function RequireAuth() {
	const location = useLocation();
	if (!localStorage.getItem("token")) {
		return <Navigate to="/" replace />;
	}
	// PIN — обязательный шаг входа. Раньше проверка жила только на «/», и
	// зарегистрированный, но не задавший PIN пользователь мог открыть /menu
	// напрямую по URL. Экран установки PIN при этом остаётся доступным.
	const me = JSON.parse(localStorage.getItem("user") || "{}");
	if (me.hasPin === false && location.pathname !== "/set-pin") {
		return <Navigate to="/set-pin" replace />;
	}
	return <Outlet />;
}

// Первый запуск: показываем онбординг, дальше — вход или уже готовый аккаунт
function RootGate() {
	// Флаг живёт в state: «Пропустить» пишет localStorage, а navigate("/")
	// в тот же адрес RootGate не перерисовывает, и форма входа не появлялась
	// до ручной перезагрузки.
	const [onboarded, setOnboarded] = useState(() => isOnboardingDone());
	if (!onboarded) {
		return <OnboardingScreen onFinish={() => setOnboarded(true)} />;
	}
	if (localStorage.getItem("token")) {
		const me = JSON.parse(localStorage.getItem("user") || "{}");
		// PIN обязателен: если после регистрации он не был доведен — возвращаем
		if (me.hasPin === false) {
			return <Navigate to="/set-pin" replace />;
		}
		return <Navigate to="/menu" replace />;
	}
	return <LoginScreen />;
}

function App() {
	const [gender, setGender] = useState("male");

	return (
		<GenderContext.Provider value={{ gender, setGender }}>
			<BrowserRouter>
				<Suspense fallback={<RouteFallback />}>
					<Routes>
						<Route path="/" element={<RootGate />} />
						{/* /login — привычная ссылка из рассылок и старых закладок: экран входа живёт на "/" */}
						<Route path="/login" element={<RootGate />} />
						<Route path="/onboarding" element={<OnboardingScreen />} />
						<Route path="/register" element={<RegisterScreen />} />
						<Route path="/forgot-password" element={<ForgotPasswordScreen />} />
						<Route path="/auth/yandex/callback" element={<YandexCallback />} />

						{/* Экраны, требующие входа */}
						<Route element={<RequireAuth />}>
							<Route path="/set-pin" element={<SetPinScreen />} />
							<Route path="/email" element={<EmailScreen />} />
							<Route path="/profile" element={<ProfileScreen />} />
							<Route path="/questions" element={<QuestionScreen />} />
							<Route path="/menu" element={<MainMenuScreen />} />
							<Route path="/swipe" element={<SwipeScreen />} />
							<Route path="/wall" element={<WallScreen />} />
							<Route path="/match" element={<MatchScreen />} />
							<Route path="/likes" element={<LikesScreen />} />
							<Route path="/fans" element={<FansScreen />} />
							<Route path="/notifications" element={<NotificationsScreen />} />
							<Route path="/messages" element={<MessagesScreen />} />
							<Route path="/feed" element={<FeedScreen />} />
							<Route path="/friends" element={<FriendsScreen />} />
							<Route path="/user-profile" element={<UserProfileScreen />} />
							<Route path="/chat/:id" element={<ChatScreen />} />
							<Route path="/settings" element={<SettingsScreen />} />
							<Route path="/subscription" element={<SubscriptionScreen />} />
							<Route path="/blacklist" element={<BlacklistScreen />} />
						</Route>

						{/* Admin Routes */}
						<Route path="/admin/login" element={<AdminLoginScreen />} />
						<Route path="/admin" element={<AdminLayout />}>
							<Route index element={<AdminDashboard />} />
							<Route path="orders" element={<AdminOrdersScreen />} />
							<Route path="orders/:id" element={<AdminOrderDetailScreen />} />
							<Route path="payment" element={<AdminPaymentScreen />} />
							<Route path="users" element={<AdminUsersScreen />} />
							<Route path="users/:id" element={<AdminUserDetailScreen />} />
							<Route path="support" element={<AdminSupportScreen />} />
							<Route path="chat/:id" element={<AdminChatScreen />} />
							<Route path="complaints" element={<AdminComplaintsScreen />} />
							<Route path="profile" element={<AdminProfileScreen />} />
							<Route path="blacklist" element={<AdminBlacklistScreen />} />
							<Route path="moderation" element={<AdminModerationScreen />} />
							<Route path="logs" element={<AdminLogsScreen />} />
							<Route path="settings" element={<AdminSettingsScreen />} />
						</Route>

						{/* Неизвестный адрес вместо пустого экрана — обратно на вход */}
						<Route path="*" element={<Navigate to="/" replace />} />
					</Routes>
				</Suspense>
			</BrowserRouter>
		</GenderContext.Provider>
	);
}

export default App;
