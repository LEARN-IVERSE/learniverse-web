import type { Page } from "@playwright/test";

// Helpers for FE-only E2E tests (the API is not running): fake the account endpoints and replace
// Google's script with a local button. Real Google sign-in is checked by hand at K3 acceptance.

export type FakeUser = {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin";
  avatar_initial: string;
  avatar_color: number;
};

export const STUDENT: FakeUser = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Trần Minh Anh",
  email: "minhanh@example.com",
  role: "student",
  avatar_initial: "A",
  avatar_color: 0,
};

export const ADMIN: FakeUser = {
  id: "00000000-0000-4000-8000-000000000002",
  name: "Cô Hạnh",
  email: "hanh@example.com",
  role: "admin",
  avatar_initial: "H",
  avatar_color: 4,
};

const UNAUTHENTICATED = { error: { code: "not_authenticated", message: "Bạn cần đăng nhập để tiếp tục." } };
const INVALID = {
  error: { code: "invalid_credential", message: "Đăng nhập Google không hợp lệ. Bạn thử lại nhé." },
};

/**
 * Fake account API. `signedIn` is who /me returns at first (null = guest). A Google credential
 * equal to "fake-ok" signs in as `signsInAs`; anything else is refused like the real API does.
 */
export async function mockAccountApi(
  page: Page,
  { signedIn = null, signsInAs = STUDENT }: { signedIn?: FakeUser | null; signsInAs?: FakeUser } = {},
): Promise<void> {
  let current = signedIn;
  await page.route("**/api/v1/me", (route) =>
    current ? route.fulfill({ json: current }) : route.fulfill({ status: 401, json: UNAUTHENTICATED }),
  );
  // K11a: the admin menu. Admins see every section; a test can register its own route for teachers.
  await page.route("**/api/v1/admin/me", (route) =>
    current?.role === "admin"
      ? route.fulfill({
          json: {
            role: "admin",
            permissions: [],
            sections: [
              "users",
              "content",
              "reviews",
              "essays",
              "community",
              "reports",
              "points",
              "ai",
              "audit",
            ],
          },
        })
      : route.fulfill({ status: 403, json: { error: { code: "forbidden", message: "Không có quyền" } } }),
  );
  await page.route("**/api/v1/auth/logout", (route) => {
    current = null;
    return route.fulfill({ status: 204 });
  });
  await page.route("**/api/v1/auth/google", (route) => {
    const { credential } = route.request().postDataJSON() as { credential: string };
    if (credential !== "fake-ok") return route.fulfill({ status: 401, json: INVALID });
    current = signsInAs;
    return route.fulfill({ json: current });
  });
}

/** Swap Google Identity Services for a stub whose button hands `credential` to the callback. */
export async function stubGoogleIdentity(page: Page, credential = "fake-ok"): Promise<void> {
  await page.route("https://accounts.google.com/gsi/client", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `window.google = { accounts: { id: {
        initialize(config) { window.__gsiConfig = config; },
        renderButton(parent) {
          const b = document.createElement("button");
          b.type = "button";
          b.textContent = "Tiếp tục với Google (giả lập)";
          b.onclick = () => window.__gsiConfig.callback({ credential: ${JSON.stringify(credential)} });
          parent.replaceChildren(b);
        },
        prompt() {},
      } } };`,
    }),
  );
}
