"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type Item = {
  id: string;
  type: "수행평가" | "고사" | "학급일정" | "학교일정";
  date: string;
  title: string;
  subject?: string | null;
  created_by?: string | null;
};

const TYPE_STYLE: Record<string, { bg: string; color: string; dot: string; border: string; pill: string }> = {
  수행평가: {
    bg: "linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)",
    color: "#9333ea",
    dot: "#9333ea",
    border: "#e9d5ff",
    pill: "#f3e8ff",
  },
  고사: {
    bg: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
    color: "#e11d48",
    dot: "#e11d48",
    border: "#fecdd3",
    pill: "#ffe4e6",
  },
  학급일정: {
    bg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    color: "#2563eb",
    dot: "#2563eb",
    border: "#bfdbfe",
    pill: "#dbeafe",
  },
  학교일정: {
    bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
    color: "#16a34a",
    dot: "#16a34a",
    border: "#bbf7d0",
    pill: "#dcfce7",
  },
};

const TYPE_TAG_BG: Record<string, string> = {
  수행평가: "#f3e8ff",
  고사:     "#ffe4e6",
  학급일정: "#dbeafe",
  학교일정: "#dcfce7",
};

const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const DAYS   = ["일","월","화","수","목","금","토"];

// ✅ 관리자 비밀번호 — .env에 NEXT_PUBLIC_ADMIN_PASSWORD 로 설정하세요
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "1234";

