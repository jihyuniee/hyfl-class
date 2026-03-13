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
  category: string; content: string; student_answer: string | null; followup: string | null; is_sensitive: boolean;
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
// ★ student_answer 추가
const emptyForm = () => ({
  student_no:"", name:"", date:toKSTDate(), category:"학업",
  content:"", student_answer:"", followup:"", is_sensitive:false,
  gb_jaeyul:"", gb_dongari:"", gb_bongsa:"", gb_jinro:"",
});

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
  const [gbFile,setGbFile]=useState<File|null>(null);
  const [gbLoading,setGbLoading]=useState(false);
  const [gbParsed,setGbParsed]=useState<{jaeyul:string;dongari:string;bongsa:string;jinro:string;haengbal:string;extra:string}|null>(null);
  const fileRef=useRef<HTMLInputElement>(null);
  const gbFileRef=useRef<HTMLInputElement>(null);

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

  const logMap:Record<string,CounselingLog[]>={};
  logs.forEach(l=>{if(!logMap[l.student_no])logMap[l.student_no]=[];logMap[l.student_no].push(l);});
  const subMap:Record<string,Submission>={};
  subs.forEach(s=>{if(s.payload?.studentNo) subMap[s.payload.studentNo]=s;});
  const subByName:Record<string,Submission>={};
  subs.forEach(s=>{if(s.payload?.name) subByName[s.payload.name]=s;});
  const wallMap:Record<string,WallPost>={};
  walls.forEach(w=>{wallMap[w.author_name]=w;});
  const noteMap:Record<string,TeacherNote>={};
  notes.forEach(n=>{noteMap[n.student_no]=n;});
  const aiMap:Record<string,AiSummary>={};
  ais.forEach(a=>{aiMap[a.student_no]=a;});

  function openStu(s:Student){
    setSel(s);
    setNoteText(noteMap[s.student_no]?.content??"");
    setTab("overview");setAiResult("");setQResult("");setGbParsed(null);setGbFile(null);
    setView("student");
  }

  async function saveNote(){
    if(!sel)return;
    setNoteSaving(true);
    const ex=noteMap[sel.student_no];
    if(ex)await supabase.from("teacher_notes").update({content:noteText,updated_at:new Date().toISOString()}).eq("id",ex.id);
    else await supabase.from("teacher_notes").insert({student_no:sel.student_no,name:sel.name,content:noteText});
    await loadAll();setNoteSaving(false);
  }

  async function saveLog(){
    if(!form.student_no||!form.content.trim()){alert("학생과 선생님 메모를 입력해주세요");return;}
    setSaving(true);
    const p={
      student_no:form.student_no, name:form.name, date:form.date,
      category:form.category, content:form.content.trim(),
      student_answer:(form as any).student_answer?.trim()||null,
      followup:form.followup?.trim()||null, is_sensitive:form.is_sensitive,
      gb_jaeyul:form.gb_jaeyul?.trim()||null, gb_dongari:form.gb_dongari?.trim()||null,
      gb_bongsa:form.gb_bongsa?.trim()||null, gb_jinro:form.gb_jinro?.trim()||null,
      updated_at:new Date().toISOString(),
    };
    if(selLog) await supabase.from("counseling_logs").update(p).eq("id",selLog.id);
    else await supabase.from("counseling_logs").insert(p);
    setSaving(false);setSelLog(null);setForm(emptyForm());
    await loadAll();setView("student");setTab("log");
  }

  async function delLog(id:string){
    if(!confirm("삭제할까요?"))return;
    await supabase.from("counseling_logs").delete().eq("id",id);
    await loadAll();
  }

  async function runGbParse(){
    if(!gbFile||!sel)return;
    setGbLoading(true);setGbParsed(null);
    try{
      const b64=await new Promise<string>((res,rej)=>{const r=new FileReader();r.onload=()=>res((r.result as string).split(",")[1]);r.onerror=()=>rej(new Error("실패"));r.readAsDataURL(gbFile);});
      if(gbFile.type!=="application/pdf"){alert("PDF 파일만 지원해요.");setGbLoading(false);return;}
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        model:"claude-sonnet-4-20250514",max_tokens:1500,
        messages:[{role:"user",content:[
          {type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}},
          {type:"text",text:`이것은 ${sel.name} 학생의 나이스 생기부 PDF입니다.\n아래 6개 항목을 각각 추출해서 JSON으로만 응답해주세요. 다른 텍스트 없이 JSON만:\n{\n  "jaeyul": "자율활동 특기사항 전체 내용",\n  "dongari": "동아리활동 특기사항 전체 내용",\n  "bongsa": "봉사활동 내용 요약",\n  "jinro": "진로활동 특기사항 전체 내용",\n  "haengbal": "행동특성 및 종합의견 전체 내용",\n  "extra": "교과세특 중 특이사항이나 눈에 띄는 내용 요약"\n}\n해당 항목이 없으면 빈 문자열로.`}
        ]}],
      })});
      const data=await resp.json();
      const text=data.content?.find((c:any)=>c.type==="text")?.text??"";
      const clean=text.replace(/```json|```/g,"").trim();
      const parsed=JSON.parse(clean);
      setGbParsed(parsed);
      await supabase.from("ai_summaries").upsert(
        {student_no:sel.student_no,name:sel.name,summary:Object.entries(parsed).map(([k,v])=>`[${k}] ${v}`).join("\n\n"),raw_text:`[생기부PDF:${gbFile.name}]`,updated_at:new Date().toISOString()},
        {onConflict:"student_no"}
      );
      await loadAll();
    }catch(e){alert("파싱 오류가 발생했어요. PDF를 다시 확인해주세요.");}
    setGbLoading(false);
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
[생기부]${gbParsed?`자율:${gbParsed.jaeyul} / 동아리:${gbParsed.dongari} / 진로:${gbParsed.jinro} / 행동특성:${gbParsed.haengbal}`:(aiMap[sel.student_no]?.summary?aiMap[sel.student_no].summary:"없음")}
[상담기록${myLogs.length}건]${myLogs.map(l=>`${l.date}[${l.category}]학생:${l.student_answer||""} 교사:${l.content}`).join(" / ")||"없음"}
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

  // ── 상담 기록 폼 (좌우 분할 + 분류 탭) ──
  if(view==="form"&&sel){
    const sub=subMap[sel.student_no]??subByName[sel.name];
    const wall=wallMap[sel.name];
    const wallP=wall?parseWall(wall.content):null;
    const myLogs=logMap[sel.student_no]??[];

    // 분류별 학생 응답 — 출처 구분 (survey=선생님께만, wall=친구 자기소개)
    type SurveyItem = {label:string; value:string; source:"survey"|"wall"};
    const surveyByCategory: Record<string, SurveyItem[]> = {
      "가족관계":[
        {label:"부모님 스타일",         value:sub?.payload.parentsStyle??"",           source:"survey"},
        {label:"부모님은 어떤 분",       value:sub?.payload.parentsMeaning??"",         source:"survey"},
        {label:"학부모 연락처",          value:sub?.payload.parentContact??"",          source:"survey"},
        {label:"연락 선호 방법",         value:sub?.payload.preferredContactMethod??"", source:"survey"},
      ],
      "교우관계":[
        {label:"친한 친구",              value:sub?.payload.closeFriends??"",           source:"survey"},
        {label:"고민 의논 대상",         value:sub?.payload.talkWith??"",               source:"survey"},
        {label:"나를 표현하는 형용사",   value:sub?.payload.adjectives??"",             source:"survey"},
        {label:"좋아하는 것",            value:wallP?.like??"",                         source:"wall"},
        {label:"싫어하는 것",            value:wallP?.dislike??"",                      source:"wall"},
        {label:"올해 목표",              value:wallP?.goal??"",                         source:"wall"},
      ],
      "학업":[
        {label:"좋아하는 과목 / 이유",   value:`${sub?.payload.likeSubject??""} — ${sub?.payload.likeReason??""}`, source:"survey"},
        {label:"싫어하는 과목 / 이유",   value:`${sub?.payload.dislikeSubject??""} — ${sub?.payload.dislikeReason??""}`, source:"survey"},
        {label:"발표 스타일",            value:sub?.payload.presentationStyle??"",      source:"survey"},
        {label:"모를 때 대처",           value:sub?.payload.learningHelpStyle??"",      source:"survey"},
      ],
      "학원고민":[
        {label:"좋아하는 과목",          value:sub?.payload.likeSubject??"",            source:"survey"},
        {label:"싫어하는 과목",          value:sub?.payload.dislikeSubject??"",         source:"survey"},
        {label:"고민 의논 대상",         value:sub?.payload.talkWith??"",               source:"survey"},
      ],
      "진로":[
        {label:"진로 / 꿈",              value:sub?.payload.dream??"",                  source:"survey"},
        {label:"되고 싶은 사람",         value:sub?.payload.wantToBe??"",               source:"survey"},
        {label:"선생님이 알아줬으면",    value:sub?.payload.teacherShouldKnow??"",      source:"survey"},
        {label:"올해 목표",              value:wallP?.goal??"",                         source:"wall"},
      ],
      "정서/심리":[
        {label:"장점",                   value:sub?.payload.strengths??"",              source:"survey"},
        {label:"단점",                   value:sub?.payload.weaknesses??"",             source:"survey"},
        {label:"고치고 싶은 버릇",       value:sub?.payload.habitToFix??"",             source:"survey"},
        {label:"나를 표현하는 형용사",   value:sub?.payload.adjectives??"",             source:"survey"},
        {label:"좋아하는 것",            value:wallP?.like??"",                         source:"wall"},
        {label:"싫어하는 것",            value:wallP?.dislike??"",                      source:"wall"},
      ],
      "기타":[
        {label:"MBTI",                   value:sub?.payload.mbti??wallP?.mbti??"",      source:"survey"},
        {label:"취미 / 관심",            value:sub?.payload.hobby??"",                  source:"survey"},
        {label:"선생님께 한 말",         value:sub?.payload.messageToTeacher??"",       source:"survey"},
        {label:"원하는 학급 활동",       value:sub?.payload.wantClassActivity??"",      source:"survey"},
        {label:"선생님 첫인상",          value:sub?.payload.firstImpression??"",        source:"survey"},
        {label:"친구들에게 — 좋아하는 것", value:wallP?.like??"",                       source:"wall"},
        {label:"친구들에게 — 싫어하는 것", value:wallP?.dislike??"",                    source:"wall"},
        {label:"친구들에게 — 올해 목표", value:wallP?.goal??"",                         source:"wall"},
        {label:"친구들에게 — 한 말",     value:wallP?.message??"",                      source:"wall"},
      ],
    };

    // 탭 전환: 해당 분류 기존 기록 있으면 불러오기
    function switchCategory(cat: string) {
      const found = myLogs.find(l => l.category === cat);
      if(found){
        setForm({
          student_no:found.student_no, name:found.name, date:found.date,
          category:found.category, content:found.content,
          student_answer:found.student_answer??"",
          followup:found.followup??"", is_sensitive:found.is_sensitive,
          gb_jaeyul:found.gb_jaeyul??"", gb_dongari:found.gb_dongari??"",
          gb_bongsa:found.gb_bongsa??"", gb_jinro:found.gb_jinro??"",
        });
        setSelLog(found);
      } else {
        setForm(f=>({
          ...f, category:cat,
          student_answer:"", content:"", followup:"", is_sensitive:false,
          gb_jaeyul:"", gb_dongari:"", gb_bongsa:"", gb_jinro:"",
        }));
        setSelLog(null);
      }
    }

    const allItems = (surveyByCategory[form.category]??[])
      .filter(i => i.value.trim() && i.value.trim()!=="—" && i.value.trim()!==" — ");
    const surveyItems = allItems.filter(i=>i.source==="survey");
    const wallItems   = allItems.filter(i=>i.source==="wall");
    const catInfo = CATS.find(c=>c.key===form.category);
    const catLogs = myLogs.filter(l=>l.category===form.category);

    // 공통 항목 렌더 함수
    function renderItem(item:{label:string;value:string}, key: string){
      return(
        <div key={key} style={{marginBottom:10}}>
          <p style={{fontSize:11,fontWeight:800,color:"var(--text-subtle)",margin:"0 0 3px"}}>{item.label}</p>
          <p style={{fontSize:13,color:"var(--text)",margin:0,lineHeight:1.65,whiteSpace:"pre-wrap",
            background:"rgba(255,255,255,0.85)",padding:"8px 11px",borderRadius:8,
            border:"1px solid rgba(0,0,0,0.06)"}}>
            {item.value}
          </p>
        </div>
      );
    }

    return(
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {/* 헤더 */}
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <button onClick={()=>{setView("student");setSelLog(null);setForm(emptyForm());}} className="hy-btn" style={{fontSize:13}}>← 돌아가기</button>
          <h2 style={{fontSize:17,fontWeight:900,color:"var(--text)",margin:0}}>
            ✏️ {sel.name} 상담 기록
          </h2>
          <span style={{fontSize:12,color:"var(--primary)",fontWeight:700,background:"#fdf2f8",padding:"4px 10px",borderRadius:999}}>
            {sel.student_no}
          </span>
        </div>

        {/* 분류 탭 */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {CATS.map(c=>{
            const hasRecord = myLogs.some(l=>l.category===c.key);
            const isActive = form.category===c.key;
            return(
              <button key={c.key} onClick={()=>switchCategory(c.key)}
                style={{
                  padding:"8px 16px", borderRadius:999, border:"2px solid",
                  fontFamily:"inherit", cursor:"pointer", fontSize:13, fontWeight:800,
                  borderColor: isActive ? c.color : "var(--border)",
                  background: isActive ? c.color+"22" : "#fff",
                  color: isActive ? c.color : "var(--text-muted)",
                  position:"relative", transition:"all 0.15s",
                }}>
                {c.emoji} {c.key}
                {hasRecord && (
                  <span style={{position:"absolute",top:5,right:6,width:6,height:6,
                    borderRadius:"50%",background:c.color,display:"inline-block"}}/>
                )}
              </button>
            );
          })}
          <span style={{display:"flex",alignItems:"center",fontSize:11,color:"var(--text-subtle)",fontWeight:600,paddingLeft:4}}>
            ● = 기록 있음
          </span>
        </div>

        {/* 좌우 분할 */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,alignItems:"start"}}>

          {/* ── 왼쪽: 학생 응답 (두 소스 분리) ── */}
          <div style={{position:"sticky",top:16,display:"flex",flexDirection:"column",gap:10}}>

            {/* 🟦 선생님께만 보낸 설문 응답 */}
            <div style={{
              padding:"14px 16px", borderRadius:14,
              background: catInfo ? catInfo.color+"0d" : "#f8f7ff",
              border:`1.5px solid ${catInfo?.color??"var(--border)"}33`,
            }}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12}}>
                <span style={{fontSize:12,fontWeight:900,color:catInfo?.color??"var(--primary)"}}>
                  {catInfo?.emoji} {form.category}
                </span>
                <span style={{
                  fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:999,
                  background:"#ede9fe",color:"#5b21b6",
                }}>
                  📋 선생님께만 보낸 설문
                </span>
              </div>
              {!sub ? (
                <p style={{fontSize:12,color:"var(--text-subtle)",fontWeight:500,margin:0}}>설문 응답 없음</p>
              ) : surveyItems.length === 0 ? (
                <p style={{fontSize:12,color:"var(--text-subtle)",fontWeight:500,margin:0}}>이 분류 해당 항목 없음</p>
              ) : surveyItems.map(item=>renderItem(item, "s-"+item.label))}
            </div>

            {/* 🌸 친구들에게 자기소개 (담벼락) */}
            <div style={{
              padding:"14px 16px", borderRadius:14,
              background:"#fff8fe",
              border:"1.5px solid #f3d6f8",
            }}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12}}>
                <span style={{fontSize:12,fontWeight:900,color:"#9333ea"}}>🌸 자기소개</span>
                <span style={{
                  fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:999,
                  background:"#fdf4ff",color:"#a21caf",
                }}>
                  👥 친구들에게 공개한 응답
                </span>
              </div>
              {!wallP ? (
                <p style={{fontSize:12,color:"var(--text-subtle)",fontWeight:500,margin:0}}>자기소개 담벼락 없음</p>
              ) : wallItems.length === 0 ? (
                // 분류에 wall 항목이 없어도 공통 항목은 항상 표시
                <>
                  {wallP.mbti&&renderItem({label:"MBTI",value:wallP.mbti},"w-mbti")}
                  {wallP.like&&renderItem({label:"좋아하는 것",value:wallP.like},"w-like")}
                  {wallP.dislike&&renderItem({label:"싫어하는 것",value:wallP.dislike},"w-dislike")}
                  {wallP.goal&&renderItem({label:"올해 목표",value:wallP.goal},"w-goal")}
                  {wallP.message&&renderItem({label:"선생님께 한 말",value:wallP.message},"w-msg")}
                </>
              ) : (
                <>
                  {wallItems.map(item=>renderItem(item,"w-"+item.label))}
                  {/* 분류에 없는 담벼락 공통 항목도 항상 표시 */}
                  {wallP.mbti&&!wallItems.find(i=>i.label==="MBTI")&&renderItem({label:"MBTI",value:wallP.mbti},"w-mbti")}
                  {wallP.message&&renderItem({label:"선생님께 남긴 메시지",value:wallP.message},"w-msg")}
                </>
              )}
            </div>

            {/* 이전 같은 분류 상담 기록 */}
            {catLogs.length > 0 && (
              <div style={{padding:"12px 14px",borderRadius:12,background:"#f9fafb",border:"1px solid var(--border)"}}>
                <p style={{fontSize:11,fontWeight:800,color:"var(--text-muted)",margin:"0 0 10px"}}>
                  이전 {form.category} 상담 기록 ({catLogs.length}건)
                </p>
                {catLogs.map(l=>(
                  <div key={l.id} style={{
                    padding:"10px 12px", borderRadius:10,
                    background:"#fff", border:"1px solid var(--border)",
                    borderLeft:`3px solid ${catInfo?.color??"var(--primary)"}`,
                    marginBottom:7,
                  }}>
                    <p style={{fontSize:11,color:"var(--text-subtle)",fontWeight:700,margin:"0 0 5px"}}>{fmtDate(l.date)}</p>
                    {!l.is_sensitive ? (
                      <>
                        {l.student_answer && (
                          <div style={{marginBottom:5}}>
                            <p style={{fontSize:10,fontWeight:800,color:"#7c3aed",margin:"0 0 2px"}}>🟣 학생이 한 말</p>
                            <p style={{fontSize:12,color:"#4c1d95",margin:0,lineHeight:1.55,whiteSpace:"pre-wrap",
                              overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any}}>
                              {l.student_answer}
                            </p>
                          </div>
                        )}
                        <div>
                          <p style={{fontSize:10,fontWeight:800,color:"#15803d",margin:"0 0 2px"}}>🟢 선생님 메모</p>
                          <p style={{fontSize:12,color:"var(--text)",margin:0,lineHeight:1.55,
                            overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any}}>
                            {l.content}
                          </p>
                        </div>
                      </>
                    ) : (
                      <p style={{fontSize:11,color:"#ef4444",fontWeight:700,margin:0}}>🔒 민감 기록</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── 오른쪽: 상담 기록 폼 ── */}
          <div className="hy-card" style={{padding:"20px 22px"}}>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>

              {/* 날짜 + 수정 중 배지 */}
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,fontWeight:700,color:"var(--text-muted)",display:"block",marginBottom:4}}>날짜 *</label>
                  <input type="date" value={form.date}
                    onChange={e=>setForm(f=>({...f,date:e.target.value}))}
                    className="hy-input"/>
                </div>
                {selLog && (
                  <div style={{padding:"6px 12px",borderRadius:8,background:"#fef3c7",border:"1px solid #fde68a",fontSize:11,fontWeight:800,color:"#92400e",flexShrink:0}}>
                    ✏️ 기존 기록 수정 중
                  </div>
                )}
              </div>

              {/* 🟣 학생이 한 말 */}
              <div style={{
                padding:"14px 16px", borderRadius:12,
                background:"#faf7ff", border:"1.5px solid #e0d9ff",
              }}>
                <label style={{
                  fontSize:12, fontWeight:800, color:"#5b21b6",
                  display:"flex", alignItems:"center", gap:6, marginBottom:8,
                }}>
                  🟣 학생이 한 말
                  <span style={{fontSize:10,fontWeight:600,color:"#7c3aed",background:"#ede9fe",padding:"2px 8px",borderRadius:999}}>
                    학생 직접 응답 / 상담 중 발화 내용
                  </span>
                </label>
                <textarea
                  placeholder={"상담 중 학생이 직접 말한 내용, 호소한 내용, 학생 입장 등\n왼쪽 설문 응답을 참고해서 입력하세요"}
                  value={(form as any).student_answer??""}
                  onChange={e=>setForm(f=>({...f,student_answer:e.target.value}))}
                  className="hy-input"
                  style={{minHeight:110,resize:"vertical",fontSize:13,background:"rgba(255,255,255,0.7)"}}
                />
              </div>

              {/* 🟢 선생님 메모 */}
              <div>
                <label style={{
                  fontSize:12, fontWeight:800, color:"#15803d",
                  display:"flex", alignItems:"center", gap:6, marginBottom:8,
                }}>
                  🟢 선생님 관찰 / 메모 *
                  <span style={{fontSize:10,fontWeight:600,color:"#166534",background:"#f0fdf4",padding:"2px 8px",borderRadius:999}}>
                    느낀 점, 해석, 개입 방향
                  </span>
                </label>
                <textarea
                  placeholder={"선생님이 느낀 점, 관찰 내용, 해석, 개입 방향 등"}
                  value={form.content}
                  onChange={e=>setForm(f=>({...f,content:e.target.value}))}
                  className="hy-input"
                  style={{minHeight:130,resize:"vertical",fontSize:13}}
                />
              </div>

              {/* 🟡 후속 조치 */}
              <div>
                <label style={{
                  fontSize:12, fontWeight:800, color:"#b45309",
                  display:"flex", alignItems:"center", gap:6, marginBottom:8,
                }}>
                  🟡 후속 조치
                </label>
                <textarea
                  placeholder="다음에 확인할 것, 연락할 사항, 연계 계획 등"
                  value={form.followup??""}
                  onChange={e=>setForm(f=>({...f,followup:e.target.value}))}
                  className="hy-input"
                  style={{minHeight:60,resize:"vertical",fontSize:13}}
                />
              </div>

              {/* 생기부 기재 참고 */}
              <div style={{padding:"12px 14px",borderRadius:12,background:"#f8f7ff",border:"1.5px solid #e0d9ff"}}>
                <p style={{fontSize:12,fontWeight:900,color:"#5b21b6",margin:"0 0 10px"}}>📝 생기부 기재 참고</p>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {([{key:"gb_jaeyul",label:"자율활동"},{key:"gb_dongari",label:"동아리"},{key:"gb_bongsa",label:"봉사"},{key:"gb_jinro",label:"진로"}] as const).map(item=>(
                    <div key={item.key}>
                      <label style={{fontSize:10,fontWeight:700,color:"#7c3aed",display:"block",marginBottom:3}}>{item.label}</label>
                      <textarea
                        value={(form as any)[item.key]??""}
                        onChange={e=>setForm(f=>({...f,[item.key]:e.target.value}))}
                        className="hy-input"
                        style={{minHeight:40,resize:"vertical",fontSize:12}}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 민감 기록 */}
              <label style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:10,background:"#fff5f5",border:"1.5px solid #fecaca",cursor:"pointer"}}>
                <input type="checkbox" checked={form.is_sensitive}
                  onChange={e=>setForm(f=>({...f,is_sensitive:e.target.checked}))}
                  style={{width:15,height:15}}/>
                <div>
                  <p style={{fontSize:12,fontWeight:700,color:"#dc2626",margin:"0 0 1px"}}>🔒 민감 기록</p>
                  <p style={{fontSize:10,color:"#ef4444",margin:0}}>특별히 주의가 필요한 내용</p>
                </div>
              </label>

              {/* 저장 버튼 */}
              <div style={{display:"flex",gap:8}}>
                <button onClick={saveLog} disabled={saving} className="hy-btn hy-btn-primary" style={{flex:1,fontSize:14}}>
                  {saving?"저장 중...":(selLog?`✏️ ${form.category} 수정 완료`:`💾 ${form.category} 상담 저장`)}
                </button>
                <button onClick={()=>{setView("student");setSelLog(null);setForm(emptyForm());}} className="hy-btn" style={{fontSize:13}}>취소</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  <p style={{fontSize:11,fontWeight:800,color:"#c2410c",margin:"0 0 4px"}}>🌱 단점/개선점</p>
                  <p style={{fontSize:13,color:"var(--text)",margin:0,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{sub.payload.weaknesses}</p>
                </div>}
              </div>
            )}

            {myLogs.length>0&&(
              <div className="hy-card" style={{padding:"16px 20px"}}>
                <p style={{fontSize:12,fontWeight:800,color:"var(--text-muted)",margin:"0 0 10px"}}>📋 최근 상담</p>
                {myLogs.slice(0,3).map(log=>{
                  const c=CATS.find(c=>c.key===log.category);
                  return(
                    <div key={log.id} style={{padding:"10px 14px",borderRadius:10,background:"#f9fafb",border:"1px solid var(--border)",borderLeft:`3px solid ${c?.color??"var(--primary)"}`,marginBottom:6}}>
                      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
                        <span style={{fontSize:11,padding:"2px 8px",borderRadius:999,fontWeight:700,background:(c?.color??"#aaa")+"1a",color:c?.color??"#aaa"}}>{c?.emoji} {log.category}</span>
                        <span style={{fontSize:11,color:"var(--text-subtle)"}}>{fmtDate(log.date)}</span>
                      </div>
                      {!log.is_sensitive&&(
                        <>
                          {log.student_answer&&<p style={{fontSize:12,color:"#7c3aed",margin:"0 0 3px",lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical" as any}}>🟣 {log.student_answer}</p>}
                          <p style={{fontSize:12,color:"var(--text)",margin:0,lineHeight:1.6,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical" as any}}>🟢 {log.content}</p>
                        </>
                      )}
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
                      <button onClick={()=>{setForm({student_no:log.student_no,name:log.name,date:log.date,category:log.category,content:log.content,student_answer:log.student_answer??"",followup:log.followup??"",is_sensitive:log.is_sensitive,gb_jaeyul:log.gb_jaeyul??"",gb_dongari:log.gb_dongari??"",gb_bongsa:log.gb_bongsa??"",gb_jinro:log.gb_jinro??""});setSelLog(log);setView("form");}} style={{fontSize:11,padding:"3px 10px",borderRadius:999,border:"1.5px solid var(--border)",background:"#fff",cursor:"pointer",fontFamily:"inherit",fontWeight:700,color:"var(--text-muted)"}}>수정</button>
                      <button onClick={()=>delLog(log.id)} style={{fontSize:11,padding:"3px 10px",borderRadius:999,border:"1.5px solid #fecaca",background:"#fff5f5",cursor:"pointer",fontFamily:"inherit",fontWeight:700,color:"#ef4444"}}>삭제</button>
                    </div>
                  </div>
                  {log.is_sensitive?<p style={{fontSize:12,color:"#ef4444",fontWeight:700,margin:0}}>🔒 민감 기록</p>:(
                    <>
                      {log.student_answer&&(
                        <div style={{padding:"8px 12px",borderRadius:10,background:"#faf7ff",border:"1px solid #e0d9ff",marginBottom:8}}>
                          <p style={{fontSize:11,fontWeight:800,color:"#5b21b6",margin:"0 0 3px"}}>🟣 학생이 한 말</p>
                          <p style={{fontSize:13,color:"#4c1d95",lineHeight:1.7,margin:0,whiteSpace:"pre-wrap"}}>{log.student_answer}</p>
                        </div>
                      )}
                      <div style={{marginBottom:log.followup?8:0}}>
                        <p style={{fontSize:11,fontWeight:800,color:"#15803d",margin:"0 0 3px"}}>🟢 선생님 메모</p>
                        <p style={{fontSize:13,color:"var(--text)",lineHeight:1.8,margin:0,whiteSpace:"pre-wrap"}}>{log.content}</p>
                      </div>
                      {log.followup&&<div style={{padding:"8px 12px",borderRadius:10,background:"#f0fdf4",border:"1px solid #86efac"}}>
                        <p style={{fontSize:11,fontWeight:700,color:"#15803d",margin:"0 0 2px"}}>🟡 후속</p>
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
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div className="hy-card" style={{padding:"20px 22px"}}>
              <p style={{fontSize:13,fontWeight:900,color:"var(--text)",margin:"0 0 4px"}}>📄 나이스 생기부 PDF 업로드</p>
              <p style={{fontSize:12,color:"var(--text-subtle)",fontWeight:600,margin:"0 0 12px"}}>업로드하면 항목별로 자동 파싱해줘요</p>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <input ref={gbFileRef} type="file" accept=".pdf" onChange={e=>setGbFile(e.target.files?.[0]??null)} style={{display:"none"}}/>
                <button onClick={()=>gbFileRef.current?.click()}
                  style={{flex:1,padding:"12px",borderRadius:12,border:"2px dashed var(--border)",background:"#f9fafb",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,color:"var(--text-muted)"}}>
                  {gbFile?`📄 ${gbFile.name}`:"📁 생기부 PDF 선택"}
                </button>
                <button onClick={runGbParse} disabled={gbLoading||!gbFile}
                  className="hy-btn hy-btn-primary" style={{fontSize:13,opacity:!gbFile?0.5:1,flexShrink:0}}>
                  {gbLoading?"파싱 중... ✨":"분석하기"}
                </button>
              </div>
            </div>

            {gbParsed&&(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {[
                  {key:"jaeyul",  label:"자율활동",            color:"#3b82f6",emoji:"🏫"},
                  {key:"dongari", label:"동아리활동",           color:"#a855f7",emoji:"🎭"},
                  {key:"bongsa",  label:"봉사활동",             color:"#22c55e",emoji:"🤲"},
                  {key:"jinro",   label:"진로활동",             color:"#f97316",emoji:"🎯"},
                  {key:"haengbal",label:"행동특성 및 종합의견", color:"#ec4899",emoji:"💎"},
                  {key:"extra",   label:"교과세특 특이사항",    color:"#06b6d4",emoji:"📚"},
                ].map(item=>{
                  const val=(gbParsed as any)[item.key];
                  if(!val?.trim())return null;
                  return(
                    <div key={item.key} className="hy-card" style={{padding:"16px 20px",borderLeft:`4px solid ${item.color}`}}>
                      <p style={{fontSize:12,fontWeight:900,color:item.color,margin:"0 0 8px"}}>{item.emoji} {item.label}</p>
                      <p style={{fontSize:13,color:"var(--text)",lineHeight:1.85,margin:0,whiteSpace:"pre-wrap"}}>{val}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {!gbParsed&&selAi&&(
              <div className="hy-card" style={{padding:"16px 20px",background:"#f8f7ff",border:"1.5px solid #e0d9ff"}}>
                <p style={{fontSize:12,fontWeight:800,color:"#5b21b6",margin:"0 0 8px"}}>🤖 이전 저장된 AI 요약 {selAi.raw_text&&<span style={{fontSize:11,color:"var(--text-subtle)",fontWeight:500}}>({selAi.raw_text})</span>}</p>
                <p style={{fontSize:13,color:"var(--text)",lineHeight:1.85,margin:0,whiteSpace:"pre-wrap"}}>{selAi.summary}</p>
              </div>
            )}

            <div className="hy-card" style={{padding:"16px 20px"}}>
              <p style={{fontSize:12,fontWeight:900,color:"var(--text-muted)",margin:"0 0 12px"}}>✏️ 상담 중 기록한 생기부 메모</p>
              {([{key:"gb_jaeyul",label:"자율",color:"#3b82f6"},{key:"gb_dongari",label:"동아리",color:"#a855f7"},{key:"gb_bongsa",label:"봉사",color:"#22c55e"},{key:"gb_jinro",label:"진로",color:"#f97316"}] as const).map(item=>{
                const rel=myLogs.filter(l=>(l as any)[item.key]);
                return rel.length>0?(
                  <div key={item.key} style={{marginBottom:12}}>
                    <p style={{fontSize:12,fontWeight:900,color:item.color,margin:"0 0 6px"}}>{item.label}</p>
                    {rel.map(l=>(
                      <div key={l.id} style={{marginBottom:5,padding:"8px 12px",borderRadius:10,background:"#f9fafb",border:"1px solid var(--border)"}}>
                        <p style={{fontSize:11,color:"var(--text-subtle)",fontWeight:600,margin:"0 0 2px"}}>{fmtDate(l.date)}</p>
                        <p style={{fontSize:13,color:"var(--text)",margin:0,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{(l as any)[item.key]}</p>
                      </div>
                    ))}
                  </div>
                ):null;
              })}
              {myLogs.every(l=>!l.gb_jaeyul&&!l.gb_dongari&&!l.gb_bongsa&&!l.gb_jinro)&&(
                <p style={{fontSize:12,color:"var(--text-subtle)",fontWeight:500}}>상담 기록에 생기부 메모가 없어요</p>
              )}
            </div>
          </div>
        )}

        {tab==="ai"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div className="hy-card" style={{padding:"22px 24px"}}>
              <p style={{fontSize:13,fontWeight:900,color:"var(--text)",margin:"0 0 6px"}}>🤖 종합 AI 요약</p>
              <p style={{fontSize:12,color:"var(--text-subtle)",fontWeight:600,margin:"0 0 14px"}}>
                설문+상담기록+메모{gbParsed?" + 생기부(업로드됨 ✅)":""} 를 종합해서 요약해줘요
              </p>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <input ref={fileRef} type="file" accept=".pdf" onChange={e=>setAiFile(e.target.files?.[0]??null)} style={{display:"none"}}/>
                <button onClick={()=>fileRef.current?.click()}
                  style={{padding:"12px",borderRadius:12,border:"2px dashed var(--border)",background:"#f9fafb",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,color:"var(--text-muted)"}}>
                  {aiFile?`📄 ${aiFile.name}`:"📁 추가 PDF 선택 (성적표 등, 선택사항)"}
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
              {!log.is_sensitive&&(
                <>
                  {log.student_answer&&<p style={{fontSize:12,color:"#7c3aed",margin:"5px 0 2px",lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical" as any}}>🟣 {log.student_answer}</p>}
                  <p style={{fontSize:12,color:"var(--text-muted)",margin:"3px 0 0",lineHeight:1.5,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:1,WebkitBoxOrient:"vertical" as any}}>🟢 {log.content}</p>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
