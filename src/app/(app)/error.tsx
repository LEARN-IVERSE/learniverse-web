"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/states/error-state";

// Error boundary for learner pages. Next.js 16 passes `retry`, which re-fetches and re-renders
// the segment; the shell (layout) stays on screen.
export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorState onRetry={retry} />;
}
