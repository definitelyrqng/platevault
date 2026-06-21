"use client";

/** Pulsing placeholder card matching the overlay photo card style */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-2xl overflow-hidden border border-zinc-800/60 animate-pulse ${className}`}>
      <div className="aspect-[4/5] bg-zinc-900" />
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/80 border-t border-zinc-800/40">
        <div className="h-3 w-20 rounded-full bg-zinc-800" />
        <div className="h-3 w-10 rounded-full bg-zinc-800" />
      </div>
    </div>
  );
}

/** Row of N skeleton cards in a responsive grid */
export function SkeletonGrid({ count = 8, cols = "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" }: { count?: number; cols?: string }) {
  return (
    <div className={`grid gap-4 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/** Full-page skeleton for search / feed pages */
export function SkeletonFeed({ count = 8 }: { count?: number }) {
  return (
    <div className="animate-pulse space-y-6">
      {/* fake header bar */}
      <div className="h-10 w-72 rounded-xl bg-zinc-900" />
      <SkeletonGrid count={count} />
    </div>
  );
}

/** Skeleton for a single spot page */
export function SkeletonSpot() {
  return (
    <div className="animate-pulse mx-auto max-w-6xl px-4 sm:px-6 pt-6 pb-16">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Image placeholder */}
        <div className="rounded-3xl bg-zinc-900 aspect-[4/3] w-full" />
        {/* Details placeholder */}
        <div className="space-y-4">
          <div className="h-8 w-40 rounded-xl bg-zinc-900" />
          <div className="h-4 w-28 rounded-full bg-zinc-900" />
          <div className="space-y-2 pt-4">
            {[120, 80, 100, 60, 90].map((w, i) => (
              <div key={i} className="h-3 rounded-full bg-zinc-900" style={{ width: w }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
