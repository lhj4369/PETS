-- 구글 로그인 지원을 위한 스키마 업데이트
-- 이 마이그레이션은 선택사항입니다. 현재 구현은 이 마이그레이션 없이도 작동합니다.

-- accounts 테이블에 google_id 컬럼 추가 (선택사항)
-- ALTER TABLE accounts ADD COLUMN google_id VARCHAR(255) NULL UNIQUE AFTER email;

-- password 컬럼을 NULL 허용으로 변경 (구글 로그인 사용자는 비밀번호가 없음)
-- ALTER TABLE accounts MODIFY COLUMN password VARCHAR(255) NULL;

-- 기존 구글 사용자들을 위한 인덱스 추가 (google_id 컬럼 추가 시)
-- CREATE INDEX idx_google_id ON accounts(google_id);

