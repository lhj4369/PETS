// backend/routes/workout.js
import express from 'express';
import { db } from '../db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// 업적 체크 헬퍼 함수 (비동기)
async function checkAchievementsAsync(userId) {
  try {
    // 사용자 프로필 정보 조회
    const [profileRows] = await db.query(
      'SELECT level, experience FROM user_profiles WHERE user_id = ?',
      [userId]
    );
    const profile = profileRows[0] || { level: 1, experience: 0 };

    // 모든 업적 조회
    const [achievements] = await db.query(
      'SELECT id, condition_type, condition_value FROM achievements'
    );

    // 이미 완료한 업적 조회
    const [completedRows] = await db.query(
      'SELECT achievement_id FROM user_achievements WHERE user_id = ?',
      [userId]
    );
    const completedIds = new Set(completedRows.map((r) => r.achievement_id));

    // 각 업적 조건 체크
    for (const achievement of achievements) {
      if (completedIds.has(achievement.id)) continue;

      let isCompleted = false;

      switch (achievement.condition_type) {
        case 'first_workout':
        case 'workout_count': {
          const [workoutCount] = await db.query(
            'SELECT COUNT(*) AS count FROM workout_records WHERE user_id = ?',
            [userId]
          );
          const count = workoutCount[0].count;
          isCompleted =
            achievement.condition_type === 'first_workout'
              ? count >= 1
              : count >= achievement.condition_value;
          break;
        }

        case 'streak_days': {
          // 연속 운동 일수 계산 (최근 N일 연속)
          const [workoutDates] = await db.query(
            'SELECT DISTINCT DATE(workout_date) AS workout_date FROM workout_records WHERE user_id = ? ORDER BY workout_date DESC',
            [userId]
          );

          if (workoutDates.length >= achievement.condition_value) {
            // 오늘부터 역순으로 연속 일수 확인
            let consecutive = true;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // 날짜 문자열로 변환된 배열 생성
            const dateStrings = workoutDates.map(w => {
              const date = new Date(w.workout_date);
              return date.toISOString().split('T')[0];
            });

            // 최근 N일이 모두 운동 기록이 있는지 확인
            for (let i = 0; i < achievement.condition_value; i++) {
              const checkDate = new Date(today);
              checkDate.setDate(today.getDate() - i);
              const dateStr = checkDate.toISOString().split('T')[0];

              if (!dateStrings.includes(dateStr)) {
                consecutive = false;
                break;
              }
            }
            isCompleted = consecutive;
          }
          break;
        }

        case 'level_reached': {
          isCompleted = profile.level >= achievement.condition_value;
          break;
        }
      }

      // 업적 완료 처리
      if (isCompleted) {
        await db.query(
          'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE completed_at = completed_at',
          [userId, achievement.id]
        );
      }
    }
  } catch (err) {
    console.error('업적 체크 에러:', err);
  }
}

// 운동 기록 생성
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { workoutDate, workoutType, durationMinutes, heartRate, hasReward, notes, stats } = req.body;

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

    // 스탯 업데이트 및 경험치 계산
    if (stats && Array.isArray(stats)) {
      // 현재 프로필 조회
      const [profileRows] = await db.query(
        'SELECT strength, agility, stamina, concentration, level FROM user_profiles WHERE user_id = ?',
        [req.user.id]
      );

      if (profileRows.length > 0) {
        const profile = profileRows[0];
        let newStrength = profile.strength || 0;
        let newAgility = profile.agility || 0;
        let newStamina = profile.stamina || 0;
        let newConcentration = profile.concentration || 0;

        // 스탯 증가
        stats.forEach(stat => {
          const label = stat.label || '';
          if (label === '근력' || label === '힘') {
            newStrength += stat.value;
          } else if (label === '민첩') {
            newAgility += stat.value;
          } else if (label === '지구력') {
            newStamina += stat.value;
          } else if (label === '집중력') {
            newConcentration += stat.value;
          }
        });

        // 경험치 계산: 스탯 합산
        const totalStats = newStrength + newAgility + newStamina + newConcentration;
        
        // 레벨당 100 경험치 필요 (레벨 1: 0-100, 레벨 2: 100-200, 레벨 3: 200-300...)
        const requiredExpForCurrentLevel = (profile.level - 1) * 100;
        const requiredExpForNextLevel = profile.level * 100;
        
        // 현재 레벨에서의 경험치 (0-100 사이)
        const currentExp = totalStats - requiredExpForCurrentLevel;
        
        // 레벨업 체크
        let newLevel = profile.level;
        if (totalStats >= requiredExpForNextLevel) {
          newLevel = Math.floor(totalStats / 100) + 1;
        }

        // 프로필 업데이트 (경험치는 스탯 합산)
        await db.query(
          'UPDATE user_profiles SET strength = ?, agility = ?, stamina = ?, concentration = ?, level = ?, experience = ? WHERE user_id = ?',
          [newStrength, newAgility, newStamina, newConcentration, newLevel, totalStats, req.user.id]
        );
      }
    }

    // 업적 자동 체크 (비동기로 실행하여 응답 지연 방지)
    checkAchievementsAsync(req.user.id).catch(err => {
      console.error('업적 체크 에러:', err);
    });

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

