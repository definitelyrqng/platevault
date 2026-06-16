"use client";

import { useEffect, useState } from "react";

type Tab = "spots" | "likes" | "countries";
type User = { numericId: number; username: string; avatarUrl: string | null; value: number };

const TABS: { id: Tab; label: string; emoji: string; unit: string }[] = [
  { id: "spots",     label: "Most Spots",     emoji: "📷", unit: "spots" },
  { id: "likes",     label: "Most Liked",     emoji: "♥",  unit: "likes" },
  { id: "countries", label: "Globe Trotters", emoji: "🌍", unit: "countries" },
];

const MEDAL = ["🥇", "🥈", "🥉"];

function Initials({ username, avatarUrl }: { username: string; avatarUrl: string | null }) {
  if (avatarUrl) return <img src={avatarUrl} alt={username} className="h-10 w-10 rounded-full object-cover ring-1 ring-zinc-700 shrink-0" />;
  return (
    <div className="h-10 w-10 rounded-full bg-indigo-950/60 ring-1 ring-indigo-800/40 flex items-center justify-center text-sm font-semibold text-indigo-300 shrink-0">
      {username.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("spots");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?tab=${tab}`)
      .then((r) => r.json())
      .then((d) => { setUsers(d.users ?? []); setLoading(false); });
  }, [tab]);

  const max = users[0]?.value ?? 1;
  const tabMeta = TABS.find((t) => t.id === tab)!;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <a href="/home" className="mb-6 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-indigo-400 transition-colors">
          ← Home
        </a>

        <div className="mb-8 flex items-center gap-3">
          <div className="h-6 w-1 rounded-full bg-amber-500" />
          <h1 className="text-2xl font-bold text-zinc-50">Leaderboard</h1>
        </div>

        {/* Tab switcher */}
        <div className="mb-8 flex gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-xl py-2 text-sm font-medium transition-all ${
                tab === t.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/50"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl border border-zinc-800 bg-zinc-900/40 animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 py-12 text-center text-sm text-zinc-500">
            No data yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {users.map((u, i) => {
              const pct = Math.max(4, Math.round((u.value / max) * 100));
              const isTop3 = i < 3;
              return (
                <a
                  key={u.numericId}
                  href={`/u/${u.numericId}`}
                  className={`flex items-center gap-4 rounded-2xl border px-4 py-3 transition-all hover:border-indigo-800/60 hover:shadow-md hover:shadow-indigo-950/40 ${
                    isTop3
                      ? "border-indigo-900/50 bg-indigo-950/20"
                      : "border-zinc-800 bg-zinc-900/40"
                  }`}
                >
                  {/* Rank */}
                  <div className="w-7 text-center shrink-0">
                    {isTop3 ? (
                      <span className="text-xl">{MEDAL[i]}</span>
                    ) : (
                      <span className="text-sm font-semibold text-zinc-500">#{i + 1}</span>
                    )}
                  </div>

                  <Initials username={u.username} avatarUrl={u.avatarUrl} />

                  {/* Name + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-sm font-semibold truncate ${isTop3 ? "text-indigo-200" : "text-zinc-200"}`}>
                        @{u.username}
                      </span>
                      <span className={`text-sm font-bold tabular-nums shrink-0 ${isTop3 ? "text-indigo-300" : "text-zinc-400"}`}>
                        {u.value.toLocaleString()} <span className="text-xs font-normal text-zinc-600">{tabMeta.unit}</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isTop3 ? "bg-gradient-to-r from-indigo-600 to-indigo-400" : "bg-zinc-700"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
