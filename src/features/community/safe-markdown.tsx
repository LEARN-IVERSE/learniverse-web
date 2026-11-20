"use client";

import "katex/dist/katex.min.css";

import ReactMarkdown, { type Components } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

import { cn } from "@/lib/utils";

// K7-D3: user text is Markdown with math, never raw HTML. react-markdown builds React elements
// instead of injecting HTML strings and drops `javascript:` URLs by default; we also
// - never enable rehype-raw, so `<img onerror=...>` stays plain text,
// - turn images into their alt text (pictures only come from uploads),
// - open links in a new tab without leaking the opener.
const components: Components = {
  // An unsafe URL (javascript:) comes through as an empty href: show the text, not a dead link.
  a: ({ href, children }) =>
    href ? (
      <a href={href} target="_blank" rel="nofollow noopener noreferrer" className="text-blue-700 underline">
        {children}
      </a>
    ) : (
      <span>{children}</span>
    ),
};

export function SafeMarkdown({ md, className }: { md: string; className?: string }) {
  return (
    <div className={cn("lesson-prose break-words", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        disallowedElements={["img", "iframe", "script", "style"]}
        unwrapDisallowed
        components={components}
      >
        {md}
      </ReactMarkdown>
    </div>
  );
}
