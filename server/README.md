# Platform Love — Backend API

## Запуск

```bash
cd server
npm install
npm run db:init  # Создать таблицы
npm run dev      # Запуск в режиме разработки
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| GET | `/api/auth/me` | Текущий пользователь |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:id` | Профиль |
| PUT | `/api/users/:id` | Обновить профиль |

### Swipes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/swipes/candidates` | Кандидаты |
| POST | `/api/swipes` | Свайп |
| GET | `/api/swipes/history` | История свайпов |

### Matches
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/matches` | Все мэтчи |
| GET | `/api/matches/:id` | Конкретный мэтч |
| DELETE | `/api/matches/:id` | Удалить мэтч |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/match/:matchId` | Сообщения мэтча |
| POST | `/api/messages` | Отправить |
| GET | `/api/messages/unread/count` | Непрочитанные |

### Subscriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions/current` | Текущая подписка |
| POST | `/api/subscriptions` | Оформить |
| DELETE | `/api/subscriptions/cancel` | Отменить |

## Примеры запросов

### Регистрация
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","name":"Test","gender":"male","looking_for":"female"}'
```

### Вход
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

### Свайп
```bash
curl -X POST http://localhost:3001/api/swipes \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"target_user_id":"USER_ID","direction":"like"}'
```
