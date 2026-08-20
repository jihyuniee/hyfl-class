-- 데이터 정정: DB에 남아있을 수 있는 오탈자 "최안아"를 정확한 이름 "최인아"로
-- 일괄 치환한다. 어느 테이블/컬럼에 들어있는지 미리 알 수 없으므로,
-- public 스키마의 모든 text/varchar 컬럼과 text[] 배열 컬럼을 스캔해서
-- 값을 바꾼다. (jsonb 컬럼 등 자유서술형 텍스트 안에 섞여 있는 경우는
-- 구조를 깨뜨릴 위험이 있어 이 스크립트에서는 건드리지 않는다.)
-- Supabase SQL editor에서 실행한다.
do $$
declare
  r record;
  updated_count int;
begin
  -- 1) 일반 text / varchar 컬럼
  for r in
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public'
      and data_type in ('text', 'character varying')
  loop
    execute format(
      'update public.%I set %I = replace(%I, %L, %L) where %I like %L',
      r.table_name, r.column_name, r.column_name, '최안아', '최인아', r.column_name, '%최안아%'
    );
    get diagnostics updated_count = row_count;
    if updated_count > 0 then
      raise notice '%.% : % row(s) updated', r.table_name, r.column_name, updated_count;
    end if;
  end loop;

  -- 2) text[] 배열 컬럼 (예: 팀/조 구성원 명단처럼 이름을 배열로 저장하는 경우)
  for r in
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'public'
      and data_type = 'ARRAY'
      and udt_name = '_text'
  loop
    execute format(
      'update public.%I set %I = array_replace(%I, %L, %L) where %L = any(%I)',
      r.table_name, r.column_name, r.column_name, '최안아', '최인아', '최안아', r.column_name
    );
    get diagnostics updated_count = row_count;
    if updated_count > 0 then
      raise notice '%.% (array) : % row(s) updated', r.table_name, r.column_name, updated_count;
    end if;
  end loop;
end $$;
