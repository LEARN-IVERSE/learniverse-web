import type { Page } from "@playwright/test";

// Fake K7 community API for FE-only E2E tests, shaped like learniverse-api's responses.
// State lives in memory so a test can post, comment, report and see the result.

const author = (name: string, initial: string, color: number, id = `u-${initial}`) => ({
  id,
  name,
  avatar_initial: initial,
  avatar_color: color,
});
export const AN = author("Nguyễn Văn An", "A", 0);
export const BICH = author("Trần Thị Bích", "B", 1);

export type PostMock = {
  id: string;
  box: { code: string; name: string };
  title: string;
  body_md: string;
  author: typeof AN;
  created_at: string;
  edited: boolean;
  hidden: boolean;
  comment_count: number;
  media: { id: string; kind: "image" | "file"; url: string; file_name: string; content_type: string }[];
  mine: boolean;
};

export type CommentMock = {
  id: string;
  parent_id: string | null;
  author: typeof AN | null;
  body_md: string | null;
  state: "visible" | "deleted" | "hidden";
  created_at: string;
  edited: boolean;
  mine: boolean;
};

const BOX_NAMES: Record<string, string> = { math: "Toán 9", english: "Tiếng Anh 9", literature: "Ngữ văn 9" };

export function makePost(n: number, over: Partial<PostMock> = {}): PostMock {
  const box = over.box?.code ?? "math";
  return {
    id: `post-${n}`,
    box: { code: box, name: BOX_NAMES[box] },
    title: `Bài đăng số ${n}`,
    body_md: `Nội dung của bài ${n}`,
    author: BICH,
    created_at: new Date(Date.now() - n * 60_000).toISOString(),
    edited: false,
    hidden: false,
    comment_count: 0,
    media: [],
    mine: false,
    ...over,
  };
}

export const makeComment = (id: string, over: Partial<CommentMock> = {}): CommentMock => ({
  id,
  parent_id: null,
  author: BICH,
  body_md: `Bình luận ${id}`,
  state: "visible",
  created_at: new Date(Date.now() - 120_000).toISOString(),
  edited: false,
  mine: false,
  ...over,
});

export type ReportMock = {
  id: string;
  status: "new" | "reviewed" | "resolved";
  action: "keep" | "hide" | "delete" | null;
  reason: "spam" | "abuse" | "inappropriate" | "other";
  note: string;
  created_at: string;
  reporter_name: string;
  target_type: "post" | "comment";
  target_id: string;
  post_id: string | null;
  target_excerpt: string;
  target_state: string;
  target_author_id: string | null;
  target_author_name: string | null;
  target_author_locked: boolean;
  report_count: number;
};

export type CommunityState = {
  posts: PostMock[];
  comments: Record<string, CommentMock[]>;
  unread: number;
  notifications: object[];
  newCount: number;
  reports: ReportMock[];
  /** Requests the page made, for assertions: "METHOD /path". */
  calls: string[];
};

const PAGE_SIZE = 10;
const gone = { error: { code: "post_not_found", message: "Không tìm thấy bài đăng này." } };

