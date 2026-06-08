import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

const COUNTRY_META: Record<string, { flag: string; name: string }> = {
  albania: { flag: "🇦🇱", name: "Albania" },
  germany: { flag: "🇩🇪", name: "Germany" },
  italy:   { flag: "🇮🇹", name: "Italy" },
  kosovo:  { flag: "🇽🇰", name: "Kosovo" },
  greece:  { flag: "🇬🇷", name: "Greece" },
  france:  { flag: "🇫🇷", name: "France" },
  spain:   { flag: "🇪🇸", name: "Spain" },
  austria: { flag: "🇦🇹", name: "Austria" },
  switzerland: { flag: "🇨🇭", name: "Switzerland" },
  netherlands: { flag: "🇳🇱", name: "Netherlands" },
  belgium: { flag: "🇧🇪", name: "Belgium" },
  poland:  { flag: "🇵🇱", name: "Poland" },
  czechia: { flag: "🇨🇿", name: "Czechia" },
  slovakia: { flag: "🇸🇰", name: "Slovakia" },
  hungary: { flag: "🇭🇺", name: "Hungary" },
  romania: { flag: "🇷🇴", name: "Romania" },
  serbia:  { flag: "🇷🇸", name: "Serbia" },
  croatia: { flag: "🇭🇷", name: "Croatia" },
  slovenia: { flag: "🇸🇮", name: "Slovenia" },
  "north-macedonia": { flag: "🇲🇰", name: "North Macedonia" },
  "bosnia-and-herzegovina": { flag: "🇧🇦", name: "Bosnia & Herzegovina" },
  montenegro: { flag: "🇲🇪", name: "Montenegro" },
  bulgaria: { flag: "🇧🇬", name: "Bulgaria" },
  "north macedonia": { flag: "🇲🇰", name: "North Macedonia" },
};

function countryLabel(key: string) {
  const meta = COUNTRY_META[key.toLowerCase()];
  if (meta) return meta;
  return {
    flag: "🏳️",
    name: key.charAt(0).toUpperCase() + key.slice(1),
  };
}

async function getCountriesData() {
  // Get all non-deleted, non-hidden uploads grouped by country
  const countryGroups = await prisma.upload.groupBy({
    by: ["country"],
    where: { deletedAt: null, hidden: false },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  // For each country get unique spotter count
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

  // Global leaderboard: top 10 users by upload count
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
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-zinc-50">Browse by Country</h1>
        <p className="mt-2 text-sm text-zinc-400">
          {spotterCounts.length === 0
            ? "No spots archived yet."
            : `${spotterCounts.length} countr${spotterCounts.length === 1 ? "y" : "ies"} with spots archived`}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">

        {/* ─── Country grid ─── */}
        <section>
          {spotterCounts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 px-6 py-16 text-center">
              <div className="text-4xl mb-3">🌍</div>
              <p className="text-sm text-zinc-500">No spots uploaded yet.</p>
              <a href="/upload" className="mt-4 inline-flex rounded-xl bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-white">
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
                    className="group flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 hover:border-zinc-600 hover:bg-zinc-900/70 transition-all"
                  >
                    <span className="text-3xl shrink-0">{meta.flag}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-zinc-100 group-hover:text-white truncate">{meta.name}</div>
                      <div className="mt-0.5 text-xs text-zinc-500">
                        {spotCount} spot{spotCount === 1 ? "" : "s"} · {spotterCount} spotter{spotterCount === 1 ? "" : "s"}
                      </div>
                    </div>
                    <svg
                      className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0"
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
            <div className="px-5 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-100">🏆 Top spotters</h2>
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
                      className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/40 transition-colors group"
                    >
                      {/* Rank */}
                      <span className={`w-5 text-center text-xs font-bold shrink-0 ${
                        idx === 0 ? "text-yellow-400" :
                        idx === 1 ? "text-zinc-300" :
                        idx === 2 ? "text-amber-600" :
                        "text-zinc-600"
                      }`}>
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}
                      </span>

                      {/* Avatar */}
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.username} className="h-7 w-7 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="h-7 w-7 rounded-lg bg-zinc-800 grid place-items-center text-[10px] font-bold text-zinc-400 shrink-0">
                          {u.username.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      {/* Name */}
                      <span className="flex-1 min-w-0 text-sm text-zinc-300 group-hover:text-zinc-100 truncate">
                        @{u.username}
                      </span>

                      {/* Count */}
                      <span className="text-xs text-zinc-500 font-mono shrink-0">
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
