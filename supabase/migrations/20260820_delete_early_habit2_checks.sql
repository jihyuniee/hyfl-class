-- 2학기(2026-2) 90일 습관 프로젝트의 정식 시작 전(8/12~8/17)에 실수로 남은
-- 체크 기록을 삭제한다. 1학기(2026-1) 데이터는 건드리지 않는다.
delete from habit_checks
where check_date between '2026-08-12' and '2026-08-17'
  and habit_id in (
    select id from habit_items where semester = '2026-2'
  );
