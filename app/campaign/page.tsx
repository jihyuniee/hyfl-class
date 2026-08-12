"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";
import SemesterTabs from "@/components/SemesterTabs";
import { CURRENT_SEMESTER, type SemesterId } from "@/components/lib/semester";

type PledgeRow = {
  id: string;
  created_at: string;
  student_no: string;
  name: string;
  position: string;
  title: string;
  pledges: string;
  is_public: boolean;
  semester: string;
  password: string | null;
};

const POSITION_ORDER = ["회장", "부회장A", "부회장B"];
const POSITION_LABEL: Record<string, string> = {
  "회장": "🏅 회장",
  "부회장A": "🥈 부회장 A",
  "부회장B": "🥈 부회장 B",
};

export default function CampaignPage() {
  const [semester, setSemester] = useState<SemesterId>(CURRENT_SEMESTER);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="hy-hero">
        <div style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", borderRadius: 999, padding: "4px 14px", marginBottom: 12, border: "1px solid rgba(255,255,255,0.3)" }}>
          <span style={{ fontSize: 12, color: "#fff", fontWeight: 700 }}>
            {semester === CURRENT_SEMESTER ? "🗳️ 2학기 공약 등록" : "✅ 선거 완료"}
          </span>
        </div>
        <h1 style={{ color: "#fff", fontSize: "clamp(22px,4vw,32px)", fontWeight: 900, margin: "0 0 8px" }}>
          🌷 회장/부회장 공약
        </h1>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, margin: 0, fontWeight: 500, lineHeight: 1.7 }}>
          {semester === CURRENT_SEMESTER
            ? "2학기 후보의 공약을 직접 등록하고 함께 확인해요."
            : "선거에서 약속한 공약들이에요. 잘 이행되고 있는지 함께 지켜봐요 🙂"}
        </p>
        <div style={{ marginTop: 16 }}>
          <SemesterTabs value={semester} onChange={setSemester} />
        </div>
      </div>

      {semester === CURRENT_SEMESTER && <PledgeForm />}

      <PledgeList semester={semester} />
    </div>
  );
}

