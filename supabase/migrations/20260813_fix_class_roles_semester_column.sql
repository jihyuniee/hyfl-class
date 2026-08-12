-- 2학기 1인1역할(/roles) 페이지에서
-- "column class_roles.semester does not exist" 오류가 발생해 방어적으로
-- 다시 적용하는 복구 마이그레이션. 기존 데이터는 변경/삭제하지 않는다.
-- Supabase SQL editor에서 실행한다.
alter table class_roles
  add column if not exists semester text not null default '2026-2';

create index if not exists class_roles_semester_idx on class_roles (semester);

-- PostgREST가 새 컬럼을 바로 인식하도록 스키마 캐시를 새로고침한다.
notify pgrst, 'reload schema';
