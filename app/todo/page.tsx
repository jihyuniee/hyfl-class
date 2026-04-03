"use client";

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  📋 Supabase 스키마 변경 사항 (필요한 경우 마이그레이션)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 1) todo_likes 테이블 (새로 생성)
 *    CREATE TABLE todo_likes (
 *      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *      created_at timestamptz DEFAULT now(),
 *      todo_id uuid REFERENCES todo_items(id) ON DELETE CASCADE,
 *      from_student_no text NOT NULL,
 *      UNIQUE(todo_id, from_student_no)
 *    );
 *
 * 2) diary_images 컬럼 추가 (daily_logs 테이블)
 *    ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS diary_text text;
 *    ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS image_urls text[];
 *
 * 3) Supabase Storage 버킷
 *    - 버킷명: "diary-images"
 *    - Public 버킷으로 설정
 *    - Policy: 인증 없이 읽기 허용, 모든 사용자 업로드 허용
 *      (또는 row-level security 세팅)
 *
 * 4) student_contacts 테이블에 color 컬럼 추가 (학생별 고유 색상)
 *    ALTER TABLE student_contacts ADD COLUMN IF NOT EXISTS color text DEFAULT '#9333ea';
 *    -- 각 학생 레코드에 개별 색상 지정 권장
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/components/lib/supabaseClient";

// ── 타입 ──────────────────────────────────────────────────────────────────────

type TodoItem = {
  id: string;
  created_at: string;
  student_no: string;
  name: string;
  date: string;
  content: string;
  done: boolean;
  category: string;
};

type DailyLog = {
  id: string;
  student_no: string;
  name: string;
  date: string;
  study_hours: number | null;
  good: string | null;
  bad: string | null;
  share_reflection: boolean;
  diary_text?: string | null;
  image_urls?: string[] | null;
};

type StudentContact = {
  student_no: string;
  name: string;
  color?: string; // DB에서 가져오거나 자동 할당
};

type LikeMap = Record<string, Set<string>>; // todo_id → Set<from_student_no>

// ── 상수 ──────────────────────────────────────────────────────────────────────

const CATEGORIES = ["국어", "영어", "수학", "사회", "과학", "중국어", "기타"];

const CAT_STYLE: Record<string, { bg: string; color: string; dot: string; border: string }> = {
  국어:   { bg: "#fdf4ff", color: "#9333ea", dot: "#9333ea", border: "#e9d5ff" },
  영어:   { bg: "#eff6ff", color: "#2563eb", dot: "#2563eb", border: "#bfdbfe" },
  수학:   { bg: "#fff1f2", color: "#e11d48", dot: "#e11d48", border: "#fecdd3" },
  사회:   { bg: "#fefce8", color: "#ca8a04", dot: "#eab308", border: "#fef08a" },
  과학:   { bg: "#f0fdf4", color: "#16a34a", dot: "#16a34a", border: "#bbf7d0" },
  중국어: { bg: "#fff7ed", color: "#ea580c", dot: "#f97316", border: "#fed7aa" },
  기타:   { bg: "#f8fafc", color: "#64748b", dot: "#94a3b8", border: "#e2e8f0" },
};

// 학생 기본 색상 팔레트 (color 컬럼 없을 때 자동 할당)
const STUDENT_PALETTE = [
  "#9333ea", "#2563eb", "#e11d48", "#16a34a", "#ea580c",
  "#0891b2", "#d97706", "#7c3aed", "#059669", "#db2777",
  "#1d4ed8", "#dc2626", "#0d9488", "#b45309", "#4f46e5",
];

const MONTHS_KO = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const DAYS_KO   = ["일","월","화","수","목","금","토"];
const DAYS_FULL = ["일요일","월요일","화요일","수요일","목요일","금요일","토요일"];

// ── 유틸 ──────────────────────────────────────────────────────────────────────

