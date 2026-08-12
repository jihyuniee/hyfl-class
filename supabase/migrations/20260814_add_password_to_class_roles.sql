-- 학번+이름만으로 남의 2학기 역할을 수정/삭제할 수 있는 문제를 막기 위해
-- class_roles에도 campaign_pledges와 동일한 방식의 비밀번호를 추가한다.
-- 기존 데이터에는 영향을 주지 않는다.
alter table class_roles
  add column if not exists password text;
