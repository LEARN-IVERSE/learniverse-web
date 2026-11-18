// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { CometLogo } from "@/components/brand/comet-logo";

// src/app/icon.svg is the site favicon (Next.js `icon` file convention). It is rendered from the
// same <CometLogo> component, so the two can never drift apart. After changing the logo, rewrite
// the file with: pnpm vitest run tests/test_brand_icon.tsx --update
test("favicon is rendered from the comet logo", async () => {
  const svg = `${renderToStaticMarkup(<CometLogo />)}\n`;
  expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 64 64"/);
  await expect(svg).toMatchFileSnapshot("../src/app/icon.svg");
});
