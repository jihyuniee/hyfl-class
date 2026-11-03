import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { filterAdmissionResults } from '../components/lib/admissionsBrowse.ts';
import { findAdmissionsMatches } from '../components/lib/admissionsSearch.ts';
import { selectSusiPlans } from '../components/lib/admissionsExplorer.ts';
const json = path => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const results = json('public/admissions-seoul/results.json');
const fixture = json('tests/fixtures/admissions-official-20261104.json');
const directory = json('public/admissions-explorer/directory.json');
const plans = json('public/admissions-2028/records.json').records;

test('공식 원문에서 별도 추출한 292개 기록의 수록 수치를 전건 대조한다', () => {
  assert.equal(fixture.records.length, 292);
  assert.equal(new Set(fixture.records.map(r => `${r.univ}/${r.dept}/${r.year}`)).size, 292);
  for (const expected of fixture.records) {
    const row = results.find(r => r.univ === expected.univ && r.dept === expected.dept && r.year === expected.year);
    assert.ok(row, `${expected.univ}/${expected.dept}/${expected.year}`);
    for (const [field, value] of Object.entries(expected.values)) assert.equal(row[field], value, `${row.univ}/${row.dept}/${row.year}/${field}`);
  }
});

test('대학·학과·연도·지표를 실제 화면의 검색 함수로 조합한다', () => {
  const filters = { university: '숭실대', query: '  경 영  ', year: '2026', metric: 'percentile', band: '' };
  const found = filterAdmissionResults(results, filters);
  assert.equal(found.length, 1);
  assert.deepEqual([found[0].mean_pct, found[0].cut_pct70, found[0].cut_conv70], [86.96, 86.5, 903.87]);
  assert.equal(filterAdmissionResults(results, { ...filters, year: '2025' }).length, 0);
  assert.equal(filterAdmissionResults(results, { ...filters, university: '한국외대', query: '', year: '', metric: '' }).length, 85);
  assert.equal(filterAdmissionResults(results, { ...filters, university: '건국대' }).length, 0);
});

test('공개 컷 구간 검색에 평균만 있는 기록을 섞지 않고 최근 학년도를 우선한다', () => {
  const found = filterAdmissionResults(results, { university: '', query: '', year: '', metric: '', band: '85' });
  assert.ok(found.length > 0);
  assert.ok(found.every(r => r.cut_pct70 >= 85 && r.cut_pct70 < 90));
  assert.ok(found.every((r, i) => i === 0 || found[i-1].year >= r.year));
});

test('통합 검색은 대학별 수시·정시와 학과 검색어가 보존된 목적지로 연결한다', () => {
  assert.equal(findAdmissionsMatches('  한국 외대 ', directory.records).filter(m => m.kind === '대학').length, 2);
  const matches = findAdmissionsMatches('중어중문', directory.records);
  assert.ok(matches.length > 0);
  for (const m of matches.filter(m => m.kind === '학과')) {
    const url = new URL(m.href, 'https://example.test');
    assert.equal(url.pathname, '/admissions/susi');
    assert.ok(url.searchParams.get('q').includes('중어중문'));
  }
  assert.deepEqual(findAdmissionsMatches('없는검색어abcdefgh', directory.records), []);
  assert.ok(findAdmissionsMatches('수능최저', directory.records).some(m => m.kind === '궁금한 질문'));
});

test('자료 충돌 및 미대조 수시 카드가 검색 필터를 바꿔도 나타나지 않는다', () => {
  for (const category of ['', '학생부종합', '학생부교과', '논술']) {
    for (const minimum of ['', '있음', '없음']) {
      const found = selectSusiPlans(plans, '', '', category, minimum);
      assert.ok(found.every(r => !r.verificationNote && r.sourceKey !== 'incheon-20260715'));
    }
  }
});
