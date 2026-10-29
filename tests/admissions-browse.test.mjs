import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { latestPercentileResults, inPercentileBand, previewPercentileResults } from '../components/lib/admissionsBrowse.ts';
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
