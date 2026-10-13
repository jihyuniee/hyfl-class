"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";
const commentTag = "길동댓글2026";
type Comment = { id: string; author: string; description: string; created_at: string };
export default function PhotoComments({ photoId }: { photoId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState(""); const [message, setMessage] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(true); const lock = useRef(false);
  async function load() {
    const { data, error: issue } = await supabase.from("album_posts").select("id,author,description,created_at").contains("tags", [commentTag, `길동사진:${photoId}`]).order("created_at", { ascending: true });
    if (issue) setError("댓글을 불러오지 못했어요. 다시 시도해 주세요."); else { setComments(data ?? []); setError(""); } setLoading(false);
  }
  useEffect(() => { try { setName(localStorage.getItem("gildong-comment-name") ?? ""); } catch { /* Optional prefill. */ } void load(); const timer = setInterval(() => { if (!document.hidden) void load(); }, 15000); return () => clearInterval(timer); }, [photoId]); // eslint-disable-line react-hooks/exhaustive-deps
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (lock.current) return;
    if (!name.trim() || !message.trim()) { setError("이름과 댓글을 적어 주세요."); return; }
    lock.current = true; setBusy(true); setError("");
    try {
      // Separate tagged records preserve photo/comment separation without a schema change.
      const { error: issue } = await supabase.from("album_posts").insert({ date: "2026-10-14", title: "사진 댓글", author: name.trim(), description: message.trim(), image_url: "", likes: 0, tags: [commentTag, `길동사진:${photoId}`] });
      if (issue) throw issue; setMessage(""); try { localStorage.setItem("gildong-comment-name", name.trim()); } catch { /* Optional prefill. */ } await load();
    } catch { setError("댓글을 저장하지 못했어요. 입력한 내용은 유지돼요. 다시 눌러 주세요."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <section className="photo-comments" aria-label="사진 댓글"><h4>댓글 {comments.length}</h4>
    {loading ? <p role="status">댓글을 불러오는 중…</p> : comments.length === 0 ? <p className="walk-note">멋진 장면에 첫 응원을 남겨 주세요.</p> : <ul>{comments.map(c => <li key={c.id}><b>{c.author}</b><p>{c.description}</p></li>)}</ul>}
    <form onSubmit={submit}><label>이름 · 반<input required maxLength={40} value={name} onChange={e=>setName(e.target.value)} placeholder="예: 1반 김○○" /></label><label>응원 댓글<textarea required maxLength={300} rows={2} value={message} onChange={e=>setMessage(e.target.value)} placeholder="좋았던 장면이나 재미있었던 점을 남겨 주세요." /></label><button className="hy-btn hy-btn-primary" disabled={busy}>{busy ? "저장 중…" : "댓글 남기기"}</button></form>
    {error && <p role="alert">{error}</p>}
  </section>;
}
