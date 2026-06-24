import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ADMIN_PW = "hyfl2025";

export async function POST(req: NextRequest) {
  const { id, code, adminPw } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id가 필요합니다" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: resource, error: fetchError } = await supabase
    .from("mentor_resources")
    .select("delete_code, file_url")
    .eq("id", id)
    .single();

  if (fetchError || !resource) {
    return NextResponse.json({ error: "자료를 찾을 수 없습니다" }, { status: 404 });
  }

  const isAdmin = adminPw === ADMIN_PW;
  const codeMatches = !!resource.delete_code && code === resource.delete_code;
  if (!isAdmin && !codeMatches) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  if (resource.file_url) {
    const path = resource.file_url.split("/uploads/")[1];
    if (path) await supabase.storage.from("uploads").remove([path]);
  }
  await supabase.from("resource_comments").delete().eq("resource_id", id);
  const { error: deleteError } = await supabase.from("mentor_resources").delete().eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
