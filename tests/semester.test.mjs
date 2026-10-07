import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ddayNumber, examStatus, examDdayLabel, examStatusText, nextSchoolExam,
  FINAL_EXAM_START, toKSTDateStr } from '../components/lib/semester.ts';

const day = date => new Date(`${date}T12:00:00+09:00`);
const start = '2026-09-29';
// 종료일 경계 검증용 가상 일정이며 실제 학교 종료일이 아니다.
const end = '2026-10-02';

test('시험 전, 전날, 시작일 문구를 구분한다', () => {
  assert.equal(examStatus(start, day('2026-09-27')), 'upcoming');
  assert.equal(examDdayLabel(start, day('2026-09-27')), 'D-2');
  assert.equal(examStatusText(start, day('2026-09-27')), '2학기 중간고사까지 2일 남았어요');
  assert.equal(examDdayLabel(start, day('2026-09-28')), 'D-1');
  assert.equal(examStatusText(start, day('2026-09-28')), '내일부터 중간고사예요! 마무리 점검하기 🔥');
  assert.equal(examStatus(start, day(start)), 'starting');
  assert.equal(examDdayLabel(start, day(start)), 'D-DAY');
  assert.equal(examStatusText(start, day(start)), '오늘부터 중간고사가 시작돼요. 다들 화이팅! 📚');
});

test('종료일이 확인되면 마지막 날까지 안내하고 다음 날부터 숨긴다', () => {
  for (const date of ['2026-09-30', end]) {
    assert.equal(examStatus(start, day(date), end), 'ongoing');
    assert.equal(examDdayLabel(start, day(date), end), '시험 기간');
    assert.equal(examStatusText(start, day(date), { end }), '중간고사 기간이에요. 끝까지 힘내요 💪');
  }
  for (const date of ['2026-10-03', '2026-10-08', '2027-01-01']) {
    assert.equal(examStatus(start, day(date), end), 'past');
    assert.equal(examDdayLabel(start, day(date), end), null);
    assert.equal(examStatusText(start, day(date), { end }), null);
  }
});

test('종료일 미확인 시험은 시작일 이후 시험 기간을 추측하지 않는다', () => {
  assert.equal(examStatus(start, day('2026-09-30')), 'past');
  assert.equal(examDdayLabel(start, day('2026-09-30')), null);
  assert.equal(examStatusText(start, day('2026-10-08')), null);
});

test('한국시간 자정 경계에서 남은 날짜와 안내가 전환된다', () => {
  const before = new Date('2026-09-28T14:59:59.999Z');
  const at = new Date('2026-09-28T15:00:00.000Z');
  assert.equal(toKSTDateStr(before), '2026-09-28');
  assert.equal(toKSTDateStr(at), start);
  assert.equal(ddayNumber(start, before), 1);
  assert.equal(ddayNumber(start, at), 0);
  assert.equal(examDdayLabel(start, before), 'D-1');
  assert.equal(examDdayLabel(start, at), 'D-DAY');
  assert.equal(examDdayLabel(start, new Date('2026-09-29T15:00:00Z')), null);
  assert.equal(examDdayLabel(start, new Date('2026-10-02T14:59:59.999Z'), end), '시험 기간');
  assert.equal(examDdayLabel(start, new Date('2026-10-02T15:00:00Z'), end), null);
});

test('현재에는 확인된 기말고사만 안내하며 지난 일정은 선택하지 않는다', () => {
  assert.equal(nextSchoolExam(day('2026-09-28')).shortLabel, '중간고사');
  assert.equal(nextSchoolExam(day(start)).shortLabel, '중간고사');
  const exam = nextSchoolExam(day('2026-10-08'));
  assert.equal(exam.start, '2026-12-02');
  assert.equal(exam.end, undefined);
  assert.equal(examDdayLabel(exam.start, day('2026-10-08')), 'D-55');
  assert.equal(examStatusText(exam.start, day('2026-10-08'), exam), '2학기 기말고사까지 55일 남았어요');
  assert.equal(examStatusText(exam.start, day('2026-12-01'), exam), '내일부터 기말고사예요! 마무리 점검하기 🔥');
  assert.equal(examDdayLabel(FINAL_EXAM_START, day(FINAL_EXAM_START)), 'D-DAY');
  assert.equal(examStatusText(exam.start, day(FINAL_EXAM_START), exam), '오늘부터 기말고사가 시작돼요. 다들 화이팅! 📚');
  assert.equal(nextSchoolExam(day('2026-12-03')), undefined);
  assert.equal(nextSchoolExam(day('2027-01-01')), undefined);
});
