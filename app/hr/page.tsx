"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type HRRecord = {
  id: string;
  created_at: string;
  date: string;
  agenda: string;
  decisions: string | null;
  notes: string | null;
  author: string | null;
};

function toISODateKST() {
  const k = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return `${k.getFullYear()}-${String(k.getMonth()+1).padStart(2,"0")}-${String(k.getDate()).padStart(2,"0")}`;
}

export default function HRPage() {
  const [records, setRecords] = useState<HRRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [fDate,      setFDate]      = useState(toISODateKST());
  const [fAgenda,    setFAgenda]    = useState("");
  const [fDecisions, setFDecisions] = useState("");
  const [fNotes,     setFNotes]     = useState("");
  const [fAuthor,    setFAuthor]    = useState("");
  const [loading,    setLoading]    = useState(false);

  async function load() {
    const { data } = await supabase
      .from("hr_records")
      .select("*")
      .order("date", { ascending: false });
    setRecords((data as HRRecord[]) ?? []);
  }

  useEffect(() => { load(); }, []);

  async function submit() {
    if (!fAgenda.trim()) { alert("안건을 입력하세요"); return; }
    setLoading(true);
    const { error } = await supabase.from("hr_records").insert({
      date: fDate,
      agenda: fAgenda.trim(),
      decisions: fDecisions.trim() || null,
      notes: fNotes.trim() || null,
      author: fAuthor.trim() || null,
    });
    setLoading(false);
    if (error) { alert(error.message); return; }
    setFAgenda(""); setFDecisions(""); setFNotes(""); setFormOpen(false);
    await load();
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* 헤더 */}
      <div className="hy-hero">
        <div style={{ position:"relative" }}>
          <p style={{ color:"rgba(255,255,255,0.8)", fontSize:13, fontWeight:600, margin:"0 0 6px" }}>
            우리반 회의 기록
          </p>
          <h1 style={{ color:"#fff", fontSize:"clamp(22px,4vw,32px)", fontWeight:900, margin:0, letterSpacing:"-0.5px" }}>
            📝 HR / 학급회의 기록
          </h1>
        </div>
      </div>

      {/* 글쓰기 버튼 */}
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button onClick={() => setFormOpen(o => !o)}
          className="hy-btn hy-btn-primary"
          style={{ fontSize:13, padding:"8px 18px" }}>
          {formOpen ? "닫기" : "✏️ 회의 기록 작성"}
        </button>
      </div>

      {/* 작성 폼 */}
      {formOpen && (
        <div className="hy-card" style={{ padding:"22px 24px" }}>
          <h3 style={{ fontSize:15, fontWeight:800, color:"var(--text)", margin:"0 0 16px" }}>
            회의 기록 작성
          </h3>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
              <input type="date" value={fDate} onChange={e => setFDate(e.target.value)}
                className="hy-input" />
              <input placeholder="작성자 이름 (선택)" value={fAuthor} onChange={e => setFAuthor(e.target.value)}
                className="hy-input" />
            </div>
            <textarea
              placeholder="📋 안건 * (오늘 HR/회의에서 다룬 내용)"
              value={fAgenda} onChange={e => setFAgenda(e.target.value)}
              className="hy-input" style={{ minHeight:100, resize:"vertical" }}
            />
            <textarea
              placeholder="✅ 결정사항 (선택) — 회의에서 결정된 내용"
              value={fDecisions} onChange={e => setFDecisions(e.target.value)}
              className="hy-input" style={{ minHeight:80, resize:"vertical" }}
            />
            <textarea
              placeholder="🗒 기타 메모 (선택) — 자유롭게"
              value={fNotes} onChange={e => setFNotes(e.target.value)}
              className="hy-input" style={{ minHeight:70, resize:"vertical" }}
            />
            <button onClick={submit} disabled={loading}
              className="hy-btn hy-btn-primary" style={{ fontSize:13, alignSelf:"flex-start" }}>
              {loading ? "저장 중..." : "기록 저장"}
            </button>
          </div>
        </div>
      )}

      {/* 기록 목록 */}
      {records.length === 0 ? (
        <div className="hy-card" style={{ padding:"40px", textAlign:"center" }}>
          <p style={{ fontSize:15, color:"var(--text-subtle)", fontWeight:600 }}>
            아직 회의 기록이 없어요. 첫 기록을 남겨봐요! 📝
          </p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {records.map(r => {
            const isExp = expandedId === r.id;
            const d = new Date(r.date);
            const weekday = ["일","월","화","수","목","금","토"][d.getDay()];
            return (
              <div key={r.id} className="hy-card"
                style={{ padding:"18px 22px", cursor:"pointer" }}
                onClick={() => setExpandedId(isExp ? null : r.id)}>

                {/* 헤더 */}
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  {/* 날짜 배지 */}
                  <div style={{
                    width:48, textAlign:"center", flexShrink:0,
                    background:"linear-gradient(135deg,#f472b6,#a78bfa)",
                    borderRadius:12, padding:"6px 0",
                  }}>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.8)", fontWeight:700 }}>
                      {d.getMonth()+1}월
                    </div>
                    <div style={{ fontSize:20, fontWeight:900, color:"#fff", lineHeight:1.1 }}>
                      {String(d.getDate()).padStart(2,"0")}
                    </div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.8)", fontWeight:700 }}>
                      {weekday}요일
                    </div>
                  </div>

                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:15, color:"var(--text)", marginBottom:4 }}>
                      {r.agenda.length > 50 ? r.agenda.slice(0,50)+"..." : r.agenda}
                    </div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {r.decisions && (
                        <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:999, background:"#f0fdf4", color:"#22c55e" }}>
                          ✅ 결정사항 있음
                        </span>
                      )}
                      {r.author && (
                        <span style={{ fontSize:11, color:"var(--text-subtle)", fontWeight:600 }}>
                          작성: {r.author}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize:14, color:"var(--text-subtle)" }}>
                    {isExp ? "▴" : "▾"}
                  </span>
                </div>

                {/* 상세 내용 */}
                {isExp && (
                  <div style={{ marginTop:16, paddingTop:16, borderTop:"1.5px solid var(--border)", display:"flex", flexDirection:"column", gap:14 }}>
                    <div>
                      <p style={{ fontSize:12, fontWeight:800, color:"var(--text-subtle)", margin:"0 0 6px", textTransform:"uppercase", letterSpacing:"0.06em" }}>
                        📋 안건
                      </p>
                      <p style={{ fontSize:14, color:"var(--text)", lineHeight:1.8, margin:0, whiteSpace:"pre-wrap" }}>
                        {r.agenda}
                      </p>
                    </div>
                    {r.decisions && (
                      <div style={{ background:"#f0fdf4", borderRadius:12, padding:"12px 16px", border:"1.5px solid #bbf7d0" }}>
                        <p style={{ fontSize:12, fontWeight:800, color:"#22c55e", margin:"0 0 6px", textTransform:"uppercase", letterSpacing:"0.06em" }}>
                          ✅ 결정사항
                        </p>
                        <p style={{ fontSize:14, color:"var(--text)", lineHeight:1.8, margin:0, whiteSpace:"pre-wrap" }}>
                          {r.decisions}
                        </p>
                      </div>
                    )}
                    {r.notes && (
                      <div style={{ background:"#fffbeb", borderRadius:12, padding:"12px 16px", border:"1.5px solid #fde68a" }}>
                        <p style={{ fontSize:12, fontWeight:800, color:"#f59e0b", margin:"0 0 6px", textTransform:"uppercase", letterSpacing:"0.06em" }}>
                          🗒 메모
                        </p>
                        <p style={{ fontSize:14, color:"var(--text)", lineHeight:1.8, margin:0, whiteSpace:"pre-wrap" }}>
                          {r.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
