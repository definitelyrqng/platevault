"use client";

import { useState } from "react";

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  username: string;
  numericId: number;
  avatarUrl: string | null;
  isOwn: boolean;
};

function relativeTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function CommentSection({
  uploadId,
  initialComments,
  isLoggedIn,
  isMod = false,
}: {
  uploadId: string;
  initialComments: Comment[];
  isLoggedIn: boolean;
  isMod?: boolean;
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId, content: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not post comment."); return; }
      setComments((prev) => [...prev, { ...data.comment, isOwn: true }]);
      setText("");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteComment(id: string) {
    if (!confirm("Delete this comment?")) return;
    const res = await fetch(`/api/comments?id=${id}`, { method: "DELETE" });
    if (res.ok) setComments((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
      <h2 className="text-sm font-semibold text-zinc-200 mb-4">
        Comments ({comments.length})
      </h2>

      {comments.length === 0 ? (
        <p className="text-sm text-zinc-500 mb-5">No comments yet — be the first!</p>
      ) : (
        <div className="space-y-4 mb-5">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 group/comment">
              <a href={`/u/${c.numericId}`} className="shrink-0">
                {c.avatarUrl ? (
                  <img src={c.avatarUrl} alt={c.username} className="h-8 w-8 rounded-xl object-cover" />
                ) : (
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-zinc-800 text-xs font-bold text-zinc-300">
                    {c.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </a>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <a href={`/u/${c.numericId}`} className="text-sm font-medium text-zinc-200 hover:text-white">
                    @{c.username}
                  </a>
                  <span className="text-xs text-zinc-600">{relativeTime(c.createdAt)}</span>
                  {isMod && (
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="ml-auto opacity-0 group-hover/comment:opacity-100 text-xs text-red-500 hover:text-red-400 transition-opacity"
                    >
                      delete
                    </button>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-zinc-300 leading-relaxed break-words">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoggedIn ? (
        <form onSubmit={submit} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment…"
            maxLength={1000}
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600 min-w-0"
          />
          <button
            type="submit"
            disabled={!text.trim() || submitting}
            className="shrink-0 rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "…" : "Post"}
          </button>
        </form>
      ) : (
        <p className="text-sm text-zinc-500">
          <a href="/login" className="text-zinc-300 hover:text-white underline">Sign in</a> to leave a comment.
        </p>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </section>
  );
}
