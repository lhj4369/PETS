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
      'SELECT animal_type AS animalType, nickname, height, weight FROM user_profiles WHERE user_id = ? LIMIT 1',
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

    const [profileRows] = await db.query(
      'SELECT animal_type AS animalType, nickname, height, weight FROM user_profiles WHERE user_id = ? LIMIT 1',
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

// 사용자 프로필 생성/업데이트
router.post('/profile', authMiddleware, async (req, res) => {
  try {
    const { animalType, nickname, height, weight } = req.body;
    const allowedAnimals = ['capybara', 'fox', 'red_panda', 'guinea_pig'];

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

    const [existing] = await db.query('SELECT id FROM user_profiles WHERE user_id = ?', [req.user.id]);

    if (existing.length > 0) {
      await db.query(
        'UPDATE user_profiles SET animal_type = ?, nickname = ?, height = ?, weight = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
        [animalType, nickname, numericHeight, numericWeight, req.user.id]
      );
    } else {
      await db.query(
        'INSERT INTO user_profiles (user_id, animal_type, nickname, height, weight) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, animalType, nickname, numericHeight, numericWeight]
      );
    }

    res.json({ message: '프로필이 저장되었습니다.' });
  } catch (err) {
    console.error('프로필 저장 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

export default router;
