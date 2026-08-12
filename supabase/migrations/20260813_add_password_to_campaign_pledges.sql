-- 2학기 공약 등록에 비밀번호를 추가해, 작성자만 비밀번호로 자신의 글을
-- 수정·삭제할 수 있게 한다 (board_posts.password와 동일한 방식).
-- 기존 1학기 공약은 비밀번호가 없으며 그대로 조회 전용으로 남는다.
alter table campaign_pledges
  add column if not exists password text;
