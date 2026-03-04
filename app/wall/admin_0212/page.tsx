"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

const ADMIN_PASSWORD = "0212"; // 바꾸고 싶으면 여기만 바꾸면 됨

type WallPost = {
  id: string;
  created_at: string;
  author_name: string;
  title: string | null;
  content: string;
  is_public: boolean;
  image_urls: string[] | null;
};

function formatKST(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

function safePreview(content: string) {
  // JSON이면 message/goal 일부만 추출해서 미리보기
  try {
    const obj = JSON.parse(content);
    if (obj && typeof obj === "object") {
      const parts: string[] = [];
      if (obj.mbti) parts.push(`MBTI: ${String(obj.mbti)}`);
      if (obj.thisYearGoal) parts.push(`목표: ${String(obj.thisYearGoal)}`);
      if (obj.message) parts.push(`메시지: ${String(obj.message)}`);
      return parts.join(" / ").slice(0, 140);
    }
  } catch {}
  return content.slice(0, 140);
}

export default function WallAdminPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  const [list, setList] = useState<WallPost[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setErr(null);
    setLoading(true);
    const { data, error } = await supabase
      .from("wall_posts")
      .select("*")
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }
    const rows = (data as WallPost[]) ?? [];
    setList(rows);
    setSelectedId(rows[0]?.id ?? null);
  }

  useEffect(() => {
    if (isUnlocked) load();
  }, [isUnlocked]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => {
      return (
        (p.author_name || "").toLowerCase().includes(q) ||
        (p.title || "").toLowerCase().includes(q) ||
        (p.content || "").toLowerCase().includes(q)
      );
    });
  }, [list, query]);

  const selected = useMemo(() => {
    return filtered.find((p) => p.id === selectedId) ?? filtered[0] ?? null;
  }, [filtered, selectedId]);

  async function deleteOne(id: string) {
    if (!confirm("이 글을 삭제할까? (복구 불가)")) return;

    setErr(null);
    setLoading(true);

    // 1) DB에서 해당 글 읽어서 이미지 URL 확보 (스토리지 파일도 지우고 싶으면 path가 필요함)
    const target = list.find((p) => p.id === id);

    // 2) DB 삭제
    const { error } = await supabase.from("wall_posts").delete().eq("id", id);

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }

    // 3) UI 반영
    const next = list.filter((p) => p.id !== id);
    setList(next);
    setSelectedId(next[0]?.id ?? null);

    // (옵션) 스토리지 파일까지 삭제하고 싶다면:
    // 지금은 image_urls에 publicUrl만 있어서 경로(path)를 정확히 복원하기 어려워.
    // 다음 개선에서 "image_paths"로 바꾸면 storage도 함께 삭제 가능해.
    console.log("deleted", target?.id);
  }

  async function clearAll() {
    if (!confirm("전체 삭제할까? (복구 불가)")) return;
    setErr(null);
    setLoading(true);

    const { error } = await supabase.from("wall_posts").delete().neq("id", "");

    setLoading(false);

    if (error) {
      setErr(error.message);
      return;
    }
    setList([]);
    setSelectedId(null);
  }

  if (!isUnlocked) {
    return (
      <div className="space-y-6">
        <div className="hy-card p-6">
          <h1 className="text-2xl font-bold">담임 전용: 담벼락 관리자 🔒</h1>
          <p className="mt-2 text-sm text-gray-600">
            비밀번호를 입력하면 학생 자기소개(담벼락) 글을 조회/삭제할 수 있어.
          </p>
        </div>

        <div className="hy-card p-6 max-w-md">
          <div className="text-sm mb-3">비밀번호</div>
          <input
            type="password"
            className="w-full rounded-2xl border px-4 py-3 text-sm"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
          />
          <button
            className="mt-4 hy-btn hy-btn-primary text-sm text-white"
            onClick={() => {
              if (passwordInput === ADMIN_PASSWORD) setIsUnlocked(true);
              else alert("비밀번호가 틀렸어");
            }}
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="hy-card p-6">
        <h1 className="text-2xl font-bold">담임 전용: 담벼락 글 관리</h1>
        <p className="mt-2 text-sm text-gray-600">
          여기서 글을 선택해서 확인하고, 필요하면 삭제할 수 있어.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          className="w-full md:w-96 rounded-2xl border px-4 py-3 text-sm"
          placeholder="이름/제목/내용 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="hy-btn text-sm" onClick={load} disabled={loading}>
          새로고침
        </button>
        <button className="hy-btn text-sm" onClick={clearAll} disabled={loading}>
          전체 삭제
        </button>
        {loading && <div className="text-xs text-gray-600 ml-2">처리 중...</div>}
      </div>

      {err && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          오류: {err}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {/* 목록 */}
        <div className="hy-card p-4 md:col-span-1">
          <div className="text-sm font-semibold text-gray-700">
            글 {filtered.length}개
          </div>

          <div className="mt-3 divide-y">
            {filtered.length === 0 && (
              <div className="py-8 text-sm text-gray-600">글이 없어.</div>
            )}

            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-left py-3 px-2 rounded-xl ${
                  selected?.id === p.id ? "bg-zinc-50" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-sm">
                    {p.author_name || "이름없음"}
                  </div>
                  {!p.is_public && (
                    <span className="text-[10px] rounded-full border px-2 py-0.5 text-gray-600">
                      비공개
                    </span>
                  )}
                </div>

                <div className="mt-1 text-xs text-gray-500">
                  {formatKST(p.created_at)}
                </div>

                <div className="mt-2 text-xs text-gray-700 line-clamp-2">
                  {safePreview(p.content)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 상세 */}
        <div className="space-y-4 md:col-span-2">
          {!selected ? (
            <div className="hy-card p-6 text-sm text-gray-700">
              왼쪽에서 글을 선택해줘.
            </div>
          ) : (
            <div className="hy-card p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-bold">
                    {selected.title || `${selected.author_name}의 글`}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {selected.author_name} · {formatKST(selected.created_at)}
                    {!selected.is_public && " · (비공개)"}
                  </div>
                </div>

                <button
                  className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
                  onClick={() => deleteOne(selected.id)}
                  disabled={loading}
                >
                  이 글 삭제
                </button>
              </div>

              <div className="rounded-2xl bg-zinc-50 p-4 text-sm whitespace-pre-wrap">
                {selected.content}
              </div>

              {selected.image_urls && selected.image_urls.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-2">
                    첨부 이미지
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {selected.image_urls.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer">
                        <img
                          src={url}
                          alt="첨부 이미지"
                          className="h-28 w-full rounded-xl object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="hy-card p-5 text-sm text-gray-700">
        <div className="font-semibold">관리자 주소</div>
        <div className="mt-2">
          <span className="font-mono">/wall/admin_0212</span>
        </div>
        <div className="mt-1 text-xs text-gray-500">
          예: https://hyfl-class.vercel.app/wall/admin_0212
        </div>
      </div>
    </div>
  );
}