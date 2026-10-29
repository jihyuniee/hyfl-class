import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { latestPercentileResults, inPercentileBand, previewPercentileResults, belongsToProfile, chooseUnitProfile, unitAdmissionField } from '../components/lib/admissionsBrowse.ts';
const row = (univ, dept, year, cut_pct70, mean_pct = null) => ({ univ, dept, year, cut_pct70, mean_pct, source: 'https://example.test', metric_note: 'test' });
test('백분위 구간에 평균·환산점수만 있는 자료를 섞지 않는다', () => {
  const result = latestPercentileResults([row('A', '경영', 2024, 90), row('A', '경영', 2025, null, 97), row('B', '경제', 2026, null, 96)]);
  assert.equal(result.length, 1);
  assert.equal(result[0].year, 2024);
  assert.equal(result[0].cut_pct70, 90);
  assert.ok(inPercentileBand(result[0], '90'));
  assert.ok(!inPercentileBand(result[0], '85'));
  assert.ok(!inPercentileBand(row('C', '사회', 2026, null, 95), '95'));
});
test('최근 공개 70% 컷과 구간 경계를 일관되게 사용한다', () => {
  const data = JSON.parse(readFileSync(new URL('../public/admissions-seoul/results.json', import.meta.url), 'utf8'));
  const latest = latestPercentileResults(data);
  assert.equal(new Set(latest.map(r => `${r.univ}/${r.dept}`)).size, latest.length);
  assert.ok(latest.every(r => r.cut_pct70 !== null && !data.some(other => other.univ === r.univ && other.dept === r.dept && other.cut_pct70 !== null && other.year > r.year)));
  assert.ok(inPercentileBand(row('A', '과', 2024, 95), '95'));
  assert.ok(!inPercentileBand(row('A', '과', 2024, 95), '90'));
  assert.ok(inPercentileBand(row('A', '과', 2024, 80), '80'));
  assert.ok(!inPercentileBand(row('A', '과', 2024, 80), 'under80'));
});
test('미리보기는 같은 대학만 반복하지 않고 실제 자료만 표시한다', () => {
  const data = [row('A', '경영', 2024, 96), row('A', '경제', 2024, 95.8), row('B', '사회', 2024, 95.5), row('C', '어문', 2024, 95)];
  const preview = previewPercentileResults(data);
  assert.deepEqual(preview.map(r => r.univ), ['A', 'B', 'C']);
  assert.ok(preview.every(r => data.includes(r)));
});

const directory = JSON.parse(readFileSync(new URL('../public/admissions-explorer/directory.json', import.meta.url))).records;
const majors = JSON.parse(readFileSync(new URL('../public/admissions-explorer/majors.json', import.meta.url)));
const unit = name => directory.find(r => r.department === name);

test('전체 학과 목록과 계열 예시는 원자료의 명시적 연결을 동일하게 사용한다', () => {
  for (const row of directory) {
    for (const profile of majors) assert.equal(belongsToProfile(row, profile.id), row.profileIds.includes(profile.id));
    assert.equal(new Set(row.profileIds).size, row.profileIds.length);
    for (const id of row.profileIds) assert.ok(majors.some(p => p.id === id));
  }
});
test('중국학 통합모집은 두 탐구 분야를 제공하고 선택한 맥락을 유지한다', () => {
  const china = unit('중국학대학(통합모집)');
  assert.deepEqual(china.profileIds, ['chinese-language', 'china-trade']);
  assert.equal(chooseUnitProfile(china, ''), '');
  for (const id of china.profileIds) assert.equal(chooseUnitProfile(china, id), id);
  assert.equal(unitAdmissionField(china), '');
  assert.equal(chooseUnitProfile(unit('경영학부-글로벌금융'), ''), '');
});
test('부분 문자열로 언어·사회과학·정책을 특정 전공으로 단정하지 않는다', () => {
  for (const name of ['언어학과', '독일언어문화학과', '프랑스언어문화학과', '일본언어문화학부', '중국언어문화학부']) {
    assert.ok(!belongsToProfile(unit(name), 'english'), name);
  }
  for (const row of directory.filter(r => r.department.includes('사회과학'))) assert.ok(!belongsToProfile(row, 'sociology'));
  assert.ok(!belongsToProfile(unit('보건정책관리학부'), 'politics'));
  assert.ok(belongsToProfile(unit('정책학과'), 'politics'));
  assert.ok(belongsToProfile(unit('ELLT학과'), 'english'));
  assert.ok(belongsToProfile(unit('영미문학문화학과'), 'english'));
  assert.ok(belongsToProfile(unit('중국외교통상학부'), 'china-trade'));
  assert.ok(!belongsToProfile({department: '영어사회정치교육', classification: '자유전공', profileIds: []}, 'english'));
});
test('단일 학과는 안내에 연결하고 미분류 어문과 자유전공의 전형 계열을 구분한다', () => {
  assert.equal(chooseUnitProfile(unit('경영학과'), 'english'), 'business');
  assert.equal(unitAdmissionField(unit('독일언어문화학과')), '인문·어문');
  assert.equal(unitAdmissionField(unit('교육공학과')), '교육');
  assert.equal(unitAdmissionField(unit('KU자유전공학부')), '');
});
