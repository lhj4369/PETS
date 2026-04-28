-- Seed master account for developer mode (idempotent).
-- Runs automatically on first mysql container init (fresh volume).
--
-- Default master credentials:
--   email: master@pets.test
--   password: 1234

USE pets;

-- 1) Ensure master account exists
INSERT IGNORE INTO accounts (name, email, password, is_master)
VALUES (
  'Master',
  'master@pets.test',
  '$2b$10$OhKUECu4OleIJ7q6GNipD.6Q2zeVSQQxzN1etK9OuCnfTPG1rZnRG',
  1
);

-- 2) Fetch master id (works whether inserted now or pre-existing)
SELECT id INTO @master_id FROM accounts WHERE email = 'master@pets.test' LIMIT 1;

-- 3) Ensure profile exists (user_profiles has no unique key on user_id)
INSERT INTO user_profiles (
  user_id, animal_type, nickname, height, weight,
  level, experience,
  strength, agility, stamina, concentration,
  background_type, clock_type, home_layout
)
SELECT
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
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles WHERE user_id = @master_id
);

-- 4) Ensure unlocks/accessories/items exist (tables have unique keys)
INSERT IGNORE INTO user_unlocks (user_id, unlock_key) VALUES
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

INSERT IGNORE INTO user_accessories (user_id, accessory_type) VALUES
(@master_id, 'crown'),
(@master_id, 'muscle_suit'),
(@master_id, 'red_hairband');

INSERT IGNORE INTO user_items (user_id, item_type, quantity) VALUES
(@master_id, 'protein_small', 99),
(@master_id, 'protein_big', 99);

