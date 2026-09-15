import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";

const initialProfiles = [
	{
		id: 1,
		name: "Сергей Козлов",
		age: 28,
		photos: ["👤"],
		sociotype: "Джек Лондон",
		bio: "Ищу серьёзные отношения...",
		submittedAt: "26.06.2026 14:30",
		hasInappropriate: false,
		hasInappropriatePhotos: false,
	},
	{
		id: 2,
		name: "Мария Петрова",
		age: 25,
		photos: ["👤"],
		sociotype: "Есенин",
		bio: "Люблю природу и путешествия...",
		submittedAt: "26.06.2026 12:15",
		hasInappropriate: false,
		hasInappropriatePhotos: false,
	},
	{
		id: 3,
		name: "Алексей Волков",
		age: 32,
		photos: ["👤", "👤"],
		sociotype: "Наполеон",
		bio: "Амбициозный и целеустремлённый...",
		submittedAt: "26.06.2026 10:00",
		hasInappropriate: true,
		hasInappropriatePhotos: false,
		inappropriateReason: "Упоминание запрещённых тем",
	},
	{
		id: 4,
		name: "Елена Смирнова",
		age: 27,
		photos: ["👤"],
		sociotype: "Дюма",
		bio: "Творческая натура...",
		submittedAt: "25.06.2026 18:45",
		hasInappropriate: false,
		hasInappropriatePhotos: true,
		inappropriateReason: "Подозрительное фото",
	},
];

