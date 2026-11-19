const BASE = "http://learniverse.invalid";
export const HOME_PATH = "/hoc-tap";

/**
 * "Return to" target after sign-in. Only local paths are accepted, so a crafted `?next=` link
 * cannot send learners to another site (open redirect).
 */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return HOME_PATH;
  let url: URL;
  try {
    url = new URL(raw, BASE);
  } catch {
    return HOME_PATH;
  }
  if (url.origin !== BASE || url.pathname.startsWith("/dang-nhap")) return HOME_PATH;
  return `${url.pathname}${url.search}${url.hash}`;
}
