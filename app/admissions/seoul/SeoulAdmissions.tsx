"use client";

import Link from "next/link";
import { useState } from "react";
import results from "@/public/admissions-seoul/results.json";
import plans from "@/public/admissions-seoul/plans.json";
import directory from "@/public/admissions-explorer/directory.json";
import AdmissionsNav from "@/components/admissions/AdmissionsNav";
import styles from "@/components/admissions/explorer.module.css";
import local from "./seoul.module.css";
import { filterAdmissionResults } from "@/components/lib/admissionsBrowse";

const universities = [...directory.universities].sort((a, b) => a.localeCompare(b, "ko"));
const display = (n: number | null) => n === null ? "—" : n.toLocaleString("ko-KR", { maximumFractionDigits: 4 });
const matchUniversity = (actual: string, selected: string) => !selected || actual === selected || actual === `${selected} 서울`;

export default function SeoulAdmissions({ initialUniversity = "", initialQuery = "" }: { initialUniversity?: string; initialQuery?: string }) {
  const [university, setUniversity] = useState(universities.includes(initialUniversity) ? initialUniversity : "");
  const [query, setQuery] = useState(initialQuery);
  const [year, setYear] = useState("");
  const [metric, setMetric] = useState("");
  const [band, setBand] = useState("");
  const [limit, setLimit] = useState(9);
  const filtered = filterAdmissionResults(results, { university, query, year, metric, band });
  const selectedPlans = plans.filter(p => matchUniversity(String(p[1]), university));
  const counterpart = `/admissions/susi${university ? `?university=${encodeURIComponent(university)}` : ""}`;

  return <div className={styles.page}>
    <AdmissionsNav current="regular" />
    <header className={styles.hero}><span className={styles.eyebrow}>정시 · 인문·사회·어문</span><h1>지난 입결을 찾고, 반영방법을 확인해요.</h1><p>공개된 실제 성적과 2028 전형방법을 구분해 살펴보세요.</p></header>
    <nav className={styles.pageJump} aria-label="정시 자료 바로가기"><a href="#results">과거 정시 입결</a><a href="#plans">2028 과목 반영방법</a><a href="#score-guide">점수 읽는 법</a></nav>

    <section id="results" className={styles.section} aria-labelledby="results-title">
      <div className={styles.sectionHeading}><h2 id="results-title">대학·학과로 정시 입결 찾기</h2><span>11개 대학 · 2024~2026학년도</span></div>
      <p>평균과 70% 컷은 서로 다른 지표예요. ‘—’는 원문에 수록하지 않은 값입니다. 과거 점수로 2028 지원 가능성을 판정하지 않아요.</p>
      <div className={local.filters}>
        <label>대학<select value={university} onChange={e => { setUniversity(e.target.value); setLimit(9); }}><option value="">전체 대학</option>{universities.map(u => <option key={u}>{u}</option>)}</select></label>
        <label>학과·대학 검색<input type="search" value={query} placeholder="예: 중국, 경영, 정치" onChange={e => { setQuery(e.target.value); setLimit(9); }} /></label>
        <label>결과 학년도<select value={year} onChange={e => { setYear(e.target.value); setLimit(9); }}><option value="">전체 연도</option>{[2026, 2025, 2024].map(y => <option key={y}>{y}</option>)}</select></label>
        <label>공개 지표<select value={metric} onChange={e => { setMetric(e.target.value); setLimit(9); }}><option value="">전체 지표</option><option value="percentile">백분위 70% 컷 있음</option><option value="converted">환산점수 70% 컷 있음</option><option value="mean">평균 백분위 있음</option></select></label>
      </div>
      <div className={styles.compactFields} role="group" aria-label="공개 백분위 70% 컷 구간"><button type="button" aria-pressed={!band} onClick={() => { setBand(""); setLimit(9); }}>전체 점수 구간</button>{[["95", "95 이상"], ["90", "90~95 미만"], ["85", "85~90 미만"], ["80", "80~85 미만"], ["under80", "80 미만"]].map(([id, label]) => <button key={id} type="button" aria-pressed={band === id} onClick={() => { setBand(id); setLimit(9); }}>{label}</button>)}</div>
      <p className={styles.muted}>점수 구간은 대학이 공개한 백분위 70% 컷 기준입니다. 평균·환산점수만 공개한 기록은 구간 검색에 포함하지 않아요.</p>
      <div className={styles.resultBar}><p role="status">검색 결과 {filtered.length}개 · 최근 결과 학년도부터 표시</p><button type="button" className={styles.reset} onClick={() => { setUniversity(""); setQuery(""); setYear(""); setMetric(""); setBand(""); setLimit(9); }}>조건 초기화</button></div>
      {filtered.length === 0 ? <div className={styles.empty}><p>이 조건으로 수록된 입결이 없어요. 합격 사례나 지원 가능한 대학이 없다는 뜻은 아니에요.</p><Link href={counterpart + "#plans"}>이 대학의 수시 전형 확인 →</Link><p><a href="https://www.adiga.kr" target="_blank" rel="noopener noreferrer">어디가에서 공개 입결 찾기 ↗</a></p></div> : <div className={local.resultCards}>{filtered.slice(0, limit).map(r => <article key={`${r.univ}-${r.dept}-${r.year}`} className={local.resultCard}>
        <div className={local.resultTop}><span>{r.univ}</span><span>{r.year}학년도</span></div><h3>{r.dept}</h3><p className={styles.muted}>{r.group || "모집군 미기재"}</p>
        <dl className={local.metrics}><div><dt>평균 백분위</dt><dd>{display(r.mean_pct)}</dd></div><div><dt>백분위 70% 컷</dt><dd>{display(r.cut_pct70)}</dd></div><div><dt>환산점수 70% 컷</dt><dd>{display(r.cut_conv70)}{r.cut_conv70 !== null && <small> / {r.conv_max === null ? "만점 미기재" : `${display(r.conv_max)}점`}</small>}</dd></div></dl>
        <details className={local.resultSource}><summary>이 점수의 기준·출처</summary><p>{r.metric_note}</p><p>{r.source_note}</p><a href={r.source} target="_blank" rel="noopener noreferrer">공개 입결 원문 ↗</a></details>
      </article>)}</div>}
      {filtered.length > limit && <button type="button" className={styles.more} onClick={() => setLimit(n => n + 9)}>입결 9개 더 보기 ({Math.min(limit, filtered.length)}/{filtered.length})</button>}
      <div className={styles.tools}><Link href={counterpart + "#directory"}>{university || "관심 대학"}의 학과·수시 전형 →</Link><a href="/admissions-seoul/results.csv" download>공개 입결 CSV ↓</a></div>
    </section>

    <section id="plans" className={styles.section} aria-labelledby="plans-title">
      <div className={styles.sectionHeading}><h2 id="plans-title">2028 정시, 어떤 과목을 반영할까?</h2><span>시행계획 · 최종 모집요강 확인 필요</span></div>
      <p>위에서 선택한 대학과 연동됩니다. 학과 검색어·과거 결과 연도·점수 구간은 이 표에 적용하지 않아요. 전형과 모집단위에 따라 반영방법이 달라집니다.</p>
      <label className={styles.searchLabel}>반영방법 대학<select className={styles.universitySelect} value={university} onChange={e => { setUniversity(e.target.value); setLimit(9); }}><option value="">전체 대학</option>{universities.map(u => <option key={u}>{u}</option>)}</select></label>
      {selectedPlans.length === 0 && <p className={styles.empty}>이 대학의 반영방법 요약은 수록하지 않았어요. 대학의 2028 시행계획 원문을 확인하세요.</p>}
      <div className={styles.planGrid}>{selectedPlans.map(p => <details key={`${p[1]}-${p[2]}-${p[3]}`} className={local.planCard}>
        <summary><span>{p[1]} · {p[2]}</span><small>{p[3]}</small></summary>
        <dl><dt>국어 / 수학 / 영어 / 탐구</dt><dd>{[4, 5, 6, 7].map(i => p[i] === null ? "별도 산식" : `${Number(p[i]).toFixed(1).replace(/\.0$/, "")}%`).join(" / ")}</dd><dt>탐구·배점</dt><dd>{p[8]}</dd><dt>수능 / 기타 평가</dt><dd>{p[9]}% / {p[10]}</dd><dt>활용 지표</dt><dd>{p[11]}</dd><dt>영어</dt><dd>{p[12]}</dd><dt>적용 범위</dt><dd>{p[13]}</dd></dl>
        <a href={String(p[15])} target="_blank" rel="noopener noreferrer">시행계획 사본 · {p[14]} ↗</a>
      </details>)}</div>
    </section>
    <section id="score-guide" className={styles.section} aria-labelledby="guide-title"><h2 id="guide-title">성적표와 입결, 이렇게 읽어요</h2>
      {[
        ["백분위와 원점수는 어떻게 다른가요?", "원점수는 문제를 맞혀 얻은 점수예요. 백분위는 나보다 낮은 점수를 받은 수험생의 비율을 나타내요. 백분위 90을 원점수 90점으로 바꿀 수는 없어요."],
        ["70% 컷과 평균은 어떻게 다른가요?", "70% 컷은 최종등록자를 해당 지표 순으로 놓았을 때 70% 지점의 성적이에요. 평균이나 마지막 합격자의 점수가 아니며, 합격 확률 70%라는 뜻도 아니에요."],
        ["대학 환산점수를 백분위로 바꿀 수 있나요?", "대학 환산점수는 대학별 반영비율·환산표·가산점 등을 적용한 값이에요. 만점으로 나눠 백분위로 바꿀 수 없고, 서로 다른 대학의 같은 환산점수를 그대로 비교할 수도 없어요."],
        ["표준점수만 넣으면 지원 대학을 알 수 있나요?", "표준점수 합만으로는 대학별 반영방법·탐구 변환점수·영어·학생부 반영을 적용할 수 없어요. 이 화면에서는 대학의 공개 입결과 시행계획을 별도로 확인할 수 있어요."],
      ].map(([title, text]) => <details className={styles.faq} key={title}><summary>{title}</summary><p>{text}</p></details>)}
    </section>
  </div>;
}
