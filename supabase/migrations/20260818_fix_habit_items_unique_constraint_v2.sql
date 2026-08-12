-- 이전 마이그레이션(20260817)이 잘못된 제약 이름(habit_items_student_no_key)을
-- 추측해 실제 제약(habit_items_one_per_student)을 지우지 못했다. 이번에는
-- 이름을 추측하지 않고, "student_no 단독 유니크 제약"을 동적으로 찾아 제거한다.
-- 기존 데이터는 변경/삭제하지 않는다.
do $$
declare
  c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    where rel.relname = 'habit_items'
      and con.contype = 'u'
      and con.conkey = (
        select array_agg(attnum order by attnum)
        from pg_attribute
        where attrelid = con.conrelid
          and attname = 'student_no'
      )
  loop
    execute format('alter table habit_items drop constraint %I', c.conname);
  end loop;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'habit_items_student_no_semester_key'
  ) then
    alter table habit_items
      add constraint habit_items_student_no_semester_key unique (student_no, semester);
  end if;
end $$;
