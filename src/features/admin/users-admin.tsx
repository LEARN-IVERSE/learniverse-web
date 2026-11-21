"use client";

import { Lock, LockOpen, Search, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { ErrorState } from "@/components/states/error-state";
import {
  adminListUsers,
  adminLockUser,
  adminSetRole,
  adminUnlockUser,
  catalogSubjects,
  type Permission,
  type PermissionIn,
  type Role,
  type SubjectOut,
  type UserAdminOut,
  type UserPageOut,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { UserAvatar } from "../auth/user-avatar";

const ROLE_LABEL: Record<Role, string> = {
  student: "Học sinh",
  teacher: "Giáo viên",
  admin: "Quản trị viên",
};
const PER_SUBJECT: { key: Permission; label: string }[] = [
  { key: "content", label: "Soạn nội dung, câu hỏi" },
  { key: "essay_review", label: "Chấm tự luận" },
];

function messageOf(error: unknown): string {
  const message = (error as { error?: { message?: unknown } } | undefined)?.error?.message;
  return typeof message === "string" && message ? message : "Có lỗi xảy ra. Bạn thử lại nhé.";
}

const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "Chưa có");

/** /admin/users: search, filter, page through accounts; lock/unlock and change roles (K11a, admins only). */
export function UsersAdmin({ myId }: { myId: string }) {
  const [q, setQ] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [locked, setLocked] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UserPageOut | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<UserAdminOut | null>(null);
  const [subjects, setSubjects] = useState<SubjectOut[]>([]);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void adminListUsers({
      query: {
        q: q || undefined,
        role: role || undefined,
        locked: locked ? locked === "true" : undefined,
        page,
      },
    }).then(({ data }) => {
      if (cancelled) return;
      if (data) setData(data);
      else setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [q, role, locked, page, reload]);

  useEffect(() => {
    void catalogSubjects().then(({ data }) => data && setSubjects(data));
  }, []);

  const updated = (u: UserAdminOut) => {
    setSelected(u);
    setData((d) => (d ? { ...d, items: d.items.map((x) => (x.id === u.id ? u : x)) } : d));
  };

  if (failed) return <ErrorState onRetry={() => (setFailed(false), setReload((n) => n + 1))} />;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <label className="relative min-w-56 flex-1">
            <span className="sr-only">Tìm theo tên hoặc email</span>
            <Search aria-hidden className="absolute top-2.5 left-3 size-4 text-slate-400" />
            <input
              type="search"
              value={q}
              placeholder="Tìm theo tên hoặc email"
              onChange={(e) => (setQ(e.target.value), setPage(1))}
              className="h-9 w-full rounded-full bg-white pr-3 pl-9 text-sm ring-1 ring-slate-200 outline-none focus-visible:ring-blue-400"
            />
          </label>
          <select
            aria-label="Lọc theo vai trò"
            value={role}
            onChange={(e) => (setRole(e.target.value as Role | ""), setPage(1))}
            className="h-9 rounded-full bg-white px-3 text-sm ring-1 ring-slate-200"
          >
            <option value="">Mọi vai trò</option>
            {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
          <select
            aria-label="Lọc theo trạng thái"
            value={locked}
            onChange={(e) => (setLocked(e.target.value as "" | "true" | "false"), setPage(1))}
            className="h-9 rounded-full bg-white px-3 text-sm ring-1 ring-slate-200"
          >
            <option value="">Mọi trạng thái</option>
            <option value="false">Đang hoạt động</option>
            <option value="true">Đã khóa</option>
          </select>
        </div>

        <p className="text-sm text-muted-foreground">{data ? `${data.total} tài khoản` : "Đang tải…"}</p>
        <ul aria-label="Danh sách tài khoản" className="space-y-2">
          {data?.items.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => setSelected(u)}
                aria-pressed={selected?.id === u.id}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left ring-1 transition hover:ring-blue-300",
                  selected?.id === u.id ? "ring-2 ring-blue-500" : "ring-slate-100",
                )}
              >
                <UserAvatar user={u} className="size-9 text-sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{u.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{u.email}</span>
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {ROLE_LABEL[u.role]}
                </span>
                {u.is_locked && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                    Đã khóa
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
        {data && data.pages > 1 && (
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200 disabled:opacity-50"
            >
              Trang trước
            </button>
            <span>
              Trang {data.page}/{data.pages}
            </span>
            <button
              type="button"
              disabled={page >= data.pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200 disabled:opacity-50"
            >
              Trang sau
            </button>
          </div>
        )}
      </div>

      {selected && (
        <UserPanel
          key={selected.id}
          user={selected}
          isMe={selected.id === myId}
          subjects={subjects}
          onClose={() => setSelected(null)}
          onChanged={updated}
        />
      )}
    </div>
  );
}

function UserPanel({
  user,
  isMe,
  subjects,
  onClose,
  onChanged,
}: {
  user: UserAdminOut;
  isMe: boolean;
  subjects: SubjectOut[];
  onClose: () => void;
  onChanged: (u: UserAdminOut) => void;
}) {
  const [reason, setReason] = useState("");
  const [askLock, setAskLock] = useState(false);
  const [role, setRole] = useState<Role>(user.role);
  const [perms, setPerms] = useState<PermissionIn[]>(
    user.permissions.map((p) => ({ permission: p.permission, subject: p.subject })),
  );
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const has = (permission: Permission, subject: string | null) =>
    perms.some((p) => p.permission === permission && (p.subject ?? null) === subject);
  const toggle = (permission: Permission, subject: string | null) =>
    setPerms((all) =>
      has(permission, subject)
        ? all.filter((p) => !(p.permission === permission && (p.subject ?? null) === subject))
        : [...all, { permission, subject }],
    );

  async function act(run: () => Promise<{ data?: UserAdminOut; error?: unknown }>, ok: string) {
    setBusy(true);
    setNotice(null);
    const { data, error } = await run();
    setBusy(false);
    if (data) {
      onChanged(data);
      setNotice({ ok: true, text: ok });
    } else setNotice({ ok: false, text: messageOf(error) });
  }

  async function lock(e: FormEvent) {
    e.preventDefault();
    await act(() => adminLockUser({ path: { user_id: user.id }, body: { reason } }), "Đã khóa tài khoản.");
    setAskLock(false);
    setReason("");
  }

  return (
    <aside
      aria-label={`Chi tiết tài khoản ${user.name}`}
      className="space-y-4 self-start rounded-[1.5rem] bg-white p-5 ring-1 ring-blue-100 xl:sticky xl:top-24"
    >
      <div className="flex items-start gap-3">
        <UserAvatar user={user} className="size-11" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-lg font-bold">{user.name}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
        <button
          type="button"
          aria-label="Đóng chi tiết"
          onClick={onClose}
          className="rounded-full p-1 hover:bg-slate-100"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-muted-foreground">Ngày tạo</dt>
        <dd>{date(user.created_at)}</dd>
        <dt className="text-muted-foreground">Đăng nhập gần nhất</dt>
        <dd>{date(user.last_login_at)}</dd>
        <dt className="text-muted-foreground">Số sao</dt>
        <dd>{user.stars}</dd>
        <dt className="text-muted-foreground">Điểm đóng góp</dt>
        <dd>{user.points}</dd>
      </dl>

      {notice && (
        <p
          role={notice.ok ? "status" : "alert"}
          className={cn(
            "rounded-xl px-3 py-2 text-sm font-semibold",
            notice.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700",
          )}
        >
          {notice.text}
        </p>
      )}

      <div className="space-y-2 border-t pt-4">
        <p className="text-sm font-bold">Trạng thái</p>
        {user.is_locked ? (
          <>
            <p className="text-sm text-rose-700">Đã khóa{user.lock_reason ? `: ${user.lock_reason}` : ""}</p>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void act(() => adminUnlockUser({ path: { user_id: user.id } }), "Đã mở khóa tài khoản.")
              }
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              <LockOpen aria-hidden className="size-4" /> Mở khóa
            </button>
          </>
        ) : isMe ? (
          <p className="text-sm text-muted-foreground">Đây là tài khoản của bạn.</p>
        ) : askLock ? (
          <form onSubmit={(e) => void lock(e)} className="space-y-2">
            <label htmlFor="lock-reason" className="text-sm">
              Lý do khóa (bắt buộc)
            </label>
            <input
              id="lock-reason"
              value={reason}
              maxLength={300}
              onChange={(e) => setReason(e.target.value)}
              className="h-9 w-full rounded-xl bg-muted px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy || reason.trim().length < 3}
                className="rounded-full bg-rose-600 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                Xác nhận khóa
              </button>
              <button
                type="button"
                onClick={() => setAskLock(false)}
                className="rounded-full px-4 py-1.5 text-sm"
              >
                Hủy
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAskLock(true)}
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50"
          >
            <Lock aria-hidden className="size-4" /> Khóa tài khoản
          </button>
        )}
      </div>

      <div className="space-y-3 border-t pt-4">
        <label htmlFor="user-role" className="block text-sm font-bold">
          Vai trò
        </label>
        <select
          id="user-role"
          value={role}
          disabled={isMe}
          onChange={(e) => {
            setRole(e.target.value as Role);
            if (e.target.value !== "teacher") setPerms([]);
          }}
          className="h-9 w-full rounded-xl bg-muted px-3 text-sm disabled:opacity-60"
        >
          {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
        {role === "teacher" && (
          <fieldset className="space-y-2 rounded-xl bg-slate-50 p-3">
            <legend className="px-1 text-sm font-semibold">Quyền của giáo viên</legend>
            {subjects.map((s) => (
              <div key={s.code} className="space-y-1">
                <p className="text-xs font-bold text-slate-600">{s.name}</p>
                {PER_SUBJECT.map((p) => (
                  <label key={p.key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={has(p.key, s.code)}
                      onChange={() => toggle(p.key, s.code)}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            ))}
            <label className="flex items-center gap-2 border-t pt-2 text-sm">
              <input
                type="checkbox"
                checked={has("moderation", null)}
                onChange={() => toggle("moderation", null)}
              />
              Kiểm duyệt cộng đồng (mọi Box)
            </label>
          </fieldset>
        )}
        <button
          type="button"
          disabled={busy || isMe}
          onClick={() =>
            void act(
              () =>
                adminSetRole({
                  path: { user_id: user.id },
                  body: { role, permissions: role === "teacher" ? perms : [] },
                }),
              "Đã lưu vai trò và quyền.",
            )
          }
          className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Lưu vai trò
        </button>
        {isMe && <p className="text-xs text-muted-foreground">Bạn không thể tự đổi vai trò của mình.</p>}
      </div>
    </aside>
  );
}
