/**
 * Minimal reader for the Server-Sent Events of POST /v1/ai/conversations/{id}/messages.
 * EventSource only does GET, so the stream is read from fetch() and split here.
 */

export type AiEvent =
  | { event: "delta"; data: { text: string } }
  | {
      event: "done";
      data: { message_id: string | null; status: "complete" | "incomplete"; messages_left: number };
    }
  | { event: "error"; data: { code: string; message: string } };

/** Split buffered text into complete events; returns the events and the unfinished tail. */
export function parseSse(buffer: string): { events: AiEvent[]; rest: string } {
  const events: AiEvent[] = [];
  const blocks = buffer.replace(/\r\n/g, "\n").split("\n\n");
  const rest = blocks.pop() ?? "";
  for (const block of blocks) {
    let name = "message";
    const data: string[] = [];
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) name = line.slice(6).trim();
      else if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
    }
    if (!data.length || !["delta", "done", "error"].includes(name)) continue;
    try {
      events.push({ event: name, data: JSON.parse(data.join("\n")) } as AiEvent);
    } catch {
      // A malformed event is skipped rather than breaking the whole answer.
    }
  }
  return { events, rest };
}

/** Read an SSE response body and call `onEvent` for each event as soon as it is complete. */
export async function readSse(
  body: ReadableStream<Uint8Array>,
  onEvent: (e: AiEvent) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const { events, rest } = parseSse(buffer);
    buffer = rest;
    events.forEach(onEvent);
  }
  const { events } = parseSse(buffer + decoder.decode() + "\n\n");
  events.forEach(onEvent);
}
