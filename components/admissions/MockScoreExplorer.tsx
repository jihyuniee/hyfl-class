"use client";
import { useState } from "react";
import { mockPercentile, mockStandard, readScore } from "@/components/lib/mockScores";
import registry from '@/public/admissions-explorer/seoul-universities.json';
import SeoulUniversityOptions from './SeoulUniversityOptions';
import styles from "./explorer.module.css";

const subjects = ['국어', '수학', '통합사회', '통합과학'];
const points = (value: number) => Number(value.toFixed(2)).toLocaleString('ko-KR');

export default function MockScoreExplorer({ university, onUniversityChange }: { university: string; onUniversityChange: (value: string) => void }) {
  const [examYear, setExamYear] = useState('2026');
  const [examMonth, setExamMonth] = useState('');
  const [examGrade, setExamGrade] = useState('고2');
  const [examKind, setExamKind] = useState('학력평가');
  const [history, setHistory] = useState('');
  const [mode, setMode] = useState<'subjects' | 'totals'>('subjects');
  const [standards, setStandards] = useState(['', '', '', '']);
  const [percentiles, setPercentiles] = useState(['', '', '', '']);
  const [totalStandard, setTotalStandard] = useState('');
  const [totalAverage, setTotalAverage] = useState('');
  const [english, setEnglish] = useState('');
  const [submitted, setSubmitted] = useState<{ standard: number; average: number; english: string; history: string; exam: string } | null>(null);
  const [error, setError] = useState('');
  const standard = mode === 'subjects' ? mockStandard(standards) : readScore(totalStandard, 600);
  const average = mode === 'subjects' ? mockPercentile(percentiles) : readScore(totalAverage, 100);
  const clearResult = () => { setSubmitted(null); setError(''); };

  return <section className={`${styles.panel} ${styles.scoreEntry}`} id="mock-score" aria-labelledby="mock-heading">
    <h2 id="mock-heading">내 모의고사 성적 확인</h2>
    <p>성적표의 <b>표준점수와 백분위</b>를 입력해 단순합과 평균을 확인하고, 대학이 공개한 정시 입결과 반영방법을 찾아보세요.</p>
    <p className={styles.scopeNote}>2028 대입 준비용 성적 확인입니다. 대학별 환산점수·합격선·지원 가능성을 계산하는 기능은 아닙니다.</p>
    <form onSubmit={e => {
      e.preventDefault();
      if (!examYear.trim() || !Number.isInteger(Number(examYear)) || Number(examYear) < 2025 || Number(examYear) > 2027 || !examMonth) { setError('시험 연도(2025~2027)와 월을 확인해 주세요.'); return; }
      if (standard === null || average === null) { setError(mode === 'subjects' ? '네 과목의 표준점수와 백분위를 모두 입력해 주세요.' : '표준점수 합(0~600)과 평균 백분위(0~100)를 입력해 주세요.'); return; }
      setSubmitted({standard, average, english, history, exam: `${examYear}년 ${examMonth}월 · ${examGrade} · ${examKind}`}); setError('');
    }}>
      <fieldset className={styles.examContext}><legend>어느 시험의 성적인가요?</legend>
        <label>시험 연도<input aria-label="시험 연도" type="number" min="2025" max="2027" step="1" required value={examYear} onChange={e => { setExamYear(e.target.value); clearResult(); }} /></label>
        <label>시험 월<select aria-label="시험 월" required value={examMonth} onChange={e => { setExamMonth(e.target.value); clearResult(); }}><option value="">월 선택</option>{Array.from({length:12},(_,i)=><option key={i} value={String(i+1)}>{i+1}월</option>)}</select></label>
        <label>응시 학년<select aria-label="응시 학년" value={examGrade} onChange={e => { setExamGrade(e.target.value); clearResult(); }}>{['고1','고2','고3·졸업생'].map(g=><option key={g}>{g}</option>)}</select></label>
        <label>시험 구분<select aria-label="시험 구분" value={examKind} onChange={e => { setExamKind(e.target.value); clearResult(); }}>{['학력평가','모의평가','수능'].map(g=><option key={g}>{g}</option>)}</select></label>
      </fieldset>
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
      <div className={styles.gradeInputs}><label>영어 등급 · 선택<select aria-label="영어 등급" value={english} onChange={e => { setEnglish(e.target.value); clearResult(); }}><option value="">선택 안 함</option>{Array.from({length:9},(_,i)=><option key={i} value={i+1}>{i+1}등급</option>)}</select></label><label>한국사 등급 · 선택<select aria-label="한국사 등급" value={history} onChange={e => { setHistory(e.target.value); clearResult(); }}><option value="">선택 안 함</option>{Array.from({length:9},(_,i)=><option key={i} value={i+1}>{i+1}등급</option>)}</select></label></div>
      <label className={styles.searchLabel}>확인할 서울 대학<select className={styles.universitySelect} value={university} onChange={e => onUniversityChange(e.target.value)}><option value="">서울 소재 전체 {registry.records.length}곳</option><SeoulUniversityOptions /></select></label>
      <p className={styles.muted}>{standard !== null && average !== null ? `입력 점수: 표준점수 합 ${points(standard)} · 평균 백분위 ${points(average)}` : '표준점수는 네 과목의 합, 백분위는 (국어 + 수학 + 두 탐구 평균) ÷ 3입니다.'}</p>
      <button className={styles.primary} type="submit">입력 점수 확인</button>
      {error && <p role="alert">{error}</p>}
    </form>
    <p className={styles.muted}>입력값은 이 화면에서만 사용하며 서버 전송·저장하지 않습니다.</p>

    {submitted && <div aria-live="polite" className={styles.scoreSummary}>
      <p><b>{submitted.exam}</b></p><h3>표준점수 단순합 {points(submitted.standard)} · 국수탐 평균 백분위 {points(submitted.average)}</h3>
      <p>입력한 점수의 계산 결과입니다. 대학별 환산점수나 합격선이 아닙니다.{(submitted.english || submitted.history) && ` 영어·한국사 등급은 이 계산에 반영하지 않았습니다.`}</p>
      <p>다른 시험·학년의 성적이나 과거 입결과 같은 기준으로 바로 비교할 수 없습니다. 아래 공개 입결에서 결과 학년도·지표·출처를 확인하세요.</p>
      <p className={styles.scopeNote}><b>상향·소신·적정 판정: 자료 미확보</b><br />입력한 시험과 2028 대입에 적용되는 대학·학과별 판정 자료가 아직 연결되어 있지 않습니다. 기존 앱의 점수 차이 구간을 합격 가능성으로 표시하지 않습니다.</p>
      <a href="#universities">서울 소재 전체 {registry.records.length}개 학교와 수록 자료 확인 ↓</a>
    </div>}
    <div className={styles.tools}><a href="#results">{university || '대학별'} 실제 공개 입결 찾기 →</a><a href="#plans">2028 정시 반영방법 확인 →</a></div>
    <details className={styles.scoreMethod}><summary>상담 자료의 기준 확인</summary>
      <p>2028 시행계획은 대학이 발표한 전형 계획이고, 2024~2026 공개 입결은 해당 학년도의 과거 결과입니다. 두 자료를 구분해 표시합니다. 공개되지 않은 값은 추정해서 채우지 않습니다.</p>
      <p>유니브 등 상담 프로그램의 결과를 활용할 때도 적용 시험·대상 학년·입학 학년도·자료 기준일을 먼저 확인해야 합니다. 현재 이 화면에는 유니브 결과가 연결되어 있지 않습니다.</p>
    </details>

  </section>;
}
