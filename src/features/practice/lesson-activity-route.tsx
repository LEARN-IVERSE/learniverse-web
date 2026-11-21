"use client";

import { useParams } from "next/navigation";

import { TeachPage } from "@/features/ai/teach-page";

import { ActivityPage } from "./activity-page";

/** /courses/[subject]/[code]/[activity]: "teach" is the AI teaching screen (K10), the rest are attempts. */
export function LessonActivityRoute() {
  const { activity } = useParams<{ activity: string }>();
  return activity === "teach" ? <TeachPage /> : <ActivityPage />;
}
