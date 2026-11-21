"use client";
import { useState } from "react";
import Link from "next/link";
import reference from "@/public/admissions-explorer/reference.json";
import directory from "@/public/admissions-explorer/directory.json";
import manifest from "@/public/admissions-data/manifest.json";
import registry from "@/public/admissions-explorer/seoul-universities.json";
import SeoulUniversityOptions from "./SeoulUniversityOptions";
import { groupDisplayScoreReferences, mockPercentile, mockStandard, readScore, type DisplayScoreBand } from "@/components/lib/mockScores";
import styles from "./explorer.module.css";

const subjects = ['국어', '수학', '통합사회', '통합과학'];
const descriptions: Record<DisplayScoreBand, string> = {
  상향: '참고점수까지 상승이 필요한 구간',
  소신: '참고점수에 조금 못 미치는 구간',
  적정: '두 참고점수를 모두 충족한 범위(기존 가능·적정·안정 통합)',
};
const freshLimits = (): Record<DisplayScoreBand, number> => ({ 상향: 10, 소신: 10, 적정: 10 });
const points = (value: number) => Number(value.toFixed(2)).toLocaleString('ko-KR');
const difference = (value: number) => `${value > 0 ? '+' : ''}${points(value)}`;

export default function MockScoreExplorer({ university, onUniversityChange }: { university: string; onUniversityChange: (value: string) => void }) {
  const [mode, setMode] = useState<'subjects' | 'totals'>('totals');
  const [standards, setStandards] = useState(['', '', '', '']);
  const [percentiles, setPercentiles] = useState(['', '', '', '']);
  const [totalStandard, setTotalStandard] = useState('');
  const [totalAverage, setTotalAverage] = useState('');
  const [english, setEnglish] = useState('');
  const [submitted, setSubmitted] = useState<{ standard: number; average: number; english: string } | null>(null);
  const [error, setError] = useState('');
  const [limits, setLimits] = useState(freshLimits);
  const standard = mode === 'subjects' ? mockStandard(standards) : readScore(totalStandard, 600);
  const average = mode === 'subjects' ? mockPercentile(percentiles) : readScore(totalAverage, 100);
  const groups = submitted ? groupDisplayScoreReferences(reference, submitted.standard, submitted.average, university, directory.universities) : [];
  const displayedCount = groups.reduce((count, group) => count + group.rows.length, 0);
  const clearResult = () => { setSubmitted(null); setError(''); };

  return <section className={styles.panel} id="mock-score" aria-labelledby="mock-heading">
    <h2 id="mock-heading">상향·소신·적정 참고표</h2>
    <p><b>표점합과 평균 백분위</b>를 입력하면 수록된 참고점수와 비교해 상향·소신·적정 세 구간으로 표시합니다. 두 참고점수를 모두 충족하면 적정에 표시합니다.</p>
    <p className={styles.scopeNote}>원자료 표기에는 ‘고1 가채점’이 있으나 정확한 적용 시험·대상 및 2028학년도 적용성은 검증되지 않았습니다. 수록 자료와의 점수 차이만 나타내며, 합격 가능성이나 확률을 뜻하지 않습니다.</p>
    <form onSubmit={e => {
      e.preventDefault();
      if (standard === null || average === null) { setError(mode === 'subjects' ? '네 과목의 표준점수와 백분위를 모두 입력해 주세요.' : '표준점수 합(0~600)과 평균 백분위(0~100)를 입력해 주세요.'); return; }
      setSubmitted({standard, average, english}); setError(''); setLimits(freshLimits());
    }}>
      <div className={styles.chips} role="group" aria-label="점수 입력 방식">
        <button type="button" aria-pressed={mode === 'totals'} onClick={() => { setMode('totals'); clearResult(); }}>표점합·평균 입력</button>
        <button type="button" aria-pressed={mode === 'subjects'} onClick={() => { setMode('subjects'); clearResult(); }}>과목별 입력</button>
      </div>
      {mode === 'subjects' ? <div className={styles.scoreInputs}>
        <div className={styles.scoreInputHead} aria-hidden="true"><span>과목</span><span>표준점수</span><span>백분위</span></div>
        {subjects.map((subject, i) => <div className={styles.scoreInputRow} key={subject}>
          <span>{subject}</span>
          <input aria-label={`${subject} 표준점수`} type="number" inputMode="decimal" min="0" max={i < 2 ? 200 : 100} step="any" required value={standards[i]} onChange={e => { setStandards(standards.map((v, j) => j === i ? e.target.value : v)); clearResult(); }} />
          <input aria-label={`${subject} 백분위`} type="number" inputMode="decimal" min="0" max="100" step="any" required value={percentiles[i]} onChange={e => { setPercentiles(percentiles.map((v, j) => j === i ? e.target.value : v)); clearResult(); }} />
        </div>)}
      </div> : <div className={styles.scoreTotals}>
        <label>표준점수 합 · 표점합<input aria-label="표준점수 합" type="number" inputMode="decimal" min="0" max="600" step="any" placeholder="예: 411" required value={totalStandard} onChange={e => { setTotalStandard(e.target.value); clearResult(); }} /></label>
        <label>국수탐 평균 백분위<input aria-label="국수탐 평균 백분위" type="number" inputMode="decimal" min="0" max="100" step="any" placeholder="예: 98.39" required value={totalAverage} onChange={e => { setTotalAverage(e.target.value); clearResult(); }} /></label>
      </div>}
      <label className={styles.englishInput}>영어 등급 <span className={styles.muted}>(선택 · 구간 분류에는 미반영)</span><select aria-label="영어 등급" value={english} onChange={e => { setEnglish(e.target.value); clearResult(); }}><option value="">선택 안 함</option>{Array.from({length:9}, (_,i) => <option key={i} value={i+1}>{i+1}등급</option>)}</select></label>
      <label className={styles.searchLabel}>대학 선택<select aria-label="참고표 대학" className={styles.universitySelect} value={university} onChange={e => { onUniversityChange(e.target.value); setLimits(freshLimits()); }}><option value="">서울 소재 전체 {registry.records.length}곳</option><SeoulUniversityOptions /></select></label>
      <p className={styles.muted}>참고점수 수록: {directory.universities.length}개 대학 · {reference.length}개 전형·모집단위</p>
      <p className={styles.muted}>{standard !== null && average !== null ? `입력 점수: 표준점수 합 ${points(standard)} · 평균 백분위 ${points(average)}` : '표준점수는 네 과목의 합, 백분위는 (국어 + 수학 + 두 탐구 평균) ÷ 3입니다.'}</p>
      <button className={styles.primary} type="submit">상향·소신·적정 구간 보기</button>
      {error && <p role="alert">{error}</p>}
    </form>
    <p className={styles.muted}>입력값은 이 화면에서만 사용하며 서버 전송·저장하지 않습니다.</p>

    <details className={styles.scoreMethod}><summary>자료 출처·구간 기준 확인</summary>
      <p>저장된 출처명: {manifest.source}. 서울 소재 인문·자유전공 {directory.universities.length}개 대학, {reference.length}개 전형·모집단위를 수록합니다. 원본 시험 시행일·대상 학년·현재 고2 적용성은 확인 중입니다.</p>
      <p><a href="/admissions-explorer/reference.json" target="_blank" rel="noopener noreferrer">수록 참고점수 원자료 보기 ↗</a></p>
      <p>아래는 이 화면의 점수 차이 분류 규칙이며 대학·이투스가 정한 지원 판정 기준이 아닙니다. 표준점수 합과 백분위 합(평균 × 3)을 각각 비교합니다.</p>
      <ul>
        <li>상향: 소신 범위를 넘지만 부족분이 표준점수 합 12점·평균 백분위 3 이내.</li>
        <li>소신: 두 참고점수 중 하나 이상에 못 미치며 부족분이 표준점수 합 4점·평균 백분위 1 이내.</li>
        <li>적정: 두 참고점수를 모두 충족한 범위(기존 가능·적정·안정 통합).</li>
      </ul>
      <p>영어·한국사·학생부·영역별 반영비율·탐구 변환표는 구간에 반영하지 않습니다. 실제 등록자 입결과 2028 시행계획은 아래에서 따로 확인하세요.</p>
    </details>

    {submitted && <div aria-live="polite">
      <div className={styles.scoreSummary}><h3>표준점수 합 {points(submitted.standard)} · 평균 백분위 {points(submitted.average)}</h3><p>{university || '수록 대학 전체'} · 세 구간 표시 결과 {displayedCount}건{selectedEnglish(submitted.english)}</p></div>
      {displayedCount === 0 && <p className={styles.empty}>{university && !reference.some(r => r.university === university) ? `${university}의 지원참고 점수는 현재 수록되어 있지 않습니다.` : '수록된 참고점수 중 세 구간에 해당하는 결과가 없습니다.'}</p>}
      {groups.map(g => <section className={styles.scoreGroup} key={g.band} aria-label={`${g.band} 구간`}>
        <h3><span className={styles.scoreBand} data-band={g.band}>{g.band}</span> {g.rows.length}개</h3><p className={styles.muted}>{descriptions[g.band]}</p>
        {g.rows.length === 0 && <p className={styles.muted}>이 구간에 해당하는 수록값이 없습니다.</p>}
        {g.rows.length > 0 && <div className={styles.scoreTableWrap} role="region" aria-label={`${g.band} 대학·학과 참고표`} tabIndex={0}><table className={styles.scoreTable}>
          <caption>{g.band} 구간 · 참고점수와 내 점수의 차이</caption>
          <thead><tr><th scope="col">대학</th><th scope="col">학과·모집단위</th><th scope="col">전형·모집군</th><th scope="col">참고 표점합</th><th scope="col">내 점수 차이</th><th scope="col">참고 평균 백분위</th><th scope="col">내 점수 차이</th></tr></thead>
          <tbody>{g.rows.slice(0, limits[g.band]).map(r => <tr key={`${r.university}/${r.department}/${r.admission}/${r.group}`}>
            <td>{r.university}</td><th scope="row"><Link href={`/admissions/susi?university=${encodeURIComponent(r.university)}#directory`}>{r.department}</Link></th><td>{r.admission} · {r.group}군</td>
            <td>{points(r.standardSum)}</td><td>{difference(submitted.standard - r.standardSum)}</td><td>{points(r.percentileSum / 3)}</td><td>{difference(submitted.average - r.percentileSum / 3)}</td>
          </tr>)}</tbody>
        </table></div>}
        {g.rows.length > limits[g.band] && <button type="button" className={styles.more} onClick={() => setLimits(current => ({...current, [g.band]: current[g.band] + 30}))}>{g.band} 30개 더 보기 ({Math.min(limits[g.band], g.rows.length)}/{g.rows.length})</button>}
      </section>)}
    </div>}
    <div className={styles.tools}><Link href={`/admissions/seoul${university ? `?university=${encodeURIComponent(university)}` : ''}#plans`}>{university || '대학별'} 2028 정시 반영방법 →</Link><Link href={`/admissions/seoul${university ? `?university=${encodeURIComponent(university)}` : ''}#results`}>정시 입시 결과 →</Link></div>
  </section>;
}

function selectedEnglish(english: string) {
  return english ? ` · 영어 ${english}등급(구간 미반영)` : '';
}
