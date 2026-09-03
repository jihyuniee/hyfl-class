-- 사진 여러 장을 한 번에 올릴 때 같은 묶음으로 인식하고, 묶음 안에서의 순서가
-- 정렬 중에 흩어지지 않도록 업로드 묶음 ID와 순번을 저장하는 컬럼을 추가한다.
-- 한 번에 올린 사진들은 같은 upload_batch_id를 가지며, batch_order로 선택한
-- 순서를 그대로 유지한다. 기존 자료는 upload_batch_id가 null, batch_order가 0으로 남는다.
-- Supabase SQL editor에서 실행하거나 `supabase db push`로 적용한다.

alter table mentor_resources
  add column if not exists upload_batch_id uuid,
  add column if not exists batch_order integer not null default 0;

create index if not exists mentor_resources_upload_batch_id_idx on mentor_resources (upload_batch_id);
