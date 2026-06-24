"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Flag from "@/app/components/Flag";
import { getCountryMeta } from "@/app/lib/countries";

type Spot = {
  id: string;
  numericId: number;
  plateText: string;
  country: string;
  imageUrl: string;
  createdAt: string;
  brand: string | null;
  model: string | null;
  user: { username: string; numericId: number; avatarUrl: string | null };
  _count: { likes: number; comments: number };
};

function relativeDays(d: string) {
  const ms = Date.now() - new Date(d).getTime();
  const days = Math.max(0, Math.floor(ms / 86_400_000));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)} months ago`;
}

function Initials({ username, avatarUrl }: { username: string; avatarUrl: string | null }) {
  if (avatarUrl) return <img src={avatarUrl} alt={username} className="h-8 w-8 rounded-full object-cover ring-1 ring-zinc-700" />;
  return (
    <div className="h-8 w-8 rounded-full bg-indigo-950/60 ring-1 ring-indigo-800/40 flex items-center justify-center text-xs font-semibold text-indigo-300">
      {username.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function FeedPage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [empty, setEmpty] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(async (cur?: string) => {
    const url = `/api/feed?limit=12${cur ? `&cursor=${cur}` : ""}`;
    const res = await fetch(url);
    if (res.status === 401) { setLoggedIn(false); setLoading(false); return; }
    setLoggedIn(true);
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    if (!cur && data.spots.length === 0) setEmpty(true);
    setSpots((prev) => cur ? [...prev, ...data.spots] : data.spots);
    setCursor(data.nextCursor);
    setHasMore(!!data.nextCursor);
    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loadingMore) {
        setLoadingMore(true);
        fetchPage(cursor ?? undefined);
      }
    }, { rootMargin: "200px" });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [cursor, hasMore, loadingMore, fetchPage]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <a href="/home" className="mb-6 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-indigo-400 transition-colors">
          ← Home
        </a>

        <div className="mb-8 flex items-center gap-3">
          <div className="h-6 w-1 rounded-full bg-indigo-500" />
          <h1 className="text-2xl font-bold text-zinc-50">Following Feed</h1>
        </div>

        {!loggedIn && loggedIn !== null && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center">
            <p className="text-zinc-400">Sign in to see spots from people you follow.</p>
            <a href="/login" className="mt-4 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
              Sign in
            </a>
          </div>
        )}

        {loggedIn && empty && (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 px-6 py-12 text-center">
            <div className="text-4xl">🌐</div>
            <div className="mt-4 text-sm font-medium text-zinc-200">Your feed is empty</div>
            <p className="mt-1 text-xs text-zinc-500">Follow some spotters and their latest plates will appear here.</p>
            <a href="/home" className="mt-4 inline-block rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-indigo-700/60 hover:text-indigo-300 transition-colors">
              Discover spots →
            </a>
          </div>
        )}

        {loading && (
          <div className="flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden animate-pulse">
                <div className="h-48 bg-zinc-900" />
                <div className="p-4 flex flex-col gap-2">
                  <div className="h-3 w-24 rounded bg-zinc-800" />
                  <div className="h-5 w-36 rounded bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-5">
          {spots.map((u) => {
            const meta = getCountryMeta(u.country);
            const carLabel = [u.brand, u.model].filter(Boolean).join(" ");
            return (
              <div key={u.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden hover:border-indigo-800/60 hover:shadow-md hover:shadow-indigo-950/40 transition-all group">
                {/* User row */}
                <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                  <Initials username={u.user.username} avatarUrl={u.user.avatarUrl} />
                  <div>
                    <a href={`/u/${u.user.numericId}`} className="text-sm font-semibold text-zinc-200 hover:text-indigo-300 transition-colors">
                      @{u.user.username}
                    </a>
                    <div className="text-xs text-zinc-500">{relativeDays(u.createdAt)}</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 rounded-md px-1.5 py-1 bg-zinc-800/60">
                    <Flag iso={meta.iso} size="sm" />
                  </div>
                </div>

                {/* Image */}
                <a href={`/spot/${u.numericId}`}>
                  <div className="bg-zinc-950 overflow-hidden" style={{ maxHeight: "320px" }}>
                    <img
                      src={u.imageUrl}
                      alt={u.plateText}
                      className="w-full object-cover max-h-80 group-hover:scale-[1.01] transition-transform"
                      loading="lazy"
                    />
                  </div>
                </a>

                {/* Footer */}
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  <div>
                    <a href={`/spot/${u.numericId}`} className="font-mono text-lg font-bold tracking-widest text-zinc-100 hover:text-indigo-200 transition-colors">
                      {u.plateText}
                    </a>
                    {carLabel && <div className="text-xs text-zinc-500 mt-0.5">{carLabel}</div>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 shrink-0">
                    <span>♡ {u._count.likes}</span>
                    <span>💬 {u._count.comments}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Infinite scroll sentinel */}
        <div ref={loaderRef} className="h-4" />
        {loadingMore && (
          <div className="py-6 text-center text-xs text-zinc-500 animate-pulse">Loading more…</div>
        )}
        {!hasMore && spots.length > 0 && (
          <div className="py-6 text-center text-xs text-zinc-600">You're all caught up ✓</div>
        )}
      </div>
    </div>
  );
}
