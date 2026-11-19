import { expect, test } from "@playwright/test";

import { mockAccountApi, STUDENT, stubGoogleIdentity } from "./auth-mocks";

// K2 acceptance: the App Shell must look right on phone, tablet and desktop. The first run writes
// reference screenshots next to this file; later runs compare pixel by pixel against them.
// Baselines depend on OS and browser, so create and compare them on the same kind of machine.
const SIZES = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "desktop", width: 1440, height: 900 },
];
const PAGES = [
  { name: "courses", path: "/courses" },
  { name: "community", path: "/community" },
  { name: "leaderboard", path: "/leaderboard" },
  { name: "login", path: "/login" },
];

for (const size of SIZES) {
  test.describe(`${size.name} ${size.width}x${size.height}`, () => {
    test.use({ viewport: { width: size.width, height: size.height } });

    for (const target of PAGES) {
      test(target.name, async ({ page }, testInfo) => {
        // One set of baselines is enough: sizes are set explicitly, so skip the phone project.
        test.skip(testInfo.project.name !== "desktop", "visual baselines run in the desktop project");
        await page.emulateMedia({ reducedMotion: "reduce" });
        // Signed in as a fixed fake learner; the sign-in page shows the stub Google button.
        await mockAccountApi(page, { signedIn: target.name === "login" ? null : STUDENT });
        await stubGoogleIdentity(page);
        // Wait for the scripts so React has hydrated before anything touches the DOM.
        await page.goto(target.path, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        // A runtime error shows a red "Issue" badge from the Next.js dev overlay: fail loudly
        // instead of baking it into a baseline.
        await expect(page.locator("nextjs-portal").getByText(/Issue/)).toHaveCount(0);
        // Viewport only: fixed bars (header, bottom tabs) stay where a learner actually sees them.
        // caret "initial": Playwright's default "hide" edits the DOM, which can race hydration and
        // trigger a hydration-mismatch warning. Nothing is focused, so no caret is drawn anyway.
        await expect(page).toHaveScreenshot(`${target.name}-${size.name}.png`, { caret: "initial" });
      });
    }
  });
}
