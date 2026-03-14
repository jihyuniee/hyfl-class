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

// ── 교사 전용 추가 데이터 타입 ──
type StudentExtra = {
  id: string;
  student_no: string;
  // 생활정보
  address: string;
  commute: string;
  shuttle: string;
  sleep_time: string;
  wake_time: string;
  life_pattern: string;
  // 가족 구성원 (JSON)
  family_members: string;
  // 성적 (JSON: {국어,수학,영어,사회국제,한국사,과학,문학})
  grades: string;
  // 학습 태도 목표
  habit_goal_daily: string;
  habit_goal_exam: string;
  // 진로 계열
  selected_field: string;
  field_note: string;
  // 학급 의견 (비공개)
  class_opinion: string;
};

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

const FIELDS = [
  {key:"사회과학", label:"사회과학", sub:"사회, 지리, 언론 등", color:"#22c55e", score:5,
   tips:["사회·윤리 세특에서 사회문제 분석 역량 기록","시사 독서 기반 탐구보고서 (언론·미디어·젠더·환경)","사회참여 봉사활동 연계","토론·발표에서 근거 제시 능력 세특 반영"]},
  {key:"사범", label:"사범", sub:"국어교육, 영어교육 등", color:"#3b82f6", score:4,
   tips:["영어 세특 — 원서 독해, 에세이 작성 역량","문학 세특 — 작품 해석, 감상문","멘토링·튜터링 활동 기록 (공감 리더십)"]},
  {key:"어문", label:"어문", sub:"언어, 영어 등", color:"#a855f7", score:4,
   tips:["영어 에세이·발표·토론 세특 집중 기록","외국 문학 원서 독서 기록","영자 신문부, 모의유엔 연계"]},
  {key:"인문", label:"인문", sub:"정치, 외교 등", color:"#06b6d4", score:4,
   tips:["국제 이슈 분석 탐구 활동","모의유엔(MUN), 국제 토론 대회","영어 역량 연계 필수"]},
  {key:"상경", label:"상경", sub:"경영, 경제 등", color:"#f59e0b", score:3,
   tips:["수학 내신 집중 관리 필수","시사 경제 이슈 탐구 보고서"]},
  {key:"생활과학", label:"생활과학", sub:"식품학, 의류학 등", color:"#f97316", score:2,
   tips:["과학 내신 보완 선행 필요","식품·환경·지속가능성 탐구 활동"]},
];

const SUBJECTS = ["국어","수학","영어","사회/국제","한국사","과학","문학"];
const SUBJECT_COLORS: Record<string,string> = {
  "국어":"#a855f7","수학":"#a855f7","영어":"#22c55e",
  "사회/국제":"#22c55e","한국사":"#f59e0b","과학":"#ef4444","문학":"#a855f7"
};

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
const emptyExtra = ():Omit<StudentExtra,"id"|"student_no"> => ({
  address:"",commute:"",shuttle:"",sleep_time:"",wake_time:"",life_pattern:"",
  family_members:"[]",grades:"{}",
  habit_goal_daily:"",habit_goal_exam:"",
  selected_field:"",field_note:"",
  class_opinion:"",
});

// 성적 막대 색상
function gradeColor(v: number) {
  if(!v) return "#e5e7eb";
  if(v<=2) return "#22c55e";
  if(v===3) return "#f59e0b";
  return "#ef4444";
}
function gradeBadgeStyle(v: number): React.CSSProperties {
  if(!v) return {background:"#f3f4f6",color:"#9ca3af"};
  if(v<=2) return {background:"#dcfce7",color:"#15803d"};
  if(v===3) return {background:"#fef9c3",color:"#854d0e"};
  return {background:"#fee2e2",color:"#991b1b"};
}

