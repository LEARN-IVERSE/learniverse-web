"use client";

import "katex/dist/katex.min.css";

import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

import { cn } from "@/lib/utils";

/** Markdown with $...$ / $$...$$ math (KaTeX); used by theory sections, questions and explanations. */
export function MathText({ md, className }: { md: string; className?: string }) {
  return (
    <div className={cn("lesson-prose", className)}>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {md}
      </ReactMarkdown>
    </div>
  );
}
