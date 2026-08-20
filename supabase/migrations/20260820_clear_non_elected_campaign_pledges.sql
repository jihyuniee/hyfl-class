-- 2학기 회장단 선거가 끝났다. 당선되지 않은 학생들의 공약을 정리하고,
-- 당선자(회장 장지현, 부회장 박우진·현서정)의 공약만 남긴다.
-- Supabase SQL editor에서 실행한다.
delete from campaign_pledges
where semester = '2026-2'
  and name not in ('장지현', '박우진', '현서정');
