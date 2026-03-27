-- 홈 캔버스(동물·장식품 위치) JSON 문자열 저장
ALTER TABLE user_profiles
  ADD COLUMN home_layout TEXT NULL AFTER clock_type;
