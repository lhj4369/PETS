// backend/routes/items.js
import express from 'express';
import { db } from '../db.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { isUserMaster } from '../lib/unlocks.js';

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

    const master = await isUserMaster(userId);

    const accessories = ACCESSORY_DEFINITIONS.map((def) => {
      const owned = ownedAccessories.has(def.id);
      return {
        ...def,
        owned,
        locked: !master && !owned,
      };
    });

    const consumables = CONSUMABLE_DEFINITIONS.map((def) => {
      const quantity = itemQuantityMap.get(def.id) ?? 0;
      const isProtein = def.id === 'protein_small' || def.id === 'protein_big';
      return {
        ...def,
        quantity,
        // 프로틴: 항상 잠금 아님(보유 수량만). 추후 비프로틴 소모품만 잠금 가능
        locked: isProtein ? false : !master && quantity <= 0,
      };
    });

    res.json({
      accessories,
      consumables,
      isMaster: master,
    });
  } catch (err) {
    console.error('아이템 조회 에러:', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

export default router;
