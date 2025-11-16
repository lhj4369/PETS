// backend/routes/achievements.js
import express from 'express';
import { db } from '../db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// 업적 목록 조회 (사용자별 완료 여부 포함)
router.get('/', authMiddleware, async (req, res) => {
  try {
    // 모든 업적 조회
    const [achievements] = await db.query(
      'SELECT id, name, description, category, condition_type AS conditionType, condition_value AS conditionValue, reward, icon FROM achievements ORDER BY category, id'
    );

    // 사용자가 완료한 업적 조회
    const [completedAchievements] = await db.query(
      'SELECT achievement_id AS achievementId, completed_at AS completedAt, claimed_at AS claimedAt FROM user_achievements WHERE user_id = ?',
      [req.user.id]
    );

    // 완료한 업적 ID 맵 생성
    const completedMap = new Map();
    completedAchievements.forEach((item) => {
      completedMap.set(item.achievementId, {
        completedAt: item.completedAt,
        claimedAt: item.claimedAt,
      });
    });

    // 업적 목록에 완료 여부 추가
    const achievementsWithStatus = achievements.map((achievement) => {
      const completed = completedMap.get(achievement.id);
      return {
        ...achievement,
        isCompleted: !!completed,
        isClaimed: !!completed?.claimedAt,
        completedAt: completed?.completedAt || null,
      };
    });

    res.json({ achievements: achievementsWithStatus });
  } catch (err) {
    console.error('업적 조회 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 업적 체크 및 완료 처리 (실시간 체크)
router.post('/check', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const newlyCompleted = [];

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
      if (completedIds.has(achievement.id)) continue; // 이미 완료한 업적은 스킵

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

        case 'friend_count':
          // 친구 기능이 구현되면 추가
          isCompleted = false;
          break;

        case 'daily_quest':
        case 'weekly_goal':
          // 퀘스트 기능이 구현되면 추가
          isCompleted = false;
          break;
      }

      // 업적 완료 처리
      if (isCompleted) {
        await db.query(
          'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE completed_at = completed_at',
          [userId, achievement.id]
        );
        newlyCompleted.push(achievement.id);
      }
    }

    res.json({
      message: '업적 체크 완료',
      newlyCompleted: newlyCompleted.length,
    });
  } catch (err) {
    console.error('업적 체크 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 업적 보상 수령
router.post('/:id/claim', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 업적이 완료되었는지 확인
    const [completed] = await db.query(
      'SELECT ua.id, ua.claimed_at, a.reward FROM user_achievements ua INNER JOIN achievements a ON ua.achievement_id = a.id WHERE ua.user_id = ? AND ua.achievement_id = ?',
      [userId, id]
    );

    if (completed.length === 0) {
      return res.status(404).json({ error: '완료하지 않은 업적입니다.' });
    }

    if (completed[0].claimed_at) {
      return res.status(400).json({ error: '이미 보상을 수령한 업적입니다.' });
    }

    // 보상 수령 처리
    const reward = completed[0].reward;
    await db.query(
      'UPDATE user_achievements SET claimed_at = CURRENT_TIMESTAMP WHERE user_id = ? AND achievement_id = ?',
      [userId, id]
    );

    // 경험치 추가
    await db.query(
      'UPDATE user_profiles SET experience = experience + ? WHERE user_id = ?',
      [reward, userId]
    );

    res.json({
      message: '보상을 수령했습니다.',
      reward: reward,
    });
  } catch (err) {
    console.error('보상 수령 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

export default router;

