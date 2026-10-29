"use client";

import { useState } from "react";
import Link from "next/link";
import FieldBrowse from "@/components/admissions/FieldBrowse";
import AdmissionsNav from "@/components/admissions/AdmissionsNav";
import { belongsToProfile, chooseUnitProfile, unitAdmissionField } from "@/components/lib/admissionsBrowse";
import { selectSusiPlans } from "@/components/lib/admissionsExplorer";
import directory from "@/public/admissions-explorer/directory.json";
import majors from "@/public/admissions-explorer/majors.json";
import planData from "@/public/admissions-2028/records.json";
import senIndex from "@/public/admissions-2028/sen-universities.json";
import styles from "@/components/admissions/explorer.module.css";

export default function SusiExplorer({ initialUniversity = "", initialProfile = "" }: { initialUniversity?: string; initialProfile?: string }) {
  const [university, setUniversity] = useState(directory.universities.includes(initialUniversity) ? initialUniversity : "");
  const [query, setQuery] = useState("");
  const [field, setField] = useState(majors.find(p => p.id === initialProfile)?.field || "인문·어문");
  const [category, setCategory] = useState("학생부종합");
  const [minimum, setMinimum] = useState("");
  const [limit, setLimit] = useState(12);
  const [unitKey, setUnitKey] = useState("");
  const [profileId, setProfileId] = useState(majors.some(p => p.id === initialProfile) ? initialProfile : "");
  const units = directory.records.filter(r => (!profileId || belongsToProfile(r, profileId)) && (!university || r.university === university)
    && `${r.university} ${r.department} ${r.classification}`.toLocaleLowerCase("ko").includes(query.trim().toLocaleLowerCase("ko")));
  const selectedUnit = directory.records.find(r => `${r.university}/${r.department}` === unitKey);
  const profile = majors.find(p => p.id === profileId);
  const activeUniversity = university || selectedUnit?.university || "";
  const records = selectSusiPlans(planData.records, activeUniversity, field, category, minimum);
  const sourcePage = senIndex.find(r => r.name === activeUniversity)?.page;

  function chooseUnit(unit: typeof directory.records[number]) {
    setUnitKey(`${unit.university}/${unit.department}`);
    setUniversity(unit.university);
    const nextProfile = chooseUnitProfile(unit, profileId);
    const matched = majors.find(p => p.id === nextProfile);
    setProfileId(nextProfile);
    setField(matched?.field || unitAdmissionField(unit));
  }

  return <div className={styles.page}>
    <AdmissionsNav current="early" />
    <header className={styles.hero}><span className={styles.eyebrow}>수시 · 2028</span><h1>이런 계열에서는 무엇을 배울까?</h1><p>분야별 공부 내용과 학과를 둘러보고, 마음에 드는 계열을 눌러보세요.</p></header>

    <section className={styles.section} aria-label="계열별 공부와 학과 예시"><FieldBrowse active={profileId} onChoose={id => { setProfileId(id); setUniversity(""); setQuery(""); setUnitKey(""); setLimit(6); setField(majors.find(p => p.id === id)?.field || "인문·어문"); }} /></section>

    <section className={styles.section} aria-labelledby="directory-heading">
      <h2 id="directory-heading">{profile ? `${profile.title} 관련 학과` : "서울 대학에는 이런 학과가 있어요"}</h2>
      <div className={styles.filters}>
        <label>서울 대학<select value={university} onChange={e => { setUniversity(e.target.value); setUnitKey(""); setLimit(6); }}><option value="">30개 대학 전체</option>{directory.universities.map(u => <option key={u}>{u}</option>)}</select></label>
        <label>학과·계열 검색<input value={query} placeholder="예: 중국, 경영, 사회, 교육" onChange={e => { setQuery(e.target.value); setLimit(6); }} /></label>
        <label>목록 보기<select value={String(limit)} onChange={e => setLimit(Number(e.target.value))}><option value="6">6개씩</option><option value="12">12개씩</option><option value="60">60개씩</option><option value="600">모두</option></select></label>
      </div>
      <div className={styles.tools}><Link href={activeUniversity ? `/admissions/seoul?university=${encodeURIComponent(activeUniversity)}` : "/admissions/seoul"}>관심 대학의 정시 입결 보기 →</Link><Link href="/admissions#student-questions">학생부·탐구 준비 점검 →</Link></div>
      <details><summary>학과 목록의 출처·수록 범위</summary><p className={styles.muted}>{directory.source}. {directory.notice} 전공 선택 범위가 있는 계열·자유전공은 개별 학과와 구분하세요.</p></details>
      <p className={styles.resultCount} role="status">{`학과·모집단위 ${units.length}개 · 학과를 누르면 전형 정보를 볼 수 있어요.`}</p>
      <div className={styles.directory}>{units.slice(0, limit).map(u => {
        const key = `${u.university}/${u.department}`;
        return <button key={key} type="button" className={styles.unit} aria-pressed={unitKey === key} onClick={() => chooseUnit(u)}><small>{u.university} · 서울</small><strong>{u.department}</strong><small>{u.classification} · 공부·전형 확인 ↓</small></button>;
      })}</div>
      {units.length === 0 && <p className={styles.empty}>이 목록에는 해당 학과가 없습니다. 학과가 없거나 모집하지 않는다는 뜻은 아닙니다. 대학의 공식 학과 안내와 2028 모집단위를 확인하세요.</p>}
      {units.length > limit && <button className={styles.more} onClick={() => setLimit(n => n + 6)}>6개 더 보기</button>}
    </section>

    {(selectedUnit || profile) && <section className={styles.section} aria-labelledby="major-heading">
      <h2 id="major-heading">이 분야의 탐구는 이렇게 해볼 수 있어요</h2>
      {selectedUnit && <p>선택한 모집단위: <b>{selectedUnit.university} · {selectedUnit.department}</b></p>}

      {selectedUnit && selectedUnit.profileIds.length > 1 && <div className={styles.chips}>
        <p>여러 분야와 연결되는 모집단위입니다. 관심 있는 탐구 분야를 골라보세요.</p>
        {majors.filter(p => belongsToProfile(selectedUnit, p.id)).map(p => <button key={p.id} type="button" aria-pressed={profileId === p.id} onClick={() => { setProfileId(p.id); setField(p.field); }}>{p.title}</button>)}
      </div>}
      {!profile && <p className={styles.empty}>이 모집단위에 단일 전공 해설을 자동 지정하지 않았습니다. 위에서 인접 분야를 직접 골라 참고하고, 해당 대학의 교육과정을 확인하세요.</p>}
      {profile && <p>질문이 시작된 수업 → 자료의 출처·비교 기준 → 직접 분석한 과정 → 한계·수정 → 후속 질문을 점검해요. 아래는 탐구 예시이며 대학의 합격 조건은 아닙니다.</p>}
      {profile && <article className={styles.selection}>
        <span className={styles.eyebrow}>{profile.field}</span><h3>{profile.title}</h3>
        <details><summary>고교 공부·탐구 준비 더 보기</summary><h4>고교 공부에서 연결해 볼 내용</h4><p>{profile.subjects.join(" · ")}</p><p className={styles.muted}>관심 공부를 연결하는 예시입니다. 대학별 필수·권장 이수과목 공지는 따로 확인하세요.</p>
        <h4>탐구에서 연습할 역량</h4><ul>{profile.skills.map(s => <li key={s}>{s}</li>)}</ul>
        <h4>탐구 질문 예시</h4><p><b>{profile.question}</b></p><p>{profile.method}</p>
        <p className={styles.muted}>같은 주제를 따라 하기보다 자신의 수업에서 생긴 질문, 자료와 방법, 수정 과정, 배운 점을 구체화하세요. 전공명만 붙인 활동이나 결과물의 화려함만으로 학종을 판단하지 않습니다.</p>
        </details><details><summary>대학 교육과정 원문·예시</summary><h4>실제 대학 교육과정 예시</h4><p className={styles.muted}>선택한 대학과 아래 예시 대학이 다를 수 있습니다. 아래 과목을 선택한 대학의 동일한 교육과정이나 2028 수시 모집 여부로 간주하지 마세요.</p>
        {profile.examples.map(ex => <div className={styles.source} key={ex.url}><a href={ex.url} target="_blank" rel="noopener noreferrer">{ex.university} · {ex.department} 공식 안내 ↗</a><p>{ex.courses.join(" · ")}</p></div>)}
      </details></article>}
    </section>}

    {activeUniversity && <section className={styles.section} aria-labelledby="susi-heading">
      <h2 id="susi-heading">수능최저·면접은 어떻게 볼까?</h2>
      <p>학교·계열로 찾은 <b>대학 공통 전형 후보</b>입니다. 선택한 학과가 그 전형에서 실제 모집하는지, 추천·고교유형 등 지원자격이 맞는지는 원문의 모집단위 표와 지원자격에서 확인해야 합니다.</p>
      <div className={styles.filters}>
        <label>전형 탐색 계열<select value={field} onChange={e => setField(e.target.value)}><option value="">계열 선택</option><option>인문·어문</option><option>사회·상경</option><option>교육</option></select></label>
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
      <p className={styles.muted}>과거 9등급 내신과 현재 5등급 내신은 그대로 비교할 수 없어요. 학종은 내신 외에 이수 과목·수업·탐구도 함께 살펴봐요.</p>
    </section>}

  </div>;
}
