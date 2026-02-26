// backend/routes/quests.js
import express from 'express';
import { db } from '../db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// 퀘스트 목록 조회 (사용자 진행 상황 포함)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [quests] = await db.query(
      `SELECT id, name, description, quest_type AS questType, condition_type AS conditionType, 
       condition_value AS conditionValue, condition_extra AS conditionExtra,
       reward_type AS rewardType, reward_value AS rewardValue, reward_amount AS rewardAmount,
       icon, is_repeatable AS isRepeatable, tier_step AS tierStep, sort_order AS sortOrder
       FROM quests ORDER BY quest_type, sort_order, id`
    );

    const [progressRows] = await db.query(
      `SELECT quest_id AS questId, progress_value AS progressValue, completed_at AS completedAt, 
       claimed_at AS claimedAt, current_tier AS currentTier
       FROM user_quest_progress WHERE user_id = ?`,
      [userId]
    );

    const progressMap = new Map();
    progressRows.forEach((r) => {
      progressMap.set(r.questId, r);
    });

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const weekStart = getWeekStart(now);

    const [profileRows] = await db.query(
      'SELECT level, strength, agility, stamina, concentration FROM user_profiles WHERE user_id = ?',
      [userId]
    );
    const profile = profileRows[0] || { level: 1, strength: 0, agility: 0, stamina: 0, concentration: 0 };

    const [workoutRows] = await db.query(
      `SELECT workout_type AS workoutType, duration_minutes AS durationMinutes, workout_date AS workoutDate
       FROM workout_records WHERE user_id = ?`,
      [userId]
    );

    const [attendanceRows] = await db.query(
      `SELECT DATE_FORMAT(attendance_date, '%Y-%m-%d') AS d FROM user_attendance WHERE user_id = ? ORDER BY d`,
      [userId]
    );
    const attendanceDates = new Set(attendanceRows.map((r) => r.d));

    const [challengeRows] = await db.query(
      `SELECT COUNT(*) AS cnt FROM user_challenge_completions 
       WHERE user_id = ? AND DATE(completed_at) >= ? AND DATE(completed_at) <= ?`,
      [userId, weekStart, today]
    );
    const weekChallengeCount = challengeRows[0]?.cnt ?? 0;

    const [progressRows2] = await db.query(
      'SELECT highest_stage AS highestStage FROM user_challenge_progress WHERE user_id = ?',
      [userId]
    );
    const challengeHighestStage = progressRows2[0]?.highestStage ?? 0;

    const questsWithStatus = quests.map((q) => {
      const prog = progressMap.get(q.id);
      const { isCompleted, progress, displayName, displayDesc } = evaluateQuest(
        q,
        prog,
        profile,
        workoutRows,
        attendanceDates,
        today,
        weekStart,
        weekChallengeCount,
        challengeHighestStage
      );
      return {
        ...q,
        progressValue: progress,
        displayName: displayName || q.name,
        displayDescription: displayDesc || q.description,
        isCompleted: !!isCompleted,
        isClaimed: !!prog?.claimedAt,
        completedAt: prog?.completedAt || null,
        currentTier: prog?.currentTier ?? 1,
      };
    });

    res.json({ quests: questsWithStatus });
  } catch (err) {
    console.error('퀘스트 조회 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

function getWeekStart(d) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}

function evaluateQuest(q, prog, profile, workoutRows, attendanceDates, today, weekStart, weekChallengeCount = 0, challengeHighestStage = 0) {
  const tier = prog?.currentTier ?? 1;
  const target = q.conditionValue * tier;
  let progress = prog?.progressValue ?? 0;
  let isCompleted = false;
  let displayName = q.name;
  let displayDesc = q.description;

  if (q.questType === 'daily') {
    const toDateStr = (d) => (typeof d === 'string' ? d.split('T')[0] : `${new Date(d).getFullYear()}-${String(new Date(d).getMonth() + 1).padStart(2, '0')}-${String(new Date(d).getDate()).padStart(2, '0')}`);
    const todayWorkouts = workoutRows.filter((w) => toDateStr(w.workoutDate) === today);
    const todayAttendance = attendanceDates.has(today);

    switch (q.conditionType) {
      case 'aerobic_min':
        progress = todayWorkouts
          .filter((w) => w.workoutType === '유산소')
          .reduce((s, w) => s + w.durationMinutes, 0);
        isCompleted = progress >= q.conditionValue;
        break;
      case 'weight_min':
        progress = todayWorkouts
          .filter((w) => w.workoutType === '웨이트')
          .reduce((s, w) => s + w.durationMinutes, 0);
        isCompleted = progress >= q.conditionValue;
        break;
      case 'interval_min':
        progress = todayWorkouts
          .filter((w) => w.workoutType === '인터벌')
          .reduce((s, w) => s + w.durationMinutes, 0);
        isCompleted = progress >= q.conditionValue;
        break;
      case 'attendance':
        progress = todayAttendance ? 1 : 0;
        isCompleted = todayAttendance;
        break;
      default:
        break;
    }
  } else if (q.questType === 'weekly') {
    const toDateStr = (d) => (typeof d === 'string' ? d.split('T')[0] : `${new Date(d).getFullYear()}-${String(new Date(d).getMonth() + 1).padStart(2, '0')}-${String(new Date(d).getDate()).padStart(2, '0')}`);
    const weekWorkouts = workoutRows.filter((w) => {
      const d = toDateStr(w.workoutDate);
      return d >= weekStart && d <= today;
    });
    const weekAttendanceDates = [...attendanceDates].filter((d) => d >= weekStart && d <= today);

    switch (q.conditionType) {
      case 'daily_quest_count': {
        const byDate = new Map();
        weekWorkouts.forEach((w) => {
          const d = typeof w.workoutDate === 'string' ? w.workoutDate.split('T')[0] : new Date(w.workoutDate).toISOString().split('T')[0];
          if (!byDate.has(d)) byDate.set(d, { aerobic: 0, weight: 0, interval: 0, attendance: 0 });
          const day = byDate.get(d);
          if (w.workoutType === '유산소') day.aerobic += w.durationMinutes;
          else if (w.workoutType === '웨이트') day.weight += w.durationMinutes;
          else if (w.workoutType === '인터벌') day.interval += w.durationMinutes;
        });
        weekAttendanceDates.forEach((d) => {
          if (!byDate.has(d)) byDate.set(d, { aerobic: 0, weight: 0, interval: 0, attendance: 0 });
          byDate.get(d).attendance = 1;
        });
        progress = 0;
        byDate.forEach((day) => {
          if (day.aerobic >= 20) progress++;
          if (day.weight >= 30) progress++;
          if (day.interval >= 10) progress++;
          if (day.attendance) progress++;
        });
        isCompleted = progress >= q.conditionValue;
        break;
      }
      case 'aerobic_min_week':
        progress = weekWorkouts
          .filter((w) => w.workoutType === '유산소')
          .reduce((s, w) => s + w.durationMinutes, 0);
        isCompleted = progress >= q.conditionValue;
        break;
      case 'weight_min_week':
        progress = weekWorkouts
          .filter((w) => w.workoutType === '웨이트')
          .reduce((s, w) => s + w.durationMinutes, 0);
        isCompleted = progress >= q.conditionValue;
        break;
      case 'interval_min_week':
        progress = weekWorkouts
          .filter((w) => w.workoutType === '인터벌')
          .reduce((s, w) => s + w.durationMinutes, 0);
        isCompleted = progress >= q.conditionValue;
        break;
      case 'attendance_count':
        progress = weekAttendanceDates.length;
        isCompleted = progress >= q.conditionValue;
        break;
      case 'challenge_count':
        progress = weekChallengeCount;
        isCompleted = progress >= q.conditionValue;
        break;
      default:
        break;
    }
  } else {
    switch (q.conditionType) {
      case 'workout_any_30min': {
        const total = workoutRows.reduce((s, w) => s + w.durationMinutes, 0);
        progress = Math.min(30, total);
        isCompleted = total >= 30;
        break;
      }
      case 'evolution_stage': {
        const lv = profile.level || 1;
        const stage = lv >= 20 ? 3 : lv >= 10 ? 2 : 1;
        progress = stage;
        isCompleted = stage >= q.conditionValue;
        break;
      }
      case 'magic_3days': {
        const totalMin = workoutRows.reduce((s, w) => s + w.durationMinutes, 0);
        const attCount = attendanceDates.size;
        progress = Math.min(90, totalMin);
        isCompleted = totalMin >= 90 && attCount >= 3;
        break;
      }
      case 'run_3km_15min':
        progress = challengeHighestStage >= 1 ? 1 : 0;
        isCompleted = challengeHighestStage >= 1;
        break;
      case 'run_3km_10min':
        progress = challengeHighestStage >= 6 ? 1 : 0;
        isCompleted = challengeHighestStage >= 6;
        break;
      case 'attendance_after_evolution': {
        const lv = profile.level || 1;
        const hasEvolution = lv >= 20;
        progress = hasEvolution ? attendanceDates.size : 0;
        isCompleted = hasEvolution && attendanceDates.size >= 100;
        break;
      }
      case 'ranking_1st':
      case 'ranking_top5':
        progress = prog?.progressValue ?? 0;
        isCompleted = progress >= 1;
        break;
      case 'friday_attendance': {
        const fridayCount = [...attendanceDates].filter((d) => new Date(d).getDay() === 5).length;
        progress = fridayCount;
        isCompleted = fridayCount >= 50;
        break;
      }
      case 'level_tier':
        progress = profile.level || 1;
        const tierTarget = q.conditionValue * tier;
        isCompleted = progress >= tierTarget;
        displayName = `레벨 ${tierTarget}달성!`;
        displayDesc = `${tierTarget}레벨에 도달하세요!`;
        break;
      case 'attendance_tier':
        progress = attendanceDates.size;
        const attTarget = q.conditionValue * tier;
        isCompleted = progress >= attTarget;
        displayName = '꾸준함';
        displayDesc = `누적 출석 ${attTarget}회 달성!`;
        break;
      case 'aerobic_total_tier': {
        const aerobicTotal = workoutRows
          .filter((w) => w.workoutType === '유산소')
          .reduce((s, w) => s + w.durationMinutes, 0);
        progress = aerobicTotal;
        const aeroTarget = q.conditionValue * tier;
        isCompleted = progress >= aeroTarget;
        displayDesc = `유산소 누적 ${aeroTarget}분 달성`;
        break;
      }
      case 'weight_total_tier': {
        const weightTotal = workoutRows
          .filter((w) => w.workoutType === '웨이트')
          .reduce((s, w) => s + w.durationMinutes, 0);
        progress = weightTotal;
        const wTarget = q.conditionValue * tier;
        isCompleted = progress >= wTarget;
        displayDesc = `웨이트 누적 ${wTarget}분 달성`;
        break;
      }
      case 'interval_total_tier': {
        const intervalTotal = workoutRows
          .filter((w) => w.workoutType === '인터벌')
          .reduce((s, w) => s + w.durationMinutes, 0);
        progress = intervalTotal;
        const iTarget = q.conditionValue * tier;
        isCompleted = progress >= iTarget;
        displayDesc = `인터벌 누적 ${iTarget}분 달성`;
        break;
      }
      case 'triathlon_tier': {
        const aerobic = workoutRows.filter((w) => w.workoutType === '유산소').reduce((s, w) => s + w.durationMinutes, 0);
        const weight = workoutRows.filter((w) => w.workoutType === '웨이트').reduce((s, w) => s + w.durationMinutes, 0);
        const interval = workoutRows.filter((w) => w.workoutType === '인터벌').reduce((s, w) => s + w.durationMinutes, 0);
        const targetMin = q.conditionValue * tier;
        progress = Math.min(aerobic, weight, interval);
        isCompleted = aerobic >= targetMin && weight >= targetMin && interval >= targetMin;
        displayDesc = `3종 운동 각각 ${targetMin}분 달성`;
        break;
      }
      default:
        break;
    }
  }

  return { isCompleted, progress, displayName, displayDesc };
}

// 퀘스트 진행 체크 (실시간)
router.post('/check', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const weekStart = getWeekStart(now);

    const [quests] = await db.query('SELECT id, quest_type, condition_type, condition_value, is_repeatable, tier_step FROM quests');
    const [progressRows] = await db.query(
      'SELECT quest_id, progress_value, completed_at, claimed_at, current_tier FROM user_quest_progress WHERE user_id = ?',
      [userId]
    );
    const [profileRows] = await db.query(
      'SELECT level, strength, agility, stamina, concentration FROM user_profiles WHERE user_id = ?',
      [userId]
    );
    const [workoutRows] = await db.query(
      'SELECT workout_type, duration_minutes, workout_date FROM workout_records WHERE user_id = ?',
      [userId]
    );
    const [attendanceRows] = await db.query(
      `SELECT DATE_FORMAT(attendance_date, '%Y-%m-%d') AS d FROM user_attendance WHERE user_id = ?`,
      [userId]
    );
    const attendanceDates = new Set(attendanceRows.map((r) => r.d));
    const [challengeRows] = await db.query(
      `SELECT COUNT(*) AS cnt FROM user_challenge_completions 
       WHERE user_id = ? AND DATE(completed_at) >= ? AND DATE(completed_at) <= ?`,
      [userId, weekStart, today]
    );
    const weekChallengeCount = challengeRows[0]?.cnt ?? 0;
    const [progressRows2] = await db.query(
      'SELECT highest_stage AS highestStage FROM user_challenge_progress WHERE user_id = ?',
      [userId]
    );
    const challengeHighestStage = progressRows2[0]?.highestStage ?? 0;
    const profile = profileRows[0] || { level: 1 };
    const progressMap = new Map(progressRows.map((r) => [r.quest_id, r]));

    const newlyCompleted = [];
    for (const q of quests) {
      const prog = progressMap.get(q.id);
      const { isCompleted } = evaluateQuest(
        { ...q, questType: q.quest_type, conditionType: q.condition_type, conditionValue: q.condition_value },
        prog ? { ...prog, currentTier: prog.current_tier } : null,
        profile,
        workoutRows.map((w) => ({ workoutType: w.workout_type, durationMinutes: w.duration_minutes, workoutDate: w.workout_date })),
        attendanceDates,
        today,
        weekStart,
        weekChallengeCount,
        challengeHighestStage
      );

      if (isCompleted && (!prog || !prog.completed_at)) {
        await db.query(
          `INSERT INTO user_quest_progress (user_id, quest_id, progress_value, completed_at, current_tier)
           VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
           ON DUPLICATE KEY UPDATE progress_value = VALUES(progress_value), completed_at = CURRENT_TIMESTAMP`,
          [userId, q.id, q.condition_value, prog?.current_tier ?? 1]
        );
        newlyCompleted.push(q.id);
      }
    }

    res.json({ message: '퀘스트 체크 완료', newlyCompleted });
  } catch (err) {
    console.error('퀘스트 체크 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 보상 수령
router.post('/:id/claim', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [questRows] = await db.query(
      'SELECT id, name, reward_type AS rewardType, reward_value AS rewardValue, reward_amount AS rewardAmount, is_repeatable AS isRepeatable FROM quests WHERE id = ?',
      [id]
    );
    if (questRows.length === 0) {
      return res.status(404).json({ error: '퀘스트를 찾을 수 없습니다.' });
    }
    const quest = questRows[0];

    const [progRows] = await db.query(
      'SELECT id, completed_at, claimed_at, current_tier FROM user_quest_progress WHERE user_id = ? AND quest_id = ?',
      [userId, id]
    );

    if (progRows.length === 0 || !progRows[0].completed_at) {
      return res.status(400).json({ error: '완료하지 않은 퀘스트입니다.' });
    }
    const prog = progRows[0];
    if (prog.claimed_at) {
      return res.status(400).json({ error: '이미 보상을 수령했습니다.' });
    }

    const { rewardType, rewardValue, rewardAmount } = quest;

    if (rewardType === 'stat') {
      const statMap = { strength: 'strength', agility: 'agility', stamina: 'stamina', concentration: 'concentration', all_stats: null };
      if (rewardValue === 'all_stats') {
        await db.query(
          `UPDATE user_profiles SET strength = strength + ?, agility = agility + ?, stamina = stamina + ?, concentration = concentration + ? WHERE user_id = ?`,
          [rewardAmount, rewardAmount, rewardAmount, rewardAmount, userId]
        );
      } else if (statMap[rewardValue]) {
        const col = statMap[rewardValue];
        await db.query(
          `UPDATE user_profiles SET ${col} = ${col} + ? WHERE user_id = ?`,
          [rewardAmount, userId]
        );
      }
    } else if (rewardType === 'item') {
      await db.query(
        `INSERT INTO user_items (user_id, item_type, quantity) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
        [userId, rewardValue, rewardAmount, rewardAmount]
      );
    } else if (rewardType === 'accessory') {
      await db.query(
        'INSERT IGNORE INTO user_accessories (user_id, accessory_type) VALUES (?, ?)',
        [userId, rewardValue]
      );
    } else if (rewardType === 'background') {
      await db.query(
        'UPDATE user_profiles SET background_type = ? WHERE user_id = ?',
        [rewardValue, userId]
      );
    }

    await db.query(
      'UPDATE user_quest_progress SET claimed_at = CURRENT_TIMESTAMP WHERE user_id = ? AND quest_id = ?',
      [userId, id]
    );

    if (quest.isRepeatable) {
      await db.query(
        'UPDATE user_quest_progress SET current_tier = current_tier + 1, completed_at = NULL, claimed_at = NULL WHERE user_id = ? AND quest_id = ?',
        [userId, id]
      );
    }

    res.json({
      message: '보상을 수령했습니다.',
      rewardType,
      rewardValue,
      rewardAmount,
    });
  } catch (err) {
    console.error('보상 수령 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

export default router;
