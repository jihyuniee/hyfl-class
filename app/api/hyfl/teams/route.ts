/**
 * /api/hyfl/teams
 *
 * Supabase 테이블 DDL (최초 1회 실행):
 * ─────────────────────────────────────────────────────────────
 * CREATE TABLE hyfl_teams (
 *   id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   team_name  TEXT NOT NULL,
 *   team_code  TEXT UNIQUE NOT NULL,   -- 팀 로그인 코드
 *   members    TEXT NOT NULL,          -- 쉼표 구분 구성원
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * CREATE TABLE hyfl_team_state (
 *   id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   team_id           UUID UNIQUE REFERENCES hyfl_teams(id) ON DELETE CASCADE,
 *   stage             TEXT NOT NULL DEFAULT 'start',
 *   -- start | problem | problem_done | data_search | data_found | analysis | presentation
 *   problem_statement TEXT,
 *   data_sources      JSONB DEFAULT '[]',
 *   notes             TEXT,
 *   updated_at        TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * CREATE TABLE hyfl_chat_messages (
 *   id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   team_id    UUID REFERENCES hyfl_teams(id) ON DELETE CASCADE,
 *   role       TEXT NOT NULL CHECK (role IN ('user','assistant')),
 *   content    TEXT NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW()
 * );
 * ─────────────────────────────────────────────────────────────
 *
 * 환경 변수 필요:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (or NEXT_PUBLIC_SUPABASE_ANON_KEY fallback)
 *   ANTHROPIC_API_KEY
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * GET /api/hyfl/teams?code=XXX
 * 팀 코드로 로그인. team + state + 최근 대화 50개 반환
 */
export async function GET(req: NextRequest) {
  const db = getDb();
  const code = new URL(req.url).searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "code 파라미터가 필요합니다" }, { status: 400 });
  }

  const { data: team, error } = await db
    .from("hyfl_teams")
    .select("id, team_name, members, team_code")
    .eq("team_code", code.trim().toLowerCase())
    .single();

  if (error || !team) {
    return NextResponse.json(
      { error: "팀 코드를 찾을 수 없어요. 선생님께 확인해주세요." },
      { status: 404 }
    );
  }

  const [{ data: state }, { data: messages }] = await Promise.all([
    db
      .from("hyfl_team_state")
      .select("*")
      .eq("team_id", team.id)
      .maybeSingle(),
    db
      .from("hyfl_chat_messages")
      .select("id, role, content, created_at")
      .eq("team_id", team.id)
      .order("created_at", { ascending: true })
      .limit(50),
  ]);

  return NextResponse.json({
    team,
    state: state ?? null,
    messages: messages ?? [],
  });
}

/**
 * POST /api/hyfl/teams
 * 팀 상태(stage, problem_statement, data_sources, notes) 업서트
 *
 * Body: { team_id, stage, problem_statement?, data_sources?, notes? }
 */
export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { team_id, stage, problem_statement, data_sources, notes } = body;

  if (!team_id) {
    return NextResponse.json({ error: "team_id가 필요합니다" }, { status: 400 });
  }

  const { error } = await db.from("hyfl_team_state").upsert(
    {
      team_id,
      stage: stage ?? "start",
      problem_statement: problem_statement?.trim() || null,
      data_sources: data_sources ?? [],
      notes: notes?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "team_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
