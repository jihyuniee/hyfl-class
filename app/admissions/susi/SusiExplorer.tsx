"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdmissionsNav from "@/components/admissions/AdmissionsNav";
import { belongsToProfile, chooseUnitProfile, unitAdmissionField } from "@/components/lib/admissionsBrowse";
import { selectSusiPlans } from "@/components/lib/admissionsExplorer";
import directory from "@/public/admissions-explorer/directory.json";
import majors from "@/public/admissions-explorer/majors.json";
import planData from "@/public/admissions-2028/records.json";
import senIndex from "@/public/admissions-2028/sen-universities.json";
import styles from "@/components/admissions/explorer.module.css";

export default function SusiExplorer({ initialUniversity = "", initialProfile = "", initialQuery = "" }: { initialUniversity?: string; initialProfile?: string; initialQuery?: string }) {
  const [university, setUniversity] = useState(directory.universities.includes(initialUniversity) ? initialUniversity : "");
  const [query, setQuery] = useState(initialQuery);
  const [field, setField] = useState(majors.find(p => p.id === initialProfile)?.field || "");
  const [category, setCategory] = useState("");
  const [minimum, setMinimum] = useState("");
  const [interview, setInterview] = useState("");
  const [planLimit, setPlanLimit] = useState(8);
  const [limit, setLimit] = useState(12);
  const [unitKey, setUnitKey] = useState("");
  const [profileId, setProfileId] = useState(majors.some(p => p.id === initialProfile) ? initialProfile : "");
  const units = directory.records.filter(r => (!profileId || belongsToProfile(r, profileId)) && (!university || r.university === university)
    && `${r.university} ${r.department} ${r.classification}`.toLocaleLowerCase("ko").includes(query.trim().toLocaleLowerCase("ko")));
  const selectedUnit = directory.records.find(r => `${r.university}/${r.department}` === unitKey);
  const profile = majors.find(p => p.id === profileId);
  const activeUniversity = university || selectedUnit?.university || "";
  const records = selectSusiPlans(planData.records, activeUniversity, field, category, minimum)
    .filter(r => !interview || r.hasInterview === (interview === "있음"));
  const sourcePage = senIndex.find(r => r.name === activeUniversity)?.page;

  useEffect(() => {
    if (unitKey) document.getElementById("major-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [unitKey]);

  function chooseUnit(unit: typeof directory.records[number]) {
    setUnitKey(`${unit.university}/${unit.department}`);
    setUniversity(unit.university);
    const nextProfile = chooseUnitProfile(unit, profileId);
    const matched = majors.find(p => p.id === nextProfile);
    setProfileId(nextProfile);
    setField(matched?.field || unitAdmissionField(unit));
    setPlanLimit(8);
  }

  return <div className={styles.page}>
    <AdmissionsNav current="early" />
    <header className={styles.hero}><span className={styles.eyebrow}>학과 탐색 · 2028 수시</span><h1>관심 학과에서, 전형 조건까지.</h1><p>배우고 싶은 분야를 찾고, 수능최저·면접·지원자격을 확인하세요.</p></header>

    <nav className={styles.pageJump} aria-label="학과·수시 바로가기"><a href="#directory">학과 찾기</a><a href="#plans">수능최저·면접 찾기</a><Link href="/admissions#questions">궁금한 질문</Link></nav>

    <section id="directory" className={styles.section} aria-labelledby="directory-heading">
      <h2 id="directory-heading">{profile ? `${profile.title} 관련 학과` : "서울 대학에는 이런 학과가 있어요"}</h2>
      <div className={styles.compactFields} role="group" aria-label="관심 분야"><button type="button" aria-pressed={!profileId} onClick={() => { setProfileId(""); setUnitKey(""); setField(""); setLimit(12); }}>전체 분야</button>{majors.map(p => <button key={p.id} type="button" aria-pressed={profileId === p.id} onClick={() => { setProfileId(p.id); setQuery(""); setUnitKey(""); setField(p.field); setLimit(12); }}>{p.title}</button>)}</div>
      <div className={styles.filters}>
        <label>서울 대학<select value={university} onChange={e => { setUniversity(e.target.value); setUnitKey(""); setLimit(6); }}><option value="">30개 대학 전체</option>{directory.universities.map(u => <option key={u}>{u}</option>)}</select></label>
        <label>학과·계열 검색<input value={query} placeholder="예: 중국, 경영, 사회, 교육" onChange={e => { setQuery(e.target.value); setLimit(6); }} /></label>
        <label>목록 보기<select value={String(limit)} onChange={e => setLimit(Number(e.target.value))}><option value="6">6개씩</option><option value="12">12개씩</option><option value="60">60개씩</option><option value="600">모두</option></select></label>
      </div>
      <div className={styles.tools}><Link href={activeUniversity ? `/admissions/seoul?university=${encodeURIComponent(activeUniversity)}` : "/admissions/seoul"}>관심 대학의 정시 입결 보기 →</Link><Link href="/admissions#student-questions">대학 공식 자료 →</Link></div>
      <details><summary>학과 목록의 출처·수록 범위</summary><p className={styles.muted}>{directory.source}. {directory.notice} 전공 선택 범위가 있는 계열·자유전공은 개별 학과와 구분하세요.</p></details>
      <div className={styles.resultBar}><p role="status">학과 탐색 {units.length}개 · 학과를 누르면 공부 내용을 확인해요</p><button className={styles.reset} type="button" onClick={() => { setUniversity(""); setQuery(""); setUnitKey(""); setProfileId(""); setField(""); setLimit(12); setPlanLimit(8); }}>조건 초기화</button></div>
      <div className={styles.directory}>{units.slice(0, limit).map(u => {
        const key = `${u.university}/${u.department}`;
        return <button key={key} type="button" className={styles.unit} aria-pressed={unitKey === key} onClick={() => chooseUnit(u)}><small>{u.university} · 서울</small><strong>{u.department}</strong><small>{u.classification} · 공부·전형 확인 ↓</small></button>;
      })}</div>
      {units.length === 0 && <p className={styles.empty}>이 목록에는 해당 학과가 없습니다. 학과가 없거나 모집하지 않는다는 뜻은 아닙니다. 대학의 공식 학과 안내와 2028 모집단위를 확인하세요.</p>}
      {units.length > limit && <button className={styles.more} onClick={() => setLimit(n => n + 6)}>6개 더 보기</button>}
    </section>

    {(selectedUnit || profile) && <section id="major-section" className={styles.section} aria-labelledby="major-heading">
      <h2 id="major-heading">대학 교육과정</h2>
      {selectedUnit && <p>선택한 모집단위: <b>{selectedUnit.university} · {selectedUnit.department}</b></p>}

      {selectedUnit && selectedUnit.profileIds.length > 1 && <div className={styles.chips}>
        <p>여러 분야와 연결되는 모집단위입니다. 교육과정을 볼 분야를 선택하세요.</p>
        {majors.filter(p => belongsToProfile(selectedUnit, p.id)).map(p => <button key={p.id} type="button" aria-pressed={profileId === p.id} onClick={() => { setProfileId(p.id); setField(p.field); }}>{p.title}</button>)}
      </div>}
      {!profile && <p className={styles.empty}>이 모집단위에 단일 전공 해설을 자동 지정하지 않았습니다. 위에서 인접 분야를 직접 골라 참고하고, 해당 대학의 교육과정을 확인하세요.</p>}
      {profile && <article className={styles.selection}>
        <span className={styles.eyebrow}>{profile.field}</span><h3>{profile.title}</h3>
        <p className={styles.muted}>아래 과목은 표기된 대학·학과의 교육과정 자료입니다. 선택한 대학·학과의 교육과정 및 2028 모집 여부와는 구분됩니다.</p>
        {profile.examples.map(ex => <div className={styles.source} key={ex.url}><a href={ex.url} target="_blank" rel="noopener noreferrer">{ex.university} · {ex.department} 공식 안내 ↗</a><p>{ex.courses.join(" · ")}</p></div>)}
      </article>}
    </section>}

    <section id="plans" className={styles.section} aria-labelledby="susi-heading">
      <h2 id="susi-heading">수능최저·면접은 어떻게 볼까?</h2>
      <p>교육청 자료·입학처 시행계획에서 확인한 <b>대학 공통 전형 요약</b>입니다. 해당 학과 모집 여부와 외고·추천 조건은 전형별 지원자격 원문을 확인하세요.</p>
      <div className={`${styles.filters} ${styles.planFilters}`}>
        <label>전형 대학<select value={university} onChange={e => { setUniversity(e.target.value); setUnitKey(""); setPlanLimit(8); setLimit(12); }}><option value="">전체 대학</option>{directory.universities.map(u => <option key={u}>{u}</option>)}</select></label>
        <label>전형 유형<select value={category} onChange={e => { setCategory(e.target.value); setPlanLimit(8); }}><option value="">학종·교과·논술 전체</option><option>학생부종합</option><option>학생부교과</option><option>논술</option></select></label>
        <label>수능최저<select value={minimum} onChange={e => { setMinimum(e.target.value); setPlanLimit(8); }}><option value="">전체</option><option>있음</option><option>없음</option></select></label>
        <label>면접<select value={interview} onChange={e => { setInterview(e.target.value); setPlanLimit(8); }}><option value="">전체</option><option>있음</option><option>없음</option></select></label>
        <label>전형 탐색 계열<select value={field} onChange={e => { setField(e.target.value); setPlanLimit(8); }}><option value="">전체 계열</option><option>인문·어문</option><option>사회·상경</option><option>교육</option></select></label>
      </div>
      <div className={styles.resultBar}><p role="status">{activeUniversity || "전체 대학"} · {field || "전체 계열"} · {records.length}개 전형</p><button type="button" className={styles.reset} onClick={() => { setUniversity(""); setUnitKey(""); setCategory(""); setMinimum(""); setInterview(""); setField(""); setPlanLimit(8); }}>전형 조건 초기화</button></div>
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

  </div>;
}
