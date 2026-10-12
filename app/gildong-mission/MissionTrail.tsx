"use client";
import { useEffect, useState } from "react";
const missions = [
  { id: "palette", icon: "◒", title: "가을의 팔레트", category: "필수 · 관찰", text: "서로 다른 가을 색 3개를 찾아 사진에 담아요. 잎을 따지 않고 눈으로 찾아요.", hint: "초록만 있을까요? 빛, 줄기, 떨어진 잎도 살펴봐요.", prompt: "우리가 찾은 색 세 가지" },
  { id: "detective", icon: "⌕", title: "생태 탐정", category: "필수 · 발견", text: "식물 안내판에서 이름과 특징 하나를 찾아요. 짝에게 이름 대신 힌트를 주고 맞히게 해요.", hint: "안내판이 없으면 색·모양·잎의 특징으로 힌트를 만들어요.", prompt: "식물 이름 또는 특징 + 짝에게 준 힌트" },
  { id: "poster", icon: "▣", title: "우리 영화의 한 장면", category: "필수 · 사진전", text: "가을 풍경 속 영화 포스터 같은 사진을 찍어요. 제목을 붙여 아래 가을 사진전에 올려요.", hint: "얼굴 대신 뒷모습, 그림자, 나란한 신발도 멋진 장면이 돼요.", prompt: "우리 영화 제목" },
  { id: "plant", icon: "❧", title: "너를 닮은 식물", category: "선택 · 낭만", text: "짝을 닮은 식물을 찾아 이유를 말해 줘요. 잎의 모양, 분위기, 색을 떠올려 봐요.", hint: "“작아도 존재감 있는 너처럼!” 칭찬 한마디면 충분해요.", prompt: "짝을 닮은 식물과 그 이유" },
  { id: "sound", icon: "≈", title: "자연의 ASMR", category: "선택 · 휴식", text: "30초 동안 말을 멈추고 들어요. 각자 들은 소리 세 가지를 비교해요.", hint: "정답은 없어요. 바람, 발걸음, 멀리 들리는 소리까지.", prompt: "우리가 들은 소리" },
  { id: "talk", icon: "☏", title: "산책 인터뷰", category: "선택 · 대화", text: "“요즘 나를 웃게 하는 건?” 또는 “시험 끝나고 가장 하고 싶었던 일은?”을 서로 물어봐요.", hint: "대답을 끊지 않고 듣기. 말하기 싫은 질문은 바꿔도 좋아요.", prompt: "함께 기억하고 싶은 한 문장" },
  { id: "shorts", icon: "▷", title: "길동 예고편", category: "선택 · 숏츠", text: "풍경·발걸음·식물을 담아 15초 예고편을 만들어요. 아래 제작 안내를 참고해요.", hint: "나레이션 없이 사진 세 장과 자막만으로 만들어도 좋아요.", prompt: "예고편의 마지막 자막" },
];
type Journal = { pair: string; notes: Record<string, string>; done: string[] };
const initial: Journal = { pair: "", notes: {}, done: [] };
export default function MissionTrail() {
  const [journal, setJournal] = useState<Journal>(initial);
  const [ready, setReady] = useState(false);
  const [opened, setOpened] = useState<string | null>(null);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => { try { const data = JSON.parse(localStorage.getItem("gildong-walk-journal") ?? "null"); if (data && typeof data.pair === "string" && Array.isArray(data.done) && data.notes && typeof data.notes === "object") setJournal(data); } catch { /* Start with an empty journal. */ } setReady(true); }, []);
  function update(next: Journal) { setJournal(next); try { localStorage.setItem("gildong-walk-journal", JSON.stringify(next)); setStorageError(false); } catch { setStorageError(true); } }
  const essential = missions.slice(0, 3).filter(m => journal.done.includes(m.id)).length;
  const optional = missions.slice(3).filter(m => journal.done.includes(m.id)).length;
  const finished = essential === 3 && optional >= 2;
  return <section id="missions" className="park-section"><div className="park-section-heading"><div><p className="park-eyebrow">ROMEO & JULIET / MISSION WALK</p><h2>우리의 탐험 수첩</h2></div><span className="park-note">빨리 끝내지 않아도 괜찮아요</span></div>
    <p className="park-description">필수 미션 3개, 마음에 드는 선택 미션 2개. 순서는 자유예요. 카드 속 미션을 펼치고 둘만의 발견을 기록해요.</p>
    <div className="pair-pass"><label htmlFor="pair-name">우리 짝 이름 <small>정해진 짝과 별명을 지어도 좋아요</small></label><input id="pair-name" maxLength={40} placeholder="예: 1반·2반 가을 탐험대" value={journal.pair} disabled={!ready} onChange={e => update({ ...journal, pair: e.target.value })} /><div className="pass-progress" aria-live="polite"><b>필수 {essential}/3 · 선택 {Math.min(optional, 2)}/2</b><span>발견 도장 {journal.done.length}개</span></div><div className="stamp-row" aria-label="미션 도장 진행">{missions.map((m, index) => <span key={m.id} className={journal.done.includes(m.id) ? "stamped" : ""} title={m.title}>{journal.done.includes(m.id) ? "✓" : String(index + 1).padStart(2, "0")}</span>)}</div></div>
    <div className="trail-grid">{missions.map((mission, index) => { const done = journal.done.includes(mission.id); const expanded = opened === mission.id; return <article key={mission.id} className={`trail-card ${done ? "is-done" : ""}`}><button className="trail-open" aria-expanded={expanded} aria-controls={`mission-${mission.id}`} onClick={() => setOpened(expanded ? null : mission.id)}><div className="trail-topline"><span>MISSION {String(index + 1).padStart(2, "0")}</span><span>{done ? "✓ 발견 완료" : mission.category}</span></div><div className="trail-icon" aria-hidden="true">{mission.icon}</div><h3>{mission.title}</h3><p>{mission.text}</p><span className="trail-more">{expanded ? "접어두기 −" : "미션 펼치기 +"}</span></button>{expanded && <div id={`mission-${mission.id}`} className="trail-detail"><p>{mission.hint}</p><label htmlFor={`note-${mission.id}`}>{mission.prompt}</label><textarea id={`note-${mission.id}`} rows={3} maxLength={300} value={journal.notes[mission.id] ?? ""} onChange={e => update({ ...journal, notes: { ...journal.notes, [mission.id]: e.target.value } })} placeholder="둘이 발견한 내용을 짧게 남겨요." />{mission.id === "poster" && <a href="#photo-contest">사진전에서 작품 올리기 ↗</a>}<button className="park-primary" disabled={!ready || (!done && !journal.notes[mission.id]?.trim())} onClick={() => update({ ...journal, done: done ? journal.done.filter(id => id !== mission.id) : [...journal.done, mission.id] })}>{done ? "완료 도장 취소" : "발견 완료 · 도장 찍기"}</button></div>}</article>; })}</div>
    {finished && <div className="walk-ticket" role="status"><span>OUR AUTUMN WALK / 2026.10.14</span><h3>{journal.pair || "우리 두 사람"}의 가을 산책 티켓</h3><p>함께 걷고, 발견하고, 서로의 이야기를 들었어요.<br />오늘의 가을을 오래 기억해요.</p><b>✓ 미션 산책 완료</b></div>}
    <p className="journal-note">수첩과 도장은 이 기기에 저장돼요. 사진전에 올린 작품은 함께 볼 수 있어요.</p>{storageError && <p role="alert">기기 저장이 제한되어 있어요. 페이지를 닫기 전에 기록을 따로 남겨 주세요.</p>}
  </section>;
}
