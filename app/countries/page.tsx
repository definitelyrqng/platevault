import { prisma } from "@/app/lib/prisma";
import Flag from "@/app/components/Flag";
import { COUNTRY_META, getCountryMeta } from "@/app/lib/countries";


export const dynamic = "force-dynamic";

export const metadata = {
  title: "Browse Countries",
  description: "Browse license plates from every country in the PlateVault archive.",
  openGraph: { title: "Browse Countries · PlateVault", description: "Pick a country and explore its plates." },
};


function countryLabel(key: string) {
  const meta = COUNTRY_META[key.toLowerCase()];
  if (meta) return meta;
  return {
    iso: null,
    name: key.charAt(0).toUpperCase() + key.slice(1),
  };
}

async function getCountriesData() {
  const countryGroups = await prisma.upload.groupBy({
    by: ["country"],
    where: { deletedAt: null, hidden: false },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  const spotterCounts = await Promise.all(
    countryGroups.map(async (g) => {
      const spotters = await prisma.upload.findMany({
        where: { country: g.country, deletedAt: null, hidden: false },
        distinct: ["userId"],
        select: { userId: true },
      });
      return { country: g.country, spotCount: g._count.id, spotterCount: spotters.length };
    })
  );

  const leaderboard = await prisma.user.findMany({
    select: {
      numericId: true,
      username: true,
      avatarUrl: true,
      _count: { select: { uploads: { where: { deletedAt: null, hidden: false } } } },
    },
    orderBy: { uploads: { _count: "desc" } },
    take: 10,
  });

  return { spotterCounts, leaderboard };
}

export default async function CountriesPage() {
  const { spotterCounts, leaderboard } = await getCountriesData();

  return (
    <main className="mx-auto max-w-6xl px-6 pb-16 pt-8">

      {/* ─── Header ─── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-black text-zinc-50">Browse by Country</h1>
        </div>

        <form method="GET" action="/search" className="flex gap-2 max-w-lg mt-4">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
            <input
              name="q"
              placeholder="Search any plate globally…"
              autoComplete="off"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-indigo-700/60 focus:bg-zinc-900 transition-colors"
            />
          </div>
          <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
            Search
          </button>
        </form>
        <p className="mt-3 text-sm text-zinc-500">
          {spotterCounts.length === 0
            ? "No spots archived yet."
            : `${spotterCounts.length} countr${spotterCounts.length === 1 ? "y" : "ies"} with spots archived`}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">

        {/* ─── Country grid ─── */}
        <section>
          {spotterCounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 px-6 py-16 text-center">
              <div className="text-4xl mb-3">🌍</div>
              <p className="text-sm text-zinc-500">No spots uploaded yet.</p>
              <a href="/upload" className="mt-4 inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors">
                Be the first to upload
              </a>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {spotterCounts.map(({ country, spotCount, spotterCount }) => {
                const meta = countryLabel(country);
                return (
                  <a
                    key={country}
                    href={`/c/${country}`}
                    className="group flex items-center gap-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/50 px-5 py-4 hover:border-indigo-700/60 hover:bg-indigo-950/20 hover:shadow-lg hover:shadow-indigo-950/40 hover:-translate-y-0.5 transition-all"
                  >
                    <span className="text-3xl shrink-0 group-hover:scale-110 transition-transform duration-200"><Flag iso={meta.iso} /></span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-zinc-200 group-hover:text-indigo-200 truncate transition-colors">{meta.name}</div>
                      <div className="mt-0.5 text-xs text-zinc-500">
                        {spotCount} spot{spotCount === 1 ? "" : "s"} · {spotterCount} spotter{spotterCount === 1 ? "" : "s"}
                      </div>
                    </div>
                    <svg
                      className="h-4 w-4 text-zinc-700 group-hover:text-indigo-500 transition-colors shrink-0"
                      viewBox="0 0 20 20" fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </a>
                );
              })}
            </div>
          )}
        </section>

        {/* ─── Leaderboard sidebar ─── */}
        <aside>
          <div className="sticky top-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800 bg-gradient-to-r from-indigo-950/30 to-transparent">
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <span>🏆</span> Top spotters
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">All time, all countries</p>
            </div>
            {leaderboard.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-zinc-600">No data yet</div>
            ) : (
              <ol className="divide-y divide-zinc-800/60">
                {leaderboard.map((u, idx) => (
                  <li key={u.numericId}>
                    <a
                      href={`/u/${u.numericId}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-indigo-950/20 transition-colors group"
                    >
                      <span className={`w-5 text-center text-xs font-bold shrink-0 ${
                        idx === 0 ? "text-yellow-400" :
                        idx === 1 ? "text-zinc-300" :
                        idx === 2 ? "text-amber-600" :
                        "text-zinc-600"
                      }`}>
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}
                      </span>

                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.username} className="h-7 w-7 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="h-7 w-7 rounded-lg bg-zinc-800 grid place-items-center text-[10px] font-bold text-zinc-400 shrink-0">
                          {u.username.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <span className="flex-1 min-w-0 text-sm text-zinc-400 group-hover:text-indigo-300 truncate transition-colors">
                        @{u.username}
                      </span>

                      <span className="text-xs text-zinc-500 font-mono shrink-0 group-hover:text-indigo-400 transition-colors">
                        {u._count.uploads}
                      </span>
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
