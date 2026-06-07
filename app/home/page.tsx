import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

const COUNTRY_META: Record<string, { flag: string; name: string }> = {
  albania: { flag: "🇦🇱", name: "Albania" },
  germany: { flag: "🇩🇪", name: "Germany" },
  italy: { flag: "🇮🇹", name: "Italy" },
  kosovo: { flag: "🇽🇰", name: "Kosovo" },
  greece: { flag: "🇬🇷", name: "Greece" },
};

function relativeDays(d: Date) {
  const ms = Date.now() - d.getTime();
  const days = Math.max(0, Math.floor(ms / 86_400_000));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

async function getStats() {
  const [totalUploads, totalUsers, recentUploads] = await Promise.all([
    prisma.upload.count({ where: { deletedAt: null } }),
    prisma.user.count(),
    prisma.upload.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        numericId: true,
        plateText: true,
        country: true,
        imageUrl: true,
        createdAt: true,
        user: { select: { username: true, numericId: true } },
        _count: { select: { likes: true } },
      },
    }),
  ]);
  return { totalUploads, totalUsers, recentUploads };
}

export default async function HomePage() {
  const { totalUploads, totalUsers, recentUploads } = await getStats();

  return (
    <main className="mx-auto max-w-6xl px-6 pb-14 pt-6">
      {/* Hero */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Spot. Tag. Archive.
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          A community gallery for license plate spotters. Upload your finds, browse by country, and explore plate formats from around the world — without the clutter.
        </p>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Spots archived", value: totalUploads.toLocaleString() },
          { label: "Spotters", value: totalUsers.toLocaleString() },
          { label: "Countries", value: "1" },
          { label: "Plate types", value: "7+" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/30 px-4 py-5">
            <div className="text-2xl font-semibold text-zinc-100">{s.value}</div>
            <div className="mt-0.5 text-xs text-zinc-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Action cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Upload</div>
          <div className="mt-1.5 text-lg font-semibold">Spot a plate</div>
          <p className="mt-2 text-sm text-zinc-400">
            Choose a country, pick the plate type, upload a JPG or PNG — done in seconds.
          </p>
          <a href="/upload" className="mt-4 inline-flex rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-white">
            Upload a spot
          </a>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Browse</div>
          <div className="mt-1.5 text-lg font-semibold">Explore by country</div>
          <p className="mt-2 text-sm text-zinc-400">
            Browse plates by country. More filters and search coming soon.
          </p>
          <a href="/c/albania" className="mt-4 inline-flex rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900">
            🇦🇱 Browse Albania
          </a>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Rules</div>
          <div className="mt-1.5 text-lg font-semibold">Respect privacy</div>
          <p className="mt-2 text-sm text-zinc-400">
            Broad locations only — "Tirana" is fine. No street names or exact addresses. Community-first.
          </p>
          <span className="mt-4 inline-flex rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-500">
            Privacy-first ✓
          </span>
        </div>
      </div>

      {/* Recent uploads */}
      {recentUploads.length > 0 && (
        <section className="mt-12">
          <div className="flex items-baseline justify-between gap-4 mb-5">
            <h2 className="text-xl font-semibold">Recent spots</h2>
            <a href="/c/albania" className="text-sm text-zinc-400 hover:text-zinc-200">View all →</a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentUploads.map((u) => {
              const meta = COUNTRY_META[u.country] ?? { flag: "🏳️", name: u.country };
              return (
                <a key={u.id} href={`/spot/${u.numericId}`} className="group rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden hover:border-zinc-700 transition-colors">
                  <div className="aspect-video bg-zinc-950 overflow-hidden">
                    <img
                      src={u.imageUrl}
                      alt={`${u.plateText} plate`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-base font-bold tracking-widest text-zinc-100">
                        {u.plateText}
                      </span>
                      <span className="text-base">{meta.flag}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                      <a href={`/u/${u.user.numericId}`} className="hover:text-zinc-300" onClick={(e) => e.stopPropagation()}>
                        @{u.user.username}
                      </a>
                      <div className="flex items-center gap-2">
                        <span>{relativeDays(u.createdAt)}</span>
                        <span className="inline-flex items-center gap-0.5">♡ {u._count.likes}</span>
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
