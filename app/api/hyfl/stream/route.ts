/**
 * /api/hyfl/stream  — 스트리밍 채팅
 * Anthropic SSE → text/plain 스트림으로 클라이언트에 전달.
 * 완료 후 Supabase에 user + assistant 메시지 저장.
 */

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildSystemPrompt } from "../chat/route";

export async function POST(req: NextRequest) {
  const { team_id, team_name, messages, state } = await req.json();

  if (!messages?.length) {
    return new Response(JSON.stringify({ error: "messages가 필요합니다" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const systemPrompt = buildSystemPrompt(state, team_name ?? "팀");

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      stream: true,
      system: systemPrompt,
      messages: messages.slice(-20),
    }),
  });

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text();
    return new Response(JSON.stringify({ error: errText }), {
      status: anthropicRes.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  let fullText = "";

  const stream = new ReadableStream({
    async start(controller) {
      const reader = anthropicRes.body!.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw || raw === "[DONE]") continue;

            try {
              const evt = JSON.parse(raw);
              if (
                evt.type === "content_block_delta" &&
                evt.delta?.type === "text_delta"
              ) {
                const text: string = evt.delta.text;
                fullText += text;
                controller.enqueue(encoder.encode(text));
              }
            } catch {
              // 불완전한 청크 무시
            }
          }
        }
      } finally {
        controller.close();

        // 스트리밍 완료 후 Supabase 저장
        if (team_id && fullText) {
          const db = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY ??
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );
          const userMsg = messages[messages.length - 1];
          await db.from("hyfl_chat_messages").insert([
            { team_id, role: "user",      content: userMsg.content },
            { team_id, role: "assistant", content: fullText },
          ]);
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
