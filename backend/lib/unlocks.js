// backend/lib/unlocks.js — 커스터마이징/콘텐츠 잠금 해제
import { db } from '../db.js';

const DECORATION_IDS = ['bench', 'dumbbell', 'treadmill'];

export async function isUserMaster(userId) {
  const [rows] = await db.query('SELECT is_master AS m FROM accounts WHERE id = ? LIMIT 1', [userId]);
  return rows.length > 0 && Number(rows[0].m) === 1;
}

export async function getUnlockKeys(userId) {
  const [rows] = await db.query('SELECT unlock_key AS k FROM user_unlocks WHERE user_id = ?', [userId]);
  return rows.map((r) => r.k);
}

/** 신규 프로필 생성 직후: 선택 동물 + 봄 배경 + 알람 시계 + standard 집만 */
export async function seedStarterUnlocks(userId, animalType) {
  const keys = [
    `animal:${animalType}`,
    'bg:spring',
    'clock:alarm',
    'house:standard',
  ];
  for (const k of keys) {
    await db.query('INSERT IGNORE INTO user_unlocks (user_id, unlock_key) VALUES (?, ?)', [userId, k]);
  }
}

export async function hasUnlock(userId, key, isMaster) {
  if (isMaster) return true;
  const [rows] = await db.query(
    'SELECT 1 FROM user_unlocks WHERE user_id = ? AND unlock_key = ? LIMIT 1',
    [userId, key]
  );
  return rows.length > 0;
}

async function hasUnlockRaw(userId, key) {
  const [rows] = await db.query(
    'SELECT 1 FROM user_unlocks WHERE user_id = ? AND unlock_key = ? LIMIT 1',
    [userId, key]
  );
  return rows.length > 0;
}

export async function canUseAnimal(userId, animalType, isMaster) {
  if (isMaster) return true;
  if (await hasUnlockRaw(userId, 'animals:all')) return true;
  return hasUnlockRaw(userId, `animal:${animalType}`);
}

export async function canUseBackground(userId, bg, isMaster) {
  if (isMaster) return true;
  return hasUnlockRaw(userId, `bg:${bg}`);
}

export async function canUseClock(userId, clock, isMaster) {
  if (isMaster) return true;
  return hasUnlockRaw(userId, `clock:${clock}`);
}

export async function canUseDecoration(userId, decorId, isMaster) {
  if (isMaster) return true;
  return hasUnlockRaw(userId, `decor:${decorId}`);
}

/**
 * 커스터마이징 저장 전 검증 (마스터는 통과)
 */
export async function assertCustomizationAllowed(userId, { animalType, backgroundType, clockType, homeLayout }) {
  const master = await isUserMaster(userId);
  if (master) return { ok: true };

  if (animalType && !(await canUseAnimal(userId, animalType, false))) {
    return { ok: false, error: '아직 해금되지 않은 동물입니다.' };
  }
  if (backgroundType && !(await canUseBackground(userId, backgroundType, false))) {
    return { ok: false, error: '아직 해금되지 않은 배경입니다.' };
  }
  if (clockType && !(await canUseClock(userId, clockType, false))) {
    return { ok: false, error: '아직 해금되지 않은 시계입니다.' };
  }
  if (homeLayout && homeLayout.decorations) {
    for (const d of homeLayout.decorations) {
      if (d.id && !(await canUseDecoration(userId, d.id, false))) {
        return { ok: false, error: '아직 해금되지 않은 장식입니다.' };
      }
    }
  }
  return { ok: true };
}

export async function grantUnlock(userId, key) {
  await db.query('INSERT IGNORE INTO user_unlocks (user_id, unlock_key) VALUES (?, ?)', [userId, key]);
}

/** 퀘스트 보상 → unlock_key 매핑 */
export function unlockKeyFromQuestReward(rewardType, rewardValue) {
  if (!rewardValue) return null;
  if (rewardType === 'background') return `bg:${rewardValue}`;
  if (rewardType === 'accessory') return `accessory:${rewardValue}`;
  if (rewardType === 'item') return `item:${rewardValue}`;
  if (rewardType === 'ability' && rewardValue === 'animal_change') {
    return 'animals:all';
  }
  return null;
}

export async function grantUnlocksForAnimalsAll(userId) {
  const animals = ['dog', 'capybara', 'fox', 'red_panda', 'guinea_pig'];
  for (const a of animals) {
    await grantUnlock(userId, `animal:${a}`);
  }
}

/** 프로틴류는 최대 99, 그 외 소모품/고유 아이템은 최대 1 */
export async function grantItemQuantityCapped(userId, itemType, addAmount) {
  const add = Number(addAmount) || 0;
  const isProtein = itemType === 'protein_small' || itemType === 'protein_big';
  const cap = isProtein ? 99 : 1;
  const [rows] = await db.query(
    'SELECT quantity FROM user_items WHERE user_id = ? AND item_type = ?',
    [userId, itemType]
  );
  const cur = rows.length ? Number(rows[0].quantity) : 0;
  const next = Math.min(cap, cur + add);
  await db.query(
    `INSERT INTO user_items (user_id, item_type, quantity) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = ?`,
    [userId, itemType, next, next]
  );
}

export { DECORATION_IDS };
