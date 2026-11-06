"use client";

import { useState } from "react";
import Link from "next/link";
import AdmissionsNav from "@/components/admissions/AdmissionsNav";
import { selectSusiPlans } from "@/components/lib/admissionsExplorer";
import directory from "@/public/admissions-explorer/directory.json";
import majors from "@/public/admissions-explorer/majors.json";
import planData from "@/public/admissions-2028/records.json";
import senIndex from "@/public/admissions-2028/sen-universities.json";
import styles from "@/components/admissions/explorer.module.css";

export default function SusiExplorer({ initialUniversity = "", initialProfile = "", initialQuery = "" }: { initialUniversity?: string; initialProfile?: string; initialQuery?: string }) {
  const [university, setUniversity] = useState(directory.universities.includes(initialUniversity) ? initialUniversity : "");
  const [query, setQuery] = useState(initialQuery);
  const [profileId, setProfileId] = useState(majors.some(p => p.id === initialProfile) ? initialProfile : "");
  const [field, setField] = useState(majors.find(p => p.id === initialProfile)?.field || "");
  const [category, setCategory] = useState("");
  const [minimum, setMinimum] = useState("");
  const [interview, setInterview] = useState("");
  const [planLimit, setPlanLimit] = useState(8);
  const activeUniversity = university;
  const records = selectSusiPlans(planData.records, activeUniversity, field, category, minimum)
    .filter(r => !interview || r.hasInterview === (interview === "있음"));
  const sourcePage = senIndex.find(r => r.name === activeUniversity)?.page;
  const guideProfiles = majors.filter(p => (!profileId || p.id === profileId) && (!query.trim() || `${p.title} ${p.field}`.includes(query.trim())));

  return <div className={styles.page}>
    <AdmissionsNav current="early" />
    <header className={styles.hero}><span className={styles.yearPill}>2028학년도 · 수시</span><h1>우리에게 적용되는 전형부터.</h1><p>2028 시행계획의 전형방법·수능최저·면접과 원문 지원자격을 확인하세요.</p></header>
    <nav className={styles.pageJump} aria-label="학과·수시 바로가기"><a href="#plans">2028 수시 전형</a><a href="#directory">전공 공부 내용</a><Link href="/admissions#questions">궁금한 질문</Link></nav>
    <section id="plans" className={styles.section} aria-labelledby="susi-heading">
      <h2 id="susi-heading">2028 수시 시행계획 · 수능최저·면접</h2>
      <p>교육청 자료·입학처 시행계획에서 확인한 <b>대학 공통 전형 요약</b>입니다. 해당 학과 모집 여부와 외고·추천 조건은 전형별 지원자격 원문을 확인하세요.</p>
      <div className={`${styles.filters} ${styles.planFilters}`}>
        <label>전형 대학<select value={university} onChange={e => { setUniversity(e.target.value); setPlanLimit(8); }}><option value="">전체 대학</option>{directory.universities.map(u => <option key={u}>{u}</option>)}</select></label>
        <label>전형 유형<select value={category} onChange={e => { setCategory(e.target.value); setPlanLimit(8); }}><option value="">학종·교과·논술 전체</option><option>학생부종합</option><option>학생부교과</option><option>논술</option></select></label>
        <label>수능최저<select value={minimum} onChange={e => { setMinimum(e.target.value); setPlanLimit(8); }}><option value="">전체</option><option>있음</option><option>없음</option></select></label>
        <label>면접<select value={interview} onChange={e => { setInterview(e.target.value); setPlanLimit(8); }}><option value="">전체</option><option>있음</option><option>없음</option></select></label>
        <label>전형 탐색 계열<select value={field} onChange={e => { setField(e.target.value); setPlanLimit(8); }}><option value="">전체 계열</option><option>인문·어문</option><option>사회·상경</option><option>교육</option></select></label>
      </div>
      <div className={styles.resultBar}><p role="status">{activeUniversity || "전체 대학"} · {field || "전체 계열"} · {records.length}개 전형</p><button type="button" className={styles.reset} onClick={() => { setUniversity(""); setCategory(""); setMinimum(""); setInterview(""); setField(""); setPlanLimit(8); }}>전형 조건 초기화</button></div>
      <div className={styles.planGrid}>{records.slice(0, planLimit).map(r => <article className={styles.plan} key={r.id}>
        <span className={styles.badge}>{r.category}</span><span className={styles.badge}>{r.hasInterview ? "면접 있음" : "면접 없음"}</span><span className={styles.badge}>{r.minimumScope || (r.hasMinimum ? "최저 있음" : "최저 없음")}</span>
        <h3>{r.university}</h3><h4>{r.admission}</h4>
        <dl><dt>전형 방법</dt><dd>{r.method}</dd><dt>수능최저 · 필수영역·탐구·한국사 조건까지</dt><dd>{r.minimum}</dd></dl>
        {r.university.includes("글로벌") && <p className={styles.warning}>서울·글로벌 공통 안내입니다. 서울캠퍼스 조건과 모집단위를 확인하세요.</p>}
        {r.verificationNote && <p className={styles.warning}>원문 대조 필요: {r.verificationNote}</p>}
        <details><summary>지원자격·추천·예외 조건</summary><p>{r.notes || "이 요약에는 세부 지원자격이 기재되지 않았습니다. 외고 지원 가능 여부·졸업연도·학교장추천 조건은 원문에서 확인하세요."}</p></details>
        <div className={styles.source}><p>{r.sourceLabel || "교육청 자료"} · 확인 {r.reviewedAt || "자료 표기일 확인"} · 2028 시행계획 요약</p>
          {r.sourceUrl ? <a href={`${r.sourceUrl}${r.sourcePage ? `#page=${r.sourcePage}` : ""}`} target="_blank" rel="noopener noreferrer">전형 근거 원문 ↗</a> : sourcePage ? <a href={`/admissions-2028/sen-preview-20261014.pdf#page=${sourcePage}`} target="_blank" rel="noopener noreferrer">최신 SEN 대학별 표에서 재확인 ↗</a> : <Link href="/admissions#resources">대학 원문 자료 찾기 →</Link>}
        </div>
      </article>)}</div>
      {records.length > planLimit && <button type="button" className={styles.more} onClick={() => setPlanLimit(n => n + 8)}>전형 8개 더 보기 ({Math.min(planLimit, records.length)}/{records.length})</button>}
      {records.length === 0 && <div className={styles.empty}><p>이 조건으로 확인한 전형 요약이 없어요. 지원 가능한 전형이 없다는 뜻은 아니에요.</p>{sourcePage ? <a href={`/admissions-2028/sen-preview-20261014.pdf#page=${sourcePage}`} target="_blank" rel="noopener noreferrer">{activeUniversity} 교육청 원문 바로 확인 ↗</a> : <Link href="/admissions#student-questions">공식 자료에서 확인 →</Link>}</div>}
      <p className={styles.muted}>과거 9등급 내신과 현재 5등급 내신은 그대로 비교할 수 없어요. 학종은 내신 외에 이수 과목·수업·탐구도 함께 살펴봐요.</p>
    </section>

    <section id="directory" className={styles.section} aria-labelledby="directory-heading">
      <div className={styles.sectionHeading}><h2 id="directory-heading">관심 분야에서 무엇을 배울까?</h2></div>
      <p className={styles.scopeNote}>아래는 대학 공식 교육과정을 살펴보는 전공 탐색 자료입니다. 적용 여부가 확인되지 않은 지원참고표의 학과 목록은 표시하지 않습니다. 2028 모집 학과·인원은 대학 시행계획과 최종 모집요강에서 확인하세요.</p>
      <div className={styles.compactFields} role="group" aria-label="관심 분야"><button type="button" aria-pressed={!profileId} onClick={() => { setProfileId(""); setQuery(""); }}>전체 분야</button>{majors.map(p => <button key={p.id} type="button" aria-pressed={profileId === p.id} onClick={() => { setProfileId(p.id); setQuery(""); }}>{p.title}</button>)}</div>
      <label className={styles.searchLabel}>분야 이름 검색<input className={styles.universitySelect} type="search" value={query} placeholder="예: 중국, 경영, 정치" onChange={e => { setQuery(e.target.value); setProfileId(""); }} /></label>
      <div className={styles.planGrid}>{guideProfiles.map(p => <article className={styles.selection} key={p.id}><span className={styles.eyebrow}>{p.field}</span><h3>{p.title}</h3><p className={styles.muted}>표기된 대학·학과의 교육과정 예시입니다. 다른 대학의 같은 이름 학과나 2028 모집 여부를 의미하지 않습니다.</p>{p.examples.map(ex => <div className={styles.source} key={ex.url}><a href={ex.url} target="_blank" rel="noopener noreferrer">{ex.university} · {ex.department} 공식 안내 ↗</a><p className={styles.muted}>교과목과 교육과정은 연결된 대학 공식 안내에서 확인하세요.</p></div>)}</article>)}</div>
      {guideProfiles.length === 0 && <p className={styles.empty}>해당 이름의 교육과정 예시는 수록하지 않았어요. 대학의 학과 안내와 2028 모집단위 원문을 확인하세요.</p>}
    </section>
  </div>;
}
