import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const photoTag = "길동사진컨테스트2026";
const commentTag = "길동댓글2026";
export const dynamic = "force-dynamic";
function configured() {
  return Boolean(process.env.TEACHER_PW && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
}
export async function GET() {
  return NextResponse.json({ deletionAvailable: configured() }, { headers: { "Cache-Control": "no-store" } });
}
export async function DELETE(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (!origin || new URL(origin).host !== request.headers.get("host")) return NextResponse.json({ error: "이 페이지에서 다시 시도해 주세요." }, { status: 403 });
    if (!configured()) return NextResponse.json({ error: "교사 삭제 설정이 필요해요. 서버의 TEACHER_PW와 Supabase 관리자 키를 확인해 주세요." }, { status: 503 });
    const { id, password } = await request.json();
    const expected = Buffer.from(process.env.TEACHER_PW!);
    const entered = Buffer.from(typeof password === "string" ? password : "");
    if (expected.length !== entered.length || !timingSafeEqual(expected, entered)) return NextResponse.json({ error: "교사 비밀번호를 확인해 주세요." }, { status: 401 });
    if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "삭제할 게시글을 확인해 주세요." }, { status: 400 });
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
    const photo = await client.from("album_posts").select("id,image_url").eq("id", id).contains("tags", [photoTag]).maybeSingle();
    if (photo.error) return NextResponse.json({ error: "게시글을 확인하지 못했어요." }, { status: 500 });
    if (!photo.data) return NextResponse.json({ error: "이미 삭제됐거나 이 사진첩의 게시글이 아니에요." }, { status: 404 });
    const removed = await client.from("album_posts").delete().eq("id", id).contains("tags", [photoTag]).select("id");
    if (removed.error || !removed.data?.length) return NextResponse.json({ error: "게시글을 삭제하지 못했어요. 다시 시도해 주세요." }, { status: 500 });
    const comments = await client.from("album_posts").delete().contains("tags", [commentTag, `길동사진:${id}`]);
    let cleanupPending = Boolean(comments.error);
    const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "")}/storage/v1/object/public/uploads/`;
    if (photo.data.image_url?.startsWith(prefix)) {
      const path = decodeURIComponent(photo.data.image_url.slice(prefix.length));
      if (path.startsWith("gildong-2026/") && !path.includes("..")) {
        const file = await client.storage.from("uploads").remove([path]);
        cleanupPending ||= Boolean(file.error);
      }
    }
    return NextResponse.json({ ok: true, cleanupPending });
  } catch { return NextResponse.json({ error: "삭제 요청을 처리하지 못했어요. 다시 시도해 주세요." }, { status: 500 }); }
}
