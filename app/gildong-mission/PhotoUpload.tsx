"use client";
import { useEffect, useRef, useState } from "react";
import { preparePhoto } from "./preparePhoto";
import { supabase } from "@/components/lib/supabaseClient";

export const photoTag = "길동사진컨테스트2026";
export const photoMissions = ["짝과 어울리는 식물", "짝꿍 사진", "가을 풍경", "점프샷", "컨셉 사진"];
export default function PhotoUpload({ mission = "가을 사진", pair = "", caption = "", allowMissionChoice = false, classNumber = "1", onSuccess }: { mission?: string; pair?: string; caption?: string; allowMissionChoice?: boolean; classNumber?: string; onSuccess?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [prepared, setPrepared] = useState<File | null>(null);
  const [step, setStep] = useState("");
  const selection = useRef(0);
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
    const file = prepared;
    const title = String(values.get("title") ?? "").trim();
    const selectedClass = String(values.get("classNumber") ?? "");
    if (!["1", "2"].includes(selectedClass)) { setError("사진을 올릴 반을 선택해 주세요."); return; }
    if (!author.trim() || !title) { setError("짝 이름과 사진 제목을 적어 주세요."); return; }
    if (!file?.size) { setError(preparing ? "사진을 준비하고 있어요. 잠시 후 눌러 주세요." : "사진을 선택해 주세요."); return; }
    if (!values.get("consent")) { setError("사진 속 친구에게 공유 동의를 받고 확인란을 체크해 주세요."); return; }
    lock.current = true; setBusy(true); setError(""); setSuccess(false);
    const path = `gildong-2026/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
    let uploaded = false;
    try {
      setStep("사진 업로드 중…");
      const upload = await supabase.storage.from("uploads").upload(path, file);
      if (upload.error) throw new Error("사진 저장 실패: " + upload.error.message);
      uploaded = true;
      const missionName = String(values.get("mission") ?? mission);
      setStep("게시글 저장 중…");
      const { error: issue } = await supabase.from("album_posts").insert({
        date: "2026-10-14", title, author: author.trim(), description: String(values.get("caption") ?? "").trim() || null,
        image_url: supabase.storage.from("uploads").getPublicUrl(path).data.publicUrl,
        tags: [photoTag, `길동미션:${missionName}`, `길동반:${selectedClass}`], likes: 0,
      });
      if (issue) throw new Error("게시글 저장 실패: " + issue.message);
      form.current?.reset(); setPreview(""); setPrepared(null); setSuccess(true);
      try { localStorage.setItem("gildong-photo-author", author.trim()); } catch { /* Optional prefill. */ }
      window.dispatchEvent(new Event("gildong-photos-updated"));
      onSuccess?.();
    } catch (issue) {
      if (uploaded) await supabase.storage.from("uploads").remove([path]);
      setError((issue instanceof Error ? issue.message : "사진을 공유하지 못했어요.") + " 입력한 내용은 그대로 있어요. 연결 상태를 확인하고 다시 눌러 주세요.");
    } finally { lock.current = false; setBusy(false); }
  }
  useEffect(() => { if (!pair) { try { setAuthor(localStorage.getItem("gildong-photo-author") ?? ""); } catch { /* Optional prefill. */ } } }, [pair]);
  return <div className="mission-upload">
    {success && <div className="upload-success" role="status"><b>✓ 우리의 가을 사진첩에 남겼어요!</b><a href="#photo-contest">친구들 사진 보러 가기 ↓</a></div>}
    <form ref={form} noValidate onSubmit={submit} style={{ display: "grid", gap: 12 }}>
      <fieldset disabled={busy} style={{ display: "grid", gap: 12, padding: 0, border: 0, margin: 0, minWidth: 0 }}>
        <label>사진을 올릴 반<select className="hy-input" name="classNumber" defaultValue={classNumber} required><option value="1">1반</option><option value="2">2반</option></select></label>
        <p className="walk-note">두 반이 함께 찍었다면 업로드하는 학생의 반을 선택해요. 짝의 반은 이름 옆에 적어요.</p>
        {allowMissionChoice ? <label>사진 종류<select className="hy-input" name="mission" defaultValue={mission} style={{ width: "100%" }}>{photoMissions.map(name => <option key={name}>{name}</option>)}</select></label> : <><span className="photo-mission-tag">{mission}</span><input type="hidden" name="mission" value={mission} /></>}
        <label>명찰 이름 · 두 사람 이름<input className="hy-input" name="author" required maxLength={40} value={author} onChange={e => setAuthor(e.target.value)} placeholder="예: 지킬·하이드 / 1반 김○○, 2반 이○○" style={{ width: "100%" }} /></label>
        <label>사진 제목<input className="hy-input" name="title" required maxLength={60} placeholder="예: 우리가 찾은 작은 가을" style={{ width: "100%" }} /></label>
        <label><span>사진 설명 <small>(선택)</small></span><input className="hy-input" name="caption" defaultValue={caption} maxLength={160} placeholder="이 식물이 짝과 어울리는 이유, 오늘 기억하고 싶은 순간…" style={{ width: "100%" }} /></label>
        <label className="photo-picker">사진 선택 · 아이폰 사진도 가능<input name="photo" type="file" required accept="image/*,.heic,.heif" onChange={async e => {
          const generation = ++selection.current; const picked = e.target.files?.[0]; setSuccess(false); setError(""); setPrepared(null); setPreview("");
          if (!picked) return; setPreparing(true);
          try { const normalized = await preparePhoto(picked); if (generation !== selection.current) return; setPrepared(normalized); setPreview(URL.createObjectURL(normalized)); }
          catch (issue) { if (generation === selection.current) setError(issue instanceof Error ? issue.message : "사진을 읽지 못했어요."); }
          finally { if (generation === selection.current) setPreparing(false); }
        }} style={{ display: "block", maxWidth: "100%", marginTop: 8 }} /></label>
        {preparing && <p role="status">사진을 준비하고 있어요…</p>}
        {prepared && <p className="walk-note">업로드 크기 {(prepared.size / 1024).toFixed(0)}KB · 사진은 자동으로 크기를 줄여 저장해요.</p>}
        {preview && <img src={preview} alt="공유할 사진 미리보기" style={{ width: "100%", maxHeight: 260, objectFit: "contain", borderRadius: 6 }} />}
        <label style={{ fontSize: 11, lineHeight: 1.8 }}><input name="consent" type="checkbox" required /> 직접 찍은 사진이고, 등장하는 친구에게 함께 보는 사진전에 올려도 되는지 물어봤어요.</label>
        <button className="hy-btn hy-btn-primary" type="submit" disabled={preparing}> {busy ? step : "사진 공유하기 ↗"}</button>
      </fieldset>
      {error && <p role="alert" style={{ color: "#b42318", fontSize: 12 }}>{error}</p>}
    </form>
  </div>;
}
