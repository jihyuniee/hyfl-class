"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type Student = { student_no: string; name: string };
type Submission = {
  id: string; created_at: string;
  payload: {
    studentNo: string; name: string;
    parentContact: string; preferredContactMethod: string; preferredContactDetail: string;
    mbti: string; closeFriends: string; firstImpression: string; wantClassActivity: string;
    likeSubject: string; likeReason: string; dislikeSubject: string; dislikeReason: string;
    hobby: string; presentationStyle: string; learningHelpStyle: string;
    parentsStyle: string; parentsMeaning: string; talkWith: string;
    strengths: string; weaknesses: string; adjectives: string; wantToBe: string;
    dream: string; habitToFix: string; messageToTeacher: string; teacherShouldKnow: string;
  };
};
type WallPost = { id: string; author_name: string; content: string; created_at: string; };
type CounselingLog = {
  id: string; created_at: string; updated_at: string;
  student_no: string; name: string; date: string;
  category: string; content: string; followup: string | null; is_sensitive: boolean;
  gb_jaeyul: string | null; gb_dongari: string | null; gb_bongsa: string | null; gb_jinro: string | null;
};
type TeacherNote = { id: string; student_no: string; name: string; content: string; };
type AiSummary = { id: string; student_no: string; name: string; summary: string; raw_text: string; created_at: string; };

const STUDENTS: Student[] = [
  {student_no:"20201",name:"강지우"},{student_no:"20202",name:"김은솔"},
  {student_no:"20203",name:"김태현"},{student_no:"20204",name:"김하연"},
  {student_no:"20205",name:"김혜민"},{student_no:"20206",name:"박민석"},
  {student_no:"20207",name:"박우진"},{student_no:"20208",name:"성연준"},
  {student_no:"20209",name:"손정연"},{student_no:"20210",name:"송민주"},
  {student_no:"20211",name:"심지안"},{student_no:"20212",name:"양효승"},
  {student_no:"20213",name:"유다현"},{student_no:"20214",name:"윤혜림"},
  {student_no:"20215",name:"이승지"},{student_no:"20216",name:"이시원"},
  {student_no:"20217",name:"이조은"},{student_no:"20218",name:"장지현"},
  {student_no:"20219",name:"전주하"},{student_no:"20220",name:"정은지"},
  {student_no:"20221",name:"주보민"},{student_no:"20222",name:"최안아"},
  {student_no:"20223",name:"현서정"},
];

const CATS = [
  {key:"가족관계",emoji:"👨‍👩‍👧",color:"#f97316"},
  {key:"교우관계",emoji:"🤝",color:"#a855f7"},
  {key:"학업",emoji:"📚",color:"#3b82f6"},
  {key:"학원고민",emoji:"🏫",color:"#06b6d4"},
  {key:"진로",emoji:"🎯",color:"#22c55e"},
  {key:"정서/심리",emoji:"💭",color:"#ec4899"},
  {key:"기타",emoji:"💬",color:"#94a3b8"},
];

const TEACHER_PW = process.env.NEXT_PUBLIC_TEACHER_PW ?? "hyfl-teacher-2026!";

function fmtDate(d: string) {
  if (!d) return "";
  const dt = new Date(`${d}T00:00:00+09:00`);
  const days = ["일","월","화","수","목","금","토"];
  return `${dt.getMonth()+1}/${dt.getDate()}(${days[dt.getDay()]})`;
}
function toKSTDate() {
  const k = new Date(new Date().toLocaleString("en-US",{timeZone:"Asia/Seoul"}));
  return `${k.getFullYear()}-${String(k.getMonth()+1).padStart(2,"0")}-${String(k.getDate()).padStart(2,"0")}`;
}
function parseWall(c: string) {
  try { const o=JSON.parse(c); return {mbti:o.mbti??"",like:o.likeBehaviors??"",dislike:o.dislikeBehaviors??"",goal:o.thisYearGoal??"",message:o.message??""}; }
  catch { return null; }
}
const emptyForm = ()=>({student_no:"",name:"",date:toKSTDate(),category:"학업",content:"",followup:"",is_sensitive:false,gb_jaeyul:"",gb_dongari:"",gb_bongsa:"",gb_jinro:""});

