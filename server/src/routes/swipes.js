import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Получить кандидатов для свайпов
router.get('/candidates', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    // Получаем текущего пользователя для фильтрации
    const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Находим пользователей, которых ещё не свайпали
    // и которые подходят под критерии поиска
    const candidates = db.prepare(`
      SELECT id, name, age, bio, gender, location, photos
      FROM users
      WHERE id != ?
        AND id NOT IN (
          SELECT target_user_id FROM swipes WHERE user_id = ?
        )
        AND gender = ?
      LIMIT ?
    `).all(userId, userId, currentUser.looking_for, parseInt(limit));

    const formatted = candidates.map(u => ({
      ...u,
      photos: JSON.parse(u.photos || '[]')
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ error: 'Ошибка при получении кандидатов' });
  }
});

// Сделать свайп
router.post('/', authenticateToken, (req, res) => {
  try {
    const { target_user_id, direction } = req.body;
    const userId = req.user.id;

    if (!target_user_id || !direction) {
      return res.status(400).json({ error: 'target_user_id и direction обязательны' });
    }

    if (!['like', 'dislike'].includes(direction)) {
      return res.status(400).json({ error: 'direction должен быть "like" или "dislike"' });
    }

    // Проверяем, что целевой пользователь существует
    const targetUser = db.prepare('SELECT id FROM users WHERE id = ?').get(target_user_id);
    if (!targetUser) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Проверяем, что ещё не свайпали этого пользователя
    const existingSwipe = db.prepare(
      'SELECT id FROM swipes WHERE user_id = ? AND target_user_id = ?'
    ).get(userId, target_user_id);

    if (existingSwipe) {
      return res.status(400).json({ error: 'Вы уже свайпали этого пользователя' });
    }

    // Создаём свайп
    const swipeId = uuidv4();
    db.prepare(`
      INSERT INTO swipes (id, user_id, target_user_id, direction)
      VALUES (?, ?, ?, ?)
    `).run(swipeId, userId, target_user_id, direction);

    let match = null;

    // Если лайк — проверяем взаимность
    if (direction === 'like') {
      const mutualLike = db.prepare(`
        SELECT id FROM swipes
        WHERE user_id = ? AND target_user_id = ? AND direction = 'like'
      `).get(target_user_id, userId);

      if (mutualLike) {
        // Создаём мэтч
        const matchId = uuidv4();
        db.prepare(`
          INSERT INTO matches (id, user1_id, user2_id)
          VALUES (?, ?, ?)
        `).run(matchId, userId, target_user_id);

        match = { id: matchId, matched: true };
      }
    }

    res.status(201).json({
      id: swipeId,
      direction,
      match
    });
  } catch (error) {
    console.error('Swipe error:', error);
    res.status(500).json({ error: 'Ошибка при свайпе' });
  }
});

// Получить историю свайпов текущего пользователя
router.get('/history', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    const swipes = db.prepare(`
      SELECT s.*, u.name as target_name, u.photos as target_photos
      FROM swipes s
      JOIN users u ON s.target_user_id = u.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
      LIMIT 100
    `).all(userId);

    const formatted = swipes.map(s => ({
      ...s,
      target_photos: JSON.parse(s.target_photos || '[]')
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get swipes history error:', error);
    res.status(500).json({ error: 'Ошибка при получении истории' });
  }
});

export default router;
