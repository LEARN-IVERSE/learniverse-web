import { useId } from "react";

/** SVG ids must be unique per page and safe inside url(#...). */
export function useSvgId(prefix: string) {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
}
