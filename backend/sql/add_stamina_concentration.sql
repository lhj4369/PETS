-- 지구력(stamina)과 집중력(concentration) 컬럼 추가
ALTER TABLE user_profiles 
ADD COLUMN stamina INT NOT NULL DEFAULT 0 AFTER agility,
ADD COLUMN concentration INT NOT NULL DEFAULT 0 AFTER stamina;

