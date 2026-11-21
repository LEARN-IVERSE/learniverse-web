import { describe, expect, it } from "vitest";

import { type AiEvent, parseSse, readSse } from "@/features/ai/sse";

const ev = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

describe("parseSse", () => {
  it("keeps an unfinished event for the next chunk", () => {
    const first = parseSse(ev("delta", { text: "Chào" }) + 'event: delta\ndata: {"te');
    expect(first.events).toEqual([{ event: "delta", data: { text: "Chào" } }]);
    const second = parseSse(first.rest + 'xt":" em"}\n\n');
    expect(second.events).toEqual([{ event: "delta", data: { text: " em" } }]);
  });

  it("keeps newlines inside the JSON text and skips unknown or broken events", () => {
    const { events } = parseSse(
      ev("delta", { text: "dòng 1\ndòng 2" }) + ev("ping", {}) + "event: delta\ndata: {oops\n\n",
    );
    expect(events).toEqual([{ event: "delta", data: { text: "dòng 1\ndòng 2" } }]);
  });
});

describe("readSse", () => {
  it("emits each event as soon as its bytes arrive, even split mid-character", async () => {
    const bytes = new TextEncoder().encode(
      ev("delta", { text: "Nghiệm" }) +
        ev("done", { message_id: "m1", status: "complete", messages_left: 29 }),
    );
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        for (let i = 0; i < bytes.length; i += 5) c.enqueue(bytes.slice(i, i + 5));
        c.close();
      },
    });
    const got: AiEvent[] = [];
    await readSse(body, (e) => got.push(e));
    expect(got).toEqual([
      { event: "delta", data: { text: "Nghiệm" } },
      { event: "done", data: { message_id: "m1", status: "complete", messages_left: 29 } },
    ]);
  });
});
