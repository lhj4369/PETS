-- 업적 정의 테이블
CREATE TABLE IF NOT EXISTS achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category ENUM('exercise', 'streak', 'level', 'social', 'special') NOT NULL,
  condition_type VARCHAR(50) NOT NULL, -- 'first_workout', 'workout_count', 'streak_days', 'level_reached', 'friend_count', 'daily_quest', 'weekly_goal'
  condition_value INT NOT NULL, -- 조건 값 (예: 10회, 3일, 레벨 5 등)
  reward INT NOT NULL DEFAULT 0, -- 보상 경험치
  icon VARCHAR(10) NOT NULL, -- 이모지 아이콘
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 업적 완료 기록 테이블
CREATE TABLE IF NOT EXISTS user_achievements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  achievement_id INT NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  claimed_at TIMESTAMP NULL, -- 보상 수령 시간
  FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_achievement (user_id, achievement_id),
  INDEX idx_user_id (user_id)
);

-- 기본 업적 데이터 삽입
INSERT INTO achievements (name, description, category, condition_type, condition_value, reward, icon) VALUES
-- 운동 카테고리
('첫 운동 완료', '첫 번째 운동을 완료하세요', 'exercise', 'first_workout', 1, 50, '🏃‍♂️'),
('운동 10회 완료', '총 10회의 운동을 완료하세요', 'exercise', 'workout_count', 10, 200, '💪'),

-- 연속 카테고리
('3일 연속 운동', '3일 연속으로 운동을 완료하세요', 'streak', 'streak_days', 3, 100, '🔥'),
('7일 연속 운동', '7일 연속으로 운동을 완료하세요', 'streak', 'streak_days', 7, 300, '🔥🔥'),

-- 레벨 카테고리
('레벨 5 달성', '레벨 5에 도달하세요', 'level', 'level_reached', 5, 200, '⭐'),
('레벨 10 달성', '레벨 10에 도달하세요', 'level', 'level_reached', 10, 500, '⭐⭐'),

-- 소셜 카테고리 (임시로 0으로 설정, 추후 친구 기능 추가 시 수정)
('첫 친구 추가', '첫 번째 친구를 추가하세요', 'social', 'friend_count', 1, 75, '👥'),
('친구 10명 추가', '10명의 친구를 추가하세요', 'social', 'friend_count', 10, 400, '👥👥'),

-- 특별 카테고리 (임시로 0으로 설정, 추후 퀘스트 기능 추가 시 수정)
('일일퀘스트 1회 완료', '일일 퀘스트를 1회 완료하세요', 'special', 'daily_quest', 1, 150, '🎯'),
('주간 목표 달성', '주간 운동 목표를 달성하세요', 'special', 'weekly_goal', 1, 300, '🏆');

