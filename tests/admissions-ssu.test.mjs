import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const results = JSON.parse(read('../public/admissions-seoul/results.json'));
const official = JSON.parse(read('./fixtures/ssu-official-20261030.json'));
const ssu = results.filter(r => r.univ === '숭실대');

// This fixture is transcribed from the official PDF, independently of results.json.
// Printed pp.28/29: 2026 results; p.33: 2024/2025/2026 mean percentiles.
test('숭실대 21개 모집단위 63건을 공식 PDF 대조표와 비교한다', () => {
  assert.equal(official.rows.length, 21);
  assert.equal(ssu.length, 63);
  const fields = ['group', 'n', 'competition', 'wait', 'mean_conv', 'cut_conv70', 'mean_pct', 'cut_pct70'];
  for (const expected of official.rows) {
    for (const year of [2024, 2025, 2026]) {
      const row = ssu.find(r => r.dept === expected.dept && r.year === year);
      assert.ok(row, expected.dept + '/' + year);
      assert.equal(row.mean_pct, expected.trend[year], expected.dept + '/' + year + '/mean_pct');
      assert.equal(row.competition, expected.competition_trend[year], expected.dept + '/' + year + '/competition');
      if (year === 2026) {
        for (const field of fields) assert.equal(row[field], expected[field], expected.dept + '/' + field);
        // Corroborated by the 2026 plan, not by the 2027 guide section.
        assert.equal(row.conv_max, official.conv_max);
      } else {
        // The trend table does not supply these fields; do not copy 2026 backwards.
        for (const field of ['group', 'n', 'cut_pct70', 'cut_conv70', 'conv_max']) assert.equal(row[field], null);
      }
    }
  }
});

function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && (c === ',' || c === '\n')) {
      row.push(cell.replace(/\r$/, '')); cell = '';
      if (c === '\n') { rows.push(row); row = []; }
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

test('숭실대 CSV 다운로드와 화면용 JSON의 값·출처가 일치한다', () => {
  const csv = parseCSV(read('../public/admissions-seoul/results.csv')).slice(1).filter(r => r[0] === '숭실대');
  assert.equal(csv.length, ssu.length);
  for (const cells of csv) {
    const row = ssu.find(r => r.dept === cells[1] && r.year === Number(cells[2]));
    assert.ok(row);
    assert.equal(row.group, cells[3] || null);
    for (const [i, field] of [[4, 'n'], [5, 'mean_pct'], [6, 'cut_pct70'], [7, 'cut_conv70'], [8, 'conv_max']]) {
      assert.equal(row[field], cells[i] === '' ? null : Number(cells[i]), row.dept + '/' + row.year + '/' + field);
    }
    for (const [i, field] of [[9, 'metric_note'], [10, 'source'], [11, 'source_note']]) assert.equal(row[field], cells[i]);
  }
});

test('숭실대 원문 링크는 해당 결과 쪽수와 게시물 이력을 보존한다', () => {
  for (const row of ssu) {
    assert.equal(row.source, official.pdf_url + '#page=' + (row.year === 2026 ? 28 : 33));
    assert.ok(row.source_note.includes(official.board_url));
    assert.ok(row.source_note.includes('2026-08-24'));
    if (row.year !== 2026) assert.ok(row.source_note.includes('미기재'));
  }
});
