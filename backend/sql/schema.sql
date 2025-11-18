```
여기서 부터 계정 생성 관련 및 mysql 접속 관련 sql 코드(bash 라고 써있는 주석문을 터미널에 입력하면 됨)
```

-- mysql 계정생성
CREATE USER 'pets'@'localhost' IDENTIFIED BY 'lhj4369';
CREATE DATABASE pets;
GRANT ALL PRIVILEGES ON pets.* TO 'pets'@'localhost';
FLUSH PRIVILEGES;

-- mysql 접속(터미널에 입력)
```bash
mysql -u pets -p
lhj4369
```

```
여기서 부터 테이블 추가 관련 sql 코드
```

-- 기존 테이블 삭제 (외래키 제약 때문에 workout_records, user_profiles를 먼저 삭제)
DROP TABLE IF EXISTS workout_records;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS accounts;

-- 계정 정보 테이블
CREATE TABLE accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 프로필 테이블
CREATE TABLE user_profiles (
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- 운동 기록 테이블
CREATE TABLE workout_records (
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
);

-- 업적 정의 테이블
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
);

-- 사용자 업적 완료 기록 테이블
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
);

-- 기본 업적 데이터 삽입
INSERT INTO achievements (name, description, category, condition_type, condition_value, reward, icon) VALUES
('첫 운동 완료', '첫 번째 운동을 완료하세요', 'exercise', 'first_workout', 1, 50, '🏃‍♂️'),
('운동 10회 완료', '총 10회의 운동을 완료하세요', 'exercise', 'workout_count', 10, 200, '💪'),
('3일 연속 운동', '3일 연속으로 운동을 완료하세요', 'streak', 'streak_days', 3, 100, '🔥'),
('7일 연속 운동', '7일 연속으로 운동을 완료하세요', 'streak', 'streak_days', 7, 300, '🔥🔥'),
('레벨 5 달성', '레벨 5에 도달하세요', 'level', 'level_reached', 5, 200, '⭐'),
('레벨 10 달성', '레벨 10에 도달하세요', 'level', 'level_reached', 10, 500, '⭐⭐'),
('첫 친구 추가', '첫 번째 친구를 추가하세요', 'social', 'friend_count', 1, 75, '👥'),
('친구 10명 추가', '10명의 친구를 추가하세요', 'social', 'friend_count', 10, 400, '👥👥'),
('일일퀘스트 1회 완료', '일일 퀘스트를 1회 완료하세요', 'special', 'daily_quest', 1, 150, '🎯'),
('주간 목표 달성', '주간 운동 목표를 달성하세요', 'special', 'weekly_goal', 1, 300, '🏆');

-- 개발자 계정 생성 SQL 스크립트
-- 이메일: Developer@test.net
-- 비밀번호: 1234

-- 기존 계정이 있으면 삭제
DELETE FROM accounts WHERE email = 'Developer@test.net';

-- 개발자 계정 생성
INSERT INTO accounts (name, email, password) 
VALUES (
  'Developer',
  'Developer@test.net',
  '$2b$10$OhKUECu4OleIJ7q6GNipD.6Q2zeVSQQxzN1etK9OuCnfTPG1rZnRG'
);

'''
여기서 부터 데이터 확인 삭제 관련 sql 코드
'''
-- 데이터 확인
SELECT * FROM workout_records;
SELECT * FROM user_profiles;
SELECT * FROM accounts;
SELECT * FROM achievements;
SELECT * FROM user_achievements;

-- 데이터만 삭제 (테이블 구조는 유지, 외래키 제약 때문에 순서 중요)
-- 방법 1: DELETE 사용 (외래키 제약 때문에 순서대로 삭제)
DELETE FROM user_achievements;
DELETE FROM workout_records;
DELETE FROM user_profiles;
DELETE FROM accounts;

-- 방법 2: TRUNCATE 사용 (더 빠르지만 외래키 제약 때문에 순서대로 실행)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE user_achievements;
TRUNCATE TABLE workout_records;
TRUNCATE TABLE user_profiles;
TRUNCATE TABLE accounts;
SET FOREIGN_KEY_CHECKS = 1;
