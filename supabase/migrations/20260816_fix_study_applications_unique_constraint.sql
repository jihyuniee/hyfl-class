-- study_applications에는 원래 학번(student_no) 하나로만 유니크 제약이 걸려
-- 있어서, 1학기에 이미 신청한 학생은 2학기 신청 시
-- "duplicate key value violates unique constraint study_applications_student_no_key"
-- 오류가 났다. 학기별로 한 번씩 신청할 수 있도록 (student_no, semester) 복합
-- 유니크 제약으로 교체한다. 기존 데이터는 삭제/수정하지 않는다.
alter table study_applications
  drop constraint if exists study_applications_student_no_key;

alter table study_applications
  add constraint study_applications_student_no_semester_key unique (student_no, semester);
