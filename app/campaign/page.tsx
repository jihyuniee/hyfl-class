"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type PledgeRow = {
  id: string;
  created_at: string;
  student_no: string;
  name: string;
  position: string;
  title: string;
  pledges: string;
  is_public: boolean;
};

export default function CampaignPage() {
  const [list, setList] = useState<PledgeRow[]>([]);

  async function load() {
    const { data } = await supabase
      .from("campaign_pledges")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });
    setList((data as PledgeRow[]) ?? []);
  }

  useEffect(() => { load(); }, []);

  const byPosition: Record<string, PledgeRow[]> = {};
  list.forEach(p => {
    if (!byPosition[p.position]) byPosition[p.position] = [];
    byPosition[p.position].push(p);
  });

  const positionOrder = ["회장", "부회장A", "부회장B"];
  const positionLabel: Record<string, string> = {
    "회장": "🏅 회장",
    "부회장A": "🥈 부회장 A",
    "부회장B": "🥈 부회장 B",
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      <div className="hy-hero">
        <div style={{ display:"inline-flex", alignItems:"center", background:"rgba(255,255,255,0.2)", backdropFilter:"blur(8px)", borderRadius:999, padding:"4px 14px", marginBottom:12, border:"1px solid rgba(255,255,255,0.3)" }}>
          <span style={{ fontSize:12, color:"#fff", fontWeight:700 }}>✅ 선거 완료</span>
        </div>
        <h1 style={{ color:"#fff", fontSize:"clamp(22px,4vw,32px)", fontWeight:900, margin:"0 0 8px" }}>
          🌷 회장/부회장 공약
        </h1>
        <p style={{ color:"rgba(255,255,255,0.85)", fontSize:13, margin:0, fontWeight:500, lineHeight:1.7 }}>
          선거에서 약속한 공약들이에요.<br/>잘 이행되고 있는지 함께 지켜봐요 🙂
        </p>
      </div>

      {list.length === 0 ? (
        <div className="hy-card" style={{ padding:"40px", textAlign:"center" }}>
          <p style={{ fontSize:15, color:"var(--text-subtle)", fontWeight:600 }}>등록된 공약이 없어요</p>
        </div>
      ) : (
        positionOrder.filter(pos => byPosition[pos]?.length > 0).map(pos => (
          <div key={pos}>
            <p style={{ fontSize:14, fontWeight:900, color:"var(--text-muted)", margin:"0 0 10px" }}>
              {positionLabel[pos] ?? pos}
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {byPosition[pos].map(p => (
                <div key={p.id} className="hy-card" style={{ padding:"22px 24px" }}>
                  <div style={{ marginBottom:14 }}>
                    <p style={{ fontSize:16, fontWeight:900, color:"var(--text)", margin:"0 0 4px" }}>
                      {p.title}
                    </p>
                    <p style={{ fontSize:12, color:"var(--primary)", fontWeight:700, margin:0 }}>
                      {p.name} ({p.student_no})
                    </p>
                  </div>
                  <div style={{ background:"#f9fafb", borderRadius:14, padding:"14px 18px" }}>
                    <p style={{ fontSize:13, color:"var(--text)", lineHeight:1.9, margin:0, whiteSpace:"pre-wrap" }}>
                      {p.pledges}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
