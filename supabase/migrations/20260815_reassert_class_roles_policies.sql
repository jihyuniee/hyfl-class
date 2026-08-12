-- 비밀번호가 맞는데도 /roles 2학기 삭제·수정이 동작하지 않는 문제 대응.
-- Supabase는 RLS가 켜진 테이블에서 해당 동작의 정책이 없으면 에러 없이
-- 그냥 0건 처리(조용한 실패)하기 때문에, update/delete 정책을 안전하게
-- 다시 만든다. 기존 데이터는 전혀 건드리지 않는다.
alter table class_roles enable row level security;

drop policy if exists "class_roles_select" on class_roles;
create policy "class_roles_select" on class_roles
  for select using (true);

drop policy if exists "class_roles_insert" on class_roles;
create policy "class_roles_insert" on class_roles
  for insert with check (true);

drop policy if exists "class_roles_update" on class_roles;
create policy "class_roles_update" on class_roles
  for update using (true) with check (true);

drop policy if exists "class_roles_delete" on class_roles;
create policy "class_roles_delete" on class_roles
  for delete using (true);

-- campaign_pledges도 동일한 방식으로 수정/삭제를 하므로 함께 점검한다.
alter table campaign_pledges enable row level security;

drop policy if exists "campaign_pledges_select" on campaign_pledges;
create policy "campaign_pledges_select" on campaign_pledges
  for select using (true);

drop policy if exists "campaign_pledges_insert" on campaign_pledges;
create policy "campaign_pledges_insert" on campaign_pledges
  for insert with check (true);

drop policy if exists "campaign_pledges_update" on campaign_pledges;
create policy "campaign_pledges_update" on campaign_pledges
  for update using (true) with check (true);

drop policy if exists "campaign_pledges_delete" on campaign_pledges;
create policy "campaign_pledges_delete" on campaign_pledges
  for delete using (true);
