"use client";

import Link from "next/link";
import { useState } from "react";
import resultsData from "@/public/admissions-seoul/results.json";
import plans from "@/public/admissions-seoul/plans.json";
import styles from "./seoul.module.css";
import PercentileBrowse from "@/components/admissions/PercentileBrowse";
import AdmissionsNav from "@/components/admissions/AdmissionsNav";
import ReferenceTable from "./ReferenceTable";
import directory from "@/public/admissions-explorer/directory.json";

type Result = {
  year: number; univ: string; dept: string; group: string | null;
  mean_pct: number | null; cut_pct70: number | null;
  cut_conv70: number | null; conv_max: number | null;
  metric_note: string; source: string; source_note: string;
};
const results: Result[] = resultsData;
const universities = [...directory.universities].sort((a, b) => a.localeCompare(b, "ko"));
const display = (n: number | null) => n === null ? "미기재" : n.toLocaleString("ko-KR", { maximumFractionDigits: 4 });
const matchUniversity = (actual: string, selected: string) => !selected || actual === selected || actual === `${selected} 서울`;

export default function SeoulAdmissions({ initialUniversity = "" }: { initialUniversity?: string }) {
  const [university, setUniversity] = useState(universities.includes(initialUniversity) ? initialUniversity : "");
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [metric, setMetric] = useState("");
  const [limit, setLimit] = useState(8);
  const filtered = results.filter(r => matchUniversity(r.univ, university)
    && `${r.univ} ${r.dept}`.includes(query.trim()) && (!year || r.year === Number(year))
    && (!metric || (metric === "percentile" ? r.cut_pct70 !== null : r.cut_conv70 !== null)));
  const selectedPlans = plans.filter(p => matchUniversity(String(p[1]), university));

  return <div className={styles.page}>
    <AdmissionsNav current="regular" />
    <header className={styles.hero}><span>정시 · 인문·사회·어문</span><h1>내 성적과 가까운 입결은?</h1><p>백분위 구간마다 어떤 대학·학과의 입결이 있는지 둘러보세요.</p></header>
    <p className={styles.date}>2024~2026 입결은 참고자료이며, 2028 합격을 보장하지 않아요.</p>

    <details className={styles.details}><summary>모의고사와 가까운 백분위 구간부터 보기</summary><PercentileBrowse /></details>

    <details open className={styles.details}><summary>대학·학과별 전체 입결과 환산점수 보기</summary><section className={styles.section} aria-labelledby="results-title">
      <h2 id="results-title">과거 정시 입결 찾아보기</h2><p>70% 컷: 최종등록자 100명 중 성적이 좋은 순서로 약 70번째 성적. 평균·최저 합격점·합격 확률과는 달라요.</p>
      <div className={styles.filters}>
        <label>대학<select value={university} onChange={e => { setUniversity(e.target.value); setLimit(8); }}><option value="">대학을 선택하세요</option>{universities.map(u => <option key={u}>{u}</option>)}</select></label>
        <label>학과·대학 검색<input value={query} placeholder="예: 중국, 경영, 정치" onChange={e => { setQuery(e.target.value); setLimit(8); }} /></label>
        <label>결과 학년도<select value={year} onChange={e => { setYear(e.target.value); setLimit(8); }}><option value="">전체</option>{[2026, 2025, 2024].map(y => <option key={y}>{y}</option>)}</select></label>
        <label>공개 지표<select value={metric} onChange={e => { setMetric(e.target.value); setLimit(8); }}><option value="">전체</option><option value="percentile">백분위 70% 컷 있음</option><option value="converted">환산점수 70% 컷 있음</option></select></label>
      </div>
      <div className={styles.downloads}><Link href={university ? `/admissions/susi?university=${encodeURIComponent(university)}` : "/admissions/susi"}>이 대학의 학과·탐구·수시 전형 →</Link><Link href="/admissions#student-questions">수시·정시 준비 비교 →</Link></div>
      <p role="status" className={styles.date}>{`검색 결과 ${filtered.length}개 · 실제 입결은 11개 대학 수록`}</p>
      {filtered.length === 0 ? <div className={styles.empty}>이 조건으로 수록한 입결이 없습니다. 합격 사례가 없다는 뜻은 아닙니다. 아래 시행계획과 기존 대학 자료에서 원문을 확인하세요.</div> : <div className={styles.tableWrap}><table>
        <caption>정시 일반전형 중심 선별 자료. ‘미기재’는 0점이 아닙니다. 가로로 넘겨 출처까지 확인하세요.</caption>
        <thead><tr><th scope="col">대학·모집단위</th><th scope="col">결과 연도</th><th scope="col">등록자 평균 백분위</th><th scope="col">백분위 70% 컷</th><th scope="col">환산점수 70% 컷</th><th scope="col">정의·출처</th></tr></thead>
        <tbody>{filtered.slice(0, limit).map(r => <tr key={`${r.univ}-${r.dept}-${r.year}`}>
          <th scope="row">{r.univ}<span>{r.dept}</span><small>{r.group || "모집군 미기재"}</small></th>
          <td data-label="결과 연도">{r.year}학년도</td><td data-label="등록자 평균 백분위">{display(r.mean_pct)}</td><td data-label="백분위 70% 컷">{display(r.cut_pct70)}</td><td data-label="환산점수 70% 컷">{display(r.cut_conv70)}{r.cut_conv70 !== null && <small> / {r.conv_max === null ? "만점 미기재" : `${display(r.conv_max)}점`}</small>}</td>
          <td><details><summary>지표 설명·원문</summary><p>{r.metric_note}</p><p>{r.source_note}</p><a href={r.source} target="_blank" rel="noopener noreferrer">대학 공개 원문 ↗</a></details></td>
        </tr>)}</tbody>
      </table></div>}
      {filtered.length > limit && <button className={styles.more} onClick={() => setLimit(n => n + 8)}>8개 더 보기 ({Math.min(limit, filtered.length)}/{filtered.length})</button>}
    </section></details>

    <details className={styles.details}><summary>표준점수 합 지원참고 예상점수 보기</summary><ReferenceTable university={university} query={query} /></details>

    <details className={styles.details}><summary>2028 정시 과목별 반영비율 둘러보기</summary><section className={styles.section} aria-labelledby="plans-title">
      <h2 id="plans-title">2028 정시에서는 무엇을 반영할까?</h2>
      <p>위의 대학 선택과 연동됩니다. 입결 검색어·연도·지표 필터는 아래 시행계획에 적용하지 않습니다. 15개 대학 30개 반영 사례를 추렸으며 모든 모집단위를 망라한 표는 아닙니다. 시행계획이므로 최종 모집요강을 다시 확인하세요.</p>
      {selectedPlans.length === 0 && <p className={styles.empty}>선택한 대학의 2028 반영방식은 이 요약에 없습니다. 대학 시행계획·최종 모집요강을 확인하세요.</p>}
      <div className={styles.plans}>{selectedPlans.map(p => <details key={`${p[1]}-${p[2]}-${p[3]}`} className={styles.details}>
        <summary>{p[1]} · {p[2]}<small>{p[3]}</small></summary>
        <dl><dt>국어 / 수학 / 영어 / 탐구</dt><dd>{[4, 5, 6, 7].map(i => p[i] === null ? "별도 산식" : `${Number(p[i]).toFixed(1).replace(/\.0$/, "")}%`).join(" / ")}</dd>
          <dt>탐구·배점 상세</dt><dd>{p[8]}</dd><dt>수능 / 기타 평가</dt><dd>{p[9]}% / {p[10]}</dd><dt>활용 지표</dt><dd>{p[11]}</dd><dt>영어</dt><dd>{p[12]}</dd><dt>살펴볼 점</dt><dd>{p[13]}</dd></dl>
        <a href={String(p[15])} target="_blank" rel="noopener noreferrer">시행계획 사본 · {p[14]} ↗</a>
      </details>)}</div>
    </section></details>

    <details className={styles.details}><summary>백분위·표준점수·70% 컷, 무슨 뜻일까?</summary><section className={styles.section} aria-labelledby="score-title">
      <h2 id="score-title">성적표와 입결에서 먼저 구분할 6가지</h2>
      <div className={styles.glossary}>
        <article><h3>원점수</h3><p>문제를 맞혀 얻은 점수예요. 국어 원점수 80점은 100점 만점에서 얻은 80점입니다.</p></article>
        <article><h3>표준점수</h3><p>평균에서 얼마나 떨어져 있는지를 점수의 흩어짐까지 고려해 나타낸 점수예요. 원점수의 100점 만점과는 다른 척도라 100점을 넘을 수 있고, 최고점은 시험마다 달라집니다.</p></article>
        <article><h3>백분위</h3><p>나보다 낮은 점수를 받은 수험생의 비율을 나타내요. 백분위 90은 대략 상위 10% 수준이라는 뜻이지, 100점 만점에 90점을 맞았다는 뜻이 아닙니다.</p></article>
        <article><h3>등급</h3><p>성적을 몇 개 구간으로 묶은 값이에요. 수능 국어·수학 등 상대평가와 영어·한국사 절대평가의 기준이 다릅니다. 내신 등급과 수능 등급도 별개예요.</p></article>
        <article><h3>대학 환산점수</h3><p>대학이 정한 과목별 비율·가산점·영어 등급표 등을 적용한 점수예요. A대 900점과 B대 900점은 같은 실력을 뜻하지 않습니다.</p></article>
        <article><h3>등록자 70% 컷</h3><p>최종등록자를 해당 지표 순으로 놓았을 때 70% 지점의 성적이에요. 합격자 중 최저점이나 합격 확률 70%를 뜻하지 않습니다. 평균 성적과도 달라요.</p></article>
      </div>
      <details className={styles.details}><summary>‘흩어짐을 고려한다’는 말이 궁금하다면</summary>
        <p>평균이 모두 60점인 두 시험에서 내가 80점을 받았다고 해 봅시다. 점수들이 평균 주변에 촘촘하면 평균보다 20점 높은 것이 더 드문 성적이에요. 점수들이 넓게 퍼져 있으면 같은 20점 차이가 상대적으로 작습니다. 이 흩어진 정도를 수치로 나타낸 것이 표준편차예요.</p>
        <p>개념 설명용으로 국어·수학 척도의 식 100 + 20 × (점수 − 평균) ÷ 표준편차를 적용하면, 평균 60·표준편차 10·내 점수 80은 표점 140, 표준편차 20이면 표점 120이 됩니다. 실제 수능은 시험 체제에 따른 산출·조정·반올림 절차가 있어 원점수 하나로 정확한 표점을 계산할 수 없습니다.</p>
      </details>
    </section></details>

    <details className={styles.details}><summary>상담 준비·자료 내려받기</summary><section className={styles.section} aria-labelledby="next-title">
      <h2 id="next-title">상담 전에 이렇게 준비해요</h2>
      <ol><li>최근 모의고사 2~3회의 과목별 표준점수·백분위·등급을 가져와요.</li><li>관심 대학이나 학과를 골라 배우고 싶은 내용도 함께 살펴봐요.</li><li>내 강점 과목이 지원 연도의 산식에서 얼마나 반영되는지 확인해요.</li><li>정시의 학생부 평가 유무, 수시의 지원자격·추천·수능최저·면접을 따로 확인해요.</li></ol>
      <details className={styles.details}><summary>외고 학생은 학종만 지원할 수 있나요?</summary><p>아니요. 전형마다 외고 지원 가능 여부와 추천 자격이 달라요. 교과전형은 지원자격과 등급 환산방식부터 확인해야 합니다. 학종은 등급 외에 과목 이수와 수업·탐구 내용 등을 함께 평가하므로 외고 학생이 검토할 수 있는 경로입니다. 학교 유형이나 내신 한 숫자만으로 합격 여부를 정할 수는 없어요.</p></details>
      <div className={styles.downloads}><a href="/admissions-seoul/results.csv" download>정시 입결 292개 기록 CSV ↓</a><a href="/admissions-seoul/counseling-2028.xlsx" download>교사용 상담표·2028 반영방식 XLSX ↓</a><Link href={university ? `/admissions/susi?university=${encodeURIComponent(university)}` : "/admissions/susi"}>관심 대학의 학과·수시 전형 →</Link></div>
      <p className={styles.date}>상담용 XLSX에는 11개 대학 292개 입결과 15개 대학 반영방식·빈 상담표·자료 읽는 법을 담았습니다. 학생 개인 성적은 수록하지 않았습니다.</p>
      <p className={styles.date}>서울 소재 모집단위만 선별했습니다. 경희대 국제캠퍼스·한국외대 글로벌캠퍼스 등은 제외합니다. 대학별 백분위 산식과 공개 연도가 달라 이 표로 대학 순위를 매길 수 없습니다.</p>
    </section></details>
  </div>;
}
