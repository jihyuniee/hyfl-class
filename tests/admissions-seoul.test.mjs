import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const read = name => JSON.parse(readFileSync(new URL(`../public/admissions-seoul/${name}.json`, import.meta.url)));
const results = read('results');
const plans = read('plans');

test('서울 입결의 출처·연도·백분위 단위를 보존한다', () => {
  assert.equal(results.length, 292);
  assert.equal(new Set(results.map(r => r.univ)).size, 11);
  assert.equal(new Set(results.map(r => `${r.univ}/${r.dept}/${r.year}`)).size, results.length);
  for (const r of results) {
    assert.ok([2024, 2025, 2026].includes(r.year));
    assert.match(r.source, /^https:\/\/(www\.adiga\.kr|iphak\.ssu\.ac\.kr|admission\.ssu\.ac\.kr)\//);
    for (const field of ['mean_pct', 'cut_pct70']) {
      assert.ok(r[field] === null || (r[field] >= 0 && r[field] <= 100));
    }
    if (r.source.includes('adiga.kr')) {
      assert.equal(Number(new URL(r.source).searchParams.get('searchSyr')), r.year + 1);
    }
    assert.ok(!/글로벌|ERICA|국제캠퍼스|미래캠퍼스/.test(r.univ));
  }
});

test('영역별 백분위 컷을 종합 백분위로 잘못 표시하지 않는다', () => {
  for (const r of results.filter(r => r.univ === '연세대' || (r.source.includes('adiga.kr') && r.year === 2025))) {
    assert.equal(r.cut_pct70, null);
  }
  const ssu = results.find(r => r.univ === '숭실대' && r.year === 2026 && r.dept === '경영학부');
  assert.equal(ssu.mean_pct, 86.96);
  assert.equal(ssu.cut_pct70, 86.5);
  assert.equal(ssu.cut_conv70, 903.87);
});

test('2028 반영 사례를 과거 입결과 별도 데이터로 유지한다', () => {
  assert.equal(plans.length, 30);
  assert.equal(new Set(plans.map(p => p[1])).size, 15);
  for (const p of plans) {
    assert.equal(p[0], 2028);
    assert.equal(p.length, 16);
    assert.match(p[15], /^https:\/\//);
    for (const i of [4, 5, 6, 7]) assert.ok(p[i] === null || (p[i] >= 0 && p[i] <= 100));
  }
});
