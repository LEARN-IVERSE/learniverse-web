"use client";

import { CornerDownRight, Flag, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import {
  type CommentOut,
  communityAddComment,
  communityDeleteComment,
  communityEditComment,
} from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { UserAvatar } from "../auth/user-avatar";
import { ReportDialog } from "./report-dialog";
import { SafeMarkdown } from "./safe-markdown";
import { timeAgo } from "./time-ago";

const MAX_DEPTH = 3; // K7-D4: deeper replies are shown on the third level with "trả lời @tên"

export type CommentNode = CommentOut & { children: CommentNode[] };

/** Flat list (oldest first) -> tree. A reply to a missing parent is shown at the top level. */
export function buildTree(list: CommentOut[]): CommentNode[] {
  const nodes = new Map(list.map((c) => [c.id, { ...c, children: [] as CommentNode[] }]));
  const roots: CommentNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parent_id ? nodes.get(node.parent_id) : undefined;
    (parent ? parent.children : roots).push(node);
  }
  return roots;
}

function CommentForm({
  placeholder,
  initial = "",
  submitLabel,
  onSubmit,
  onCancel,
}: {
  placeholder: string;
  initial?: string;
  submitLabel: string;
  onSubmit: (body: string) => Promise<boolean>;
  onCancel?: () => void;
}) {
  const [body, setBody] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setFailed(false);
        const ok = await onSubmit(body.trim());
        setBusy(false);
        if (ok) setBody("");
        else setFailed(true);
      }}
      className="space-y-2"
    >
      <label className="block">
        <span className="sr-only">{placeholder}</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={placeholder}
          rows={2}
          maxLength={5000}
          required
          className="w-full rounded-2xl bg-white p-3 text-sm ring-1 ring-slate-300 outline-none focus:ring-2 focus:ring-blue-400"
        />
      </label>
      {failed && (
        <p role="alert" className="text-sm text-rose-600">
          Chưa gửi được. Bạn thử lại nhé.
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy || body.trim() === ""}
          className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? "Đang gửi..." : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Hủy
          </button>
        )}
      </div>
    </form>
  );
}