export default function AdminModerationScreen() {
	const navigate = useNavigate();
	const [profiles, setProfiles] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [filter, setFilter] = useState("all");

	const load = useCallback(async () => {
		try {
			setProfiles(await api.adminModeration());
		} catch {
			setProfiles(initialProfiles);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const filteredProfiles = profiles.filter((profile) => {
		const matchesSearch =
			profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			profile.sociotype.toLowerCase().includes(searchQuery.toLowerCase());

		if (filter === "pending")
			return !profile.hasInappropriate && !profile.hasInappropriatePhotos;
		if (filter === "flagged")
			return profile.hasInappropriate || profile.hasInappropriatePhotos;
		return true;
	});

	const approveProfile = async (id) => {
		await api.adminModerate(id, true);
		load();
	};

	const rejectProfile = async (id) => {
		if (window.confirm("Отклонить анкету? Пользователь будет уведомлён.")) {
			await api.adminModerate(id, false);
			load();
		}
	};

	const pendingCount = profiles.filter(
		(p) => !p.hasInappropriate && !p.hasInappropriatePhotos,
	).length;
	const flaggedCount = profiles.filter(
		(p) => p.hasInappropriate || p.hasInappropriatePhotos,
	).length;

	return (
		<div>
			{/* Header */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 24,
					flexWrap: "wrap",
					gap: 16,
				}}
			>
				<h3
					style={{ fontSize: 20, fontWeight: 600, color: "#1A1A1A", margin: 0 }}
				>
					Модерация анкет
				</h3>
			</div>

			{/* Stats */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
					gap: 12,
					marginBottom: 24,
				}}
			>
				<div
					style={{
						backgroundColor: "#FFF9E6",
						borderRadius: 12,
						padding: 16,
						textAlign: "center",
					}}
				>
					<div style={{ fontSize: 32, fontWeight: 700, color: "#F5C542" }}>
						{pendingCount}
					</div>
					<div style={{ fontSize: 13, color: "#8E8E8E" }}>На проверке</div>
				</div>
				<div
					style={{
						backgroundColor: "#FFEBEB",
						borderRadius: 12,
						padding: 16,
						textAlign: "center",
					}}
				>
					<div style={{ fontSize: 32, fontWeight: 700, color: "#FF6B6B" }}>
						{flaggedCount}
					</div>
					<div style={{ fontSize: 13, color: "#8E8E8E" }}>С флагами</div>
				</div>
				<div
					style={{
						backgroundColor: "#E8F5E9",
						borderRadius: 12,
						padding: 16,
						textAlign: "center",
					}}
				>
					<div style={{ fontSize: 32, fontWeight: 700, color: "#4CAF50" }}>
						{profiles.length}
					</div>
					<div style={{ fontSize: 13, color: "#8E8E8E" }}>Всего</div>
				</div>
			</div>

			{/* Filters */}
			<div
				style={{
					backgroundColor: "white",
					borderRadius: 12,
					padding: 16,
					marginBottom: 16,
					boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
				}}
			>
				<div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
					<div style={{ position: "relative", flex: 1, minWidth: 200 }}>
						<input
							type="text"
							placeholder="Поиск по имени или социотипу..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							style={{
								width: "100%",
								padding: "12px 16px 12px 44px",
								borderRadius: 10,
								border: "1px solid #E0E0E0",
								fontSize: 14,
								outline: "none",
								boxSizing: "border-box",
							}}
						/>
						<span
							style={{
								position: "absolute",
								left: 16,
								top: "50%",
								transform: "translateY(-50%)",
								fontSize: 18,
							}}
						>
							🔍
						</span>
					</div>
					<select
						value={filter}
						onChange={(e) => setFilter(e.target.value)}
						style={{
							padding: "12px 16px",
							borderRadius: 10,
							border: "1px solid #E0E0E0",
							fontSize: 14,
							outline: "none",
							backgroundColor: "white",
							minWidth: 150,
						}}
					>
						<option value="all">Все</option>
						<option value="pending">На проверке</option>
						<option value="flagged">С флагами</option>
					</select>
				</div>
			</div>

			{/* Profiles List */}
			<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
				{filteredProfiles.map((profile) => (
					<div
						key={profile.id}
						style={{
							backgroundColor: "white",
							borderRadius: 16,
							padding: 20,
							boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
							borderLeft:
								profile.hasInappropriate || profile.hasInappropriatePhotos
									? "4px solid #FF6B6B"
									: "4px solid #F5C542",
						}}
					>
						<div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
							{/* Avatar */}
							<div
								style={{
									width: 80,
									height: 80,
									borderRadius: 12,
									backgroundColor: "#F3E8FF",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontSize: 36,
									flexShrink: 0,
								}}
							>
								{profile.photos[0]}
							</div>

							{/* Info */}
							<div style={{ flex: 1, minWidth: 200 }}>
								<div
									style={{
										display: "flex",
										alignItems: "center",
										gap: 12,
										marginBottom: 8,
									}}
								>
									<h4
										style={{
											fontSize: 18,
											fontWeight: 600,
											color: "#1A1A1A",
											margin: 0,
										}}
									>
										{profile.name}, {profile.age}
									</h4>
									<span
										style={{
											padding: "4px 10px",
											borderRadius: 8,
											backgroundColor: "#F3E8FF",
											color: "#7B5EA7",
											fontSize: 12,
											fontWeight: 500,
										}}
									>
										{profile.sociotype}
									</span>
									{(profile.hasInappropriate ||
										profile.hasInappropriatePhotos) && (
										<span
											style={{
												padding: "4px 10px",
												borderRadius: 8,
												backgroundColor: "#FFEBEB",
												color: "#FF6B6B",
												fontSize: 12,
												fontWeight: 500,
											}}
										>
											⚠️ Флаг
										</span>
									)}
								</div>
								<p
									style={{
										fontSize: 14,
										color: "#8E8E8E",
										margin: "0 0 8px",
										lineHeight: 1.5,
									}}
								>
									{profile.bio}
								</p>
								<div style={{ fontSize: 12, color: "#8E8E8E" }}>
									Отправлено: {profile.submittedAt}
								</div>

								{/* Inappropriate reason */}
								{(profile.hasInappropriate ||
									profile.hasInappropriatePhotos) && (
									<div
										style={{
											marginTop: 12,
											padding: 12,
											backgroundColor: "#FFEBEB",
											borderRadius: 8,
										}}
									>
										<span
											style={{
												fontSize: 12,
												color: "#FF6B6B",
												fontWeight: 500,
											}}
										>
											⚠️ Причина флага: {profile.inappropriateReason}
										</span>
									</div>
								)}

								{/* Photos preview */}
								{profile.photos.length > 1 && (
									<div style={{ display: "flex", gap: 8, marginTop: 12 }}>
										{profile.photos.map((photo, i) => (
											<div
												key={i}
												style={{
													width: 60,
													height: 60,
													borderRadius: 8,
													backgroundColor: "#F5F5F7",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													fontSize: 24,
												}}
											>
												{photo}
											</div>
										))}
									</div>
								)}
							</div>

							{/* Actions */}
							<div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
								<button
									onClick={() => navigate(`/admin/users/${profile.id}`)}
									style={{
										padding: "8px 16px",
										borderRadius: 8,
										backgroundColor: "#F3E8FF",
										border: "none",
										color: "#7B5EA7",
										fontSize: 13,
										cursor: "pointer",
									}}
								>
									Открыть профиль
								</button>
								<button
									onClick={() => approveProfile(profile.id)}
									style={{
										padding: "8px 16px",
										borderRadius: 8,
										backgroundColor: "#E8F5E9",
										border: "none",
										color: "#4CAF50",
										fontSize: 13,
										fontWeight: 500,
										cursor: "pointer",
									}}
								>
									✓ Одобрить
								</button>
								<button
									onClick={() => rejectProfile(profile.id)}
									style={{
										padding: "8px 16px",
										borderRadius: 8,
										backgroundColor: "#FFEBEB",
										border: "none",
										color: "#FF6B6B",
										fontSize: 13,
										fontWeight: 500,
										cursor: "pointer",
									}}
								>
									✗ Отклонить
								</button>
							</div>
						</div>
					</div>
				))}

				{filteredProfiles.length === 0 && (
					<div
						style={{
							backgroundColor: "white",
							borderRadius: 12,
							padding: 40,
							textAlign: "center",
							color: "#8E8E8E",
						}}
					>
						Анкеты не найдены
					</div>
				)}
			</div>
		</div>
	);
}
