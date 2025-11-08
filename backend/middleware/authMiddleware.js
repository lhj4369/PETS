// backend/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '인증 토큰이 없습니다.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // 토큰 내용 (id, email 등) 저장
    next();
  } catch (err) {
    console.error('토큰 인증 실패:', err.message);
    res.status(401).json({ error: '유효하지 않거나 만료된 토큰입니다.' });
  }
};