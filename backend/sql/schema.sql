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

-- 계정 정보 테이블
CREATE TABLE IF NOT EXISTS accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 프로필 테이블
CREATE TABLE IF NOT EXISTS user_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  animal_type ENUM('capybara', 'fox', 'red_panda', 'guinea_pig') NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  height DECIMAL(5,2) NULL,
  weight DECIMAL(5,2) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
);

