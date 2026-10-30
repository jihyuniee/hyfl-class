"use client";
import { useState } from "react";
import Link from "next/link";
import reference from "@/public/admissions-explorer/reference.json";
import directory from "@/public/admissions-explorer/directory.json";
import plans from "@/public/admissions-seoul/plans.json";
import { mockPercentile, mockStandard, readScore, referenceBand, scoreReferences, SCORE_BANDS, type ScoreBand } from "@/components/lib/mockScores";
import styles from "./explorer.module.css";

const subjects = ['국어', '수학', '통합사회', '통합과학'];
const descriptions: Record<ScoreBand, string> = {
  상향: '참고점수까지 상승이 필요한 구간',
  소신: '참고점수에 조금 못 미치는 구간',
  가능: '두 참고점수를 충족하고 차이가 작은 구간',
  적정: '두 참고점수보다 여유가 있는 구간',
  안정: '두 참고점수보다 여유가 큰 구간',
};
const freshLimits = () => Object.fromEntries(SCORE_BANDS.map(band => [band, 3])) as Record<ScoreBand, number>;
const points = (value: number) => Number(value.toFixed(2)).toLocaleString('ko-KR');
const difference = (value: number) => `${value > 0 ? '+' : ''}${points(value)}`;

export default function MockScoreExplorer({ university }: { university: string }) {
  const [mode, setMode] = useState<'subjects' | 'totals'>('subjects');
  const [standards, setStandards] = useState(['', '', '', '']);
  const [percentiles, setPercentiles] = useState(['', '', '', '']);
  const [totalStandard, setTotalStandard] = useState('');
  const [totalAverage, setTotalAverage] = useState('');
  const [english, setEnglish] = useState('');
  const [submitted, setSubmitted] = useState<{ standard: number; average: number; english: string } | null>(null);
  const [error, setError] = useState('');
  const [bandFilter, setBandFilter] = useState<ScoreBand | ''>('');
  const [limits, setLimits] = useState(freshLimits);
  const standard = mode === 'subjects' ? mockStandard(standards) : readScore(totalStandard, 600);
  const average = mode === 'subjects' ? mockPercentile(percentiles) : readScore(totalAverage, 100);
  const rows = submitted ? scoreReferences(reference, submitted.standard, submitted.average, university, directory.universities) : [];
  const groups = SCORE_BANDS.map(band => ({band, rows: rows.filter(r => submitted && referenceBand(r, submitted.standard, submitted.average) === band)}));
  const clearResult = () => { setSubmitted(null); setError(''); };

  return <section className={styles.panel} id="mock-score" aria-labelledby="mock-heading">
    <h2 id="mock-heading">내 점수로 상향·소신·적정 대학 찾기</h2>
    <p>성적표의 <b>표준점수와 백분위</b>를 입력하면 대학·학과를 구간별로 보여줘요.</p>
    <p className={styles.muted}>기존 지원참고표와의 점수 차이에 따른 참고 구간입니다. 2028 합격 가능성을 검증한 예측값은 아닙니다.</p>
    <form onSubmit={e => {
      e.preventDefault();
      if (standard === null || average === null) { setError(mode === 'subjects' ? '네 과목의 표준점수와 백분위를 모두 입력해 주세요.' : '표준점수 합(0~600)과 평균 백분위(0~100)를 입력해 주세요.'); return; }
      setSubmitted({standard, average, english}); setError(''); setBandFilter(''); setLimits(freshLimits());
    }}>
      <div className={styles.chips} role="group" aria-label="점수 입력 방식">
        <button type="button" aria-pressed={mode === 'subjects'} onClick={() => { setMode('subjects'); clearResult(); }}>과목별 입력</button>
        <button type="button" aria-pressed={mode === 'totals'} onClick={() => { setMode('totals'); clearResult(); }}>합계·평균으로 입력</button>
      </div>
      {mode === 'subjects' ? <div className={styles.scoreInputs}>
        <div className={styles.scoreInputHead} aria-hidden="true"><span>과목</span><span>표준점수</span><span>백분위</span></div>
        {subjects.map((subject, i) => <div className={styles.scoreInputRow} key={subject}>
          <span>{subject}</span>
          <input aria-label={`${subject} 표준점수`} type="number" inputMode="decimal" min="0" max={i < 2 ? 200 : 100} step="any" required value={standards[i]} onChange={e => { setStandards(standards.map((v, j) => j === i ? e.target.value : v)); clearResult(); }} />
          <input aria-label={`${subject} 백분위`} type="number" inputMode="decimal" min="0" max="100" step="any" required value={percentiles[i]} onChange={e => { setPercentiles(percentiles.map((v, j) => j === i ? e.target.value : v)); clearResult(); }} />
        </div>)}
      </div> : <div className={styles.scoreTotals}>
        <label>표준점수 합<input aria-label="표준점수 합" type="number" inputMode="decimal" min="0" max="600" step="any" required value={totalStandard} onChange={e => { setTotalStandard(e.target.value); clearResult(); }} /></label>
        <label>국수탐 평균 백분위<input aria-label="국수탐 평균 백분위" type="number" inputMode="decimal" min="0" max="100" step="any" required value={totalAverage} onChange={e => { setTotalAverage(e.target.value); clearResult(); }} /></label>
      </div>}
      <label className={styles.englishInput}>영어 등급 <span className={styles.muted}>(선택 · 구간 분류에는 미반영)</span><select aria-label="영어 등급" value={english} onChange={e => { setEnglish(e.target.value); clearResult(); }}><option value="">선택 안 함</option>{Array.from({length:9}, (_,i) => <option key={i} value={i+1}>{i+1}등급</option>)}</select></label>
      <p className={styles.muted}>{standard !== null && average !== null ? `입력 점수: 표준점수 합 ${points(standard)} · 평균 백분위 ${points(average)}` : '표준점수는 네 과목의 합, 백분위는 (국어 + 수학 + 두 탐구 평균) ÷ 3입니다.'}</p>
      <button className={styles.primary} type="submit">상향·소신·적정 구간 보기</button>
      {error && <p role="alert">{error}</p>}
    </form>
    <p className={styles.muted}>입력값은 이 화면에서만 사용하며 서버 전송·저장하지 않습니다.</p>

    <details className={styles.scoreMethod}><summary>자료 출처·구간 기준 확인</summary>
      <p>기존 이투스 지원참고표 중 서울 소재 인문·자유전공 {reference.length}개 전형·모집단위를 비교합니다. 저장된 출처명은 ‘2027학년도 9월 학력평가 · 고1 가채점’입니다. 원본의 시험 시행일·대상 및 현재 고2 적용성은 재확인 중입니다.</p>
      <p>아래는 이 화면의 점수 차이 분류 규칙이며 대학·이투스가 정한 지원 판정 기준이 아닙니다. 표준점수 합과 백분위 합(평균 × 3)을 각각 비교합니다.</p>
      <ul>
        <li>안정: 두 점수 모두 참고점수보다 15점 이상 높음.</li>
        <li>적정: 두 점수 모두 5점 이상 높음(안정 제외).</li>
        <li>가능: 두 참고점수를 모두 충족(적정·안정 제외).</li>
        <li>소신: 부족분이 표준점수 합 4점·평균 백분위 1 이내.</li>
        <li>상향: 소신 범위를 넘어 표준점수 합 12점·평균 백분위 3 이내.</li>
      </ul>
      <p>영어·한국사·학생부·영역별 반영비율·탐구 변환표는 구간에 반영하지 않습니다. 실제 등록자 입결과 2028 시행계획은 아래에서 따로 확인하세요.</p>
    </details>

    {submitted && <div aria-live="polite">
      <div className={styles.scoreSummary}><h3>표준점수 합 {points(submitted.standard)} · 평균 백분위 {points(submitted.average)}</h3><p>{university || '전체 대학'} · 비교 대상 {rows.length}개{selectedEnglish(submitted.english)}</p></div>
      <div className={styles.chips} role="group" aria-label="결과 구간 선택">
        <button type="button" aria-pressed={!bandFilter} onClick={() => setBandFilter('')}>전체 {rows.length}</button>
        {groups.map(g => <button type="button" key={g.band} aria-pressed={bandFilter === g.band} onClick={() => setBandFilter(g.band)}>{g.band} {g.rows.length}</button>)}
      </div>
      {rows.length === 0 && <p className={styles.empty}>현재 점수에서 비교할 참고점수가 수록되어 있지 않아요. 지원 가능한 대학이 없다는 뜻은 아닙니다. 대학 선택과 자료 범위를 확인해 주세요.</p>}
      {groups.filter(g => !bandFilter || bandFilter === g.band).map(g => <section className={styles.scoreGroup} key={g.band} aria-label={`${g.band} 구간`}>
        <h3><span className={styles.scoreBand} data-band={g.band}>{g.band}</span> {g.rows.length}개</h3><p className={styles.muted}>{descriptions[g.band]}</p>
        {g.rows.length === 0 && <p className={styles.muted}>이 구간에 해당하는 수록값이 없습니다.</p>}
        {g.rows.slice(0, limits[g.band]).map(r => <article className={styles.scoreCard} key={`${r.university}/${r.department}/${r.admission}/${r.group}`}>
          <h4>{r.university} · {r.department}</h4><p className={styles.muted}>{r.admission} · {r.group}군</p>
          <dl className={styles.scoreComparison}>
            <div><dt>참고 표준점수 합</dt><dd>{points(r.standardSum)}<small>내 점수 {difference(submitted.standard - r.standardSum)}</small></dd></div>
            <div><dt>참고 평균 백분위</dt><dd>{points(r.percentileSum / 3)}<small>내 점수 {difference(submitted.average - r.percentileSum / 3)}</small></dd></div>
          </dl>
          {(r.standardSum > submitted.standard || r.percentileSum / 3 > submitted.average) && <p className={styles.scoreGap}>참고점수까지: 표준점수 합 +{points(Math.max(0, r.standardSum - submitted.standard))} · 평균 백분위 +{points(Math.max(0, r.percentileSum / 3 - submitted.average))}</p>}
          <Link href={`/admissions/susi?university=${encodeURIComponent(r.university)}`}>이 대학의 학과·교육과정·수시 전형 →</Link>
          <details><summary>2028 과목 반영비율·영어 환산 확인</summary><p>대학별 반영 사례입니다. 해당 학과·전형에 적용되는지는 모집단위 범위와 원문을 확인하세요.</p>
            {plans.filter(p => p[1] === r.university).map(p => <div className={styles.source} key={`${p[2]}/${p[3]}`}><b>{p[2]} · {p[3]}</b><p>국어 / 수학 / 영어 / 탐구: {[4,5,6,7].map(i => p[i] === null ? '별도 산식' : `${Number(p[i]).toFixed(1).replace(/\.0$/, '')}%`).join(' / ')}</p><p>탐구: {p[8]}<br/>영어: {p[12]}<br/>활용 지표: {p[11]}<br/>수능 {p[9]}% · 기타 {p[10]}</p><p>{p[13]}</p><a href={String(p[15])} target="_blank" rel="noopener noreferrer">2028 시행계획 · {p[14]} ↗</a></div>)}
            {!plans.some(p => p[1] === r.university) && <p>이 대학의 반영방식은 현재 요약에 없습니다. 대학 시행계획·모집요강을 확인하세요.</p>}
          </details>
        </article>)}
        {g.rows.length > limits[g.band] && <button type="button" className={styles.more} onClick={() => setLimits(current => ({...current, [g.band]: current[g.band] + 6}))}>{g.band} 6개 더 보기 ({Math.min(limits[g.band], g.rows.length)}/{g.rows.length})</button>}
      </section>)}
    </div>}
  </section>;
}

function selectedEnglish(english: string) {
  return english ? ` · 영어 ${english}등급(구간 미반영)` : '';
}
