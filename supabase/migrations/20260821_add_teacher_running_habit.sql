-- 2학기 90일 습관에 지현샘(no: T1)을 참여자로 추가하고
-- "30분 러닝"을 습관으로 등록한다. 이미 등록돼 있으면 아무 것도 하지 않는다.
insert into habit_items (student_no, name, title, note, semester)
values ('T1', '지현샘', '30분 러닝', null, '2026-2')
on conflict on constraint habit_items_student_no_semester_key do nothing;
