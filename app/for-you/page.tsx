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
          <div className="h-6 w-1 rounded-full bg-indigo-500" />
          <h1 className="text-2xl font-bold text-zinc-50">For You</h1>
          {personalised && (
            <span className="rounded-full bg-indigo-950/60 border border-indigo-800/40 px-2.5 py-0.5 text-[10px] font-medium text-indigo-400 uppercase tracking-wider">
              Personalised
            </span>
          )}
        </div>
        <a href="/feed" className="text-xs text-zinc-500 hover:text-indigo-300 transition-colors">
          Following →
        </a>
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
          <span>Sign in and start liking spots to get a personalised feed based on your favourite countries and car brands.</span>
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
              <div key={u.id} className="group relative rounded-2xl overflow-hidden border border-zinc-800/60 hover:border-indigo-700/50 hover:shadow-xl hover:shadow-indigo-950/30 transition-all">
                <a href={`/spot/${u.numericId}`} className="absolute inset-0 z-20" aria-label={u.plateText} />

                {/* Photo */}
                <div className="relative aspect-[4/5] overflow-hidden bg-zinc-950">
                  <img
                    src={u.imageUrl}
                    alt={u.plateText}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/20 to-transparent" />

                  {/* Flag */}
                  <div className="absolute top-3 right-3 z-10 rounded-lg bg-zinc-950/70 backdrop-blur border border-zinc-700/50 px-2 py-1 text-sm">
                    <Flag iso={meta.iso} />
                  </div>

                  {/* Plate + car */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                    <div className="font-mono text-base font-black tracking-widest text-white drop-shadow-lg group-hover:text-indigo-200 transition-colors leading-tight">
                      {u.plateText}
                    </div>
                    {carLabel && <div className="text-xs text-zinc-400 mt-0.5">{carLabel}</div>}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/80 border-t border-zinc-800/40">
                  <a href={`/u/${u.user.numericId}`} className="relative z-30 flex items-center gap-2 group/u">
                    {u.user.avatarUrl ? (
                      <img src={u.user.avatarUrl} alt={u.user.username} className="h-5 w-5 rounded-md object-cover" />
                    ) : (
                      <div className="h-5 w-5 rounded-md bg-zinc-800 grid place-items-center text-[8px] font-bold text-zinc-500">
                        {u.user.username.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs text-zinc-500 group-hover/u:text-indigo-300 transition-colors">@{u.user.username}</span>
                  </a>
                  <div className="flex items-center gap-2 text-xs text-zinc-600">
                    <span>♡ {u._count.likes}</span>
                    <span className="hidden sm:inline">{relativeDays(u.createdAt)}</span>
                  </div>
                </div>
              </div>
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
