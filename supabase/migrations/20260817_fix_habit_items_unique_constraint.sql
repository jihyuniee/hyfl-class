-- study_applications와 마찬가지로 habit_items도 학번(student_no) 단독
-- 유니크 제약이 걸려 있을 가능성이 있다. 이 경우 1학기에 습관을 등록했던
-- 학생이 2학기에 새로 등록하면 동일한 "duplicate key" 오류가 난다.
-- (student_no, semester) 복합 유니크 제약으로 안전하게 교체한다.
-- 기존 데이터는 변경/삭제하지 않는다.
alter table habit_items
  drop constraint if exists habit_items_student_no_key;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'habit_items_student_no_semester_key'
  ) then
    alter table habit_items
      add constraint habit_items_student_no_semester_key unique (student_no, semester);
  end if;
end $$;
