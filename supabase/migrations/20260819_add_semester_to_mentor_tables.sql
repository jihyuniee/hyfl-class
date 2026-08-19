-- 멘토 페이지 2학기 개편: 1학기 활동 일지·공유 자료를 그대로 보존하면서
-- 2학기부터는 새 과목/멘토 구성으로 새로 시작할 수 있도록 학기 구분 필드를 추가한다.
-- 기존 행은 모두 default 값인 '2026-1'(1학기)로 채워지고, 앱 코드는 새로 등록되는
-- 자료에 '2026-2'를 명시적으로 저장한다.
-- Supabase SQL editor에서 실행하거나 `supabase db push`로 적용한다.

alter table mentor_logs
  add column if not exists semester text not null default '2026-1';

alter table mentor_resources
  add column if not exists semester text not null default '2026-1';

create index if not exists mentor_logs_semester_idx on mentor_logs (semester);
create index if not exists mentor_resources_semester_idx on mentor_resources (semester);
