# Platform Love App — Спецификация

## Назначение
Мобильное приложение для знакомств с функциями свайпов, мэтчей, чата, подписок и доставки цветов/подарков.

## Текущий статус
- **Frontend**: React + Vite + Capacitor (Android/iOS) ✅
- **Backend**: Express.js + SQLite ✅
- **Админка**: Полнофункциональная панель управления ✅
- **Статус**: MVP готов к тестированию

## Стек
| Компонент | Технология |
|-----------|------------|
| Frontend | React 19, Vite, TailwindCSS v4 |
| Mobile | Capacitor (Android APK) |
| Backend | Node.js, Express.js, better-sqlite3 |
| Database | SQLite |
| Auth | JWT + bcrypt |
| Admin | React SPA |

## Основные сущности
- **User** — профиль пользователя
- **Swipe** — свайп (лайк/дизлайк)
- **Match** — взаимный мэтч
- **Message** — сообщение в чате
- **Subscription** — подписка (Basic, Premium, Premium+, Love Bundle)
- **Order** — заказ цветов/подарков
- **Complaint** — жалоба пользователя
- **SupportTicket** — обращение в поддержку

## Админ-панель (/admin)

### Экраны админки
| Экран | Путь | Описание |
|-------|------|----------|
| 📊 Дашборд | /admin | Главная страница со статистикой |
| 💬 Поддержка | /admin/support | Чаты с пользователями |
| 🌸 Заказы | /admin/orders | Заказы цветов и подарков |
| 💰 **ОПЛАТА** | /admin/payment | Управление тарифами и ценами |
| 🚨 Жалобы | /admin/complaints | Работа с жалобами |
| ✓ Модерация | /admin/moderation | Одобрение/отклонение анкет |
| 👥 Пользователи | /admin/users | Список всех пользователей |
| 🚫 Чёрный список | /admin/blacklist | Заблокированные пользователи |
| 📝 Логи | /admin/logs | Журнал действий админов |
| ⚙️ Настройки | /admin/settings | Админы, бэкапы, подписки |

### Раздел ОПЛАТА
Управление ценами и монетизацией:
- **Подписки**: Basic (бесплатно), Premium (399₽/мес), Premium+ (699₽/мес), Love Bundle (1499₽/мес)
- **Доставка**: Настройка цен доставки по зонам
- **Способы оплаты**: Банковские карты, СБП, ЮKassa, SberPay
- **Транзакции**: История всех платежей

### Навигация админки (приоритет)
1. 💬 Поддержка — требует быстрого ответа
2. 🌸 Заказы — финансовая панель
3. 💰 **ОПЛАТА** — управление ценами
4. 🚨 Жалобы — важно для доверия
5. ✓ Модерация — контроль контента
6. 👥 Пользователи
7. 🚫 Чёрный список
8. 📝 Логи
9. ⚙️ Настройки

## Команды запуска
```bash
# Frontend
npm run dev

# Backend
cd server && npm run dev

# Production build
npm run build

# Capacitor sync
npx cap sync android
```

## Environment variables (.env в server/)
```
PORT=3001
JWT_SECRET=your-secret-key
DATABASE_URL=./database.sqlite
UPLOAD_DIR=./uploads
```

## Порты
- Frontend dev server: 5175
- Backend API: 3001
- Proxy: /api → :3001, /uploads → :3001

## Файловая структура админки
```
src/admin/
├── AdminLayout.jsx        — Основной layout с навигацией
├── AdminDashboard.jsx      — Дашборд со статистикой
├── AdminOrdersScreen.jsx  — Заказы с фильтрами
├── AdminPaymentScreen.jsx  — 💰 ОПЛАТА и тарифы
├── AdminSupportScreen.jsx — Поддержка
├── AdminComplaintsScreen.jsx — Жалобы
├── AdminModerationScreen.jsx — Модерация анкет
├── AdminUsersScreen.jsx   — Пользователи
├── AdminBlacklistScreen.jsx — Чёрный список
├── AdminLogsScreen.jsx    — Логи действий
├── AdminSettingsScreen.jsx — Админы, бэкапы, подписки
├── AdminChatScreen.jsx   — Чат с пользователем
├── AdminUserDetailScreen.jsx — Детали пользователя
├── AdminOrderDetailScreen.jsx — Детали заказа
├── AdminProfileScreen.jsx — Профиль админа
└── AdminLoginScreen.jsx  — Вход в админку
```
