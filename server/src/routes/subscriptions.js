import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Получить подписку пользователя
router.get('/current', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = db.prepare(`
      SELECT * FROM subscriptions
      WHERE user_id = ? AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `).get(userId);

    if (!subscription) {
      return res.json({ active: false });
    }

    res.json({
      active: true,
      plan: subscription.plan,
      expires_at: subscription.expires_at
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Ошибка при получении подписки' });
  }
});

// Создать подписку (заглушка для интеграции с платёжной системой)
router.post('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { plan } = req.body; // 'gold', 'premium'

    if (!['gold', 'premium'].includes(plan)) {
      return res.status(400).json({ error: 'Неизвестный план подписки' });
    }

    // Удаляем старую подписку
    db.prepare('UPDATE subscriptions SET status = ? WHERE user_id = ?').run('cancelled', userId);

    // Создаём новую (на 30 дней)
    const subscriptionId = uuidv4();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO subscriptions (id, user_id, plan, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(subscriptionId, userId, plan, expiresAt);

    // Активируем премиум для пользователя
    db.prepare('UPDATE users SET is_premium = 1 WHERE id = ?').run(userId);

    res.status(201).json({
      id: subscriptionId,
      plan,
      expires_at: expiresAt,
      success: true
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ error: 'Ошибка при создании подписки' });
  }
});

// Отменить подписку
router.delete('/cancel', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    db.prepare(`
      UPDATE subscriptions SET status = 'cancelled'
      WHERE user_id = ? AND status = 'active'
    `).run(userId);

    db.prepare('UPDATE users SET is_premium = 0 WHERE id = ?').run(userId);

    res.json({ success: true, cancelled: true });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Ошибка при отмене подписки' });
  }
});

export default router;
