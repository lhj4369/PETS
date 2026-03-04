// backend/routes/auth.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { db } from '../db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
dotenv.config();

const router = express.Router();

// 회원가입 API
router.post('/register', async (req, res) => {
    try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: '이름, 이메일, 비밀번호는 필수입니다.' });
    }

    const [existing] = await db.query('SELECT id FROM accounts WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: '이미 존재하는 이메일입니다.' });
    }

    const hashed = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO accounts (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashed]
    );

    res.json({ message: '회원가입 완료!' });
  } catch (err) {
    console.error('회원가입 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 로그인 API
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
    }

    const [rows] = await db.query('SELECT * FROM accounts WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ error: '존재하지 않는 이메일입니다.' });
    }

    const account = rows[0];
    const match = await bcrypt.compare(password, account.password);
    if (!match) {
      return res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });
    }

    const token = jwt.sign(
      { id: account.id, email: account.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const [profileRows] = await db.query(
      'SELECT animal_type AS animalType, nickname, height, weight, level, experience, strength, agility, stamina, concentration, background_type AS backgroundType, clock_type AS clockType FROM user_profiles WHERE user_id = ? LIMIT 1',
      [account.id]
    );

    res.json({
      message: '로그인 성공',
      token,
      account: {
        id: account.id,
        name: account.name,
        email: account.email,
      },
      profile: profileRows.length > 0 ? profileRows[0] : null,
    });
  } catch (err) {
    console.error('로그인 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 아이디 찾기 API (이름으로 조회, 이메일(아이디) 반환)
router.post('/find-id', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: '이름을 입력해주세요.' });
    }
    const [rows] = await db.query('SELECT email FROM accounts WHERE name = ?', [name]);
    if (rows.length === 0) {
      return res.status(404).json({ error: '일치하는 회원 정보를 찾을 수 없습니다.' });
    }
    if (rows.length > 1) {
      return res.status(400).json({ error: '동일한 이름의 회원이 여러 명입니다. 고객센터로 문의해주세요.' });
    }
    res.json({ email: rows[0].email });
  } catch (err) {
    console.error('아이디 찾기 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 비밀번호 찾기 - 본인 확인 (이름 + 이메일 일치 시 verified 반환)
router.post('/find-password', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: '이름과 이메일을 모두 입력해주세요.' });
    }
    const [rows] = await db.query('SELECT id FROM accounts WHERE name = ? AND email = ?', [name, email]);
    if (rows.length === 0) {
      return res.status(404).json({ error: '일치하는 회원 정보를 찾을 수 없습니다.' });
    }
    res.json({ verified: true });
  } catch (err) {
    console.error('비밀번호 찾기 본인확인 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 비밀번호 재설정 (이름 + 이메일 일치 시 새 비밀번호로 변경)
router.post('/reset-password', async (req, res) => {
  try {
    const { name, email, newPassword } = req.body;
    if (!name || !email || !newPassword) {
      return res.status(400).json({ error: '이름, 이메일, 새 비밀번호를 모두 입력해주세요.' });
    }
    const [rows] = await db.query('SELECT id FROM accounts WHERE name = ? AND email = ?', [name, email]);
    if (rows.length === 0) {
      return res.status(404).json({ error: '일치하는 회원 정보를 찾을 수 없습니다.' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE accounts SET password = ? WHERE id = ?', [hashed, rows[0].id]);
    res.json({ message: '비밀번호가 변경되었습니다.' });
  } catch (err) {
    console.error('비밀번호 재설정 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 회원 탈퇴 (모든 정보 삭제)
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    await db.query('DELETE FROM accounts WHERE id = ?', [userId]);
    res.json({ message: '회원 탈퇴가 완료되었습니다.' });
  } catch (err) {
    console.error('회원 탈퇴 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 로그인된 사용자 정보 확인
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [userRows] = await db.query(
      'SELECT id, name, email, created_at FROM accounts WHERE id = ?',
      [req.user.id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    // 출석 처리 (1일 1회, 접속 시) - 로컬 날짜 사용
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    await db.query(
      'INSERT IGNORE INTO user_attendance (user_id, attendance_date) VALUES (?, ?)',
      [req.user.id, today]
    );

    const [profileRows] = await db.query(
      'SELECT animal_type AS animalType, nickname, height, weight, level, experience, strength, agility, stamina, concentration, background_type AS backgroundType, clock_type AS clockType FROM user_profiles WHERE user_id = ? LIMIT 1',
      [req.user.id]
    );

    res.json({
      account: userRows[0],
      profile: profileRows.length > 0 ? profileRows[0] : null,
    });
  } catch (err) {
    console.error('사용자 정보 조회 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 구글 로그인 API
router.post('/google', async (req, res) => {
  try {
    const { googleId, email, name, picture } = req.body;

    if (!googleId || !email || !name) {
      return res.status(400).json({ error: '구글 인증 정보가 불완전합니다.' });
    }

    // 이메일로 기존 계정 확인
    const [existingRows] = await db.query('SELECT * FROM accounts WHERE email = ?', [email]);
    
    let account;
    
    if (existingRows.length > 0) {
      // 기존 계정이 있으면 사용
      account = existingRows[0];
      
      // 구글 ID가 없으면 업데이트 (선택사항 - 나중에 google_id 컬럼 추가 시 사용)
      // await db.query('UPDATE accounts SET google_id = ? WHERE id = ?', [googleId, account.id]);
    } else {
      // 새 계정 생성 (구글 로그인 사용자는 비밀번호 없음)
      // password 컬럼이 NOT NULL이므로 임시 해시 비밀번호 생성
      const tempPassword = await bcrypt.hash(googleId + Date.now(), 10);
      
      const [result] = await db.query(
        'INSERT INTO accounts (name, email, password) VALUES (?, ?, ?)',
        [name, email, tempPassword]
      );
      
      const [newAccountRows] = await db.query('SELECT * FROM accounts WHERE id = ?', [result.insertId]);
      account = newAccountRows[0];
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { id: account.id, email: account.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 프로필 정보 조회
    const [profileRows] = await db.query(
      'SELECT animal_type AS animalType, nickname, height, weight, level, experience, strength, agility, stamina, concentration, background_type AS backgroundType, clock_type AS clockType FROM user_profiles WHERE user_id = ? LIMIT 1',
      [account.id]
    );

    res.json({
      message: '구글 로그인 성공',
      token,
      account: {
        id: account.id,
        name: account.name,
        email: account.email,
      },
      profile: profileRows.length > 0 ? profileRows[0] : null,
    });
  } catch (err) {
    console.error('구글 로그인 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 사용자 프로필 생성/업데이트
router.post('/profile', authMiddleware, async (req, res) => {
  try {
    const { animalType, nickname, height, weight, backgroundType, clockType } = req.body;
    const allowedAnimals = ['dog', 'capybara', 'fox', 'red_panda', 'guinea_pig'];
    const allowedBackgrounds = ['home', 'spring', 'summer', 'fall', 'winter', 'city', 'city_1', 'healthclub'];
    const allowedClocks = ['cute', 'alarm', 'sand', 'mini'];

    if (!animalType || !allowedAnimals.includes(animalType)) {
      return res.status(400).json({ error: '올바른 동물을 선택해주세요.' });
    }

    if (!nickname) {
      return res.status(400).json({ error: '닉네임을 입력해주세요.' });
    }

    const numericHeight = height !== undefined && height !== null && height !== '' ? Number(height) : null;
    const numericWeight = weight !== undefined && weight !== null && weight !== '' ? Number(weight) : null;

    if ((numericHeight !== null && Number.isNaN(numericHeight)) || (numericWeight !== null && Number.isNaN(numericWeight))) {
      return res.status(400).json({ error: '키와 몸무게는 숫자로 입력해주세요.' });
    }

    // 배경과 시계 타입 검증 (선택사항)
    const validBackgroundType = backgroundType && allowedBackgrounds.includes(backgroundType) ? backgroundType : 'home';
    const validClockType = clockType && allowedClocks.includes(clockType) ? clockType : 'alarm';

    const [existing] = await db.query('SELECT id FROM user_profiles WHERE user_id = ?', [req.user.id]);

    if (existing.length > 0) {
      await db.query(
        'UPDATE user_profiles SET animal_type = ?, nickname = ?, height = ?, weight = ?, background_type = ?, clock_type = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [animalType, nickname, numericHeight, numericWeight, validBackgroundType, validClockType, req.user.id]
      );
    } else {
      // 프로필 생성 시 스탯 초기화: 레벨 1, 경험치 0, 힘 0, 민첩 0
      await db.query(
        'INSERT INTO user_profiles (user_id, animal_type, nickname, height, weight, level, experience, strength, agility, stamina, concentration, background_type, clock_type) VALUES (?, ?, ?, ?, ?, 1, 0, 0, 0, 0, 0, ?, ?)',
        [req.user.id, animalType, nickname, numericHeight, numericWeight, validBackgroundType, validClockType]
      );
    }

    res.json({ message: '프로필이 저장되었습니다.' });
  } catch (err) {
    console.error('프로필 저장 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 커스터마이징 정보만 업데이트 (동물, 배경, 시계)
router.post('/customization', authMiddleware, async (req, res) => {
  try {
    const { animalType, backgroundType, clockType } = req.body;
    const allowedAnimals = ['dog', 'capybara', 'fox', 'red_panda', 'guinea_pig'];
    const allowedBackgrounds = ['home', 'spring', 'summer', 'fall', 'winter', 'city', 'city_1', 'healthclub'];
    const allowedClocks = ['cute', 'alarm', 'sand', 'mini'];

    // 프로필이 존재하는지 확인
    const [existing] = await db.query('SELECT id FROM user_profiles WHERE user_id = ?', [req.user.id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ error: '프로필을 먼저 생성해주세요.' });
    }

    // 동물, 배경, 시계 타입 검증
    const validAnimalType = animalType && allowedAnimals.includes(animalType) ? animalType : null;
    const validBackgroundType = backgroundType && allowedBackgrounds.includes(backgroundType) ? backgroundType : 'home';
    const validClockType = clockType && allowedClocks.includes(clockType) ? clockType : 'alarm';

    // 업데이트할 필드와 값 구성
    const updateFields = [];
    const updateValues = [];

    if (validAnimalType) {
      updateFields.push('animal_type = ?');
      updateValues.push(validAnimalType);
    }
    if (validBackgroundType) {
      updateFields.push('background_type = ?');
      updateValues.push(validBackgroundType);
    }
    if (validClockType) {
      updateFields.push('clock_type = ?');
      updateValues.push(validClockType);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: '업데이트할 정보가 없습니다.' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(req.user.id);

    await db.query(
      `UPDATE user_profiles SET ${updateFields.join(', ')} WHERE user_id = ?`,
      updateValues
    );

    res.json({ message: '커스터마이징 정보가 저장되었습니다.' });
  } catch (err) {
    console.error('커스터마이징 저장 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 랭킹 조회 (경험치 기준)
router.get('/ranking', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        up.user_id,
        a.name,
        up.animal_type AS animalType,
        up.nickname,
        up.experience,
        up.level,
        COUNT(wr.id) AS totalWorkouts,
        COALESCE(SUM(wr.duration_minutes), 0) AS totalDurationMinutes,
        COALESCE(AVG(wr.heart_rate), 0) AS avgHeartRate
      FROM user_profiles up
      INNER JOIN accounts a ON up.user_id = a.id
      LEFT JOIN workout_records wr ON up.user_id = wr.user_id
      GROUP BY up.user_id, a.name, up.animal_type, up.nickname, up.experience, up.level
      ORDER BY up.experience DESC, up.level DESC
      LIMIT 100`,
      []
    );

    res.json({ rankings: rows });
  } catch (err) {
    console.error('랭킹 조회 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

export default router;
