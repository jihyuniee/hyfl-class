import assert from "node:assert/strict";
import test from "node:test";
import { legacyRegularScoreDestination } from "../components/lib/admissionsBrowse.ts";

test("이전 점수표 해시는 검색 조건을 보존한 명시적 점수 메뉴로 이동한다", () => {
  const target = legacyRegularScoreDestination("?university=고려대&q=경영&year=2025&section=plans", "#mock-score");
  const url = new URL(target, "https://test.invalid");
  assert.equal(url.pathname, "/admissions/seoul");
  assert.deepEqual(Object.fromEntries(url.searchParams), { university: "고려대", q: "경영", year: "2025", section: "mock-score" });
  assert.equal(url.hash, "");
});

test("정시 자료 앵커와 명시적으로 연 점수 메뉴는 변경하지 않는다", () => {
  for (const hash of ["", "#results", "#plans", "#universities", "#score-guide"]) {
    assert.equal(legacyRegularScoreDestination("?university=한국외대", hash), null);
  }
  assert.equal(legacyRegularScoreDestination("?section=mock-score", "#mock-score"), null);
});
