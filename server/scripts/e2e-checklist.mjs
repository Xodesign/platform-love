#!/usr/bin/env node
/**
 * E2E-проверка чек-листа пользователя против запущенного бэкенда.
 *
 *   node scripts/e2e-checklist.mjs [base_url]
 *
 * Покрывает: регистрация → PIN → загрузка фото → свайпы и взаимный мэтч →
 * чат в обе стороны без перезагрузки экрана → негативные кейсы загрузки.
 *
 * Тестовые аккаунты создаются с префиксом e2e и удаляются в конце.
 * Логины/пароли существующих пользователей не трогаются.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const BASE = (process.argv[2] || "http://127.0.0.1:3001").replace(/\/$/, "");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH =
  process.env.DATABASE_PATH || path.join(__dirname, "..", "database.sqlite");

let pass = 0;
let fail = 0;
const ok = (name, extra = "") => {
  pass++;
  console.log(`\x1b[32m✔\x1b[0m ${name}${extra ? " — " + extra : ""}`);
};
const bad = (name, extra = "") => {
  fail++;
  console.log(`\x1b[31m✘\x1b[0m ${name}${extra ? " — " + extra : ""}`);
};
const check = (cond, name, extra = "") =>
  cond ? ok(name, extra) : bad(name, extra);

const suffix = Date.now().toString().slice(-7);

// Секретов в репозитории нет: пароли тестовых аккаунтов генерируются на ходу
// и не выводятся в лог.
const randomSecret = () => crypto.randomUUID().replace(/-/g, "").slice(0, 14);

async function call(method, url, { token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers,
    body: form ? form : body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* не JSON — вернём текст ниже */
  }
  return {
    status: res.status,
    json,
    text,
    type: res.headers.get("content-type"),
  };
}

/** Зарегистрировать пользователя, задать PIN, вернуть { token, id, login } */
async function makeUser(name, login, email, patch = {}) {
  const password = randomSecret();
  let token;
  const reg = await call("POST", "/api/auth/register", {
    body: { name, login, email, password },
  });
  if (reg.status !== 201 && reg.status !== 200)
    throw new Error(`register ${login}: ${reg.status} ${reg.text}`);
  token = reg.json.token;
  const pin = await call("POST", "/api/auth/set-pin", {
    token,
    body: { pin: "4321" },
  });
  if (pin.status !== 200)
    throw new Error(`set-pin ${login}: ${pin.status} ${pin.text}`);
  // как и клиент в api.setPin(): берём токен с подтверждённым PIN
  if (pin.json.token) token = pin.json.token;
  const me = await call("GET", "/api/auth/me", { token });
  const id = me.json.id;
  if (Object.keys(patch).length) {
    const up = await call("PUT", `/api/users/${id}`, { token, body: patch });
    if (up.status !== 200)
      throw new Error(`patch ${login}: ${up.status} ${up.text}`);
  }
  return { token, id, login, email, password, name };
}

function pngBase64() {
  // 1×1 PNG
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
}

