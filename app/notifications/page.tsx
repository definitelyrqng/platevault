"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  url: string | null;
  readAt: string | null;
  createdAt: string;
};

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TYPE_ICON: Record<string, string> = {
  LIKE: "♡",
  COMMENT: "💬",
  UPLOAD_DELETED: "🗑️",
  UPLOAD_FLAGGED: "⚑",
  MULTISPOT: "📍",
  SYSTEM: "📣",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();
        setNotifications(data.notifications ?? []);
        setEmpty((data.notifications ?? []).length === 0);

        // Mark all as read
        await fetch("/api/notifications", { method: "PATCH" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <Link href="/home" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Back
        </Link>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-zinc-900 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && empty && (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 py-12 text-center">
          <div className="text-3xl mb-3">🔔</div>
          <p className="text-sm text-zinc-400">No notifications yet.</p>
        </div>
      )}

      {!loading && !empty && (
        <div className="space-y-2">
          {notifications.map((n) => {
            const icon = TYPE_ICON[n.type] ?? "•";
            const unread = !n.readAt;
            const inner = (
              <div
                className={`flex gap-4 items-start rounded-2xl border px-5 py-4 transition-colors ${
                  unread
                    ? "border-zinc-700 bg-zinc-900/60"
                    : "border-zinc-800 bg-zinc-900/20"
                }`}
              >
                <div className="text-xl shrink-0 mt-0.5">{icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm font-medium ${unread ? "text-zinc-100" : "text-zinc-300"}`}>
                      {n.title}
                    </span>
                    <span className="text-xs text-zinc-600 shrink-0">{timeAgo(n.createdAt)}</span>
                  </div>
                  {n.message && (
                    <p className="mt-0.5 text-xs text-zinc-400 leading-relaxed">{n.message}</p>
                  )}
                </div>
                {unread && (
                  <div className="shrink-0 mt-1.5 h-2 w-2 rounded-full bg-blue-500" />
                )}
              </div>
            );

            return n.url ? (
              <Link key={n.id} href={n.url}>{inner}</Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </main>
  );
}
