"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type IntroPost = {
  id: string;
  created_at: string;
  author_name: string;
  title: string | null;
  content: string;
  is_public: boolean;
  image_urls: string[];
};

type IntroForm = {
  name: string;
  mbti: string;
  likeBehaviors: string;
  dislikeBehaviors: string;
  thisYearGoal: string;
  message: string;
  isPublic: boolean;
};

function formatKST(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

function safeParseIntro(content: string): IntroForm | null {
  try {
    const obj = JSON.parse(content);
    if (!obj || typeof obj !== "object") return null;
    return {
      name: String(obj.name ?? ""),
      mbti: String(obj.mbti ?? ""),
      likeBehaviors: String(obj.likeBehaviors ?? ""),
      dislikeBehaviors: String(obj.dislikeBehaviors ?? ""),
      thisYearGoal: String(obj.thisYearGoal ?? ""),
      message: String(obj.message ?? ""),
      isPublic: Boolean(obj.isPublic ?? true),
    };
  } catch {
    return null;
  }
}

export default function WallIntroPage() {
  const [list, setList] = useState<IntroPost[]>([]);

  async function load() {
    const { data } = await supabase
      .from("wall_posts")
      .select("*")
      .order("created_at", { ascending: false });
    setList((data as IntroPost[]) ?? []);
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* 헤더 */}
      <div className="hy-hero">
        <div style={{ position:"relative" }}>
          <div style={{ display:"inline-flex", alignItems:"center", background:"rgba(255,255,255,0.2)", backdropFilter:"blur(8px)", borderRadius:999, padding:"4px 14px", marginBottom:12, border:"1px solid rgba(255,255,255,0.3)" }}>
            <span style={{ fontSize:12, color:"#fff", fontWeight:700 }}>2026 한영외고 2-2</span>
          </div>
          <h1 style={{ color:"#fff", fontSize:"clamp(22px,4vw,32px)", fontWeight:900, margin:"0 0 8px", letterSpacing:"-0.5px" }}>
            🌸 자기소개 담벼락
          </h1>
          <p style={{ color:"rgba(255,255,255,0.85)", fontSize:13, margin:0, fontWeight:500, lineHeight:1.7 }}>
            서로를 편하게 알아가기 위한 공간이야 🙂
          </p>
        </div>
      </div>

      {/* 목록 */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <p style={{ fontSize:13, fontWeight:700, color:"var(--text-muted)", margin:0 }}>
          소개 {list.length}개
        </p>
        <button className="hy-btn" style={{ fontSize:12 }} onClick={load}>새로고침</button>
      </div>

      {list.length === 0 ? (
        <div className="hy-card" style={{ padding:"40px", textAlign:"center" }}>
          <p style={{ fontSize:15, color:"var(--text-subtle)", fontWeight:600 }}>아직 소개가 없어요 🌱</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {list.map(p => {
            const intro = safeParseIntro(p.content);
            const titleText = intro?.name ? `${intro.name}의 자기소개` : p.title ?? "자기소개";
            return (
              <div key={p.id} className="hy-card" style={{ padding:"22px 24px" }}>
                <div style={{ marginBottom:14 }}>
                  <p style={{ fontSize:15, fontWeight:900, color:"var(--text)", margin:"0 0 4px" }}>{titleText}</p>
                  <p style={{ fontSize:12, color:"var(--text-subtle)", margin:0, fontWeight:500 }}>
                    {p.author_name} · {formatKST(p.created_at)}
                  </p>
                </div>

                {intro ? (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {[
                      { label:"🧬 MBTI",             value: intro.mbti },
                      { label:"😊 좋아하는 행동/분위기", value: intro.likeBehaviors },
                      { label:"😤 싫어하는 행동",       value: intro.dislikeBehaviors },
                      { label:"🎯 올해 이루고 싶은 것",  value: intro.thisYearGoal },
                      { label:"💬 하고 싶은 말",        value: intro.message },
                    ].filter(f => f.value?.trim()).map(f => (
                      <div key={f.label} style={{ background:"#f9fafb", borderRadius:12, padding:"12px 14px" }}>
                        <p style={{ fontSize:11, fontWeight:800, color:"var(--text-subtle)", margin:"0 0 4px", textTransform:"uppercase", letterSpacing:"0.04em" }}>{f.label}</p>
                        <p style={{ fontSize:13, color:"var(--text)", margin:0, whiteSpace:"pre-wrap", lineHeight:1.7 }}>{f.value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize:13, color:"var(--text)", whiteSpace:"pre-wrap", lineHeight:1.7, margin:0 }}>{p.content}</p>
                )}

                {p.image_urls?.length > 0 && (
                  <div style={{ marginTop:14, display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))", gap:8 }}>
                    {p.image_urls.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt="첨부 이미지"
                          style={{ width:"100%", height:100, objectFit:"cover", borderRadius:12, display:"block" }}/>
                      </a>
                    ))}
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
