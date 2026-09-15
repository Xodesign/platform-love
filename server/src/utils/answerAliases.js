// Маппинг алиасов для ответов анкеты.
// Используется в /api/filters/candidates для нормализации совместимости:
// разные анкеты могут использовать разные значения для одного и того же
// ответа (например, "athletic" vs "athletic_build"), и без нормализации
// compatibility всегда будет 0.

const ALIASES = {
	// bodyType
	bodyType: {
		skinny: "slim",
		slim: "slim",
		normal: "normal",
		average: "normal",
		athletic: "athletic",
		athletic_build: "athletic",
		muscular: "muscular",
		dense: "dense",
		heavyset: "dense",
		full: "full",
		overweight: "full",
	},
	// health
	health: {
		excellent: "excellent",
		good: "good",
		normal: "average",
		average: "average",
		problems: "average",
		disabled: "fair",
		fair: "fair",
		poor: "fair",
	},
	// smoking
	smoking: {
		never: "no",
		no: "no",
		rarely: "rarely",
		quitting: "rarely",
		sometimes: "sometimes",
		regularly: "yes",
		yes: "yes",
	},
	// alcohol
	alcohol: {
		never: "no",
		no: "no",
		rarely: "rarely",
		occasionally: "rarely",
		sometimes: "sometimes",
		often: "often",
		regularly: "often",
		no_answer: "no",
	},
	// children
	children: {
		none: "no",
		no: "no",
		no_want: "no_want",
		has_children: "yes_together",
		raised: "yes_together",
		yes_together: "yes_together",
		yes_separate: "yes_separate",
	},
	// education
	education: {
		incomplete_secondary: "incomplete_secondary",
		secondary: "secondary",
		specialized: "specialized",
		vocational: "specialized",
		incomplete_higher: "incomplete_higher",
		higher: "higher",
		two_higher: "higher",
		degree: "higher",
	},
	// training (тренировки в App.jsx vs образование в UserProfileScreen)
	training: {
		// App.jsx values (тренировки)
		often: "often",
		rarely: "rarely",
		sometimes: "sometimes",
		no_time: "never",
		// UserProfileScreen values (образование)
		secondary: "never",
		vocational: "never",
		incomplete_higher: "sometimes",
		bachelor: "often",
		specialist: "often",
		magistracy: "often",
		aspirantura: "often",
	},
	// citizenship
	citizenship: {
		russia: "russia",
		russian: "russia",
		cis: "cis",
		ukrainian: "cis",
		belarusian: "cis",
		kazakh: "cis",
		ussr: "ussr",
		foreigner: "foreigner",
		other: "other",
	},
	// covid
	covid: {
		vaccinated: "once",
		once: "once",
		had_covid: "once",
		several: "several",
		not: "not",
		no: "not",
	},
	// pets (нормализуем разные варианты)
	pets: {
		cat: "cat",
		dog: "dog",
		reptile: "reptile",
		birds: "birds",
		bird: "birds",
		fish: "fish",
		hamster: "hamster",
		guinea_pig: "hamster",
		rabbit: "hamster",
		turtle: "hamster",
		other: "other",
		allergy: "allergy",
		none: "none",
	},
	// food/drinks — у каждого экрана свой набор, нормализуем по семантике
	// для совместимости важно лишь "есть ли общее значение"
	food: {
		seafood: "seafood",
		meat: "meat",
		poultry: "meat",
		vegetables: "vegetables",
		fruits: "fruits",
		dairy: "dairy",
		cereals: "cereals",
		grains: "cereals",
		raw: "vegetables",
		vegetarian: "vegetarian",
		vegan: "vegan",
		pescatarian: "pescatarian",
		halal: "halal",
		kosher: "kosher",
		all: "all",
		fish: "seafood",
		chicken: "meat",
		bakery: "bakery",
		sweets: "sweets",
		fast_food: "fast_food",
		oriental: "oriental",
		italian: "italian",
		japanese: "japanese",
		no_preference: "all",
	},
	drinks: {
		champagne: "champagne",
		wine_white: "wine_white",
		white_wine: "wine_white",
		wine_red: "wine_red",
		red_wine: "wine_red",
		wine_rose: "wine_rose",
		sparkling: "sparkling",
		liquor: "liquor",
		liquors: "liquor",
		vodka: "vodka",
		cognac: "cognac",
		whiskey: "whiskey",
		whisky: "whiskey",
		absinthe: "absinthe",
		rum: "rum",
		tequila: "tequila",
		brandy: "brandy",
		armagnac: "armagnac",
		calvados: "calvados",
		sake: "sake",
		vermouth: "vermouth",
		martini: "martini",
		moonshine: "moonshine",
		beer: "beer",
		cocktails: "cocktails",
		cocktail: "cocktails",
		sober: "sober",
		no_alcohol: "sober",
		tea: "tea",
		coffee: "coffee",
		juice: "juice",
		water: "water",
		soda: "soda",
	},
};

// Нормализует одно значение: возвращает каноничное имя
function normalizeValue(questionKey, rawValue) {
	const map = ALIASES[questionKey];
	if (!map) return rawValue;
	return map[rawValue] ?? rawValue;
}

// Нормализует массив (для мультиселектов): возвращает Set нормализованных значений
function normalizeSet(questionKey, rawValues) {
	const map = ALIASES[questionKey];
	const out = new Set();
	for (const v of rawValues) {
		out.add(map ? (map[v] ?? v) : v);
	}
	return out;
}

// Проверяет совпадение для одиночных значений
function singleMatches(questionKey, myValue, otherValue) {
	if (myValue == null || otherValue == null) return false;
	return (
		normalizeValue(questionKey, myValue) ===
		normalizeValue(questionKey, otherValue)
	);
}

// Проверяет совпадение для мультиселектов: есть хотя бы одно общее значение
function setMatches(questionKey, myValues, otherValues) {
	if (!Array.isArray(myValues) || !Array.isArray(otherValues)) return false;
	const mine = normalizeSet(questionKey, myValues);
	const theirs = normalizeSet(questionKey, otherValues);
	for (const v of mine) {
		if (theirs.has(v)) return true;
	}
	return false;
}

// Канонические вопросы с мультиселектом
const MULTI_SELECT_QUESTIONS = new Set(["food", "drinks", "pets", "flowers"]);

// Проверяет совпадение для одного вопроса
export function answersMatch(questionKey, myValue, otherValue) {
	if (MULTI_SELECT_QUESTIONS.has(questionKey)) {
		return setMatches(questionKey, myValue, otherValue);
	}
	return singleMatches(questionKey, myValue, otherValue);
}

export default { answersMatch, normalizeValue };
