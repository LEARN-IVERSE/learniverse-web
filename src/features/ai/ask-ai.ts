/** Lets any page open the AI chat about a lesson ("Hỏi về bài này") without sharing React state. */

export type LessonAsk = { subject: string; code: string; title: string };

const EVENT = "lv:ask-ai";

export function askAboutLesson(lesson: LessonAsk) {
  window.dispatchEvent(new CustomEvent<LessonAsk>(EVENT, { detail: lesson }));
}

export function onAskAboutLesson(handler: (lesson: LessonAsk) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<LessonAsk>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
