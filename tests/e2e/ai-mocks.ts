import type { Page, Route } from "@playwright/test";

// Fake K9 AI API for FE-only E2E tests, shaped like learniverse-api's responses.

export type AiMockState = {
  conversations: { id: string; title: string; lesson: unknown; updated_at: string; messages: unknown[] }[];
  messagesLeft: number;
  answer: string[]; // SSE delta pieces
  failWith: { status: number; code: string; message: string } | null;
  streamError: string | null; // an SSE `error` event after the deltas
  hang: boolean; // never answer (to test the stop button)
  sent: { conversation: string; text: string; media_ids: string[] }[];
  created: { lesson: unknown }[];
};

const sse = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

export async function mockAiApi(page: Page, over: Partial<AiMockState> = {}): Promise<AiMockState> {
  const s: AiMockState = {
    conversations: [],
    messagesLeft: 30,
    answer: ["Nghiệm của hệ là ", "$(3; 2)$. ", "Em thử thay lại xem nhé?"],
    failWith: null,
    streamError: null,
    hang: false,
    sent: [],
    created: [],
    ...over,
  };
  const json = (route: Route, body: unknown, status = 200) => route.fulfill({ status, json: body });

  await page.route("**/api/v1/ai/**", async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.replace("/api/v1/ai", "");
    const method = req.method();

    if (path === "/quota")
      return json(route, {
        messages_left: s.messagesLeft,
        images_left: 5,
        daily_messages: 30,
        daily_images: 5,
      });
    if (path === "/conversations" && method === "POST") {
      const body = req.postDataJSON() as { lesson: unknown };
      s.created.push(body);
      const c = {
        id: `chat-${s.conversations.length + 1}`,
        title: "Cuộc trò chuyện mới",
        lesson: body.lesson ? { subject_code: "math", code: "lesson-1", title: "Bài học" } : null,
        updated_at: new Date().toISOString(),
        messages: [],
      };
      s.conversations.unshift(c);
      return json(route, c, 201);
    }
    if (path === "/conversations" && method === "GET") return json(route, s.conversations);

    const match = path.match(/^\/conversations\/([^/]+)(\/messages)?$/);
    if (!match) return json(route, { error: { code: "not_found", message: "?" } }, 404);
    const [, id, messages] = match;
    const chat = s.conversations.find((c) => c.id === id);
    if (!chat) return json(route, { error: { code: "conversation_not_found", message: "?" } }, 404);

    if (!messages && method === "GET") return json(route, chat);
    if (!messages && method === "DELETE") {
      s.conversations = s.conversations.filter((c) => c.id !== id);
      return route.fulfill({ status: 204 });
    }

    const body = req.postDataJSON() as { text: string; media_ids: string[] };
    s.sent.push({ conversation: id, ...body });
    if (s.failWith)
      return json(
        route,
        { error: { code: s.failWith.code, message: s.failWith.message } },
        s.failWith.status,
      );
    if (s.hang) return; // left pending until the page aborts it
    chat.title = body.text.slice(0, 60);
    s.messagesLeft -= 1;
    const events =
      s.answer.map((text) => sse("delta", { text })).join("") +
      (s.streamError ? sse("error", { code: "ai_timeout", message: s.streamError }) : "") +
      sse("done", {
        message_id: `m-${s.sent.length}`,
        status: s.streamError ? "incomplete" : "complete",
        messages_left: s.messagesLeft,
      });
    return route.fulfill({ status: 200, headers: { "content-type": "text/event-stream" }, body: events });
  });
  return s;
}
