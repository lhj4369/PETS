// backend/routes/items.js
import express from 'express';
import { db } from '../db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// 악세서리 정의 (도전과제/퀘스트 보상으로 획득)
const ACCESSORY_DEFINITIONS = [
  { id: 'crown', name: '왕관', imageKey: 'crown' },
  { id: 'muscle_suit', name: '근육맨 슈트', imageKey: 'muscle_suit' },
  { id: 'red_hairband', name: '빨간 머리띠', imageKey: 'red_hairband' },
];

// 소모품 정의 (퀘스트/도전과제 보상으로 획득, 여러 개 가능)
const CONSUMABLE_DEFINITIONS = [
  { id: 'protein_small', name: '프로틴 통', imageKey: 'protein_small' },
  { id: 'protein_big', name: '프로틴 포대', imageKey: 'protein_big' },
];

// 아이템 전체 조회 (악세서리 보유/미보유, 소모품 보유개수)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [accessoryRows] = await db.query(
      'SELECT accessory_type AS id FROM user_accessories WHERE user_id = ?',
      [userId]
    );
    const ownedAccessories = new Set(accessoryRows.map((r) => r.id));

    const [itemRows] = await db.query(
      'SELECT item_type AS id, quantity FROM user_items WHERE user_id = ?',
      [userId]
    );
    const itemQuantityMap = new Map(itemRows.map((r) => [r.id, r.quantity]));

    const accessories = ACCESSORY_DEFINITIONS.map((def) => ({
      ...def,
      owned: ownedAccessories.has(def.id),
    }));

    const consumables = CONSUMABLE_DEFINITIONS.map((def) => ({
      ...def,
      quantity: itemQuantityMap.get(def.id) ?? 0,
    }));

    res.json({
      accessories,
      consumables,
    });
  } catch (err) {
    console.error('아이템 조회 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

export default router;
