"use client";
import { useState } from "react";
import styles from "./seoul.module.css";

type Reference = { university: string; department: string; admission: string; group: string; standardSum: number; percentileSum: number };

export default function ReferenceTable({ university, query }: { university: string; query: string }) {
  const [rows, setRows] = useState<Reference[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [limit, setLimit] = useState(30);
  async function load() {
    setLoading(true); setError(false);
    try {
      const response = await fetch("/admissions-explorer/reference.json");
      if (!response.ok) throw new Error("Reference unavailable");
      setRows(await response.json());
    } catch { setError(true); } finally { setLoading(false); }
  }
  const filtered = (rows || []).filter(r => (!university || r.university === university)
    && `${r.university} ${r.department}`.includes(query.trim()));
  return <section className={styles.section} aria-labelledby="reference-heading">
    <h2 id="reference-heading">표점합으로도 보고 싶다면 · 지원참고 예상점수</h2>
    <aside className={styles.notice}><strong>아래 값은 실제 합격 컷이 아닌 지원참고 예상점수입니다.</strong><p>기존 이투스 2027학년도 9월 학력평가 지원참고표 자료의 2028 모집단위를 표시합니다. 표점합은 국어+수학+사회+과학 단순합이며 대학 환산점수와 다릅니다. 백분위는 자료의 합산값을 3으로 나눈 국수탐 평균입니다. 저장된 출처명에는 고1 가채점 자료로 표기되어 있으며 원본 시험의 시행일·대상과 현재 고2 성적에 대한 적용성은 재확인 중입니다. 현재 성적의 지원 가능성 판단용으로 검증된 표는 아닙니다.</p></aside>
    <p>위의 대학·학과 검색어와 연동됩니다. 과거 입결의 결과 연도·공개 지표 필터는 적용하지 않습니다. 이 표로 합격 가능성을 자동 판정하지 않습니다.</p>
    {rows === null && <button type="button" className={styles.more} disabled={loading} onClick={load}>{loading ? "지원참고표 불러오는 중…" : error ? "불러오기 실패 · 다시 시도" : "지원참고 예상점수 열기"}</button>}
    {rows !== null && <><p role="status">지원참고 예상점수 {filtered.length}개 전형·모집단위</p><div className={styles.tableWrap}><table><caption>실제 등록자 입결과 구분해서 읽으세요. 대학별 영어·탐구·학생부 반영은 별도 확인합니다.</caption><thead><tr><th scope="col">대학·모집단위</th><th scope="col">전형·모집군</th><th scope="col">표준점수 단순합 예상</th><th scope="col">국수탐 평균백분위 예상</th></tr></thead><tbody>{filtered.slice(0, limit).map(r => <tr key={`${r.university}/${r.department}/${r.admission}/${r.group}`}><th scope="row">{r.university}<span>{r.department}</span></th><td>{r.admission} · {r.group}군</td><td>{r.standardSum}</td><td>{(r.percentileSum / 3).toFixed(2)}</td></tr>)}</tbody></table></div>{filtered.length === 0 && <p className={styles.empty}>이 조건의 지원참고 점수가 없습니다.</p>}{filtered.length > limit && <button type="button" className={styles.more} onClick={() => setLimit(n => n + 30)}>30개 더 보기</button>}</>}
  </section>;
}
