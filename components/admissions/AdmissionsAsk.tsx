"use client";
import { useState } from 'react';
import styles from './ask.module.css';
type Answer = { answer: string; sources: { id: string; title: string; href: string; source: string }[] };
export default function AdmissionsAsk() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
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
  return <section className={styles.panel} aria-labelledby="ask-heading" id="ask">
    <span className={styles.tag}>자료를 찾아 쉽게 설명해요</span>
    <h2 id="ask-heading">입시 자료에 질문하기</h2>
    <p>등록된 자료를 찾아 답하고, 참고한 출처를 함께 보여드려요.</p>
    <form onSubmit={ask}>
      <label htmlFor="admissions-question">궁금한 내용을 문장으로 입력하세요</label>
      <textarea id="admissions-question" value={question} onChange={e => setQuestion(e.target.value)} maxLength={500} rows={2} required placeholder="예: 한국외대 학생부종합 서류형의 수능최저는 어떻게 돼?" disabled={busy} />
      <div className={styles.actions}><small>이름·성적표 등 개인정보는 입력하지 마세요.</small><button disabled={busy || !question.trim()} type="submit">{busy ? '자료를 확인하고 있어요…' : '질문하기 →'}</button></div>
    </form>
    <div aria-live="polite" aria-busy={busy}>{busy && <p role="status">관련 자료를 찾아 답변을 작성하고 있습니다.</p>}{error && <p role="alert">{error}</p>}{answer && <div className={styles.answer}><h3>자료에서 찾은 답변</h3><p>{answer.answer}</p>{answer.sources.length > 0 && <><h4>답변에 참고한 자료</h4><ul>{answer.sources.map(s => <li key={s.id}><a href={s.href} target="_blank" rel="noopener noreferrer">[{s.id}] {s.title} ↗</a><small>{s.source}</small></li>)}</ul></>}<small>AI 답변에는 오류가 있을 수 있어요. 지원 전 해당 학년도 최종 모집요강을 확인하세요.</small></div>}</div>
  </section>;
}
