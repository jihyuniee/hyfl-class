"use client";
import { useState } from "react";
import { mockPercentile, mockStandard, readScore } from "@/components/lib/mockScores";
import styles from "./explorer.module.css";

const subjects = ['국어', '수학', '통합사회', '통합과학'];
const points = (value: number) => Number(value.toFixed(2)).toLocaleString('ko-KR');

export default function MockScoreExplorer({ university }: { university: string }) {
  const [mode, setMode] = useState<'subjects' | 'totals'>('subjects');
  const [standards, setStandards] = useState(['', '', '', '']);
  const [percentiles, setPercentiles] = useState(['', '', '', '']);
  const [totalStandard, setTotalStandard] = useState('');
  const [totalAverage, setTotalAverage] = useState('');
  const [english, setEnglish] = useState('');
  const [submitted, setSubmitted] = useState<{ standard: number; average: number; english: string } | null>(null);
  const [error, setError] = useState('');
  const standard = mode === 'subjects' ? mockStandard(standards) : readScore(totalStandard, 600);
  const average = mode === 'subjects' ? mockPercentile(percentiles) : readScore(totalAverage, 100);
  const clearResult = () => { setSubmitted(null); setError(''); };

  return <section className={styles.panel} id="mock-score" aria-labelledby="mock-heading">
    <h2 id="mock-heading">내 성적 확인·정시 자료 찾기</h2>
    <p>성적표의 <b>표준점수와 백분위</b>를 입력해 단순합과 평균을 확인하고, 대학이 공개한 정시 입결과 반영방법을 찾아보세요.</p>
    <aside className={styles.notice}><strong>이 화면에서는 합격 가능성을 판정하지 않습니다.</strong><p>기존 지원참고표는 적용 시험·대상 학년이 확인되지 않아 비교에 사용하지 않습니다. 시험별 기준과 대학별 환산방법이 확인된 자료 없이 상향·소신·적정·안정을 표시하지 않습니다.</p></aside>
    <form onSubmit={e => {
      e.preventDefault();
      if (standard === null || average === null) { setError(mode === 'subjects' ? '네 과목의 표준점수와 백분위를 모두 입력해 주세요.' : '표준점수 합(0~600)과 평균 백분위(0~100)를 입력해 주세요.'); return; }
      setSubmitted({standard, average, english}); setError('');
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
      <label className={styles.englishInput}>영어 등급 <span className={styles.muted}>(선택 · 대학별 환산에는 미반영)</span><select aria-label="영어 등급" value={english} onChange={e => { setEnglish(e.target.value); clearResult(); }}><option value="">선택 안 함</option>{Array.from({length:9}, (_,i) => <option key={i} value={i+1}>{i+1}등급</option>)}</select></label>
      <p className={styles.muted}>{standard !== null && average !== null ? `입력 점수: 표준점수 합 ${points(standard)} · 평균 백분위 ${points(average)}` : '표준점수는 네 과목의 합, 백분위는 (국어 + 수학 + 두 탐구 평균) ÷ 3입니다.'}</p>
      <button className={styles.primary} type="submit">입력 점수 확인</button>
      {error && <p role="alert">{error}</p>}
    </form>
    <p className={styles.muted}>입력값은 이 화면에서만 사용하며 서버 전송·저장하지 않습니다.</p>

    {submitted && <div aria-live="polite" className={styles.scoreSummary}>
      <h3>표준점수 단순합 {points(submitted.standard)} · 국수탐 평균 백분위 {points(submitted.average)}</h3>
      <p>입력한 점수의 계산 결과입니다. 대학별 환산점수나 합격선이 아닙니다.{submitted.english && ` 영어 ${submitted.english}등급은 이 계산에 반영하지 않았습니다.`}</p>
      <p>다른 시험·학년의 성적이나 과거 입결과 같은 기준으로 바로 비교할 수 없습니다. 아래 공개 입결에서 결과 학년도·지표·출처를 확인하세요.</p>
    </div>}
    <div className={styles.tools}><a href="#results">{university || '대학별'} 실제 공개 입결 찾기 →</a><a href="#plans">2028 정시 반영방법 확인 →</a></div>
    <details className={styles.scoreMethod}><summary>상담 자료의 기준 확인</summary>
      <p>공개 입결은 해당 학년도의 실제 결과이고, 시행계획은 해당 입학 학년도의 전형 계획입니다. 두 자료를 구분해 표시합니다. 공개되지 않은 값은 추정해서 채우지 않습니다.</p>
      <p>유니브 등 상담 프로그램의 결과를 활용할 때도 적용 시험·대상 학년·입학 학년도·자료 기준일을 먼저 확인해야 합니다. 현재 이 화면에는 유니브 결과가 연결되어 있지 않습니다.</p>
    </details>

  </section>;
}
