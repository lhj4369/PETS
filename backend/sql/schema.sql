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
  animal_type ENUM('capybara', 'fox', 'red_panda', 'guinea_pig') NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  height DECIMAL(5,2) NULL,
  weight DECIMAL(5,2) NULL,
  level INT NOT NULL DEFAULT 1,
  experience INT NOT NULL DEFAULT 0,
  strength INT NOT NULL DEFAULT 0,
  agility INT NOT NULL DEFAULT 0,
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