function PledgeForm() {
  const [studentNo, setStudentNo] = useState("");
  const [name, setName] = useState("");
  const [position, setPosition] = useState("회장");
  const [title, setTitle] = useState("");
  const [pledges, setPledges] = useState("");
  const [password, setPassword] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function submit() {
    setMessage(null);
    if (!studentNo.trim() || !name.trim()) {
      setMessage({ type: "error", text: "학번과 이름을 입력해줘요." });
      return;
    }
    if (!title.trim()) {
      setMessage({ type: "error", text: "공약 제목을 입력해줘요." });
      return;
    }
    if (!pledges.trim()) {
      setMessage({ type: "error", text: "공약 내용을 입력해줘요." });
      return;
    }
    if (!password.trim()) {
      setMessage({ type: "error", text: "수정·삭제할 때 필요한 비밀번호를 입력해줘요." });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("campaign_pledges").insert({
      student_no: studentNo.trim(),
      name: name.trim(),
      position,
      title: title.trim(),
      pledges: pledges.trim(),
      is_public: isPublic,
      semester: CURRENT_SEMESTER,
      password: password.trim(),
    });
    setSubmitting(false);
    if (error) {
      setMessage({ type: "error", text: "등록에 실패했어요: " + error.message });
      return;
    }
    setMessage({ type: "success", text: "공약을 등록했어요! 목록에서 확인해봐요 🎉" });
    setTitle(""); setPledges(""); setPassword("");
    window.dispatchEvent(new CustomEvent("campaign-pledge-created"));
  }

  return (
    <div className="hy-card" style={{ padding: "22px 24px" }}>
      <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", margin: "0 0 4px" }}>
        2학기 공약 등록 📝
      </h3>
      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 16px" }}>
        학번/이름/직책/제목/내용을 입력하면 아래 목록에 바로 반영돼요. 비밀번호는 나중에 수정·삭제할 때 필요하니 꼭 기억해두세요!
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <input placeholder="학번 *" value={studentNo} onChange={e => setStudentNo(e.target.value)} className="hy-input" style={{ maxWidth: 140 }} />
        <input placeholder="이름 *" value={name} onChange={e => setName(e.target.value)} className="hy-input" style={{ maxWidth: 140 }} />
        <select
          value={position}
          onChange={e => setPosition(e.target.value)}
          className="hy-input"
          style={{ maxWidth: 160 }}
        >
          <option value="회장">회장</option>
          <option value="부회장A">부회장 A</option>
          <option value="부회장B">부회장 B</option>
        </select>
      </div>
      <input
        placeholder="공약 제목 *"
        value={title}
        onChange={e => setTitle(e.target.value)}
        className="hy-input"
        style={{ marginBottom: 10 }}
      />
      <textarea
        placeholder="공약 내용 * (여러 줄로 자유롭게 작성해요)"
        value={pledges}
        onChange={e => setPledges(e.target.value)}
        className="hy-input"
        rows={4}
        style={{ width: "100%", resize: "vertical", marginBottom: 10 }}
      />
      <input
        type="password"
        placeholder="관리용 비밀번호 * (수정·삭제 시 필요, 꼭 기억해두세요!)"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="hy-input"
        style={{ maxWidth: 320, marginBottom: 10 }}
      />
      <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", fontWeight: 600, marginBottom: 14 }}>
        <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
        공개 (반 전체에게 바로 공개돼요)
      </label>
      <div>
        <button onClick={submit} disabled={submitting} className="hy-btn hy-btn-primary" style={{ fontSize: 13 }}>
          {submitting ? "등록 중..." : "공약 등록하기 🌷"}
        </button>
      </div>
      {message && (
        <p role="status" style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: message.type === "success" ? "#22c55e" : "#ef4444" }}>
          {message.type === "success" ? "✅ " : "⚠️ "}{message.text}
        </p>
      )}
    </div>
  );
}

