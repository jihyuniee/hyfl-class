"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

export const photoTag = "길동사진컨테스트2026";
export const photoMissions = ["식물 관찰", "짝 인터뷰", "가을 사진", "자유 발견"];
export default function PhotoUpload({ mission = "가을 사진", pair = "", caption = "", allowMissionChoice = false, onSuccess }: { mission?: string; pair?: string; caption?: string; allowMissionChoice?: boolean; onSuccess?: () => void }) {
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("");
  const [success, setSuccess] = useState(false);
  const [author, setAuthor] = useState(pair);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { setAuthor(pair); }, [pair]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const values = new FormData(event.currentTarget);
    const file = values.get("photo") as File;
    const title = String(values.get("title") ?? "").trim();
    if (!author.trim() || !title) { setError("짝 이름과 사진 제목을 적어 주세요."); return; }
    if (!file?.size || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("JPG, PNG, WebP 사진을 선택해 주세요. HEIC 사진은 JPG로 바꿔 주세요."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("10MB 이하 사진을 선택해 주세요."); return; }
    lock.current = true; setBusy(true); setError(""); setSuccess(false);
    const path = `gildong-2026/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
    let uploaded = false;
    try {
      const upload = await supabase.storage.from("uploads").upload(path, file);
      if (upload.error) throw upload.error;
      uploaded = true;
      const missionName = String(values.get("mission") ?? mission);
      const { error: issue } = await supabase.from("album_posts").insert({
        date: "2026-10-14", title, author: author.trim(), description: String(values.get("caption") ?? "").trim() || null,
        image_url: supabase.storage.from("uploads").getPublicUrl(path).data.publicUrl,
        tags: [photoTag, `길동미션:${missionName}`], likes: 0,
      });
      if (issue) throw issue;
      form.current?.reset(); setPreview(""); setSuccess(true);
      try { localStorage.setItem("gildong-photo-author", author.trim()); } catch { /* Optional prefill. */ }
      window.dispatchEvent(new Event("gildong-photos-updated"));
      onSuccess?.();
    } catch {
      if (uploaded) await supabase.storage.from("uploads").remove([path]);
      setError("사진을 공유하지 못했어요. 연결 상태를 확인하고 다시 눌러 주세요. 입력한 내용은 그대로 있어요.");
    } finally { lock.current = false; setBusy(false); }
  }
  useEffect(() => { if (!pair) { try { setAuthor(localStorage.getItem("gildong-photo-author") ?? ""); } catch { /* Optional prefill. */ } } }, [pair]);
  return <div className="mission-upload">
    {success && <div className="upload-success" role="status"><b>✓ 모두의 사진전에 공유했어요!</b><a href="#photo-contest">친구들 사진과 좋아요 보러 가기 ↓</a></div>}
    <form ref={form} onSubmit={submit} style={{ display: "grid", gap: 12 }}>
      <fieldset disabled={busy} style={{ display: "grid", gap: 12, padding: 0, border: 0, margin: 0, minWidth: 0 }}>
        {allowMissionChoice ? <label>미션<select className="hy-input" name="mission" defaultValue={mission} style={{ width: "100%" }}>{photoMissions.map(name => <option key={name}>{name}</option>)}</select></label> : <><span className="photo-mission-tag">{mission}</span><input type="hidden" name="mission" value={mission} /></>}
        <label>짝 이름 · 반<input className="hy-input" name="author" required maxLength={40} value={author} onChange={e => setAuthor(e.target.value)} placeholder="예: 1반·2반 가을 탐험대" style={{ width: "100%" }} /></label>
        <label>사진 제목<input className="hy-input" name="title" required maxLength={60} placeholder="예: 우리가 찾은 작은 가을" style={{ width: "100%" }} /></label>
        <label>공유할 한 줄 이야기 <small>(선택)</small><input className="hy-input" name="caption" defaultValue={caption} maxLength={160} placeholder="친구들에게 보여 주고 싶은 이야기만 적어요." style={{ width: "100%" }} /></label>
        <label className="photo-picker">사진 선택 · 10MB 이하<input name="photo" type="file" required accept="image/jpeg,image/png,image/webp" onChange={e => { setSuccess(false); setError(""); setPreview(e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : ""); }} style={{ display: "block", maxWidth: "100%", marginTop: 8 }} /></label>
        {preview && <img src={preview} alt="공유할 사진 미리보기" style={{ width: "100%", maxHeight: 260, objectFit: "contain", borderRadius: 6 }} />}
        <label style={{ fontSize: 11, lineHeight: 1.8 }}><input type="checkbox" required /> 직접 찍은 사진이고, 등장하는 친구에게 함께 보는 사진전에 올려도 되는지 물어봤어요.</label>
        <button className="hy-btn hy-btn-primary" type="submit">{busy ? "사진 공유 중…" : "사진 공유하기 ↗"}</button>
      </fieldset>
      {error && <p role="alert" style={{ color: "#b42318", fontSize: 12 }}>{error}</p>}
    </form>
  </div>;
}