async function main() {
  console.log(`\n\x1b[1mE2E чек-лист против ${BASE}\x1b[0m\n`);

  // ------------------------------------------------ 1. Регистрация
  console.log("\x1b[1m— 1. Регистрация и авторизация —\x1b[0m");
  const noEmail = await call("POST", "/api/auth/register", {
    body: {
      name: "Без почты",
      login: `e2enoemail${suffix}`,
      password: randomSecret(),
    },
  });
  check(
    noEmail.status === 400,
    "регистрация без email отклонена",
    `${noEmail.status}`,
  );

  const boy = await makeUser(
    "Тест Парень",
    `e2eboy${suffix}`,
    `e2eboy${suffix}@example.invalid`,
    {
      gender: "male",
      looking_for: "female",
      age: 27,
      bio: "анкета e2e",
      location: "Москва",
    },
  );
  const girl = await makeUser(
    "Тест Девушка",
    `e2egirl${suffix}`,
    `e2egirl${suffix}@example.invalid`,
    {
      gender: "female",
      looking_for: "male",
      age: 25,
      bio: "анкета e2e",
      location: "Москва",
    },
  );
  ok(
    "созданы два аккаунта с анкетой (PIN установлен)",
    `${boy.login} / ${girl.login}`,
  );

  const dupLogin = await call("POST", "/api/auth/register", {
    body: {
      name: "Дубль",
      login: boy.login,
      email: `e2edup${suffix}@example.invalid`,
      password: randomSecret(),
    },
  });
  check(
    dupLogin.status === 409 || dupLogin.status === 400,
    "повторный логин отклонён",
    `${dupLogin.status} ${dupLogin.text?.slice(0, 40)}`,
  );

  const dupEmail = await call("POST", "/api/auth/register", {
    body: {
      name: "Дубль почта",
      login: `e2edupmail${suffix}`,
      email: boy.email,
      password: randomSecret(),
    },
  });
  check(
    dupEmail.status === 409 || dupEmail.status === 400,
    "повторный email отклонён",
    `${dupEmail.status} ${dupEmail.text?.slice(0, 40)}`,
  );

  const login = await call("POST", "/api/auth/login", {
    body: { login: boy.login, password: boy.password },
  });
  check(
    login.status === 200 && !!login.json.token,
    "вход по логину+паролю выдаёт токен",
  );
  check(
    login.json?.user?.hasPin === true,
    "сервер знает, что PIN задан",
    `hasPin=${login.json?.user?.hasPin}`,
  );

  const pwToken = login.json.token;
  const gate = await call("GET", "/api/matches", { token: pwToken });
  check(
    gate.status === 428,
    "защищённые данные по парольному токену → 428",
    `${gate.status}`,
  );
  const verify = await call("POST", "/api/auth/verify-pin", {
    token: pwToken,
    body: { pin: "4321" },
  });
  check(
    verify.status === 200 && !!verify.json.token,
    "verify-pin выдаёт токен с доступом",
  );
  const pwTokenBad = await call("POST", "/api/auth/verify-pin", {
    token: pwToken,
    body: { pin: "1111" },
  });
  check(
    pwTokenBad.status === 401,
    "неверный PIN отклонён",
    `${pwTokenBad.status}`,
  );

  // ------------------------------------------------ 2. Загрузка фото
  console.log("\n\x1b[1m— 2. Загрузка фото профиля —\x1b[0m");
  const fd = new FormData();
  fd.append(
    "photo",
    new Blob([pngBase64()], { type: "image/png" }),
    "e2e-avatar.png",
  );
  const up = await call("POST", "/api/upload/photo", {
    token: boy.token,
    form: fd,
  });
  check(
    up.status === 200 && /^\/uploads\//.test(up.json?.url || ""),
    "фото загрузилось",
    up.json?.url,
  );

  const served = await fetch(`${BASE}${up.json.url}`);
  check(
    served.status === 200 &&
      /^image\//.test(served.headers.get("content-type") || ""),
    "файл отдаётся как картинка",
    served.headers.get("content-type"),
  );

  const profile = await call("GET", `/api/users/${boy.id}`, {
    token: boy.token,
  });
  const photos = profile.json?.user?.photos ?? profile.json?.photos ?? [];
  check(
    Array.isArray(photos) && photos.includes(up.json.url),
    "фото попало в анкету пользователя",
    JSON.stringify(photos),
  );

  const noAuth = await call("POST", "/api/upload/photo", {
    form: (() => {
      const f = new FormData();
      f.append(
        "photo",
        new Blob([pngBase64()], { type: "image/png" }),
        "x.png",
      );
      return f;
    })(),
  });
  check(
    noAuth.status === 401,
    "загрузка без токена отклонена",
    `${noAuth.status}`,
  );

  const pwFd = new FormData();
  pwFd.append("photo", new Blob([pngBase64()], { type: "image/png" }), "x.png");
  const pwUp = await call("POST", "/api/upload/photo", {
    token: pwToken,
    form: pwFd,
  });
  check(
    pwUp.status === 428,
    "загрузка фото требует PIN (как и остальные данные)",
    `${pwUp.status}`,
  );

  const evilFd = new FormData();
  evilFd.append(
    "photo",
    new Blob([pngBase64()], { type: "image/png" }),
    "../../../escape-e2e.png",
  );
  const evil = await call("POST", "/api/upload/photo", {
    token: boy.token,
    form: evilFd,
  });
  const escaped =
    evil.status === 200 && !/^\/uploads\/[^/]*$/.test(evil.json.url || "");
  check(
    !escaped,
    "имя файла с ../ не даёт выйти за uploads",
    evil.json?.url ?? `${evil.status}`,
  );

  const htmlFd = new FormData();
  htmlFd.append(
    "photo",
    new Blob(["<script>document.write('x')</script>"], { type: "text/html" }),
    "evil-e2e.html",
  );
  const htmlUp = await call("POST", "/api/upload/photo", {
    token: boy.token,
    form: htmlFd,
  });
  check(
    htmlUp.status === 400 || htmlUp.status === 415,
    "не-картинка в «photo» отклонена",
    `${htmlUp.status} ${htmlUp.text?.slice(0, 60)}`,
  );

  // ------------------------------------------------ 3. Свайпы и мэтч
  console.log("\n\x1b[1m— 3. Свайпы и логика мэтчей —\x1b[0m");
  const cand = await call("GET", "/api/swipes/candidates", {
    token: boy.token,
  });
  const candList = Array.isArray(cand.json)
    ? cand.json
    : (cand.json?.candidates ?? []);
  check(
    cand.status === 200 && candList.some((c) => c.id === girl.id),
    "парень видит девушку в кандидатах",
    `${candList.length} шт`,
  );
  check(
    candList.every((c) => c.gender === "female"),
    "кандидаты только нужного пола",
  );
  check(!candList.some((c) => c.id === boy.id), "сам себя не показывает");

  const first = await call("POST", "/api/swipes", {
    token: girl.token,
    body: { target_user_id: boy.id, direction: "like" },
  });
  check(
    first.status === 201 && first.json.match === null,
    "первый лайк мэтча не даёт",
    `${first.status}`,
  );

  const second = await call("POST", "/api/swipes", {
    token: boy.token,
    body: { target_user_id: girl.id, direction: "like" },
  });
  check(
    second.status === 201 && second.json.match?.id,
    "взаимный лайк создаёт мэтч",
    second.json?.match?.id,
  );
  const matchId = second.json?.match?.id;

  const again = await call("POST", "/api/swipes", {
    token: boy.token,
    body: { target_user_id: girl.id, direction: "dislike" },
  });
  check(
    again.status === 400,
    "повторный свайп того же профиля отклонён",
    `${again.status}`,
  );

  const badDir = await call("POST", "/api/swipes", {
    token: boy.token,
    body: { target_user_id: girl.id, direction: "super" },
  });
  check(
    badDir.status === 400,
    "неизвестное направление отклонено",
    `${badDir.status}`,
  );

  const mL = await call("GET", "/api/matches", { token: boy.token });
  const gL = await call("GET", "/api/matches", { token: girl.token });
  check(
    (mL.json || []).some((m) => m.id === matchId),
    "мэтч виден у парня",
  );
  check(
    (gL.json || []).some((m) => m.id === matchId),
    "мэтч виден у девушки",
  );

  const candAfter = await call("GET", "/api/swipes/candidates", {
    token: boy.token,
  });
  const afterList = Array.isArray(candAfter.json) ? candAfter.json : [];
  check(
    !afterList.some((c) => c.id === girl.id),
    "после свайпа анкета больше не предлагается",
  );

  const otherUserMatch = await call("GET", `/api/matches/${matchId}`, {
    token: girl.token,
  });
  check(
    otherUserMatch.json?.other_user_id === boy.id,
    "у собеседника правильный «другой пользователь»",
    otherUserMatch.json?.other_user_name,
  );

  const outsider = await makeUser(
    "Тест Посторонний",
    `e2eout${suffix}`,
    `e2eout${suffix}@example.invalid`,
  );
  const leak = await call("GET", `/api/matches/${matchId}`, {
    token: outsider.token,
  });
  check(
    leak.status === 404,
    "чужой мэтч недоступен постороннему",
    `${leak.status}`,
  );

  const db = new Database(DB_PATH, { readonly: true });
  const notifBoy = db
    .prepare("SELECT COUNT(*) c FROM notifications WHERE user_id = ?")
    .get(boy.id).c;
  const notifGirl = db
    .prepare("SELECT COUNT(*) c FROM notifications WHERE user_id = ?")
    .get(girl.id).c;
  check(
    notifBoy + notifGirl > 0,
    "о мэтче есть уведомления в БД",
    `boy=${notifBoy} girl=${notifGirl}`,
  );
  db.close();

  // ------------------------------------------------ 4. Чат
  console.log("\n\x1b[1m— 4. Чат —\x1b[0m");
  const sub = await call("POST", "/api/subscriptions", {
    token: boy.token,
    body: { plan: "premium" },
  });
  check(
    sub.status === 200 || sub.status === 201,
    "подписка оформлена (демо-режим)",
    `${sub.status}`,
  );

  const send1 = await call("POST", "/api/messages", {
    token: boy.token,
    body: { match_id: matchId, text: "Привет, это e2e-проверка" },
  });
  check(
    send1.status === 201 && send1.json.text,
    "сообщение сохранено",
    `${send1.status}`,
  );
  check(
    send1.json?.sender_name === "Тест Парень",
    "у сообщения есть имя отправителя",
    send1.json?.sender_name,
  );

  const girlSees = await call("GET", `/api/messages/match/${matchId}`, {
    token: girl.token,
  });
  check(
    Array.isArray(girlSees.json) &&
      girlSees.json.some((m) => m.text === "Привет, это e2e-проверка"),
    "получатель видит сообщение тем же GET (поллинг без перезагрузки экрана)",
  );

  const unread = await call("GET", "/api/messages/unread/count", {
    token: boy.token,
  });
  check(
    unread.status === 200 && typeof unread.json.unread === "number",
    "счётчик непрочитанных работает",
    JSON.stringify(unread.json),
  );

  const send2 = await call("POST", "/api/messages", {
    token: girl.token,
    body: { match_id: matchId, text: "Ответ от девушки" },
  });
  check(send2.status === 201, "ответ отправлен");
  const boySees = await call("GET", `/api/messages/match/${matchId}`, {
    token: boy.token,
  });
  check(
    boySees.json.some((m) => m.text === "Ответ от девушки"),
    "инициатор видит ответ без перезагрузки",
  );
  const ordered = boySees.json.map((m) => m.text);
  check(
    ordered.indexOf("Привет, это e2e-проверка") <
      ordered.indexOf("Ответ от девушки"),
    "порядок сообщений chronological",
  );

  const empty = await call("POST", "/api/messages", {
    token: boy.token,
    body: { match_id: matchId, text: "   " },
  });
  check(
    empty.status === 400,
    "пустое сообщение отклонено",
    `${empty.status} ${empty.text?.slice(0, 50)}`,
  );

  const longText = "а".repeat(5000);
  const long = await call("POST", "/api/messages", {
    token: boy.token,
    body: { match_id: matchId, text: longText },
  });
  check(
    long.status === 201 && long.json.text.length === longText.length,
    "длинное сообщение не обрезается",
    `${long.json?.text?.length} симв.`,
  );

  const outsiderMsg = await call("GET", `/api/messages/match/${matchId}`, {
    token: outsider.token,
  });
  check(
    outsiderMsg.status === 404,
    "чужая переписка недоступна",
    `${outsiderMsg.status}`,
  );

  // ------------------------------------------------ 5. Замечания внешнего аудита
  console.log("\n\x1b[1m— 5. Замечания внешнего аудита —\x1b[0m");

  // 5.1 photos: анкета не должна принимать javascript:, data:, чужие домены и ../
  const junkPhotos = [
    "/uploads/avatar-anna.svg",
    "javascript:alert(1)",
    "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
    "http://evil.example/x.png",
    "../../server/.env",
    { url: "/uploads/obj.png" },
    "https://cdn.example.org/a.png",
  ];
  const putPhotos = await call("PUT", `/api/users/${girl.id}`, {
    token: girl.token,
    body: { photos: junkPhotos },
  });
  const savedProfile = await call("GET", `/api/users/${girl.id}`, {
    token: girl.token,
  });
  const storedPhotos = savedProfile.json?.photos || [];
  check(
    putPhotos.status === 200 &&
      storedPhotos.includes("/uploads/avatar-anna.svg"),
    "корректный путь /uploads сохранился",
    JSON.stringify(storedPhotos),
  );
  check(
    !storedPhotos.some((x) =>
      /javascript:|data:|evil\.example|\.\./i.test(String(x)),
    ),
    "опасные значения из photos вырезаны",
    JSON.stringify(storedPhotos),
  );
  check(
    storedPhotos.every((x) => typeof x === "string"),
    "не-строки в photos не сохраняются",
  );

  // 5.2 Взаимные свайпы одновременно: ровно один мэтч, по одному уведомлению
  const r1 = await makeUser(
    "Тест Гонка1",
    `e2er1${suffix}`,
    `e2er1${suffix}@example.invalid`,
  );
  const r2 = await makeUser(
    "Тест Гонка2",
    `e2er2${suffix}`,
    `e2er2${suffix}@example.invalid`,
  );
  const [ra, rb] = [r1, r2].sort((a, b) => (a.id < b.id ? -1 : 1));
  const race = await Promise.all([
    call("POST", "/api/swipes", {
      token: r1.token,
      body: { target_user_id: r2.id, direction: "like" },
    }),
    call("POST", "/api/swipes", {
      token: r2.token,
      body: { target_user_id: r1.id, direction: "like" },
    }),
  ]);
  check(
    race.every((r) => r.status === 201),
    "оба параллельных свайпа приняты",
    race.map((r) => r.status).join("/"),
  );
  const raceMatchIds = race.map((r) => r.json?.match?.id).filter(Boolean);
  check(
    raceMatchIds.length === 1,
    "мэтч создал ровно один из двух запросов",
    `match в ответах: ${raceMatchIds.length}`,
  );

  const raceDb = new Database(DB_PATH, { readonly: true });
  const pairRows = raceDb
    .prepare(
      "SELECT COUNT(*) c FROM matches WHERE (user1_id=? AND user2_id=?) OR (user1_id=? AND user2_id=?)",
    )
    .get(r1.id, r2.id, r2.id, r1.id).c;
  check(pairRows === 1, "в БД ровно одна строка мэтча на пару", `${pairRows}`);
  const normalized = raceMatchIds[0]
    ? raceDb
        .prepare("SELECT user1_id, user2_id FROM matches WHERE id = ?")
        .get(raceMatchIds[0])
    : null;
  check(
    !!normalized &&
      normalized.user1_id === ra.id &&
      normalized.user2_id === rb.id,
    "ключи пары записаны в одном порядке (UNIQUE работает)",
    normalized
      ? `${normalized.user1_id.slice(0, 4)}…/${normalized.user2_id.slice(0, 4)}…`
      : "нет строки",
  );
  const raceNotif = raceDb
    .prepare(
      "SELECT COUNT(*) c FROM notifications WHERE user_id IN (?,?) AND type='match'",
    )
    .get(r1.id, r2.id).c;
  check(
    raceNotif === 2,
    "уведомления о мэтче — по одному каждому",
    `${raceNotif}`,
  );
  raceDb.close();

  // ------------------------------------------------ 6. Очистка
  console.log("\n\x1b[1m— 6. Очистка тестовых данных —\x1b[0m");
  const rw = new Database(DB_PATH);
  const ids = [boy.id, girl.id, outsider.id, r1.id, r2.id];
  rw.prepare(
    `DELETE FROM messages WHERE match_id IN (SELECT id FROM matches WHERE user1_id IN (${ids.map(() => "?").join(",")}) OR user2_id IN (${ids.map(() => "?").join(",")}))`,
  ).run(...ids, ...ids);
  rw.prepare(
    `DELETE FROM matches WHERE user1_id IN (${ids.map(() => "?").join(",")}) OR user2_id IN (${ids.map(() => "?").join(",")})`,
  ).run(...ids, ...ids);
  rw.prepare(
    `DELETE FROM swipes WHERE user_id IN (${ids.map(() => "?").join(",")}) OR target_user_id IN (${ids.map(() => "?").join(",")})`,
  ).run(...ids, ...ids);
  rw.prepare(
    `DELETE FROM notifications WHERE user_id IN (${ids.map(() => "?").join(",")})`,
  ).run(...ids);
  rw.prepare(
    `DELETE FROM subscriptions WHERE user_id IN (${ids.map(() => "?").join(",")})`,
  ).run(...ids);
  rw.prepare(
    `DELETE FROM user_answers WHERE user_id IN (${ids.map(() => "?").join(",")})`,
  ).run(...ids);
  rw.prepare(
    `DELETE FROM users WHERE id IN (${ids.map(() => "?").join(",")})`,
  ).run(...ids);
  rw.close();
  if (up.json?.url) {
    const f = path.join(__dirname, "..", "uploads", path.basename(up.json.url));
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  ok("тестовые аккаунты e2e удалены");

  console.log(
    `\n\x1b[1mИТОГ: ${pass}/${pass + fail} passed\x1b[0m${fail ? " \x1b[31m⚠\x1b[0m" : " \x1b[32m✅\x1b[0m"}\n`,
  );
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(`\n\x1b[31mСкрипт упал:\x1b[0m ${e.message}`);
  process.exit(2);
});
