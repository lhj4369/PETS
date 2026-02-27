// backend/routes/challenges.js
import express from 'express';
import { db } from '../db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

const STAGES = [
  { stage: 1, distanceKm: 3, timeMinutes: 15 },
  { stage: 2, distanceKm: 3, timeMinutes: 14 },
  { stage: 3, distanceKm: 3, timeMinutes: 13 },
  { stage: 4, distanceKm: 3, timeMinutes: 12 },
  { stage: 5, distanceKm: 3, timeMinutes: 11 },
  { stage: 6, distanceKm: 3, timeMinutes: 10 },
];

// 진행 상황 조회 (최고 달성 단계)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT highest_stage AS highestStage FROM user_challenge_progress WHERE user_id = ?',
      [req.user.id]
    );
    const highestStage = rows[0]?.highestStage ?? 0;
    const nextStage = Math.min(highestStage + 1, 6);
    res.json({
      highestStage,
      nextStage,
      stages: STAGES,
    });
  } catch (err) {
    console.error('기록도전 조회 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 단계 완료 기록
router.post('/complete', authMiddleware, async (req, res) => {
  try {
    const { stage } = req.body;
    const userId = req.user.id;

    if (!stage || stage < 1 || stage > 6) {
      return res.status(400).json({ error: '유효한 단계를 입력해주세요. (1~6)' });
    }

    const [progressRows] = await db.query(
      'SELECT highest_stage AS highestStage FROM user_challenge_progress WHERE user_id = ?',
      [userId]
    );
    const currentHighest = progressRows[0]?.highestStage ?? 0;

    if (stage > currentHighest + 1) {
      return res.status(400).json({ error: '이전 단계를 먼저 완료해주세요.' });
    }

    await db.query(
      `INSERT INTO user_challenge_progress (user_id, highest_stage) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE highest_stage = GREATEST(highest_stage, ?)`,
      [userId, stage, stage]
    );

    await db.query(
      'INSERT INTO user_challenge_completions (user_id, stage) VALUES (?, ?)',
      [userId, stage]
    );

    res.json({
      message: `${stage}단계 완료!`,
      highestStage: Math.max(currentHighest, stage),
    });
  } catch (err) {
    console.error('기록도전 완료 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

export default router;
