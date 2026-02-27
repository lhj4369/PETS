-- 기존 DB에 퀘스트 시스템 추가 (schema.sql 전체 실행 대신 이 파일만 실행할 때 사용)

-- 퀘스트 정의 테이블
CREATE TABLE IF NOT EXISTS quests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  quest_type ENUM('daily', 'weekly', 'challenge') NOT NULL,
  condition_type VARCHAR(50) NOT NULL,
  condition_value INT NOT NULL,
  condition_extra VARCHAR(100) NULL,
  reward_type ENUM('stat', 'item', 'accessory', 'background', 'ability') NOT NULL,
  reward_value VARCHAR(50) NOT NULL,
  reward_amount INT DEFAULT 1,
  icon VARCHAR(10) NOT NULL,
  is_repeatable BOOLEAN DEFAULT FALSE,
  tier_step INT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 퀘스트 진행
CREATE TABLE IF NOT EXISTS user_quest_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  quest_id INT NOT NULL,
  progress_value INT DEFAULT 0,
  completed_at TIMESTAMP NULL,
  claimed_at TIMESTAMP NULL,
  current_tier INT DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_quest (user_id, quest_id),
  INDEX idx_user_quest (user_id, quest_id)
);

-- 사용자 악세사리 해금
CREATE TABLE IF NOT EXISTS user_accessories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  accessory_type VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_accessory (user_id, accessory_type)
);

-- 기록도전 단계별 완료
CREATE TABLE IF NOT EXISTS user_challenge_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  highest_stage INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_challenge (user_id)
);

CREATE TABLE IF NOT EXISTS user_challenge_completions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  stage INT NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, completed_at)
);

-- 사용자 출석 기록 (접속 시 1일 1회)
CREATE TABLE IF NOT EXISTS user_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_attendance (user_id, attendance_date),
  INDEX idx_user_date (user_id, attendance_date)
);

-- 사용자 아이템 인벤토리
CREATE TABLE IF NOT EXISTS user_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  item_type VARCHAR(50) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_item (user_id, item_type)
);

