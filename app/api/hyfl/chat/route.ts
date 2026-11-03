/**
 * /api/hyfl/chat  — 비스트리밍 채팅 (폴백용)
 * 스트리밍이 필요하면 /api/hyfl/stream 사용.
 *
 * POST Body:
 *   team_id   : string
 *   team_name : string
 *   messages  : { role: "user"|"assistant", content: string }[]
 *   state     : { stage, problem_statement, data_sources } | null
 *
 * Supabase 테이블 DDL (최초 1회):
 * ──────────────────────────────────────────────────────────
 * CREATE TABLE hyfl_teams (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   team_name TEXT NOT NULL,
 *   team_code TEXT UNIQUE NOT NULL,
 *   members   TEXT NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * CREATE TABLE hyfl_team_state (
 *   id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   team_id           UUID UNIQUE REFERENCES hyfl_teams(id) ON DELETE CASCADE,
 *   stage             TEXT NOT NULL DEFAULT 'start',
 *   problem_statement TEXT,
 *   data_sources      JSONB DEFAULT '[]',
 *   notes             TEXT,
 *   updated_at        TIMESTAMPTZ DEFAULT NOW()
 * );
 * CREATE TABLE hyfl_chat_messages (
 *   id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   team_id UUID REFERENCES hyfl_teams(id) ON DELETE CASCADE,
 *   role    TEXT NOT NULL CHECK (role IN ('user','assistant')),
 *   content TEXT NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * ──────────────────────────────────────────────────────────
 * 환경 변수:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ANTHROPIC_API_KEY
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ── 단계 라벨 ──────────────────────────────────────────────
export const STAGE_LABELS: Record<string, string> = {
  start:        "🚀 시작 단계",
  problem:      "🔍 문제 정의 중",
  problem_done: "✅ 문제 정의 완료",
  data_search:  "🔎 데이터 탐색 중",
  data_found:   "📊 데이터 확보 완료",
  analysis:     "⚙️ 분석 진행 중",
  presentation: "🎤 발표 준비",
};

// ── 단계별 다음 행동 힌트 (홈 화면 표시용) ──────────────────
export const NEXT_STEP_HINTS: Record<string, string> = {
  start:        "지금 어느 단계에서 막혔나요? 막힌 상황을 AI 코치에게 먼저 설명해보세요.",
  problem:      "문제를 숫자로 표현하면 어떤 숫자가 필요할까요? AI 코치에게 물어보세요.",
  problem_done: "학교알리미나 data.go.kr에서 어떤 키워드로 검색해봤나요?",
  data_search:  "찾은 파일이 CSV인가요, XLSX인가요? 직접 열어봤나요?",
  data_found:   "이 데이터에서 가장 높은 값과 낮은 값이 뭔지 찾아봤나요?",
  analysis:     "발견한 패턴을 알면 누가 가장 도움받을 것 같나요?",
  presentation: "지금까지 완성한 것이 뭐고, 아직 안 한 것이 뭔가요?",
};

// ── 시스템 프롬프트 빌더 ────────────────────────────────────
interface TeamState {
  stage?: string;
  problem_statement?: string | null;
  data_sources?: string[];
}

export function buildSystemPrompt(state: TeamState | null, teamName: string): string {
  const stage = state?.stage ?? "start";
  const problem = state?.problem_statement;
  const sources = state?.data_sources ?? [];

  return `당신은 제8회 교육 공공데이터 AI활용대회를 준비하는 고등학생 팀의 학습 코치입니다.

【팀 현황】
팀명: ${teamName}
현재 단계: ${STAGE_LABELS[stage] ?? stage}
${problem ? `문제 정의: ${problem}` : "문제 정의: 아직 미완성"}
${sources.length > 0 ? `확보 데이터: ${sources.join(", ")}` : "데이터: 아직 탐색 중"}

【절대 하지 말 것】
- 데이터를 직접 찾아주지 말 것
- 아이디어를 먼저 제안하지 말 것
- 분석 결과를 먼저 해석해주지 말 것
- "~해줘"로 끝나는 요청에 바로 답하지 말 것

【대신 이렇게 할 것】
- 학생이 먼저 생각을 말하도록 질문으로 유도
- 막히는 지점마다 힌트를 단계적으로 제공
- 학생의 답변을 듣고 그 다음 질문을 던짐
- 잘못된 방향일 때 바로 정정하지 말고 "왜 그렇게 생각했어요?"로 재질문

【막히는 8개 지점별 대응】
1. 문제를 못 찾을 때 → "학교생활에서 가장 불편한 것 3가지만 말해봐요"
2. 데이터 연결 모를 때 → "그 문제를 숫자로 표현할 수 있나요? 어떤 숫자가 필요할까요?"
3. 포털 탐색 어려울 때 → "학교알리미에서 어떤 키워드로 검색해봤나요?"
4. 파일 형식 모를 때 → "CSV와 XLSX 중 어떤 파일을 찾았나요? 열어봤나요?"
5. 분석 방법 모를 때 → "이 데이터에서 가장 높은 값과 낮은 값이 뭔지 찾아봤나요?"
6. AI 서비스 기획 모를 때 → "발견한 패턴을 알면 누가 가장 도움받을 것 같아요?"
7. 플랫폼 사용법 모를 때 → "플랫폼에서 지금 몇 단계에 있나요? 그 단계에서 뭘 해야 하는지 읽어봤나요?"
8. 전체 흐름 모를 때 → "지금까지 완성한 것이 뭐고, 아직 안 한 것이 뭔가요?"

【대화 시작 멘트】
첫 메시지일 때는 반드시: "안녕하세요! 지금 어느 단계에서 막혔나요? 막힌 상황을 먼저 설명해주면 같이 생각해볼게요."`.trim();
}

// ── POST handler ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { team_id, team_name, messages, state } = await req.json();

  if (!messages?.length) {
    return NextResponse.json({ error: "messages가 필요합니다" }, { status: 400 });
  }

  const systemPrompt = buildSystemPrompt(state, team_name ?? "팀");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.slice(-20),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `AI 오류: ${err}` }, { status: res.status });
  }

  const data = await res.json();
  const reply: string = data.content?.[0]?.text ?? "";

  if (team_id && reply) {
    const userMsg = messages[messages.length - 1];
    await db.from("hyfl_chat_messages").insert([
      { team_id, role: "user",      content: userMsg.content },
      { team_id, role: "assistant", content: reply },
    ]);
  }

  return NextResponse.json({ message: reply });
}
