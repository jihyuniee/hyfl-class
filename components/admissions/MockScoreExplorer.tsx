"use client";
import { useState } from "react";
import Link from "next/link";
import reference from "@/public/admissions-explorer/reference.json";
import plans from "@/public/admissions-seoul/plans.json";
import { mockPercentile, nearbyReferences } from "@/components/lib/mockScores";
import styles from "./explorer.module.css";

export default function MockScoreExplorer({ university }: { university: string }) {
  const [scores, setScores] = useState(['', '', '', '']);
  const [english, setEnglish] = useState('');
  const [range, setRange] = useState(3);
  const [submitted, setSubmitted] = useState<{ average: number; english: string } | null>(null);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(6);
  const average = mockPercentile(scores);
  const rows = submitted ? nearbyReferences(reference, submitted.average, range, university) : [];
  return <section className={styles.panel} id="mock-score" aria-labelledby="mock-heading">
    <h2 id="mock-heading">내 모의고사로 살펴볼 대학·학과 찾기</h2>
    <p>성적표의 <b>백분위</b>를 입력하세요. 국어·수학·통합사회·통합과학으로 국수탐 단순 평균을 계산해, 기존 지원참고 예상점수가 가까운 모집단위를 보여줘요.</p>
    <p className={styles.muted}>기준: 이투스 2027학년도 9월 학력평가 지원참고표에 수록된 2028 모집단위. 다른 시험 성적은 시험 난도·응시집단이 달라 대략적인 탐색에만 사용해요. 실제 등록자 입결과 구분합니다.</p>
    <form onSubmit={e => { e.preventDefault(); if (average === null || !english) { setError('네 과목 백분위(0~100)와 영어 등급을 모두 입력해 주세요.'); return; } setSubmitted({average, english}); setError(''); setLimit(6); }}>
      <div className={styles.filters}>{['국어 백분위', '수학 백분위', '통합사회 백분위', '통합과학 백분위'].map((label, i) => <label key={label}>{label}<input type="number" inputMode="decimal" min="0" max="100" step="any" required value={scores[i]} onChange={e => { setScores(scores.map((v, j) => j === i ? e.target.value : v)); setSubmitted(null); }} /></label>)}
      <label>영어 등급<select required value={english} onChange={e => { setEnglish(e.target.value); setSubmitted(null); }}><option value="">선택</option>{Array.from({length:9}, (_,i) => <option key={i} value={i+1}>{i+1}등급</option>)}</select></label>
      <label>예상점수와 비교할 범위<select value={range} onChange={e => { setRange(Number(e.target.value)); setLimit(6); }}><option value={1}>평균 백분위 ±1</option><option value={3}>평균 백분위 ±3</option><option value={5}>평균 백분위 ±5</option></select></label></div>
      <button className={styles.primary} type="submit">가까운 지원참고 대학·학과 보기</button>
      {error && <p role="alert">{error}</p>}
    </form>
    <p className={styles.muted}>입력값은 이 화면에서만 사용하며 서버 전송·저장하지 않습니다.</p>
    {submitted && <div aria-live="polite"><h3>입력 평균 {submitted.average.toFixed(2)} · 영어 {submitted.english}등급</h3><p>계산: (국어 + 수학 + (사회 + 과학) ÷ 2) ÷ 3. 영어는 이 평균에 포함하지 않아요. 아래 대학별 영어 환산을 따로 확인하세요.</p>
      <p>{university || '전체 대학'} · 지원참고 예상 평균과 ±{range} 이내 {rows.length}개. 가까운 순서이며 합격 가능성 순위가 아닙니다.</p>
      <p>이 범위는 탐색을 위한 간격입니다. 안정·적정·상향 판정이나 대학별 실제 환산점수가 아니에요. 정확한 환산에는 표준점수·탐구 변환표·영어·한국사·학생부 등 대학별 조건이 필요합니다.</p>
      {rows.length === 0 && <p>가까운 예상점수가 수록되어 있지 않아요. 지원 가능한 대학이 없다는 뜻은 아닙니다. 대학 선택이나 비교 범위를 바꿔보세요.</p>}
      {rows.slice(0,limit).map(r => <article className={styles.scoreCard} key={`${r.university}/${r.department}/${r.admission}/${r.group}`}>
        <h3>{r.university} · {r.department}</h3><p>{r.admission} · {r.group}군</p><p>지원참고 예상 평균 <b>{(r.percentileSum/3).toFixed(2)}</b> · 입력 평균과 차이 {(submitted.average-r.percentileSum/3).toFixed(2)}</p>
        <Link href={`/admissions/susi?university=${encodeURIComponent(r.university)}`}>이 대학의 학과·탐구·수시 전형 →</Link>
        <details><summary>이 대학의 2028 과목 반영비율 확인</summary><p>아래는 대학별 반영 사례입니다. 위 학과·전형에 적용되는지는 모집단위 범위와 원문을 확인하세요. 이 비율을 백분위 평균에 곱해 실제 환산점수를 만들지는 않습니다.</p>
        {plans.filter(p => p[1] === r.university).map(p => <div className={styles.source} key={`${p[2]}/${p[3]}`}><b>{p[2]} · {p[3]}</b><p>국어 / 수학 / 영어 / 탐구: {[4,5,6,7].map(i => p[i] === null ? '별도 산식' : `${Number(p[i]).toFixed(1).replace(/\.0$/, '')}%`).join(' / ')}</p><p>탐구: {p[8]}<br/>영어: {p[12]}<br/>활용 지표: {p[11]}<br/>수능 {p[9]}% · 기타 {p[10]}</p><p>{p[13]}</p><a href={String(p[15])} target="_blank" rel="noopener noreferrer">2028 시행계획 · {p[14]} ↗</a></div>)}
        {!plans.some(p => p[1] === r.university) && <p>이 대학의 반영방식은 현재 요약에 없어요. 대학 시행계획·모집요강을 확인하세요.</p>}
        </details>
      </article>)}
      {rows.length > limit && <button className={styles.primary} onClick={() => setLimit(n => n+6)}>6개 더 보기</button>}
    </div>}
  </section>;
}
