"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";
import PhotoUpload, { photoTag, photoMissions } from "./PhotoUpload";

type Photo = { id: string; title: string; author: string; description: string | null; image_url: string; likes: number; created_at: string; tags: string[] };
const tag = photoTag;
const voteKey = "gildong-photo-likes-2026";

export default function PhotoContest() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [liked, setLiked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [voting, setVoting] = useState<string[]>([]);
  const voteLock = useRef(new Set<string>());
  const [sort, setSort] = useState("new");
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("전체");
  const [selected, setSelected] = useState<Photo | null>(null);

  async function load() {
    const { data, error: issue } = await supabase.from("album_posts").select("*").contains("tags", [tag]).order("created_at", { ascending: false });
    if (issue) setError("사진을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    else setPhotos(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem(voteKey) ?? "[]"); if (Array.isArray(saved)) setLiked(saved.filter((id) => typeof id === "string")); } catch { /* Storage can be unavailable. */ }
    void load();
    const refresh = () => { void load(); };
    window.addEventListener("gildong-photos-updated", refresh);
    const timer = setInterval(() => { if (!document.hidden) void load(); }, 15000);
    return () => { clearInterval(timer); window.removeEventListener("gildong-photos-updated", refresh); };
  }, []);

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

  const ordered = photos.filter(photo => filter === "전체" || photo.tags?.includes(`길동미션:${filter}`) || (filter === "가을 사진" && !photo.tags?.some(t => t.startsWith("길동미션:")))).sort((a, b) => sort === "likes" ? b.likes - a.likes || b.created_at.localeCompare(a.created_at) : b.created_at.localeCompare(a.created_at));
  return (
    <section id="photo-contest" style={{ minWidth: 0, padding: "20px 0" }}>
      <p className="hy-section-label">OUR SHARED MOMENTS</p>
      <h2 style={{ fontSize: 26, margin: "6px 0 10px" }}>모두의 미션 사진전</h2>
      <p style={{ color: "var(--text-subtle)", lineHeight: 1.7 }}>미션에서 올린 사진이 여기에 모여요. 다른 반 친구들의 발견도 보고, 마음에 드는 순간에 좋아요를 눌러요.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 16 }}>
        <button className="hy-btn hy-btn-primary" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "등록 닫기" : "사진 올리기"}</button>
        <label>정렬 <select aria-label="사진 정렬" value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: 10 }}><option value="new">최신순</option><option value="likes">좋아요순</option></select></label>
        <span style={{ fontSize: 13 }}>{photos.length}개 작품</span>
      </div>
      {error && <div role="alert" style={{ color: "#b42318", marginBottom: 12 }}>{error} <button className="hy-btn" onClick={() => { setError(""); void load(); }}>다시 불러오기</button></div>}
      {open && <div style={{ maxWidth: 600, marginBottom: 22 }}><PhotoUpload allowMissionChoice /></div>}
      <div className="photo-filters" role="group" aria-label="미션 사진 필터">{["전체", ...photoMissions].map(name => <button key={name} className="hy-btn" aria-pressed={filter === name} onClick={() => setFilter(name)}>{name}</button>)}</div>
      {loading ? <p role="status">사진을 불러오는 중…</p> : ordered.length === 0 ? <p style={{ padding: "30px 0", color: "var(--text-subtle)" }}>아직 공유된 사진이 없어요. 미션을 펼쳐 첫 발견을 올려 주세요.</p> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,240px),1fr))", gap: 16 }}>
        {ordered.map((photo) => <article key={photo.id} className="hy-card" style={{ overflow: "hidden", borderRadius: 8 }}>
          <button onClick={() => setSelected(photo)} aria-label={`${photo.title} 사진 크게 보기`} style={{ display: "block", width: "100%", padding: 0, border: 0, background: "#edf5f0", cursor: "pointer" }}><img src={photo.image_url} alt={photo.title} loading="lazy" style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "contain", display: "block" }} /></button>
          <div style={{ padding: 14, overflowWrap: "anywhere" }}><span className="photo-mission-tag">{photo.tags?.find(t => t.startsWith("길동미션:"))?.replace("길동미션:", "") ?? "가을 사진"}</span><h3 style={{ margin: "0 0 6px", fontSize: 17 }}>{photo.title}</h3><p style={{ fontSize: 12 }}>{photo.author}</p>{photo.description && <p style={{ fontSize: 13 }}>{photo.description}</p>}
            <button className="hy-btn" aria-pressed={liked.includes(photo.id)} aria-label={`${photo.title} 좋아요${liked.includes(photo.id) ? " 취소" : ""}`} disabled={voting.includes(photo.id)} onClick={() => void vote(photo)} style={{ color: liked.includes(photo.id) ? "#c02650" : "var(--text)" }}>{liked.includes(photo.id) ? "♥" : "♡"} {photo.likes} 좋아요</button>
          </div>
        </article>)}
      </div>}
      <p style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 14 }}>좋아요는 이 브라우저에서 작품당 한 번, 다시 누르면 취소돼요.</p>
      {selected && <dialog open aria-label={selected.title} onKeyDown={(e) => { if (e.key === "Escape") setSelected(null); }} style={{ position: "fixed", inset: 0, width: "min(92vw,900px)", maxHeight: "90dvh", overflow: "auto", zIndex: 1000, borderRadius: 8, border: "1px solid #ccc", boxShadow: "0 0 0 100vmax rgba(0,0,0,.65)" }}><button autoFocus className="hy-btn" onClick={() => setSelected(null)}>닫기</button><h3>{selected.title}</h3><img src={selected.image_url} alt={selected.title} style={{ width: "100%", maxHeight: "70dvh", objectFit: "contain" }} /></dialog>}
    </section>
  );
}
