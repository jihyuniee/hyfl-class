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

export default function SusiExplorer({ initialUniversity = "" }: { initialUniversity?: string }) {
  const [university, setUniversity] = useState(directory.universities.includes(initialUniversity) ? initialUniversity : "");
  const [query, setQuery] = useState("");
  const [field, setField] = useState("인문·어문");
  const [category, setCategory] = useState("학생부종합");
  const [minimum, setMinimum] = useState("");
  const [limit, setLimit] = useState(24);
  const [unitKey, setUnitKey] = useState("");
  const [profileId, setProfileId] = useState("chinese-language");
  const units = directory.records.filter(r => (!university || r.university === university)
    && `${r.university} ${r.department} ${r.classification}`.toLocaleLowerCase("ko").includes(query.trim().toLocaleLowerCase("ko")));
  const selectedUnit = directory.records.find(r => `${r.university}/${r.department}` === unitKey);
  const profile = majors.find(p => p.id === profileId);
  const activeUniversity = university || selectedUnit?.university || "";
  const records = selectSusiPlans(planData.records, activeUniversity, field, category, minimum);
  const sourcePage = senIndex.find(r => r.name === activeUniversity)?.page;

  function chooseUnit(unit: typeof directory.records[number]) {
    setUnitKey(`${unit.university}/${unit.department}`);
    setUniversity(unit.university);
    const matched = majors.find(p => unit.profileIds.includes(p.id));
    setProfileId(matched?.id || "");
    setField(matched?.field || (unit.classification.includes("사범") || unit.classification.includes("교육") ? "교육" : "사회·상경"));
  }

  return <div className={styles.page}>
    <AdmissionsNav current="early" />
    <header className={styles.hero}><span className={styles.eyebrow}>2028 · 인문·사회·어문·교육</span><h1>수시: 관심 학과에서 전형까지</h1><p>① 대학·학과 찾기 → ② 무엇을 배우는지 알아보기 → ③ 전형방법·최저·면접 확인</p><p className={styles.muted}>정리일 2026.10.29 · 전공 해설은 공식 교육과정을 참고했습니다. 탐구 질문과 연습 방향은 학급 안내용 제안이며 대학의 필수 활동 목록이 아닙니다.</p></header>

    <section className={styles.section} aria-labelledby="directory-heading">
      <h2 id="directory-heading">1. 어느 학교에 어떤 학과가 있을까?</h2>
      <div className={styles.filters}>
        <label>서울 대학<select value={university} onChange={e => { setUniversity(e.target.value); setUnitKey(""); setLimit(24); }}><option value="">30개 대학 전체</option>{directory.universities.map(u => <option key={u}>{u}</option>)}</select></label>
        <label>학과·계열 검색<input value={query} placeholder="예: 중국, 경영, 사회, 교육" onChange={e => { setQuery(e.target.value); setLimit(24); }} /></label>
        <label>목록 보기<select value={String(limit)} onChange={e => setLimit(Number(e.target.value))}><option value="24">24개씩</option><option value="60">60개씩</option><option value="600">모두</option></select></label>
      </div>
      <p className={styles.muted}>{directory.source}. {directory.notice} 전공 선택 범위가 있는 계열·자유전공은 개별 학과와 구분하세요.</p>
      <p className={styles.resultCount} role="status">학과·모집단위 {units.length}개 · 대학·학과 가나다순</p>
      <div className={styles.directory}>{units.slice(0, limit).map(u => {
        const key = `${u.university}/${u.department}`;
        return <button key={key} type="button" className={styles.unit} aria-pressed={unitKey === key} onClick={() => chooseUnit(u)}><small>{u.university} · 서울</small><strong>{u.department}</strong><small>{u.classification} · 공부·전형 확인 ↓</small></button>;
      })}</div>
      {units.length === 0 && <p className={styles.empty}>이 목록에는 해당 학과가 없습니다. 학과가 없거나 모집하지 않는다는 뜻은 아닙니다. 대학의 공식 학과 안내와 2028 모집단위를 확인하세요.</p>}
      {units.length > limit && <button className={styles.more} onClick={() => setLimit(n => n + 24)}>24개 더 보기</button>}
    </section>

    <section className={styles.section} aria-labelledby="major-heading">
      <h2 id="major-heading">2. 무엇을 배우고, 어떤 탐구를 해 볼까?</h2>
      {selectedUnit && <p>선택한 모집단위: <b>{selectedUnit.university} · {selectedUnit.department}</b></p>}
      <div className={styles.chips}>{majors.map(p => <button key={p.id} type="button" aria-pressed={profileId === p.id} onClick={() => { setProfileId(p.id); setField(p.field); }}>{p.title}</button>)}</div>
      {!profile && <p className={styles.empty}>이 모집단위의 세부 전공 해설은 아직 수록하지 않았습니다. 위에서 인접 분야를 직접 골라 참고하고, 해당 대학의 교육과정을 확인하세요.</p>}
      {profile && <article className={styles.selection}>
        <span className={styles.eyebrow}>{profile.field}</span><h3>{profile.title}</h3><p>{profile.learn}</p>
        <h4>고교 공부에서 연결해 볼 내용</h4><p>{profile.subjects.join(" · ")}</p><p className={styles.muted}>관심 공부를 연결하는 예시입니다. 대학별 필수·권장 이수과목 공지는 따로 확인하세요.</p>
        <h4>탐구에서 연습할 역량</h4><ul>{profile.skills.map(s => <li key={s}>{s}</li>)}</ul>
        <h4>탐구 질문 예시</h4><p><b>{profile.question}</b></p><p>{profile.method}</p>
        <p className={styles.muted}>같은 주제를 따라 하기보다 자신의 수업에서 생긴 질문, 자료와 방법, 수정 과정, 배운 점을 구체화하세요. 전공명만 붙인 활동이나 결과물의 화려함만으로 학종을 판단하지 않습니다.</p>
        <h4>실제 대학 교육과정 예시</h4><p className={styles.muted}>선택한 대학과 아래 예시 대학이 다를 수 있습니다. 아래 과목을 선택한 대학의 동일한 교육과정이나 2028 수시 모집 여부로 간주하지 마세요.</p>
        {profile.examples.map(ex => <div className={styles.source} key={ex.url}><a href={ex.url} target="_blank" rel="noopener noreferrer">{ex.university} · {ex.department} 공식 안내 ↗</a><p>{ex.courses.join(" · ")}</p></div>)}
      </article>}
    </section>

    <section className={styles.section} aria-labelledby="susi-heading">
      <h2 id="susi-heading">3. 선택한 대학의 수시 전형 후보 확인</h2>
      <p>학교·계열로 찾은 <b>대학 공통 전형 후보</b>입니다. 선택한 학과가 그 전형에서 실제 모집하는지, 추천·고교유형 등 지원자격이 맞는지는 원문의 모집단위 표와 지원자격에서 확인해야 합니다.</p>
      <div className={styles.filters}>
        <label>전형 탐색 계열<select value={field} onChange={e => setField(e.target.value)}><option>인문·어문</option><option>사회·상경</option><option>교육</option></select></label>
        <label>전형 유형<select value={category} onChange={e => setCategory(e.target.value)}><option value="">학종·교과·논술 전체</option><option>학생부종합</option><option>학생부교과</option><option>논술</option></select></label>
        <label>수능최저<select value={minimum} onChange={e => setMinimum(e.target.value)}><option value="">전체</option><option>있음</option><option>없음</option></select></label>
      </div>
      <p className={styles.resultCount} role="status">{activeUniversity ? `${activeUniversity} · ${field} · ${records.length}개 전형 후보` : "위에서 대학을 선택하면 전형 후보를 보여줍니다."}</p>
      <div className={styles.planGrid}>{records.map(r => <article className={styles.plan} key={r.id}>
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
      {activeUniversity && records.length === 0 && <p className={styles.empty}>이 자료에 조건이 맞는 전형이 없습니다. 지원 가능한 전형이 없다는 뜻은 아닙니다. 계열·전형 필터를 바꾸거나 대학 원문을 확인하세요.</p>}
      <div className={styles.panel}><h3>지원 전에 확인할 6가지</h3><ol><li>지원 학년도와 정확한 모집단위</li><li>외고 지원 가능 여부·추천·졸업연도 등 지원자격</li><li>교과·서류·논술·면접의 반영방법과 비율</li><li>수능최저의 영역 합·필수영역·탐구·한국사 조건</li><li>면접 방식·일정·평가자료</li><li>최종 모집요강의 변경사항</li></ol><p className={styles.muted}>이 페이지에는 수시 내신 합격선을 자동 대입하지 않습니다. 학종은 등급 하나로 판단할 수 없고, 과거 9등급 내신을 현재 5등급 내신과 그대로 비교할 수 없습니다.</p><Link className={styles.primary} href="/admissions#resources">대학 시행계획·학종 안내서 확인 →</Link></div>
    </section>

    <aside className={styles.panel}><h3>중국 유학도 알아보고 싶다면</h3><p>칭화대 학교장 추천은 교내 1명이며, 추천·지원 과정에서 면접이 필요할 수 있습니다. 추천과 대학의 최종 합격은 별개입니다.</p><Link className={styles.primary} href="/admissions/china">학교 안내·중국 대학 지원 절차 보기 →</Link></aside>
  </div>;
}
