import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const API_KEY     = "d0e1f3244a5247a19747ac74994fccfd";
const EDU_CODE    = "B10";
const SCHOOL_CODE = "B100000576";

function toYMD(date: Date) {
  return `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,"0")}${String(date.getDate()).padStart(2,"0")}`;
}
function toKSTDate() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
}
function parseMenu(raw: string) {
  return raw.replace(/<br\/>/g, "\n").replace(/\([0-9.]+\)/g, "").trim();
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today    = toKSTDate();
  const todayYMD = toYMD(today);
  const todayISO = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  const url = new URL("https://open.neis.go.kr/hub/mealServiceDietInfo");
  url.searchParams.set("KEY",                API_KEY);
  url.searchParams.set("Type",               "json");
  url.searchParams.set("ATPT_OFCDC_SC_CODE", EDU_CODE);
  url.searchParams.set("SD_SCHUL_CODE",      SCHOOL_CODE);
  url.searchParams.set("MLSV_YMD",           todayYMD);

  const res  = await fetch(url.toString());
  const data = await res.json();
  const rows = data.mealServiceDietInfo?.[1]?.row ?? [];

  if (!rows.length) {
    return NextResponse.json({ message: "오늘 급식 없음 (방학/휴일)" });
  }

  const inserted = [];
  for (const row of rows) {
    const type: "중식" | "석식" =
      row.MMEAL_SC_CODE === "2" ? "중식" :
      row.MMEAL_SC_CODE === "3" ? "석식" : null!;
    if (!type) continue;

    const { data: existing } = await supabase
      .from("meal_posts")
      .select("id")
      .eq("date", todayISO)
      .eq("type", type)
      .maybeSingle();

    if (existing) { inserted.push({ type, status: "이미 존재" }); continue; }

    await supabase.from("meal_posts").insert({
      date: todayISO, type, menu: parseMenu(row.DDISH_NM), author: "NEIS 자동",
    });
    inserted.push({ type, status: "저장됨" });
  }

  return NextResponse.json({ date: todayISO, results: inserted });
}