-- 퀘스트 시드 (기존 데이터가 없을 때만)
INSERT IGNORE INTO quests (id, name, description, quest_type, condition_type, condition_value, condition_extra, reward_type, reward_value, reward_amount, icon, is_repeatable, tier_step, sort_order) VALUES
(1, '유산소 20분', '유산소 20분 운동하세요', 'daily', 'aerobic_min', 20, NULL, 'stat', 'stamina', 1, '🏃', FALSE, NULL, 1),
(2, '웨이트 30분', '웨이트 30분 운동하세요', 'daily', 'weight_min', 30, NULL, 'stat', 'strength', 1, '💪', FALSE, NULL, 2),
(3, '인터벌 10분', '인터벌 10분 운동하세요', 'daily', 'interval_min', 10, NULL, 'stat', 'agility', 1, '⚡', FALSE, NULL, 3),
(4, '출석', '오늘 출석하세요', 'daily', 'attendance', 1, NULL, 'stat', 'concentration', 1, '📅', FALSE, NULL, 4),
(5, '일일퀘스트 10회', '일일 퀘스트 10회 완료하세요', 'weekly', 'daily_quest_count', 10, NULL, 'item', 'protein_small', 1, '🎯', FALSE, NULL, 10),
(6, '유산소 80분', '유산소 80분 운동하세요', 'weekly', 'aerobic_min_week', 80, NULL, 'stat', 'stamina', 4, '🏃', FALSE, NULL, 11),
(7, '웨이트 120분', '웨이트 120분 운동하세요', 'weekly', 'weight_min_week', 120, NULL, 'stat', 'strength', 4, '💪', FALSE, NULL, 12),
(8, '인터벌 40분', '인터벌 40분 운동하세요', 'weekly', 'interval_min_week', 40, NULL, 'stat', 'agility', 4, '⚡', FALSE, NULL, 13),
(9, '출석 4회', '4일 출석하세요', 'weekly', 'attendance_count', 4, NULL, 'stat', 'concentration', 4, '📅', FALSE, NULL, 14),
(10, '기록도전 1회', '기록 도전 1회 도전하세요', 'weekly', 'challenge_count', 1, NULL, 'stat', 'all_stats', 1, '🏆', FALSE, NULL, 15),
(11, '천리 길도 한걸음 부터!', '종류 관계 없이 운동 30분 실시하세요', 'challenge', 'workout_any_30min', 30, NULL, 'item', 'protein_small', 1, '👣', FALSE, NULL, 20),
(12, '성장', '2번째 진화(2단계)를 달성하세요!', 'challenge', 'evolution_stage', 2, NULL, 'stat', 'all_stats', 1, '🌱', FALSE, NULL, 21),
(13, '내가 누구?', '최종 진화(3단계)를 달성하세요!', 'challenge', 'evolution_stage', 3, NULL, 'ability', 'animal_change', 1, '🌟', FALSE, NULL, 22),
(14, '마의 3일 돌파!', '총 운동 1시간 30분 + 출석 3회', 'challenge', 'magic_3days', 90, '3', 'item', 'protein_big', 1, '🔥', FALSE, NULL, 23),
(15, '이제 시작이야', '3km 15분 내에 돌파 (기록도전 1단계)', 'challenge', 'run_3km_15min', 1, NULL, 'background', 'city_1', 1, '🏙️', FALSE, NULL, 24),
(16, '포기를 모르는', '3km 10분 내에 돌파 (기록도전 최종)', 'challenge', 'run_3km_10min', 1, NULL, 'background', 'fall', 1, '🌅', FALSE, NULL, 25),
(17, '습관', '최종 진화 후 누적 출석 100회', 'challenge', 'attendance_after_evolution', 100, NULL, 'accessory', 'red_hairband', 1, '🎀', FALSE, NULL, 26),
(18, 'The one, The only', '랭킹 1위 달성!', 'challenge', 'ranking_1st', 1, NULL, 'accessory', 'crown', 1, '👑', FALSE, NULL, 27),
(19, '손꼽히는 강자', '랭킹 5등 안에 들기', 'challenge', 'ranking_top5', 5, NULL, 'accessory', 'muscle_suit', 1, '🦾', FALSE, NULL, 28),
(20, '난 운동 밖에 몰라', '금요일 출석 50회 달성', 'challenge', 'friday_attendance', 50, 'friday', 'background', 'healthclub', 1, '🏋️', FALSE, NULL, 29),
(21, '레벨 N달성!', 'N*5 레벨에 도달하세요!', 'challenge', 'level_tier', 5, NULL, 'item', 'protein_small', 1, '⭐', TRUE, 5, 30),
(22, '꾸준함', '누적 출석 N*7회 달성!', 'challenge', 'attendance_tier', 7, NULL, 'stat', 'concentration', 1, '📆', TRUE, 7, 31),
(23, '마라토너', '유산소 누적 N*200분 달성', 'challenge', 'aerobic_total_tier', 200, NULL, 'stat', 'stamina', 1, '🏃‍♂️', TRUE, 200, 32),
(24, '보디빌더', '웨이트 누적 N*300분 달성', 'challenge', 'weight_total_tier', 300, NULL, 'stat', 'strength', 1, '💪', TRUE, 300, 33),
(25, '체육특기생', '인터벌 누적 N*100분 달성', 'challenge', 'interval_total_tier', 100, NULL, 'stat', 'agility', 1, '⚡', TRUE, 100, 34),
(26, '트라이애슬론', '3종 운동 각각 N*60분 달성', 'challenge', 'triathlon_tier', 60, NULL, 'stat', 'all_stats', 2, '🎖️', TRUE, 60, 35);

-- 기존 DB에서 손꼽히는 강자 10등->5등 수정 (이미 migrate 실행한 경우)
UPDATE quests SET condition_type='ranking_top5', condition_value=5, description='랭킹 5등 안에 들기' WHERE name='손꼽히는 강자';

-- 기존 DB에서 주간 퀘스트 수정 (4회->시간 기준)
UPDATE quests SET name='유산소 80분', description='유산소 80분 운동하세요', condition_type='aerobic_min_week', condition_value=80 WHERE name='유산소 4회';
UPDATE quests SET name='웨이트 120분', description='웨이트 120분 운동하세요', condition_type='weight_min_week', condition_value=120 WHERE name='웨이트 4회';
UPDATE quests SET name='인터벌 40분', description='인터벌 40분 운동하세요', condition_type='interval_min_week', condition_value=40 WHERE name='인터벌 4회';
UPDATE quests SET description='기록 도전 1회 도전하세요' WHERE name='기록도전 1회';