export async function mockCommunityApi(
  page: Page,
  init: Partial<CommunityState> = {},
): Promise<CommunityState> {
  const s: CommunityState = {
    posts: [],
    comments: {},
    unread: 0,
    notifications: [],
    newCount: 0,
    reports: [],
    calls: [],
    ...init,
  };

  await page.route(
    /\/api\/v1\/(posts|comments|notifications|reports|admin\/reports|media\/uploads)(\/|\?|$)/,
    async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      const path = url.pathname.replace(/^\/api\/v1/, "");
      const method = req.method();
      s.calls.push(`${method} ${path}`);
      const json = (body: unknown, status = 200) => route.fulfill({ status, json: body });
      const empty = () => route.fulfill({ status: 204 });
      const body = () => (req.postDataJSON() ?? {}) as Record<string, unknown>;

      if (path === "/notifications" && method === "GET")
        return json({ unread: s.unread, items: s.notifications });
      if (path === "/notifications/read") {
        s.unread = 0;
        return empty();
      }
      if (path === "/media/uploads") {
        const id = `media-${s.calls.length}`;
        return json({
          id,
          upload_url: `/fake-community-put/${id}`,
          upload_token: "test-upload-token",
          content_type: body().content_type,
        });
      }
      if (path === "/posts/new-count") return json({ count: s.newCount });
      if (path === "/posts" && method === "GET") {
        const q = (url.searchParams.get("q") ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
        const box = url.searchParams.get("box");
        const noComments = url.searchParams.get("no_comments") === "true";
        const hits = s.posts.filter(
          (p) =>
            (!box || p.box.code === box) &&
            (!noComments || p.comment_count === 0) &&
            (!q || `${p.title} ${p.body_md}`.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().includes(q)),
        );
        const pages = Math.max(1, Math.ceil(hits.length / PAGE_SIZE));
        const pageNo = Math.min(Math.max(1, Number(url.searchParams.get("page") ?? 1)), pages);
        return json({
          items: hits.slice((pageNo - 1) * PAGE_SIZE, pageNo * PAGE_SIZE),
          page: pageNo,
          page_size: PAGE_SIZE,
          total: hits.length,
          pages,
        });
      }
      if (path === "/posts" && method === "POST") {
        const b = body();
        const post = makePost(s.posts.length + 100, {
          id: `post-new-${s.posts.length}`,
          title: String(b.title),
          body_md: String(b.body),
          box: { code: String(b.box), name: BOX_NAMES[String(b.box)] },
          author: AN,
          mine: true,
          created_at: new Date().toISOString(),
        });
        s.posts.unshift(post);
        return json(post, 201);
      }
      const post = path.match(/^\/posts\/([^/]+)$/);
      if (post) {
        const found = s.posts.find((p) => p.id === post[1]);
        if (!found) return json(gone, 404);
        if (method === "GET") return json(found);
        if (method === "DELETE") {
          s.posts = s.posts.filter((p) => p.id !== found.id);
          return empty();
        }
        Object.assign(found, { title: body().title, body_md: body().body, edited: true });
        return json(found);
      }
      const list = path.match(/^\/posts\/([^/]+)\/comments$/);
      if (list) {
        const mine = (s.comments[list[1]] ??= []);
        if (method === "GET") return json(mine);
        const b = body();
        const comment = makeComment(`c-new-${mine.length}`, {
          parent_id: (b.parent_id as string | null) ?? null,
          author: AN,
          body_md: String(b.body),
          mine: true,
          created_at: new Date().toISOString(),
        });
        mine.push(comment);
        const target = s.posts.find((p) => p.id === list[1]);
        if (target) target.comment_count += 1;
        return json(comment, 201);
      }
      const comment = path.match(/^\/comments\/([^/]+)$/);
      if (comment) {
        for (const thread of Object.values(s.comments)) {
          const c = thread.find((x) => x.id === comment[1]);
          if (!c) continue;
          if (method === "PATCH") Object.assign(c, { body_md: body().body, edited: true });
          else Object.assign(c, { state: "deleted", author: null, body_md: null, mine: false });
          return method === "PATCH" ? json(c) : empty();
        }
      }
      if (path === "/reports") return empty();
      if (path === "/admin/reports") return json(s.reports);
      const resolve = path.match(/^\/admin\/reports\/([^/]+)\/(resolve|review)$/);
      if (resolve) {
        const report = s.reports.find((r) => r.id === resolve[1]);
        if (report && resolve[2] === "review") report.status = "reviewed";
        if (report && resolve[2] === "resolve") {
          report.status = "resolved";
          report.action = body().action as ReportMock["action"];
        }
        return empty();
      }
      return route.fallback();
    },
  );
  return s;
}
