"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type Photo = { id: string; title: string; author: string; description: string | null; image_url: string; likes: number; created_at: string };
const tag = "길동사진컨테스트2026";
const voteKey = "gildong-photo-likes-2026";

export default function PhotoContest() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [liked, setLiked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [voting, setVoting] = useState<string[]>([]);
  const voteLock = useRef(new Set<string>());
  const [sort, setSort] = useState("new");
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState("");
  const [selected, setSelected] = useState<Photo | null>(null);
  const form = useRef<HTMLFormElement>(null);

  async function load() {
    const { data, error: issue } = await supabase.from("album_posts").select("*").contains("tags", [tag]).order("created_at", { ascending: false });
    if (issue) setError("사진을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    else setPhotos(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(voteKey) ?? "[]"); if (Array.isArray(saved)) setLiked(saved.filter((id) => typeof id === "string")); } catch { /* Storage can be unavailable. */ }
    void load();
    const timer = setInterval(() => { if (!document.hidden) void load(); }, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    const file = values.get("photo") as File;
    if (!file?.size || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("JPG, PNG, WebP 사진을 선택해 주세요."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("10MB 이하 사진을 선택해 주세요."); return; }
    setBusy(true); setError("");
    const path = `gildong-2026/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
    let uploaded = false;
    try {
      const result = await supabase.storage.from("uploads").upload(path, file);
      if (result.error) throw result.error;
      uploaded = true;
      const { error: issue } = await supabase.from("album_posts").insert({
        date: "2026-10-14", title: String(values.get("title")).trim(), author: String(values.get("author")).trim(),
        description: String(values.get("caption")).trim() || null,
        image_url: supabase.storage.from("uploads").getPublicUrl(path).data.publicUrl, tags: [tag], likes: 0,
      });
      if (issue) throw issue;
      form.current?.reset(); setPreview(""); setOpen(false); await load();
    } catch {
      if (uploaded) await supabase.storage.from("uploads").remove([path]);
      setError("사진 등록에 실패했어요. 사진과 연결 상태를 확인하고 다시 시도해 주세요.");
    } finally { setBusy(false); }
  }

  async function vote(photo: Photo) {
    if (voteLock.current.has(photo.id)) return;
    voteLock.current.add(photo.id); setVoting((ids) => [...ids, photo.id]); setError("");
    const already = liked.includes(photo.id);
    try {
      // Compare-and-swap preserves other students' simultaneous votes.
      for (let attempt = 0; attempt < 5; attempt++) {
        const current = await supabase.from("album_posts").select("likes").eq("id", photo.id).single();
        if (current.error) throw current.error;
        const count = current.data.likes ?? 0;
        const next = Math.max(0, count + (already ? -1 : 1));
        const update = await supabase.from("album_posts").update({ likes: next }).eq("id", photo.id).eq("likes", count).select("id");
        if (update.error) throw update.error;
        if (!update.data?.length) continue;
        setPhotos((items) => items.map((item) => item.id === photo.id ? { ...item, likes: next } : item));
        setLiked((ids) => { const changed = already ? ids.filter((id) => id !== photo.id) : [...ids, photo.id]; try { localStorage.setItem(voteKey, JSON.stringify(changed)); } catch { /* Keep the current session usable. */ } return changed; });
        return;
      }
      throw new Error("Vote contention");
    } catch { setError("좋아요를 저장하지 못했어요. 다시 눌러 주세요."); }
    finally { voteLock.current.delete(photo.id); setVoting((ids) => ids.filter((id) => id !== photo.id)); }
  }

  const ordered = [...photos].sort((a, b) => sort === "likes" ? b.likes - a.likes || b.created_at.localeCompare(a.created_at) : b.created_at.localeCompare(a.created_at));
  return (
    <section id="photo-contest" style={{ minWidth: 0, padding: "20px 0" }}>
      <p className="hy-section-label">PHOTO CONTEST</p>
      <h2 style={{ fontSize: 26, margin: "6px 0 10px" }}>길동에서 발견한 가을</h2>
      <p style={{ color: "var(--text-subtle)", lineHeight: 1.7 }}>가을빛, 작은 식물, 함께 웃는 순간. 사진 한 장과 제목을 올리고 서로 응원해요.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 16 }}>
        <button className="hy-btn hy-btn-primary" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "등록 닫기" : "사진 올리기"}</button>
        <label>정렬 <select aria-label="사진 정렬" value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: 10 }}><option value="new">최신순</option><option value="likes">좋아요순</option></select></label>
        <span style={{ fontSize: 13 }}>{photos.length}개 작품</span>
      </div>
      {error && <div role="alert" style={{ color: "#b42318", marginBottom: 12 }}>{error} <button className="hy-btn" onClick={() => { setError(""); void load(); }}>다시 불러오기</button></div>}
      {open && <form ref={form} onSubmit={submit} style={{ display: "grid", gap: 12, marginBottom: 22, maxWidth: 600 }}>
        <label>이름 또는 조 이름<input className="hy-input" name="author" required maxLength={30} style={{ width: "100%" }} /></label>
        <label>사진 제목<input className="hy-input" name="title" required maxLength={60} style={{ width: "100%" }} /></label>
        <label>한 줄 이야기<input className="hy-input" name="caption" maxLength={160} style={{ width: "100%" }} /></label>
        <label>사진 선택<input name="photo" type="file" required accept="image/jpeg,image/png,image/webp" onChange={(e) => setPreview(e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : "")} style={{ display: "block", maxWidth: "100%", marginTop: 8 }} /></label>
        {preview && <img src={preview} alt="등록할 사진 미리보기" style={{ width: "100%", maxHeight: 300, objectFit: "contain" }} />}
        <label><input type="checkbox" required /> 직접 찍은 사진이며, 등장하는 친구의 게시 동의를 받았어요.</label>
        <button className="hy-btn hy-btn-primary" disabled={busy}>{busy ? "사진 올리는 중…" : "작품 등록"}</button>
      </form>}
      {loading ? <p role="status">사진을 불러오는 중…</p> : photos.length === 0 ? <p style={{ padding: "30px 0", color: "var(--text-subtle)" }}>첫 번째 가을 사진을 기다리고 있어요.</p> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,240px),1fr))", gap: 16 }}>
        {ordered.map((photo) => <article key={photo.id} className="hy-card" style={{ overflow: "hidden", borderRadius: 8 }}>
          <button onClick={() => setSelected(photo)} aria-label={`${photo.title} 사진 크게 보기`} style={{ display: "block", width: "100%", padding: 0, border: 0, background: "#edf5f0", cursor: "pointer" }}><img src={photo.image_url} alt={photo.title} loading="lazy" style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "contain", display: "block" }} /></button>
          <div style={{ padding: 14, overflowWrap: "anywhere" }}><h3 style={{ margin: "0 0 6px", fontSize: 17 }}>{photo.title}</h3><p style={{ fontSize: 12 }}>{photo.author}</p>{photo.description && <p style={{ fontSize: 13 }}>{photo.description}</p>}
            <button className="hy-btn" aria-pressed={liked.includes(photo.id)} aria-label={`${photo.title} 좋아요${liked.includes(photo.id) ? " 취소" : ""}`} disabled={voting.includes(photo.id)} onClick={() => void vote(photo)} style={{ color: liked.includes(photo.id) ? "#c02650" : "var(--text)" }}>{liked.includes(photo.id) ? "♥" : "♡"} {photo.likes} 좋아요</button>
          </div>
        </article>)}
      </div>}
      <p style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 14 }}>좋아요는 이 브라우저에서 작품당 한 번, 다시 누르면 취소돼요.</p>
      {selected && <dialog open aria-label={selected.title} onKeyDown={(e) => { if (e.key === "Escape") setSelected(null); }} style={{ position: "fixed", inset: 0, width: "min(92vw,900px)", maxHeight: "90dvh", overflow: "auto", zIndex: 1000, borderRadius: 8, border: "1px solid #ccc", boxShadow: "0 0 0 100vmax rgba(0,0,0,.65)" }}><button autoFocus className="hy-btn" onClick={() => setSelected(null)}>닫기</button><h3>{selected.title}</h3><img src={selected.image_url} alt={selected.title} style={{ width: "100%", maxHeight: "70dvh", objectFit: "contain" }} /></dialog>}
    </section>
  );
}