function CommentItem({
  node,
  depth,
  postId,
  names,
  onChanged,
}: {
  node: CommentNode;
  depth: number;
  postId: string;
  names: Map<string, string>;
  onChanged: () => void;
}) {
  const [mode, setMode] = useState<"view" | "reply" | "edit" | "confirm-delete">("view");
  const [reporting, setReporting] = useState(false);
  const level = Math.min(depth, MAX_DEPTH);
  const replyingTo = node.parent_id && depth > MAX_DEPTH ? names.get(node.parent_id) : undefined;

  const small =
    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold hover:bg-slate-100";
  return (
    <li className={cn(level > 1 && "ml-4 border-l-2 border-blue-100 pl-4 md:ml-8")}>
      {node.state !== "visible" ? (
        <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500 italic">
          {node.state === "deleted" ? "Bình luận đã bị xóa" : "Bình luận đã bị quản trị viên ẩn"}
        </p>
      ) : (
        <div className="flex gap-3">
          {node.author && <UserAvatar user={node.author} className="size-8 text-sm" />}
          <div className="min-w-0 flex-1">
            <p className="text-sm">
              <span className="font-semibold">{node.author?.name}</span>{" "}
              <span className="text-xs text-muted-foreground">
                {timeAgo(node.created_at)}
                {node.edited && " · đã sửa"}
              </span>
            </p>
            {mode === "edit" ? (
              <CommentForm
                placeholder="Sửa bình luận"
                initial={node.body_md ?? ""}
                submitLabel="Lưu"
                onCancel={() => setMode("view")}
                onSubmit={async (body) => {
                  const { data } = await communityEditComment({
                    path: { comment_id: node.id },
                    body: { body },
                  });
                  if (data) {
                    setMode("view");
                    onChanged();
                  }
                  return Boolean(data);
                }}
              />
            ) : (
              <>
                {replyingTo && (
                  <p className="text-xs text-muted-foreground">
                    <CornerDownRight aria-hidden className="mr-1 inline size-3" />
                    trả lời @{replyingTo}
                  </p>
                )}
                <SafeMarkdown md={node.body_md ?? ""} className="text-sm text-slate-800" />
              </>
            )}
            {mode !== "edit" && (
              <div className="mt-1 flex flex-wrap items-center gap-1 text-slate-500">
                <button
                  type="button"
                  className={small}
                  onClick={() => setMode(mode === "reply" ? "view" : "reply")}
                >
                  Trả lời
                </button>
                {node.mine ? (
                  mode === "confirm-delete" ? (
                    <>
                      <button
                        type="button"
                        className={cn(small, "text-rose-700")}
                        onClick={async () => {
                          await communityDeleteComment({ path: { comment_id: node.id } });
                          onChanged();
                        }}
                      >
                        Xác nhận xóa
                      </button>
                      <button type="button" className={small} onClick={() => setMode("view")}>
                        Hủy
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className={small} onClick={() => setMode("edit")}>
                        <Pencil aria-hidden className="size-3" /> Sửa
                      </button>
                      <button type="button" className={small} onClick={() => setMode("confirm-delete")}>
                        <Trash2 aria-hidden className="size-3" /> Xóa
                      </button>
                    </>
                  )
                ) : (
                  <button
                    type="button"
                    aria-label={`Báo cáo bình luận của ${node.author?.name}`}
                    className={cn(small, "hover:text-rose-600")}
                    onClick={() => setReporting(true)}
                  >
                    <Flag aria-hidden className="size-3" /> Báo cáo
                  </button>
                )}
              </div>
            )}
            {mode === "reply" && (
              <div className="mt-2">
                <CommentForm
                  placeholder={`Trả lời ${node.author?.name ?? ""}`}
                  submitLabel="Gửi trả lời"
                  onCancel={() => setMode("view")}
                  onSubmit={async (body) => {
                    const { data } = await communityAddComment({
                      path: { post_id: postId },
                      body: { body, parent_id: node.id },
                    });
                    if (data) {
                      setMode("view");
                      onChanged();
                    }
                    return Boolean(data);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
      {node.children.length > 0 && (
        <ul className="mt-3 space-y-3">
          {node.children.map((child) => (
            <CommentItem
              key={child.id}
              node={child}
              depth={depth + 1}
              postId={postId}
              names={names}
              onChanged={onChanged}
            />
          ))}
        </ul>
      )}
      {reporting && (
        <ReportDialog targetType="comment" targetId={node.id} onClose={() => setReporting(false)} />
      )}
    </li>
  );
}

/** Threaded comments with reply, edit, delete and report, plus the box for a new top-level comment. */
export function CommentTree({
  postId,
  comments,
  onChanged,
}: {
  postId: string;
  comments: CommentOut[];
  onChanged: () => void;
}) {
  const tree = useMemo(() => buildTree(comments), [comments]);
  const names = useMemo(() => new Map(comments.map((c) => [c.id, c.author?.name ?? ""])), [comments]);
  return (
    <section id="comments" aria-labelledby="comments-title" className="space-y-4">
      <h2 id="comments-title" className="font-heading text-xl font-bold">
        Bình luận
      </h2>
      <CommentForm
        placeholder="Viết bình luận để giúp bạn..."
        submitLabel="Gửi bình luận"
        onSubmit={async (body) => {
          const { data } = await communityAddComment({ path: { post_id: postId }, body: { body } });
          if (data) onChanged();
          return Boolean(data);
        }}
      />
      {tree.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Chưa có bình luận nào. Bạn hãy là người đầu tiên giúp bạn nhé.
        </p>
      ) : (
        <ul className="space-y-4">
          {tree.map((node) => (
            <CommentItem
              key={node.id}
              node={node}
              depth={1}
              postId={postId}
              names={names}
              onChanged={onChanged}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
