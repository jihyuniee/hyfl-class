export default function PledgesPage() {
  const RULES = [
    {
      emoji: "🏫",
      title: "교실 생활 규칙",
      color: "linear-gradient(135deg,#f472b6,#a78bfa)",
      shadow: "rgba(244,114,182,0.2)",
      items: [
        "거짓말 금지 — 실수는 괜찮지만, 숨기지는 말기. 같이 해결하기.",
        "배려하기 — 말투·표정·뒷말로 사람을 힘들게 하지 않기.",
        "청소는 '우리 일' — 교실은 함께 쓰는 공간입니다.",
        "예의 — 선생님뿐 아니라 친구·타 반·급식실·행정실 모두에게 예의 지키기.",
        "이기주의로 공동체를 망가뜨리는 행동(책임 회피, 남에게 떠넘기기 등) 금지.",
      ],
    },
    {
      emoji: "📚",
      title: "수업 시간 규칙",
      color: "linear-gradient(135deg,#3b82f6,#6366f1)",
      shadow: "rgba(59,130,246,0.2)",
      items: [
        "수업 시작 전 준비물 챙겨두기.",
        "수업 중 핸드폰은 정해진 규칙에 따라.",
        "태도 — 수업·조회·종례에서 기본 태도는 서로에 대한 존중.",
        "모르는 것은 적극적으로 질문하기. 모른다고 부끄러운 게 아닙니다.",
        "멘토·멘티 활동 시간에는 서로 성실하게 참여하기.",
      ],
    },
    {
      emoji: "📱",
      title: "연락 규칙",
      color: "linear-gradient(135deg,#34d399,#0ea5e9)",
      shadow: "rgba(52,211,153,0.2)",
      items: [
        "오후 6시 이후에는 선생님 답변이 늦을 수 있습니다.",
        "급한 일은 우리 반에서 정한 채널(카톡 등)로 보내주세요.",
        "메시지는 예의 있는 문장으로 부탁합니다.",
        "단체 채팅방에서는 불필요한 메시지 자제하기.",
        "친구에게도 연락할 때는 늦은 시간 배려하기.",
      ],
    },
    {
      emoji: "🗣️",
      title: "학생들이 정한 약속",
      color: "linear-gradient(135deg,#fb923c,#f472b6)",
      shadow: "rgba(251,146,60,0.2)",
      items: [
        "🔜 학급회의에서 정해지면 업데이트될 예정이에요!",
      ],
      pending: true,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* 헤더 */}
      <div style={{
        background: "linear-gradient(135deg,#f472b6 0%,#a78bfa 50%,#818cf8 100%)",
        borderRadius: 28, padding: "32px 28px",
        position: "relative", overflow: "hidden",
        boxShadow: "0 12px 40px rgba(244,114,182,0.3)",
      }}>
        {[{w:140,h:140,top:-40,right:-20,op:0.08},{w:70,h:70,bottom:-10,left:60,op:0.07}].map((b,i)=>(
          <div key={i} style={{ position:"absolute",width:b.w,height:b.h,top:b.top,right:b.right,bottom:b.bottom,left:b.left,borderRadius:"50%",background:"#fff",opacity:b.op }}/>
        ))}
        <div style={{ position: "relative" }}>
          <div style={{ display:"inline-flex",alignItems:"center",background:"rgba(255,255,255,0.2)",backdropFilter:"blur(8px)",borderRadius:999,padding:"4px 14px",marginBottom:12,border:"1px solid rgba(255,255,255,0.3)" }}>
            <span style={{ fontSize:12, color:"#fff", fontWeight:700 }}>2026학년도 2학년 2반</span>
          </div>
          <h1 style={{ color:"#fff", fontSize:"clamp(22px,4vw,32px)", fontWeight:900, margin:"0 0 8px", letterSpacing:"-0.5px" }}>
            📋 우리반 규칙
          </h1>
          <p style={{ color:"rgba(255,255,255,0.85)", fontSize:13, margin:0, fontWeight:500, lineHeight:1.7 }}>
            함께 만들어가는 우리반 약속이에요. 서로 존중하며 즐거운 교실을 만들어요 🌸
          </p>
        </div>
      </div>

      {/* 슬로건 */}
      <div style={{
        padding: "18px 22px", borderRadius: 18,
        background: "linear-gradient(135deg,#fdf2f8,#f5f3ff)",
        border: "1.5px solid #e9d5ff",
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <span style={{ fontSize: 28 }}>💬</span>
        <div>
          <p style={{ fontSize: 12, fontWeight: 800, color: "var(--text-subtle)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>우리반 슬로건</p>
          <p style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", margin: 0, letterSpacing: "-0.3px" }}>
            "지금부터 할 수 있는 것부터, 나부터."
          </p>
        </div>
      </div>

      {/* 규칙 카드들 */}
      {RULES.map((rule) => (
        <div key={rule.title} style={{ borderRadius: 20, overflow: "hidden", boxShadow: `0 4px 20px ${rule.shadow}`, opacity: rule.pending ? 0.8 : 1 }}>
          <div style={{ background: rule.color, padding: "16px 22px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>{rule.emoji}</span>
            <h3 style={{ color: "#fff", fontSize: 16, fontWeight: 900, margin: 0, letterSpacing: "-0.3px" }}>
              {rule.title}
            </h3>
            {rule.pending && (
              <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.25)", color: "#fff", padding: "3px 10px", borderRadius: 999 }}>
                업데이트 예정
              </span>
            )}
          </div>
          <div style={{ background: "#fff", padding: "16px 22px" }}>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {rule.items.map((item, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                    background: rule.pending ? "#f3f4f6" : rule.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 900, color: rule.pending ? "#9ca3af" : "#fff",
                    marginTop: 2,
                  }}>
                    {rule.pending ? "?" : i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}

      {/* 안내 */}
      <div style={{ padding: "16px 20px", borderRadius: 16, background: "#fffbeb", border: "1.5px solid #fde68a" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", margin: "0 0 4px" }}>💡 규칙 업데이트 안내</p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, lineHeight: 1.7 }}>
          학급회의에서 새로운 약속이 정해지면 선생님이 이 페이지에 추가할 거예요. 의견이 있으면 신문고에 남겨줘요!
        </p>
      </div>

    </div>
  );
}
