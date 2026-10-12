"use client";
import { useEffect, useState } from "react";
import PhotoUpload from "./PhotoUpload";
const missions = [
  { id: "detective", icon: "❧", title: "식물 관찰", text: "둘이 마음에 드는 식물 하나를 골라 이름과 특징을 살펴봐요. 식물 사진을 올려 다른 짝에게도 소개해요.", hint: "이름을 모르겠다면 잎의 모양·색·크기를 관찰해도 좋아요. 식물은 따지 않고 눈으로 살펴요.", prompt: "우리가 발견한 식물과 특징" },
  { id: "talk", icon: "☏", title: "짝 인터뷰", text: "각자 질문 두 개를 골라 서로 묻고 들어요. 짝에 대해 새롭게 알게 된 점을 한 문장씩 남겨요.", hint: "말하기 어려운 질문은 바꿔도 괜찮아요. 짝의 답을 끊지 않고 들어 주세요.", prompt: "짝에 대해 새롭게 알게 된 점 · 각자 한 문장" },
  { id: "poster", icon: "▣", title: "가을 사진", text: "함께 고른 가장 낭만적인 장면을 찍어요. 제목과 짧은 이야기를 붙여 모두의 사진전에 공유해요.", hint: "가을빛, 그림자, 나란한 신발도 좋아요. 친구가 등장하는 사진은 먼저 동의를 받아요.", prompt: "우리의 산책 한 줄 후기" },
];
const questions = ["요즘 너를 가장 웃게 하는 건 뭐야?", "이번 학기에 해 보고 싶은 일은?", "친구가 이렇게 해 주면 힘이 난다는 게 있어?", "오늘 본 풍경 중 가장 마음에 드는 건? 왜?"];
type Journal = { pair: string; notes: Record<string, string>; done: string[] };
const initial: Journal = { pair: "", notes: {}, done: [] };
export default function MissionTrail() {
  const [journal, setJournal] = useState<Journal>(initial);
  const [ready, setReady] = useState(false);
  const [opened, setOpened] = useState<string | null>(null);
  const [storageError, setStorageError] = useState(false);
  const [uploadingMission, setUploadingMission] = useState<string | null>(null);
  useEffect(() => { try { const data = JSON.parse(localStorage.getItem("gildong-walk-journal") ?? "null"); if (data && typeof data.pair === "string" && Array.isArray(data.done) && data.notes && typeof data.notes === "object") setJournal(data); } catch { /* Start with an empty journal. */ } setReady(true); }, []);
  function update(next: Journal) { setJournal(next); try { localStorage.setItem("gildong-walk-journal", JSON.stringify(next)); setStorageError(false); } catch { setStorageError(true); } }
  const completed = missions.filter(m => journal.done.includes(m.id)).length;
  function stamp(id: string) { setJournal(current => { const next = { ...current, done: [...new Set([...current.done, id])] }; try { localStorage.setItem("gildong-walk-journal", JSON.stringify(next)); } catch { setStorageError(true); } return next; }); }
  return <section id="missions" className="park-section"><div className="park-section-heading"><div><p className="park-eyebrow">ROMEO & JULIET / MISSION WALK</p><h2>함께 발견하는 미션 세 가지</h2></div><span className="park-note">순서도, 속도도 우리답게</span></div>
    <p className="park-description">식물 하나, 친구의 새로운 모습 하나, 함께 기억할 장면 하나. 미션 사이에는 천천히 걷고 쉬어요. 사진은 여기서 바로 공유할 수 있어요.</p>
    <div className="pair-pass"><label htmlFor="pair-name">우리 짝 이름 · 반 <small>선생님이 정해 주신 짝과 함께해요</small></label><input id="pair-name" maxLength={40} placeholder="예: 1반·2반 가을 탐험대" value={journal.pair} disabled={!ready} onChange={e => update({ ...journal, pair: e.target.value })} /><div className="pass-progress" aria-live="polite"><b>오늘의 발견 {completed}/3</b><span>사진을 공유하면 도장이 찍혀요</span></div><div className="stamp-row" aria-label="미션 도장 진행">{missions.map((m, index) => <span key={m.id} className={journal.done.includes(m.id) ? "stamped" : ""} title={m.title}>{journal.done.includes(m.id) ? "✓" : String(index + 1).padStart(2, "0")}</span>)}</div></div>
    <div className="trail-grid">{missions.map((mission, index) => { const done = journal.done.includes(mission.id); const expanded = opened === mission.id; return <article key={mission.id} className={`trail-card ${done ? "is-done" : ""}`}><button className="trail-open" aria-expanded={expanded} aria-controls={`mission-${mission.id}`} onClick={() => setOpened(expanded ? null : mission.id)}><div className="trail-topline"><span>MISSION {String(index + 1).padStart(2, "0")}</span><span>{done ? "✓ 발견 완료" : "함께하는 미션"}</span></div><div className="trail-icon" aria-hidden="true">{mission.icon}</div><h3>{mission.title}</h3><p>{mission.text}</p><span className="trail-more">{expanded ? "접어두기 −" : "미션 시작 · 사진 공유 +"}</span></button>{expanded && <div id={`mission-${mission.id}`} className="trail-detail"><p>{mission.hint}</p>
      {mission.id === "talk" && <div className="interview-questions"><b>각자 두 개씩 골라요</b><ul>{questions.map(q => <li key={q}>{q}</li>)}</ul><p>인터뷰 기록은 이 기기에만 남아요. 사진전에는 공개해도 괜찮은 사진과 한 줄만 공유해요.</p></div>}
      <label htmlFor={`note-${mission.id}`}>{mission.prompt}</label><textarea id={`note-${mission.id}`} rows={3} maxLength={600} value={journal.notes[mission.id] ?? ""} onChange={e => update({ ...journal, notes: { ...journal.notes, [mission.id]: e.target.value } })} placeholder="우리의 발견을 짧게 남겨요. 이 기록은 기기에 저장돼요." />
      <button className="park-primary" disabled={!ready} onClick={() => setUploadingMission(uploadingMission === mission.id ? null : mission.id)} aria-expanded={uploadingMission === mission.id}>{uploadingMission === mission.id ? "사진 등록 접기" : "미션 사진 공유하기 ↗"}</button>
      {uploadingMission === mission.id && <PhotoUpload mission={mission.title} pair={journal.pair} onSuccess={() => stamp(mission.id)} />}
      {mission.id === "talk" && <button className="hy-btn" disabled={!ready || (!done && !journal.notes[mission.id]?.trim())} onClick={() => update({ ...journal, done: done ? journal.done.filter(id => id !== mission.id) : [...journal.done, mission.id] })}>{done ? "인터뷰 완료 취소" : "사진 없이 인터뷰 완료하기"}</button>}
      <a href="#photo-contest">친구들의 미션 사진 보기 ↓</a>
    </div>}</article>; })}</div>
    {completed === 3 && <div className="walk-ticket" role="status"><span>OUR AUTUMN WALK / 2026.10.14</span><h3>{journal.pair || "우리 두 사람"}의 가을 산책 티켓</h3><p>함께 걷고, 발견하고, 서로의 이야기를 들었어요.<br />이제 친구들의 사진에 좋아요로 응원해 볼까요?</p><a className="park-primary" href="#photo-contest">모두의 사진전 보기 ↓</a></div>}
    <p className="journal-note">수첩과 도장은 이 기기에 저장돼요. 공유한 사진·제목·한 줄 이야기는 다른 반 친구들도 함께 볼 수 있어요.</p>{storageError && <p role="alert">기기 저장이 제한되어 있어요. 페이지를 닫기 전에 기록을 따로 남겨 주세요.</p>}
  </section>;
}
