"use client";
import { useRef, useState } from "react";

export default function PhotoDelete({ id, title, onDeleted }: { id: string; title: string; onDeleted: (cleanupPending: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function remove(event: React.FormEvent) {
    event.preventDefault(); if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/gildong-photos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, password }) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error ?? "삭제하지 못했어요.");
      setPassword(""); onDeleted(Boolean(result.cleanupPending));
    } catch (issue) { setError(issue instanceof Error ? issue.message : "연결 상태를 확인하고 다시 시도해 주세요."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <div className="photo-delete">
    {!open ? <button className="hy-btn" onClick={() => setOpen(true)}>교사 삭제</button> : <form onSubmit={remove}>
      <p><b>‘{title}’을 삭제할까요?</b><br />게시글과 댓글, 원본 사진·영상을 삭제합니다. 삭제 후 되돌릴 수 없어요.</p>
      <label>교사 비밀번호<input autoFocus type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="off" required maxLength={128} disabled={busy} /></label>
      <div><button className="hy-btn" type="button" disabled={busy} onClick={() => { setOpen(false); setPassword(""); setError(""); }}>취소</button><button className="hy-btn delete-confirm" disabled={busy}>{busy ? "삭제 중…" : "확인하고 삭제"}</button></div>
      {error && <p role="alert">{error}</p>}
    </form>}
  </div>;
}
