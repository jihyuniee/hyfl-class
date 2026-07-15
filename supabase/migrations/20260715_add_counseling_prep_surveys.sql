-- 1학기 마무리 상담용 사전 설문. 학생은 이 표에 자신의 학번으로 된 행이
-- 있어야만(=설문 제출 완료) /counseling 페이지에서 정식 상담 슬롯을
-- 선택할 수 있다. 이 SQL을 Supabase SQL editor에서 실행해야 앱이
-- "counseling_prep_surveys" 테이블을 찾을 수 있다.
create table if not exists counseling_prep_surveys (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  student_no text not null,
  name text not null,
  feeling text,
  effort_score int,
  hardest_subject text,
  least_effort_subject text,
  proud text,
  regret text,
  subject_balance text,
  subject_korean text,
  subject_math text,
  subject_english text,
  subject_simyoungdok text,
  subject_gukje text,
  subject_culture text,
  improve_method text,
  improve_habit text,
  vacation_plan text,
  psych_state text,
  emotional_concern text,
  record_concern text,
  goal_plan text,
  unique (student_no)
);

alter table counseling_prep_surveys enable row level security;

create policy "counseling_prep_surveys_select" on counseling_prep_surveys
  for select using (true);

create policy "counseling_prep_surveys_insert" on counseling_prep_surveys
  for insert with check (true);