export default function TeacherOnlyPage() {
  const [authed,setAuthed]=useState(false);
  const [pw,setPw]=useState("");
  const [pwErr,setPwErr]=useState(false);
  const [view,setView]=useState<"dash"|"student"|"form">("dash");
  const [logs,setLogs]=useState<CounselingLog[]>([]);
  const [subs,setSubs]=useState<Submission[]>([]);
  const [walls,setWalls]=useState<WallPost[]>([]);
  const [notes,setNotes]=useState<TeacherNote[]>([]);
  const [ais,setAis]=useState<AiSummary[]>([]);
  const [loading,setLoading]=useState(false);
  const [sel,setSel]=useState<Student|null>(null);
  const [tab,setTab]=useState<"overview"|"survey"|"log"|"gb"|"ai">("overview");
  const [form,setForm]=useState(emptyForm());
  const [selLog,setSelLog]=useState<CounselingLog|null>(null);
  const [saving,setSaving]=useState(false);
  const [noteText,setNoteText]=useState("");
  const [noteSaving,setNoteSaving]=useState(false);
  const [aiFile,setAiFile]=useState<File|null>(null);
  const [aiLoading,setAiLoading]=useState(false);
  const [aiResult,setAiResult]=useState("");
  const [qLoading,setQLoading]=useState(false);
  const [qResult,setQResult]=useState("");
  const fileRef=useRef<HTMLInputElement>(null);

  function login(){
    if(pw===TEACHER_PW){setAuthed(true);loadAll();}
    else{setPwErr(true);setPw("");setTimeout(()=>setPwErr(false),1500);}
  }

  async function loadAll(){
    setLoading(true);
    const [a,b,c,d,e]=await Promise.all([
      supabase.from("counseling_logs").select("*").order("date",{ascending:false}),
      supabase.from("counseling_submissions").select("*").order("created_at",{ascending:false}),
      supabase.from("wall_posts").select("id,author_name,content,created_at").order("created_at"),
      supabase.from("teacher_notes").select("*"),
      supabase.from("ai_summaries").select("*").order("created_at",{ascending:false}),
    ]);
    setLogs((a.data as CounselingLog[])??[]);
    setWalls((c.data as WallPost[])??[]);
    setNotes((d.data as TeacherNote[])??[]);
    setAis((e.data as AiSummary[])??[]);
    // counseling_submissions는 payload 없이 row에 flat하게 저장됨
    const parsed=((b.data??[]) as any[]).map((r:any)=>({
      id:r.id, created_at:r.created_at,
      payload:{
        studentNo: r.student_no??r.payload?.studentNo??"",
        name: r.name??r.payload?.name??"",
        parentContact: r.parent_contact??r.payload?.parentContact??"",
        preferredContactMethod: r.preferred_contact_method??r.payload?.preferredContactMethod??"",
        preferredContactDetail: r.preferred_contact_detail??r.payload?.preferredContactDetail??"",
        mbti: r.mbti??r.payload?.mbti??"",
        closeFriends: r.close_friends??r.payload?.closeFriends??"",
        firstImpression: r.first_impression??r.payload?.firstImpression??"",
        wantClassActivity: r.want_class_activity??r.payload?.wantClassActivity??"",
        likeSubject: r.like_subject??r.payload?.likeSubject??"",
        likeReason: r.like_reason??r.payload?.likeReason??"",
        dislikeSubject: r.dislike_subject??r.payload?.dislikeSubject??"",
        dislikeReason: r.dislike_reason??r.payload?.dislikeReason??"",
        hobby: r.hobby??r.payload?.hobby??"",
        presentationStyle: r.presentation_style??r.payload?.presentationStyle??"",
        learningHelpStyle: r.learning_help_style??r.payload?.learningHelpStyle??"",
        parentsStyle: r.parents_style??r.payload?.parentsStyle??"",
        parentsMeaning: r.parents_meaning??r.payload?.parentsMeaning??"",
        talkWith: r.talk_with??r.payload?.talkWith??"",
        strengths: r.strengths??r.payload?.strengths??"",
        weaknesses: r.weaknesses??r.payload?.weaknesses??"",
        adjectives: r.adjectives??r.payload?.adjectives??"",
        wantToBe: r.want_to_be??r.payload?.wantToBe??"",
        dream: r.dream??r.payload?.dream??"",
        habitToFix: r.habit_to_fix??r.payload?.habitToFix??"",
        messageToTeacher: r.message_to_teacher??r.payload?.messageToTeacher??"",
        teacherShouldKnow: r.teacher_should_know??r.payload?.teacherShouldKnow??"",
      },
    }));
    setSubs(parsed as Submission[]);
    setLoading(false);
  }

  // 인덱스
  const logMap:Record<string,CounselingLog[]>={};
  logs.forEach(l=>{if(!logMap[l.student_no])logMap[l.student_no]=[];logMap[l.student_no].push(l);});
  // counseling_submissions: student_no로 매핑 (없으면 name으로 fallback)
  const subMap:Record<string,Submission>={};
  subs.forEach(s=>{
    if(s.payload?.studentNo) subMap[s.payload.studentNo]=s;
  });
  // student_no 없는 경우 이름으로도 찾을 수 있게 별도 맵
  const subByName:Record<string,Submission>={};
  subs.forEach(s=>{
    if(s.payload?.name) subByName[s.payload.name]=s;
  });

  // wall_posts: author_name에 실제 이름이 포함되어 있으면 매칭
  // "연준/8", "주보민/ 21번 / 보민", "강지우 / 1번 / 깡지" 등 처리
  const wallMap:Record<string,WallPost>={};
  STUDENTS.forEach(student=>{
    const match=walls.find(w=>{
      const authorRaw=w.author_name??"";
      // "/" 기준으로 분리해서 각 파트에 학생 이름 포함 여부 확인
      const parts=authorRaw.split("/").map((p:string)=>p.trim());
      return parts.some((part:string)=>
        part===student.name ||                          // 정확 일치
        student.name.includes(part) ||                 // 성연준 ⊃ 연준
        part.includes(student.name)                    // 완전히 포함
      );
    });
    if(match) wallMap[student.name]=match;
  });
  const noteMap:Record<string,TeacherNote>={};
  notes.forEach(n=>{noteMap[n.student_no]=n;});
  const aiMap:Record<string,AiSummary>={};
  ais.forEach(a=>{aiMap[a.student_no]=a;});

  function openStu(s:Student){setSel(s);setNoteText(noteMap[s.student_no]?.content??"");setTab("overview");setAiResult("");setQResult("");setView("student");}

  async function saveNote(){
    if(!sel)return;
    setNoteSaving(true);
    const ex=noteMap[sel.student_no];
    if(ex)await supabase.from("teacher_notes").update({content:noteText,updated_at:new Date().toISOString()}).eq("id",ex.id);
    else await supabase.from("teacher_notes").insert({student_no:sel.student_no,name:sel.name,content:noteText});
    await loadAll();setNoteSaving(false);
  }

  async function saveLog(){
    if(!form.student_no||!form.content.trim()){alert("학생과 상담 내용을 입력해주세요");return;}
    setSaving(true);
    const p={student_no:form.student_no,name:form.name,date:form.date,category:form.category,content:form.content.trim(),followup:form.followup?.trim()||null,is_sensitive:form.is_sensitive,gb_jaeyul:form.gb_jaeyul?.trim()||null,gb_dongari:form.gb_dongari?.trim()||null,gb_bongsa:form.gb_bongsa?.trim()||null,gb_jinro:form.gb_jinro?.trim()||null,updated_at:new Date().toISOString()};
    if(selLog)await supabase.from("counseling_logs").update(p).eq("id",selLog.id);
    else await supabase.from("counseling_logs").insert(p);
    setSaving(false);setSelLog(null);setForm(emptyForm());
    await loadAll();setView("student");setTab("log");
  }

  async function delLog(id:string){
    if(!confirm("삭제할까요?"))return;
    await supabase.from("counseling_logs").delete().eq("id",id);
    await loadAll();
  }

  async function runAI(){
    if(!aiFile||!sel)return;
    setAiLoading(true);setAiResult("");
    try{
      const b64=await new Promise<string>((res,rej)=>{const r=new FileReader();r.onload=()=>res((r.result as string).split(",")[1]);r.onerror=()=>rej(new Error("실패"));r.readAsDataURL(aiFile);});
      if(aiFile.type!=="application/pdf"){setAiResult("⚠️ PDF만 지원해요.");setAiLoading(false);return;}
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:[{type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}},{type:"text",text:`${sel.name} 학생 생기부/성적 자료입니다. 담임 교사 시각으로 요약:\n1.자율활동\n2.동아리\n3.봉사\n4.진로 및 희망 진로\n5.성적 특이사항\n6.행동발달 참고\n7.상담 시 주목할 점\n\n각 2-3줄, 없으면 "해당 없음"`}]}]})});
      const data=await resp.json();
      const result=data.content?.find((c:any)=>c.type==="text")?.text??"요약 실패";
      setAiResult(result);
      await supabase.from("ai_summaries").upsert({student_no:sel.student_no,name:sel.name,summary:result,raw_text:`[${aiFile.name}]`,updated_at:new Date().toISOString()},{onConflict:"student_no"});
      await loadAll();
    }catch{setAiResult("오류가 발생했어요.");}
    setAiLoading(false);
  }

  async function runQuick(){
    if(!sel)return;
    setQLoading(true);setQResult("");
    const sub=subMap[sel.student_no]??subByName[sel.name];
    const wp=wallMap[sel.name];
    const wallP=wp?parseWall(wp.content):null;
    const myLogs=logMap[sel.student_no]??[];
    const note=noteMap[sel.student_no];
    const txt=`[설문]${sub?`MBTI:${sub.payload.mbti}, 친한친구:${sub.payload.closeFriends}, 취미:${sub.payload.hobby}, 좋아하는과목:${sub.payload.likeSubject}, 장점:${sub.payload.strengths}, 단점:${sub.payload.weaknesses}, 진로:${sub.payload.dream}, 고민의논:${sub.payload.talkWith}, 부모님스타일:${sub.payload.parentsStyle}, 선생님께:${sub.payload.messageToTeacher}, 알아줬으면:${sub.payload.teacherShouldKnow}`:"없음"}
[자기소개]${wallP?`MBTI:${wallP.mbti}, 좋아하는것:${wallP.like}, 싫어하는것:${wallP.dislike}, 목표:${wallP.goal}, 선생님께:${wallP.message}`:"없음"}
[상담기록${myLogs.length}건]${myLogs.map(l=>`${l.date}[${l.category}]${l.content}`).join(" / ")||"없음"}
[교사메모]${note?.content||"없음"}`;
    try{
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,messages:[{role:"user",content:`${sel.name} 학생 자료입니다. 상담 전 핵심만 4줄로 요약:\n- 성격/특성:\n- 관심사/진로:\n- 관계/고민:\n- 상담 포인트:\n\n${txt}`}]})});
      const data=await resp.json();
      setQResult(data.content?.find((c:any)=>c.type==="text")?.text??"요약 실패");
    }catch{setQResult("오류가 발생했어요.");}
    setQLoading(false);
  }

  // ── 로그인 ──
  if(!authed)return(
    <div style={{minHeight:"70vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div className="hy-card" style={{padding:"44px 40px",maxWidth:380,width:"100%",textAlign:"center"}}>
        <p style={{fontSize:40,margin:"0 0 16px"}}>🔐</p>
        <h2 style={{fontSize:18,fontWeight:900,color:"var(--text)",margin:"0 0 4px"}}>교사 전용 페이지</h2>
        <p style={{fontSize:12,color:"var(--text-subtle)",fontWeight:600,margin:"0 0 28px",lineHeight:1.7}}>
          이 URL은 학생에게 공유하지 마세요<br/>상담 일지·학생 자료가 포함돼 있어요
        </p>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <input type="password" placeholder="비밀번호" value={pw}
            onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()}
            className="hy-input" style={{textAlign:"center",fontSize:16,borderColor:pwErr?"#ef4444":undefined,animation:pwErr?"shake 0.3s":"none"}}/>
          {pwErr&&<p style={{fontSize:12,color:"#ef4444",fontWeight:700,margin:0}}>비밀번호가 틀렸어요</p>}
          <button onClick={login} className="hy-btn hy-btn-primary" style={{fontSize:14}}>입장하기</button>
        </div>
        <p style={{fontSize:11,color:"var(--text-subtle)",marginTop:20}}>Vercel 환경변수 <code>NEXT_PUBLIC_TEACHER_PW</code>로 변경 가능</p>
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}`}</style>
    </div>
  );

  // ── 상담 기록 폼 ──
  if(view==="form")return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <button onClick={()=>{setView("student");setSelLog(null);setForm(emptyForm());}} className="hy-btn" style={{fontSize:13}}>← 돌아가기</button>
        <h2 style={{fontSize:17,fontWeight:900,color:"var(--text)",margin:0}}>{selLog?"✏️ 기록 수정":`✏️ ${sel?.name} 상담 기록`}</h2>
      </div>
      <div className="hy-card" style={{padding:"26px 28px"}}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:"var(--text-muted)",display:"block",marginBottom:5}}>학생 *</label>
              <select value={form.student_no} onChange={e=>{const s=STUDENTS.find(s=>s.student_no===e.target.value);setForm(f=>({...f,student_no:e.target.value,name:s?.name??""}));}} className="hy-input" style={{cursor:"pointer"}}>
                <option value="">선택</option>
                {STUDENTS.map(s=><option key={s.student_no} value={s.student_no}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:"var(--text-muted)",display:"block",marginBottom:5}}>날짜 *</label>
              <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className="hy-input"/>
            </div>
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:"var(--text-muted)",display:"block",marginBottom:8}}>상담 분류 *</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {CATS.map(c=>(
                <button key={c.key} onClick={()=>setForm(f=>({...f,category:c.key}))}
                  style={{padding:"8px 14px",borderRadius:999,border:"1.5px solid",fontFamily:"inherit",cursor:"pointer",fontSize:13,fontWeight:700,
                    borderColor:form.category===c.key?c.color:"var(--border)",
                    background:form.category===c.key?c.color+"22":"#fff",
                    color:form.category===c.key?c.color:"var(--text-muted)"}}>
                  {c.emoji} {c.key}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:"var(--text-muted)",display:"block",marginBottom:5}}>상담 내용 *</label>
            <textarea placeholder="학생이 말한 내용, 선생님 반응, 느낀 점 등" value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} className="hy-input" style={{minHeight:140,resize:"vertical"}}/>
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:"var(--text-muted)",display:"block",marginBottom:5}}>후속 조치</label>
            <textarea placeholder="다음에 확인할 것, 연락할 사항 등" value={form.followup??""} onChange={e=>setForm(f=>({...f,followup:e.target.value}))} className="hy-input" style={{minHeight:70,resize:"vertical"}}/>
          </div>
          <div style={{padding:"16px 18px",borderRadius:16,background:"#f8f7ff",border:"1.5px solid #e0d9ff"}}>
            <p style={{fontSize:13,fontWeight:900,color:"#5b21b6",margin:"0 0 12px"}}>📝 생기부 기재 참고</p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {([{key:"gb_jaeyul",label:"자율활동"},{key:"gb_dongari",label:"동아리"},{key:"gb_bongsa",label:"봉사"},{key:"gb_jinro",label:"진로"}] as const).map(item=>(
                <div key={item.key}>
                  <label style={{fontSize:11,fontWeight:700,color:"#7c3aed",display:"block",marginBottom:4}}>{item.label}</label>
                  <textarea value={(form as any)[item.key]??""} onChange={e=>setForm(f=>({...f,[item.key]:e.target.value}))} className="hy-input" style={{minHeight:52,resize:"vertical",fontSize:13}}/>
                </div>
              ))}
            </div>
          </div>
          <label style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderRadius:12,background:"#fff5f5",border:"1.5px solid #fecaca",cursor:"pointer"}}>
            <input type="checkbox" checked={form.is_sensitive} onChange={e=>setForm(f=>({...f,is_sensitive:e.target.checked}))} style={{width:16,height:16}}/>
            <div>
              <p style={{fontSize:13,fontWeight:700,color:"#dc2626",margin:"0 0 1px"}}>🔒 민감 기록</p>
              <p style={{fontSize:11,color:"#ef4444",margin:0}}>특별히 주의가 필요한 내용</p>
            </div>
          </label>
          <div style={{display:"flex",gap:8}}>
            <button onClick={saveLog} disabled={saving} className="hy-btn hy-btn-primary" style={{flex:1,fontSize:14}}>{saving?"저장 중...":selLog?"수정 완료":"💾 저장"}</button>
            <button onClick={()=>{setView("student");setSelLog(null);setForm(emptyForm());}} className="hy-btn" style={{fontSize:13}}>취소</button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── 학생 상세 뷰 ──
  if(view==="student"&&sel){
    const sub=subMap[sel.student_no]??subByName[sel.name];
    const wall=wallMap[sel.name];
    const wallP=wall?parseWall(wall.content):null;
    const myLogs=logMap[sel.student_no]??[];
    const selAi=aiMap[sel.student_no];
    return(
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <button onClick={()=>setView("dash")} className="hy-btn" style={{fontSize:13}}>← 대시보드</button>
          <h2 style={{fontSize:18,fontWeight:900,color:"var(--text)",margin:0}}>
            {sel.name}<span style={{fontSize:13,color:"var(--text-subtle)",fontWeight:600,marginLeft:8}}>{sel.student_no}</span>
          </h2>
          <span style={{fontSize:12,color:"var(--primary)",fontWeight:700}}>상담 {myLogs.length}회</span>
          <button onClick={()=>{setForm({...emptyForm(),student_no:sel.student_no,name:sel.name});setSelLog(null);setView("form");}}
            className="hy-btn hy-btn-primary" style={{fontSize:12,padding:"8px 16px",marginLeft:"auto"}}>✏️ 상담 기록 추가</button>
        </div>

        <div style={{display:"flex",background:"#f3f4f6",borderRadius:14,padding:4,gap:3,overflowX:"auto"}}>
          {([{key:"overview",label:"⚡ 한눈에"},{key:"survey",label:"📋 학생 설문"},{key:"log",label:"💬 상담 기록"},{key:"gb",label:"📝 생기부"},{key:"ai",label:"🤖 AI 요약"}] as const).map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)}
              style={{flex:"0 0 auto",padding:"9px 14px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"inherit",
                background:tab===t.key?"#fff":"transparent",
                boxShadow:tab===t.key?"0 2px 8px rgba(0,0,0,0.08)":"none",
                fontSize:12,fontWeight:800,
                color:tab===t.key?"var(--primary)":"var(--text-muted)"}}>
              {t.label}
            </button>
          ))}
        </div>

        {tab==="overview"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{padding:"16px 20px",borderRadius:16,background:"linear-gradient(135deg,#f8f7ff,#ede9fe)",border:"1.5px solid #e0d9ff"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:qResult?12:0}}>
                <div>
                  <p style={{fontSize:13,fontWeight:900,color:"#5b21b6",margin:"0 0 2px"}}>🤖 AI 빠른 요약</p>
                  <p style={{fontSize:11,color:"#7c3aed",fontWeight:600,margin:0}}>설문+상담기록+메모를 즉시 정리해줘요</p>
                </div>
                <button onClick={runQuick} disabled={qLoading} className="hy-btn hy-btn-primary" style={{fontSize:12,padding:"8px 16px",flexShrink:0}}>
                  {qLoading?"분석 중...":"요약하기"}
                </button>
              </div>
              {qResult&&<div style={{marginTop:12,padding:"14px 16px",borderRadius:12,background:"rgba(255,255,255,0.8)"}}>
                <p style={{fontSize:13,color:"var(--text)",lineHeight:1.9,margin:0,whiteSpace:"pre-wrap"}}>{qResult}</p>
              </div>}
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[
                {label:"MBTI",value:sub?.payload.mbti||wallP?.mbti||"-"},
                {label:"친한 친구",value:sub?.payload.closeFriends||"-"},
                {label:"진로/꿈",value:sub?.payload.dream||"-"},
                {label:"취미",value:sub?.payload.hobby||"-"},
              ].map(item=>(
                <div key={item.label} className="hy-card" style={{padding:"14px 16px"}}>
                  <p style={{fontSize:11,fontWeight:800,color:"var(--text-subtle)",margin:"0 0 4px"}}>{item.label}</p>
                  <p style={{fontSize:13,fontWeight:700,color:"var(--text)",margin:0,lineHeight:1.5}}>{item.value}</p>
                </div>
              ))}
            </div>

            {(sub?.payload.messageToTeacher||sub?.payload.teacherShouldKnow||wallP?.message)&&(
              <div className="hy-card" style={{padding:"16px 20px",borderLeft:"4px solid var(--primary)"}}>
                <p style={{fontSize:12,fontWeight:800,color:"var(--primary)",margin:"0 0 8px"}}>💬 선생님께 한 말</p>
                {sub?.payload.messageToTeacher&&<p style={{fontSize:13,color:"var(--text)",margin:"0 0 4px",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{sub.payload.messageToTeacher}</p>}
                {sub?.payload.teacherShouldKnow&&<p style={{fontSize:13,color:"var(--text)",margin:0,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{sub.payload.teacherShouldKnow}</p>}
                {wallP?.message&&!sub&&<p style={{fontSize:13,color:"var(--text)",margin:0,lineHeight:1.7}}>{wallP.message}</p>}
              </div>
            )}

            {(sub?.payload.strengths||sub?.payload.weaknesses)&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {sub?.payload.strengths&&<div className="hy-card" style={{padding:"14px 16px",borderLeft:"3px solid #22c55e"}}>
                  <p style={{fontSize:11,fontWeight:800,color:"#15803d",margin:"0 0 4px"}}>💪 장점</p>
                  <p style={{fontSize:13,color:"var(--text)",margin:0,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{sub.payload.strengths}</p>
                </div>}
                {sub?.payload.weaknesses&&<div className="hy-card" style={{padding:"14px 16px",borderLeft:"3px solid #f97316"}}>
                  <p style={{fontSize:11,fontWeight:800,color:"#c2410c",margin:"0 0 4px"}}>🌱 단점</p>
                  <p style={{fontSize:13,color:"var(--text)",margin:0,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{sub.payload.weaknesses}</p>
                </div>}
              </div>
            )}

            {myLogs.length>0&&(
              <div className="hy-card" style={{padding:"16px 20px"}}>
                <p style={{fontSize:12,fontWeight:800,color:"var(--text-muted)",margin:"0 0 10px"}}>📋 최근 상담</p>
                {myLogs.slice(0,2).map(log=>{
                  const c=CATS.find(c=>c.key===log.category);
                  return(
                    <div key={log.id} style={{padding:"10px 14px",borderRadius:10,background:"#f9fafb",border:"1px solid var(--border)",marginBottom:6}}>
                      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
                        <span style={{fontSize:11,padding:"2px 8px",borderRadius:999,fontWeight:700,background:(c?.color??"#aaa")+"1a",color:c?.color??"#aaa"}}>{c?.emoji} {log.category}</span>
                        <span style={{fontSize:11,color:"var(--text-subtle)"}}>{fmtDate(log.date)}</span>
                      </div>
                      {!log.is_sensitive&&<p style={{fontSize:12,color:"var(--text)",margin:0,lineHeight:1.6,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any}}>{log.content}</p>}
                      {log.is_sensitive&&<p style={{fontSize:12,color:"#ef4444",margin:0}}>🔒 민감 기록</p>}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="hy-card" style={{padding:"16px 20px"}}>
              <p style={{fontSize:12,fontWeight:800,color:"var(--text-muted)",margin:"0 0 8px"}}>📌 교사 메모</p>
              <textarea placeholder="첫인상, 특이사항, 기억해 둘 것 등" value={noteText} onChange={e=>setNoteText(e.target.value)} className="hy-input" style={{minHeight:80,resize:"vertical"}}/>
              <button onClick={saveNote} disabled={noteSaving} className="hy-btn hy-btn-primary" style={{marginTop:8,fontSize:12}}>{noteSaving?"저장 중...":"저장"}</button>
            </div>
          </div>
        )}

        {tab==="survey"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {!sub&&!wall?(
              <div className="hy-card" style={{padding:"40px",textAlign:"center"}}>
                <p style={{fontSize:13,color:"var(--text-subtle)",fontWeight:600}}>아직 설문/자기소개 데이터가 없어요</p>
              </div>
            ):(
              <>
                {sub&&<div className="hy-card" style={{padding:"22px 24px"}}>
                  <p style={{fontSize:13,fontWeight:900,color:"var(--text)",margin:"0 0 14px"}}>📋 학기 초 설문 응답</p>
                  {[
                    {section:"👤 기본",items:[{l:"MBTI",v:sub.payload.mbti},{l:"친한 친구",v:sub.payload.closeFriends},{l:"취미/관심",v:sub.payload.hobby},{l:"학부모 연락처",v:sub.payload.parentContact},{l:"연락 선호",v:sub.payload.preferredContactMethod}]},
                    {section:"📚 학습",items:[{l:"좋아하는 과목",v:sub.payload.likeSubject},{l:"이유",v:sub.payload.likeReason},{l:"싫어하는 과목",v:sub.payload.dislikeSubject},{l:"이유",v:sub.payload.dislikeReason},{l:"발표 스타일",v:sub.payload.presentationStyle},{l:"모를 때",v:sub.payload.learningHelpStyle}]},
                    {section:"🏠 가정/관계",items:[{l:"부모님 스타일",v:sub.payload.parentsStyle},{l:"부모님은 어떤 분",v:sub.payload.parentsMeaning},{l:"고민 의논 대상",v:sub.payload.talkWith}]},
                    {section:"🌱 자아/진로",items:[{l:"장점",v:sub.payload.strengths},{l:"단점",v:sub.payload.weaknesses},{l:"형용사",v:sub.payload.adjectives},{l:"되고 싶은 사람",v:sub.payload.wantToBe},{l:"진로/꿈",v:sub.payload.dream},{l:"고치고 싶은 버릇",v:sub.payload.habitToFix}]},
                    {section:"💬 선생님께",items:[{l:"드리고 싶은 말",v:sub.payload.messageToTeacher},{l:"알아줬으면 하는 것",v:sub.payload.teacherShouldKnow},{l:"원하는 학급 활동",v:sub.payload.wantClassActivity},{l:"선생님 첫인상",v:sub.payload.firstImpression}]},
                  ].map(s=>(
                    <div key={s.section} style={{marginBottom:16}}>
                      <p style={{fontSize:12,fontWeight:900,color:"var(--primary)",margin:"0 0 8px"}}>{s.section}</p>
                      {s.items.filter(i=>i.v?.trim()).map(i=>(
                        <div key={i.l} style={{display:"grid",gridTemplateColumns:"120px 1fr",gap:8,padding:"8px 0",borderBottom:"1px solid #f3f4f6"}}>
                          <p style={{fontSize:11,fontWeight:700,color:"var(--text-subtle)",margin:0}}>{i.l}</p>
                          <p style={{fontSize:13,color:"var(--text)",margin:0,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{i.v}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>}
                {wallP&&<div className="hy-card" style={{padding:"22px 24px"}}>
                  <p style={{fontSize:13,fontWeight:900,color:"var(--text)",margin:"0 0 14px"}}>🌸 자기소개 담벼락</p>
                  {[{l:"MBTI",v:wallP.mbti},{l:"😊 좋아하는 것",v:wallP.like},{l:"😤 싫어하는 것",v:wallP.dislike},{l:"🎯 올해 목표",v:wallP.goal},{l:"💬 선생님께",v:wallP.message}].filter(i=>i.v?.trim()).map(i=>(
                    <div key={i.l} style={{display:"grid",gridTemplateColumns:"130px 1fr",gap:8,padding:"8px 0",borderBottom:"1px solid #f3f4f6"}}>
                      <p style={{fontSize:11,fontWeight:700,color:"var(--text-subtle)",margin:0}}>{i.l}</p>
                      <p style={{fontSize:13,color:"var(--text)",margin:0,lineHeight:1.6}}>{i.v}</p>
                    </div>
                  ))}
                </div>}
              </>
            )}
          </div>
        )}

        {tab==="log"&&(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {myLogs.length===0?(
              <div className="hy-card" style={{padding:"40px",textAlign:"center"}}>
                <p style={{fontSize:13,color:"var(--text-subtle)",fontWeight:600}}>아직 상담 기록이 없어요</p>
              </div>
            ):myLogs.map(log=>{
              const c=CATS.find(c=>c.key===log.category);
              return(
                <div key={log.id} className="hy-card" style={{padding:"16px 20px",borderLeft:`4px solid ${c?.color??"var(--primary)"}`,background:log.is_sensitive?"#fff8f8":undefined}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:11,padding:"2px 8px",borderRadius:999,fontWeight:800,background:(c?.color??"#aaa")+"1a",color:c?.color??"#aaa"}}>{c?.emoji} {log.category}</span>
                      {log.is_sensitive&&<span style={{fontSize:10,color:"#ef4444",fontWeight:800}}>🔒</span>}
                      <span style={{fontSize:12,color:"var(--text-subtle)"}}>{fmtDate(log.date)}</span>
                    </div>
                    <div style={{display:"flex",gap:5}}>
                      <button onClick={()=>{setForm({student_no:log.student_no,name:log.name,date:log.date,category:log.category,content:log.content,followup:log.followup??"",is_sensitive:log.is_sensitive,gb_jaeyul:log.gb_jaeyul??"",gb_dongari:log.gb_dongari??"",gb_bongsa:log.gb_bongsa??"",gb_jinro:log.gb_jinro??""});setSelLog(log);setView("form");}} style={{fontSize:11,padding:"3px 10px",borderRadius:999,border:"1.5px solid var(--border)",background:"#fff",cursor:"pointer",fontFamily:"inherit",fontWeight:700,color:"var(--text-muted)"}}>수정</button>
                      <button onClick={()=>delLog(log.id)} style={{fontSize:11,padding:"3px 10px",borderRadius:999,border:"1.5px solid #fecaca",background:"#fff5f5",cursor:"pointer",fontFamily:"inherit",fontWeight:700,color:"#ef4444"}}>삭제</button>
                    </div>
                  </div>
                  {log.is_sensitive?<p style={{fontSize:12,color:"#ef4444",fontWeight:700,margin:0}}>🔒 민감 기록</p>:(
                    <>
                      <p style={{fontSize:13,color:"var(--text)",lineHeight:1.8,margin:"0 0 6px",whiteSpace:"pre-wrap"}}>{log.content}</p>
                      {log.followup&&<div style={{padding:"8px 12px",borderRadius:10,background:"#f0fdf4",border:"1px solid #86efac"}}>
                        <p style={{fontSize:11,fontWeight:700,color:"#15803d",margin:"0 0 2px"}}>📌 후속</p>
                        <p style={{fontSize:12,color:"#166534",margin:0,whiteSpace:"pre-wrap"}}>{log.followup}</p>
                      </div>}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab==="gb"&&(
          <div className="hy-card" style={{padding:"22px 24px"}}>
            <p style={{fontSize:13,fontWeight:900,color:"var(--text)",margin:"0 0 16px"}}>📝 생기부 기재 참고 모음</p>
            {([{key:"gb_jaeyul",label:"자율활동",color:"#3b82f6"},{key:"gb_dongari",label:"동아리",color:"#a855f7"},{key:"gb_bongsa",label:"봉사",color:"#22c55e"},{key:"gb_jinro",label:"진로",color:"#f97316"}] as const).map(item=>{
              const rel=myLogs.filter(l=>(l as any)[item.key]);
              return(
                <div key={item.key} style={{marginBottom:16}}>
                  <p style={{fontSize:13,fontWeight:900,color:item.color,margin:"0 0 8px",borderBottom:`2px solid ${item.color}22`,paddingBottom:6}}>{item.label}</p>
                  {rel.length===0?<p style={{fontSize:12,color:"var(--text-subtle)",fontWeight:500}}>기재 내용 없음</p>:rel.map(l=>(
                    <div key={l.id} style={{marginBottom:6,padding:"10px 14px",borderRadius:10,background:"#f9fafb",border:"1px solid var(--border)"}}>
                      <p style={{fontSize:11,color:"var(--text-subtle)",fontWeight:600,margin:"0 0 3px"}}>{fmtDate(l.date)}</p>
                      <p style={{fontSize:13,color:"var(--text)",margin:0,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{(l as any)[item.key]}</p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {tab==="ai"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div className="hy-card" style={{padding:"22px 24px"}}>
              <p style={{fontSize:13,fontWeight:900,color:"var(--text)",margin:"0 0 6px"}}>🤖 생기부 PDF AI 요약</p>
              <p style={{fontSize:12,color:"var(--text-subtle)",fontWeight:600,margin:"0 0 14px"}}>생기부·성적표 PDF를 올리면 Claude가 활동 내역을 정리해줘요</p>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <input ref={fileRef} type="file" accept=".pdf" onChange={e=>setAiFile(e.target.files?.[0]??null)} style={{display:"none"}}/>
                <button onClick={()=>fileRef.current?.click()} style={{padding:"14px",borderRadius:14,border:"2px dashed var(--border)",background:"#f9fafb",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,color:"var(--text-muted)"}}>
                  {aiFile?`📄 ${aiFile.name}`:"📁 PDF 파일 선택"}
                </button>
                <button onClick={runAI} disabled={aiLoading||!aiFile} className="hy-btn hy-btn-primary" style={{fontSize:13,opacity:!aiFile?0.5:1}}>
                  {aiLoading?"분석 중... ✨":"🤖 AI 요약 시작"}
                </button>
              </div>
            </div>
            {(aiResult||selAi)&&(
              <div className="hy-card" style={{padding:"22px 24px",background:"#f8f7ff",border:"1.5px solid #e0d9ff"}}>
                <p style={{fontSize:12,fontWeight:900,color:"#5b21b6",margin:"0 0 10px"}}>✨ AI 요약 결과 {selAi&&!aiResult&&<span style={{fontSize:11,color:"var(--text-subtle)",fontWeight:600}}>— 이전 저장</span>}</p>
                <p style={{fontSize:13,color:"var(--text)",lineHeight:1.9,margin:0,whiteSpace:"pre-wrap"}}>{aiResult||selAi?.summary}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── 대시보드 ──
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div className="hy-hero" style={{background:"linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4c1d95 100%)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
          <div>
            <p style={{color:"rgba(255,255,255,0.5)",fontSize:11,fontWeight:700,margin:"0 0 6px",letterSpacing:"0.12em"}}>🔒 TEACHER ONLY · 2026 한영외고 2-2</p>
            <h1 style={{color:"#fff",fontSize:"clamp(18px,4vw,26px)",fontWeight:900,margin:"0 0 10px"}}>📋 학생 상담 대시보드</h1>
            <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
              {[{label:"전체",value:STUDENTS.length,color:"rgba(255,255,255,0.9)"},{label:"설문 완료",value:STUDENTS.filter(s=>!!(subMap[s.student_no]??subByName[s.name])).length,color:"#86efac"},{label:"상담 완료",value:Object.keys(logMap).length,color:"#c4b5fd"},{label:"총 기록",value:logs.length,color:"#fde68a"}].map(s=>(
                <div key={s.label}>
                  <p style={{fontSize:20,fontWeight:900,color:s.color,margin:"0 0 2px"}}>{s.value}</p>
                  <p style={{fontSize:11,color:"rgba(255,255,255,0.5)",margin:0,fontWeight:600}}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <button onClick={()=>{setAuthed(false);setPw("");}} style={{padding:"8px 14px",borderRadius:999,border:"1.5px solid rgba(255,255,255,0.2)",background:"transparent",color:"rgba(255,255,255,0.5)",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>나가기</button>
        </div>
      </div>

      <div>
        <p style={{fontSize:12,fontWeight:800,color:"var(--text-muted)",margin:"0 0 10px"}}>👥 학생 현황 — 클릭하면 상세 페이지</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(108px,1fr))",gap:8}}>
          {STUDENTS.map(s=>{
            const cnt=logMap[s.student_no]?.length??0;
            const latest=logMap[s.student_no]?.[0];
            const lc=CATS.find(c=>c.key===latest?.category);
            const hasSub=!!(subMap[s.student_no]??subByName[s.name]);
            const hasWall=!!wallMap[s.name];
            const hasNote=!!noteMap[s.student_no];
            const hasAi=!!aiMap[s.student_no];
            return(
              <button key={s.student_no} onClick={()=>openStu(s)}
                style={{padding:"14px 10px",borderRadius:14,border:"1.5px solid",
                  borderColor:cnt>0?(lc?.color??"var(--primary)")+"55":"var(--border)",
                  background:cnt>0?(lc?.color??"#a855f7")+"0d":"#fafafa",
                  cursor:"pointer",fontFamily:"inherit",textAlign:"center",transition:"all 0.15s"}}>
                <p style={{fontSize:13,fontWeight:900,color:"var(--text)",margin:"0 0 4px"}}>{s.name}</p>
                <p style={{fontSize:11,fontWeight:700,margin:"0 0 5px",color:cnt>0?(lc?.color??"var(--primary)"):"var(--text-subtle)"}}>
                  {cnt>0?`상담 ${cnt}회`:"미상담"}
                </p>
                <div style={{display:"flex",justifyContent:"center",gap:2}}>
                  {hasSub&&<span title="설문" style={{fontSize:10}}>📋</span>}
                  {hasWall&&<span title="자기소개" style={{fontSize:10}}>🌸</span>}
                  {hasNote&&<span title="메모" style={{fontSize:10}}>📌</span>}
                  {hasAi&&<span title="AI요약" style={{fontSize:10}}>🤖</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p style={{fontSize:12,fontWeight:800,color:"var(--text-muted)",margin:"0 0 10px"}}>📋 최근 상담 기록</p>
        {loading?<p style={{fontSize:13,color:"var(--text-subtle)"}}>불러오는 중...</p>:logs.slice(0,6).map(log=>{
          const c=CATS.find(c=>c.key===log.category);
          return(
            <div key={log.id} className="hy-card" style={{padding:"12px 18px",marginBottom:8,borderLeft:`3px solid ${c?.color??"var(--primary)"}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:11,padding:"2px 8px",borderRadius:999,fontWeight:800,background:(c?.color??"#aaa")+"1a",color:c?.color??"#aaa"}}>{c?.emoji} {log.category}</span>
                  <button onClick={()=>openStu(STUDENTS.find(s=>s.student_no===log.student_no)??{student_no:log.student_no,name:log.name})}
                    style={{fontSize:13,fontWeight:900,color:"var(--text)",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",textDecoration:"underline",textDecorationColor:"var(--border)",padding:0}}>
                    {log.name}
                  </button>
                  <span style={{fontSize:11,color:"var(--text-subtle)"}}>{fmtDate(log.date)}</span>
                </div>
                {log.is_sensitive&&<span style={{fontSize:10,color:"#ef4444",fontWeight:800}}>🔒</span>}
              </div>
              {!log.is_sensitive&&<p style={{fontSize:12,color:"var(--text-muted)",margin:"5px 0 0",lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical" as any}}>{log.content}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
