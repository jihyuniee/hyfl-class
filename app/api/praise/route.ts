import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const STUDENTS = new Set([
  "강지우","김은솔","김태현","김하연","김혜민","박민석","박우진","성연준",
  "손정연","송민주","심지안","양효승","유다현","윤혜림","이승지","이시원",
  "이조은","장지현","전주하","정은지","주보민","최인아","현서정",
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body.type === "friend" ? "friend" : body.type === "self" ? "self" : null;
    const fromName = typeof body.from_name === "string" ? body.from_name.trim() : "";
    const toName = typeof body.to_name === "string" ? body.to_name.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!type || !STUDENTS.has(fromName)) {
      return NextResponse.json({ error: "작성자 이름을 확인해주세요." }, { status: 400 });
    }
    if (type === "friend" && !STUDENTS.has(toName)) {
      return NextResponse.json({ error: "친구 이름을 확인해주세요." }, { status: 400 });
    }
    if (!category || !content) {
      return NextResponse.json({ error: "분류와 내용을 모두 입력해주세요." }, { status: 400 });
    }
    if (content.length > 2000) {
      return NextResponse.json({ error: "내용은 2,000자 이내로 작성해주세요." }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { error } = await supabase.from("praise_posts").insert({
      type,
      from_name: fromName,
      to_name: type === "friend" ? toName : null,
      category,
      content,
      likes: 0,
    });

    if (error) {
      return NextResponse.json({ error: "저장하지 못했습니다. 잠시 후 다시 시도해주세요." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "요청을 처리하지 못했습니다." }, { status: 400 });
  }
}
