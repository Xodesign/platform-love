import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Получить сообщения мэтча
router.get('/match/:matchId', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const matchId = req.params.matchId;

    // Проверяем доступ к мэтчу
    const match = db.prepare(
      'SELECT id FROM matches WHERE id = ? AND (user1_id = ? OR user2_id = ?)'
    ).get(matchId, userId, userId);

    if (!match) {
      return res.status(404).json({ error: 'Мэтч не найден' });
    }

    const messages = db.prepare(`
      SELECT m.*, u.name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.match_id = ?
      ORDER BY m.created_at ASC
    `).all(matchId);

    // Отмечаем сообщения как прочитанные
    db.prepare(`
      UPDATE messages SET is_read = 1
      WHERE match_id = ? AND sender_id != ? AND is_read = 0
    `).run(matchId, userId);

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Ошибка при получении сообщений' });
  }
});

// Отправить сообщение
router.post('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { match_id, text } = req.body;

    if (!match_id || !text) {
      return res.status(400).json({ error: 'match_id и text обязательны' });
    }

    // Проверяем доступ к мэтчу
    const match = db.prepare(
      'SELECT id FROM matches WHERE id = ? AND (user1_id = ? OR user2_id = ?)'
    ).get(match_id, userId, userId);

    if (!match) {
      return res.status(404).json({ error: 'Мэтч не найден' });
    }

    const messageId = uuidv4();
    db.prepare(`
      INSERT INTO messages (id, match_id, sender_id, text)
      VALUES (?, ?, ?, ?)
    `).run(messageId, match_id, userId, text);

    const message = db.prepare(`
      SELECT m.*, u.name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).get(messageId);

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Ошибка при отправке сообщения' });
  }
});

// Количество непрочитанных сообщений
router.get('/unread/count', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;

    const result = db.prepare(`
      SELECT COUNT(*) as count
      FROM messages m
      JOIN matches mt ON m.match_id = mt.id
      WHERE (mt.user1_id = ? OR mt.user2_id = ?)
        AND m.sender_id != ?
        AND m.is_read = 0
    `).get(userId, userId, userId);

    res.json({ unread: result.count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Ошибка при подсчёте непрочитанных' });
  }
});

export default router;