function toKST(d: Date) {
  return new Date(d.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
}
function isoDate(d: Date) {
  const k = toKST(d);
  return `${k.getFullYear()}-${String(k.getMonth()+1).padStart(2,"0")}-${String(k.getDate()).padStart(2,"0")}`;
}
function toKSTDate() { return isoDate(new Date()); }
function fmtFull(iso: string) {
  const d = new Date(`${iso}T00:00:00+09:00`);
  return `${d.getMonth()+1}월 ${d.getDate()}일 (${DAYS_FULL[d.getDay()]})`;
}

// 학생 번호 → 고유 색상 (color 컬럼이 없을 때)
function getStudentColor(studentNo: string, students: StudentContact[]): string {
  const s = students.find(s => s.student_no === studentNo);
  if (s?.color) return s.color;
  // 학번 기반으로 팔레트에서 일관된 색상 선택
  let hash = 0;
  for (let i = 0; i < studentNo.length; i++) hash = (hash * 31 + studentNo.charCodeAt(i)) >>> 0;
  return STUDENT_PALETTE[hash % STUDENT_PALETTE.length];
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── 미니 달력 ─────────────────────────────────────────────────────────────────
// dotsMap: date → Array<{ color, studentNo }>
function MiniCalendar({
  selectedDate, onSelect, dotsMap,
}: {
  selectedDate: string;
  onSelect: (iso: string) => void;
  dotsMap: Record<string, Array<{ color: string; studentNo: string }>>;
}) {
  const today = toKSTDate();
  const initD  = new Date(`${selectedDate}T00:00:00+09:00`);
  const [year,  setYear]  = useState(initD.getFullYear());
  const [month, setMonth] = useState(initD.getMonth());

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function isoOf(day: number) {
    return `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  }

  return (
    <div>
      {/* 달력 헤더 */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <button onClick={() => { if (month===0){setYear(y=>y-1);setMonth(11);}else setMonth(m=>m-1); }}
          style={{ width:28, height:28, borderRadius:7, border:"1.5px solid var(--border)",
            background:"#fff", cursor:"pointer", fontSize:14, display:"flex",
            alignItems:"center", justifyContent:"center", color:"var(--text-muted)" }}>‹</button>
        <span style={{ fontSize:14, fontWeight:800, color:"var(--text)" }}>
          {year}년 {MONTHS_KO[month]}
        </span>
        <button onClick={() => { if (month===11){setYear(y=>y+1);setMonth(0);}else setMonth(m=>m+1); }}
          style={{ width:28, height:28, borderRadius:7, border:"1.5px solid var(--border)",
            background:"#fff", cursor:"pointer", fontSize:14, display:"flex",
            alignItems:"center", justifyContent:"center", color:"var(--text-muted)" }}>›</button>
      </div>

      {/* 요일 헤더 */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1, marginBottom:3 }}>
        {DAYS_KO.map((d, i) => (
          <div key={d} style={{
            textAlign:"center", fontSize:10, fontWeight:700, padding:"3px 0",
            color: i===0 ? "#e11d48" : i===6 ? "#2563eb" : "var(--text-subtle)",
          }}>{d}</div>
        ))}
      </div>

      {/* 날짜 셀 */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1 }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const iso     = isoOf(day);
          const isToday = iso === today;
          const isSel   = iso === selectedDate;
          const dots    = dotsMap[iso] ?? [];
          const dow     = (firstDay + day - 1) % 7;
          return (
            <div key={idx} onClick={() => onSelect(iso)}
              style={{
                aspectRatio:"1", display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center", gap:1,
                borderRadius:7, cursor:"pointer",
                background: isSel ? "var(--primary)" : isToday ? "var(--primary-light)" : "transparent",
                transition:"background 0.1s", position:"relative",
              }}>
              <span style={{
                fontSize:12, fontWeight: isSel || isToday ? 800 : 500,
                color: isSel ? "#fff"
                  : isToday ? "var(--primary)"
                  : dow===0 ? "#e11d48" : dow===6 ? "#2563eb" : "var(--text)",
                lineHeight:1,
              }}>{day}</span>
              {/* 학생별 색점 - 최대 5개 표시 */}
              {dots.length > 0 && (
                <div style={{ display:"flex", gap:1.5, flexWrap:"nowrap", maxWidth:"100%", overflow:"hidden" }}>
                  {dots.slice(0, 5).map((dot, di) => (
                    <span key={di} style={{
                      width:4, height:4, borderRadius:"50%", flexShrink:0,
                      background: isSel ? "rgba(255,255,255,0.8)" : dot.color,
                      display:"block",
                    }} />
                  ))}
                  {dots.length > 5 && (
                    <span style={{ fontSize:8, color: isSel ? "rgba(255,255,255,0.7)" : "var(--text-subtle)", lineHeight:"4px" }}>
                      +
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 학생 아바타 칩 ────────────────────────────────────────────────────────────
function StudentChip({
  student, color, selected, isMe, onClick,
}: {
  student: StudentContact;
  color: string;
  selected: boolean;
  isMe: boolean;
  onClick: () => void;
}) {
  const initials = student.name.slice(-2); // 이름 뒤 2글자
  return (
    <button onClick={onClick} style={{
      display:"flex", flexDirection:"column", alignItems:"center", gap:5,
      background:"none", border:"none", cursor:"pointer", padding:"6px 4px",
      borderRadius:12, transition:"transform 0.15s",
      transform: selected ? "translateY(-2px)" : "none",
      opacity: selected ? 1 : 0.55,
    }}>
      <div style={{
        width:40, height:40, borderRadius:"50%",
        background: selected ? color : hexToRgba(color, 0.25),
        border:`2.5px solid ${selected ? color : "transparent"}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:13, fontWeight:900, color: selected ? "#fff" : color,
        boxShadow: selected ? `0 4px 12px ${hexToRgba(color, 0.4)}` : "none",
        transition:"all 0.2s",
        position:"relative",
      }}>
        {initials}
        {isMe && (
          <span style={{
            position:"absolute", bottom:-2, right:-2,
            width:14, height:14, borderRadius:"50%",
            background:"#fff", border:`2px solid ${color}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:8, lineHeight:1,
          }}>★</span>
        )}
      </div>
      <span style={{
        fontSize:10, fontWeight: selected ? 800 : 600,
        color: selected ? color : "var(--text-muted)",
        maxWidth:44, textAlign:"center", lineHeight:1.2,
        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
      }}>{student.name}{isMe ? "" : ""}</span>
    </button>
  );
}

// ── 할일 카드 (좋아요 포함) ────────────────────────────────────────────────────
function TodoCard({
  todo, isOwner, accentColor, likeCount, liked, onToggle, onDelete, onLike,
}: {
  todo: TodoItem;
  isOwner: boolean;
  accentColor: string;
  likeCount: number;
  liked: boolean;
  onToggle?: () => void;
  onDelete?: () => void;
  onLike: () => void;
}) {
  const st = CAT_STYLE[todo.category] ?? CAT_STYLE["기타"];
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10,
      padding:"10px 12px", borderRadius:10,
      border:`1px solid ${todo.done ? "#dcfce7" : st.border}`,
      background: todo.done ? "#f0fdf4" : st.bg,
      borderLeft:`3px solid ${todo.done ? "#22c55e" : accentColor}`,
      transition:"all 0.15s",
    }}>
      {/* 체크박스 - 내 할일만 */}
      {isOwner ? (
        <button onClick={onToggle}
          style={{
            width:20, height:20, borderRadius:5, border:"2px solid", flexShrink:0,
            borderColor: todo.done ? "#22c55e" : accentColor,
            background: todo.done ? "#22c55e" : "#fff",
            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:11, color:"#fff", fontWeight:900, transition:"all 0.15s",
          }}>
          {todo.done ? "✓" : ""}
        </button>
      ) : (
        <div style={{
          width:20, height:20, borderRadius:5, flexShrink:0,
          background: todo.done ? "#22c55e" : hexToRgba(accentColor, 0.15),
          border:`2px solid ${todo.done ? "#22c55e" : hexToRgba(accentColor, 0.4)}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:11, color: todo.done ? "#fff" : accentColor, fontWeight:900,
        }}>
          {todo.done ? "✓" : ""}
        </div>
      )}

      {/* 내용 */}
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{
          fontSize:13, fontWeight:700, margin:"0 0 2px",
          color: todo.done ? "var(--text-subtle)" : "var(--text)",
          textDecoration: todo.done ? "line-through" : "none",
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
        }}>{todo.content}</p>
        <span style={{
          fontSize:10, fontWeight:700, padding:"1px 6px", borderRadius:999,
          background: todo.done ? "#dcfce7" : st.bg,
          color: todo.done ? "#16a34a" : st.color,
          border:`1px solid ${todo.done ? "#bbf7d0" : st.border}`,
        }}>{todo.category}</span>
      </div>

      {/* 좋아요 버튼 */}
      <button onClick={onLike} style={{
        display:"flex", alignItems:"center", gap:4, flexShrink:0,
        background: liked ? hexToRgba("#e11d48", 0.1) : "transparent",
        border:`1px solid ${liked ? "#fecdd3" : "var(--border)"}`,
        borderRadius:20, padding:"3px 8px", cursor:"pointer",
        transition:"all 0.15s", fontSize:11, fontWeight:700,
        color: liked ? "#e11d48" : "var(--text-subtle)",
      }}>
        <span style={{ fontSize:13 }}>{liked ? "❤️" : "🤍"}</span>
        {likeCount > 0 && <span>{likeCount}</span>}
      </button>

      {/* 삭제 - 내 할일만 */}
      {isOwner && (
        <button onClick={onDelete}
          style={{
            background:"none", border:"none", cursor:"pointer", fontSize:16,
            color:"var(--text-subtle)", padding:"2px", lineHeight:1,
            opacity:0.4, transition:"opacity 0.15s", flexShrink:0,
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity="1")}
          onMouseLeave={e => (e.currentTarget.style.opacity="0.4")}>
          ×
        </button>
      )}
    </div>
  );
}

