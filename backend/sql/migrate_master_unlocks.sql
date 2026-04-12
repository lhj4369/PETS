-- 마스터 계정 플래그 + 커스터마이징/아이템 잠금 해제 테이블
-- 실행: mysql -u pets -p pets < backend/sql/migrate_master_unlocks.sql

ALTER TABLE accounts
  ADD COLUMN is_master TINYINT(1) NOT NULL DEFAULT 0
  AFTER password;

CREATE TABLE IF NOT EXISTS user_unlocks (
  user_id INT NOT NULL,
  unlock_key VARCHAR(80) NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, unlock_key),
  FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE,
  INDEX idx_user_unlocks_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
