-- 아이템 시스템 마이그레이션
-- user_accessories, user_items 테이블은 schema.sql에 이미 정의되어 있음
-- 이 파일은 테이블 존재 확인 및 필요 시 인덱스 추가용

-- 사용자 악세서리 (보유/미보유 - user_accessories에 있으면 보유)
-- schema.sql에 이미 정의됨:
-- CREATE TABLE IF NOT EXISTS user_accessories (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   user_id INT NOT NULL,
--   accessory_type VARCHAR(50) NOT NULL,
--   unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   ...
-- );

-- 사용자 소모품 (보유개수 - user_items.quantity)
-- schema.sql에 이미 정의됨:
-- CREATE TABLE IF NOT EXISTS user_items (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   user_id INT NOT NULL,
--   item_type VARCHAR(50) NOT NULL,
--   quantity INT NOT NULL DEFAULT 0,
--   ...
-- );

-- 테이블이 없을 경우를 대비한 생성 (schema.sql 실행 후에는 불필요)
CREATE TABLE IF NOT EXISTS user_accessories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  accessory_type VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_accessory (user_id, accessory_type)
);

CREATE TABLE IF NOT EXISTS user_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  item_type VARCHAR(50) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_item (user_id, item_type)
);