// ── 일기/회고 섹션 ─────────────────────────────────────────────────────────────
function DiarySection({
  me, today, log, onSaved,
}: {
  me: { student_no: string; name: string };
  today: string;
  log: DailyLog | null;
  onSaved: () => void;
}) {
  const [studyHours,      setStudyHours]      = useState(String(log?.study_hours ?? ""));
  const [good,            setGood]            = useState(log?.good ?? "");
  const [bad,             setBad]             = useState(log?.bad ?? "");
  const [diaryText,       setDiaryText]       = useState(log?.diary_text ?? "");
  const [shareReflection, setShareReflection] = useState(log?.share_reflection ?? false);
  const [savingLog,       setSavingLog]       = useState(false);
  const [logSaved,        setLogSaved]        = useState(false);
  const [imageUrls,       setImageUrls]       = useState<string[]>(log?.image_urls ?? []);
  const [uploading,       setUploading]       = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // log 변경 시 상태 동기화
  useEffect(() => {
    setStudyHours(String(log?.study_hours ?? ""));
    setGood(log?.good ?? "");
    setBad(log?.bad ?? "");
    setDiaryText(log?.diary_text ?? "");
    setShareReflection(log?.share_reflection ?? false);
    setImageUrls(log?.image_urls ?? []);
  }, [log?.id]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of files) {
      const ext  = file.name.split(".").pop();
      const path = `${me.student_no}/${today}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("diary-images").upload(path, file, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from("diary-images").getPublicUrl(path);
        newUrls.push(data.publicUrl);
      }
    }
    setImageUrls(prev => [...prev, ...newUrls]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function removeImage(url: string) {
    setImageUrls(prev => prev.filter(u => u !== url));
  }

  async function saveLog() {
    setSavingLog(true);
    const payload = {
      student_no: me.student_no, name: me.name, date: today,
      study_hours: studyHours ? Number(studyHours) : null,
      good: good.trim() || null,
      bad: bad.trim() || null,
      diary_text: diaryText.trim() || null,
      share_reflection: shareReflection,
      image_urls: imageUrls.length ? imageUrls : null,
    };
    if (log) {
      await supabase.from("daily_logs").update(payload).eq("id", log.id);
    } else {
      await supabase.from("daily_logs").insert(payload);
    }
    setSavingLog(false); setLogSaved(true);
    setTimeout(() => setLogSaved(false), 2000);
    onSaved();
  }

  return (
    <div className="hy-card" style={{ padding:"16px 16px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <p style={{ fontSize:13, fontWeight:900, color:"var(--text)", margin:0 }}>📔 오늘 회고 & 일기</p>
        <span style={{ fontSize:10, color:"var(--text-subtle)", fontWeight:600 }}>쓰고 싶을 때만 🙂</span>
      </div>

      {/* 공부 시간 */}
      <div style={{ marginBottom:12 }}>
        <label style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:4 }}>
          ⏱ 오늘 공부 시간 (시간)
        </label>
        <input type="number" placeholder="예: 3.5" value={studyHours}
          onChange={e => setStudyHours(e.target.value)}
          className="hy-input" min="0" max="24" step="0.5" inputMode="decimal"
          style={{ maxWidth:140, fontSize:13 }} />
      </div>

      {/* 잘한 점 + 아쉬운 점 */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
        <div>
          <label style={{ fontSize:11, fontWeight:700, color:"#16a34a", display:"block", marginBottom:4 }}>
            ✅ 잘한 점
          </label>
          <textarea placeholder="오늘 뿌듯했던 것..."
            value={good} onChange={e => setGood(e.target.value)}
            className="hy-input"
            style={{
              minHeight:80, resize:"vertical", fontSize:12, lineHeight:1.6,
              borderColor: good ? "#86efac" : undefined,
              background: good ? "#f0fdf4" : undefined,
            }} />
        </div>
        <div>
          <label style={{ fontSize:11, fontWeight:700, color:"#ca8a04", display:"block", marginBottom:4 }}>
            💭 아쉬운 점 & 내일 다짐
          </label>
          <textarea placeholder="내일은 이렇게..."
            value={bad} onChange={e => setBad(e.target.value)}
            className="hy-input"
            style={{
              minHeight:80, resize:"vertical", fontSize:12, lineHeight:1.6,
              borderColor: bad ? "#fde68a" : undefined,
              background: bad ? "#fffbeb" : undefined,
            }} />
        </div>
      </div>

      {/* ✏️ 일기 본문 */}
      <div style={{ marginBottom:12 }}>
        <label style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:4 }}>
          ✏️ 오늘 일기 (자유롭게)
        </label>
        <textarea
          placeholder="오늘 하루 어땠나요? 자유롭게 기록해봐요..."
          value={diaryText} onChange={e => setDiaryText(e.target.value)}
          className="hy-input"
          style={{
            minHeight:100, resize:"vertical", fontSize:13, lineHeight:1.7,
            borderColor: diaryText ? "#c4b5fd" : undefined,
            background: diaryText ? "#fdf4ff" : undefined,
          }} />
      </div>

      {/* 📷 이미지 첨부 */}
      <div style={{ marginBottom:12 }}>
        <label style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:6 }}>
          📷 사진 첨부
        </label>
        {/* 이미지 미리보기 그리드 */}
        {imageUrls.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:8 }}>
            {imageUrls.map((url, i) => (
              <div key={i} style={{ position:"relative", width:80, height:80 }}>
                <img src={url} alt="" style={{
                  width:80, height:80, objectFit:"cover", borderRadius:8,
                  border:"1.5px solid var(--border)",
                }} />
                <button onClick={() => removeImage(url)} style={{
                  position:"absolute", top:-6, right:-6, width:18, height:18,
                  borderRadius:"50%", background:"#ef4444", border:"none",
                  color:"#fff", fontSize:10, cursor:"pointer", fontWeight:900,
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>×</button>
              </div>
            ))}
            {/* 추가 버튼 */}
            <button onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                width:80, height:80, borderRadius:8, border:"2px dashed var(--border)",
                background:"#f8fafc", cursor:"pointer", display:"flex",
                flexDirection:"column", alignItems:"center", justifyContent:"center",
                gap:4, color:"var(--text-muted)", fontSize:11, fontWeight:700,
              }}>
              <span style={{ fontSize:20 }}>+</span>
              <span>추가</span>
            </button>
          </div>
        )}
        {imageUrls.length === 0 && (
          <button onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              width:"100%", height:64, borderRadius:10, border:"2px dashed var(--border)",
              background:"#f8fafc", cursor:"pointer", display:"flex",
              alignItems:"center", justifyContent:"center", gap:10,
              color:"var(--text-muted)", fontSize:12, fontWeight:700,
              transition:"all 0.15s",
            }}>
            {uploading ? "📤 업로드 중..." : "📷 사진 추가하기"}
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" multiple
          onChange={handleImageUpload} style={{ display:"none" }} />
      </div>

      {/* 공유 + 저장 */}
      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
        <label style={{
          display:"flex", alignItems:"center", gap:7, cursor:"pointer",
          padding:"7px 12px", borderRadius:8, flex:1, minWidth:160,
          background: shareReflection ? "#fdf4ff" : "#f8fafc",
          border:`1px solid ${shareReflection ? "#e9d5ff" : "var(--border)"}`,
        }}>
          <input type="checkbox" checked={shareReflection}
            onChange={e => setShareReflection(e.target.checked)}
            style={{ width:14, height:14, accentColor:"#9333ea", cursor:"pointer" }} />
          <span style={{ fontSize:11, fontWeight:700,
            color: shareReflection ? "var(--primary)" : "var(--text-muted)" }}>
            🔥 반 피드에 공유
          </span>
        </label>
        <button onClick={saveLog} disabled={savingLog}
          className="hy-btn hy-btn-primary"
          style={{ fontSize:12, padding:"8px 18px", flexShrink:0 }}>
          {savingLog ? "저장 중..." : logSaved ? "✅ 저장됨!" : "💾 회고 저장"}
        </button>
      </div>
    </div>
  );
}

// ── 과거 날짜 일기 보기 ────────────────────────────────────────────────────────
function PastDiaryView({ log, date }: { log: DailyLog; date: string }) {
  const hasContent = log.good || log.bad || log.study_hours || log.diary_text || (log.image_urls?.length ?? 0) > 0;
  if (!hasContent) return null;
  return (
    <div className="hy-card" style={{ padding:"14px 16px" }}>
      <p style={{ fontSize:12, fontWeight:800, color:"var(--text-muted)", margin:"0 0 10px" }}>
        📔 {fmtFull(date)} 회고
      </p>
      {log.study_hours != null && (
        <span style={{
          display:"inline-flex", alignItems:"center", padding:"3px 10px", borderRadius:999,
          background:"#fefce8", border:"1px solid #fef08a", marginBottom:8,
          fontSize:12, color:"#ca8a04", fontWeight:700,
        }}>⏱ {log.study_hours}시간</span>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom: log.diary_text ? 8 : 0 }}>
        {log.good && (
          <div style={{ padding:"10px 12px", borderRadius:10, background:"#f0fdf4", border:"1px solid #bbf7d0" }}>
            <p style={{ fontSize:10, fontWeight:800, color:"#15803d", margin:"0 0 4px" }}>✅ 잘한 점</p>
            <p style={{ fontSize:12, color:"#166534", margin:0, lineHeight:1.6 }}>{log.good}</p>
          </div>
        )}
        {log.bad && (
          <div style={{ padding:"10px 12px", borderRadius:10, background:"#fffbeb", border:"1px solid #fef08a" }}>
            <p style={{ fontSize:10, fontWeight:800, color:"#92400e", margin:"0 0 4px" }}>💭 아쉬운 점</p>
            <p style={{ fontSize:12, color:"#92400e", margin:0, lineHeight:1.6 }}>{log.bad}</p>
          </div>
        )}
      </div>
      {log.diary_text && (
        <div style={{ padding:"10px 12px", borderRadius:10, background:"#fdf4ff", border:"1px solid #e9d5ff", marginBottom:8 }}>
          <p style={{ fontSize:10, fontWeight:800, color:"#7c3aed", margin:"0 0 4px" }}>✏️ 일기</p>
          <p style={{ fontSize:12, color:"#4c1d95", margin:0, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{log.diary_text}</p>
        </div>
      )}
      {(log.image_urls?.length ?? 0) > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:4 }}>
          {log.image_urls!.map((url, i) => (
            <img key={i} src={url} alt="" style={{
              width:80, height:80, objectFit:"cover", borderRadius:8,
              border:"1.5px solid var(--border)", cursor:"pointer",
            }} onClick={() => window.open(url, "_blank")} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── 메인 ──────────────────────────────────────────────────────────────────────
export default function TodoPage() {
  const today  = toKSTDate();
  const nowKST = toKST(new Date());

  // 인증
  const [step,       setStep]       = useState<"login"|"main">("login");
  const [inputNo,    setInputNo]    = useState("");
  const [inputName,  setInputName]  = useState("");
  const [inputLast4, setInputLast4] = useState("");
  const [loginError, setLoginError] = useState("");
  const [me,         setMe]         = useState<{ student_no: string; name: string } | null>(null);

  // 데이터
  const [allStudents,  setAllStudents]  = useState<StudentContact[]>([]);
  const [allTodos,     setAllTodos]     = useState<TodoItem[]>([]);
  const [myLogData,    setMyLogData]    = useState<DailyLog[]>([]);
  const [feed,         setFeed]         = useState<DailyLog[]>([]);
  const [todayLog,     setTodayLog]     = useState<DailyLog | null>(null);
  const [likeMap,      setLikeMap]      = useState<LikeMap>({});

  // 선택 상태
  const [viewDate,          setViewDate]          = useState(today);
  // 현재 보고 있는 학생들 (본인 포함, 멀티 선택)
  const [selectedStudents,  setSelectedStudents]  = useState<Set<string>>(new Set());

  // 할일 추가 (내 날짜)
  const [newTodo, setNewTodo] = useState("");
  const [newCat,  setNewCat]  = useState(CATEGORIES[0]);
  const [adding,  setAdding]  = useState(false);

  // ── 데이터 로드 ────────────────────────────────────────────────────────────
  async function loadAll(sNo: string) {
    const [
      { data: students },
      { data: todos },
      { data: logs },
      { data: feedLogs },
      { data: myLog },
      { data: likes },
    ] = await Promise.all([
      supabase.from("student_contacts").select("student_no,name,color").order("student_no"),
      supabase.from("todo_items").select("*").order("date").order("done").order("created_at"),
      supabase.from("daily_logs").select("*").eq("student_no", sNo).order("date"),
      supabase.from("daily_logs").select("*").eq("date", today)
        .order("created_at", { ascending: false }),
      supabase.from("daily_logs").select("*").eq("student_no", sNo)
        .eq("date", today).maybeSingle(),
      supabase.from("todo_likes").select("todo_id,from_student_no"),
    ]);

    setAllStudents((students as StudentContact[]) ?? []);
    setAllTodos((todos as TodoItem[]) ?? []);
    setMyLogData((logs as DailyLog[]) ?? []);
    setFeed((feedLogs as DailyLog[]) ?? []);
    setTodayLog(myLog as DailyLog | null);

    // 좋아요 맵 구성
    const lm: LikeMap = {};
    for (const like of (likes as any[]) ?? []) {
      if (!lm[like.todo_id]) lm[like.todo_id] = new Set();
      lm[like.todo_id].add(like.from_student_no);
    }
    setLikeMap(lm);
  }

  // ── 로그인 ─────────────────────────────────────────────────────────────────
  async function handleLogin() {
    setLoginError("");
    if (!inputNo.trim() || !inputName.trim() || !inputLast4.trim()) {
      setLoginError("모든 항목을 입력해주세요"); return;
    }
    const { data, error } = await supabase.from("student_contacts").select("*")
      .eq("student_no", inputNo.trim()).eq("name", inputName.trim()).maybeSingle();
    if (error || !data) { setLoginError("학번 또는 이름이 일치하지 않아요"); return; }
    if ((data.student_phone as string).replace(/\D/g,"").slice(-4) !== inputLast4.trim()) {
      setLoginError("전화번호 뒤 4자리가 일치하지 않아요"); return;
    }
    const user = { student_no: inputNo.trim(), name: inputName.trim() };
    setMe(user); setStep("main");
    setSelectedStudents(new Set([inputNo.trim()]));
    await loadAll(user.student_no);
  }

  // ── 학생 토글 ───────────────────────────────────────────────────────────────
  function toggleStudent(sNo: string) {
    setSelectedStudents(prev => {
      const next = new Set(prev);
      if (next.has(sNo)) {
        // 자기 자신은 항상 선택 유지
        if (sNo === me?.student_no && next.size === 1) return prev;
        next.delete(sNo);
      } else {
        next.add(sNo);
      }
      return next;
    });
  }

  // ── 할일 CRUD ──────────────────────────────────────────────────────────────
  async function addTodo() {
    if (!newTodo.trim() || !me) return;
    setAdding(true);
    await supabase.from("todo_items").insert({
      student_no: me.student_no, name: me.name,
      date: viewDate, content: newTodo.trim(), done: false, category: newCat,
    });
    setAdding(false); setNewTodo("");
    await loadAll(me.student_no);
  }

  async function toggleDone(id: string, done: boolean) {
    await supabase.from("todo_items").update({ done: !done }).eq("id", id);
    setAllTodos(prev => prev.map(t => t.id === id ? { ...t, done: !done } : t));
  }

  async function deleteTodo(id: string) {
    await supabase.from("todo_items").delete().eq("id", id);
    setAllTodos(prev => prev.filter(t => t.id !== id));
  }

  // ── 좋아요 토글 ────────────────────────────────────────────────────────────
  async function toggleLike(todoId: string) {
    if (!me) return;
    const current = likeMap[todoId] ?? new Set();
    const liked   = current.has(me.student_no);
    if (liked) {
      await supabase.from("todo_likes").delete()
        .eq("todo_id", todoId).eq("from_student_no", me.student_no);
      setLikeMap(prev => {
        const next = { ...prev };
        next[todoId] = new Set([...current].filter(s => s !== me.student_no));
        return next;
      });
    } else {
      await supabase.from("todo_likes").insert({
        todo_id: todoId, from_student_no: me.student_no,
      });
      setLikeMap(prev => ({
        ...prev,
        [todoId]: new Set([...current, me.student_no]),
      }));
    }
  }

  // ── 파생 값 ────────────────────────────────────────────────────────────────

  // 달력 색점 맵: date → [{color, studentNo}]
  const dotsMap = useMemo(() => {
    const map: Record<string, Array<{ color: string; studentNo: string }>> = {};
    // todos 기준
    for (const t of allTodos) {
      if (!map[t.date]) map[t.date] = [];
      const color = getStudentColor(t.student_no, allStudents);
      if (!map[t.date].find(d => d.studentNo === t.student_no)) {
        map[t.date].push({ color, studentNo: t.student_no });
      }
    }
    return map;
  }, [allTodos, allStudents]);

  // 선택한 학생들의 오늘(viewDate) 할일
  const selectedTodos = useMemo(() =>
    allTodos.filter(t => t.date === viewDate && selectedStudents.has(t.student_no)),
    [allTodos, viewDate, selectedStudents]
  );

  // 나의 할일만
  const myViewTodos = useMemo(() =>
    allTodos.filter(t => t.date === viewDate && t.student_no === me?.student_no),
    [allTodos, viewDate, me]
  );

  const doneCnt  = myViewTodos.filter(t => t.done).length;
  const doneRate = myViewTodos.length ? Math.round((doneCnt / myViewTodos.length) * 100) : 0;

  const thisMonthPrefix = `${nowKST.getFullYear()}-${String(nowKST.getMonth()+1).padStart(2,"0")}`;
  const monthTodos = useMemo(
    () => allTodos.filter(t => t.date.startsWith(thisMonthPrefix) && t.student_no === me?.student_no),
    [allTodos, thisMonthPrefix, me]
  );
  const catStats = useMemo(() =>
    CATEGORIES.map(cat => ({
      cat,
      total: monthTodos.filter(t => t.category === cat).length,
      done:  monthTodos.filter(t => t.category === cat && t.done).length,
    })).filter(s => s.total > 0),
    [monthTodos]
  );

  const viewLog = useMemo(
    () => myLogData.find(l => l.date === viewDate) ?? null,
    [myLogData, viewDate]
  );

  // 선택한 학생들을 학번 기준으로 그룹화
  const selectedStudentList = useMemo(
    () => allStudents.filter(s => selectedStudents.has(s.student_no)),
    [allStudents, selectedStudents]
  );

  // ── 로그인 화면 ────────────────────────────────────────────────────────────
  if (step === "login") return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <div className="hy-hero">
        <h1 style={{ color:"#fff", fontSize:"clamp(20px,4vw,30px)", fontWeight:900, margin:"0 0 8px" }}>
          ✅ 나의 할일
        </h1>
        <p style={{ color:"rgba(255,255,255,0.85)", fontSize:13, margin:0, lineHeight:1.7 }}>
          매일 할 일을 적고, 체크하고, 하루를 돌아봐요 🙂
        </p>
      </div>
      <div className="hy-card" style={{ padding:"28px 24px", maxWidth:400, margin:"0 auto", width:"100%" }}>
        <h2 style={{ fontSize:15, fontWeight:900, color:"var(--text)", margin:"0 0 6px" }}>🔐 본인 확인</h2>
        <p style={{ fontSize:12, color:"var(--text-muted)", margin:"0 0 18px", lineHeight:1.6 }}>
          내 할일만 볼 수 있도록 인증이 필요해요
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <input placeholder="학번 (예: 20201)" value={inputNo}
            onChange={e => setInputNo(e.target.value)} onKeyDown={e => e.key==="Enter"&&handleLogin()}
            className="hy-input" inputMode="numeric" />
          <input placeholder="이름" value={inputName}
            onChange={e => setInputName(e.target.value)} onKeyDown={e => e.key==="Enter"&&handleLogin()}
            className="hy-input" />
          <input placeholder="전화번호 뒤 4자리" value={inputLast4}
            onChange={e => setInputLast4(e.target.value.replace(/\D/g,"").slice(0,4))}
            onKeyDown={e => e.key==="Enter"&&handleLogin()}
            className="hy-input" inputMode="numeric" maxLength={4} />
          {loginError && (
            <p style={{ fontSize:12, color:"#ef4444", fontWeight:700, margin:0 }}>⚠️ {loginError}</p>
          )}
          <button onClick={handleLogin} className="hy-btn hy-btn-primary" style={{ fontSize:14, marginTop:4 }}>
            시작하기
          </button>
        </div>
      </div>
    </div>
  );

  // ── 메인 화면 ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* 헤더 */}
      <div className="hy-hero">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <p style={{ color:"rgba(255,255,255,0.75)", fontSize:11, fontWeight:700, margin:"0 0 4px" }}>
              {me?.student_no} · {me?.name}의 공간
            </p>
            <h1 style={{ color:"#fff", fontSize:"clamp(18px,4vw,26px)", fontWeight:900, margin:"0 0 2px" }}>
              ✅ 나의 할일
            </h1>
            <p style={{ color:"rgba(255,255,255,0.75)", fontSize:12, margin:0 }}>{fmtFull(today)}</p>
          </div>
          <button onClick={() => { setStep("login"); setMe(null); }}
            style={{ padding:"6px 12px", borderRadius:999, border:"1px solid rgba(255,255,255,0.35)",
              background:"rgba(255,255,255,0.12)", color:"#fff", fontSize:11, fontWeight:700,
              cursor:"pointer", fontFamily:"inherit" }}>
            로그아웃
          </button>
        </div>
      </div>

      {/* ── 학생 선택 바 ── */}
      <div className="hy-card" style={{ padding:"10px 16px" }}>
        <p style={{ fontSize:11, fontWeight:800, color:"var(--text-muted)", margin:"0 0 8px" }}>
          👥 같이 보기 — 클릭해서 친구 할일 함께 보기
        </p>
        <div style={{
          display:"flex", gap:4, overflowX:"auto", paddingBottom:4,
          scrollbarWidth:"thin",
        }}>
          {allStudents.map(s => {
            const color = getStudentColor(s.student_no, allStudents);
            return (
              <StudentChip
                key={s.student_no}
                student={s}
                color={color}
                selected={selectedStudents.has(s.student_no)}
                isMe={s.student_no === me?.student_no}
                onClick={() => toggleStudent(s.student_no)}
              />
            );
          })}
        </div>
        {selectedStudents.size > 1 && (
          <p style={{ fontSize:10, color:"var(--primary)", fontWeight:700, margin:"6px 0 0" }}>
            {[...selectedStudents].map(sNo => allStudents.find(s=>s.student_no===sNo)?.name).filter(Boolean).join(", ")}의 할일을 함께 보는 중
          </p>
        )}
      </div>

      {/* ── 2단 그리드 ── */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"clamp(220px,26%,272px) 1fr",
        gap:14, alignItems:"start",
      }}>

        {/* 왼쪽: 달력 + 이달 통계 */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

          <div className="hy-card" style={{ padding:"16px 14px" }}>
            <MiniCalendar
              selectedDate={viewDate}
              onSelect={setViewDate}
              dotsMap={dotsMap}
            />

            {/* 달력 범례 - 현재 선택된 학생들 */}
            {allStudents.length > 0 && (
              <div style={{ marginTop:12, paddingTop:10, borderTop:"1px solid var(--border)" }}>
                <p style={{ fontSize:10, fontWeight:700, color:"var(--text-subtle)", margin:"0 0 6px" }}>색점 범례</p>
                <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                  {allStudents.slice(0, 8).map(s => (
                    <div key={s.student_no} style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <span style={{
                        width:8, height:8, borderRadius:"50%", flexShrink:0,
                        background: getStudentColor(s.student_no, allStudents),
                        display:"block",
                      }} />
                      <span style={{ fontSize:10, color:"var(--text-muted)", fontWeight:600 }}>
                        {s.name}{s.student_no === me?.student_no ? " (나)" : ""}
                      </span>
                    </div>
                  ))}
                  {allStudents.length > 8 && (
                    <span style={{ fontSize:10, color:"var(--text-subtle)" }}>외 {allStudents.length - 8}명</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {catStats.length > 0 && (
            <div className="hy-card" style={{ padding:"14px 14px" }}>
              <p style={{ fontSize:11, fontWeight:800, color:"var(--text-muted)", margin:"0 0 10px" }}>
                이달의 과목별 현황
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                {catStats.map(({ cat, total, done }) => {
                  const rate = total ? Math.round((done/total)*100) : 0;
                  const st   = CAT_STYLE[cat] ?? CAT_STYLE["기타"];
                  return (
                    <div key={cat}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                        <span style={{
                          fontSize:11, fontWeight:700, padding:"1px 7px", borderRadius:999,
                          background:st.bg, color:st.color,
                        }}>{cat}</span>
                        <span style={{ fontSize:10, color:"var(--text-subtle)", fontWeight:700 }}>
                          {done}/{total}
                        </span>
                      </div>
                      <div style={{ height:4, borderRadius:999, background:"#f1f5f9", overflow:"hidden" }}>
                        <div style={{
                          height:"100%", borderRadius:999, background:st.dot,
                          width:`${rate}%`, transition:"width 0.4s",
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽 */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

          {/* 날짜 헤더 + 진행률 */}
          <div className="hy-card" style={{ padding:"14px 16px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
              marginBottom: myViewTodos.length > 0 ? 10 : 0 }}>
              <div>
                <p style={{ fontSize:16, fontWeight:900, color:"var(--text)", margin:"0 0 1px" }}>
                  {fmtFull(viewDate)}
                </p>
                <p style={{ fontSize:11, color:"var(--text-muted)", margin:0, fontWeight:600 }}>
                  {viewDate === today ? "오늘" : viewDate < today ? "지난 날" : "예정된 날"}
                </p>
              </div>
              {myViewTodos.length > 0 && (
                <span style={{
                  fontSize:13, fontWeight:900, padding:"5px 12px", borderRadius:999,
                  color: doneRate===100 ? "#16a34a" : "var(--primary)",
                  background: doneRate===100 ? "#f0fdf4" : "var(--primary-light)",
                }}>
                  {doneRate===100 ? "🎉 완료!" : `${doneCnt}/${myViewTodos.length}`}
                </span>
              )}
            </div>
            {myViewTodos.length > 0 && (
              <div style={{ height:5, borderRadius:999, background:"#f3e8ff", overflow:"hidden" }}>
                <div style={{
                  height:"100%", borderRadius:999,
                  background: doneRate===100
                    ? "linear-gradient(90deg,#22c55e,#16a34a)"
                    : "linear-gradient(90deg,var(--primary),var(--accent))",
                  width:`${doneRate}%`, transition:"width 0.4s",
                }} />
              </div>
            )}
          </div>

          {/* ── 학생별 할일 패널 ── */}
          {selectedStudents.size === 1 ? (
            /* 혼자 볼 때 - 기존 단일 패널 */
            <div className="hy-card" style={{ padding:"16px 16px" }}>
              <p style={{ fontSize:12, fontWeight:800, color:"var(--text-muted)", margin:"0 0 10px" }}>
                할일 목록
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:10 }}>
                {myViewTodos.length === 0 ? (
                  <div style={{ padding:"20px 0", textAlign:"center" }}>
                    <p style={{ fontSize:20, margin:"0 0 5px" }}>📝</p>
                    <p style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:600, margin:0 }}>
                      {viewDate === today ? "오늘 할 일을 추가해봐요!" : "이 날엔 할 일이 없어요"}
                    </p>
                  </div>
                ) : myViewTodos.map(todo => (
                  <TodoCard
                    key={todo.id}
                    todo={todo}
                    isOwner={true}
                    accentColor={getStudentColor(me!.student_no, allStudents)}
                    likeCount={likeMap[todo.id]?.size ?? 0}
                    liked={likeMap[todo.id]?.has(me!.student_no) ?? false}
                    onToggle={() => toggleDone(todo.id, todo.done)}
                    onDelete={() => deleteTodo(todo.id)}
                    onLike={() => toggleLike(todo.id)}
                  />
                ))}
              </div>
              {/* 추가 인풋 */}
              <div style={{ display:"flex", gap:7, alignItems:"center" }}>
                <input
                  placeholder="새 할일 입력 후 Enter"
                  value={newTodo}
                  onChange={e => setNewTodo(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && addTodo()}
                  className="hy-input"
                  style={{ flex:1, fontSize:12 }}
                />
                <select value={newCat} onChange={e => setNewCat(e.target.value)}
                  className="hy-input"
                  style={{ width:78, fontSize:12, cursor:"pointer", flexShrink:0 }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={addTodo} disabled={adding}
                  className="hy-btn hy-btn-primary"
                  style={{ fontSize:12, padding:"8px 14px", flexShrink:0 }}>
                  {adding ? "..." : "추가"}
                </button>
              </div>
            </div>
          ) : (
            /* 멀티 선택 - 학생별 컬럼 */
            <div style={{
              display:"grid",
              gridTemplateColumns: `repeat(${Math.min(selectedStudents.size, 3)}, 1fr)`,
              gap:10,
            }}>
              {[...selectedStudents].map(sNo => {
                const student = allStudents.find(s => s.student_no === sNo);
                const color   = getStudentColor(sNo, allStudents);
                const sTodos  = allTodos.filter(t => t.date === viewDate && t.student_no === sNo);
                const isMe    = sNo === me?.student_no;
                const sDone   = sTodos.filter(t => t.done).length;
                const sRate   = sTodos.length ? Math.round((sDone/sTodos.length)*100) : 0;
                return (
                  <div key={sNo} className="hy-card" style={{
                    padding:"12px 12px",
                    borderTop:`3px solid ${color}`,
                  }}>
                    {/* 학생 헤더 */}
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{
                          width:24, height:24, borderRadius:"50%",
                          background: hexToRgba(color, 0.15), border:`2px solid ${color}`,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:10, fontWeight:900, color,
                        }}>{student?.name.slice(-2) ?? "?"}</div>
                        <span style={{ fontSize:12, fontWeight:900, color:"var(--text)" }}>
                          {student?.name ?? sNo}
                          {isMe && <span style={{ fontSize:10, color, marginLeft:3 }}>(나)</span>}
                        </span>
                      </div>
                      {sTodos.length > 0 && (
                        <span style={{
                          fontSize:10, fontWeight:800,
                          color: sRate===100 ? "#16a34a" : color,
                          background: sRate===100 ? "#f0fdf4" : hexToRgba(color, 0.1),
                          padding:"2px 7px", borderRadius:999,
                        }}>
                          {sRate===100 ? "🎉" : `${sDone}/${sTodos.length}`}
                        </span>
                      )}
                    </div>

                    {/* 진행 바 */}
                    {sTodos.length > 0 && (
                      <div style={{ height:3, borderRadius:999, background:hexToRgba(color,0.15), overflow:"hidden", marginBottom:8 }}>
                        <div style={{
                          height:"100%", borderRadius:999, background:color,
                          width:`${sRate}%`, transition:"width 0.4s",
                        }} />
                      </div>
                    )}

                    {/* 할일 목록 */}
                    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                      {sTodos.length === 0 ? (
                        <p style={{ fontSize:11, color:"var(--text-subtle)", fontWeight:600,
                          textAlign:"center", padding:"12px 0", margin:0 }}>
                          할 일 없음
                        </p>
                      ) : sTodos.map(todo => (
                        <TodoCard
                          key={todo.id}
                          todo={todo}
                          isOwner={isMe}
                          accentColor={color}
                          likeCount={likeMap[todo.id]?.size ?? 0}
                          liked={likeMap[todo.id]?.has(me!.student_no) ?? false}
                          onToggle={isMe ? () => toggleDone(todo.id, todo.done) : undefined}
                          onDelete={isMe ? () => deleteTodo(todo.id) : undefined}
                          onLike={() => toggleLike(todo.id)}
                        />
                      ))}
                    </div>

                    {/* 내 칸에만 추가 인풋 */}
                    {isMe && (
                      <div style={{ display:"flex", gap:5, alignItems:"center", marginTop:8 }}>
                        <input
                          placeholder="할일 추가 후 Enter"
                          value={newTodo}
                          onChange={e => setNewTodo(e.target.value)}
                          onKeyDown={e => e.key==="Enter" && addTodo()}
                          className="hy-input"
                          style={{ flex:1, fontSize:11 }}
                        />
                        <select value={newCat} onChange={e => setNewCat(e.target.value)}
                          className="hy-input"
                          style={{ width:64, fontSize:11, cursor:"pointer", flexShrink:0 }}>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button onClick={addTodo} disabled={adding}
                          className="hy-btn hy-btn-primary"
                          style={{ fontSize:11, padding:"6px 10px", flexShrink:0 }}>
                          {adding ? "..." : "+"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── 회고 & 일기 (오늘만 편집, 과거는 읽기 전용) ── */}
          {viewDate === today && me ? (
            <DiarySection
              me={me}
              today={today}
              log={todayLog}
              onSaved={() => loadAll(me.student_no)}
            />
          ) : viewLog ? (
            <PastDiaryView log={viewLog} date={viewDate} />
          ) : null}

          {/* ── 반 피드 ── */}
          <div className="hy-card" style={{ padding:"16px 16px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
              <p style={{ fontSize:13, fontWeight:900, color:"var(--text)", margin:0 }}>🔥 오늘 우리반</p>
              <span style={{ fontSize:11, color:"var(--text-muted)", fontWeight:600 }}>
                {feed.length}명 기록 중
              </span>
            </div>
            {feed.length === 0 ? (
              <p style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:600, margin:0 }}>
                아직 기록한 친구가 없어요. 첫 번째가 되어봐요! 🙂
              </p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {feed.map((f, i) => {
                  const isMe    = f.student_no === me?.student_no;
                  const sColor  = getStudentColor(f.student_no, allStudents);
                  return (
                    <div key={f.id} style={{
                      padding:"10px 12px", borderRadius:10,
                      background: isMe ? hexToRgba(sColor, 0.08) : "#f9fafb",
                      border:`1px solid ${isMe ? hexToRgba(sColor, 0.3) : "var(--border)"}`,
                      borderLeft:`3px solid ${sColor}`,
                    }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                        marginBottom: f.share_reflection && (f.good || f.bad) ? 7 : 0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                          <span style={{ fontSize:11, fontWeight:700, color:"var(--text-subtle)", minWidth:18 }}>
                            {i+1}
                          </span>
                          {/* 학생 색점 */}
                          <span style={{
                            width:10, height:10, borderRadius:"50%", background:sColor, display:"inline-block"
                          }} />
                          <span style={{ fontSize:13, fontWeight:800, color:"var(--text)" }}>
                            {f.name}
                            {isMe && (
                              <span style={{ fontSize:10, color:sColor, marginLeft:4 }}>(나)</span>
                            )}
                          </span>
                        </div>
                        {f.study_hours != null && (
                          <span style={{
                            fontSize:11, fontWeight:700, color:"var(--primary)",
                            background:"var(--primary-light)", padding:"2px 8px", borderRadius:999,
                          }}>⏱ {f.study_hours}h</span>
                        )}
                      </div>
                      {f.share_reflection && (f.good || f.bad) && (
                        <div style={{ paddingTop:6, borderTop:"1px solid rgba(0,0,0,0.05)",
                          display:"flex", flexDirection:"column", gap:3 }}>
                          {f.good && (
                            <p style={{ fontSize:11, color:"#15803d", margin:0, lineHeight:1.5 }}>
                              <span style={{ fontWeight:700 }}>✅ </span>{f.good}
                            </p>
                          )}
                          {f.bad && (
                            <p style={{ fontSize:11, color:"#92400e", margin:0, lineHeight:1.5 }}>
                              <span style={{ fontWeight:700 }}>💭 </span>{f.bad}
                            </p>
                          )}
                        </div>
                      )}
                      {/* 일기 이미지 미리보기 (공유 시) */}
                      {f.share_reflection && (f.image_urls?.length ?? 0) > 0 && (
                        <div style={{ display:"flex", gap:5, marginTop:5, flexWrap:"wrap" }}>
                          {f.image_urls!.slice(0,3).map((url, ui) => (
                            <img key={ui} src={url} alt="" style={{
                              width:48, height:48, objectFit:"cover", borderRadius:6,
                              border:"1.5px solid var(--border)", cursor:"pointer",
                            }} onClick={() => window.open(url,"_blank")} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>{/* end right */}
      </div>{/* end grid */}
    </div>
  );
}
