-- 성장 기록은 서버 API를 통해서만 저장·조회한다.
-- 기존 praise_posts 데이터는 그대로 보존한다.

alter table public.praise_posts enable row level security;

revoke all privileges on table public.praise_posts from anon;
revoke all privileges on table public.praise_posts from authenticated;

-- service_role은 서버 API에서만 사용하며 RLS를 우회해 제출 및 담임 조회를 처리한다.
grant all privileges on table public.praise_posts to service_role;
