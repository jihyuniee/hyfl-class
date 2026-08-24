import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const teacherPassword = process.env.TEACHER_PW;

    if (!teacherPassword || password !== teacherPassword) {
      return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data, error } = await supabase
      .from("praise_posts")
      .select("id,created_at,type,from_name,to_name,category,content")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "기록을 불러오지 못했습니다." }, { status: 500 });
    }
    return NextResponse.json({ records: data ?? [] });
  } catch {
    return NextResponse.json({ error: "요청을 처리하지 못했습니다." }, { status: 400 });
  }
}
