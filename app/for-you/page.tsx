"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Flag from "@/app/components/Flag";
import { getCountryMeta } from "@/app/lib/countries";
import { SkeletonGrid } from "@/app/components/SkeletonCard";

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
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function ForYouPage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [personalised, setPersonalised] = useState(false);
  const [loggedIn, setLoggedIn] = useState(true);
  const [topCountries, setTopCountries] = useState<string[]>([]);
  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(async (cur?: string) => {
    const url = `/api/feed/foryou?limit=16${cur ? `&cursor=${cur}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setSpots((prev) => cur ? [...prev, ...data.spots] : data.spots);
    setCursor(data.nextCursor);
    setHasMore(!!data.nextCursor);
    setPersonalised(data.personalised ?? false);
    setLoggedIn(data.loggedIn !== false);
    setTopCountries(data.topCountries ?? []);
    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setLoadingMore(true);
        fetchPage(cursor ?? undefined);
      }
    }, { rootMargin: "300px" });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [cursor, hasMore, loadingMore, fetchPage]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black text-zinc-50">For You</h1>
          {personalised && (
            <span className="rounded-full bg-indigo-950/60 border border-indigo-800/40 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
              Personalised
            </span>
          )}
        </div>
        <a href="/feed" className="text-xs font-medium text-zinc-500 hover:text-indigo-300 transition-colors">Following →</a>
      </div>

      {/* Country chips (if personalised) */}
      {personalised && topCountries.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <span className="text-xs text-zinc-600 self-center">Based on your likes:</span>
          {topCountries.map((c) => {
            const meta = getCountryMeta(c);
            return (
              <a
                key={c}
                href={`/c/${c}`}
                className="flex items-center gap-1.5 rounded-full bg-zinc-900/60 border border-zinc-800/60 px-3 py-1 text-xs text-zinc-400 hover:border-indigo-700/50 hover:text-indigo-300 transition-colors"
              >
                <Flag iso={meta.iso} />
                {meta.name}
              </a>
            );
          })}
        </div>
      )}

      {!personalised && !loading && (
        <div className="mb-6 rounded-2xl border border-zinc-800/60 bg-zinc-900/30 px-5 py-4 text-sm text-zinc-400 flex items-center gap-3">
          <span className="text-2xl">👋</span>
          {loggedIn
            ? <span>Like some spots and your feed will personalise itself based on your favourite countries and car brands.</span>
            : <span>Sign in and start liking spots to get a personalised feed based on your favourite countries and car brands.</span>
          }
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <SkeletonGrid count={16} />
      ) : spots.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="text-4xl mb-3">🌍</div>
          <p className="text-sm text-zinc-400">No spots to show yet — try liking some plates!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {spots.map((u) => {
            const meta = getCountryMeta(u.country);
            const carLabel = [u.brand, u.model].filter(Boolean).join(" ");
            return (
              <a key={u.id} href={`/spot/${u.numericId}`}
                className="group rounded-2xl overflow-hidden border border-zinc-800/60 hover:border-indigo-600/60 hover:shadow-xl hover:shadow-indigo-950/40 hover:-translate-y-0.5 transition-all block bg-zinc-900/50">
                <div className="relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
                  <img src={u.imageUrl} alt={u.plateText} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-2 right-2"><Flag iso={meta.iso} /></div>
                </div>
                <div className="px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold tracking-widest text-zinc-100 group-hover:text-indigo-200 transition-colors truncate">{u.plateText}</span>
                    {u._count.likes > 0 && <span className="text-xs text-rose-400 font-semibold shrink-0">♥ {u._count.likes}</span>}
                  </div>
                  {carLabel && <div className="text-xs text-zinc-500 mt-0.5 truncate">{carLabel}</div>}
                  <div className="mt-2 flex items-center gap-1.5">
                    {u.user.avatarUrl
                      ? <img src={u.user.avatarUrl} alt={u.user.username} className="h-4 w-4 rounded-full object-cover" />
                      : <div className="h-4 w-4 rounded-full bg-zinc-800 grid place-items-center text-[7px] font-bold text-zinc-500">{u.user.username.slice(0,2).toUpperCase()}</div>}
                    <span className="text-xs text-zinc-600">@{u.user.username}</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={loaderRef} className="h-4 mt-4" />
      {loadingMore && (
        <div className="py-6 text-center text-xs text-zinc-500 animate-pulse">Loading more…</div>
      )}
      {!hasMore && spots.length > 0 && (
        <div className="py-6 text-center text-xs text-zinc-600">You're all caught up ✓</div>
      )}
    </div>
  );
}
