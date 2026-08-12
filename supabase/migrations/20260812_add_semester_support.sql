-- 2학기 리뉴얼: 1학기 데이터를 절대 삭제/초기화하지 않고, 학기 구분 필드를
-- 안전하게 추가한다. 기존 행은 모두 default 값인 '2026-1'(1학기)로 채워지고,
-- 앱 코드는 새로 등록되는 자료에 '2026-2'를 명시적으로 저장한다.
-- Supabase SQL editor에서 실행하거나 `supabase db push`로 적용한다.

alter table habit_items
  add column if not exists semester text not null default '2026-1';

alter table study_applications
  add column if not exists semester text not null default '2026-1';

alter table campaign_pledges
  add column if not exists semester text not null default '2026-1';

create index if not exists habit_items_semester_idx on habit_items (semester);
create index if not exists study_applications_semester_idx on study_applications (semester);
create index if not exists campaign_pledges_semester_idx on campaign_pledges (semester);

-- 1인1역할 페이지: 1학기는 기존 정적 화면을 그대로 보존하고,
-- 2학기부터는 학생이 직접 역할을 등록/수정/삭제할 수 있도록 새 테이블을 만든다.
create table if not exists class_roles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  semester text not null default '2026-2',
  student_no text not null,
  name text not null,
  dept text,
  role text not null,
  description text,
  unique (semester, student_no, role)
);

alter table class_roles enable row level security;

create policy "class_roles_select" on class_roles
  for select using (true);

create policy "class_roles_insert" on class_roles
  for insert with check (true);

create policy "class_roles_update" on class_roles
  for update using (true);

create policy "class_roles_delete" on class_roles
  for delete using (true);
