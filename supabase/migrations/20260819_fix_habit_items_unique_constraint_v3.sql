-- 두 번의 시도에도 동일한 오류("habit_items_one_per_student")가 반복됐다.
-- 이는 pg_constraint에 잡히는 "제약"이 아니라, 별도의 유니크 인덱스로 만들어져
-- 있었기 때문으로 보인다(ALTER TABLE ... ADD CONSTRAINT가 아니라
-- CREATE UNIQUE INDEX로 생성된 경우 pg_constraint 조회에 잡히지 않는다).
-- 이번에는 이름을 알고 있으니, 제약과 인덱스 두 형태 모두를 직접 제거한다.
-- 기존 데이터는 변경/삭제하지 않는다.
alter table habit_items
  drop constraint if exists habit_items_one_per_student;

drop index if exists habit_items_one_per_student;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'habit_items_student_no_semester_key'
  ) then
    alter table habit_items
      add constraint habit_items_student_no_semester_key unique (student_no, semester);
  end if;
end $$;
