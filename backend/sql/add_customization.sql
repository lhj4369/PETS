-- 커스터마이징 정보를 위한 컬럼 추가
ALTER TABLE user_profiles 
ADD COLUMN background_type VARCHAR(20) DEFAULT 'home',
ADD COLUMN clock_type VARCHAR(20) DEFAULT 'alarm';

-- 배경 타입: 'home', 'spring', 'summer', 'fall', 'winter', 'city'
-- 시계 타입: 'cute', 'alarm', 'sand', 'mini'

