"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type MealPost = {
  id: string;
  created_at: string;
  date: string;
  type: "중식" | "석식";
  menu: string;
  author: string | null;
};

type MealRating = {
  id: string;
  meal_id: string;
  rating: number;
  comment: string | null;
  author: string | null;
};

function toKSTDate() {
  const k = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  return `${k.getFullYear()}-${String(k.getMonth()+1).padStart(2,"0")}-${String(k.getDate()).padStart(2,"0")}`;
}
function fmtDate(d: string) {
  const dt = new Date(`${d}T00:00:00+09:00`);
  const days = ["일","월","화","수","목","금","토"];
  return `${dt.getMonth()+1}월 ${dt.getDate()}일 (${days[dt.getDay()]})`;
}
function stars(n: number) {
  return "⭐".repeat(n) + "☆".repeat(5-n);
}

export default function MealPage() {
  const [meals,   setMeals]   = useState<MealPost[]>([]);
  const [ratings, setRatings] = useState<MealRating[]>([]);
  const [today]               = useState(toKSTDate());

  // 메뉴 등록 폼
  const [fDate,   setFDate]   = useState(toKSTDate());
  const [fType,   setFType]   = useState<"중식"|"석식">("중식");
  const [fMenu,   setFMenu]   = useState("");
  const [fAuthor, setFAuthor] = useState("");
  const [posting, setPosting] = useState(false);
  const [formOpen,setFormOpen]= useState(false);

  // 평점 폼
  const [ratingOpen, setRatingOpen] = useState<string|null>(null);
  const [rStar,   setRStar]   = useState(5);
  const [rComment,setRComment]= useState("");
  const [rAuthor, setRAuthor] = useState("");
  const [rPosting,setRPosting]= useState(false);

  async function load() {
    const { data: m } = await supabase.from("meal_posts").select("*").order("date", { ascending:false }).order("type");
    const { data: r } = await supabase.from("meal_ratings").select("*");
    setMeals((m as MealPost[]) ?? []);
    setRatings((r as MealRating[]) ?? []);
  }

  useEffect(() => { load(); }, []);

  async function submitMenu() {
    if (!fMenu.trim()) { alert("메뉴를 입력해주세요"); return; }
    setPosting(true);
    await supabase.from("meal_posts").insert({
      date: fDate, type: fType, menu: fMenu.trim(), author: fAuthor.trim() || null,
    });
    setPosting(false);
    setFMenu(""); setFAuthor(""); setFormOpen(false);
    await load();
  }

  async function submitRating() {
    if (!ratingOpen) return;
    setRPosting(true);
    await supabase.from("meal_ratings").insert({
      meal_id: ratingOpen, rating: rStar,
      comment: rComment.trim() || null, author: rAuthor.trim() || null,
    });
    setRPosting(false);
    setRatingOpen(null); setRStar(5); setRComment(""); setRAuthor("");
    await load();
  }

  function avgRating(mealId: string) {
    const rs = ratings.filter(r => r.meal_id === mealId);
    if (!rs.length) return null;
    return (rs.reduce((s,r) => s + r.rating, 0) / rs.length).toFixed(1);
  }

  // 날짜별 그룹핑
  const grouped: Record<string, MealPost[]> = {};
  meals.forEach(m => {
    if (!grouped[m.date]) grouped[m.date] = [];
    grouped[m.date].push(m);
  });

  const todayMeals = meals.filter(m => m.date === today);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      <div className="hy-hero">
        <h1 style={{ color:"#fff", fontSize:"clamp(22px,4vw,32px)", fontWeight:900, margin:"0 0 8px" }}>🍱 급식 게시판</h1>
        <p style={{ color:"rgba(255,255,255,0.85)", fontSize:13, margin:0, fontWeight:500, lineHeight:1.7 }}>
          오늘 뭐 나왔는지 기록하고, 맛 평가도 남겨봐요!
        </p>
      </div>

      {/* 오늘 급식 요약 */}
      {todayMeals.length > 0 && (
        <div style={{ borderRadius:20, padding:"18px 22px", background:"linear-gradient(135deg,#fdf2f8,#f5f3ff)", border:"1.5px solid #f9a8d4" }}>
          <p style={{ fontSize:12, fontWeight:800, color:"var(--primary)", margin:"0 0 10px", textTransform:"uppercase", letterSpacing:"0.05em" }}>
            🍽️ 오늘 급식 — {fmtDate(today)}
          </p>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            {todayMeals.map(m => (
              <div key={m.id} style={{ flex:1, minWidth:160, background:"#fff", borderRadius:14, padding:"12px 16px", border:"1px solid #f9a8d4" }}>
                <p style={{ fontSize:11, fontWeight:800, color:"var(--primary)", margin:"0 0 6px" }}>
                  {m.type === "중식" ? "☀️ 중식" : "🌙 석식"}
                </p>
                <p style={{ fontSize:13, color:"var(--text)", margin:"0 0 6px", lineHeight:1.7, whiteSpace:"pre-wrap", fontWeight:600 }}>{m.menu}</p>
                {avgRating(m.id) && (
                  <p style={{ fontSize:12, color:"#f59e0b", fontWeight:800, margin:0 }}>⭐ {avgRating(m.id)} / 5</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 메뉴 등록 버튼 */}
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button onClick={() => setFormOpen(o=>!o)} className="hy-btn hy-btn-primary" style={{ fontSize:13 }}>
          {formOpen ? "닫기" : "🍽️ 메뉴 등록"}
        </button>
      </div>

      {/* 메뉴 등록 폼 */}
      {formOpen && (
        <div className="hy-card" style={{ padding:"22px 24px" }}>
          <h3 style={{ fontSize:15, fontWeight:900, color:"var(--text)", margin:"0 0 14px" }}>🍽️ 오늘 메뉴 등록</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
              <input type="date" value={fDate} onChange={e=>setFDate(e.target.value)} className="hy-input"/>
              <select value={fType} onChange={e=>setFType(e.target.value as "중식"|"석식")} className="hy-input" style={{ cursor:"pointer" }}>
                <option value="중식">☀️ 중식</option>
                <option value="석식">🌙 석식</option>
              </select>
              <input placeholder="당번 이름 (선택)" value={fAuthor} onChange={e=>setFAuthor(e.target.value)} className="hy-input"/>
            </div>
            <textarea
              placeholder={"메뉴를 입력해주세요\n예)\n쌀밥\n된장찌개\n닭갈비볶음\n깍두기\n우유"}
              value={fMenu} onChange={e=>setFMenu(e.target.value)}
              className="hy-input" style={{ minHeight:120, resize:"vertical" }}/>
            <button onClick={submitMenu} disabled={posting} className="hy-btn hy-btn-primary" style={{ fontSize:13, alignSelf:"flex-start" }}>
              {posting ? "등록 중..." : "등록하기"}
            </button>
          </div>
        </div>
      )}

      {/* 날짜별 급식 목록 */}
      {Object.keys(grouped).length === 0 ? (
        <div className="hy-card" style={{ padding:"40px", textAlign:"center" }}>
          <p style={{ fontSize:32, margin:"0 0 12px" }}>🍱</p>
          <p style={{ fontSize:14, color:"var(--text-subtle)", fontWeight:600 }}>아직 등록된 급식이 없어요.<br/>오늘 당번이 메뉴를 올려줘요!</p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, dayMeals]) => (
          <div key={date}>
            <p style={{ fontSize:13, fontWeight:800, color:"var(--text-muted)", margin:"0 0 10px" }}>
              📅 {fmtDate(date)} {date===today && <span style={{ fontSize:11, background:"var(--primary)", color:"#fff", padding:"2px 8px", borderRadius:999, marginLeft:6, fontWeight:700 }}>오늘</span>}
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
              {dayMeals.map(meal => {
                const rs = ratings.filter(r=>r.meal_id===meal.id);
                const avg = avgRating(meal.id);
                return (
                  <div key={meal.id} className="hy-card" style={{ padding:"18px 20px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                      <span style={{ fontSize:13, fontWeight:900, color: meal.type==="중식" ? "#f59e0b" : "#6366f1",
                        background: meal.type==="중식" ? "#fffbeb" : "#f5f3ff", padding:"4px 12px", borderRadius:999 }}>
                        {meal.type==="중식" ? "☀️ 중식" : "🌙 석식"}
                      </span>
                      {meal.author && <span style={{ fontSize:11, color:"var(--text-subtle)", fontWeight:600 }}>📝 {meal.author}</span>}
                    </div>

                    <p style={{ fontSize:13, color:"var(--text)", lineHeight:1.8, margin:"0 0 12px", whiteSpace:"pre-wrap", fontWeight:600 }}>{meal.menu}</p>

                    {/* 평점 요약 */}
                    {rs.length > 0 && (
                      <div style={{ marginBottom:10 }}>
                        <p style={{ fontSize:13, fontWeight:800, color:"#f59e0b", margin:"0 0 6px" }}>⭐ {avg} / 5 ({rs.length}명 평가)</p>
                        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                          {rs.slice(0,3).map(r => (
                            <p key={r.id} style={{ fontSize:12, color:"var(--text-muted)", margin:0 }}>
                              {stars(r.rating)} {r.comment && `— ${r.comment}`} {r.author && <span style={{ color:"var(--text-subtle)" }}>({r.author})</span>}
                            </p>
                          ))}
                          {rs.length > 3 && <p style={{ fontSize:11, color:"var(--text-subtle)", margin:0 }}>+{rs.length-3}개 더</p>}
                        </div>
                      </div>
                    )}

                    {/* 평점 등록 */}
                    {ratingOpen === meal.id ? (
                      <div style={{ borderTop:"1.5px solid var(--border)", paddingTop:12, display:"flex", flexDirection:"column", gap:8 }}>
                        <div style={{ display:"flex", gap:4, justifyContent:"center" }}>
                          {[1,2,3,4,5].map(n => (
                            <button key={n} onClick={()=>setRStar(n)}
                              style={{ fontSize:24, background:"none", border:"none", cursor:"pointer", opacity: n<=rStar ? 1 : 0.3, transition:"opacity 0.1s" }}>⭐</button>
                          ))}
                        </div>
                        <input placeholder="한줄 평 (선택)" value={rComment} onChange={e=>setRComment(e.target.value)} className="hy-input"/>
                        <input placeholder="이름 (선택)" value={rAuthor} onChange={e=>setRAuthor(e.target.value)} className="hy-input"/>
                        <div style={{ display:"flex", gap:8 }}>
                          <button onClick={submitRating} disabled={rPosting} className="hy-btn hy-btn-primary" style={{ flex:1, fontSize:13 }}>
                            {rPosting ? "등록 중..." : "평가하기"}
                          </button>
                          <button onClick={()=>setRatingOpen(null)} className="hy-btn" style={{ fontSize:13 }}>취소</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={()=>{ setRatingOpen(meal.id); setRStar(5); }}
                        style={{ width:"100%", padding:"8px", borderRadius:12, border:"1.5px dashed var(--border)", background:"transparent",
                          fontSize:12, fontWeight:700, color:"var(--text-subtle)", cursor:"pointer", fontFamily:"inherit" }}>
                        ⭐ 맛 평가하기
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
