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

-- 데이터만 삭제 (테이블 구조는 유지, 외래키 제약 때문에 순서 중요)
-- 방법 1: DELETE 사용 (외래키 제약 때문에 순서대로 삭제)
DELETE FROM workout_records;
DELETE FROM user_profiles;
DELETE FROM accounts;

-- 방법 2: TRUNCATE 사용 (더 빠르지만 외래키 제약 때문에 순서대로 실행)
-- SET FOREIGN_KEY_CHECKS = 0;
-- TRUNCATE TABLE workout_records;
-- TRUNCATE TABLE user_profiles;
-- TRUNCATE TABLE accounts;
-- SET FOREIGN_KEY_CHECKS = 1;

-- 데이터 확인
SELECT * FROM workout_records;
SELECT * FROM user_profiles;
SELECT * FROM accounts;