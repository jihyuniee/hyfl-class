"use client";

import { useState } from "react";


const STUDENTS = [
  "강지우","김은솔","김태현","김하연","김혜민",
  "박민석","박우진","성연준","손정연","송민주",
  "심지안","양효승","유다현","윤혜림","이승지",
  "이시원","이조은","장지현","전주하","정은지",
  "주보민","최인아","현서정",
];

const FRIEND_CATEGORIES = [
  { emoji:"🙋", label:"책임감", desc:"맡은 일을 꾸준히 수행하고 끝까지 마무리한 모습" },
  { emoji:"🌱", label:"솔선수범", desc:"필요한 일을 스스로 찾아 먼저 행동한 모습" },
  { emoji:"🌸", label:"배려와 공감", desc:"친구의 어려움을 살피고 따뜻하게 도운 모습" },
  { emoji:"💬", label:"소통과 조율", desc:"의견을 경청하고 갈등을 합리적으로 조정한 모습" },
  { emoji:"🤝", label:"학급 기여", desc:"우리 반이 더 좋아지도록 힘을 보탠 모습" },
  { emoji:"💡", label:"학습 나눔", desc:"배운 내용을 설명하고 함께 성장하도록 도운 모습" },
  { emoji:"🛠️", label:"문제 해결", desc:"학급의 불편을 발견하고 해결 방법을 실천한 모습" },
  { emoji:"☀️", label:"긍정적 태도", desc:"밝고 성실한 태도로 좋은 분위기를 만든 모습" },
  { emoji:"✨", label:"그 밖의 좋은 행동", desc:"친구에게서 발견한 의미 있는 행동" },
];

const SELF_CATEGORIES = [
  { emoji:"🙋", label:"1인 1역할", desc:"맡은 역할을 책임감 있게 수행한 일" },
  { emoji:"🌱", label:"자발적인 실천", desc:"시키지 않아도 필요한 일을 먼저 한 경험" },
  { emoji:"🤝", label:"친구와 학급 돕기", desc:"친구 또는 우리 반에 도움이 된 행동" },
  { emoji:"💡", label:"학습 나눔", desc:"배운 내용을 친구와 나누며 함께 성장한 경험" },
  { emoji:"🛠️", label:"문제 해결", desc:"불편이나 문제를 발견하고 해결한 경험" },
  { emoji:"💪", label:"꾸준함과 성장", desc:"어려움 속에서도 계속 실천하거나 개선한 일" },
  { emoji:"✨", label:"그 밖의 실천", desc:"나의 책임감과 성장을 보여 주는 행동" },
];

