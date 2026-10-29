import results from "@/public/admissions-seoul/results.json";
import { percentileBands, latestPercentileResults, inPercentileBand, previewPercentileResults, type PercentileResult } from "@/components/lib/admissionsBrowse";
import styles from "./explorer.module.css";
const latest = latestPercentileResults(results);
function ResultItem({ row }: { row: PercentileResult }) {
  return <li><div><b>{row.univ} · {row.dept}</b><span>{row.year}학년도 · 등록자 백분위 70% 컷</span></div><strong>{row.cut_pct70}</strong><details><summary>기준·출처</summary><p>{row.metric_note}</p><a href={row.source} target="_blank" rel="noopener noreferrer">공개 입결 원문 ↗</a></details></li>;
}
export default function PercentileBrowse() {
  return <section aria-labelledby="percentile-browse"><h2 id="percentile-browse">백분위 구간별로 지난 입결 둘러보기</h2><p className={styles.muted}>아래는 대학이 공개한 <b>등록자 백분위 70% 컷</b>이에요. 내 성적과 가까운 구간부터 살펴보세요. 대학별 산식이 달라 합격 가능성을 직접 판정하는 기준은 아니에요.</p>
    <div className={styles.bandGrid}>{percentileBands.map(band => {
      const rows = latest.filter(r => inPercentileBand(r, band.id));
      const preview = previewPercentileResults(rows);
      const remaining = rows.filter(r => !preview.includes(r));
      return <article className={styles.bandCard} key={band.id}><span className={styles.eyebrow}>공개 백분위 70% 컷 구간</span><h3>{band.label}</h3>{rows.length ? <><ul className={styles.bandResults}>{preview.map(r => <ResultItem key={`${r.univ}/${r.dept}`} row={r} />)}</ul>{remaining.length > 0 && <details className={styles.bandMore}><summary>이 구간의 학과 {remaining.length}개 더 보기</summary><ul className={styles.bandResults}>{remaining.map(r => <ResultItem key={`${r.univ}/${r.dept}`} row={r} />)}</ul></details>}</> : <p className={styles.muted}>현재 수록한 백분위 70% 컷 자료가 없어요. 지원할 대학이나 합격 사례가 없다는 뜻은 아니에요.</p>}</article>;
    })}</div><p className={styles.muted}>학과별로 공개된 가장 최근 백분위 70% 컷을 표시합니다(2024~2026). 평균 백분위·대학 환산점수·지원참고 예상점수는 섞지 않았어요. 2028 반영방식은 따로 확인하세요.</p>
  </section>;
}
