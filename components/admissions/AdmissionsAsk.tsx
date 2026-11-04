"use client";
import { useState } from 'react';
import styles from './ask.module.css';
import explorer from './explorer.module.css';
type Answer = { answer: string; sources: { id: string; title: string; href: string; source: string }[] };
export default function AdmissionsAsk({ question, onQuestionChange }: { question: string; onQuestionChange: (value: string) => void }) {
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  function changeQuestion(value: string) { onQuestionChange(value); setAnswer(null); setError(''); }
  async function ask(event: React.FormEvent) {
    event.preventDefault(); if (busy || !question.trim()) return;
    setBusy(true); setError(''); setAnswer(null);
    try {
      const response = await fetch('/api/admissions/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }), signal: AbortSignal.timeout(55000) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '답변을 불러오지 못했습니다.');
      setAnswer(result);
    } catch (e) { setError(e instanceof Error && e.name !== 'TimeoutError' ? e.message : '응답이 지연되고 있어요. 다시 시도해 주세요.'); }
    finally { setBusy(false); }
  }
  return <div className={styles.panel} id="ask">
    <form onSubmit={ask}>
      <label htmlFor="admissions-search">대학·학과 검색 또는 입시 질문</label>
      <div className={styles.inputRow}>
        <span aria-hidden="true">⌕</span>
        <input id="admissions-search" type="search" autoComplete="off" value={question} onChange={e => changeQuestion(e.target.value)} maxLength={500} required placeholder="예: 한국외대, 경영 / 한국외대 서류형 수능최저는?" disabled={busy} aria-describedby="admissions-search-help" />
        {question && <button className={styles.clear} type="button" onClick={() => changeQuestion('')} disabled={busy} aria-label="검색어 지우기">지우기</button>}
        <button className={styles.submit} disabled={busy || !question.trim()} type="submit">{busy ? '확인 중…' : '질문하기 →'}</button>
      </div>
      <p id="admissions-search-help" className={styles.help}>입력하면 관련 항목을 찾아드려요. Enter 또는 질문하기를 누르면 자료를 바탕으로 답해드려요.</p>
      <div className={explorer.searchExamples}><span>바로 찾아보기</span>{["한국외대", "중국", "경영", "수능최저"].map(word => <button key={word} type="button" disabled={busy} onClick={() => changeQuestion(word)}>{word}</button>)}</div>
      <small>이름·성적표 등 개인정보는 입력하지 마세요.</small>
    </form>
    <div aria-live="polite" aria-busy={busy}>{busy && <p role="status">관련 자료를 찾아 답변을 작성하고 있습니다.</p>}{error && <p role="alert">{error}</p>}{answer && <div className={styles.answer}><h3>자료에서 찾은 답변</h3><p>{answer.answer}</p>{answer.sources.length > 0 && <><h4>답변에 참고한 자료</h4><ul>{answer.sources.map(s => <li key={s.id}><a href={s.href} target="_blank" rel="noopener noreferrer">[{s.id}] {s.title} ↗</a><small>{s.source}</small></li>)}</ul></>}<small>AI 답변에는 오류가 있을 수 있어요. 지원 전 해당 학년도 최종 모집요강을 확인하세요.</small></div>}</div>
  </div>;
}
