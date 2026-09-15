import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";

const initialComplaints = [
	{
		id: 1,
		reportedUser: "Иван Петров",
		complainant: "Анна Иванова",
		reason: "Нецензурная лексика",
		date: "25.06.2026",
		status: "new",
	},
	{
		id: 2,
		reportedUser: "Мария Смирнова",
		complainant: "Сергей Козлов",
		reason: "Спам",
		date: "24.06.2026",
		status: "resolved",
	},
];

const statusLabels = {
	new: { label: "Новая", color: "#FF6B6B", bg: "#FFEBEB" },
	resolved: { label: "Рассмотрена", color: "#4CAF50", bg: "#E8F5E9" },
};

export default function AdminComplaintsScreen() {
	const navigate = useNavigate();
	const [complaints, setComplaints] = useState([]);

	const load = useCallback(async () => {
		try {
			setComplaints(await api.adminComplaints());
		} catch {
			setComplaints(initialComplaints);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const deleteComplaint = async (id) => {
		await api.adminUpdateComplaint(id, "rejected");
		load();
	};

	const resolveComplaint = async (id) => {
		await api.adminUpdateComplaint(id, "resolved");
		load();
	};

	return (
		<div>
			<h3
				style={{
					fontSize: 20,
					fontWeight: 600,
					color: "#1A1A1A",
					margin: "0 0 24px",
				}}
			>
				Жалобы пользователей
			</h3>

			{/* Desktop Table */}
			<div
				className="desktop-table"
				style={{
					backgroundColor: "white",
					borderRadius: 12,
					overflow: "hidden",
					boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
				}}
			>
				<table style={{ width: "100%", borderCollapse: "collapse" }}>
					<thead>
						<tr style={{ backgroundColor: "#F5F5F7" }}>
							<th style={thStyle}>№</th>
							<th style={thStyle}>На кого</th>
							<th style={thStyle}>От кого</th>
							<th style={thStyle}>Причина</th>
							<th style={thStyle}>Дата</th>
							<th style={thStyle}>Статус</th>
							<th style={thStyle}>Действия</th>
						</tr>
					</thead>
					<tbody>
						{complaints.map((complaint) => (
							<tr
								key={complaint.id}
								style={{ borderBottom: "1px solid #F0F0F0" }}
							>
								<td style={tdStyle}>#{complaint.id}</td>
								<td style={tdStyle}>{complaint.reportedUser}</td>
								<td style={tdStyle}>{complaint.complainant}</td>
								<td style={tdStyle}>{complaint.reason}</td>
								<td style={tdStyle}>{complaint.date}</td>
								<td style={tdStyle}>
									<span
										style={{
											padding: "4px 10px",
											borderRadius: 12,
											fontSize: 12,
											fontWeight: 500,
											backgroundColor: statusLabels[complaint.status].bg,
											color: statusLabels[complaint.status].color,
										}}
									>
										{statusLabels[complaint.status].label}
									</span>
								</td>
								<td style={tdStyle}>
									<div style={{ display: "flex", gap: 8 }}>
										<button
											onClick={() => navigate(`/admin/users/1`)}
											style={actionBtnStyle("#5B8DB8")}
										>
											Профиль
										</button>
										<button
											onClick={() => navigate(`/admin/chat/1`)}
											style={actionBtnStyle("#7B5EA7")}
										>
											Написать
										</button>
										<button
											onClick={() => resolveComplaint(complaint.id)}
											style={actionBtnStyle("#4CAF50")}
										>
											Заблокировать
										</button>
										<button
											onClick={() => deleteComplaint(complaint.id)}
											style={actionBtnStyle("#FF6B6B")}
										>
											Удалить
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Mobile Cards */}
			<div className="mobile-cards" style={{ display: "none", gap: 12 }}>
				{complaints.map((complaint) => (
					<div
						key={complaint.id}
						style={{
							backgroundColor: "white",
							borderRadius: 12,
							padding: 16,
							boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
						}}
					>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								marginBottom: 12,
							}}
						>
							<span style={{ fontWeight: 600, color: "#1A1A1A" }}>
								#{complaint.id}
							</span>
							<span
								style={{
									padding: "4px 10px",
									borderRadius: 12,
									fontSize: 12,
									backgroundColor: statusLabels[complaint.status].bg,
									color: statusLabels[complaint.status].color,
								}}
							>
								{statusLabels[complaint.status].label}
							</span>
						</div>
						<div style={{ fontSize: 14, color: "#1A1A1A", marginBottom: 4 }}>
							<strong>На кого:</strong> {complaint.reportedUser}
						</div>
						<div style={{ fontSize: 14, color: "#1A1A1A", marginBottom: 4 }}>
							<strong>От кого:</strong> {complaint.complainant}
						</div>
						<div style={{ fontSize: 14, color: "#1A1A1A", marginBottom: 4 }}>
							<strong>Причина:</strong> {complaint.reason}
						</div>
						<div style={{ fontSize: 12, color: "#8E8E8E", marginBottom: 12 }}>
							{complaint.date}
						</div>
						<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
							<button
								onClick={() => navigate(`/admin/users/1`)}
								style={actionBtnStyle("#5B8DB8")}
							>
								Профиль
							</button>
							<button
								onClick={() => navigate(`/admin/chat/1`)}
								style={actionBtnStyle("#7B5EA7")}
							>
								Написать
							</button>
							<button
								onClick={() => resolveComplaint(complaint.id)}
								style={actionBtnStyle("#4CAF50")}
							>
								Заблокировать
							</button>
							<button
								onClick={() => deleteComplaint(complaint.id)}
								style={actionBtnStyle("#FF6B6B")}
							>
								Удалить
							</button>
						</div>
					</div>
				))}
			</div>

			<style>
				{`
          @media (max-width: 768px) {
            .desktop-table { display: none !important; }
            .mobile-cards { display: flex !important; flex-direction: column !important; }
          }
        `}
			</style>
		</div>
	);
}

const thStyle = {
	padding: "14px 16px",
	textAlign: "left",
	fontSize: 13,
	fontWeight: 600,
	color: "#8E8E8E",
};

const tdStyle = {
	padding: "14px 16px",
	fontSize: 14,
	color: "#1A1A1A",
};

const actionBtnStyle = (color) => ({
	padding: "6px 12px",
	borderRadius: 6,
	backgroundColor: `${color}15`,
	border: `1px solid ${color}`,
	color: color,
	fontSize: 12,
	cursor: "pointer",
});
