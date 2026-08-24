"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type RecordItem = {
  id: string;
  created_at: string;
  type: "friend" | "self";
  from_name: string;
  to_name: string | null;
  category: string | null;
  content: string;
};

export default function PraiseTeacherPage() {
  const [password, setPassword] = useState("");
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all"|"friend"|"self">("all");

  async function load() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/praise/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(body.error ?? "기록을 불러오지 못했습니다.");
      return;
    }
    setRecords(body.records ?? []);
    setAuthed(true);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter(r => {
      if (type !== "all" && r.type !== type) return false;
      if (!q) return true;
      return [r.from_name, r.to_name, r.category, r.content]
        .some(v => (v ?? "").toLowerCase().includes(q));
    });
  }, [records, query, type]);

  function downloadCsv() {
    const rows = [
      ["작성일","기록 종류","작성자","대상 친구","특성","내용"],
      ...filtered.map(r => [
        new Date(r.created_at).toLocaleString("ko-KR", { timeZone:"Asia/Seoul" }),
        r.type === "friend" ? "친구의 좋은 행동" : "나의 실천",
        r.from_name,
        r.to_name ?? "",
        r.category ?? "",
        r.content,
      ]),
    ];
    const csv = "\uFEFF" + rows.map(row =>
      row.map(cell => `"${String(cell).replaceAll('"','""')}"`).join(",")
    ).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type:"text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "우리반_성장기록.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!authed) {
    return (
      <div className="hy-card" style={{ maxWidth:480, margin:"40px auto", padding:"28px" }}>
        <p style={{ fontSize:26, margin:"0 0 10px" }}>🔒</p>
        <h1 style={{ fontSize:20, fontWeight:900, margin:"0 0 8px", color:"var(--text)" }}>
          담임 전용 성장 기록
        </h1>
        <p style={{ fontSize:12, lineHeight:1.7, color:"var(--text-muted)", margin:"0 0 18px" }}>
          학생이 실명으로 제출한 비공개 기록입니다. 담임 비밀번호를 입력해주세요.
        </p>
        <div style={{ display:"flex", gap:8 }}>
          <input type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && load()}
            placeholder="담임 비밀번호" className="hy-input" />
          <button onClick={load} disabled={loading} className="hy-btn hy-btn-primary"
            style={{ flexShrink:0 }}>
            {loading ? "확인 중..." : "확인"}
          </button>
        </div>
        {error && <p style={{ fontSize:12, color:"#dc2626", margin:"10px 0 0" }}>{error}</p>}
        <Link href="/praise" style={{ display:"inline-block", marginTop:18, fontSize:12, color:"var(--text-muted)" }}>
          ← 학생 작성 화면
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div className="hy-hero">
        <h1 style={{ color:"#fff", fontSize:"clamp(22px,4vw,30px)", fontWeight:900, margin:"0 0 7px" }}>
          🔒 담임 전용 성장 기록
        </h1>
        <p style={{ color:"rgba(255,255,255,.85)", fontSize:12, margin:0 }}>
          학생들의 실천과 서로 발견한 좋은 행동을 확인합니다.
        </p>
      </div>

      <div className="hy-card" style={{ padding:"16px", display:"flex", gap:8, flexWrap:"wrap" }}>
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder="이름·특성·내용 검색" className="hy-input"
          style={{ flex:"1 1 220px" }} />
        <select value={type} onChange={e => setType(e.target.value as typeof type)}
          className="hy-input" style={{ flex:"0 1 180px", cursor:"pointer" }}>
          <option value="all">전체 기록</option>
          <option value="self">나의 실천</option>
          <option value="friend">친구의 좋은 행동</option>
        </select>
        <button onClick={downloadCsv} className="hy-btn" style={{ fontSize:12 }}>
          CSV 내려받기
        </button>
      </div>

      <p style={{ fontSize:12, color:"var(--text-muted)", fontWeight:700, margin:0 }}>
        총 {filtered.length}건
      </p>

      {filtered.length === 0 ? (
        <div className="hy-card" style={{ padding:"36px", textAlign:"center", color:"var(--text-subtle)", fontSize:13 }}>
          조건에 맞는 기록이 없습니다.
        </div>
      ) : filtered.map(r => (
        <div key={r.id} className="hy-card" style={{
          padding:"18px 20px",
          borderLeft:`4px solid ${r.type === "friend" ? "var(--primary)" : "#f59e0b"}`,
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", gap:10, flexWrap:"wrap", marginBottom:9 }}>
            <div style={{ display:"flex", gap:7, flexWrap:"wrap", alignItems:"center" }}>
              <span style={{ fontSize:11, fontWeight:800, padding:"4px 9px", borderRadius:999,
                background:r.type === "friend" ? "var(--primary-light)" : "#fffbeb",
                color:r.type === "friend" ? "var(--primary)" : "#92400e" }}>
                {r.type === "friend" ? "친구의 좋은 행동" : "나의 실천"}
              </span>
              <strong style={{ fontSize:13, color:"var(--text)" }}>
                {r.type === "friend" ? `${r.from_name} → ${r.to_name}` : r.from_name}
              </strong>
              {r.category && <span style={{ fontSize:11, color:"var(--text-muted)" }}>{r.category}</span>}
            </div>
            <span style={{ fontSize:11, color:"var(--text-subtle)" }}>
              {new Date(r.created_at).toLocaleString("ko-KR", { timeZone:"Asia/Seoul" })}
            </span>
          </div>
          <p style={{ fontSize:13, color:"var(--text)", lineHeight:1.8, whiteSpace:"pre-wrap", margin:0 }}>
            {r.content}
          </p>
        </div>
      ))}
    </div>
  );
}
