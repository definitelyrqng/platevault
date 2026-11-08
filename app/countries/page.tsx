import { prisma } from "@/app/lib/prisma";
import Flag from "@/app/components/Flag";
import CountryTile from "@/app/components/CountryTile";
import { COUNTRY_META } from "@/app/lib/countries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Browse Countries",
  description: "Browse license plates from every country in the PlateVault archive.",
  openGraph: { title: "Browse Countries · PlateVault", description: "Pick a country and explore its plates." },
};

async function getCountriesData() {
  const visible = { deletedAt: null, hidden: false };
  const [countryGroups, pairs, covers, leaderboard] = await Promise.all([
    prisma.upload.groupBy({
      by: ["country"],
      where: visible,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    // one row per (country, spotter) → count spotters per country without N+1 queries
    prisma.upload.groupBy({ by: ["country", "userId"], where: visible }),
    prisma.upload.findMany({
      where: visible,
      orderBy: { createdAt: "desc" },
      distinct: ["country"],
      select: { country: true, imageUrl: true },
    }),
    prisma.user.findMany({
      select: {
        numericId: true,
        username: true,
        avatarUrl: true,
        _count: { select: { uploads: { where: visible } } },
      },
      orderBy: { uploads: { _count: "desc" } },
      take: 10,
    }),
  ]);

  const spotters: Record<string, number> = {};
  for (const p of pairs) spotters[p.country] = (spotters[p.country] ?? 0) + 1;
  const coverMap = Object.fromEntries(covers.map((c) => [c.country, c.imageUrl]));
  const withSpots = new Set(countryGroups.map((g) => g.country));
  const upcoming = Object.entries(COUNTRY_META)
    .filter(([key]) => !withSpots.has(key))
    .map(([key, m]) => ({ key, ...m }));

  return { countryGroups, spotters, coverMap, upcoming, leaderboard: leaderboard.filter((u) => u._count.uploads > 0) };
}

export default async function CountriesPage() {
  const { countryGroups, spotters, coverMap, upcoming, leaderboard } = await getCountriesData();
  const total = countryGroups.reduce((n, g) => n + g._count.id, 0);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">

      {/* ─── Header ─── */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800/60 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Countries</h1>
          <p className="mt-1 text-sm text-zinc-400 tabular-nums">
            {total.toLocaleString()} photos across {countryGroups.length} countr{countryGroups.length === 1 ? "y" : "ies"}
          </p>
        </div>
        <form method="GET" action="/search" role="search" className="flex w-full max-w-sm overflow-hidden rounded-lg border border-zinc-700/80 bg-zinc-900 focus-within:border-indigo-500 sm:w-auto">
          <input name="q" autoComplete="off" placeholder="Search any plate" aria-label="Search any plate"
            className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm uppercase tracking-wider text-zinc-100 outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-zinc-500 sm:w-56" />
          <button type="submit" className="bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500">Search</button>
        </form>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_280px]">

        <div className="space-y-10">
          {/* ─── Country tiles ─── */}
          {countryGroups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 px-6 py-16 text-center">
              <p className="text-sm text-zinc-500">No spots uploaded yet.</p>
              <a href="/upload" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                Be the first to upload
              </a>
            </div>
          ) : (
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {countryGroups.map((g) => (
                <CountryTile key={g.country} country={g.country} spots={g._count.id}
                  spotters={spotters[g.country] ?? 0} coverUrl={coverMap[g.country]} />
              ))}
            </section>
          )}

          {/* ─── Supported, no spots yet ─── */}
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-zinc-300">Waiting for their first spot</h2>
              <p className="mt-0.5 text-xs text-zinc-500">Supported, but nobody has archived a plate from here yet.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {upcoming.map((c) => (
                  <a key={c.key} href={`/c/${c.key}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white">
                    <Flag iso={c.iso} size="sm" /> {c.name}
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ─── Top spotters ─── */}
        <aside>
          <div className="sticky top-20 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
              <h2 className="text-sm font-semibold text-zinc-100">Top spotters</h2>
              <a href="/leaderboard" className="text-xs text-zinc-500 hover:text-white">Full board →</a>
            </div>
            {leaderboard.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-zinc-600">No data yet</div>
            ) : (
              <ol className="divide-y divide-zinc-800/60">
                {leaderboard.map((u, idx) => (
                  <li key={u.numericId}>
                    <a href={`/u/${u.numericId}`} className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-zinc-800/40">
                      <span className={`w-5 shrink-0 text-center text-xs font-bold tabular-nums ${
                        idx === 0 ? "text-amber-400" : idx === 1 ? "text-zinc-300" : idx === 2 ? "text-orange-400" : "text-zinc-600"
                      }`}>{idx + 1}</span>
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-zinc-800 text-[10px] font-bold uppercase text-zinc-400">
                          {u.username.slice(0, 2)}
                        </div>
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm text-zinc-300 group-hover:text-white">@{u.username}</span>
                      <span className="shrink-0 text-xs tabular-nums text-zinc-500">{u._count.uploads}</span>
                    </a>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