function toKST(d: Date) {
  return new Date(d.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
}

function isoToday() {
  const k = toKST(new Date());
  return `${k.getFullYear()}-${String(k.getMonth()+1).padStart(2,"0")}-${String(k.getDate()).padStart(2,"0")}`;
}

export default function SchedulePage() {
  const today = isoToday();
  const nowKST = toKST(new Date());

  const [year,  setYear]  = useState(nowKST.getFullYear());
  const [month, setMonth] = useState(nowKST.getMonth());
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<string>("전체");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [fType,    setFType]    = useState<Item["type"]>("학급일정");
  const [fDate,    setFDate]    = useState(today);
  const [fTitle,   setFTitle]   = useState("");
  const [fSubject, setFSubject] = useState("");
  const [fName,    setFName]    = useState("");
  const [loading,  setLoading]  = useState(false);

  // ✅ 관리자 모드 상태
  const [isAdmin,       setIsAdmin]       = useState(false);
  const [pwModalOpen,   setPwModalOpen]   = useState(false);
  const [pwInput,       setPwInput]       = useState("");
  const [pwError,       setPwError]       = useState(false);

  // ✅ 삭제 확인 모달 상태
  const [deleteTarget,  setDeleteTarget]  = useState<Item | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("schedule_items")
      .select("*")
      .order("date");
    setItems((data as Item[]) ?? []);
  }

  useEffect(() => { load(); }, []);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function isoOf(day: number) {
    return `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  }

  function itemsOn(day: number) {
    const iso = isoOf(day);
    return items.filter(it =>
      it.date === iso && (filter === "전체" || it.type === filter)
    );
  }

  const selectedItems = selectedDate
    ? items.filter(it => it.date === selectedDate && (filter === "전체" || it.type === filter))
    : [];

  const upcomingItems = items
    .filter(it => it.date >= `${year}-${String(month+1).padStart(2,"0")}-01`)
    .filter(it => filter === "전체" || it.type === filter)
    .slice(0, 20);

  async function submit() {
    if (!fTitle.trim()) { alert("제목을 입력하세요"); return; }
    setLoading(true);
    const { error } = await supabase.from("schedule_items").insert({
      type: fType,
      date: fDate,
      title: fTitle.trim(),
      subject: fSubject.trim() || null,
      created_by: fName.trim() || null,
    });
    setLoading(false);
    if (error) { alert(error.message); return; }
    setFTitle(""); setFSubject(""); setFormOpen(false);
    await load();
  }

  // ✅ 관리자 비밀번호 확인
  function handleAdminLogin() {
    if (pwInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setPwModalOpen(false);
      setPwInput("");
      setPwError(false);
    } else {
      setPwError(true);
      setPwInput("");
    }
  }

  // ✅ 삭제 실행
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const { error, count } = await supabase
      .from("schedule_items")
      .delete({ count: "exact" })
      .eq("id", deleteTarget.id);
    setDeleteLoading(false);
    if (error) { alert("삭제 오류: " + error.message); return; }
    // count === 0 이면 RLS가 막은 것
    if (count === 0) {
      alert("삭제 권한이 없어요.\nSupabase 대시보드에서 DELETE 정책을 추가해주세요.\n\nSQL: CREATE POLICY \"allow delete\" ON schedule_items FOR DELETE USING (true);");
      return;
    }
    setDeleteTarget(null);
    await load();
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y-1); setMonth(11); }
    else setMonth(m => m-1);
    setSelectedDate(null);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y+1); setMonth(0); }
    else setMonth(m => m+1);
    setSelectedDate(null);
  }

  const FILTER_OPTIONS = ["전체", "수행평가", "고사", "학급일정", "학교일정"];

  const FILTER_ACTIVE_STYLE: Record<string, { bg: string; color: string; border: string; dot: string }> = {
    전체:     { bg: "var(--primary-light)", color: "var(--primary)", border: "var(--primary)", dot: "var(--primary)" },
    수행평가: { bg: "#f3e8ff", color: "#9333ea", border: "#9333ea", dot: "#9333ea" },
    고사:     { bg: "#ffe4e6", color: "#e11d48", border: "#e11d48", dot: "#e11d48" },
    학급일정: { bg: "#dbeafe", color: "#2563eb", border: "#2563eb", dot: "#2563eb" },
    학교일정: { bg: "#dcfce7", color: "#16a34a", border: "#16a34a", dot: "#16a34a" },
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* ✅ 관리자 비밀번호 입력 모달 */}
      {pwModalOpen && (
        <div
          onClick={() => { setPwModalOpen(false); setPwInput(""); setPwError(false); }}
          style={{
            position:"fixed", inset:0, background:"rgba(0,0,0,0.4)",
            display:"flex", alignItems:"center", justifyContent:"center",
            zIndex:1000,
          }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background:"#fff", borderRadius:18, padding:"28px 28px 24px",
              width:"100%", maxWidth:360, boxShadow:"0 8px 40px rgba(0,0,0,0.18)",
            }}>
            <div style={{ fontSize:22, textAlign:"center", marginBottom:6 }}>🔐</div>
            <h3 style={{ fontSize:16, fontWeight:800, color:"var(--text)", margin:"0 0 4px", textAlign:"center" }}>
              관리자 모드
            </h3>
            <p style={{ fontSize:13, color:"var(--text-muted)", margin:"0 0 18px", textAlign:"center" }}>
              비밀번호를 입력하면 일정을 삭제할 수 있어요
            </p>
            <input
              type="password"
              placeholder="비밀번호"
              value={pwInput}
              onChange={e => { setPwInput(e.target.value); setPwError(false); }}
              onKeyDown={e => e.key === "Enter" && handleAdminLogin()}
              className="hy-input"
              style={{
                width:"100%", marginBottom: pwError ? 6 : 14,
                border: pwError ? "1.5px solid #e11d48" : undefined,
                outline: pwError ? "none" : undefined,
              }}
              autoFocus
            />
            {pwError && (
              <p style={{ fontSize:12, color:"#e11d48", margin:"0 0 12px", fontWeight:600 }}>
                비밀번호가 틀렸어요
              </p>
            )}
            <div style={{ display:"flex", gap:8 }}>
              <button
                onClick={() => { setPwModalOpen(false); setPwInput(""); setPwError(false); }}
                style={{
                  flex:1, padding:"9px 0", borderRadius:10, border:"1.5px solid var(--border)",
                  background:"#fff", color:"var(--text-muted)", fontWeight:700, fontSize:13,
                  cursor:"pointer", fontFamily:"inherit",
                }}>
                취소
              </button>
              <button
                onClick={handleAdminLogin}
                className="hy-btn hy-btn-primary"
                style={{ flex:1, padding:"9px 0", fontSize:13 }}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ 삭제 확인 모달 */}
      {deleteTarget && (
        <div
          onClick={() => !deleteLoading && setDeleteTarget(null)}
          style={{
            position:"fixed", inset:0, background:"rgba(0,0,0,0.4)",
            display:"flex", alignItems:"center", justifyContent:"center",
            zIndex:1000,
          }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background:"#fff", borderRadius:18, padding:"28px 28px 24px",
              width:"100%", maxWidth:360, boxShadow:"0 8px 40px rgba(0,0,0,0.18)",
            }}>
            <div style={{ fontSize:22, textAlign:"center", marginBottom:6 }}>🗑️</div>
            <h3 style={{ fontSize:16, fontWeight:800, color:"var(--text)", margin:"0 0 4px", textAlign:"center" }}>
              일정을 삭제할까요?
            </h3>
            <p style={{ fontSize:13, color:"var(--text-muted)", margin:"0 0 16px", textAlign:"center" }}>
              이 작업은 되돌릴 수 없어요
            </p>
            {/* 삭제 대상 미리보기 */}
            <div style={{
              padding:"12px 14px", borderRadius:12, marginBottom:18,
              background: TYPE_STYLE[deleteTarget.type]?.bg ?? "#f9fafb",
              border:`1px solid ${TYPE_STYLE[deleteTarget.type]?.border ?? "#e5e7eb"}`,
            }}>
              <div style={{ fontWeight:800, fontSize:14, color:"var(--text)" }}>
                {deleteTarget.title}
              </div>
              <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:4 }}>
                <span style={{
                  padding:"1px 8px", borderRadius:999, fontSize:11, fontWeight:700,
                  background: TYPE_STYLE[deleteTarget.type]?.pill ?? "#f3f4f6",
                  color: TYPE_STYLE[deleteTarget.type]?.color ?? "#374151",
                }}>{deleteTarget.type}</span>
                <span style={{ marginLeft:6 }}>{deleteTarget.date}</span>
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                style={{
                  flex:1, padding:"9px 0", borderRadius:10, border:"1.5px solid var(--border)",
                  background:"#fff", color:"var(--text-muted)", fontWeight:700, fontSize:13,
                  cursor:"pointer", fontFamily:"inherit",
                }}>
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                style={{
                  flex:1, padding:"9px 0", borderRadius:10, border:"none",
                  background: deleteLoading ? "#fca5a5" : "#e11d48",
                  color:"#fff", fontWeight:700, fontSize:13,
                  cursor: deleteLoading ? "not-allowed" : "pointer",
                  fontFamily:"inherit", transition:"background 0.15s",
                }}>
                {deleteLoading ? "삭제 중..." : "삭제하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="hy-hero">
        <div style={{ position:"relative" }}>
          <p style={{ color:"rgba(255,255,255,0.8)", fontSize:13, fontWeight:600, margin:"0 0 6px" }}>
            우리반 일정 관리
          </p>
          <h1 style={{ color:"#fff", fontSize:"clamp(22px,4vw,32px)", fontWeight:900, margin:0, letterSpacing:"-0.5px" }}>
            📅 일정/수행평가
          </h1>
        </div>
      </div>

      {/* 필터 + 버튼 영역 */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {FILTER_OPTIONS.map(f => {
            const active = filter === f;
            const st = FILTER_ACTIVE_STYLE[f];
            return (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  display:"flex", alignItems:"center", gap:5,
                  padding:"6px 14px", borderRadius:999, border:"1.5px solid",
                  borderColor: active ? st.border : "var(--border)",
                  background: active ? st.bg : "#fff",
                  color: active ? st.color : "var(--text-muted)",
                  fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit",
                  transition:"all 0.15s",
                }}>
                {f !== "전체" && (
                  <span style={{
                    width:7, height:7, borderRadius:"50%", flexShrink:0,
                    background: active ? st.dot : "var(--text-muted)",
                    transition:"background 0.15s",
                  }} />
                )}
                {f}
              </button>
            );
          })}
        </div>

        {/* ✅ 우측: 관리자 버튼 + 일정 등록 */}
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {isAdmin ? (
            <button
              onClick={() => setIsAdmin(false)}
              style={{
                padding:"7px 14px", borderRadius:999, border:"1.5px solid #fecdd3",
                background:"#fff1f2", color:"#e11d48", fontWeight:700, fontSize:13,
                cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:5,
              }}>
              <span>🔓</span> 관리자 해제
            </button>
          ) : (
            <button
              onClick={() => setPwModalOpen(true)}
              style={{
                padding:"7px 14px", borderRadius:999, border:"1.5px solid var(--border)",
                background:"#fff", color:"var(--text-muted)", fontWeight:700, fontSize:13,
                cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:5,
              }}>
              <span>🔐</span> 관리자
            </button>
          )}
          <button onClick={() => setFormOpen(o => !o)}
            className="hy-btn hy-btn-primary"
            style={{ fontSize:13, padding:"8px 18px" }}>
            {formOpen ? "닫기" : "+ 일정 등록"}
          </button>
        </div>
      </div>

      {/* ✅ 관리자 모드 안내 배너 */}
      {isAdmin && (
        <div style={{
          padding:"10px 16px", borderRadius:12,
          background:"#fff1f2", border:"1.5px solid #fecdd3",
          display:"flex", alignItems:"center", gap:8,
          fontSize:13, color:"#e11d48", fontWeight:600,
        }}>
          <span>🔓</span>
          관리자 모드 — 각 일정의 🗑️ 버튼을 눌러 삭제할 수 있어요
        </div>
      )}

      {/* 등록 폼 */}
      {formOpen && (
        <div className="hy-card" style={{ padding:"22px 24px" }}>
          <h3 style={{ fontSize:15, fontWeight:800, color:"var(--text)", margin:"0 0 16px" }}>
            일정 등록하기
          </h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
            <select value={fType} onChange={e => setFType(e.target.value as Item["type"])}
              className="hy-input" style={{ cursor:"pointer" }}>
              <option value="학급일정">학급일정</option>
              <option value="학교일정">학교일정</option>
              <option value="수행평가">수행평가</option>
              <option value="고사">고사</option>
            </select>
            <input type="date" value={fDate} onChange={e => setFDate(e.target.value)}
              className="hy-input" />
            <input placeholder="제목 *" value={fTitle} onChange={e => setFTitle(e.target.value)}
              className="hy-input" />
            <input placeholder="과목 (선택)" value={fSubject} onChange={e => setFSubject(e.target.value)}
              className="hy-input" />
            <input placeholder="등록자 이름 (선택)" value={fName} onChange={e => setFName(e.target.value)}
              className="hy-input" />
          </div>
          <button onClick={submit} disabled={loading}
            className="hy-btn hy-btn-primary"
            style={{ marginTop:14, fontSize:13 }}>
            {loading ? "등록 중..." : "등록하기"}
          </button>
        </div>
      )}

      {/* 달력 */}
      <div className="hy-card" style={{ padding:"20px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <button onClick={prevMonth} style={{
            width:34, height:34, borderRadius:10, border:"1.5px solid var(--border)",
            background:"#fff", cursor:"pointer", fontSize:16, display:"flex",
            alignItems:"center", justifyContent:"center",
          }}>‹</button>
          <span style={{ fontWeight:900, fontSize:18, color:"var(--text)", letterSpacing:"-0.3px" }}>
            {year}년 {MONTHS[month]}
          </span>
          <button onClick={nextMonth} style={{
            width:34, height:34, borderRadius:10, border:"1.5px solid var(--border)",
            background:"#fff", cursor:"pointer", fontSize:16, display:"flex",
            alignItems:"center", justifyContent:"center",
          }}>›</button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
          {DAYS.map((d, i) => (
            <div key={d} style={{
              textAlign:"center", fontSize:12, fontWeight:800, padding:"4px 0",
              color: i===0 ? "#f43f5e" : i===6 ? "#3b82f6" : "var(--text-subtle)",
            }}>{d}</div>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={idx} />;
            const iso = isoOf(day);
            const dayItems = itemsOn(day);
            const isToday = iso === today;
            const isSel   = iso === selectedDate;
            const dow = (firstDay + day - 1) % 7;
            return (
              <div key={idx} onClick={() => setSelectedDate(isSel ? null : iso)}
                style={{
                  height:90, overflow:"hidden",
                  padding:"5px 6px", borderRadius:10,
                  background: isSel ? "var(--primary-light)" : isToday ? "#fdf4ff" : "#fff",
                  border: isSel
                    ? "1.5px solid var(--primary)"
                    : isToday
                    ? "1.5px solid #e9d5ff"
                    : "1.5px solid var(--border)",
                  cursor:"pointer", transition:"all 0.12s",
                  boxShadow: isSel ? "0 2px 8px rgba(168,85,247,0.12)" : "none",
                }}>
                <div style={{
                  fontSize:13, fontWeight: isToday ? 900 : 600,
                  color: isToday ? "var(--primary)" : dow===0 ? "#f43f5e" : dow===6 ? "#3b82f6" : "var(--text)",
                  marginBottom:3,
                }}>{day}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                  {dayItems.slice(0,3).map((it, i) => (
                    <div key={i} style={{
                      fontSize:11, fontWeight:700, padding:"2px 6px",
                      borderRadius:"0 4px 4px 0",
                      background: TYPE_TAG_BG[it.type] ?? "#f3f4f6",
                      color: TYPE_STYLE[it.type]?.color ?? "#374151",
                      overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis",
                      borderLeft:`2px solid ${TYPE_STYLE[it.type]?.dot ?? "#9ca3af"}`,
                    }}>{it.title}</div>
                  ))}
                  {dayItems.length > 3 && (
                    <div style={{ fontSize:10, color:"var(--text-subtle)", fontWeight:700, paddingLeft:2 }}>
                      +{dayItems.length-3}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 선택된 날짜 상세 */}
      {selectedDate && (
        <div className="hy-card" style={{ padding:"20px 22px" }}>
          <h3 style={{ fontSize:15, fontWeight:800, color:"var(--text)", margin:"0 0 14px" }}>
            📌 {selectedDate}
          </h3>
          {selectedItems.length === 0 ? (
            <p style={{ fontSize:14, color:"var(--text-subtle)" }}>이 날에 일정이 없어요</p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {selectedItems.map(it => {
                const st = TYPE_STYLE[it.type];
                return (
                  <div key={it.id} style={{
                    display:"flex", alignItems:"center", gap:12,
                    padding:"12px 14px", borderRadius:12,
                    background: st?.bg ?? "#f9fafb",
                    border:`1px solid ${st?.border ?? "#e5e7eb"}`,
                  }}>
                    <span style={{
                      width:8, height:8, borderRadius:"50%", flexShrink:0,
                      background: st?.dot ?? "#9ca3af",
                    }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:14, color:"var(--text)" }}>{it.title}</div>
                      <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>
                        <span style={{
                          padding:"1px 8px", borderRadius:999, fontSize:11, fontWeight:700,
                          background: st?.pill ?? "#f3f4f6",
                          color: st?.color ?? "#374151",
                        }}>{it.type}</span>
                        {it.subject && <span style={{ marginLeft:6 }}>{it.subject}</span>}
                        {it.created_by && <span style={{ marginLeft:6, color:"var(--text-subtle)" }}>· {it.created_by}</span>}
                      </div>
                    </div>
                    {/* ✅ 관리자 모드일 때만 삭제 버튼 노출 */}
                    {isAdmin && (
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteTarget(it); }}
                        style={{
                          width:32, height:32, borderRadius:8, border:"1.5px solid #fecdd3",
                          background:"#fff1f2", color:"#e11d48", cursor:"pointer",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:15, flexShrink:0, transition:"all 0.15s",
                        }}
                        title="삭제">
                        🗑️
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 다가오는 일정 목록 */}
      <div className="hy-card" style={{ padding:"20px 22px" }}>
        <h3 style={{ fontSize:15, fontWeight:800, color:"var(--text)", margin:"0 0 14px" }}>
          🗓 다가오는 일정
        </h3>
        {upcomingItems.length === 0 ? (
          <p style={{ fontSize:14, color:"var(--text-subtle)" }}>등록된 일정이 없어요. 첫 일정을 등록해봐요!</p>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {upcomingItems.map(it => {
              const st = TYPE_STYLE[it.type];
              return (
                <div key={it.id} style={{
                  display:"flex", alignItems:"center", gap:12,
                  padding:"12px 14px", borderRadius:12,
                  background: it.date === today ? "#fdf4ff" : "#fafafa",
                  border:`1.5px solid ${it.date === today ? "#e9d5ff" : "var(--border)"}`,
                }}>
                  <div style={{ width:42, textAlign:"center", flexShrink:0 }}>
                    <div style={{ fontSize:10, color:"var(--text-subtle)", fontWeight:700 }}>
                      {it.date.slice(5,7)}월
                    </div>
                    <div style={{ fontSize:20, fontWeight:900, color:"var(--text)", lineHeight:1.1 }}>
                      {it.date.slice(8,10)}
                    </div>
                  </div>
                  <div style={{
                    width:3, height:36, borderRadius:2, flexShrink:0,
                    background: st?.dot ?? "#9ca3af",
                  }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:14, color:"var(--text)" }}>{it.title}</div>
                    <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>
                      <span style={{
                        padding:"1px 8px", borderRadius:999, fontSize:11, fontWeight:700,
                        background: st?.pill ?? "#f3f4f6",
                        color: st?.color ?? "#374151",
                      }}>{it.type}</span>
                      {it.subject && <span style={{ marginLeft:6 }}>{it.subject}</span>}
                    </div>
                  </div>
                  {/* ✅ 다가오는 일정에도 관리자 모드 삭제 버튼 */}
                  {isAdmin && (
                    <button
                      onClick={() => setDeleteTarget(it)}
                      style={{
                        width:32, height:32, borderRadius:8, border:"1.5px solid #fecdd3",
                        background:"#fff1f2", color:"#e11d48", cursor:"pointer",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:15, flexShrink:0, transition:"all 0.15s",
                      }}
                      title="삭제">
                      🗑️
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
