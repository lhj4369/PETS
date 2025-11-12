// backend/routes/workout.js
import express from 'express';
import { db } from '../db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// 운동 기록 생성
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { workoutDate, workoutType, durationMinutes, heartRate, hasReward, notes } = req.body;

    if (!workoutDate || !workoutType || !durationMinutes) {
      return res.status(400).json({ error: '운동 날짜, 종류, 시간은 필수입니다.' });
    }

    if (durationMinutes <= 0) {
      return res.status(400).json({ error: '운동 시간은 1분 이상이어야 합니다.' });
    }

    await db.query(
      'INSERT INTO workout_records (user_id, workout_date, workout_type, duration_minutes, heart_rate, has_reward, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, workoutDate, workoutType, durationMinutes, heartRate || null, hasReward || false, notes || null]
    );

    res.json({ message: '운동 기록이 저장되었습니다.' });
  } catch (err) {
    console.error('운동 기록 저장 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 운동 기록 조회 (날짜 범위)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = 'SELECT id, DATE_FORMAT(workout_date, "%Y-%m-%d") AS workoutDate, workout_type AS workoutType, duration_minutes AS durationMinutes, heart_rate AS heartRate, has_reward AS hasReward, notes, created_at AS createdAt FROM workout_records WHERE user_id = ?';
    const params = [req.user.id];

    if (startDate && endDate) {
      query += ' AND workout_date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ' AND workout_date >= ?';
      params.push(startDate);
    } else if (endDate) {
      query += ' AND workout_date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY workout_date DESC, created_at DESC';

    const [rows] = await db.query(query, params);

    res.json({ records: rows });
  } catch (err) {
    console.error('운동 기록 조회 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 특정 날짜의 운동 기록 조회
router.get('/date/:date', authMiddleware, async (req, res) => {
  try {
    const { date } = req.params;

    const [rows] = await db.query(
      'SELECT id, DATE_FORMAT(workout_date, "%Y-%m-%d") AS workoutDate, workout_type AS workoutType, duration_minutes AS durationMinutes, heart_rate AS heartRate, has_reward AS hasReward, notes, created_at AS createdAt FROM workout_records WHERE user_id = ? AND workout_date = ? ORDER BY created_at DESC',
      [req.user.id, date]
    );

    res.json({ records: rows });
  } catch (err) {
    console.error('운동 기록 조회 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 운동 기록 수정
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { workoutDate, workoutType, durationMinutes, heartRate, hasReward, notes } = req.body;

    // 먼저 해당 기록이 사용자의 것인지 확인
    const [existing] = await db.query('SELECT id FROM workout_records WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: '운동 기록을 찾을 수 없습니다.' });
    }

    await db.query(
      'UPDATE workout_records SET workout_date = ?, workout_type = ?, duration_minutes = ?, heart_rate = ?, has_reward = ?, notes = ? WHERE id = ? AND user_id = ?',
      [workoutDate, workoutType, durationMinutes, heartRate || null, hasReward || false, notes || null, id, req.user.id]
    );

    res.json({ message: '운동 기록이 수정되었습니다.' });
  } catch (err) {
    console.error('운동 기록 수정 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 운동 기록 삭제
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query('DELETE FROM workout_records WHERE id = ? AND user_id = ?', [id, req.user.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '운동 기록을 찾을 수 없습니다.' });
    }

    res.json({ message: '운동 기록이 삭제되었습니다.' });
  } catch (err) {
    console.error('운동 기록 삭제 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

export default router;

