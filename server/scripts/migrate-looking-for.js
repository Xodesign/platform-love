import Database from "better-sqlite3";

const db = new Database("./database.sqlite");

const result = db
	.prepare(
		`UPDATE search_settings
     SET looking_for = (SELECT looking_for FROM users WHERE users.id = search_settings.user_id)
     WHERE EXISTS (SELECT 1 FROM users WHERE users.id = search_settings.user_id AND looking_for IS NOT NULL)
       AND (looking_for = 'female' OR looking_for IS NULL)`,
	)
	.run();

console.log("Updated rows:", result.changes);

const rows = db
	.prepare(
		`SELECT ss.user_id, ss.looking_for AS settings_lf, u.looking_for AS profile_lf
     FROM search_settings ss
     JOIN users u ON ss.user_id = u.id`,
	)
	.all();

for (const r of rows) {
	const id = r.user_id.slice(0, 8);
	console.log(
		"user=" + id + " settings=" + r.settings_lf + " profile=" + r.profile_lf,
	);
}

db.close();