function PledgeList({ semester }: { semester: SemesterId }) {
  const [list, setList] = useState<PledgeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [managePw, setManagePw] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPledges, setEditPledges] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("campaign_pledges")
      .select("*")
      .eq("semester", semester)
      .eq("is_public", true)
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setList((data as PledgeRow[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semester]);

  useEffect(() => {
    const handler = () => load();
    window.addEventListener("campaign-pledge-created", handler);
    return () => window.removeEventListener("campaign-pledge-created", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semester]);

  const byPosition = useMemo(() => {
    const map: Record<string, PledgeRow[]> = {};
    list.forEach(p => {
      if (!map[p.position]) map[p.position] = [];
      map[p.position].push(p);
    });
    return map;
  }, [list]);

  const isMine = (p: PledgeRow) =>
    semester === CURRENT_SEMESTER &&
    managePw.trim().length > 0 &&
    p.password === managePw.trim();

  function startEdit(p: PledgeRow) {
    setEditingId(p.id);
    setEditTitle(p.title);
    setEditPledges(p.pledges);
  }

  async function saveEdit(p: PledgeRow) {
    if (!editTitle.trim() || !editPledges.trim()) {
      setActionMessage("제목과 내용을 모두 입력해줘요.");
      return;
    }
    const { data, error } = await supabase
      .from("campaign_pledges")
      .update({ title: editTitle.trim(), pledges: editPledges.trim() })
      .eq("id", p.id)
      .eq("password", managePw.trim())
      .select("id");
    if (error) {
      setActionMessage("수정에 실패했어요: " + error.message);
      return;
    }
    if (!data || data.length === 0) {
      setActionMessage("비밀번호가 맞지 않아 수정하지 못했어요.");
      return;
    }
    setActionMessage("공약을 수정했어요 ✅");
    setEditingId(null);
    await load();
  }

  async function remove(p: PledgeRow) {
    if (!confirm(`"${p.title}" 공약을 삭제할까요?`)) return;
    const { data, error } = await supabase
      .from("campaign_pledges")
      .delete()
      .eq("id", p.id)
      .eq("password", managePw.trim())
      .select("id");
    if (error) {
      setActionMessage("삭제에 실패했어요: " + error.message);
      return;
    }
    if (!data || data.length === 0) {
      setActionMessage("비밀번호가 맞지 않거나 이미 삭제된 공약이에요.");
      return;
    }
    setActionMessage("공약을 삭제했어요.");
    await load();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {semester === CURRENT_SEMESTER && (
        <div className="hy-soft" style={{ padding: "14px 18px" }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", margin: "0 0 8px" }}>
            내가 등록한 공약 수정·삭제하기
          </p>
          <p style={{ fontSize: 12, color: "var(--text-subtle)", margin: "0 0 10px" }}>
            등록할 때 입력한 비밀번호를 넣으면, 그 비밀번호로 작성한 내 공약에 수정·삭제 버튼이 나타나요.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="password"
              placeholder="공약 등록 시 입력한 비밀번호"
              value={managePw}
              onChange={e => setManagePw(e.target.value)}
              className="hy-input"
              style={{ maxWidth: 240 }}
            />
          </div>
          {actionMessage && (
            <p role="status" style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: "var(--primary)" }}>{actionMessage}</p>
          )}
        </div>
      )}

      {loading ? (
        <div className="hy-card" style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ fontSize: 15, color: "var(--text-subtle)", fontWeight: 600 }}>불러오는 중... ⏳</p>
        </div>
      ) : error ? (
        <div className="hy-card" style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ fontSize: 15, color: "#ef4444", fontWeight: 600 }}>오류가 발생했어요: {error}</p>
        </div>
      ) : list.length === 0 ? (
        <div className="hy-card" style={{ padding: "40px", textAlign: "center" }}>
          <p style={{ fontSize: 15, color: "var(--text-subtle)", fontWeight: 600 }}>
            {semester === CURRENT_SEMESTER ? "아직 등록된 2학기 공약이 없어요. 위에서 가장 먼저 등록해봐요!" : "등록된 공약이 없어요"}
          </p>
        </div>
      ) : (
        POSITION_ORDER.filter(pos => byPosition[pos]?.length > 0).map(pos => (
          <div key={pos}>
            <p style={{ fontSize: 14, fontWeight: 900, color: "var(--text-muted)", margin: "0 0 10px" }}>
              {POSITION_LABEL[pos] ?? pos}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {byPosition[pos].map(p => (
                <div key={p.id} className="hy-card" style={{ padding: "22px 24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                    <div>
                      {editingId === p.id ? (
                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="hy-input" style={{ marginBottom: 6 }} />
                      ) : (
                        <p style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", margin: "0 0 4px" }}>{p.title}</p>
                      )}
                      <p style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700, margin: 0 }}>
                        {p.name} ({p.student_no})
                      </p>
                    </div>
                    {isMine(p) && (
                      <div style={{ display: "flex", gap: 6 }}>
                        {editingId === p.id ? (
                          <>
                            <button onClick={() => saveEdit(p)} className="hy-btn hy-btn-primary" style={{ fontSize: 12, padding: "6px 14px" }}>저장</button>
                            <button onClick={() => setEditingId(null)} className="hy-btn" style={{ fontSize: 12, padding: "6px 14px" }}>취소</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(p)} className="hy-btn" style={{ fontSize: 12, padding: "6px 14px" }}>수정</button>
                            <button onClick={() => remove(p)} className="hy-btn" style={{ fontSize: 12, padding: "6px 14px", color: "#ef4444", borderColor: "#fecaca" }}>삭제</button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ background: "#f9fafb", borderRadius: 14, padding: "14px 18px" }}>
                    {editingId === p.id ? (
                      <textarea value={editPledges} onChange={e => setEditPledges(e.target.value)} className="hy-input" rows={4} style={{ width: "100%", resize: "vertical" }} />
                    ) : (
                      <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.9, margin: 0, whiteSpace: "pre-wrap" }}>
                        {p.pledges}
                      </p>
                    )}
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
