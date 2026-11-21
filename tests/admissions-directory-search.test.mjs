import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { filterAdmissionsDirectory } from "../components/lib/admissionsDirectorySearch.ts";
import { filterAdmissionResults } from "../components/lib/admissionsBrowse.ts";

const load = relative => JSON.parse(readFileSync(new URL(relative, import.meta.url), "utf8"));
const schools = load("../public/admissions-explorer/seoul-universities.json").records;
const results = load("../public/admissions-seoul/results.json");
const guides = load("../public/admissions-explorer/majors.json");
const find = query => filterAdmissionsDirectory(query, schools, results, guides);

test("여러 단어로 대학과 학과를 함께 좁히고 연도별 중복은 제거한다", () => {
  const { historicalUnits } = find("고려대학교 경영");
  assert.ok(historicalUnits.length > 0);
  assert.ok(historicalUnits.every(row => row.univ === "고려대" && row.dept.includes("경영")));
  assert.equal(new Set(historicalUnits.map(row => row.dept)).size, historicalUnits.length);
  for (const unit of historicalUnits) {
    assert.ok(filterAdmissionResults(results, { university: unit.univ, query: unit.dept }).length > 0);
  }
});

test("실제 학교와 과거 모집단위를 구분하고 외대 서울 자료를 연결한다", () => {
  const { schools, historicalUnits } = find("한국외대");
  assert.ok(schools.some(school => school.id === "한국외대"));
  assert.ok(historicalUnits.some(row => row.univ === "한국외대 서울"));
  assert.ok(filterAdmissionResults(results, { university: "한국외대", query: historicalUnits[0].dept }).length > 0);
});

test("질문이나 없는 이름에 답을 만들어내지 않고 전공 별칭은 찾는다", () => {
  assert.deepEqual(find("..."), { schools: [], historicalUnits: [], guides: [] });
  assert.deepEqual(find("제가 어디 합격할까요"), { schools: [], historicalUnits: [], guides: [] });
  assert.ok(find("중어중문").guides.some(guide => guide.id === "chinese-language"));
});
