import Link from "next/link";
import majors from "@/public/admissions-explorer/majors.json";
import directory from "@/public/admissions-explorer/directory.json";
import { belongsToProfile } from "@/components/lib/admissionsBrowse";
import styles from "./explorer.module.css";

export default function FieldBrowse({ active = "", onChoose }: { active?: string; onChoose?: (id: string) => void }) {
  return <div className={styles.fieldGrid}>{majors.filter(p => !active || p.id === active).map(p => {
    const units = directory.records.filter(u => belongsToProfile(u, p.id));
    const examples = units.filter((u, i, all) => all.findIndex(a => a.university === u.university) === i).slice(0, 3);
    return <article key={p.id} className={styles.fieldCard} data-active={active === p.id}>
      <span className={styles.eyebrow}>{p.field}</span><h3>{p.title}</h3><p>{p.learn}</p>
      <div className={styles.fieldExamples}><small>이런 학과가 있어요</small>{examples.map(u => <span key={`${u.university}/${u.department}`}>{u.university} · {u.department}</span>)}</div>
      {onChoose ? <button type="button" aria-pressed={active === p.id} onClick={() => onChoose(active === p.id ? "" : p.id)}>{active === p.id ? "전체 계열로 돌아가기" : "이 계열 학과·교육과정 더 보기"} →</button> : <Link href={`/admissions/susi?area=${p.id}`}>학과·교육과정·수시 전형 보기 →</Link>}
    </article>;
  })}</div>;
}
