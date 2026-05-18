-- PETS DB schema + minimal seed for docker init
-- This runs automatically on first container startup (fresh volume).

USE pets;

CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  is_master TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  animal_type ENUM('dog', 'capybara', 'fox', 'red_panda', 'guinea_pig') NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  height DECIMAL(5,2) NULL,
  weight DECIMAL(5,2) NULL,
  level INT NOT NULL DEFAULT 1,
  experience INT NOT NULL DEFAULT 0,
  strength INT NOT NULL DEFAULT 0,
  agility INT NOT NULL DEFAULT 0,
  stamina INT NOT NULL DEFAULT 0,
  concentration INT NOT NULL DEFAULT 0,
  background_type VARCHAR(20) DEFAULT 'home',
  clock_type VARCHAR(20) DEFAULT 'alarm',
  home_layout TEXT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS workout_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  workout_date DATE NOT NULL,
  workout_type VARCHAR(50) NOT NULL,
  duration_minutes INT NOT NULL,
  heart_rate INT NULL,
  has_reward BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, workout_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category ENUM('exercise', 'streak', 'level', 'social', 'special') NOT NULL,
  condition_type VARCHAR(50) NOT NULL,
  condition_value INT NOT NULL,
  reward INT NOT NULL DEFAULT 0,
  icon VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  achievement_id INT NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  claimed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_achievement (user_id, achievement_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_challenge_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  highest_stage INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_challenge (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_challenge_completions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  stage INT NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_attendance (user_id, attendance_date),
  INDEX idx_user_date (user_id, attendance_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_accessories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  accessory_type VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_accessory (user_id, accessory_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  item_type VARCHAR(50) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_item (user_id, item_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_unlocks (
  user_id INT NOT NULL,
  unlock_key VARCHAR(80) NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, unlock_key),
  FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
  INDEX idx_user_unlocks_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Minimal achievements seed (idempotent)
INSERT IGNORE INTO achievements (id, name, description, category, condition_type, condition_value, reward, icon) VALUES
(1, '첫 운동 완료', '첫 번째 운동을 완료하세요', 'exercise', 'first_workout', 1, 50, '🏃‍♂️'),
(2, '운동 10회 완료', '총 10회의 운동을 완료하세요', 'exercise', 'workout_count', 10, 200, '💪'),
(3, '3일 연속 운동', '3일 연속으로 운동을 완료하세요', 'streak', 'streak_days', 3, 100, '🔥'),
(4, '7일 연속 운동', '7일 연속으로 운동을 완료하세요', 'streak', 'streak_days', 7, 300, '🔥🔥'),
(5, '레벨 5 달성', '레벨 5에 도달하세요', 'level', 'level_reached', 5, 200, '⭐'),
(6, '레벨 10 달성', '레벨 10에 도달하세요', 'level', 'level_reached', 10, 500, '⭐⭐'),
(7, '첫 친구 추가', '첫 번째 친구를 추가하세요', 'social', 'friend_count', 1, 75, '👥'),
(8, '친구 10명 추가', '10명의 친구를 추가하세요', 'social', 'friend_count', 10, 400, '👥👥'),
(9, '일일퀘스트 1회 완료', '일일 퀘스트를 1회 완료하세요', 'special', 'daily_quest', 1, 150, '🎯'),
(10, '주간 목표 달성', '주간 운동 목표를 달성하세요', 'special', 'weekly_goal', 1, 300, '🏆');

-- Quests seed (idempotent)
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

