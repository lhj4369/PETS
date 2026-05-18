-- 전체 사용자 데이터 초기화 후 마스터 계정 1개 시드
-- 사전: accounts.is_master, user_unlocks/user_items/user_accessories 등 최신 스키마가 적용되어 있어야 합니다.
-- 실행 예: mysql -u pets -p pets < backend/sql/reset_and_seed_master.sql
--
-- 마스터 로그인(기본):
--   이메일: master@pets.test
--   비밀번호: 1234
-- (bcrypt 해시는 기존 Developer@test.net과 동일한 평문 1234)

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE user_unlocks;
TRUNCATE TABLE user_items;
TRUNCATE TABLE user_accessories;
TRUNCATE TABLE user_quest_progress;
TRUNCATE TABLE user_challenge_progress;
TRUNCATE TABLE user_challenge_completions;
TRUNCATE TABLE user_attendance;
TRUNCATE TABLE user_achievements;
TRUNCATE TABLE workout_records;
TRUNCATE TABLE user_profiles;
TRUNCATE TABLE accounts;

SET FOREIGN_KEY_CHECKS = 1;

-- 비밀번호 1234 (bcrypt)
INSERT INTO accounts (name, email, password, is_master)
VALUES (
  'Master',
  'master@pets.test',
  '$2b$10$OhKUECu4OleIJ7q6GNipD.6Q2zeVSQQxzN1etK9OuCnfTPG1rZnRG',
  1
);

SET @master_id = LAST_INSERT_ID();

INSERT INTO user_profiles (
  user_id, animal_type, nickname, height, weight,
  level, experience,
  strength, agility, stamina, concentration,
  background_type, clock_type, home_layout
) VALUES (
  @master_id,
  'dog',
  'Master',
  NULL,
  NULL,
  50,
  4999,
  999,
  999,
  999,
  999,
  'spring',
  'alarm',
  '{"animal":{"x":0.5,"y":0.55},"decorations":[],"houseType":"standard"}'
);

-- 마스터: 모든 커스터마이징 해금 키
INSERT INTO user_unlocks (user_id, unlock_key) VALUES
(@master_id, 'animals:all'),
(@master_id, 'animal:dog'),
(@master_id, 'animal:capybara'),
(@master_id, 'animal:fox'),
(@master_id, 'animal:guinea_pig'),
(@master_id, 'animal:red_panda'),
(@master_id, 'bg:home'),
(@master_id, 'bg:spring'),
(@master_id, 'bg:summer'),
(@master_id, 'bg:city'),
(@master_id, 'bg:city_1'),
(@master_id, 'bg:fall'),
(@master_id, 'bg:winter'),
(@master_id, 'bg:healthclub'),
(@master_id, 'clock:cute'),
(@master_id, 'clock:alarm'),
(@master_id, 'clock:sand'),
(@master_id, 'clock:mini'),
(@master_id, 'house:standard'),
(@master_id, 'decor:bench'),
(@master_id, 'decor:dumbbell'),
(@master_id, 'decor:treadmill'),
(@master_id, 'accessory:crown'),
(@master_id, 'accessory:muscle_suit'),
(@master_id, 'accessory:red_hairband'),
(@master_id, 'item:protein_small'),
(@master_id, 'item:protein_big');

-- 악세서리 전부 보유
INSERT INTO user_accessories (user_id, accessory_type) VALUES
(@master_id, 'crown'),
(@master_id, 'muscle_suit'),
(@master_id, 'red_hairband');

-- 프로틴 99, 그 외 규칙상 최대 1(여기서는 프로틴만 인벤토리에 존재)
INSERT INTO user_items (user_id, item_type, quantity) VALUES
(@master_id, 'protein_small', 99),
(@master_id, 'protein_big', 99);