export default function TeacherOnlyPage() {
  const [authed,setAuthed]=useState(false);
  const [pw,setPw]=useState("");
  const [pwErr,setPwErr]=useState(false);
  const [view,setView]=useState<"dash"|"student"|"form"|"class">("dash");
  const [logs,setLogs]=useState<CounselingLog[]>([]);
  const [subs,setSubs]=useState<Submission[]>([]);
  const [walls,setWalls]=useState<WallPost[]>([]);
  const [notes,setNotes]=useState<TeacherNote[]>([]);
  const [ais,setAis]=useState<AiSummary[]>([]);
  const [extras,setExtras]=useState<StudentExtra[]>([]);
  const [loading,setLoading]=useState(false);
  const [sel,setSel]=useState<Student|null>(null);
  const [tab,setTab]=useState<"overview"|"survey"|"log"|"gb"|"ai"|"extra">("overview");
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

  // extra 로컬 편집 상태
  const [extraForm,setExtraForm]=useState(emptyExtra());
  const [extraSaving,setExtraSaving]=useState(false);
  // 성적 로컬 상태
  const [grades,setGrades]=useState<Record<string,number>>({});
  // 가족 구성원 로컬 상태
  const [familyRows,setFamilyRows]=useState<{rel:string;name:string;job:string;note:string}[]>([
    {rel:"아버지",name:"",job:"",note:""},{rel:"어머니",name:"",job:"",note:""}
  ]);
  // 학급 분위기 (class view)
  const [classVibe,setClassVibe]=useState<string[]>([]);
  const [classImprove,setClassImprove]=useState<string[]>([]);
  const [classMemo,setClassMemo]=useState("");
  const [classOpinions,setClassOpinions]=useState<Record<string,string>>({});
  const [classOpinionOpen,setClassOpinionOpen]=useState<Record<string,boolean>>({});
  const [classSaving,setClassSaving]=useState(false);

  function login(){
    if(pw===TEACHER_PW){setAuthed(true);loadAll();}
    else{setPwErr(true);setPw("");setTimeout(()=>setPwErr(false),1500);}
  }

  async function loadAll(){
    setLoading(true);
    const [a,b,c,d,e,f]=await Promise.all([
      supabase.from("counseling_logs").select("*").order("date",{ascending:false}),
      supabase.from("counseling_submissions").select("*").order("created_at",{ascending:false}),
      supabase.from("wall_posts").select("id,author_name,content,created_at").order("created_at"),
      supabase.from("teacher_notes").select("*"),
      supabase.from("ai_summaries").select("*").order("created_at",{ascending:false}),
      supabase.from("student_extras").select("*"),
    ]);
    setLogs((a.data as CounselingLog[])??[]);
    setWalls((c.data as WallPost[])??[]);
    setNotes((d.data as TeacherNote[])??[]);
    setAis((e.data as AiSummary[])??[]);
    setExtras((f.data as StudentExtra[])??[]);
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
  subs.forEach(s=>{if(s.payload?.studentNo)subMap[s.payload.studentNo]=s;});
  const subByName:Record<string,Submission>={};
  subs.forEach(s=>{if(s.payload?.name)subByName[s.payload.name]=s;});
  const wallMap:Record<string,WallPost>={};
  walls.forEach(w=>{wallMap[w.author_name]=w;});
  const noteMap:Record<string,TeacherNote>={};
  notes.forEach(n=>{noteMap[n.student_no]=n;});
  const aiMap:Record<string,AiSummary>={};
  ais.forEach(a=>{aiMap[a.student_no]=a;});
  const extraMap:Record<string,StudentExtra>={};
  extras.forEach(e=>{extraMap[e.student_no]=e;});

  function openStu(s:Student){
    setSel(s);
    setNoteText(noteMap[s.student_no]?.content??"");
    setTab("overview");
    setAiResult("");setQResult("");setGbParsed(null);setGbFile(null);
    // extra 로드
    const ex=extraMap[s.student_no];
    if(ex){
      setExtraForm({
        address:ex.address??"",commute:ex.commute??"",shuttle:ex.shuttle??"",
        sleep_time:ex.sleep_time??"",wake_time:ex.wake_time??"",life_pattern:ex.life_pattern??"",
        family_members:ex.family_members??"[]",grades:ex.grades??"{}",
        habit_goal_daily:ex.habit_goal_daily??"",habit_goal_exam:ex.habit_goal_exam??"",
        selected_field:ex.selected_field??"",field_note:ex.field_note??"",
        class_opinion:ex.class_opinion??"",
      });
      try{setGrades(JSON.parse(ex.grades??"{}"));}catch{setGrades({});}
      try{setFamilyRows(JSON.parse(ex.family_members??"[]"));}catch{setFamilyRows([{rel:"아버지",name:"",job:"",note:""},{rel:"어머니",name:"",job:"",note:""}]);}
    } else {
      setExtraForm(emptyExtra());
      setGrades({});
      setFamilyRows([{rel:"아버지",name:"",job:"",note:""},{rel:"어머니",name:"",job:"",note:""}]);
    }
    setView("student");
  }

  async function saveExtra(){
    if(!sel)return;
    setExtraSaving(true);
    const payload={
      student_no:sel.student_no,
      ...extraForm,
      grades:JSON.stringify(grades),
      family_members:JSON.stringify(familyRows),
      updated_at:new Date().toISOString(),
    };
    const ex=extraMap[sel.student_no];
    if(ex) await supabase.from("student_extras").update(payload).eq("id",ex.id);
    else await supabase.from("student_extras").insert(payload);
    await loadAll();
    setExtraSaving(false);
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

  // ── 학급 전체 뷰 ──
  if(view==="class")return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <button onClick={()=>setView("dash")} className="hy-btn" style={{fontSize:13}}>← 대시보드</button>
        <h2 style={{fontSize:18,fontWeight:900,color:"var(--text)",margin:0}}>🏫 2학년 2반 학급 현황</h2>
      </div>

      {/* 분위기 체크 */}
      <div className="hy-card" style={{padding:"20px 22px"}}>
        <p style={{fontSize:13,fontWeight:900,color:"var(--text)",margin:"0 0 12px"}}>🌡️ 학급 분위기 파악</p>
        <p style={{fontSize:11,fontWeight:700,color:"var(--text-muted)",margin:"0 0 8px"}}>전반적인 분위기</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
          {["전반적으로 밝은 편","조용하고 차분함","시끄럽고 산만함","친한 무리끼리 나뉨","경쟁적 분위기","서로 잘 도와줌","소외되는 친구가 있는 것 같음","잘 모르겠음"].map(v=>(
            <button key={v} onClick={()=>setClassVibe(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v])}
              style={{padding:"7px 13px",borderRadius:999,border:"1.5px solid",fontFamily:"inherit",cursor:"pointer",fontSize:12,fontWeight:700,
                borderColor:classVibe.includes(v)?"#6366f1":"var(--border)",
                background:classVibe.includes(v)?"#eef2ff":"#fafafa",
                color:classVibe.includes(v)?"#4338ca":"var(--text-muted)"}}>
              {v}
            </button>
          ))}
        </div>
        <p style={{fontSize:11,fontWeight:700,color:"var(--text-muted)",margin:"0 0 8px"}}>개선됐으면 하는 부분</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
          {["수업 중 집중도","서로 배려하는 분위기","청소·정리정돈","쉬는 시간 소란스러움","특정 친구 사이 갈등","없음 / 모르겠음"].map(v=>(
            <button key={v} onClick={()=>setClassImprove(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v])}
              style={{padding:"7px 13px",borderRadius:999,border:"1.5px solid",fontFamily:"inherit",cursor:"pointer",fontSize:12,fontWeight:700,
                borderColor:classImprove.includes(v)?"#f97316":"var(--border)",
                background:classImprove.includes(v)?"#fff7ed":"#fafafa",
                color:classImprove.includes(v)?"#c2410c":"var(--text-muted)"}}>
              {v}
            </button>
          ))}
        </div>
        <p style={{fontSize:11,fontWeight:700,color:"var(--text-muted)",margin:"0 0 6px"}}>담임 종합 메모</p>
        <textarea value={classMemo} onChange={e=>setClassMemo(e.target.value)} className="hy-input" style={{minHeight:80,resize:"vertical"}} placeholder="학급 분위기 전반, 특이 관계, 집단 역동, 개입 필요 사항..."/>
        <button onClick={()=>setClassSaving(false)} className="hy-btn hy-btn-primary" style={{marginTop:8,fontSize:12}}>저장</button>
      </div>

      {/* 학생별 의견 — 비공개 */}
      <div className="hy-card" style={{padding:"20px 22px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <p style={{fontSize:13,fontWeight:900,color:"var(--text)",margin:0}}>🔒 학생별 학급 의견</p>
          <span style={{fontSize:10,padding:"2px 8px",borderRadius:999,background:"#fee2e2",color:"#991b1b",fontWeight:700,border:"1px solid #fecaca"}}>교사만 열람</span>
        </div>
        <p style={{fontSize:11,color:"var(--text-subtle)",fontWeight:600,margin:"0 0 12px"}}>상담 중 이 학생이 학급에 대해 말한 내용 — 이름을 누르면 펼쳐요</p>
        {STUDENTS.map(s=>(
          <div key={s.student_no} style={{border:"1px solid var(--border)",borderRadius:12,marginBottom:6,overflow:"hidden"}}>
            <button onClick={()=>setClassOpinionOpen(p=>({...p,[s.student_no]:!p[s.student_no]}))}
              style={{width:"100%",padding:"10px 14px",background:"#f9fafb",border:"none",cursor:"pointer",fontFamily:"inherit",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{s.name} <span style={{fontSize:11,color:"var(--text-subtle)",fontWeight:500}}>{s.student_no}</span></span>
              <span style={{fontSize:11,color:"var(--text-subtle)"}}>{classOpinionOpen[s.student_no]?"접기 ▲":"펼치기 ▼"}</span>
            </button>
            {classOpinionOpen[s.student_no]&&(
              <div style={{padding:"10px 14px"}}>
                <textarea
                  value={classOpinions[s.student_no]??""}
                  onChange={e=>setClassOpinions(p=>({...p,[s.student_no]:e.target.value}))}
                  className="hy-input"
                  style={{minHeight:64,resize:"vertical",fontSize:13}}
                  placeholder="이 학생이 학급에 대해 말한 내용, 분위기 체감, 건의사항..."/>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 상담 현황 */}
      <div className="hy-card" style={{padding:"20px 22px"}}>
        <p style={{fontSize:13,fontWeight:900,color:"var(--text)",margin:"0 0 12px"}}>📋 상담 현황</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(108px,1fr))",gap:8}}>
          {STUDENTS.map(s=>{
            const cnt=logMap[s.student_no]?.length??0;
            const latest=logMap[s.student_no]?.[0];
            const lc=CATS.find(c=>c.key===latest?.category);
            const hasSub=!!(subMap[s.student_no]??subByName[s.name]);
            return(
              <button key={s.student_no} onClick={()=>openStu(s)}
                style={{padding:"12px 8px",borderRadius:12,border:"1.5px solid",
                  borderColor:cnt>0?(lc?.color??"var(--primary)")+"55":"var(--border)",
                  background:cnt>0?(lc?.color??"#a855f7")+"0d":"#fafafa",
                  cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>
                <p style={{fontSize:13,fontWeight:900,color:"var(--text)",margin:"0 0 3px"}}>{s.name}</p>
                <p style={{fontSize:11,fontWeight:700,margin:0,color:cnt>0?(lc?.color??"var(--primary)"):"var(--text-subtle)"}}>
                  {cnt>0?`상담 ${cnt}회`:"미상담"}
                </p>
                {hasSub&&<span style={{fontSize:10}}>📋</span>}
              </button>
            );
          })}
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
    const selField=FIELDS.find(f=>f.key===extraForm.selected_field);

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

        {/* 탭 */}
        <div style={{display:"flex",background:"#f3f4f6",borderRadius:14,padding:4,gap:3,overflowX:"auto"}}>
          {([
            {key:"overview",label:"⚡ 한눈에"},
            {key:"survey",label:"📋 학생 설문"},
            {key:"extra",label:"📌 상담 입력"},
            {key:"log",label:"💬 상담 기록"},
            {key:"gb",label:"📝 생기부"},
            {key:"ai",label:"🤖 AI 요약"},
          ] as const).map(t=>(
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

        {/* ── 한눈에 ── */}
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

            <div className="hy-card" style={{padding:"16px 20px"}}>
              <p style={{fontSize:12,fontWeight:800,color:"var(--text-muted)",margin:"0 0 8px"}}>📌 교사 메모</p>
              <textarea placeholder="첫인상, 특이사항, 기억해 둘 것 등" value={noteText} onChange={e=>setNoteText(e.target.value)} className="hy-input" style={{minHeight:80,resize:"vertical"}}/>
              <button onClick={saveNote} disabled={noteSaving} className="hy-btn hy-btn-primary" style={{marginTop:8,fontSize:12}}>{noteSaving?"저장 중...":"저장"}</button>
            </div>
          </div>
        )}

        {/* ── 학생 설문 ── */}
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

        {/* ── 📌 상담 입력 (교사 전용) ── */}
        {tab==="extra"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>

            {/* 생활 정보 */}
            <div className="hy-card" style={{padding:"20px 22px"}}>
              <p style={{fontSize:13,fontWeight:900,color:"var(--text)",margin:"0 0 14px"}}>🏠 생활 정보</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:"var(--text-muted)",display:"block",marginBottom:4}}>주소 / 거주지</label>
                  <input value={extraForm.address} onChange={e=>setExtraForm(f=>({...f,address:e.target.value}))} className="hy-input" placeholder="예: 강남구 ○○동"/>
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:"var(--text-muted)",display:"block",marginBottom:4}}>등교 방법</label>
                  <select value={extraForm.commute} onChange={e=>setExtraForm(f=>({...f,commute:e.target.value}))} className="hy-input" style={{cursor:"pointer"}}>
                    <option value="">선택</option>
                    {["도보","자전거","대중교통","학교 셔틀","학원 셔틀 연계","부모님 차","기타"].map(v=><option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:"var(--text-muted)",display:"block",marginBottom:4}}>셔틀 이용</label>
                  <select value={extraForm.shuttle} onChange={e=>setExtraForm(f=>({...f,shuttle:e.target.value}))} className="hy-input" style={{cursor:"pointer"}}>
                    <option value="">선택</option>
                    {["학교 셔틀 이용","학원 셔틀 이용","둘 다 이용","이용 안 함"].map(v=><option key={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:"var(--text-muted)",display:"block",marginBottom:4}}>취침 시간</label>
                  <input value={extraForm.sleep_time} onChange={e=>setExtraForm(f=>({...f,sleep_time:e.target.value}))} className="hy-input" placeholder="예: 새벽 1~2시"/>
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:"var(--text-muted)",display:"block",marginBottom:4}}>기상 시간</label>
                  <input value={extraForm.wake_time} onChange={e=>setExtraForm(f=>({...f,wake_time:e.target.value}))} className="hy-input" placeholder="예: 오전 7시"/>
                </div>
                <div style={{gridColumn:"1/-1"}}>
                  <label style={{fontSize:11,fontWeight:700,color:"var(--text-muted)",display:"block",marginBottom:4}}>기타 생활 패턴</label>
                  <textarea value={extraForm.life_pattern} onChange={e=>setExtraForm(f=>({...f,life_pattern:e.target.value}))} className="hy-input" style={{minHeight:56,resize:"vertical"}} placeholder="방과 후 학원, 귀가 시간, 주말 루틴 등"/>
                </div>
              </div>
            </div>

            {/* 가족 구성원 */}
            <div className="hy-card" style={{padding:"20px 22px"}}>
              <p style={{fontSize:13,fontWeight:900,color:"var(--text)",margin:"0 0 12px"}}>👨‍👩‍👧 가족 구성원</p>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead>
                    <tr>{["관계","이름 (선택)","직업/학교","특이사항"].map(h=>(
                      <th key={h} style={{fontSize:11,fontWeight:700,color:"var(--text-muted)",textAlign:"left",padding:"4px 8px",borderBottom:"1px solid var(--border)"}}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {familyRows.map((row,i)=>(
                      <tr key={i}>
                        {(["rel","name","job","note"] as const).map(k=>(
                          <td key={k} style={{padding:"4px 6px"}}>
                            <input value={row[k]} onChange={e=>setFamilyRows(p=>p.map((r,j)=>j===i?{...r,[k]:e.target.value}:r))}
                              className="hy-input" style={{fontSize:12,padding:"5px 8px"}} placeholder={k==="rel"?"관계":k==="name"?"이름":k==="job"?"직업 등":"메모"}/>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={()=>setFamilyRows(p=>[...p,{rel:"",name:"",job:"",note:""}])}
                style={{marginTop:8,fontSize:12,padding:"5px 12px",borderRadius:999,border:"1px solid var(--border)",background:"transparent",cursor:"pointer",fontFamily:"inherit",color:"var(--text-muted)"}}>
                + 구성원 추가
              </button>
            </div>

            {/* 성적 — 5등급제 */}
            <div className="hy-card" style={{padding:"20px 22px"}}>
              <p style={{fontSize:13,fontWeight:900,color:"var(--text)",margin:"0 0 4px"}}>📈 성적 (5등급제)</p>
              <p style={{fontSize:11,color:"var(--text-subtle)",fontWeight:600,margin:"0 0 12px"}}>1~5 입력 · 1–2등급 초록 · 3등급 노랑 · 4–5등급 빨강</p>
              {SUBJECTS.map(sub=>{
                const v=grades[sub]??0;
                const pct=v?Math.round((5-v)/4*100):0;
                return(
                  <div key={sub} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:"1px solid #f3f4f6"}}>
                    <span style={{minWidth:70,fontSize:13,color:"var(--text-muted)"}}>{sub}</span>
                    <input type="number" min={1} max={5} value={v||""} placeholder="—"
                      onChange={e=>{const n=parseInt(e.target.value);setGrades(p=>({...p,[sub]:isNaN(n)?0:Math.min(5,Math.max(1,n))}));}}
                      style={{width:50,fontSize:13,padding:"4px 8px",borderRadius:8,border:"1.5px solid var(--border)",textAlign:"center",fontFamily:"inherit",background:"#fafafa"}}/>
                    <div style={{flex:1,height:6,background:"#f3f4f6",borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:gradeColor(v),borderRadius:3,transition:"width 0.3s"}}/>
                    </div>
                    {v>0&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:999,fontWeight:700,...gradeBadgeStyle(v)}}>{v}등급</span>}
                  </div>
                );
              })}
              {/* 자동 분석 */}
              {Object.values(grades).some(v=>v>0)&&(
                <div style={{marginTop:10,padding:"12px 14px",borderRadius:12,background:"#f8fffe",border:"1px solid #d1fae5"}}>
                  {Object.entries(grades).filter(([,v])=>v>0&&v<=2).length>0&&(
                    <p style={{fontSize:12,margin:"0 0 4px"}}><span style={{fontWeight:700,color:"#15803d"}}>강점 (1–2등급)</span> {Object.entries(grades).filter(([,v])=>v>0&&v<=2).map(([k])=>k).join(", ")} → 진로 연계 세특 집중 투자 권장</p>
                  )}
                  {Object.entries(grades).filter(([,v])=>v>=4).length>0&&(
                    <p style={{fontSize:12,margin:0}}><span style={{fontWeight:700,color:"#991b1b"}}>관리 필요 (4–5등급)</span> {Object.entries(grades).filter(([,v])=>v>=4).map(([k])=>k).join(", ")} → 그날 수업 당일 복습 루틴부터</p>
                  )}
                </div>
              )}
            </div>

            {/* 학습 태도 & 실천력 */}
            <div className="hy-card" style={{padding:"20px 22px"}}>
              <p style={{fontSize:13,fontWeight:900,color:"var(--text)",margin:"0 0 4px"}}>💪 학습 태도 & 실천력</p>
              <div style={{padding:"10px 14px",borderRadius:12,background:"#eff6ff",border:"1px solid #bfdbfe",marginBottom:12}}>
                <p style={{fontSize:12,fontWeight:700,color:"#1d4ed8",margin:"0 0 3px"}}>담임 관찰 포인트</p>
                <p style={{fontSize:12,color:"#1e40af",margin:0,lineHeight:1.7}}>성적을 올리고 싶은 마음은 있으나 실천으로 연결이 약한 편. "어차피 다른 아이들과 나는 다르다"는 자기한계 인식 경향. <b>그날 수업 당일 소화 — 평소 습관과 태도</b>가 핵심.</p>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:"var(--text-muted)",display:"block",marginBottom:4}}>매일 할 수 있는 딱 하나 (학생이 직접 적음)</label>
                  <input value={extraForm.habit_goal_daily} onChange={e=>setExtraForm(f=>({...f,habit_goal_daily:e.target.value}))} className="hy-input" placeholder="예: 수업 끝나고 10분 안에 필기 정리하기"/>
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:"var(--text-muted)",display:"block",marginBottom:4}}>시험 기간에 추가로 할 것</label>
                  <input value={extraForm.habit_goal_exam} onChange={e=>setExtraForm(f=>({...f,habit_goal_exam:e.target.value}))} className="hy-input" placeholder="예: 2주 전부터 단원별 문제 1회독"/>
                </div>
              </div>
            </div>

            {/* 진로 계열 분석 */}
            <div className="hy-card" style={{padding:"20px 22px"}}>
              <p style={{fontSize:13,fontWeight:900,color:"var(--text)",margin:"0 0 4px"}}>🎯 진로 계열 분석</p>
              <p style={{fontSize:11,color:"var(--text-subtle)",fontWeight:600,margin:"0 0 12px"}}>계열 선택 시 생기부 강화 포인트가 나타납니다</p>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
                {FIELDS.map(f=>(
                  <button key={f.key} onClick={()=>setExtraForm(p=>({...p,selected_field:p.selected_field===f.key?"":f.key}))}
                    style={{padding:"10px 8px",borderRadius:12,border:"1.5px solid",fontFamily:"inherit",cursor:"pointer",textAlign:"left",
                      borderColor:extraForm.selected_field===f.key?f.color:"var(--border)",
                      background:extraForm.selected_field===f.key?f.color+"15":"#fafafa"}}>
                    <p style={{fontSize:12,fontWeight:700,color:extraForm.selected_field===f.key?f.color:"var(--text)",margin:"0 0 2px"}}>{f.label}</p>
                    <p style={{fontSize:10,color:"var(--text-subtle)",margin:"0 0 4px"}}>{f.sub}</p>
                    <p style={{fontSize:12,margin:0,color:f.color}}>{"★".repeat(f.score)}{"☆".repeat(5-f.score)}</p>
                  </button>
                ))}
              </div>
              {selField&&(
                <div style={{padding:"12px 14px",borderRadius:12,background:"#f9fafb",border:`1.5px solid ${selField.color}33`,marginBottom:10}}>
                  <p style={{fontSize:12,fontWeight:900,color:selField.color,margin:"0 0 6px"}}>{selField.label} 계열 — 생기부 강화 포인트</p>
                  <ul style={{paddingLeft:16,margin:0}}>
                    {selField.tips.map((t,i)=><li key={i} style={{fontSize:12,color:"var(--text)",marginBottom:3,lineHeight:1.6}}>{t}</li>)}
                  </ul>
                </div>
              )}
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"var(--text-muted)",display:"block",marginBottom:4}}>계열 상담 메모</label>
                <textarea value={extraForm.field_note} onChange={e=>setExtraForm(f=>({...f,field_note:e.target.value}))} className="hy-input" style={{minHeight:60,resize:"vertical"}} placeholder="학생이 관심 보인 계열, 반응, 탐색 방향..."/>
              </div>
            </div>

            {/* 저장 버튼 */}
            <button onClick={saveExtra} disabled={extraSaving} className="hy-btn hy-btn-primary" style={{fontSize:14,padding:"14px"}}>
              {extraSaving?"저장 중...":"💾 전체 저장"}
            </button>
          </div>
        )}

        {/* ── 상담 기록 ── */}
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

        {/* ── 생기부 ── */}
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
                <button onClick={runGbParse} disabled={gbLoading||!gbFile} className="hy-btn hy-btn-primary" style={{fontSize:13,opacity:!gbFile?0.5:1,flexShrink:0}}>
                  {gbLoading?"파싱 중... ✨":"분석하기"}
                </button>
              </div>
            </div>
            {gbParsed&&(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {([{key:"jaeyul",label:"자율활동",color:"#3b82f6",emoji:"🏫"},{key:"dongari",label:"동아리활동",color:"#a855f7",emoji:"🎭"},{key:"bongsa",label:"봉사활동",color:"#22c55e",emoji:"🤲"},{key:"jinro",label:"진로활동",color:"#f97316",emoji:"🎯"},{key:"haengbal",label:"행동특성 및 종합의견",color:"#ec4899",emoji:"💎"},{key:"extra",label:"교과세특 특이사항",color:"#06b6d4",emoji:"📚"}] as const).map(item=>{
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
                <p style={{fontSize:12,fontWeight:800,color:"#5b21b6",margin:"0 0 8px"}}>🤖 이전 저장된 AI 요약</p>
                <p style={{fontSize:13,color:"var(--text)",lineHeight:1.85,margin:0,whiteSpace:"pre-wrap"}}>{selAi.summary}</p>
              </div>
            )}
          </div>
        )}

        {/* ── AI 요약 ── */}
        {tab==="ai"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div className="hy-card" style={{padding:"22px 24px"}}>
              <p style={{fontSize:13,fontWeight:900,color:"var(--text)",margin:"0 0 6px"}}>🤖 종합 AI 요약</p>
              <p style={{fontSize:12,color:"var(--text-subtle)",fontWeight:600,margin:"0 0 14px"}}>설문+상담기록+메모{gbParsed?" + 생기부(업로드됨 ✅)":""} 를 종합 요약</p>
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
                <p style={{fontSize:12,fontWeight:900,color:"#5b21b6",margin:"0 0 10px"}}>✨ AI 요약 결과</p>
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
          <div style={{display:"flex",gap:8",flexDirection:"column",alignItems:"flex-end"}}>
            <button onClick={()=>setView("class")}
              style={{padding:"8px 16px",borderRadius:999,border:"1.5px solid rgba(255,255,255,0.3)",background:"rgba(255,255,255,0.1)",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              🏫 학급 전체 보기
            </button>
            <button onClick={()=>{setAuthed(false);setPw("");}}
              style={{padding:"8px 14px",borderRadius:999,border:"1.5px solid rgba(255,255,255,0.2)",background:"transparent",color:"rgba(255,255,255,0.5)",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              나가기
            </button>
          </div>
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
            const hasExtra=!!extraMap[s.student_no];
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
                  {hasExtra&&<span title="상담입력" style={{fontSize:10}}>✏️</span>}
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