export default function PraisePage() {
  const [submitted, setSubmitted] = useState(false);
  const [formType, setFormType] = useState<"friend"|"self">("friend");
  const [formOpen, setFormOpen] = useState(false);

  const [fromName, setFromName] = useState("");
  const [toName,   setToName]   = useState("");
  const [category, setCategory] = useState("");
  const [content,  setContent]  = useState("");
  const [posting,  setPosting]  = useState(false);

  const cats = formType === "friend" ? FRIEND_CATEGORIES : SELF_CATEGORIES;

  function openForm(type: "friend" | "self") {
    setFormType(type); setFormOpen(true); setSubmitted(false);
    setFromName(""); setToName(""); setCategory(""); setContent("");
  }

  async function submit() {
    if (!fromName)            { alert("내 이름을 선택해주세요"); return; }
    if (!category)            { alert("분류를 선택해주세요"); return; }
    if (!content.trim())      { alert("내용을 입력해주세요"); return; }
    if (formType === "friend" && !toName) { alert("좋은 행동을 발견한 친구를 선택해주세요"); return; }
    setPosting(true);
    const response = await fetch("/api/praise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: formType,
        from_name: fromName,
        to_name: formType === "friend" ? toName : null,
        category,
        content: content.trim(),
      }),
    });
    const result = await response.json();
    setPosting(false);
    if (!response.ok) {
      alert(result.error ?? "저장하지 못했습니다.");
      return;
    }
    setFormOpen(false);
    setSubmitted(true);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* 헤더 */}
      <div className="hy-hero">
        <h1 style={{ color:"#fff", fontSize:"clamp(22px,4vw,32px)", fontWeight:900, margin:"0 0 8px" }}>
          🌱 우리 반 성장 기록
        </h1>
        <p style={{ color:"rgba(255,255,255,0.85)", fontSize:13, margin:0, fontWeight:500, lineHeight:1.8 }}>
          평소의 작은 실천과 서로의 좋은 행동을 실명으로 기록해요.
        </p>
      </div>

      <div className="hy-card" style={{ padding:"16px 18px", background:"#f8fafc" }}>
        <p style={{ fontSize:13, color:"var(--text)", fontWeight:800, margin:"0 0 7px" }}>
          작은 행동도 좋은 기록이 됩니다
        </p>
        <p style={{ fontSize:12, color:"var(--text-muted)", lineHeight:1.75, margin:0 }}>
          1인 1역할을 꾸준히 수행한 일, 친구를 도운 일, 학습을 나눈 일, 학급의 문제를 해결한 일처럼
          평소의 구체적인 모습을 남겨주세요. 작성 내용은 담임 선생님만 확인하며, 여러분을 더 잘 이해하는 참고 자료로 활용합니다.
        </p>
      </div>

      <div className="hy-card" style={{ padding:"20px 20px 18px" }}>
        <div style={{ marginBottom:14 }}>
          <p style={{ fontSize:14, color:"var(--text)", fontWeight:900, margin:"0 0 5px" }}>
            ✍️ 이렇게 남겨보세요
          </p>
          <p style={{ fontSize:11, color:"var(--text-subtle)", lineHeight:1.6, margin:0 }}>
            멋있는 말보다 실제로 있었던 행동을 적는 것이 더 중요해요.
          </p>
        </div>

        <div style={{
          padding:"13px 14px", borderRadius:14, background:"#fff7ed",
          border:"1px solid #fed7aa", marginBottom:12,
        }}>
          <p style={{ fontSize:12, color:"#9a3412", fontWeight:800, margin:"0 0 7px" }}>
            ❌ “1인 1역할을 열심히 했다.”
          </p>
          <p style={{ fontSize:12, color:"var(--text)", lineHeight:1.75, margin:0 }}>
            ✅ “이번 주 알림이 역할을 맡아 수행평가 일정과 준비물을 정리해 안내하고,
            제출 전날 다시 알려 주어 친구들이 일정을 놓치지 않도록 도왔다.”
          </p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(210px, 1fr))", gap:10 }}>
          {[
            {
              title:"🙋 1인 1역할",
              example:"청소 담당 친구가 결석한 날, 담당 구역이 비어 있는 것을 보고 내 구역을 마친 뒤 함께 정리했다.",
              traits:"책임감 · 솔선수범 · 학급 기여",
            },
            {
              title:"💡 학습 나눔",
              example:"수학 문제를 어려워하는 친구에게 답만 알려 주지 않고 단계별로 질문하며 스스로 풀 수 있도록 설명했다.",
              traits:"배려 · 의사소통 · 함께 성장",
            },
            {
              title:"💬 소통과 조율",
              example:"학급회의에서 의견이 엇갈리자 양쪽의 생각을 정리하고 모두가 받아들일 수 있는 대안을 제안했다.",
              traits:"경청 · 문제 해결 · 리더십",
            },
          ].map(item => (
            <div key={item.title} style={{
              padding:"14px", borderRadius:14, background:"#f8fafc",
              border:"1px solid #e2e8f0",
            }}>
              <p style={{ fontSize:12, color:"var(--text)", fontWeight:900, margin:"0 0 7px" }}>
                {item.title}
              </p>
              <p style={{ fontSize:12, color:"var(--text-muted)", lineHeight:1.7, margin:"0 0 10px" }}>
                {item.example}
              </p>
              <p style={{
                display:"inline-block", fontSize:10, color:"var(--primary)", fontWeight:800,
                background:"var(--primary-light)", borderRadius:999, padding:"4px 9px", margin:0,
              }}>
                기록에서 보이는 모습: {item.traits}
              </p>
            </div>
          ))}
        </div>

        <p style={{ fontSize:10, color:"var(--text-subtle)", lineHeight:1.6, margin:"12px 2px 0" }}>
          ※ 모든 기록은 실명으로 제출되며 담임 선생님만 확인합니다. 작성한 문장이 생활기록부에 그대로 옮겨지는 것은 아닙니다.
        </p>
      </div>

      <p style={{ fontSize:12, color:"var(--text-subtle)", fontWeight:600, margin:"0 0 -8px", textAlign:"right" }}>
        💡 상황 → 행동 → 도움·변화의 순서로 기록해요
      </p>

      {/* 글쓰기 버튼 */}
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={() => openForm("friend")}
          className="hy-btn hy-btn-primary"
          style={{ flex:1, fontSize:13, padding:"14px" }}>
          👀 친구의 좋은 행동 남기기
        </button>
        <button onClick={() => openForm("self")}
          style={{
            flex:1, padding:"14px", borderRadius:16,
            border:"2px solid #fbbf24", background:"#fffbeb",
            color:"#92400e", fontSize:13, fontWeight:800,
            cursor:"pointer", fontFamily:"inherit",
          }}>
          ✍️ 나의 실천 기록하기
        </button>
      </div>

      {/* 글쓰기 폼 */}
      {formOpen && (
        <div className="hy-card" style={{
          padding:"24px 26px",
          border:`2px solid ${formType === "friend" ? "var(--primary)" : "#fbbf24"}`,
        }}>
          <h3 style={{ fontSize:15, fontWeight:900, color:"var(--text)", margin:"0 0 18px" }}>
            {formType === "friend" ? "👀 친구의 좋은 행동 남기기" : "✍️ 나의 실천 기록하기"}
          </h3>

          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            {/* 내 이름 */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:5 }}>
                내 이름 *
              </label>
              <select
                value={fromName}
                onChange={e => setFromName(e.target.value)}
                className="hy-input"
                style={{ cursor:"pointer" }}
              >
                <option value="">내 이름을 선택해주세요</option>
                {STUDENTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* 칭찬받을 친구 선택 — 드롭다운 */}
            {formType === "friend" && (
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:5 }}>
                  좋은 행동을 발견한 친구 *
                </label>
                <select
                  value={toName}
                  onChange={e => setToName(e.target.value)}
                  className="hy-input"
                  style={{
                    cursor:"pointer",
                    borderColor: toName ? "var(--primary)" : undefined,
                    background: toName ? "var(--primary-light)" : undefined,
                    color: toName ? "var(--primary)" : undefined,
                    fontWeight: toName ? 800 : undefined,
                  }}
                >
                  <option value="">친구를 선택해주세요 👇</option>
                  {STUDENTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {toName && (
                  <p style={{ fontSize:12, color:"var(--primary)", fontWeight:700, margin:"6px 0 0" }}>
                    ✓ {toName}의 좋은 행동을 기록할게요!
                  </p>
                )}
              </div>
            )}

            {/* 카테고리 */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:8 }}>
                {formType === "friend" ? "어떤 좋은 행동이었나요? *" : "어떤 실천을 기록할까요? *"}
              </label>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {cats.map(c => (
                  <button key={c.label} onClick={() => setCategory(c.label)}
                    style={{
                      padding:"11px 16px", borderRadius:12, border:"1.5px solid",
                      textAlign:"left", cursor:"pointer", fontFamily:"inherit",
                      transition:"all 0.1s",
                      borderColor: category === c.label ? "var(--primary)" : "var(--border)",
                      background: category === c.label ? "var(--primary-light)" : "#fff",
                    }}>
                    <p style={{
                      fontSize:13, fontWeight:800, margin:"0 0 2px",
                      color: category === c.label ? "var(--primary)" : "var(--text)",
                    }}>{c.emoji} {c.label}</p>
                    <p style={{ fontSize:11, color:"var(--text-subtle)", margin:0, fontWeight:500 }}>
                      {c.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* 내용 */}
            <div>
              <label style={{ fontSize:12, fontWeight:700, color:"var(--text-muted)", display:"block", marginBottom:6 }}>
                상황과 행동, 도움이나 변화를 구체적으로 써주세요 *
              </label>
              <textarea
                placeholder={formType === "friend"
                  ? "상황 → 친구가 한 행동 → 도움이 된 점을 써주세요.\n예) 수행평가 일정을 놓친 친구에게 준비물과 제출일을 다시 알려 주고 함께 확인하여 과제를 제때 제출하도록 도왔다."
                  : "상황 → 내가 한 행동 → 친구나 학급에 생긴 변화를 써주세요.\n예) 이번 주 알림이 역할을 맡아 수행평가 일정을 정리하고 전날 다시 안내하여 친구들이 제출일을 놓치지 않도록 도왔다."}
                value={content}
                onChange={e => setContent(e.target.value)}
                className="hy-input"
                style={{ minHeight:120, resize:"vertical" }}
              />
            </div>

            <div style={{ display:"flex", gap:8 }}>
              <button onClick={submit} disabled={posting}
                className="hy-btn hy-btn-primary"
                style={{ flex:1, fontSize:14 }}>
                {posting ? "올리는 중..." : "게시하기 🚀"}
              </button>
              <button onClick={() => setFormOpen(false)} className="hy-btn" style={{ fontSize:13 }}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {submitted && (
        <div className="hy-card" style={{
          padding:"20px", textAlign:"center", background:"#f0fdf4", border:"1.5px solid #bbf7d0",
        }}>
          <p style={{ fontSize:24, margin:"0 0 7px" }}>✅</p>
          <p style={{ fontSize:14, fontWeight:900, color:"#166534", margin:"0 0 5px" }}>
            기록이 담임 선생님께 전달되었습니다
          </p>
          <p style={{ fontSize:11, color:"#15803d", lineHeight:1.6, margin:0 }}>
            이 내용은 게시판에 공개되지 않으며 담임 선생님만 확인합니다.
          </p>
        </div>
      )}

    </div>
  );
}
