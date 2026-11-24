export function apiErrorMessage(error: unknown): string | undefined {
  const message = (error as { error?: { message?: unknown } } | null)?.error?.message;
  return typeof message === "string" && message ? message : undefined;
}
