"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/components/lib/supabaseClient";

type IntroPost = {
  id: string;
  created_at: string;
  author_name: string;
  title: string | null;
  content: string; // JSON 문자열로 저장
  is_public: boolean;
  image_urls: string[];
};

type IntroForm = {
  name: string;
  mbti: string;
  likeBehaviors: string;
  dislikeBehaviors: string;
  thisYearGoal: string;
  message: string;
  isPublic: boolean;
};

function formatKST(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="hy-card p-5">{children}</div>;
}

function safeParseIntro(content: string): IntroForm | null {
  try {
    const obj = JSON.parse(content);
    if (!obj || typeof obj !== "object") return null;
    return {
      name: String(obj.name ?? ""),
      mbti: String(obj.mbti ?? ""),
      likeBehaviors: String(obj.likeBehaviors ?? ""),
      dislikeBehaviors: String(obj.dislikeBehaviors ?? ""),
      thisYearGoal: String(obj.thisYearGoal ?? ""),
      message: String(obj.message ?? ""),
      isPublic: Boolean(obj.isPublic ?? true),
    };
  } catch {
    return null;
  }
}

export default function WallIntroPage() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [list, setList] = useState<IntroPost[]>([]);
  const [err, setErr] = useState<string | null>(null);

  // 작성 폼
  const [name, setName] = useState("");
  const [mbti, setMbti] = useState("");
  const [likeBehaviors, setLikeBehaviors] = useState("");
  const [dislikeBehaviors, setDislikeBehaviors] = useState("");
  const [thisYearGoal, setThisYearGoal] = useState("");
  const [message, setMessage] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [files, setFiles] = useState<FileList | null>(null);

  async function load() {
    setErr(null);
    const { data, error } = await supabase
      .from("wall_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setErr(error.message);
      return;
    }
    setList((data as IntroPost[]) ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  const canSubmit = useMemo(() => {
    return (
      name.trim().length >= 1 &&
      mbti.trim().length >= 2 &&
      likeBehaviors.trim().length >= 1 &&
      dislikeBehaviors.trim().length >= 1 &&
      thisYearGoal.trim().length >= 1
    );
  }, [name, mbti, likeBehaviors, dislikeBehaviors, thisYearGoal]);

  async function submit() {
    if (!canSubmit) return;

    setLoading(true);
    setErr(null);

    try {
      // 1) 사진 업로드 (선택)
      setUploading(true);
      const imageUrls: string[] = [];

      if (files && files.length > 0) {
        for (const file of Array.from(files).slice(0, 3)) {
          const ext = file.name.split(".").pop() || "png";
          const path = `wall/${Date.now()}_${Math.random()
            .toString(16)
            .slice(2)}.${ext}`;

          const { error: upErr } = await supabase.storage
            .from("uploads")
            .upload(path, file, { upsert: false });

          if (upErr) {
            setErr(upErr.message);
            setUploading(false);
            setLoading(false);
            return;
          }

          const { data } = supabase.storage.from("uploads").getPublicUrl(path);
          imageUrls.push(data.publicUrl);
        }
      }

      setUploading(false);

      // 2) 소개 글 payload
      const payload: IntroForm = {
        name: name.trim(),
        mbti: mbti.trim(),
        likeBehaviors: likeBehaviors.trim(),
        dislikeBehaviors: dislikeBehaviors.trim(),
        thisYearGoal: thisYearGoal.trim(),
        message: message.trim(),
        isPublic,
      };

      // 3) DB 저장
      const { error } = await supabase.from("wall_posts").insert({
        author_name: payload.name,
        title: `${payload.name}의 자기소개`,
        content: JSON.stringify(payload),
        is_public: isPublic,
        image_urls: imageUrls,
      });

      if (error) {
        setErr(error.message);
        setLoading(false);
        return;
      }

      // 폼 리셋 (이름은 남겨도 됨)
      setMbti("");
      setLikeBehaviors("");
      setDislikeBehaviors("");
      setThisYearGoal("");
      setMessage("");
      setFiles(null);

      await load();
    } finally {
      setUploading(false);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="hy-card p-6">
        <div className="text-sm text-gray-600">우리반이 함께 만드는 소개 공간</div>
        <h1 className="hy-title mt-1 text-2xl font-bold">자기소개 담벼락 🌸</h1>
        <p className="mt-2 text-sm text-gray-700">
          서로를 편하게 알아가기 위한 공간이야.{" "}
          <span className="font-semibold">따뜻한 말</span>로 써주기 🙂
        </p>
      </div>

      {/* 작성 */}
      <Card>
        <div className="text-base font-semibold">내 소개 올리기</div>

        <div className="mt-4 grid gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="w-full rounded-2xl border px-4 py-3 text-sm"
              placeholder="이름/별명 (예: 민지 / 22번 / 별명)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="w-full rounded-2xl border px-4 py-3 text-sm"
              placeholder="MBTI (예: INFP)"
              value={mbti}
              onChange={(e) => setMbti(e.target.value)}
            />
          </div>

          <textarea
            className="min-h-[90px] w-full rounded-2xl border px-4 py-3 text-sm"
            placeholder="내가 좋아하는 행동/분위기 (예: 약속 잘 지키는 사람, 조용한 분위기 등)"
            value={likeBehaviors}
            onChange={(e) => setLikeBehaviors(e.target.value)}
          />

          <textarea
            className="min-h-[90px] w-full rounded-2xl border px-4 py-3 text-sm"
            placeholder="내가 싫어하는 행동 (예: 무시하는 말투, 뒷말, 약속 어기기 등)"
            value={dislikeBehaviors}
            onChange={(e) => setDislikeBehaviors(e.target.value)}
          />

          <textarea
            className="min-h-[90px] w-full rounded-2xl border px-4 py-3 text-sm"
            placeholder="올해 이루고 싶은 것 1~3개 (예: 성적/운동/관계/습관 등)"
            value={thisYearGoal}
            onChange={(e) => setThisYearGoal(e.target.value)}
          />

          <textarea
            className="min-h-[90px] w-full rounded-2xl border px-4 py-3 text-sm"
            placeholder="추가로 하고 싶은 말(선택) (예: 먼저 말 걸어주면 좋아요)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          {/* 사진 업로드 */}
          <div className="rounded-2xl border bg-white p-4">
            <div className="text-sm font-semibold">사진 첨부 (최대 3장)</div>
            <p className="mt-1 text-xs text-gray-500">
              얼굴/개인정보는 조심! 밝고 안전한 사진만 🙂
            </p>

            <input
              type="file"
              accept="image/*"
              multiple
              className="mt-3 block w-full text-sm"
              onChange={(e) => setFiles(e.target.files)}
            />

            {uploading && (
              <div className="mt-2 text-xs text-gray-600">업로드 중...</div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              전체 공개(우리 반 친구들이 볼 수 있게)
            </label>

            <button
              className={`hy-btn hy-btn-primary text-sm text-white ${
                !canSubmit || loading ? "opacity-60" : ""
              }`}
              onClick={submit}
              disabled={!canSubmit || loading}
            >
              {loading ? "올리는 중..." : "자기소개 게시하기"}
            </button>
          </div>

          {!canSubmit && (
            <div className="text-xs text-gray-500">
              필수: 이름, MBTI, 좋아하는 행동, 싫어하는 행동, 올해 목표
            </div>
          )}

          {err && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              오류: {err}
            </div>
          )}
        </div>
      </Card>

      {/* 목록 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-700">
            올라온 소개 {list.length}개
          </div>
          <button className="hy-btn text-sm" onClick={load}>
            새로고침
          </button>
        </div>

        {list.length === 0 ? (
          <div className="hy-card p-6 text-sm text-gray-700">
            아직 소개가 없어. 첫 소개의 주인공이 되어줘 🙂
          </div>
        ) : (
          list.map((p) => {
            const intro = safeParseIntro(p.content);
            const titleText = intro?.name
              ? `${intro.name}의 자기소개`
              : p.title ?? "자기소개";

            return (
              <div key={p.id} className="hy-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{titleText}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {p.author_name} · {formatKST(p.created_at)}
                      {!p.is_public && " · (비공개)"}
                    </div>
                  </div>
                </div>

                {intro ? (
                  <div className="mt-4 grid gap-3 text-sm">
                    <div className="rounded-2xl bg-zinc-50 p-4">
                      <div className="text-xs font-semibold text-gray-600">MBTI</div>
                      <div className="mt-1 text-gray-900">{intro.mbti}</div>
                    </div>

                    <div className="rounded-2xl bg-zinc-50 p-4">
                      <div className="text-xs font-semibold text-gray-600">
                        좋아하는 행동/분위기
                      </div>
                      <div className="mt-1 whitespace-pre-wrap text-gray-900">
                        {intro.likeBehaviors}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-zinc-50 p-4">
                      <div className="text-xs font-semibold text-gray-600">
                        싫어하는 행동
                      </div>
                      <div className="mt-1 whitespace-pre-wrap text-gray-900">
                        {intro.dislikeBehaviors}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-zinc-50 p-4">
                      <div className="text-xs font-semibold text-gray-600">
                        올해 이루고 싶은 것
                      </div>
                      <div className="mt-1 whitespace-pre-wrap text-gray-900">
                        {intro.thisYearGoal}
                      </div>
                    </div>

                    {intro.message?.trim() && (
                      <div className="rounded-2xl bg-zinc-50 p-4">
                        <div className="text-xs font-semibold text-gray-600">
                          하고 싶은 말
                        </div>
                        <div className="mt-1 whitespace-pre-wrap text-gray-900">
                          {intro.message}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-800">
                    {p.content}
                  </div>
                )}

                {/* ✅ 첨부 이미지 표시: 카드 맨 아래 */}
                {p.image_urls?.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
                    {p.image_urls.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer">
                        <img
                          src={url}
                          alt="첨부 이미지"
                          className="h-28 w-full rounded-xl object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="hy-card p-5 text-sm text-gray-700">
        <div className="font-semibold">약속 🙂</div>
        <ul className="mt-2 list-disc pl-5">
          <li>조롱/비꼼/비난 금지</li>
          <li>개인정보(전화번호, 집 주소 등) 올리지 않기</li>
          <li>서로를 존중하는 말로 쓰기</li>
        </ul>
      </div>
    </div>
  );
}