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

      {/* ✅ 수정 1: 범례 제거 — 필터 버튼에 dot 통합으로 중복 제거 */}

      {/* 필터 + 등록 버튼 */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {FILTER_OPTIONS.map(f => {
            const active = filter === f;
            const st = FILTER_ACTIVE_STYLE[f];
            return (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding:"6px 14px", borderRadius:999, border:"1.5px solid",
                  borderColor: active ? st.border : "var(--border)",
                  background: active ? st.bg : "#fff",
                  color: active ? st.color : "var(--text-muted)",
                  fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit",
                  transition:"all 0.15s",
                }}>
                {/* ✅ 수정 1: 필터 버튼에 dot 표시 (전체 제외) */}
                {f !== "전체" && (
                  <span style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: active ? st.dot : "var(--text-muted)",
                    flexShrink: 0,
                    transition: "background 0.15s",
                  }} />
                )}
                {f}
              </button>
            );
          })}
        </div>
        <button onClick={() => setFormOpen(o => !o)}
          className="hy-btn hy-btn-primary"
          style={{ fontSize:13, padding:"8px 18px" }}>
          {formOpen ? "닫기" : "+ 일정 등록"}
        </button>
      </div>

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
        {/* 달력 헤더 */}
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

        {/* 요일 헤더 */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
          {DAYS.map((d, i) => (
            <div key={d} style={{
              textAlign:"center", fontSize:12, fontWeight:800, padding:"4px 0",
              color: i===0 ? "#f43f5e" : i===6 ? "#3b82f6" : "var(--text-subtle)",
            }}>{d}</div>
          ))}
        </div>

        {/* ✅ 수정 4: gap 3 → 4 */}
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
                  // ✅ 수정 2: minHeight → 고정 height + overflow hidden으로 셀 높이 균일하게
                  height: 90,
                  overflow: "hidden",
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
                      // ✅ 수정 3: fontSize 10 → 11, padding 살짝 키움
                      fontSize:11, fontWeight:700, padding:"2px 6px", 
                      // ✅ 수정 1: borderRadius를 "0 4px 4px 0"으로 — 왼쪽 border와 충돌 방지
                      borderRadius: "0 4px 4px 0",
                      background: TYPE_TAG_BG[it.type] ?? "#f3f4f6",
                      color: TYPE_STYLE[it.type]?.color ?? "#374151",
                      overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis",
                      borderLeft: `2px solid ${TYPE_STYLE[it.type]?.dot ?? "#9ca3af"}`,
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
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
